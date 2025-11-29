/**
 * Cross-platform script runner
 * Automatically detects OS and runs appropriate script
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const scriptName = process.argv[2];
const isWindows = os.platform() === 'win32';

if (!scriptName) {
  console.error('Usage: node run-script.js <script-name>');
  process.exit(1);
}

const scriptPath = isWindows
  ? path.join(__dirname, `${scriptName}.bat`)
  : path.join(__dirname, `${scriptName}.sh`);

const command = isWindows
  ? scriptPath
  : 'bash';

const args = isWindows
  ? []
  : [scriptPath];

// Spawn process for real-time output
const child = spawn(command, args, {
  stdio: 'inherit',
  shell: isWindows,
  cwd: path.join(__dirname, '..'),
});

child.on('error', (error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

