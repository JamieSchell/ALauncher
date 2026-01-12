/**
 * Client Download Service
 * Скачивание клиентов Minecraft с официальных сайтов
 */

import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from '../config';
import { logger } from '../utils/logger';
import { prisma } from './database';
import { syncProfileFiles } from './fileSyncService';
import { downloadAssets, getAssetIndexForVersion } from './assetDownloadService';
import extractZip from 'extract-zip';

const execAsync = promisify(exec);

const VERSION_MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
const FORGE_METADATA_URL = 'https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json';
const FABRIC_METADATA_URL = 'https://meta.fabricmc.net/v2/versions/loader';
const FABRIC_INSTALLER_URL = 'https://maven.fabricmc.net/net/fabricmc/fabric-installer/0.11.2/fabric-installer-0.11.2.jar';

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
    game: Array<string | { rules?: Array<{ action: string; features?: Record<string, boolean> }>; value: string | string[] }>;
    jvm: Array<string | { rules?: Array<{ action: string; features?: Record<string, boolean> }>; value: string | string[] }>;
  };
  assetIndex: {
    id: string;
    sha1: string;
    size: number;
    url: string;
  };
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
  libraries: Array<{
    name: string;
    downloads?: {
      artifact?: {
        path: string;
        sha1: string;
        size: number;
        url: string;
      };
      classifiers?: {
        [key: string]: {
          path: string;
          sha1: string;
          size: number;
          url: string;
        };
      };
    };
    rules?: Array<{
      action: string;
      os?: {
        name?: string;
      };
    }>;
  }>;
}

interface ForgeVersion {
  mcversion: string;
  version: string;
  recommended?: boolean;
}

interface FabricLoaderVersion {
  version: string;
  stable: boolean;
}

/**
 * Скачать файл с проверкой SHA1
 */
async function downloadFile(url: string, destPath: string, expectedSha1?: string): Promise<void> {
  const dir = path.dirname(destPath);
  await fs.mkdir(dir, { recursive: true });

  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const content = Buffer.from(response.data);

  if (expectedSha1) {
    const actualSha1 = crypto.createHash('sha1').update(content).digest('hex');
    if (actualSha1 !== expectedSha1) {
      throw new Error(`SHA1 mismatch for ${path.basename(destPath)}. Expected: ${expectedSha1}, Got: ${actualSha1}`);
    }
  }

  await fs.writeFile(destPath, content);
}

/**
 * Проверить, нужно ли включать библиотеку
 */
function shouldIncludeLibrary(lib: VersionInfo['libraries'][0]): boolean {
  // Проверка правил для OS
  if (lib.rules) {
    let shouldInclude = false;
    for (const rule of lib.rules) {
      if (rule.action === 'allow') {
        if (!rule.os || rule.os.name === process.platform || (rule.os.name === 'windows' && process.platform === 'win32')) {
          shouldInclude = true;
        }
      } else if (rule.action === 'disallow') {
        if (!rule.os || rule.os.name === process.platform || (rule.os.name === 'windows' && process.platform === 'win32')) {
          return false;
        }
      }
    }
    if (!shouldInclude && lib.rules.some(r => r.action === 'allow')) {
      return false;
    }
  }

  return true;
}

/**
 * Получить список всех возможных классификаторов natives для всех платформ
 */
function getAllNativeClassifiers(): string[] {
  return [
    // Windows
    'natives-windows',
    'natives-windows-64',
    'natives-windows-32',
    // macOS
    'natives-osx',
    'natives-macos',
    'natives-macos-arm64',
    // Linux
    'natives-linux',
    'natives-linux-arm64',
    'natives-linux-arm32',
  ];
}

/**
 * Получить список возможных классификаторов natives для текущей платформы (для обратной совместимости)
 */
function getNativeClassifiers(): string[] {
  return getAllNativeClassifiers();
}

/**
 * Найти все natives классификаторы для библиотеки (для всех платформ)
 */
function findAllNativeClassifiers(lib: VersionInfo['libraries'][0]): Array<{ name: string; path: string; sha1: string; size: number; url: string }> {
  if (!lib.downloads?.classifiers) {
    return [];
  }

  const allClassifiers: Array<{ name: string; path: string; sha1: string; size: number; url: string }> = [];
  const possibleClassifiers = getAllNativeClassifiers();
  
  for (const classifierName of possibleClassifiers) {
    const classifier = lib.downloads.classifiers[classifierName as keyof typeof lib.downloads.classifiers];
    if (classifier && 'url' in classifier) {
      allClassifiers.push({
        name: classifierName,
        ...(classifier as { path: string; sha1: string; size: number; url: string })
      });
    }
  }

  return allClassifiers;
}

/**
 * Найти natives классификатор для библиотеки (для обратной совместимости - только для текущей платформы)
 */
function findNativeClassifier(lib: VersionInfo['libraries'][0]): { path: string; sha1: string; size: number; url: string } | null {
  const allClassifiers = findAllNativeClassifiers(lib);
  // Возвращаем первый найденный (для обратной совместимости)
  return allClassifiers.length > 0 ? allClassifiers[0] : null;
}

/**
 * Определить платформу из имени JAR файла
 */
