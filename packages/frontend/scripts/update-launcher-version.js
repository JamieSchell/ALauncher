/**
 * Script to automatically update launcher version in database after build
 * This script reads version from package.json and updates/creates version in database
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Use built-in crypto.randomUUID() for Node.js 18+
const uuidv4 = () => crypto.randomUUID();

// Lock file to prevent double execution
const lockFile = path.join(__dirname, '.update-version.lock');

async function updateLauncherVersion() {
  // Check if script is already running (prevent double execution)
  if (fs.existsSync(lockFile)) {
    const lockContent = fs.readFileSync(lockFile, 'utf-8');
    const lockTime = parseInt(lockContent, 10);
    const now = Date.now();
    
    // If lock is older than 30 seconds, remove it (stale lock)
    if (now - lockTime > 30000) {
      fs.unlinkSync(lockFile);
    } else {
      console.log('⚠️  Version update already in progress, skipping...');
      return;
    }
  }
  
  // Create lock file
  fs.writeFileSync(lockFile, Date.now().toString(), 'utf-8');
  
  // Cleanup lock file on exit
  const cleanup = () => {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  };
  
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  // Check if DB update should be skipped
  if (process.env.SKIP_DB_UPDATE === 'true' || process.env.SKIP_DB_UPDATE === '1') {
    console.log('⚠️  Database update skipped (SKIP_DB_UPDATE is set)');
    return;
  }
  
  // This script should only run after successful build
  // If called, it means build was successful

  let connection;
  try {
    // Read version from frontend package.json
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const version = packageJson.version || '1.0.0';

    // Only show message if not in silent mode
    if (process.env.VERBOSE_DB_ERRORS === 'true' || !process.env.SKIP_DB_UPDATE) {
      console.log(`📦 Updating launcher version in database: ${version}`);
    }

    // Load .env from backend
    const backendPath = path.join(__dirname, '..', '..', 'backend');
    const backendEnvPath = path.join(backendPath, '.env');
    
    let databaseUrl = process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/launcher_db';
    
    if (fs.existsSync(backendEnvPath)) {
      const envContent = fs.readFileSync(backendEnvPath, 'utf-8');
      // Match DATABASE_URL, handling quoted and unquoted values
      const dbMatch = envContent.match(/^DATABASE_URL\s*=\s*(.+)$/m);
      if (dbMatch) {
        databaseUrl = dbMatch[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
      }
    }
    

    // Parse database URL
    let config;
    try {
      const url = new URL(databaseUrl);
      // Decode password in case it contains special characters
      const password = decodeURIComponent(url.password || '');
      config = {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: decodeURIComponent(url.username || ''),
        password: password,
        database: url.pathname.slice(1), // Remove leading /
        connectTimeout: 5000,
      };
    } catch (urlError) {
      console.warn(`⚠️  Invalid DATABASE_URL format: ${databaseUrl}`);
      console.warn('⚠️  Skipping database update. Build will continue.\n');
      return;
    }

    // Try to connect with timeout (silent mode for access denied errors)
    if (process.env.VERBOSE_DB_ERRORS === 'true') {
      console.log(`🔌 Connecting to database: ${config.user}@${config.host}:${config.port}/${config.database}`);
    }
    
    connection = await Promise.race([
      mysql.createConnection(config),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      )
    ]);

    // Get API URL from backend .env or use default
    let apiUrl = process.env.API_URL || 'http://5.188.119.206:7240';
    if (fs.existsSync(backendEnvPath)) {
      const envContent = fs.readFileSync(backendEnvPath, 'utf-8');
      const apiMatch = envContent.match(/^API_URL\s*=\s*(.+)$/m) || envContent.match(/^VITE_API_URL\s*=\s*(.+)$/m);
      if (apiMatch) {
        apiUrl = apiMatch[1].trim().replace(/^["']|["']$/g, '');
      }
    }

    // Build download URL (API endpoint for downloading launcher update)
    let downloadUrl = `${apiUrl}/api/launcher/download/${version}`;
    
    // Try to find the actual file and calculate hash/size
    let fileHash = null;
    let fileSize = null;
    const releaseDir = path.join(__dirname, '..', 'release');
    const possibleFileNames = [
      `Modern Launcher-${version}-portable.exe`,
      `Modern-Launcher-${version}-portable.exe`,
      `launcher-${version}-portable.exe`,
      `Modern Launcher-${version}.exe`,
      `Modern-Launcher-${version}.exe`,
    ];

    for (const fileName of possibleFileNames) {
      const filePath = path.join(releaseDir, fileName);
      if (fs.existsSync(filePath)) {
        try {
          // Calculate file hash
          const fileContent = fs.readFileSync(filePath);
          fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
          fileSize = BigInt(fileContent.length);
          break;
        } catch (err) {
          // File exists but can't read it, continue
        }
      }
    }

    // Check if version already exists
    const [existing] = await connection.execute(
      'SELECT version, id FROM launcher_versions WHERE version = ?',
      [version]
    );

    if (existing && existing.length > 0) {
      // Version already exists - update downloadUrl, fileHash, fileSize, and timestamp
      await connection.execute(
        'UPDATE launcher_versions SET enabled = 1, downloadUrl = ?, fileHash = ?, fileSize = ?, updatedAt = NOW() WHERE version = ?',
        [downloadUrl, fileHash, fileSize, version]
      );
      console.log(`✅ Launcher version ${version} updated in database!`);
      if (fileHash) {
        console.log(`   Download URL: ${downloadUrl}`);
        console.log(`   File Hash: ${fileHash}`);
        console.log(`   File Size: ${fileSize ? fileSize.toString() : 'N/A'} bytes`);
      }
    } else {
      // Insert new version with download URL, hash, and size
      const id = uuidv4();
      await connection.execute(
        'INSERT INTO launcher_versions (id, version, downloadUrl, fileHash, fileSize, releaseNotes, isRequired, enabled, createdAt) VALUES (?, ?, ?, ?, ?, NULL, 0, 1, NOW())',
        [id, version, downloadUrl, fileHash, fileSize]
      );
      console.log(`✅ Launcher version ${version} added to database!`);
      if (fileHash) {
        console.log(`   Download URL: ${downloadUrl}`);
        console.log(`   File Hash: ${fileHash}`);
        console.log(`   File Size: ${fileSize ? fileSize.toString() : 'N/A'} bytes`);
      }
    }

    await connection.end();
    
    // Remove lock file on success
    cleanup();
  } catch (error) {
    // Check error type
    const isAccessDenied = error.message && (
      error.message.includes('Access denied') ||
      error.message.includes('ER_ACCESS_DENIED_ERROR') ||
      error.code === 'ER_ACCESS_DENIED_ERROR'
    );
    
    const isConnectionError = error.message && (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('Connection timeout') ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT'
    );

    if (isAccessDenied) {
      // Silent fail for access denied - this is expected in some deployment scenarios
      // User can set SKIP_DB_UPDATE=true to suppress this completely
      if (process.env.VERBOSE_DB_ERRORS === 'true') {
        console.warn('⚠️  Database access denied:');
        console.warn(`   ${error.message}`);
        console.warn('⚠️  Skipping database update. Build will continue.');
        console.warn('⚠️  Set SKIP_DB_UPDATE=true to suppress this message.\n');
      }
      // Silent return - no error output
      return;
    } else if (isConnectionError) {
      // Silent fail for connection errors in production builds
      if (process.env.VERBOSE_DB_ERRORS === 'true') {
        console.warn('⚠️  Cannot connect to database:');
        console.warn(`   ${error.message}`);
        console.warn('⚠️  Skipping database update. Build will continue.\n');
      }
      return;
    } else {
      // Only show unexpected errors
      console.error('❌ Error updating launcher version:');
      console.error(`   ${error.message}`);
      console.error('⚠️  Build completed, but database update failed.');
      console.error('⚠️  You may need to update version manually in database.\n');
    }
    
    if (connection) {
      await connection.end().catch(() => {});
    }
    
    // Remove lock file on error
    cleanup();
    
    // Don't exit with error - build was successful, DB update is optional
    // But log the error so user knows about it
    return;
  }
}


updateLauncherVersion();
