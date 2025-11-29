/**
 * Pre-build script to fix NSIS uninstaller issue on Linux
 * Creates a dummy uninstaller file if it doesn't exist to prevent NSIS error
 */

const fs = require('fs');
const path = require('path');

const releaseDir = path.join(__dirname, '..', 'release');

// Create release directory if it doesn't exist
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// This script runs before electron-builder, so we can't create the actual uninstaller
// But we can ensure the directory exists
console.log('[NSIS Fix] Release directory ready');