function getPlatformFromJarName(jarName: string): 'linux' | 'windows' | 'macos' | null {
  const name = jarName.toLowerCase();
  if (name.includes('natives-linux')) {
    return 'linux';
  } else if (name.includes('natives-windows') || name.includes('natives-win')) {
    return 'windows';
  } else if (name.includes('natives-macos') || name.includes('natives-osx') || name.includes('natives-mac')) {
    return 'macos';
  }
  return null;
}

/**
 * Извлечь natives из JAR файла в директорию natives с учетом платформы
 */
export async function extractNativesFromJar(jarPath: string, nativesDir: string): Promise<void> {
  try {
    const jarName = path.basename(jarPath);
    const platform = getPlatformFromJarName(jarName);
    
    // Если платформа определена, извлекаем в подпапку платформы
    const targetDir = platform 
      ? path.join(nativesDir, platform)
      : nativesDir;
    
    await fs.mkdir(targetDir, { recursive: true });
    
    // JAR файлы - это ZIP архивы
    await extractZip(jarPath, { dir: targetDir });
    logger.debug(`Extracted natives from ${jarName} to ${platform || 'common'}`);
  } catch (error: any) {
    logger.warn(`Failed to extract natives from ${path.basename(jarPath)}: ${error.message}`);
    throw error;
  }
}

/**
 * Извлечь все natives библиотеки из скачанных JAR файлов
 */
export async function extractAllNatives(librariesDir: string, clientDir: string, onProgress?: (stage: string, progress: number, message: string) => void): Promise<void> {
  const versionDir = path.join(config.paths.updates, clientDir);
  const nativesDir = path.join(versionDir, 'natives');

  // Проверить, не извлечены ли уже natives
  // Проверяем наличие нативных файлов (.so, .dll, .dylib), а не просто наличие директории
  try {
    const stats = await fs.stat(nativesDir);
    if (stats.isDirectory()) {
      const files = await fs.readdir(nativesDir, { recursive: true });
      // Проверить, есть ли нативные файлы
      const hasNativeFiles = files.some((file: string) => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.so' || ext === '.dll' || ext === '.dylib';
      });
      if (hasNativeFiles) {
        logger.info(`Natives already extracted to ${nativesDir} (found native files)`);
        return;
      }
      // Если директория существует, но пуста или содержит только META-INF, переизвлечем
      logger.info(`Natives directory exists but appears empty, re-extracting...`);
    }
  } catch {
    // Директория не существует, создадим её
    logger.debug(`Natives directory does not exist, will create: ${nativesDir}`);
  }

  // Создать директорию natives
  await fs.mkdir(nativesDir, { recursive: true });

  // Найти все natives JAR файлы
  const nativesJars: string[] = [];
  
  async function findNativesJars(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.jar')) {
          // Проверить, содержит ли имя файла "natives"
          if (entry.name.toLowerCase().includes('natives')) {
            nativesJars.push(fullPath);
          }
        } else if (entry.isDirectory()) {
          await findNativesJars(fullPath);
        }
      }
    } catch (error: any) {
      // Пропустить директории, которые не можем прочитать
      logger.debug(`Cannot read directory ${dir}: ${error.message}`);
    }
  }

  await findNativesJars(librariesDir);

  if (nativesJars.length === 0) {
    logger.warn(`No natives JAR files found in ${librariesDir}`);
    return;
  }

  logger.info(`Found ${nativesJars.length} natives JAR files in ${librariesDir}, extracting to ${nativesDir}...`);
  onProgress?.('natives-extract', 0, `Extracting ${nativesJars.length} natives JAR files...`);

  // Извлечь natives из всех JAR файлов
  for (let i = 0; i < nativesJars.length; i++) {
    const jarPath = nativesJars[i];
    try {
      await extractNativesFromJar(jarPath, nativesDir);
      const progress = Math.floor((i + 1) / nativesJars.length * 100);
      onProgress?.('natives-extract', progress, `Extracted ${i + 1}/${nativesJars.length} natives JAR files...`);
    } catch (error: any) {
      logger.warn(`Failed to extract natives from ${path.basename(jarPath)}: ${error.message}`);
    }
  }

  logger.info(`✅ Extracted all natives to ${nativesDir}`);
}

/**
 * Скачать Vanilla клиент
 */
