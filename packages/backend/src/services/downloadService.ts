/**
 * Download Service - Handles Minecraft file downloads with progress tracking
 */

import axios from 'axios';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { config } from '../config';
import { UpdateProgress } from '@modern-launcher/shared';

const VERSION_MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
const RESOURCES_BASE_URL = 'https://resources.download.minecraft.net';
const LIBRARIES_BASE_URL = 'https://libraries.minecraft.net';

interface VersionManifest {
  latest: { release: string; snapshot: string };
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
  libraries: Array<{
    name: string;
    downloads?: {
      artifact?: { path: string; sha1: string; size: number; url: string };
      classifiers?: {
        'natives-windows'?: { path: string; sha1: string; size: number; url: string };
        'natives-linux'?: { path: string; sha1: string; size: number; url: string };
        'natives-macos'?: { path: string; sha1: string; size: number; url: string };
      };
    };
    rules?: Array<{
      action: 'allow' | 'disallow';
      os?: { name?: string };
    }>;
  }>;
  downloads: {
    client: { sha1: string; size: number; url: string };
  };
  assetIndex: {
    id: string;
    sha1: string;
    size: number;
    url: string;
    totalSize: number;
  };
}

type ProgressCallback = (progress: UpdateProgress) => void;

function getProjectRoot(): string {
  const scriptDir = __dirname; // packages/backend/src/services/
  const srcDir = path.dirname(scriptDir); // packages/backend/src/
  const backendDir = path.dirname(srcDir); // packages/backend/
  const packagesDir = path.dirname(backendDir); // packages/
  return path.dirname(packagesDir); // project root
}

