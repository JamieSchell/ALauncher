/**
 * Pre-build script for installer
 * Ensures .env.prod is used before building
 */

const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '..');
const envProdPath = path.join(frontendDir, '.env.prod');
const envPath = path.join(frontendDir, '.env');

console.log('[Pre-Build] Setting up environment for production build...');

// Ensure .env.prod exists
if (!fs.existsSync(envProdPath)) {
  const defaultEnvProd = `VITE_API_URL=http://5.188.119.206:7240
VITE_WS_URL=ws://5.188.119.206/ws
`;
  fs.writeFileSync(envProdPath, defaultEnvProd, 'utf8');
  console.log('[Pre-Build] ✅ Created .env.prod file');
}

// Copy .env.prod to .env
if (fs.existsSync(envProdPath)) {
  const envProdContent = fs.readFileSync(envProdPath, 'utf8');
  fs.writeFileSync(envPath, envProdContent, 'utf8');
  console.log('[Pre-Build] ✅ Copied .env.prod to .env');
  
  // Verify content
  const viteApiUrl = envProdContent.split('\n').find(line => line.startsWith('VITE_API_URL'));
  if (viteApiUrl) {
    console.log(`[Pre-Build] 📋 ${viteApiUrl.trim()}`);
  } else {
    console.warn('[Pre-Build] ⚠️  VITE_API_URL not found in .env.prod');
  }
} else {
  console.error('[Pre-Build] ❌ .env.prod file not found!');
  process.exit(1);
}

// Create build directory if it doesn't exist
const buildDir = path.join(frontendDir, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('[Pre-Build] ✅ Created build directory');
}

console.log('[Pre-Build] ✅ Environment ready for build');

