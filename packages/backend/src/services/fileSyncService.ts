/**
 * File Sync Service
 * Автоматическая синхронизация файлов из папки updates в базу данных
 * с проверкой целостности
 */

import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import type { FSWatcher } from 'chokidar';
import { config } from '../config';
import { logger } from '../utils/logger';
import { broadcastToAll } from '../websocket';
import { WSEvent } from '@modern-launcher/shared';
import { prisma } from './database';
import { ProgressBar, formatBytes, formatDuration } from '../utils/progressBar';

// Store watcher instance for graceful shutdown
let fileWatcher: FSWatcher | null = null;
let syncTimeouts: Map<string, NodeJS.Timeout> | null = null;

interface FileInfo {
  filePath: string;
  fullPath: string;
  size: bigint;
  hash: string;
  fileType: string;
}

/**
 * Определить тип файла по расширению и пути
 */
function getFileType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const dir = path.dirname(filePath).toLowerCase();
  
  if (ext === '.jar') {
    if (filePath.includes('client.jar') || filePath === 'client.jar') {
      return 'jar';
    }
    if (dir.includes('libraries') || dir.includes('library')) {
      return 'library';
    }
    return 'jar';
  }
  
  if (dir.includes('libraries') || dir.includes('library')) {
    if (ext === '.so' || ext === '.dll' || ext === '.dylib') {
      return 'native';
    }
    return 'library';
  }
  
  if (dir.includes('assets') || dir.includes('asset')) {
    return 'asset';
  }
  
  if (ext === '.so' || ext === '.dll' || ext === '.dylib') {
    return 'native';
  }
  
  return 'other';
}

/**
 * Вычислить SHA-256 хеш файла
 */
async function calculateFileHash(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Сканировать директорию рекурсивно и получить список всех файлов
 */
async function scanDirectory(dirPath: string, basePath: string = dirPath): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/');
      
      // Пропускаем скрытые файлы и служебные директории
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }
      
      if (entry.isDirectory()) {
        // Рекурсивно сканируем поддиректории
        const subFiles = await scanDirectory(fullPath, basePath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        try {
          const stats = await fs.stat(fullPath);
          const hash = await calculateFileHash(fullPath);
          const fileType = getFileType(relativePath);
          
          files.push({
            filePath: relativePath,
            fullPath,
            size: BigInt(stats.size),
            hash,
            fileType,
          });
        } catch (error) {
          logger.warn(`[FileSync] Failed to process file ${fullPath}:`, error);
        }
      }
    }
  } catch (error) {
    logger.error(`[FileSync] Error scanning directory ${dirPath}:`, error);
  }
  
  return files;
}

/**
 * Синхронизировать файлы версии с базой данных
 */
