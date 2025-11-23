/**
 * Script to safely clean release directory before build
 * Handles EBUSY errors by retrying or skipping locked files
 */

const fs = require('fs');
const path = require('path');

function cleanReleaseDir() {
  const releaseDir = path.join(__dirname, '..', 'release');
  const targetDir = path.join(releaseDir, '@modern-launcher-frontend-win32-x64');

  if (!fs.existsSync(targetDir)) {
    console.log('📦 Release directory does not exist, skipping cleanup\n');
    return;
  }

  console.log('🧹 Cleaning release directory...');

  // Try to remove the directory with retries
  let attempts = 0;
  const maxAttempts = 5;
  const delay = 1000; // 1 second

  function tryRemove() {
    attempts++;
    
    try {
      // Try to remove files first
      if (fs.existsSync(targetDir)) {
        const files = fs.readdirSync(targetDir);
        for (const file of files) {
          const filePath = path.join(targetDir, file);
          try {
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
            } else {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            // Ignore individual file errors
            if (err.code !== 'EBUSY' && err.code !== 'ENOENT') {
              console.warn(`⚠️  Could not remove ${file}: ${err.message}`);
            }
          }
        }
      }

      // Try to remove the directory
      fs.rmSync(targetDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
      console.log('✅ Release directory cleaned successfully\n');
      return true;
    } catch (error) {
      if (error.code === 'EBUSY' || error.code === 'EPERM') {
        if (attempts < maxAttempts) {
          console.log(`⚠️  Directory is locked, retrying in ${delay}ms... (attempt ${attempts}/${maxAttempts})`);
          setTimeout(tryRemove, delay);
          return false;
        } else {
          // Last attempt failed - try to rename instead
          console.warn(`⚠️  Could not remove directory after ${maxAttempts} attempts`);
          console.warn(`⚠️  Trying to rename instead...`);
          
          try {
            const backupName = `${targetDir}.old.${Date.now()}`;
            fs.renameSync(targetDir, backupName);
            console.log(`✅ Renamed old release directory to: ${path.basename(backupName)}\n`);
            return true;
          } catch (renameError) {
            console.warn(`⚠️  Could not rename directory: ${renameError.message}`);
            console.warn(`⚠️  Build will continue, but electron-packager may fail.\n`);
            console.warn(`⚠️  Please close the launcher and try again.\n`);
            return false;
          }
        }
      } else {
        console.warn(`⚠️  Error cleaning release directory: ${error.message}\n`);
        return false;
      }
    }
  }

  // Start removal attempt
  if (!tryRemove() && attempts >= maxAttempts) {
    // If async retry is in progress, wait a bit
    return new Promise((resolve) => {
      setTimeout(() => resolve(), delay * maxAttempts);
    });
  }
}

// Run cleanup
cleanReleaseDir();

