/**
 * Pre-build script for installer
 * Ensures .env.prod is used before building
 * 
 * Features:
 * - Error handling with proper exit codes
 * - Logging for debugging
 * - Environment variable support
 */

const fs = require('fs');
const path = require('path');

// Logging utility
function log(message, type = 'info') {
  const prefix = {
    info: 'ℹ',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  }[type] || 'ℹ';
  
  console.log(`[Pre-Build] ${prefix} ${message}`);
}

// Error handler
function handleError(error, context) {
  log(`Error in ${context}: ${error.message}`, 'error');
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}

// Main function
function setupEnvironment() {
  try {
    const frontendDir = path.join(__dirname, '..');
    const envProdPath = path.join(frontendDir, '.env.prod');
    const envPath = path.join(frontendDir, '.env');

    log('Setting up environment for production build...', 'info');

    // Get API URL from environment or use default
    const apiUrl = process.env.VITE_API_URL || process.env.PROD_API_URL || 'http://localhost:7240';
    const wsUrl = process.env.VITE_WS_URL || process.env.PROD_WS_URL || 'ws://localhost/ws';

    // Ensure .env.prod exists
    if (!fs.existsSync(envProdPath)) {
      log('.env.prod not found, creating from environment variables', 'warning');
      const defaultEnvProd = `VITE_API_URL=${apiUrl}
VITE_WS_URL=${wsUrl}
`;
      try {
        fs.writeFileSync(envProdPath, defaultEnvProd, 'utf8');
        log('Created .env.prod file', 'success');
      } catch (error) {
        handleError(error, 'creating .env.prod');
      }
    }

    // Copy .env.prod to .env
    if (fs.existsSync(envProdPath)) {
      try {
        const envProdContent = fs.readFileSync(envProdPath, 'utf8');
        fs.writeFileSync(envPath, envProdContent, 'utf8');
        log('Copied .env.prod to .env', 'success');
        
        // Verify content
        const viteApiUrl = envProdContent.split('\n').find(line => line.startsWith('VITE_API_URL'));
        if (viteApiUrl) {
          log(`Configuration: ${viteApiUrl.trim()}`, 'info');
        } else {
          log('VITE_API_URL not found in .env.prod', 'warning');
        }
      } catch (error) {
        handleError(error, 'copying .env.prod to .env');
      }
    } else {
      log('.env.prod file not found!', 'error');
      log('Please create .env.prod with VITE_API_URL and VITE_WS_URL', 'error');
      process.exit(1);
    }

    // Create build directory if it doesn't exist
    const buildDir = path.join(frontendDir, 'build');
    if (!fs.existsSync(buildDir)) {
      try {
        fs.mkdirSync(buildDir, { recursive: true });
        log('Created build directory', 'success');
      } catch (error) {
        handleError(error, 'creating build directory');
      }
    }

    log('Environment ready for build', 'success');
  } catch (error) {
    handleError(error, 'setupEnvironment');
  }
}

// Run setup
setupEnvironment();

