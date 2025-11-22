/**
 * Script to download Minecraft client files for a specific version
 * Downloads: client.jar, libraries, assets
 */

import axios from 'axios';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { config } from '../src/config';
import { PrismaClient } from '@prisma/client';

// Get project root (go up from packages/backend/scripts/)
function getProjectRoot(): string {
  const scriptDir = __dirname; // packages/backend/scripts/
  const backendDir = path.dirname(scriptDir); // packages/backend/
  const packagesDir = path.dirname(backendDir); // packages/
  return path.dirname(packagesDir); // project root
}

const prisma = new PrismaClient();

// Minecraft API endpoints
const VERSION_MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
const RESOURCES_BASE_URL = 'https://resources.download.minecraft.net';
const LIBRARIES_BASE_URL = 'https://libraries.minecraft.net';

interface VersionManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: Array<{
    id: string;
    type: string;
    url: string;
    time: string;
    releaseTime: string;
  }>;
}

interface VersionInfo {
  id: string;
  type: string;
  mainClass: string;
  minecraftArguments?: string;
  arguments?: {
    game: Array<string | { rules?: any[]; value: string | string[] }>;
    jvm: Array<string | { rules?: any[]; value: string | string[] }>;
  };
  libraries: Array<{
    name: string;
    downloads?: {
      artifact?: {
        path: string;
        sha1: string;
        size: number;
        url: string;
      };
    };
    rules?: Array<{
      action: 'allow' | 'disallow';
      os?: {
        name?: string;
      };
    }>;
  }>;
  downloads: {
    client: {
      sha1: string;
      size: number;
      url: string;
    };
    client_mappings?: {
      sha1: string;
      size: number;
      url: string;
    };
  };
  assetIndex: {
    id: string;
    sha1: string;
    size: number;
    url: string;
    totalSize: number;
  };
  javaVersion?: {
    component: string;
    majorVersion: number;
  };
}

async function downloadFile(url: string, destPath: string, expectedSha1?: string): Promise<void> {
  // Create directory if it doesn't exist
  const dir = path.dirname(destPath);
  await fs.mkdir(dir, { recursive: true });

  // Check if file already exists and is valid
  try {
    const stats = await fs.stat(destPath);
    if (expectedSha1) {
      const fileContent = await fs.readFile(destPath);
      const hash = crypto.createHash('sha1').update(fileContent).digest('hex');
      if (hash === expectedSha1) {
        console.log(`  ✓ Already exists: ${path.basename(destPath)}`);
        return;
      }
    } else {
      // If no hash, assume it's valid if it exists
      console.log(`  ✓ Already exists: ${path.basename(destPath)}`);
      return;
    }
  } catch {
    // File doesn't exist, continue with download
  }

  console.log(`  ↓ Downloading: ${path.basename(destPath)}`);

  const response = await axios.get(url, { responseType: 'stream' });
  const writer = fsSync.createWriteStream(destPath);

  await pipeline(response.data, writer);

  // Verify SHA1 if provided
  if (expectedSha1) {
    const fileContent = await fs.readFile(destPath);
    const hash = crypto.createHash('sha1').update(fileContent).digest('hex');
    if (hash !== expectedSha1) {
      throw new Error(`SHA1 mismatch for ${destPath}. Expected ${expectedSha1}, got ${hash}`);
    }
  }

  console.log(`  ✓ Downloaded: ${path.basename(destPath)}`);
}

function shouldIncludeLibrary(lib: VersionInfo['libraries'][0]): boolean {
  // Check OS rules
  if (lib.rules) {
    let shouldInclude = false;
    for (const rule of lib.rules) {
      if (rule.action === 'allow') {
        if (!rule.os || rule.os.name === process.platform || rule.os.name === 'windows') {
          shouldInclude = true;
        }
      } else if (rule.action === 'disallow') {
        if (!rule.os || rule.os.name === process.platform || rule.os.name === 'windows') {
          return false;
        }
      }
    }
    return shouldInclude;
  }
  return true;
}