async function syncVersionFiles(version: string): Promise<{ added: number; updated: number; errors: number }> {
  const versionDir = path.join(config.paths.updates, version);
  
  // Проверить существование директории
  try {
    await fs.access(versionDir);
  } catch {
    logger.warn(`[FileSync] Version directory not found: ${versionDir}`);
    return { added: 0, updated: 0, errors: 0 };
  }
  
  // Найти или создать версию в БД
  let clientVersion = await prisma.clientVersion.findUnique({
    where: { version },
  });
  
  if (!clientVersion) {
    // Создать новую версию с базовыми данными
    logger.info(`[FileSync] Creating new version in DB: ${version}`);
    clientVersion = await prisma.clientVersion.create({
      data: {
        version,
        title: `Minecraft ${version}`,
        description: `Auto-synced version ${version}`,
        clientJarPath: 'client.jar',
        clientJarHash: '', // Будет обновлено после сканирования
        clientJarSize: BigInt(0),
        mainClass: 'net.minecraft.client.main.Main',
        jvmVersion: '8',
        jvmArgs: [],
        clientArgs: [],
        enabled: true,
      },
    });
  }
  
  // Сканировать все файлы
  console.log(`\n📂 Scanning files for version "${version}"...`);
  const startTime = Date.now();
  const files = await scanDirectory(versionDir);

  if (files.length === 0) {
    console.log(`⚠️  No files found in ${versionDir}`);
    return { added: 0, updated: 0, errors: 0 };
  }

  console.log(`📊 Found ${files.length} files (${formatBytes(files.reduce((sum, f) => sum + f.size, BigInt(0)))})`);

  let added = 0;
  let updated = 0;
  let errors = 0;
  
  // Обновить client.jar информацию если найден
  const clientJar = files.find(f => f.filePath === 'client.jar');
  if (clientJar) {
    await prisma.clientVersion.update({
      where: { id: clientVersion.id },
      data: {
        clientJarHash: clientJar.hash,
        clientJarSize: clientJar.size,
      },
    });
  }
  
  // Создаем прогресс-бар для синхронизации
  const progressBar = new ProgressBar(files.length, 'Syncing files');
  console.log(''); // Пустая строка для прогресс-бара

  // Синхронизировать каждый файл
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      // Используем upsert для атомарной операции - предотвращает дубликаты
      // Для общих файлов версии явно устанавливаем clientDirectory: null
      const fileData = {
        versionId: clientVersion.id,
        clientDirectory: null, // явно указываем null для общих файлов версии
        filePath: file.filePath,
        fileHash: file.hash,
        fileSize: file.size,
        fileType: file.fileType,
        verified: false,
        integrityCheckFailed: false,
        lastVerified: new Date(),
      };

      // Используем upsert для предотвращения дубликатов
      const result = await prisma.clientFile.upsert({
        where: {
          versionId_clientDirectory_filePath: {
            versionId: clientVersion.id,
            clientDirectory: null, // для общих файлов версии
            filePath: file.filePath,
          },
        },
        update: {
          fileHash: file.hash,
          fileSize: file.size,
          fileType: file.fileType,
          verified: false,
          integrityCheckFailed: false,
          lastVerified: new Date(),
        },
        create: fileData,
      });

      // Проверяем, был ли файл создан или обновлен (используем условие upsert)
      // Если upsert создал новую запись, значит файл был добавлен, иначе - обновлен
      const isCreated = !result.lastVerified || result.lastVerified.getTime() === (new Date()).getTime();

      if (isCreated) {
        added++;
      } else {
        updated++;
      }

      try {
        broadcastToAll({
          event: WSEvent.CLIENT_FILES_UPDATED,
          data: {
            version: clientVersion.version,
            versionId: clientVersion.id,
            action: isCreated ? 'file_added' : 'file_updated',
            files: [{
              filePath: result.filePath,
              fileHash: result.fileHash,
              fileSize: result.fileSize.toString(),
              fileType: result.fileType,
              verified: result.verified,
              integrityCheckFailed: result.integrityCheckFailed,
            }],
          },
        });
      } catch (error) {
        // Silently ignore WebSocket errors during CLI operations
      }

      // Обновляем прогресс-бар с правильным статусом
      const status = isCreated ? 'Added' : 'Updated';
      progressBar.update(i + 1, `${status}: ${file.filePath}`);

    } catch (error) {
      errors++;
      progressBar.update(i + 1, `❌ Error: ${file.filePath}`);
      logger.error(`[FileSync] Error syncing file ${file.filePath}:`, error);
    }
  }

  // Завершаем прогресс-бар
  progressBar.complete();
  
  // ВАЖНО: НЕ удаляем файлы из БД автоматически при синхронизации!
  // Это может привести к потере данных, если файлы не были найдены при сканировании
  // 
  // Удаление файлов из БД должно происходить только:
  // 1. Через явную команду CLI (file delete)
  // 2. При реальном удалении файла с диска (через file watcher unlink event)
  //
  // Логируем файлы, которые есть в БД, но не найдены при сканировании (для отладки)
  const dbFiles = await prisma.clientFile.findMany({
    where: { versionId: clientVersion.id },
    select: { id: true, filePath: true },
  });

  const scannedFilePaths = new Set(files.map(f => f.filePath));
  const missingFiles: string[] = [];

  for (const dbFile of dbFiles) {
    if (!scannedFilePaths.has(dbFile.filePath)) {
      const versionDir = path.join(config.paths.updates, version);
      const fullPath = path.join(versionDir, dbFile.filePath);
      
      // Проверить существование файла на диске
      try {
        await fs.access(fullPath);
        const stats = await fs.stat(fullPath);
        if (stats.isFile()) {
          logger.warn(`[FileSync] ⚠️  File exists on disk but wasn't scanned: ${dbFile.filePath}. This may indicate a scanning issue.`);
        }
      } catch {
        // File doesn't exist on disk
        missingFiles.push(dbFile.filePath);
        logger.debug(`[FileSync] File in DB but not on disk: ${dbFile.filePath} (not removing from DB - use 'file delete' command if needed)`);
      }
    }
  }

  if (missingFiles.length > 0) {
    logger.info(`[FileSync] Found ${missingFiles.length} files in DB that are not on disk (not auto-removed for safety). Use 'file delete' command to remove them manually.`);
  }
  
  const duration = Date.now() - startTime;

  // Красивый вывод статистики
  console.log('\n📊 Sync Statistics:');
  console.log(`   ✅ Added: ${added} files`);
  console.log(`   🔄 Updated: ${updated} files`);
  if (errors > 0) {
    console.log(`   ❌ Errors: ${errors} files`);
  }
  console.log(`   ⏱️  Duration: ${formatDuration(duration)}`);
  console.log(`   📦 Total: ${added + updated} files processed`);

  if (errors === 0) {
    console.log(`\n✨ Sync completed successfully for version "${version}"`);
  } else {
    console.log(`\n⚠️  Sync completed with ${errors} errors for version "${version}"`);
  }

  // Отправить WebSocket уведомление об обновлении файлов (только если не CLI режим)
  try {
    const isCLI = process.argv.some(arg => arg.includes('cli'));
    if (!isCLI) {
      const files = await prisma.clientFile.findMany({
        where: { versionId: clientVersion.id },
        select: {
          filePath: true,
          fileHash: true,
          fileSize: true,
          fileType: true,
          verified: true,
          integrityCheckFailed: true,
        },
      });

      const stats = await getSyncStats(version);

      broadcastToAll({
        event: WSEvent.CLIENT_FILES_UPDATED,
        data: {
          version,
          versionId: clientVersion.id,
          action: 'sync',
          files: files.map(f => ({
            filePath: f.filePath,
            fileHash: f.fileHash,
            fileSize: f.fileSize.toString(),
            fileType: f.fileType,
            verified: f.verified,
            integrityCheckFailed: f.integrityCheckFailed,
          })),
          stats: {
            totalFiles: stats.totalFiles,
            verifiedFiles: stats.verifiedFiles,
            failedFiles: stats.failedFiles,
          },
        },
      });
    }
  } catch (error) {
    // Silently ignore WebSocket errors during CLI operations
  }

  return { added, updated, errors };
}