function shouldIncludeLibrary(lib: VersionInfo['libraries'][0]): boolean {
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

async function downloadFileWithProgress(
  url: string,
  destPath: string,
  expectedSha1: string | undefined,
  onProgress?: (bytesDownloaded: number, totalBytes: number) => void
): Promise<void> {
  const dir = path.dirname(destPath);
  await fs.mkdir(dir, { recursive: true });

  // Check if file already exists and is valid
  try {
    const stats = await fs.stat(destPath);
    if (expectedSha1) {
      const fileContent = await fs.readFile(destPath);
      const hash = crypto.createHash('sha1').update(fileContent).digest('hex');
      if (hash === expectedSha1) {
        if (onProgress) {
          const totalBytes = stats.size;
          onProgress(totalBytes, totalBytes);
        }
        return;
      }
    } else {
      if (onProgress) {
        const totalBytes = stats.size;
        onProgress(totalBytes, totalBytes);
      }
      return;
    }
  } catch {
    // File doesn't exist, continue with download
  }

  const response = await axios.get(url, { 
    responseType: 'stream',
  });
  
  const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
  let downloadedBytes = 0;

  const writer = fsSync.createWriteStream(destPath);
  
  response.data.on('data', (chunk: Buffer) => {
    downloadedBytes += chunk.length;
    if (onProgress && totalBytes > 0) {
      onProgress(downloadedBytes, totalBytes);
    }
  });

  await pipeline(response.data, writer);

  // Verify SHA1 if provided
  if (expectedSha1) {
    const fileContent = await fs.readFile(destPath);
    const hash = crypto.createHash('sha1').update(fileContent).digest('hex');
    if (hash !== expectedSha1) {
      throw new Error(`SHA1 mismatch for ${destPath}`);
    }
  }
}

export class DownloadService {
  static async downloadMinecraftVersion(
    version: string,
    onProgress: ProgressCallback
  ): Promise<void> {
    const projectRoot = getProjectRoot();
    const updatesDir = path.join(projectRoot, 'updates');
    const versionDir = path.join(updatesDir, version);
    const librariesDir = path.join(versionDir, 'libraries');
    
    let totalFiles = 0;
    let downloadedFiles = 0;
    let currentStage: UpdateProgress['stage'] = 'downloading';

    // Step 1: Get version manifest
    onProgress({
      profileId: version,
      stage: 'downloading',
      progress: 0,
      currentFile: 'Fetching version manifest...',
      totalFiles: 0,
      downloadedFiles: 0,
    });

    const manifestResponse = await axios.get<VersionManifest>(VERSION_MANIFEST_URL);
    const versionEntry = manifestResponse.data.versions.find(v => v.id === version);
    
    if (!versionEntry) {
      throw new Error(`Version ${version} not found`);
    }

    // Step 2: Get version info
    onProgress({
      profileId: version,
      stage: 'downloading',
      progress: 5,
      currentFile: 'Fetching version info...',
      totalFiles: 0,
      downloadedFiles: 0,
    });

    const versionResponse = await axios.get<VersionInfo>(versionEntry.url);
    const versionInfo = versionResponse.data;

    // Calculate total files
    totalFiles = 1; // client.jar
    for (const lib of versionInfo.libraries) {
      if (shouldIncludeLibrary(lib) && lib.downloads?.artifact) {
        totalFiles++;
        if (lib.downloads.classifiers) {
          const platform = process.platform === 'win32' ? 'natives-windows' 
            : process.platform === 'darwin' ? 'natives-macos'
            : 'natives-linux';
          if (lib.downloads.classifiers[platform]) {
            totalFiles++;
          }
        }
      }
    }
    // Assets will be counted separately

    // Step 3: Download client.jar
    onProgress({
      profileId: version,
      stage: 'downloading',
      progress: 10,
      currentFile: 'client.jar',
      totalFiles,
      downloadedFiles,
    });

    const clientJarPath = path.join(versionDir, 'client.jar');
    await downloadFileWithProgress(
      versionInfo.downloads.client.url,
      clientJarPath,
      versionInfo.downloads.client.sha1,
      (downloaded, total) => {
        const fileProgress = (downloaded / total) * 100;
        onProgress({
          profileId: version,
          stage: 'downloading',
          progress: 10 + (fileProgress * 0.1),
          currentFile: 'client.jar',
          totalFiles,
          downloadedFiles,
        });
      }
    );
    downloadedFiles++;

    // Step 4: Download libraries
    const librariesToDownload = versionInfo.libraries.filter(
      lib => shouldIncludeLibrary(lib) && lib.downloads?.artifact
    );

    for (let i = 0; i < librariesToDownload.length; i++) {
      const lib = librariesToDownload[i];
      const artifact = lib.downloads!.artifact!;
      const libPath = path.join(librariesDir, artifact.path);
      
      const libProgress = 20 + ((i / librariesToDownload.length) * 30);
      
      onProgress({
        profileId: version,
        stage: 'downloading',
        progress: libProgress,
        currentFile: path.basename(artifact.path),
        totalFiles,
        downloadedFiles,
      });

      try {
        await downloadFileWithProgress(
          artifact.url,
          libPath,
          artifact.sha1,
          (downloaded, total) => {
            const fileProgress = (downloaded / total) * 100;
            const overallProgress = libProgress + ((fileProgress / librariesToDownload.length) * 30);
            onProgress({
              profileId: version,
              stage: 'downloading',
              progress: overallProgress,
              currentFile: path.basename(artifact.path),
              totalFiles,
              downloadedFiles,
            });
          }
        );
        downloadedFiles++;

        // Download native libraries
        if (lib.downloads?.classifiers) {
          const platform = process.platform === 'win32' ? 'natives-windows' 
            : process.platform === 'darwin' ? 'natives-macos'
            : 'natives-linux';
          
          const nativeClassifier = lib.downloads.classifiers[platform];
          if (nativeClassifier) {
            const nativePath = path.join(librariesDir, nativeClassifier.path);
            await downloadFileWithProgress(
              nativeClassifier.url,
              nativePath,
              nativeClassifier.sha1,
              () => {} // Native progress included in library progress
            );
            
            // Extract natives if needed
            if (nativePath.endsWith('.jar')) {
              try {
                const extractZip = require('extract-zip');
                const nativesSubDir = path.join(path.dirname(nativePath), 'natives');
                await fs.mkdir(nativesSubDir, { recursive: true });
                await extractZip(nativePath, { dir: nativesSubDir });
              } catch (error) {
                console.warn(`Could not extract natives: ${error}`);
              }
            }
          }
        }
      } catch (error: any) {
        console.error(`Failed to download ${lib.name}: ${error.message}`);
      }
    }

    // Step 5: Download asset index
    onProgress({
      profileId: version,
      stage: 'downloading',
      progress: 50,
      currentFile: 'Asset index',
      totalFiles,
      downloadedFiles,
    });

    const assetsDir = path.join(updatesDir, 'assets', versionInfo.assetIndex.id);
    await fs.mkdir(assetsDir, { recursive: true });
    const assetIndexPath = path.join(assetsDir, 'index.json');
    await downloadFileWithProgress(
      versionInfo.assetIndex.url,
      assetIndexPath,
      versionInfo.assetIndex.sha1
    );

    // Step 6: Download assets
    const assetIndexContent = await fs.readFile(assetIndexPath, 'utf-8');
    const assetIndex = JSON.parse(assetIndexContent);
    const objects = assetIndex.objects || {};
    const assetEntries = Object.entries(objects);
    const totalAssets = assetEntries.length;
    totalFiles += totalAssets;

    for (let i = 0; i < assetEntries.length; i++) {
      const [assetPath, assetInfo] = assetEntries[i];
      const asset = assetInfo as any;
      const hash = asset.hash;
      const hashPrefix = hash.substring(0, 2);
      const assetUrl = `${RESOURCES_BASE_URL}/${hashPrefix}/${hash}`;
      const assetFilePath = path.join(assetsDir, 'objects', hashPrefix, hash);

      const assetProgress = 50 + ((i / totalAssets) * 50);

      onProgress({
        profileId: version,
        stage: 'downloading',
        progress: assetProgress,
        currentFile: `Asset ${i + 1}/${totalAssets}`,
        totalFiles,
        downloadedFiles,
      });

      try {
        // Check if asset already exists
        try {
          await fs.access(assetFilePath);
          downloadedFiles++;
          continue;
        } catch {
          // File doesn't exist, download it
        }

        await downloadFileWithProgress(assetUrl, assetFilePath, undefined);
        downloadedFiles++;

        if ((i + 1) % 100 === 0) {
          onProgress({
            profileId: version,
            stage: 'downloading',
            progress: assetProgress,
            currentFile: `Assets: ${i + 1}/${totalAssets}`,
            totalFiles,
            downloadedFiles,
          });
        }
      } catch (error: any) {
        console.error(`Failed to download asset ${assetPath}: ${error.message}`);
      }
    }

    // Complete
    onProgress({
      profileId: version,
      stage: 'complete',
      progress: 100,
      currentFile: 'Download complete!',
      totalFiles,
      downloadedFiles,
    });
  }
}

