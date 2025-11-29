/**
 * Assets Commands
 * Команды для управления assets (ресурсами) Minecraft
 */

import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';
import { BaseCommand } from './base';
import { downloadAssets, getAssetIndexForVersion, ensureAssetsDownloaded } from '../../services/assetDownloadService';
import { config } from '../../config';

export class AssetsCommands extends BaseCommand {
  getNames(): string[] {
    return ['assets'];
  }

  getDescription(): string {
    return 'Minecraft assets management commands';
  }

  getUsage(): string {
    return `assets download <version> - Download assets for a specific Minecraft version
assets list - List all downloaded asset indexes
assets check <version> - Check if assets are downloaded for a version`;
  }

  getExamples(): string[] {
    return [
      'assets download 1.12.2',
      'assets download 1.20.4',
      'assets list',
      'assets check 1.12.2',
    ];
  }

  async execute(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length === 0) {
      this.printError('Subcommand required. Use "assets download", "assets list", or "assets check"');
      this.printInfo('Type "help assets" for usage information');
      return;
    }

    const subcommand = args[0].toLowerCase();

    switch (subcommand) {
      case 'download':
        await this.handleDownload(args.slice(1), rl);
        break;
      case 'list':
        await this.handleList();
        break;
      case 'check':
        await this.handleCheck(args.slice(1));
        break;
      default:
        this.printError(`Unknown subcommand: ${subcommand}`);
        this.printInfo('Type "help assets" for usage information');
    }
  }

  private async handleDownload(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: assets download <version>');
      this.printInfo('Example: assets download 1.12.2');
      return;
    }

    const version = args[0];

    try {
      this.printInfo(`\n🎨 Fetching asset index for version ${version}...`);
      
      // Получить assetIndex для версии
      let assetIndex: string;
      try {
        assetIndex = await getAssetIndexForVersion(version);
        this.printSuccess(`Asset index: ${assetIndex}`);
      } catch (error: any) {
        this.printError(`Failed to get asset index: ${error.message}`);
        return;
      }

      // Проверить, загружены ли assets
      const assetsDir = path.join(config.paths.updates, 'assets', assetIndex);
      const indexPath = path.join(assetsDir, 'index.json');
      
      try {
        await fs.access(indexPath);
        const objectsDir = path.join(assetsDir, 'objects');
        try {
          const stats = await fs.stat(objectsDir);
          if (stats.isDirectory()) {
            const files = await fs.readdir(objectsDir);
            if (files.length > 0) {
              this.printWarning(`\n⚠️  Assets for ${assetIndex} are already downloaded!`);
              this.printInfo(`   Location: ${assetsDir}`);
              const overwrite = await this.askYesNo(rl, 'Do you want to download them again?');
              if (!overwrite) {
                this.printInfo('Download cancelled');
                return;
              }
            }
          }
        } catch {
          // Objects directory doesn't exist, continue
        }
      } catch {
        // Index doesn't exist, continue with download
      }

      this.printInfo(`\n📥 Starting download of assets for ${assetIndex}...`);
      this.print(`   This may take a while depending on your internet connection.\n`);

      let lastProgress = 0;
      let lastPercent = -1;
      const startTime = Date.now();

      const result = await downloadAssets(assetIndex, version, (current, total, file) => {
        const percent = Math.round((current / total) * 100);
        
        // Обновлять прогресс каждые 1% или каждые 100 файлов
        if (percent !== lastPercent || current % 100 === 0 || current === total) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = current > 0 ? (current / ((Date.now() - startTime) / 1000)).toFixed(1) : '0';
          
          process.stdout.write(
            `\r   Progress: ${current}/${total} (${percent}%) | Speed: ${rate} files/s | Time: ${elapsed}s | ${file.substring(0, 30)}...`
          );
          
          lastPercent = percent;
          lastProgress = current;
        }
      });

      process.stdout.write('\n\n');

      this.printSuccess(`✅ Assets download completed!`);
      this.print(`\n📊 Statistics:`);
      this.print(`   Downloaded: ${result.downloaded} file(s)`);
      this.print(`   Skipped: ${result.skipped} file(s)`);
      this.print(`   Errors: ${result.errors} file(s)`);
      this.print(`\n📁 Location: ${assetsDir}`);
      this.print(`\n💡 All profiles using assetIndex "${assetIndex}" will use these assets.`);

      if (result.errors > 0) {
        this.printWarning(`\n⚠️  Some assets failed to download. You may need to run the command again.`);
      }
    } catch (error: any) {
      this.printError(`\n❌ Failed to download assets: ${error.message}`);
      if (error.response) {
        this.printError(`   Status: ${error.response.status}`);
        this.printError(`   URL: ${error.response.config?.url}`);
      }
    }
  }

  private async handleList(): Promise<void> {
    try {
      const assetsBaseDir = path.join(config.paths.updates, 'assets');
      
      // Проверить, существует ли папка assets
      try {
        await fs.access(assetsBaseDir);
      } catch {
        this.printInfo('No assets directory found. No assets have been downloaded yet.');
        return;
      }

      // Получить список всех папок assetIndex
      const entries = await fs.readdir(assetsBaseDir, { withFileTypes: true });
      const assetIndexes = entries.filter(entry => entry.isDirectory());

      if (assetIndexes.length === 0) {
        this.printInfo('No asset indexes found.');
        return;
      }

      this.print(`\n📦 Downloaded Asset Indexes:\n`);

      const tableData: string[][] = [];
      
      for (const entry of assetIndexes) {
        const assetIndex = entry.name;
        const assetDir = path.join(assetsBaseDir, assetIndex);
        const indexPath = path.join(assetDir, 'index.json');
        const objectsDir = path.join(assetDir, 'objects');

        let fileCount = 0;
        let totalSize = 0;
        let hasIndex = false;

        try {
          await fs.access(indexPath);
          hasIndex = true;
        } catch {
          // Index doesn't exist
        }

        if (hasIndex) {
          try {
            const stats = await fs.stat(objectsDir);
            if (stats.isDirectory()) {
              // Подсчитать файлы рекурсивно
              const countFiles = async (dir: string): Promise<number> => {
                let count = 0;
                try {
                  const entries = await fs.readdir(dir, { withFileTypes: true });
                  for (const entry of entries) {
                    if (entry.isFile()) {
                      count++;
                      try {
                        const fileStats = await fs.stat(path.join(dir, entry.name));
                        totalSize += fileStats.size;
                      } catch {
                        // Ignore size errors
                      }
                    } else if (entry.isDirectory()) {
                      count += await countFiles(path.join(dir, entry.name));
                    }
                  }
                } catch {
                  // Ignore errors
                }
                return count;
              };
              
              fileCount = await countFiles(objectsDir);
            }
          } catch {
            // Objects directory doesn't exist
          }
        }

        const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        const status = hasIndex && fileCount > 0 ? '\x1b[32m✓ Complete\x1b[0m' : '\x1b[33m⚠ Partial\x1b[0m';
        
        tableData.push([
          assetIndex,
          fileCount.toString(),
          `${sizeMB} MB`,
          status,
        ]);
      }

      this.printTable(
        ['Asset Index', 'Files', 'Size', 'Status'],
        tableData
      );

      this.print(`\nTotal: ${assetIndexes.length} asset index(es)`);
    } catch (error: any) {
      this.printError(`Failed to list assets: ${error.message}`);
    }
  }

  private async handleCheck(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: assets check <version>');
      this.printInfo('Example: assets check 1.12.2');
      return;
    }

    const version = args[0];

    try {
      this.printInfo(`\n🔍 Checking assets for version ${version}...`);

      // Получить assetIndex для версии
      let assetIndex: string;
      try {
        assetIndex = await getAssetIndexForVersion(version);
        this.print(`   Asset Index: ${assetIndex}`);
      } catch (error: any) {
        this.printError(`Failed to get asset index: ${error.message}`);
        return;
      }

      // Проверить наличие assets
      const assetsDir = path.join(config.paths.updates, 'assets', assetIndex);
      const indexPath = path.join(assetsDir, 'index.json');
      
      try {
        await fs.access(indexPath);
        this.printSuccess(`✓ Asset index file exists`);
      } catch {
        this.printError(`✗ Asset index file not found`);
        this.printInfo(`   Run: assets download ${version}`);
        return;
      }

      // Проверить наличие папки objects
      const objectsDir = path.join(assetsDir, 'objects');
      try {
        const stats = await fs.stat(objectsDir);
        if (stats.isDirectory()) {
          // Подсчитать файлы
          const countFiles = async (dir: string): Promise<number> => {
            let count = 0;
            try {
              const entries = await fs.readdir(dir, { withFileTypes: true });
              for (const entry of entries) {
                if (entry.isFile()) {
                  count++;
                } else if (entry.isDirectory()) {
                  count += await countFiles(path.join(dir, entry.name));
                }
              }
            } catch {
              // Ignore errors
            }
            return count;
          };
          
          const fileCount = await countFiles(objectsDir);
          
          if (fileCount > 0) {
            this.printSuccess(`✓ Assets directory exists with ${fileCount} file(s)`);
            this.print(`\n📁 Location: ${assetsDir}`);
            this.print(`\n✅ Assets are ready to use!`);
          } else {
            this.printWarning(`⚠ Assets directory exists but is empty`);
            this.printInfo(`   Run: assets download ${version}`);
          }
        }
      } catch {
        this.printError(`✗ Assets directory not found`);
        this.printInfo(`   Run: assets download ${version}`);
      }
    } catch (error: any) {
      this.printError(`Failed to check assets: ${error.message}`);
    }
  }
}