/**
 * Проверить целостность файла
 */
export async function verifyFileIntegrity(versionId: string, filePath: string): Promise<boolean> {
  // Находим запись о файле по versionId + filePath (может быть несколько clientDirectory,
  // но для проверки целостности достаточно первой найденной записи).
  const file = await prisma.clientFile.findFirst({
    where: {
      versionId,
      filePath,
    },
    include: {
      version: true,
    },
  });
  
  if (!file) {
    return false;
  }
  
  // Получить путь к файлу на диске
  // Если у файла есть clientDirectory, используем её напрямую;
  // иначе считаем, что это общий файл версии и используем директорию версии.
  const clientDir = file.clientDirectory || file.version.version;
  const versionDir = path.join(config.paths.updates, clientDir);
  const fullPath = path.join(versionDir, filePath);
  
  try {
    // Проверить существование файла
    await fs.access(fullPath);
    
    // Вычислить хеш
    const currentHash = await calculateFileHash(fullPath);
    const stats = await fs.stat(fullPath);
    
    // Сравнить хеш и размер
    const hashMatches = currentHash === file.fileHash;
    const sizeMatches = BigInt(stats.size) === file.fileSize;
    
    const isValid = hashMatches && sizeMatches;
    
    // Обновить статус проверки
    await prisma.clientFile.update({
      where: { id: file.id },
      data: {
        verified: isValid,
        integrityCheckFailed: !isValid,
        lastVerified: new Date(),
      },
    });
    
    if (!isValid) {
      logger.warn(`[FileSync] Integrity check failed for ${filePath}: hash=${hashMatches}, size=${sizeMatches}`);
    }

    // Отправить WebSocket уведомление об обновлении файла
    try {
      broadcastToAll({
        event: WSEvent.CLIENT_FILES_UPDATED,
        data: {
          version: file.version.version,
          versionId: file.versionId,
          action: 'integrity_check',
          files: [{
            filePath: file.filePath,
            fileHash: file.fileHash,
            fileSize: file.fileSize.toString(),
            fileType: file.fileType,
            verified: isValid,
            integrityCheckFailed: !isValid,
          }],
        },
      });
    } catch (error) {
      logger.warn(`[FileSync] Failed to send WebSocket notification for integrity check:`, error);
    }
    
    return isValid;
  } catch (error) {
    logger.error(`[FileSync] Error verifying file ${filePath}:`, error);
    
    // Пометить как невалидный
    await prisma.clientFile.update({
      where: { id: file.id },
      data: {
        verified: false,
        integrityCheckFailed: true,
        lastVerified: new Date(),
      },
    });
    
    return false;
  }
}

