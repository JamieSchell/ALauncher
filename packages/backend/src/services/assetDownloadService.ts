/**
 * Asset Download Service
 * Автоматическая загрузка assets (ресурсов) Minecraft с официального сайта
 * Assets хранятся в общей папке updates/assets/{assetIndex}/ для всех профилей
 */

import axios from 'axios';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { config } from '../config';
import { logger } from '../utils/logger';

// Minecraft API endpoints
const VERSION_MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
const RESOURCES_BASE_URL = 'https://resources.download.minecraft.net';

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
  assetIndex: {
    id: string;
    sha1: string;
    size: number;
    url: string;
    totalSize: number;
  };
}

interface AssetIndex {
  objects: {
    [key: string]: {
      hash: string;
      size: number;
    };
  };
}

/**
 * Загрузить файл с проверкой SHA1
 */
async function downloadFile(url: string, destPath: string, expectedSha1?: string): Promise<void> {
  // Создать директорию если не существует
  const dir = path.dirname(destPath);
  await fs.mkdir(dir, { recursive: true });

  // Проверить, существует ли файл и валиден ли он
  try {
    const stats = await fs.stat(destPath);
    if (expectedSha1) {
      const fileContent = await fs.readFile(destPath);
      const hash = crypto.createHash('sha1').update(fileContent).digest('hex');
      if (hash === expectedSha1) {
        return; // Файл уже существует и валиден
      }
    } else {
      // Если нет хеша, считаем что файл валиден если существует
      return;
    }
  } catch {
    // Файл не существует, продолжаем загрузку
  }

  const response = await axios.get(url, { responseType: 'stream' });
  const writer = fsSync.createWriteStream(destPath);

  await pipeline(response.data, writer);

  // Проверить SHA1 если предоставлен
  if (expectedSha1) {
    const fileContent = await fs.readFile(destPath);
    const hash = crypto.createHash('sha1').update(fileContent).digest('hex');
    if (hash !== expectedSha1) {
      throw new Error(`SHA1 mismatch for ${destPath}. Expected ${expectedSha1}, got ${hash}`);
    }
  }
}

/**
 * Проверить, загружены ли assets для данного assetIndex
 * @param assetIndex - ID asset index для проверки
 * @param version - Версия Minecraft (опционально, для получения реального assetIndex)
 */
