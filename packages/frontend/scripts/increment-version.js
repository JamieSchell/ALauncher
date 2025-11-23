/**
 * Script to automatically increment launcher version before build
 * This script increases the patch version (1.0.0 -> 1.0.1) in package.json
 */

const fs = require('fs');
const path = require('path');

function incrementVersion(version) {
  const parts = version.split('.');
  
  if (parts.length !== 3) {
    throw new Error(`Invalid version format: ${version}. Expected format: major.minor.patch`);
  }
  
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  const patch = parseInt(parts[2], 10);
  
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    throw new Error(`Invalid version format: ${version}. All parts must be numbers.`);
  }
  
  // Increment patch version
  const newVersion = `${major}.${minor}.${patch + 1}`;
  return newVersion;
}

function updateVersion() {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    const currentVersion = packageJson.version || '1.0.0';
    const newVersion = incrementVersion(currentVersion);
    
    console.log(`\n🔄 Incrementing launcher version:`);
    console.log(`   ${currentVersion} -> ${newVersion}\n`);
    
    // Update package.json
    packageJson.version = newVersion;
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n',
      'utf-8'
    );
    
    console.log(`✅ Version updated to ${newVersion} in package.json\n`);
    
    return newVersion;
  } catch (error) {
    console.error('❌ Error incrementing version:');
    console.error(error.message);
    process.exit(1);
  }
}

updateVersion();