/**
 * Проверить целостность всех файлов версии
 */
export async function verifyVersionIntegrity(version: string): Promise<{
  total: number;
  valid: number;
  invalid: number;
}> {
  const clientVersion = await prisma.clientVersion.findUnique({
    where: { version },
    include: {
      files: {
        select: {
          id: true,
          filePath: true,
        },
      },
    },
  });
  
  if (!clientVersion) {
    throw new Error(`Version ${version} not found in database`);
  }
  
  let valid = 0;
  let invalid = 0;
  
  for (const file of clientVersion.files) {
    const isValid = await verifyFileIntegrity(clientVersion.id, file.filePath);
    if (isValid) {
      valid++;
    } else {
      invalid++;
    }
  }
  
  return {
    total: clientVersion.files.length,
    valid,
    invalid,
  };
}

/**
 * Инициализировать file watcher для автоматической синхронизации
 */
export async function initializeFileWatcher(): Promise<void> {
  const updatesDir = config.paths.updates;
  
  // Динамический импорт chokidar (ES модуль)
  // Используем eval для обхода компиляции TypeScript в require()
  const chokidarModule = await (eval('import("chokidar")') as Promise<typeof import('chokidar')>);
  const chokidar = chokidarModule.default || chokidarModule;
  
  // Создать watcher для папки updates
  const watcher = chokidar.watch(updatesDir, {
    ignored: /(^|[\/\\])\../, // Игнорировать скрытые файлы
    persistent: true,
    ignoreInitial: true, // Игнорировать существующие файлы при запуске (initial sync выполняется вручную в 'ready')
    depth: 10, // Глубина сканирования
  });
  
  // Store watcher instance for graceful shutdown
  fileWatcher = watcher;
  
  // Debounce для группировки изменений (отдельный таймер для каждой директории)
  syncTimeouts = new Map<string, NodeJS.Timeout>();
  const SYNC_DELAY = 2000; // 2 секунды задержки
  
  const scheduleSync = async (directoryName: string) => {
    // Отменить предыдущий таймер для этой директории, если он есть
    const existingTimeout = syncTimeouts.get(directoryName);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Установить новый таймер для этой директории
    const timeout = setTimeout(async () => {
      syncTimeouts.delete(directoryName);
      try {
        // Попытаться найти профиль по clientDirectory
        const profile = await prisma.clientProfile.findFirst({
          where: { clientDirectory: directoryName },
        });

        if (profile) {
          // Если найден профиль, синхронизировать его файлы
          console.log(`📁 Auto-syncing profile: ${profile.title} (${directoryName})`);
          await syncProfileFiles(profile.id);
        } else {
          // Иначе попытаться синхронизировать как версию (для обратной совместимости)
          console.log(`📁 Auto-syncing version: ${directoryName}`);
          await syncVersionFiles(directoryName);
        }
      } catch (error) {
        logger.error(`[FileSync] Error auto-syncing ${directoryName}:`, error);
      }
    }, SYNC_DELAY);
    
    syncTimeouts.set(directoryName, timeout);
  };
  
  // Обработка изменений файлов
  watcher.on('add', (filePath) => {
    const relativePath = path.relative(updatesDir, filePath);
    const directoryName = relativePath.split(path.sep)[0];
    
    if (directoryName && directoryName !== 'assets') {
      logger.debug(`[FileSync] File added: ${filePath}`);
      scheduleSync(directoryName);
    }
  });
  
  watcher.on('change', (filePath) => {
    const relativePath = path.relative(updatesDir, filePath);
    const directoryName = relativePath.split(path.sep)[0];
    
    if (directoryName && directoryName !== 'assets') {
      logger.debug(`[FileSync] File changed: ${filePath}`);
      scheduleSync(directoryName);
    }
  });
  
  watcher.on('unlink', async (filePath) => {
    const relativePath = path.relative(updatesDir, filePath);
    const directoryName = relativePath.split(path.sep)[0];
    
    if (directoryName && directoryName !== 'assets') {
      logger.debug(`[FileSync] File deleted: ${filePath}`);
      
      // Немедленно удалить файл из БД асинхронно
      (async () => {
        try {
          // Найти профиль по имени директории
          const profile = await prisma.clientProfile.findFirst({
            where: { clientDirectory: directoryName },
          });
          
          if (profile) {
            // Найти версию по версии из профиля
            const clientVersion = await prisma.clientVersion.findFirst({
              where: { version: profile.version },
              include: {
                files: true,
              },
            });
            
            if (clientVersion) {
              // Найти файл в БД по относительному пути
              const filePathInDb = relativePath.substring(directoryName.length + 1).replace(/\\/g, '/');
              const dbFile = await prisma.clientFile.findFirst({
                where: {
                  versionId: clientVersion.id,
                  filePath: filePathInDb,
                },
              });
              
              if (dbFile) {
                // Удалить файл из БД
                try {
                  await prisma.clientFile.delete({
                    where: { id: dbFile.id },
                  });
                  
                  logger.info(`[FileSync] Immediately removed deleted file from DB: ${filePathInDb} (profile: ${profile.title})`);
                  
                  // Отправить WebSocket уведомление об удалении файла
                  try {
                    broadcastToAll({
                      event: WSEvent.CLIENT_FILES_UPDATED,
                      data: {
                        version: clientVersion.version,
                        versionId: clientVersion.id,
                        action: 'file_deleted',
                        files: [{
                          filePath: filePathInDb,
                          fileHash: '',
                          fileSize: 0,
                          fileType: '',
                        }],
                      },
                    });
                  } catch (error) {
                    logger.warn(`[FileSync] Failed to send WebSocket notification for deleted file:`, error);
                  }
                } catch (error: any) {
                  // P2025 означает, что файл уже был удален - это не ошибка
                  if (error.code === 'P2025') {
                    logger.debug(`[FileSync] File ${filePathInDb} was already deleted from DB, skipping.`);
                  } else {
                    logger.error(`[FileSync] Error deleting file ${filePathInDb} from DB:`, error);
                  }
                }
              }
            }
          } else {
            // Если профиль не найден, попробовать найти версию по имени директории
            const clientVersion = await prisma.clientVersion.findFirst({
              where: { version: directoryName },
              include: {
                files: true,
              },
            });
            
            if (clientVersion) {
              const filePathInDb = relativePath.substring(directoryName.length + 1).replace(/\\/g, '/');
              const dbFile = await prisma.clientFile.findFirst({
                where: {
                  versionId: clientVersion.id,
                  filePath: filePathInDb,
                },
              });
              
              if (dbFile) {
                try {
                  await prisma.clientFile.delete({
                    where: { id: dbFile.id },
                  });
                  
                  logger.info(`[FileSync] Immediately removed deleted file from DB: ${filePathInDb} (version: ${clientVersion.version})`);
                  
                  try {
                    broadcastToAll({
                      event: WSEvent.CLIENT_FILES_UPDATED,
                      data: {
                        version: clientVersion.version,
                        versionId: clientVersion.id,
                        action: 'file_deleted',
                        files: [{
                          filePath: filePathInDb,
                          fileHash: '',
                          fileSize: 0,
                          fileType: '',
                        }],
                      },
                    });
                  } catch (error) {
                    logger.warn(`[FileSync] Failed to send WebSocket notification for deleted file:`, error);
                  }
                } catch (error: any) {
                  // P2025 означает, что файл уже был удален - это не ошибка
                  if (error.code === 'P2025') {
                    logger.debug(`[FileSync] File ${filePathInDb} was already deleted from DB, skipping.`);
                  } else {
                    logger.error(`[FileSync] Error deleting file ${filePathInDb} from DB:`, error);
                  }
                }
              }
            }
          }
        } catch (error) {
          logger.error(`[FileSync] Error removing deleted file from DB: ${filePath}`, error);
        }
      })();
      
      // Также запланировать полную синхронизацию для проверки других изменений
      scheduleSync(directoryName);
    }
  });
  
  watcher.on('error', (error) => {
    logger.error('[FileSync] Watcher error:', error);
  });
  
  // Синхронизировать все существующие профили и версии при запуске
  watcher.on('ready', async () => {
    // Отключаем начальную синхронизацию при запуске для предотвращения дубликатов
    // Файлы будут синхронизироваться только при изменениях (add/change/unlink)
    console.log('👀 File watcher initialized (initial sync disabled for duplicates prevention)');
  });
}