export async function downloadVanillaClient(
  version: string,
  clientDir: string,
  onProgress?: (stage: string, progress: number, message: string) => void
): Promise<void> {
  try {
    onProgress?.('manifest', 0, 'Fetching version manifest...');
    
    // Получить манифест версий
    const manifestResponse = await axios.get<VersionManifest>(VERSION_MANIFEST_URL);
    const versionEntry = manifestResponse.data.versions.find(v => v.id === version);
    
    if (!versionEntry) {
      throw new Error(`Version ${version} not found in manifest`);
    }

    onProgress?.('version', 10, `Fetching version info for ${version}...`);
    
    // Получить информацию о версии
    const versionResponse = await axios.get<VersionInfo>(versionEntry.url);
    const versionInfo = versionResponse.data;

    // Создать директории
    const versionDir = path.join(config.paths.updates, clientDir);
    const librariesDir = path.join(versionDir, 'libraries');
    
    await fs.mkdir(versionDir, { recursive: true });
    await fs.mkdir(librariesDir, { recursive: true });

    // Скачать client.jar
    onProgress?.('client', 20, 'Downloading client.jar...');
    const clientJarPath = path.join(versionDir, 'client.jar');
    await downloadFile(
      versionInfo.downloads.client.url,
      clientJarPath,
      versionInfo.downloads.client.sha1
    );

    // Скачать библиотеки
    onProgress?.('libraries', 30, 'Downloading libraries...');
    const libraries = versionInfo.libraries.filter(shouldIncludeLibrary);
    let downloadedLibs = 0;
    let hasNatives = false;

    // Сначала скачать обычные библиотеки (только для текущей платформы)
    for (let i = 0; i < libraries.length; i++) {
      const lib = libraries[i];
      
      if (lib.downloads?.artifact) {
        const artifact = lib.downloads.artifact;
        const libPath = path.join(librariesDir, artifact.path);
        
        try {
          await downloadFile(artifact.url, libPath, artifact.sha1);
          downloadedLibs++;
          
          const progress = 30 + Math.floor((downloadedLibs / libraries.length) * 40);
          onProgress?.('libraries', progress, `Downloaded ${downloadedLibs}/${libraries.length} libraries...`);
        } catch (error: any) {
          logger.warn(`Failed to download library ${lib.name}: ${error.message}`);
        }
      }

      // Скачать нативные библиотеки из классификаторов для ВСЕХ платформ
      const nativeClassifiers = findAllNativeClassifiers(lib);
      if (nativeClassifiers.length > 0) {
        logger.debug(`Found ${nativeClassifiers.length} native classifiers for ${lib.name}: ${nativeClassifiers.map(c => c.name).join(', ')}`);
      }
      for (const nativeClassifier of nativeClassifiers) {
        const nativePath = path.join(librariesDir, nativeClassifier.path);
        try {
          await downloadFile(nativeClassifier.url, nativePath, nativeClassifier.sha1);
          hasNatives = true;
          logger.debug(`Downloaded native library for ${nativeClassifier.name}: ${lib.name}`);
        } catch (error: any) {
          logger.warn(`Failed to download native library ${nativeClassifier.name} for ${lib.name}: ${error.message}`);
        }
      }
    }

    // Теперь скачать natives библиотеки для ВСЕХ платформ (независимо от правил OS)
    onProgress?.('libraries-natives', 70, 'Downloading natives for all platforms...');
    const allLibraries = versionInfo.libraries; // Все библиотеки, без фильтрации
    let nativesDownloaded = 0;
    
    for (const lib of allLibraries) {
      // Проверить, является ли это natives библиотекой (по имени)
      const isNativesLib = lib.name.includes(':natives-') || lib.name.toLowerCase().includes('natives');
      
      if (isNativesLib && lib.downloads?.artifact) {
        // Скачать natives библиотеку для всех платформ
        const artifact = lib.downloads.artifact;
        const libPath = path.join(librariesDir, artifact.path);
        
        try {
          // Проверить, не скачан ли уже файл
          try {
            await fs.access(libPath);
            nativesDownloaded++;
            continue; // Уже скачан
          } catch {
            // Файл не существует, скачиваем
          }
          
          await downloadFile(artifact.url, libPath, artifact.sha1);
          hasNatives = true;
          nativesDownloaded++;
          logger.debug(`Downloaded native library for all platforms: ${lib.name}`);
        } catch (error: any) {
          logger.warn(`Failed to download native library ${lib.name}: ${error.message}`);
        }
      }
    }
    
    logger.info(`Downloaded ${nativesDownloaded} natives libraries for all platforms`);

    // Извлечь natives из всех скачанных JAR файлов
    // Проверяем наличие natives файлов независимо от способа их скачивания
    logger.info(`[downloadVanillaClient] Starting natives extraction phase for ${clientDir}...`);
    onProgress?.('natives', 70, 'Extracting native libraries...');
    logger.info(`Starting natives extraction for ${clientDir}...`);
    try {
      const nativesDir = path.join(versionDir, 'natives');
      logger.info(`[downloadVanillaClient] Will extract natives to: ${nativesDir}`);
      await extractAllNatives(librariesDir, clientDir, (stage, progress, message) => {
        onProgress?.('natives', 70 + Math.floor(progress * 0.1), message);
      });
      // Проверить, что папка создалась
      try {
        const stats = await fs.stat(path.join(versionDir, 'natives'));
        if (stats.isDirectory()) {
          const files = await fs.readdir(path.join(versionDir, 'natives'));
          logger.info(`✅ Natives extraction completed for ${clientDir}. Found ${files.length} items in natives directory.`);
        }
      } catch (checkError: any) {
        logger.error(`❌ Natives directory was not created: ${checkError.message}`);
      }
    } catch (error: any) {
      logger.error(`Failed to extract natives: ${error.message}`, error);
      logger.error(`Error stack: ${error.stack}`);
      // Не прерываем процесс, но логируем ошибку
    }

    // Сохранить version.json для справки
    const versionJsonPath = path.join(versionDir, 'version.json');
    await fs.writeFile(versionJsonPath, JSON.stringify(versionInfo, null, 2));

    onProgress?.('complete', 100, 'Vanilla client downloaded successfully!');
    logger.info(`✅ Vanilla client ${version} downloaded to ${clientDir}`);
  } catch (error: any) {
    logger.error(`Failed to download Vanilla client ${version}:`, error);
    throw error;
  }
}

