/**
 * Complete Launcher Update Script
 * Автоматически находит установщик, вычисляет хеш и обновляет БД
 * 
 * Usage:
 *   node scripts/update-launcher-full.js [options]
 * 
 * Options:
 *   --version <version>        Версия лаунчера (по умолчанию из package.json)
 *   --url <downloadUrl>        URL для скачивания (обязательно)
 *   --release-notes <text>    Заметки о релизе
 *   --required                 Сделать обновление обязательным
 *   --auto-find                Автоматически найти файл в release/ и вычислить хеш
 *   --file <path>              Путь к файлу установщика (для вычисления хеша)
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    version: null,
    url: null,
    releaseNotes: null,
    isRequired: false,
    autoFind: false,
    file: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--version':
        options.version = nextArg;
        i++;
        break;
      case '--url':
        options.url = nextArg;
        i++;
        break;
      case '--release-notes':
        options.releaseNotes = nextArg;
        i++;
        break;
      case '--required':
        options.isRequired = true;
        break;
      case '--auto-find':
        options.autoFind = true;
        break;
      case '--file':
        options.file = nextArg;
        i++;
        break;
      case '--help':
      case '-h':
        console.log(`
📦 Launcher Update Script

Usage:
  node scripts/update-launcher-full.js [options]

Options:
  --version <version>        Версия лаунчера (по умолчанию из package.json)
  --url <downloadUrl>        URL для скачивания (обязательно)
  --release-notes <text>     Заметки о релизе
  --required                 Сделать обновление обязательным
  --auto-find                Автоматически найти файл в release/ и вычислить хеш
  --file <path>              Путь к файлу установщика (для вычисления хеша)
  --help, -h                 Показать эту справку

Examples:
  # Автоматический режим (найти файл, вычислить хеш)
  node scripts/update-launcher-full.js --url https://example.com/launcher-1.0.133-Setup.exe --auto-find

  # С указанием файла для вычисления хеша
  node scripts/update-launcher-full.js --url https://example.com/launcher.exe --file release/launcher-1.0.133-Setup.exe

  # С заметками о релизе
  node scripts/update-launcher-full.js --url https://example.com/launcher.exe --auto-find --release-notes "Исправлены баги"

  # Обязательное обновление
  node scripts/update-launcher-full.js --url https://example.com/launcher.exe --auto-find --required
        `);
        process.exit(0);
    }
  }

  return options;
}

/**
 * Вычисляет SHA-256 хеш файла
 */
function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Находит файл установщика в папке release
 */
function findInstallerFile(releaseDir, version) {
  const patterns = [
    // Windows
    `Modern Launcher-${version}-Setup.exe`,
    `Modern Launcher-${version}-portable.exe`,
    // macOS
    `Modern Launcher-${version}.dmg`,
    `Modern Launcher-${version}.zip`,
    // Linux
    `Modern Launcher-${version}.AppImage`,
    `Modern Launcher-${version}.deb`,
    // Общие паттерны
    `*${version}*.exe`,
    `*${version}*.dmg`,
    `*${version}*.AppImage`,
  ];

  if (!fs.existsSync(releaseDir)) {
    return null;
  }

  const files = fs.readdirSync(releaseDir);
  
  // Сначала ищем точные совпадения
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      // Glob pattern
      const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\./g, '\\.'));
      const match = files.find(f => regex.test(f));
      if (match) {
        return path.join(releaseDir, match);
      }
    } else {
      // Exact match
      if (files.includes(pattern)) {
        return path.join(releaseDir, pattern);
      }
    }
  }

  // Если не нашли, ищем любой установщик
  const installerExtensions = ['.exe', '.dmg', '.AppImage', '.deb'];
  for (const file of files) {
    const ext = path.extname(file);
    if (installerExtensions.includes(ext) && !file.includes('blockmap')) {
      return path.join(releaseDir, file);
    }
  }

  return null;
}

/**
 * Получает размер файла
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return BigInt(stats.size);
}

/**
 * Загружает конфигурацию БД из .env
 */