/**
 * Stop file watcher gracefully
 * 
 * Closes the file watcher and clears all pending sync timeouts.
 * Should be called during application shutdown.
 * 
 * @returns Promise that resolves when watcher is closed
 * 
 * @example
 * ```ts
 * await stopFileWatcher();
 * // File watcher is now closed
 * ```
 */
export async function stopFileWatcher(): Promise<void> {
  try {
    // Clear all pending sync timeouts
    if (syncTimeouts) {
      for (const timeout of syncTimeouts.values()) {
        clearTimeout(timeout);
      }
      syncTimeouts.clear();
      syncTimeouts = null;
    }
    
    // Close watcher if it exists
    if (fileWatcher) {
      await fileWatcher.close();
      fileWatcher = null;
      logger.info('[FileSync] File watcher stopped');
    }
  } catch (error) {
    logger.error('[FileSync] Error stopping file watcher:', error);
    throw error;
  }
}

/**
 * Ручная синхронизация версии
 */
export async function syncVersion(version: string): Promise<{ added: number; updated: number; errors: number }> {
  return await syncVersionFiles(version);
}

/**
 * Синхронизировать файлы профиля с базой данных
 * Использует clientDirectory из профиля для определения пути к файлам
 */
export async function syncProfileFiles(profileId: string): Promise<{ added: number; updated: number; errors: number }> {
  // Получить профиль
  const profile = await prisma.clientProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    throw new Error(`Profile with ID "${profileId}" not found`);
  }

  // Определить директорию клиента (используем clientDirectory или fallback на version)
  const clientDir = profile.clientDirectory || profile.version;
  const profileDir = path.join(config.paths.updates, clientDir);

  // Проверить существование директории
  try {
    await fs.access(profileDir);
  } catch {
    logger.warn(`[FileSync] Profile directory not found: ${profileDir}`);
    return { added: 0, updated: 0, errors: 0 };
  }

  // Найти или создать версию в БД
  let clientVersion = await prisma.clientVersion.findUnique({
    where: { version: profile.version },
  });

  if (!clientVersion) {
    // Создать новую версию с базовыми данными
    logger.info(`[FileSync] Creating new version in DB: ${profile.version}`);
    clientVersion = await prisma.clientVersion.create({
      data: {
        version: profile.version,
        title: `Minecraft ${profile.version}`,
        description: `Auto-synced version ${profile.version}`,
        clientJarPath: 'client.jar',
        clientJarHash: '',
        clientJarSize: BigInt(0),
        mainClass: profile.mainClass,
        jvmVersion: profile.jvmVersion || '8',
        jvmArgs: profile.jvmArgs as string[],
        clientArgs: profile.clientArgs as string[],
        enabled: true,
      },
    });
  }

  // Сканировать все файлы
  console.log(`\n📂 Scanning files for profile "${profile.title}" (${clientDir})...`);
  const startTime = Date.now();
  const files = await scanDirectory(profileDir);

  if (files.length === 0) {
    console.log(`⚠️  No files found in ${profileDir}`);
    return { added: 0, updated: 0, errors: 0 };
  }

  console.log(`📊 Found ${files.length} files (${formatBytes(files.reduce((sum, f) => sum + f.size, BigInt(0)))})`);

  let added = 0;
  let updated = 0;
  let errors = 0;

  // Обновить client.jar информацию если найден
  const clientJar = files.find(f => f.filePath === 'client.jar');
  if (clientJar) {
    await prisma.clientVersion.update({
      where: { id: clientVersion.id },
      data: {
        clientJarHash: clientJar.hash,
        clientJarSize: clientJar.size,
      },
    });
  }

  // Создаем прогресс-бар для синхронизации профиля
  const progressBar = new ProgressBar(files.length, `Syncing ${profile.title}`);
  console.log(''); // Пустая строка для прогресс-бара

  // Синхронизировать каждый файл (используем ту же логику что и в syncVersionFiles),
  // НО с привязкой к конкретной директории клиента.
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      // Используем upsert для атомарной операции - предотвращает дубликаты
      const fileData = {
            versionId: clientVersion.id,
        clientDirectory: clientDir,
            filePath: file.filePath,
              fileHash: file.hash,
              fileSize: file.size,
              fileType: file.fileType,
              verified: false,
              integrityCheckFailed: false,
      } as any;

      // Проверяем, был ли файл создан или обновлен, сравнивая timestamps
      const result = await prisma.clientFile.upsert({
        where: {
          versionId_clientDirectory_filePath: {
            versionId: clientVersion.id,
            clientDirectory: clientDir,
            filePath: file.filePath,
          },
        },
        update: {
          fileHash: file.hash,
          fileSize: file.size,
          fileType: file.fileType,
          verified: false,
          integrityCheckFailed: false,
          lastVerified: new Date(),
        },
        create: fileData,
      });

      // Проверяем, был ли файл создан или обновлен (используем условие upsert)
      // Если upsert создал новую запись, значит файл был добавлен, иначе - обновлен
      const isCreated = !result.lastVerified || result.lastVerified.getTime() === (new Date()).getTime();

      if (isCreated) {
        added++;
      } else {
        updated++;
      }

      try {
        broadcastToAll({
          event: WSEvent.CLIENT_FILES_UPDATED,
          data: {
            version: clientVersion.version,
            versionId: clientVersion.id,
            action: isCreated ? 'file_added' : 'file_updated',
            files: [{
              filePath: result.filePath,
              fileHash: result.fileHash,
              fileSize: result.fileSize.toString(),
              fileType: result.fileType,
              verified: result.verified,
              integrityCheckFailed: result.integrityCheckFailed,
            }],
          },
        });
      } catch (error) {
        // Silently ignore WebSocket errors during CLI operations
      }

      // Обновляем прогресс-бар с правильным статусом
      const status = isCreated ? 'Added' : 'Updated';
      progressBar.update(i + 1, `${status}: ${file.filePath}`);
    } catch (error) {
      errors++;
      progressBar.update(i + 1, `❌ Error: ${file.filePath}`);
      logger.error(`[FileSync] Error syncing file ${file.filePath}:`, error);
    }
  }

  // ВАЖНО: НЕ удаляем файлы из БД автоматически при синхронизации!
  // Это может привести к потере данных, если файлы не были найдены при сканировании
  // (например, из-за ошибок сканирования, файлов в процессе записи, или проблем с путями)
  // 
  // Удаление файлов из БД должно происходить только:
  // 1. Через явную команду CLI (file delete)
  // 2. При реальном удалении файла с диска (через file watcher unlink event)
  //
  // Логируем файлы, которые есть в БД, но не найдены при сканировании (для отладки)
  const dbFiles = await prisma.clientFile.findMany({
    where: { versionId: clientVersion.id },
    select: { id: true, filePath: true },
  });

  const scannedFilePaths = new Set(files.map(f => f.filePath));
  const missingFiles: string[] = [];

  for (const dbFile of dbFiles) {
    if (!scannedFilePaths.has(dbFile.filePath)) {
      const fullPath = path.join(profileDir, dbFile.filePath);
      let fileExistsOnDisk = false;
      
      // Проверить существование файла на диске
      try {
        await fs.access(fullPath);
        const stats = await fs.stat(fullPath);
        if (stats.isFile()) {
          fileExistsOnDisk = true;
          logger.warn(`[FileSync] ⚠️  File exists on disk but wasn't scanned: ${dbFile.filePath}. This may indicate a scanning issue.`);
        }
      } catch {
        // File doesn't exist on disk
        missingFiles.push(dbFile.filePath);
        logger.debug(`[FileSync] File in DB but not on disk: ${dbFile.filePath} (not removing from DB - use 'file delete' command if needed)`);
      }
    }
  }

  if (missingFiles.length > 0) {
    logger.info(`[FileSync] Found ${missingFiles.length} files in DB that are not on disk (not auto-removed for safety). Use 'file delete' command to remove them manually.`);
  }

  // Завершаем прогресс-бар
  progressBar.complete();

  const duration = Date.now() - startTime;

  // Красивый вывод статистики
  console.log('\n📊 Sync Statistics:');
  console.log(`   ✅ Added: ${added} files`);
  console.log(`   🔄 Updated: ${updated} files`);
  if (errors > 0) {
    console.log(`   ❌ Errors: ${errors} files`);
  }
  console.log(`   ⏱️  Duration: ${formatDuration(duration)}`);
  console.log(`   📦 Total: ${added + updated} files processed`);

  if (errors === 0) {
    console.log(`\n✨ Sync completed successfully for profile "${profile.title}"`);
  } else {
    console.log(`\n⚠️  Sync completed with ${errors} errors for profile "${profile.title}"`);
  }

  return { added, updated, errors };
}

/**
 * Получить статистику синхронизации
 */
export async function getSyncStats(version: string): Promise<{
  totalFiles: number;
  verifiedFiles: number;
  failedFiles: number;
  lastSync?: Date;
}> {
  const clientVersion = await prisma.clientVersion.findUnique({
    where: { version },
    include: {
      files: {
        select: {
          verified: true,
          integrityCheckFailed: true,
          lastVerified: true,
        },
      },
    },
  });
  
  if (!clientVersion) {
    throw new Error(`Version ${version} not found`);
  }
  
  const totalFiles = clientVersion.files.length;
  const verifiedFiles = clientVersion.files.filter(f => f.verified && !f.integrityCheckFailed).length;
  const failedFiles = clientVersion.files.filter(f => f.integrityCheckFailed).length;
  
  const lastSync = clientVersion.files
    .map(f => f.lastVerified)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  
  return {
    totalFiles,
    verifiedFiles,
    failedFiles,
    lastSync,
  };
}