async function areAssetsDownloaded(assetIndex: string, version?: string): Promise<boolean> {
  let actualAssetIndex = assetIndex;
  
  // Если указана версия, получить реальный assetIndex
  if (version) {
    try {
      actualAssetIndex = await getAssetIndexForVersion(version);
    } catch (error) {
      // Если не удалось получить, используем переданный assetIndex
      logger.warn(`Failed to get asset index for version ${version}, using ${assetIndex}`);
    }
  }
  
  const assetsDir = path.join(config.paths.updates, 'assets', actualAssetIndex);
  const indexPath = path.join(assetsDir, 'index.json');
  
  try {
    await fs.access(indexPath);
    // Проверить наличие папки objects
    const objectsDir = path.join(assetsDir, 'objects');
    try {
      const stats = await fs.stat(objectsDir);
      if (stats.isDirectory()) {
        // Проверить, есть ли хотя бы несколько файлов
        const files = await fs.readdir(objectsDir);
        return files.length > 0;
      }
    } catch {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Получить assetIndex для версии Minecraft
 */
export async function getAssetIndexForVersion(version: string): Promise<string> {
  try {
    // Получить манифест версий
    const manifestResponse = await axios.get<VersionManifest>(VERSION_MANIFEST_URL);
    const versionEntry = manifestResponse.data.versions.find(v => v.id === version);
    
    if (!versionEntry) {
      throw new Error(`Version ${version} not found in manifest`);
    }

    // Получить информацию о версии
    const versionResponse = await axios.get<VersionInfo>(versionEntry.url);
    return versionResponse.data.assetIndex.id;
  } catch (error: any) {
    logger.error(`Failed to get asset index for version ${version}:`, error);
    throw error;
  }
}

/**
 * Загрузить assets для указанного assetIndex
 * @param assetIndex - ID asset index (например, "1.12", "1.20", "1.21")
 * @param version - Версия Minecraft (для получения информации о assetIndex)
 * @param onProgress - Callback для отслеживания прогресса
 */
export async function downloadAssets(
  assetIndex: string,
  version: string,
  onProgress?: (current: number, total: number, file: string) => void
): Promise<{ downloaded: number; skipped: number; errors: number }> {
  try {
    // Проверить, загружены ли assets (с учетом версии для получения реального assetIndex)
    if (await areAssetsDownloaded(assetIndex, version)) {
      logger.info(`Assets already downloaded, skipping...`);
      return { downloaded: 0, skipped: 0, errors: 0 };
    }

    logger.info(`Starting assets download for assetIndex: ${assetIndex} (version: ${version})`);

    // Получить информацию о версии для получения URL asset index
    const manifestResponse = await axios.get<VersionManifest>(VERSION_MANIFEST_URL);
    const versionEntry = manifestResponse.data.versions.find(v => v.id === version);
    
    if (!versionEntry) {
      throw new Error(`Version ${version} not found in manifest`);
    }

    const versionResponse = await axios.get<VersionInfo>(versionEntry.url);
    const versionInfo = versionResponse.data;

    // Использовать реальный assetIndex из версии
    const actualAssetIndex = versionInfo.assetIndex.id;
    
    // Если переданный assetIndex отличается, обновить путь
    if (actualAssetIndex !== assetIndex) {
      logger.info(`Using assetIndex ${actualAssetIndex} from version manifest (requested: ${assetIndex})`);
    }
    
    const assetsDir = path.join(config.paths.updates, 'assets', actualAssetIndex);
    await fs.mkdir(assetsDir, { recursive: true });

    // Загрузить asset index
    logger.info(`Downloading asset index for ${actualAssetIndex}...`);
    const assetIndexPath = path.join(assetsDir, 'index.json');
    await downloadFile(
      versionInfo.assetIndex.url,
      assetIndexPath,
      versionInfo.assetIndex.sha1
    );

    // Прочитать asset index
    const assetIndexContent = await fs.readFile(assetIndexPath, 'utf-8');
    const assetIndexData: AssetIndex = JSON.parse(assetIndexContent);
    
    const objects = assetIndexData.objects || {};
    const assetEntries = Object.entries(objects);
    const totalAssets = assetEntries.length;

    logger.info(`Found ${totalAssets} assets to download`);

    // Количество одновременных загрузок (можно настроить через переменную окружения)
    // Больше = быстрее, но больше нагрузка на сервер и сеть
    const CONCURRENT_DOWNLOADS = parseInt(process.env.ASSETS_CONCURRENT_DOWNLOADS || '20', 10);
    
    // Функция для загрузки одного asset
    const downloadAsset = async ([assetPath, assetInfo]: [string, { hash: string; size: number }]): Promise<{ downloaded: boolean; skipped: boolean; error: boolean }> => {
      const hash = assetInfo.hash;
      const hashPrefix = hash.substring(0, 2);
      const assetUrl = `${RESOURCES_BASE_URL}/${hashPrefix}/${hash}`;
      const assetFilePath = path.join(assetsDir, 'objects', hashPrefix, hash);

      try {
        // Проверить, существует ли файл
        try {
          await fs.access(assetFilePath);
          return { downloaded: false, skipped: true, error: false };
        } catch {
          // Файл не существует, загружаем
        }

        await downloadFile(assetUrl, assetFilePath);
        return { downloaded: true, skipped: false, error: false };
      } catch (error: any) {
        logger.error(`Failed to download asset ${assetPath}: ${error.message}`);
        return { downloaded: false, skipped: false, error: true };
      }
    };

    // Загрузить все assets параллельно с ограничением
    let currentIndex = 0;
    let processed = 0;
    let downloaded = 0;
    let skipped = 0;
    let errors = 0;

    // Создать пул загрузок
    const workers: Promise<void>[] = [];
    for (let i = 0; i < CONCURRENT_DOWNLOADS; i++) {
      workers.push(
        (async () => {
          while (true) {
            const index = currentIndex++;
            if (index >= assetEntries.length) break;
            
            const result = await downloadAsset(assetEntries[index]);
            
            // Обновить счетчики (синхронизация через порядок выполнения)
            processed++;
            if (result.downloaded) downloaded++;
            if (result.skipped) skipped++;
            if (result.error) errors++;
            
            // Обновить прогресс
            if (onProgress && (processed % 50 === 0 || processed === totalAssets)) {
              onProgress(processed, totalAssets, assetEntries[index][0]);
            }
          }
        })()
      );
    }

    // Дождаться завершения всех загрузок
    await Promise.all(workers);
    
    // Финальный прогресс
    if (onProgress) {
      onProgress(processed, totalAssets, '');
    }

    logger.info(`Assets download completed: ${downloaded} downloaded, ${skipped} skipped, ${errors} errors`);
    return { downloaded, skipped, errors };
  } catch (error: any) {
    logger.error(`Failed to download assets for ${assetIndex}:`, error);
    throw error;
  }
}

/**
 * Убедиться, что assets загружены для указанного assetIndex
 * Если assets не загружены, загрузит их автоматически
 * @param assetIndex - ID asset index (например, "1.12", "1.20")
 * @param version - Версия Minecraft
 * @param onProgress - Callback для отслеживания прогресса
 */
export async function ensureAssetsDownloaded(
  assetIndex: string,
  version: string,
  onProgress?: (current: number, total: number, file: string) => void
): Promise<void> {
  // Проверить, загружены ли assets (с учетом версии для получения реального assetIndex)
  if (await areAssetsDownloaded(assetIndex, version)) {
    return;
  }

  // Загрузить assets
  await downloadAssets(assetIndex, version, onProgress);
}