function loadDatabaseConfig() {
  const backendPath = path.join(__dirname, '..', '..', 'backend');
  const backendEnvPath = path.join(backendPath, '.env');
  
  let databaseUrl = process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/launcher_db';
  
  if (fs.existsSync(backendEnvPath)) {
    const envContent = fs.readFileSync(backendEnvPath, 'utf-8');
    const dbMatch = envContent.match(/^DATABASE_URL\s*=\s*(.+)$/m);
    if (dbMatch) {
      databaseUrl = dbMatch[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  try {
    const url = new URL(databaseUrl);
    const password = decodeURIComponent(url.password || '');
    return {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: decodeURIComponent(url.username || ''),
      password: password,
      database: url.pathname.slice(1),
      connectTimeout: 10000,
    };
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${databaseUrl}`);
  }
}

async function updateLauncherVersion() {
  const options = parseArgs();

  // Проверка обязательных параметров
  if (!options.url) {
    console.error('❌ Error: --url is required');
    console.error('\n📖 Quick start:');
    console.error('   npm run update-launcher -- --url https://example.com/launcher.exe --auto-find');
    console.error('\n   Or use --help for full documentation');
    process.exit(1);
  }

  // Получить версию из package.json если не указана
  if (!options.version) {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    options.version = packageJson.version || '1.0.0';
  }

  console.log(`\n📦 Updating launcher version: ${options.version}\n`);

  let fileHash = null;
  let fileSize = null;
  let installerFile = null;

  // Автоматический поиск файла
  if (options.autoFind) {
    const releaseDir = path.join(__dirname, '..', 'release');
    installerFile = findInstallerFile(releaseDir, options.version);
    
    if (installerFile) {
      console.log(`✅ Found installer: ${path.basename(installerFile)}`);
    } else {
      console.warn(`⚠️  Installer file not found in release/ for version ${options.version}`);
      console.warn('   Skipping hash calculation. You can specify --file manually.');
    }
  } else if (options.file) {
    installerFile = path.isAbsolute(options.file) 
      ? options.file 
      : path.join(__dirname, '..', options.file);
  }

  // Вычисление хеша и размера
  if (installerFile && fs.existsSync(installerFile)) {
    console.log('📊 Calculating file hash...');
    try {
      fileHash = await calculateFileHash(installerFile);
      fileSize = getFileSize(installerFile);
      console.log(`✅ Hash: ${fileHash.substring(0, 16)}...`);
      console.log(`✅ Size: ${(Number(fileSize) / (1024 * 1024)).toFixed(2)} MB`);
    } catch (error) {
      console.warn(`⚠️  Error calculating hash: ${error.message}`);
      console.warn('   Continuing without hash...');
    }
  }

  // Подключение к БД
  let connection;
  try {
    const config = loadDatabaseConfig();
    console.log(`🔌 Connecting to database: ${config.user}@${config.host}:${config.port}/${config.database}`);
    
    connection = await Promise.race([
      mysql.createConnection(config),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]);

    // Проверка существования версии
    const [existing] = await connection.execute(
      'SELECT id FROM launcher_versions WHERE version = ?',
      [options.version]
    );

    if (existing && existing.length > 0) {
      // Обновление существующей версии
      const updateQuery = `
        UPDATE launcher_versions 
        SET downloadUrl = ?,
            fileHash = ?,
            fileSize = ?,
            releaseNotes = ?,
            isRequired = ?,
            enabled = 1,
            updatedAt = NOW()
        WHERE version = ?
      `;
      
      await connection.execute(updateQuery, [
        options.url,
        fileHash,
        fileSize,
        options.releaseNotes || null,
        options.isRequired ? 1 : 0,
        options.version,
      ]);

      console.log(`✅ Launcher version ${options.version} updated in database!`);
    } else {
      // Вставка новой версии
      const id = uuidv4();
      const insertQuery = `
        INSERT INTO launcher_versions 
        (id, version, downloadUrl, fileHash, fileSize, releaseNotes, isRequired, enabled, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())
      `;
      
      await connection.execute(insertQuery, [
        id,
        options.version,
        options.url,
        fileHash,
        fileSize,
        options.releaseNotes || null,
        options.isRequired ? 1 : 0,
      ]);

      console.log(`✅ Launcher version ${options.version} added to database!`);
    }

    await connection.end();
    console.log('\n✨ Done!\n');
  } catch (error) {
    console.error('\n❌ Error updating launcher version:');
    console.error(`   ${error.message}\n`);
    
    if (connection) {
      await connection.end().catch(() => {});
    }
    process.exit(1);
  }
}

// Запуск скрипта
updateLauncherVersion().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