/**
 * Получить последнюю версию Forge для указанной версии Minecraft
 */
async function getLatestForgeVersion(mcVersion: string): Promise<{ version: string; installerUrl: string } | null> {
  try {
    // Попробовать получить версию с официального сайта
    try {
      const forgePromoUrl = `https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json`;
      const response = await axios.get(forgePromoUrl);
      const promotions = response.data.promos;
      
      // Искать recommended или latest версию для данной версии MC
      const key = `${mcVersion}-recommended`;
      const latestKey = `${mcVersion}-latest`;
      
      if (promotions[key]) {
        const forgeVersion = promotions[key];
        const installerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${mcVersion}-${forgeVersion}/forge-${mcVersion}-${forgeVersion}-installer.jar`;
        return { version: forgeVersion, installerUrl };
      } else if (promotions[latestKey]) {
        const forgeVersion = promotions[latestKey];
        const installerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${mcVersion}-${forgeVersion}/forge-${mcVersion}-${forgeVersion}-installer.jar`;
        return { version: forgeVersion, installerUrl };
      }
    } catch (error) {
      logger.warn(`Failed to fetch Forge version from API:`, error);
    }

    // Fallback: использовать известные версии
    const knownVersions: Record<string, { version: string; installerUrl: string }> = {
      '1.12.2': {
        version: '14.23.5.2860',
        installerUrl: 'https://maven.minecraftforge.net/net/minecraftforge/forge/1.12.2-14.23.5.2860/forge-1.12.2-14.23.5.2860-installer.jar',
      },
      '1.16.5': {
        version: '36.2.39',
        installerUrl: 'https://maven.minecraftforge.net/net/minecraftforge/forge/1.16.5-36.2.39/forge-1.16.5-36.2.39-installer.jar',
      },
      '1.18.2': {
        version: '40.2.0',
        installerUrl: 'https://maven.minecraftforge.net/net/minecraftforge/forge/1.18.2-40.2.0/forge-1.18.2-40.2.0-installer.jar',
      },
      '1.19.2': {
        version: '43.2.0',
        installerUrl: 'https://maven.minecraftforge.net/net/minecraftforge/forge/1.19.2-43.2.0/forge-1.19.2-43.2.0-installer.jar',
      },
      '1.20.1': {
        version: '47.1.0',
        installerUrl: 'https://maven.minecraftforge.net/net/minecraftforge/forge/1.20.1-47.1.0/forge-1.20.1-47.1.0-installer.jar',
      },
      '1.20.4': {
        version: '49.0.0',
        installerUrl: 'https://maven.minecraftforge.net/net/minecraftforge/forge/1.20.4-49.0.0/forge-1.20.4-49.0.0-installer.jar',
      },
    };

    return knownVersions[mcVersion] || null;
  } catch (error) {
    logger.warn(`Failed to get Forge version for ${mcVersion}:`, error);
    return null;
  }
}

/**
 * Установить Forge используя установщик
 */
