/**
 * Script to check all migrations and tables
 * Shows which tables exist and which are missing
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Tables expected from Prisma schema
const expectedTables = [
  'users',
  'sessions',
  'client_profiles',
  'file_hashes',
  'auth_attempts',
  'ip_rules',
  'server_status',
  'server_statistics',
  'client_versions',
  'client_files',
  'game_crashes',
  'server_connection_issues',
  'launcher_errors',
  'game_launches',
  'game_sessions',
  'notifications',
  'launcher_versions'
];

// Expected columns for users table (from migrations)
const expectedUserColumns = [
  'role',      // from add_user_role.sql
  'banned',    // from add_user_ban_fields.sql
  'bannedAt',  // from add_user_ban_fields.sql
  'banReason'  // from add_user_ban_fields.sql
];

async function checkMigrations() {
  let connection;
  try {
    // Load .env
    const envPath = path.join(__dirname, '..', '.env');
    let databaseUrl = 'mysql://root:root@localhost:3306/launcher_db';
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const dbMatch = envContent.match(/DATABASE_URL=(.+)/);
      if (dbMatch) {
        databaseUrl = dbMatch[1].trim();
      }
    }

    // Parse database URL
    const url = new URL(databaseUrl);
    const config = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
    };

    console.log(`\n📊 Checking database: ${config.database}@${config.host}\n`);
    console.log('═'.repeat(60));

    connection = await mysql.createConnection(config);

    // Get all existing tables
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?",
      [config.database]
    );

    const existingTables = tables.map(t => t.TABLE_NAME.toLowerCase());

    console.log('\n📋 TABLE STATUS:\n');
    console.log('─'.repeat(60));

    const missingTables = [];
    const existingTablesList = [];

    for (const table of expectedTables) {
      const exists = existingTables.includes(table.toLowerCase());
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${table.padEnd(30)} ${exists ? 'EXISTS' : 'MISSING'}`);
      
      if (exists) {
        existingTablesList.push(table);
      } else {
        missingTables.push(table);
      }
    }

    // Check users table columns
    console.log('\n\n📋 USERS TABLE COLUMNS:\n');
    console.log('─'.repeat(60));

    if (existingTables.includes('users')) {
      const [columns] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
        [config.database]
      );

      const existingColumns = columns.map(c => c.COLUMN_NAME.toLowerCase());

      const missingColumns = [];
      for (const column of expectedUserColumns) {
        const exists = existingColumns.includes(column.toLowerCase());
        const status = exists ? '✅' : '❌';
        console.log(`${status} ${column.padEnd(20)} ${exists ? 'EXISTS' : 'MISSING'}`);
        
        if (!exists) {
          missingColumns.push(column);
        }
      }

      if (missingColumns.length > 0) {
        console.log('\n⚠️  Missing columns in users table:');
        missingColumns.forEach(col => console.log(`   - ${col}`));
      }
    } else {
      console.log('❌ users table does not exist');
    }

    // Summary
    console.log('\n\n📊 SUMMARY:\n');
    console.log('═'.repeat(60));
    console.log(`✅ Existing tables: ${existingTablesList.length}/${expectedTables.length}`);
    console.log(`❌ Missing tables: ${missingTables.length}/${expectedTables.length}`);

    if (missingTables.length > 0) {
      console.log('\n⚠️  MISSING TABLES:');
      missingTables.forEach(table => {
        console.log(`   - ${table}`);
        
        // Suggest migration file
        const migrationFiles = {
          'launcher_versions': 'add_launcher_versions_table.sql',
          'notifications': 'add_notifications_table.sql',
          'launcher_errors': 'add_launcher_errors_table.sql',
          'game_launches': 'add_statistics_tables.sql',
          'game_sessions': 'add_statistics_tables.sql',
          'server_statistics': 'add_statistics_tables.sql'
        };
        
        if (migrationFiles[table]) {
          console.log(`     → Migration: migrations/${migrationFiles[table]}`);
        }
      });
    }

    // Check migration scripts
    console.log('\n\n📝 MIGRATION SCRIPTS:\n');
    console.log('─'.repeat(60));

    const migrationScripts = {
      'add_user_role.sql': 'add_user_role.sql',
      'add_user_ban_fields.sql': 'add_user_ban_fields.sql',
      'add_notifications_table.sql': 'apply-notifications-migration.ts',
      'add_launcher_errors_table.sql': 'apply-launcher-errors-migration.ts',
      'add_statistics_tables.sql': 'apply-statistics-migration.ts',
      'add_launcher_versions_table.sql': 'apply-launcher-versions-migration.ts'
    };

    const migrationsPath = path.join(__dirname, '..', 'migrations');
    const scriptsPath = path.join(__dirname);

    for (const [migrationFile, scriptFile] of Object.entries(migrationScripts)) {
      const migrationExists = fs.existsSync(path.join(migrationsPath, migrationFile));
      const scriptExists = fs.existsSync(path.join(scriptsPath, scriptFile));
      
      const migrationStatus = migrationExists ? '✅' : '❌';
      const scriptStatus = scriptExists ? '✅' : '❌';
      
      console.log(`${migrationStatus} ${migrationFile.padEnd(35)} ${scriptStatus} ${scriptFile}`);
    }

    console.log('\n' + '═'.repeat(60) + '\n');

    await connection.end();
  } catch (error) {
    console.error('\n❌ Error checking migrations:');
    console.error(error.message);
    if (connection) {
      await connection.end().catch(() => {});
    }
    process.exit(1);
  }
}

checkMigrations();

