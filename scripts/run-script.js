/**
 * Cross-platform script runner
 * Automatically detects OS and runs appropriate script
 * 
 * Features:
 * - Error handling with proper exit codes
 * - Logging for debugging
 * - Cross-platform support (Windows/Linux/macOS)
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const scriptName = process.argv[2];
const isWindows = os.platform() === 'win32';

// Logging utility
function log(message, type = 'info') {
  const prefix = {
    info: 'ℹ',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  }[type] || 'ℹ';
  
  console.log(`${prefix} ${message}`);
}

// Validate script name
if (!scriptName) {
  console.error('❌ Error: Script name is required');
  console.error('\nUsage: node run-script.js <script-name>');
  console.error('\nAvailable scripts:');
  console.error('  - dev (development mode)');
  console.error('  - prod (production build)');
  console.error('  - dev-frontend');
  console.error('  - dev-backend');
  console.error('  - prod-frontend');
  console.error('  - prod-backend');
  process.exit(1);
}

// Determine script path
const scriptPath = isWindows
  ? path.join(__dirname, `${scriptName}.bat`)
  : path.join(__dirname, `${scriptName}.sh`);

// Check if script exists
if (!fs.existsSync(scriptPath)) {
  log(`Script not found: ${scriptPath}`, 'error');
  log(`Please ensure the script file exists`, 'error');
  process.exit(1);
}

const command = isWindows
  ? scriptPath
  : 'bash';

const args = isWindows
  ? []
  : [scriptPath];

log(`Running script: ${scriptName}`, 'info');

// Spawn process for real-time output
const child = spawn(command, args, {
  stdio: 'inherit',
  shell: isWindows,
  cwd: path.join(__dirname, '..'),
});

// Error handling
child.on('error', (error) => {
  log(`Failed to start script: ${error.message}`, 'error');
  if (error.code === 'ENOENT') {
    log('Script file not found or not executable', 'error');
  }
  process.exit(1);
});

// Exit handling
child.on('exit', (code, signal) => {
  if (signal) {
    log(`Script terminated by signal: ${signal}`, 'warning');
    process.exit(1);
  } else if (code !== 0) {
    log(`Script exited with code: ${code}`, 'error');
    process.exit(code || 1);
  } else {
    log(`Script completed successfully`, 'success');
    process.exit(0);
  }
});

