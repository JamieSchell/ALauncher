/**
 * Script to automatically update launcher version in database after build
 * This script reads version from package.json and updates/creates version in database
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

async function updateLauncherVersion() {
  // Check if DB update should be skipped
  if (process.env.SKIP_DB_UPDATE === 'true' || process.env.SKIP_DB_UPDATE === '1') {
    return;
  }

  let connection;
  try {
    // Read version from frontend package.json
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const version = packageJson.version || '1.0.0';

    // Only show message if not in silent mode
    if (process.env.VERBOSE_DB_ERRORS === 'true' || !process.env.SKIP_DB_UPDATE) {
      console.log(`\n📦 Updating launcher version in database: ${version}\n`);
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

    // Build download URL (API endpoint) - not used anymore but kept for database compatibility
    let downloadUrl = null;

    // Check if version already exists
    const [existing] = await connection.execute(
      'SELECT version, id FROM launcher_versions WHERE version = ?',
      [version]
    );

    if (existing && existing.length > 0) {
      // Update existing version with download URL
      await connection.execute(
        'UPDATE launcher_versions SET enabled = 1, downloadUrl = ?, updatedAt = NOW() WHERE version = ?',
        [downloadUrl, version]
      );
      console.log(`✅ Launcher version ${version} updated in database!\n`);
    } else {
      // Insert new version with download URL
      const id = uuidv4();
      await connection.execute(
        'INSERT INTO launcher_versions (id, version, downloadUrl, releaseNotes, isRequired, enabled, createdAt) VALUES (?, ?, ?, NULL, 0, 1, NOW())',
        [id, version, downloadUrl]
      );
      console.log(`✅ Launcher version ${version} added to database!\n`);
    }

    await connection.end();
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
      console.warn('⚠️  Error updating launcher version:');
      console.warn(`   ${error.message}`);
      console.warn('⚠️  Skipping database update. Build will continue.\n');
    }
    
    if (connection) {
      await connection.end().catch(() => {});
    }
    // Don't exit with error - build should continue even if DB update fails
    return;
  }
}


updateLauncherVersion();