async function installForge(
  version: string,
  forgeVersion: string,
  installerPath: string,
  clientDir: string,
  onProgress?: (stage: string, progress: number, message: string) => void
): Promise<void> {
  try {
    const versionDir = path.join(config.paths.updates, clientDir);
    const tempMinecraftDir = path.join(config.paths.updates, '.temp-minecraft', version);
    
    // Создать временную директорию .minecraft для установщика
    await fs.mkdir(tempMinecraftDir, { recursive: true });
    
    // Скопировать client.jar в временную директорию
    const tempVersionsDir = path.join(tempMinecraftDir, 'versions', version);
    await fs.mkdir(tempVersionsDir, { recursive: true });
    await fs.copyFile(
      path.join(versionDir, 'client.jar'),
      path.join(tempVersionsDir, `${version}.jar`)
    );
    
    // Скопировать libraries
    const tempLibrariesDir = path.join(tempMinecraftDir, 'libraries');
    const sourceLibrariesDir = path.join(versionDir, 'libraries');
    try {
      await fs.access(sourceLibrariesDir);
      await fs.mkdir(tempLibrariesDir, { recursive: true });
      // Копировать библиотеки рекурсивно
      await execAsync(`cp -r "${sourceLibrariesDir}"/* "${tempLibrariesDir}"/ 2>/dev/null || true`);
    } catch {
      // Libraries могут не существовать, это нормально
    }

    // Создать launcher_profiles.json для Forge установщика
    // Forge установщик требует наличие этого файла
    const launcherProfilesPath = path.join(tempMinecraftDir, 'launcher_profiles.json');
    const launcherProfiles = {
      profiles: {
        [version]: {
          name: version,
          lastVersionId: version,
          gameDir: tempMinecraftDir,
        },
      },
    };
    await fs.writeFile(launcherProfilesPath, JSON.stringify(launcherProfiles, null, 2));

    onProgress?.('forge-install', 75, 'Installing Forge...');
    
    // Запустить установщик Forge
    // Определить версию Java на основе версии Minecraft
    let javaPath = 'java';
    if (version.startsWith('1.12') || version.startsWith('1.13') || version.startsWith('1.14') || version.startsWith('1.15') || version.startsWith('1.16')) {
      // Для старых версий используем Java 8
      javaPath = process.env.JAVA_8_HOME 
        ? path.join(process.env.JAVA_8_HOME, 'bin', 'java')
        : '/opt/java/jdk8u412-b08/bin/java';
    } else {
      // Для новых версий используем Java 17
      javaPath = process.env.JAVA_17_HOME 
        ? path.join(process.env.JAVA_17_HOME, 'bin', 'java')
        : '/opt/java/jdk-17.0.12+7/bin/java';
    }
    
    // Проверить существование Java
    try {
      await fs.access(javaPath);
    } catch {
      // Fallback на системную Java
      javaPath = 'java';
    }
    
    // Для старых версий используется --installClient, для новых --installClient --target
    const installCommand = version.startsWith('1.12') || version.startsWith('1.13') || version.startsWith('1.14') || version.startsWith('1.15') || version.startsWith('1.16')
      ? `${javaPath} -jar "${installerPath}" --installClient "${tempMinecraftDir}"`
      : `${javaPath} -jar "${installerPath}" --installClient --target "${tempMinecraftDir}"`;

    logger.info(`Running Forge installer: ${installCommand}`);
    
    try {
      const { stdout, stderr } = await execAsync(installCommand, {
        timeout: 300000, // 5 минут таймаут
        maxBuffer: 10 * 1024 * 1024, // 10MB буфер
      });
      
      // Проверить, что установка прошла успешно
      const successIndicators = ['Successfully installed', 'Success', 'You can delete'];
      const hasSuccess = stdout && successIndicators.some(indicator => stdout.includes(indicator));
      
      if (hasSuccess) {
        logger.info(`✅ Forge installer completed successfully`);
      } else {
        logger.warn(`Forge installer output doesn't contain success indicators`);
      }
      
      if (stderr && !stderr.includes('Installing') && !successIndicators.some(indicator => stderr.includes(indicator))) {
        logger.warn(`Forge installer stderr: ${stderr}`);
      }
      
      logger.debug(`Forge installer output: ${stdout}`);
    } catch (error: any) {
      // Проверить, установился ли Forge несмотря на ошибку
      logger.warn(`Forge installer command exited with error: ${error.message}`);
      if (error.stdout) {
        logger.info(`Stdout: ${error.stdout}`);
        // Проверить, что установка все же прошла успешно
        const successIndicators = ['Successfully installed', 'Success', 'You can delete'];
        const hasSuccess = successIndicators.some(indicator => error.stdout.includes(indicator));
        if (!hasSuccess) {
          logger.error(`Forge installation may have failed. Output: ${error.stdout}`);
        }
      }
      if (error.stderr) logger.warn(`Stderr: ${error.stderr}`);
    }

    // Подождать немного, чтобы файлы точно были записаны на диск
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Найти установленную версию Forge с повторными попытками
    // Важно: читать из versions/, а не из versions/version/
    const versionsParentDir = path.join(tempMinecraftDir, 'versions');
    let forgeVersionDirs: string[] = [];
    let forgeDir: string | undefined;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts && !forgeDir) {
      try {
        forgeVersionDirs = await fs.readdir(versionsParentDir);
        forgeDir = forgeVersionDirs.find(d => d.includes('forge'));
        if (forgeDir) {
          logger.info(`✅ Found Forge directory on attempt ${attempts + 1}: ${forgeDir}`);
          break;
        }
        attempts++;
        if (attempts < maxAttempts) {
          logger.debug(`Attempt ${attempts}/${maxAttempts}: Forge directory not found yet, retrying... (Available: ${forgeVersionDirs.join(', ')})`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        attempts++;
        if (attempts >= maxAttempts) {
          logger.error(`Failed to read versions directory after ${maxAttempts} attempts: ${error.message}`);
          throw new Error(`Forge installation directory not found: ${versionsParentDir}`);
        }
        logger.warn(`Attempt ${attempts}/${maxAttempts} to read versions directory failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (!forgeDir) {
      logger.error(`Available directories in ${versionsParentDir}: ${forgeVersionDirs.join(', ')}`);
      throw new Error(`Forge installation directory not found after ${maxAttempts} attempts. Available: ${forgeVersionDirs.join(', ')}`);
    }

    const forgeInstallDir = path.join(versionsParentDir, forgeDir);
    
    // Для старых версий Forge (1.12.2) используется оригинальный client.jar
    // Forge модифицирует клиент через libraries, а не создает отдельный JAR
    let forgeJarPath: string;
    
    if (version.startsWith('1.12') || version.startsWith('1.13') || version.startsWith('1.14') || version.startsWith('1.15') || version.startsWith('1.16')) {
      // Для старых версий используем оригинальный client.jar
      forgeJarPath = path.join(versionsParentDir, version, `${version}.jar`);
      logger.info(`Using original client.jar for Forge ${version}: ${forgeJarPath}`);
      
      // Проверить существование
      try {
        await fs.access(forgeJarPath);
      } catch {
        throw new Error(`Original client.jar not found at ${forgeJarPath}`);
      }
    } else {
      // Для новых версий ищем JAR в директории Forge
      forgeJarPath = path.join(forgeInstallDir, `${forgeDir}.jar`);
      
      // Проверить существование Forge JAR
      try {
        await fs.access(forgeJarPath);
        logger.info(`Found Forge JAR at: ${forgeJarPath}`);
      } catch {
        // Попробовать найти любой JAR в директории
        const files = await fs.readdir(forgeInstallDir);
        const jarFile = files.find(f => f.endsWith('.jar'));
        if (jarFile) {
          forgeJarPath = path.join(forgeInstallDir, jarFile);
          logger.info(`Found JAR file in Forge directory: ${jarFile}`);
        } else {
          throw new Error(`Forge JAR file not found in ${forgeInstallDir}`);
        }
      }
    }

    // Скопировать JAR как client.jar
    await fs.copyFile(forgeJarPath, path.join(versionDir, 'client.jar'));
    logger.info(`Copied JAR to client.jar: ${forgeJarPath} -> ${path.join(versionDir, 'client.jar')}`);

    // Скопировать обновленные libraries из временной директории
    const tempLibs = path.join(tempMinecraftDir, 'libraries');
    try {
      await fs.access(tempLibs);
      await execAsync(`cp -r "${tempLibs}"/* "${sourceLibrariesDir}"/ 2>/dev/null || true`);
    } catch {
      // Libraries могут не существовать
    }

    // Очистить временную директорию
    try {
      await fs.rm(tempMinecraftDir, { recursive: true, force: true });
    } catch {
      // Игнорировать ошибки очистки
    }

    onProgress?.('forge-install', 90, 'Forge installed successfully');
    logger.info(`✅ Forge ${forgeVersion} installed for Minecraft ${version}`);
  } catch (error: any) {
    logger.error(`Failed to install Forge:`, error);
    throw error;
  }
}

/**
 * Скачать Forge клиент
 */
export async function downloadForgeClient(
  version: string,
  clientDir: string,
  onProgress?: (stage: string, progress: number, message: string) => void
): Promise<void> {
  try {
    // Сначала скачать Vanilla клиент
    onProgress?.('vanilla', 0, 'Downloading base Vanilla client...');
    await downloadVanillaClient(version, clientDir, (stage, progress, message) => {
      onProgress?.(stage, Math.floor(progress * 0.5), message);
    });

    // Получить версию Forge
    onProgress?.('forge', 50, 'Finding Forge version...');
    const forgeInfo = await getLatestForgeVersion(version);
    
    if (!forgeInfo) {
      throw new Error(`Could not find Forge version for Minecraft ${version}. Please install Forge manually.`);
    }

    logger.info(`Using Forge version ${forgeInfo.version} for Minecraft ${version}`);

    // Скачать установщик Forge
    onProgress?.('forge-download', 60, 'Downloading Forge installer...');
    const versionDir = path.join(config.paths.updates, clientDir);
    const installerPath = path.join(versionDir, 'forge-installer.jar');
    
    try {
      const response = await axios.get(forgeInfo.installerUrl, { responseType: 'stream' });
      const writer = fsSync.createWriteStream(installerPath);
      response.data.pipe(writer);
      
      await new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      logger.info(`Forge installer downloaded to ${installerPath}`);
    } catch (error: any) {
      throw new Error(`Failed to download Forge installer: ${error.message}`);
    }

    // Установить Forge
    await installForge(version, forgeInfo.version, installerPath, clientDir, onProgress);

    // Удалить установщик
    try {
      await fs.unlink(installerPath);
    } catch {
      // Игнорировать ошибки удаления
    }

    onProgress?.('complete', 100, `Forge ${forgeInfo.version} installed successfully!`);
    logger.info(`✅ Forge client ${version} with Forge ${forgeInfo.version} downloaded and installed`);
  } catch (error: any) {
    logger.error(`Failed to download Forge client ${version}:`, error);
    throw error;
  }
}

/**
 * Получить последнюю версию Fabric Loader
 */
async function getLatestFabricLoader(mcVersion: string): Promise<{ version: string; installerUrl: string } | null> {
  try {
    // Получить список версий loader
    const response = await axios.get<FabricLoaderVersion[]>(`${FABRIC_METADATA_URL}/${mcVersion}`);
    const stableLoader = response.data.find(v => v.stable);
    const loaderVersion = stableLoader?.version || response.data[0]?.version;
    
    if (!loaderVersion) {
      return null;
    }

    // Использовать последнюю версию установщика
    return {
      version: loaderVersion,
      installerUrl: FABRIC_INSTALLER_URL,
    };
  } catch (error) {
    logger.warn(`Failed to get Fabric loader version:`, error);
    return null;
  }
}

/**
 * Установить Fabric используя установщик
 */
async function installFabric(
  version: string,
  loaderVersion: string,
  installerPath: string,
  clientDir: string,
  onProgress?: (stage: string, progress: number, message: string) => void
): Promise<void> {
  try {
    const versionDir = path.join(config.paths.updates, clientDir);
    const tempMinecraftDir = path.join(config.paths.updates, '.temp-minecraft', version);
    
    // Создать временную директорию .minecraft для установщика
    await fs.mkdir(tempMinecraftDir, { recursive: true });
    
    // Скопировать client.jar в временную директорию
    const tempVersionsDir = path.join(tempMinecraftDir, 'versions', version);
    await fs.mkdir(tempVersionsDir, { recursive: true });
    await fs.copyFile(
      path.join(versionDir, 'client.jar'),
      path.join(tempVersionsDir, `${version}.jar`)
    );
    
    // Скопировать libraries
    const tempLibrariesDir = path.join(tempMinecraftDir, 'libraries');
    const sourceLibrariesDir = path.join(versionDir, 'libraries');
    try {
      await fs.access(sourceLibrariesDir);
      await fs.mkdir(tempLibrariesDir, { recursive: true });
      await execAsync(`cp -r "${sourceLibrariesDir}"/* "${tempLibrariesDir}"/ 2>/dev/null || true`);
    } catch {
      // Libraries могут не существовать
    }

    onProgress?.('fabric-install', 75, 'Installing Fabric...');
    
    // Запустить установщик Fabric
    // Fabric требует Java 17+ для всех версий
    let javaPath = process.env.JAVA_17_HOME 
      ? path.join(process.env.JAVA_17_HOME, 'bin', 'java')
      : '/opt/java/jdk-17.0.12+7/bin/java';
    
    // Проверить существование Java
    try {
      await fs.access(javaPath);
    } catch {
      // Fallback на системную Java
      javaPath = 'java';
    }
    
    const installCommand = `${javaPath} -jar "${installerPath}" client -dir "${tempMinecraftDir}" -mcversion ${version} -loader ${loaderVersion}`;

    logger.info(`Running Fabric installer: ${installCommand}`);
    
    try {
      const { stdout, stderr } = await execAsync(installCommand, {
        timeout: 300000, // 5 минут таймаут
        maxBuffer: 10 * 1024 * 1024, // 10MB буфер
      });
      
      if (stderr && !stderr.includes('Installing') && !stderr.includes('Success')) {
        logger.warn(`Fabric installer stderr: ${stderr}`);
      }
      
      logger.info(`Fabric installer output: ${stdout}`);
    } catch (error: any) {
      throw new Error(`Fabric installation failed: ${error.message}`);
    }

    // Найти установленную версию Fabric
    const fabricVersionDirs = await fs.readdir(tempVersionsDir);
    const fabricDir = fabricVersionDirs.find(d => d.includes('fabric'));
    
    if (!fabricDir) {
      throw new Error('Fabric installation directory not found');
    }

    const fabricInstallDir = path.join(tempVersionsDir, fabricDir);
    const fabricJar = path.join(fabricInstallDir, `${fabricDir}.jar`);
    
    // Проверить существование Fabric JAR
    try {
      await fs.access(fabricJar);
    } catch {
      // Попробовать найти любой JAR в директории
      const files = await fs.readdir(fabricInstallDir);
      const jarFile = files.find(f => f.endsWith('.jar'));
      if (jarFile) {
        await fs.copyFile(
          path.join(fabricInstallDir, jarFile),
          path.join(versionDir, 'client.jar')
        );
      } else {
        throw new Error('Fabric JAR file not found after installation');
      }
    }

    // Скопировать Fabric JAR как client.jar
    await fs.copyFile(fabricJar, path.join(versionDir, 'client.jar'));

    // Скопировать обновленные libraries из временной директории
    const tempLibs = path.join(tempMinecraftDir, 'libraries');
    try {
      await fs.access(tempLibs);
      await execAsync(`cp -r "${tempLibs}"/* "${sourceLibrariesDir}"/ 2>/dev/null || true`);
    } catch {
      // Libraries могут не существовать
    }

    // Очистить временную директорию
    try {
      await fs.rm(tempMinecraftDir, { recursive: true, force: true });
    } catch {
      // Игнорировать ошибки очистки
    }

    onProgress?.('fabric-install', 90, 'Fabric installed successfully');
    logger.info(`✅ Fabric loader ${loaderVersion} installed for Minecraft ${version}`);
  } catch (error: any) {
    logger.error(`Failed to install Fabric:`, error);
    throw error;
  }
}

/**
 * Скачать Fabric клиент
 */
export async function downloadFabricClient(
  version: string,
  clientDir: string,
  onProgress?: (stage: string, progress: number, message: string) => void
): Promise<void> {
  try {
    // Сначала скачать Vanilla клиент
    onProgress?.('vanilla', 0, 'Downloading base Vanilla client...');
    await downloadVanillaClient(version, clientDir, (stage, progress, message) => {
      onProgress?.(stage, Math.floor(progress * 0.5), message);
    });

    // Получить версию Fabric Loader
    onProgress?.('fabric', 50, 'Finding Fabric loader version...');
    const fabricInfo = await getLatestFabricLoader(version);
    
    if (!fabricInfo) {
      throw new Error(`Could not find Fabric loader for Minecraft ${version}`);
    }

    logger.info(`Using Fabric loader ${fabricInfo.version} for Minecraft ${version}`);

    // Скачать установщик Fabric
    onProgress?.('fabric-download', 60, 'Downloading Fabric installer...');
    const versionDir = path.join(config.paths.updates, clientDir);
    const installerPath = path.join(versionDir, 'fabric-installer.jar');
    
    try {
      const response = await axios.get(fabricInfo.installerUrl, { responseType: 'stream' });
      const writer = fsSync.createWriteStream(installerPath);
      response.data.pipe(writer);
      
      await new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      logger.info(`Fabric installer downloaded to ${installerPath}`);
    } catch (error: any) {
      throw new Error(`Failed to download Fabric installer: ${error.message}`);
    }

    // Установить Fabric
    await installFabric(version, fabricInfo.version, installerPath, clientDir, onProgress);

    // Удалить установщик
    try {
      await fs.unlink(installerPath);
    } catch {
      // Игнорировать ошибки удаления
    }

    onProgress?.('complete', 100, `Fabric loader ${fabricInfo.version} installed successfully!`);
    logger.info(`✅ Fabric client ${version} with loader ${fabricInfo.version} downloaded and installed`);
  } catch (error: any) {
    logger.error(`Failed to download Fabric client ${version}:`, error);
    throw error;
  }
}

/**
 * Скачать клиент и создать профиль
 */
export async function downloadAndCreateClient(
  title: string,
  loader: 'Vanilla' | 'Forge' | 'Fabric',
  version: string,
  serverAddress?: string,
  serverPort?: number,
  onProgress?: (stage: string, progress: number, message: string) => void
): Promise<{ profileId: string; clientDir: string }> {
  try {
    // Генерировать безопасное имя директории
    const clientDir = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const clientDirPath = path.join(config.paths.updates, clientDir);

    // Проверить, существует ли уже директория
    try {
      await fs.access(clientDirPath);
      throw new Error(`Client directory "${clientDir}" already exists. Please choose a different name or delete the existing directory.`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Скачать клиент
    onProgress?.('download', 0, `Downloading ${loader} client ${version}...`);
    
    switch (loader.toLowerCase()) {
      case 'vanilla':
        await downloadVanillaClient(version, clientDir, (stage, progress, message) => {
          onProgress?.('download', progress, message);
        });
        break;
      case 'forge':
        await downloadForgeClient(version, clientDir, (stage, progress, message) => {
          onProgress?.('download', progress, message);
        });
        break;
      case 'fabric':
        await downloadFabricClient(version, clientDir, (stage, progress, message) => {
          onProgress?.('download', progress, message);
        });
        break;
      default:
        throw new Error(`Unknown loader: ${loader}. Supported: Vanilla, Forge, Fabric`);
    }

    // Скачать assets
    onProgress?.('assets', 80, 'Downloading assets...');
    let assetIndex: string;
    try {
      assetIndex = await getAssetIndexForVersion(version);
      await downloadAssets(assetIndex, version);
      onProgress?.('assets', 90, 'Assets downloaded');
    } catch (error: any) {
      logger.warn(`Failed to download assets: ${error.message}`);
      // Fallback: использовать версию как assetIndex
      assetIndex = version.split('.').slice(0, 2).join('.');
    }

    // Создать профиль
    onProgress?.('profile', 90, 'Creating profile...');

    // Настройки по умолчанию для разных типов клиентов
    let mainClass = 'net.minecraft.client.main.Main';
    let classPath: string[] = ['libraries', 'client.jar'];
    let jvmArgs: string[] = [];
    let clientArgs: string[] = [];
    let jvmVersion = '17';

    if (loader === 'Forge') {
      if (version.startsWith('1.12')) {
        mainClass = 'net.minecraft.launchwrapper.Launch';
        classPath = [
          'libraries',
          'client.jar',
        ];
        jvmArgs = [
          '-Dforge.logging.markers=REGISTRIES',
          '-Dforge.logging.console.level=debug',
        ];
        clientArgs = [
          '--tweakClass',
          'net.minecraftforge.fml.common.launcher.FMLTweaker',
        ];
        jvmVersion = '8';
      } else {
        mainClass = 'cpw.mods.bootstraplauncher.BootstrapLauncher';
        jvmVersion = '17';
      }
    } else if (loader === 'Fabric') {
      mainClass = 'net.fabricmc.loader.launch.knot.KnotClient';
      jvmVersion = '17';
    } else {
      // Vanilla
      if (version.startsWith('1.17') || version.startsWith('1.18') || version.startsWith('1.19') || version.startsWith('1.20') || version.startsWith('1.21')) {
        jvmVersion = '17';
      } else if (version.startsWith('1.16')) {
        jvmVersion = '8';
      }
    }

    // Получить максимальный sortIndex
    const maxProfile = await prisma.clientProfile.findFirst({
      orderBy: { sortIndex: 'desc' },
      select: { sortIndex: true },
    });
    const sortIndex = (maxProfile?.sortIndex || 0) + 1;

    // Создать профиль
    const profile = await prisma.clientProfile.create({
      data: {
        version,
        assetIndex,
        clientDirectory: clientDir,
        sortIndex,
        title,
        description: `Auto-downloaded ${loader} client for Minecraft ${version}`,
        tags: [loader.toUpperCase(), 'AUTO-DOWNLOADED'],
        serverAddress: serverAddress || 'localhost',
        serverPort: serverPort || 25565,
        jvmVersion,
        updateFastCheck: true,
        update: ['libraries', 'client\\.jar'],
        updateVerify: ['libraries', 'client\\.jar'],
        updateExclusions: [],
        mainClass,
        classPath,
        jvmArgs,
        clientArgs,
        enabled: true,
      },
    });

    // Синхронизировать файлы
    onProgress?.('sync', 95, 'Synchronizing files with database...');
    await syncProfileFiles(profile.id);

    onProgress?.('complete', 100, `✅ Client "${title}" created successfully!`);
    
    return {
      profileId: profile.id,
      clientDir,
    };
  } catch (error: any) {
    logger.error(`Failed to download and create client:`, error);
    throw error;
  }
}