async function downloadMinecraftVersion(version: string) {
  try {
    console.log(`\n🎮 Downloading Minecraft ${version}...\n`);

    // Step 1: Get version manifest
    console.log('📋 Fetching version manifest...');
    const manifestResponse = await axios.get<VersionManifest>(VERSION_MANIFEST_URL);
    const versionEntry = manifestResponse.data.versions.find(v => v.id === version);
    
    if (!versionEntry) {
      throw new Error(`Version ${version} not found in manifest`);
    }

    console.log(`✓ Found version: ${versionEntry.id} (${versionEntry.type})`);

    // Step 2: Get version info
    console.log('\n📋 Fetching version info...');
    const versionResponse = await axios.get<VersionInfo>(versionEntry.url);
    const versionInfo = versionResponse.data;
    console.log(`✓ Main class: ${versionInfo.mainClass}`);

    // Step 3: Create directories
    // Use project root for updates directory
    const projectRoot = getProjectRoot();
    const updatesDir = path.join(projectRoot, 'updates');
    const versionDir = path.join(updatesDir, version);
    const librariesDir = path.join(versionDir, 'libraries');
    const assetsDir = path.join(updatesDir, 'assets', versionInfo.assetIndex.id);
    
    await fs.mkdir(versionDir, { recursive: true });
    await fs.mkdir(librariesDir, { recursive: true });
    await fs.mkdir(assetsDir, { recursive: true });

    // Step 4: Download client.jar
    console.log('\n📦 Downloading client.jar...');
    const clientJarPath = path.join(versionDir, 'client.jar');
    await downloadFile(
      versionInfo.downloads.client.url,
      clientJarPath,
      versionInfo.downloads.client.sha1
    );

    // Step 5: Download libraries
    console.log('\n📚 Downloading libraries...');
    let downloadedLibs = 0;
    let skippedLibs = 0;

    for (const lib of versionInfo.libraries) {
      if (!shouldIncludeLibrary(lib)) {
        skippedLibs++;
        continue;
      }

      // Download main artifact (JAR file)
      if (lib.downloads?.artifact) {
        const artifact = lib.downloads.artifact;
        const libPath = path.join(librariesDir, artifact.path);
        
        try {
          await downloadFile(artifact.url, libPath, artifact.sha1);
          downloadedLibs++;
        } catch (error: any) {
          console.error(`  ✗ Failed to download ${lib.name}: ${error.message}`);
        }
      }

      // Download native libraries (natives-windows, natives-linux, natives-macos)
      if (lib.downloads?.classifiers) {
        const platform = process.platform === 'win32' ? 'natives-windows' 
          : process.platform === 'darwin' ? 'natives-macos'
          : 'natives-linux';
        
        const nativeClassifier = lib.downloads.classifiers[platform];
        if (nativeClassifier) {
          const nativePath = path.join(librariesDir, nativeClassifier.path);
          const nativeDir = path.dirname(nativePath);
          
          try {
            // Create directory for natives
            await fs.mkdir(nativeDir, { recursive: true });
            
            // Download the native archive
            await downloadFile(nativeClassifier.url, nativePath, nativeClassifier.sha1);
            
            // Extract native files from archive if it's a ZIP
            if (nativePath.endsWith('.zip')) {
              try {
                // Import extract-zip
                const extractZip = require('extract-zip');
                const nativesSubDir = path.join(nativeDir, 'natives');
                await fs.mkdir(nativesSubDir, { recursive: true });
                await extractZip(nativePath, { dir: nativesSubDir });
                console.log(`  ✓ Extracted natives to ${nativesSubDir}`);
              } catch (extractError: any) {
                console.warn(`  ⚠ Could not extract natives: ${extractError.message}`);
                console.warn(`     Native archive saved at: ${nativePath}`);
                console.warn(`     Install extract-zip: npm install extract-zip`);
              }
            } else if (nativePath.endsWith('.jar')) {
              // JAR files are ZIP archives - extract natives from them
              try {
                const extractZip = require('extract-zip');
                const nativesSubDir = path.join(nativeDir, 'natives');
                await fs.mkdir(nativesSubDir, { recursive: true });
                await extractZip(nativePath, { dir: nativesSubDir });
                console.log(`  ✓ Extracted natives from JAR to ${nativesSubDir}`);
              } catch (extractError: any) {
                console.warn(`  ⚠ Could not extract natives from JAR: ${extractError.message}`);
                console.warn(`     Native JAR saved at: ${nativePath}`);
              }
            }
            
            downloadedLibs++;
          } catch (error: any) {
            console.error(`  ✗ Failed to download/extract natives for ${lib.name}: ${error.message}`);
          }
        }
      }
    }

    console.log(`\n✓ Libraries: ${downloadedLibs} downloaded, ${skippedLibs} skipped`);

    // Step 6: Download asset index
    console.log('\n🎨 Downloading asset index...');
    const assetIndexPath = path.join(assetsDir, 'index.json');
    await downloadFile(
      versionInfo.assetIndex.url,
      assetIndexPath,
      versionInfo.assetIndex.sha1
    );

    // Step 7: Download assets
    console.log('\n🎨 Downloading assets...');
    const assetIndexContent = await fs.readFile(assetIndexPath, 'utf-8');
    const assetIndex = JSON.parse(assetIndexContent);
    
    let downloadedAssets = 0;
    const objects = assetIndex.objects || {};

    for (const [assetPath, assetInfo] of Object.entries(objects)) {
      const asset = assetInfo as any;
      const hash = asset.hash;
      const hashPrefix = hash.substring(0, 2);
      const assetUrl = `${RESOURCES_BASE_URL}/${hashPrefix}/${hash}`;
      const assetFilePath = path.join(assetsDir, 'objects', hashPrefix, hash);

      try {
        await downloadFile(assetUrl, assetFilePath);
        downloadedAssets++;
        
        if (downloadedAssets % 100 === 0) {
          console.log(`  Progress: ${downloadedAssets} assets downloaded...`);
        }
      } catch (error: any) {
        console.error(`  ✗ Failed to download asset ${assetPath}: ${error.message}`);
      }
    }

    console.log(`\n✓ Assets: ${downloadedAssets} downloaded`);

    // Step 8: Save version info for reference
    const versionInfoPath = path.join(versionDir, 'version.json');
    await fs.writeFile(versionInfoPath, JSON.stringify(versionInfo, null, 2));

    console.log('\n✅ Minecraft version downloaded successfully!');
    console.log(`\n📁 Files location:`);
    console.log(`   Client: ${versionDir}/client.jar`);
    console.log(`   Libraries: ${versionDir}/libraries/`);
    console.log(`   Assets: ${assetsDir}/`);

    // Update profile if it exists
    const profile = await prisma.clientProfile.findFirst({
      where: { version },
    });

    if (profile) {
      console.log(`\n💡 Profile "${profile.title}" (${profile.id}) is ready to use!`);
    }

  } catch (error: any) {
    console.error('\n❌ Error downloading Minecraft version:');
    console.error(error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   URL: ${error.response.config?.url}`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get version from command line argument or use default
const version = process.argv[2] || '1.20.4';

downloadMinecraftVersion(version);

