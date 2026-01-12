/**
 * File Commands
 * Команды для управления файлами и синхронизацией
 */

import readline from 'readline';
import { BaseCommand } from './base';
import { syncVersion, syncProfileFiles, verifyVersionIntegrity, getSyncStats } from '../../services/fileSyncService';
import { prisma } from '../../services/database';

export class FileCommands extends BaseCommand {
  getNames(): string[] {
    return ['file'];
  }

  getDescription(): string {
    return 'File management and synchronization commands';
  }

  getUsage(): string {
    return `file sync <version> - Sync files for version from updates directory
file verify <version> - Verify integrity of all files for version
file stats <version> - Show sync statistics for version
file list <version> - List all files for version
file delete <version> <filePath> - Delete file from database (file must be deleted from disk first)
file delete-all <version> - Delete all files for version from database
file cleanup - Remove files with empty clientDirectory from database`;
  }

  getExamples(): string[] {
    return [
      'file sync 1.12.2',
      'file verify 1.12.2',
      'file stats 1.12.2',
      'file list 1.12.2',
      'file delete 1.12.2 libraries/net/minecraftforge/forge/1.12.2-14.23.5.2860/forge-1.12.2-14.23.5.2860.jar',
      'file delete-all 1.12.2',
      'file cleanup',
    ];
  }

  async execute(args: string[], rl: readline.Interface, commandName?: string): Promise<void> {
    if (args.length === 0) {
      this.printError('Subcommand required. Use "file sync", "file verify", etc.');
      this.printInfo('Type "help file" for usage information');
      return;
    }

    const subcommand = args[0].toLowerCase();

    switch (subcommand) {
      case 'sync':
        await this.handleSync(args.slice(1));
        break;
      case 'verify':
        await this.handleVerify(args.slice(1));
        break;
      case 'stats':
        await this.handleStats(args.slice(1));
        break;
      case 'list':
        await this.handleList(args.slice(1));
        break;
      case 'delete':
        await this.handleDelete(args.slice(1), rl);
        break;
      case 'delete-all':
        await this.handleDeleteAll(args.slice(1), rl);
        break;
      case 'cleanup':
        await this.handleCleanup(args.slice(1), rl);
        break;
      default:
        this.printError(`Unknown subcommand: ${subcommand}`);
        this.printInfo('Type "help file" for usage information');
    }
  }

  private async handleSync(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: file sync <version|clientDirectory>');
      this.printInfo('You can sync by version (e.g., "1.12.2") or by clientDirectory (e.g., "hitech")');
      return;
    }

    const identifier = args[0];

    try {
      // Сначала проверим, является ли это clientDirectory профиля
      const profile = await prisma.clientProfile.findFirst({
        where: { clientDirectory: identifier },
      });

      if (profile) {
        // Это clientDirectory профиля - синхронизируем через профиль
        this.printInfo(`Syncing files for profile "${profile.title}" (clientDirectory: "${identifier}")...`);
        const result = await syncProfileFiles(profile.id);
        
        this.printSuccess(`Sync completed for profile "${profile.title}"`);
        this.print(`  Added: ${result.added} file(s)`);
        this.print(`  Updated: ${result.updated} file(s)`);
        this.print(`  Errors: ${result.errors} file(s)`);
      } else {
        // Это версия - синхронизируем как версию
        this.printInfo(`Syncing files for version "${identifier}"...`);
        const result = await syncVersion(identifier);
      
        this.printSuccess(`Sync completed for version "${identifier}"`);
      this.print(`  Added: ${result.added} file(s)`);
      this.print(`  Updated: ${result.updated} file(s)`);
      this.print(`  Errors: ${result.errors} file(s)`);
      }
    } catch (error: any) {
      this.printError(`Failed to sync files: ${error.message}`);
    }
  }

  private async handleVerify(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: file verify <version>');
      return;
    }

    const version = args[0];

    try {
      this.printInfo(`Verifying integrity for version "${version}"...`);
      const result = await verifyVersionIntegrity(version);
      
      this.printSuccess(`Verification completed for version "${version}"`);
      this.print(`  Total: ${result.total} file(s)`);
      this.print(`  Valid: \x1b[32m${result.valid}\x1b[0m file(s)`);
      this.print(`  Invalid: \x1b[31m${result.invalid}\x1b[0m file(s)`);
      
      if (result.invalid > 0) {
        this.printWarning('Some files failed integrity check. Review the logs for details.');
      }
    } catch (error: any) {
      this.printError(`Failed to verify files: ${error.message}`);
    }
  }

  private async handleStats(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: file stats <version>');
      return;
    }

    const version = args[0];

    try {
      const stats = await getSyncStats(version);
      
      this.print(`\x1b[1mFile Statistics for "${version}":\x1b[0m\n`);
      this.print(`  Total Files: ${stats.totalFiles}`);
      this.print(`  Verified Files: \x1b[32m${stats.verifiedFiles}\x1b[0m`);
      this.print(`  Failed Files: \x1b[31m${stats.failedFiles}\x1b[0m`);
      
      if (stats.lastSync) {
        this.print(`  Last Sync: ${this.formatDate(stats.lastSync)}`);
      } else {
        this.print(`  Last Sync: Never`);
      }
    } catch (error: any) {
      this.printError(`Failed to get file stats: ${error.message}`);
    }
  }

  private async handleList(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: file list <version>');
      return;
    }

    const version = args[0];

    try {
      const clientVersion = await prisma.clientVersion.findUnique({
        where: { version },
        include: {
          files: {
            select: {
              filePath: true,
              fileHash: true,
              fileSize: true,
              fileType: true,
              verified: true,
              integrityCheckFailed: true,
            },
            orderBy: { filePath: 'asc' },
          },
        },
      });

      if (!clientVersion) {
        this.printError(`Version "${version}" not found`);
        return;
      }

      if (clientVersion.files.length === 0) {
        this.printInfo(`No files found for version "${version}"`);
        return;
      }

      this.printTable(
        ['Path', 'Type', 'Size', 'Verified', 'Status'],
        clientVersion.files.map((f) => [
          f.filePath,
          f.fileType,
          this.formatBytes(f.fileSize),
          f.verified ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m',
          f.integrityCheckFailed ? '\x1b[31mFailed\x1b[0m' : '\x1b[32mOK\x1b[0m',
        ])
      );

      this.print(`\nTotal: ${clientVersion.files.length} file(s)`);
    } catch (error: any) {
      this.printError(`Failed to list files: ${error.message}`);
    }
  }

  private async handleDelete(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length < 2) {
      this.printError('Usage: file delete <version> <filePath>');
      this.printInfo('Example: file delete 1.12.2 libraries/net/minecraftforge/forge/1.12.2-14.23.5.2860/forge-1.12.2-14.23.5.2860.jar');
      return;
    }

    const version = args[0];
    const filePath = args.slice(1).join(' '); // Поддержка путей с пробелами

    try {
      // Найти версию
      const clientVersion = await prisma.clientVersion.findUnique({
        where: { version },
        include: {
          files: {
            where: { filePath },
          },
        },
      });

      if (!clientVersion) {
        this.printError(`Version "${version}" not found`);
        return;
      }

      if (clientVersion.files.length === 0) {
        this.printError(`File "${filePath}" not found in version "${version}"`);
        return;
      }

      const file = clientVersion.files[0];

      // Подтверждение удаления
      this.printWarning(`\n⚠️  You are about to delete file from database:`);
      this.print(`   Version: ${version}`);
      this.print(`   Path: ${filePath}`);
      this.print(`   Size: ${this.formatBytes(file.fileSize)}`);
      this.print(`   Hash: ${file.fileHash.substring(0, 16)}...`);
      
      const confirm = await this.askYesNo(rl, '\nAre you sure you want to delete this file from database?');
      if (!confirm) {
        this.printInfo('Deletion cancelled');
        return;
      }

      // Удалить файл из БД
      await prisma.clientFile.delete({
        where: { id: file.id },
      });

      this.printSuccess(`\n✅ File "${filePath}" deleted from database for version "${version}"`);
    } catch (error: any) {
      this.printError(`Failed to delete file: ${error.message}`);
    }
  }

  private async handleDeleteAll(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: file delete-all <version>');
      return;
    }

    const version = args[0];

    try {
      // Найти версию
      const clientVersion = await prisma.clientVersion.findUnique({
        where: { version },
        include: {
          files: {
            select: {
              id: true,
              filePath: true,
              fileSize: true,
            },
          },
        },
      });

      if (!clientVersion) {
        this.printError(`Version "${version}" not found`);
        return;
      }

      if (clientVersion.files.length === 0) {
        this.printInfo(`No files found for version "${version}"`);
        return;
      }

      // Подтверждение удаления
      this.printWarning(`\n⚠️  You are about to delete ALL files from database for version "${version}"`);
      this.print(`   Total files: ${clientVersion.files.length}`);
      this.print(`   Total size: ${this.formatBytes(
        clientVersion.files.reduce((sum, f) => sum + f.fileSize, BigInt(0))
      )}`);
      
      const confirm = await this.askYesNo(rl, '\nAre you sure you want to delete ALL files from database?');
      if (!confirm) {
        this.printInfo('Deletion cancelled');
        return;
      }

      // Удалить все файлы из БД
      const deleteResult = await prisma.clientFile.deleteMany({
        where: { versionId: clientVersion.id },
      });

      this.printSuccess(`\n✅ Deleted ${deleteResult.count} file(s) from database for version "${version}"`);
    } catch (error: any) {
      this.printError(`Failed to delete files: ${error.message}`);
    }
  }

  private async handleCleanup(args: string[], rl: readline.Interface): Promise<void> {
    try {
      this.printInfo('🧹 Cleaning up files with empty clientDirectory...');

      // Найти все файлы с пустым clientDirectory
      const filesWithEmptyDir = await prisma.clientFile.findMany({
        where: {
          clientDirectory: '', // Ищем файлы с пустой строкой
        },
        select: {
          id: true,
          filePath: true,
          fileSize: true,
          version: {
            select: {
              version: true,
            },
          },
        },
      });

      if (filesWithEmptyDir.length === 0) {
        this.printSuccess('✅ No files with empty clientDirectory found');
        return;
      }

      this.printWarning(`\n⚠️  Found ${filesWithEmptyDir.length} files with empty clientDirectory:`);

      // Показать первые 10 файлов
      const previewFiles = filesWithEmptyDir.slice(0, 10);
      previewFiles.forEach((file) => {
        this.print(`   ${file.version.version}: ${file.filePath} (${this.formatBytes(file.fileSize)})`);
      });

      if (filesWithEmptyDir.length > 10) {
        this.print(`   ... and ${filesWithEmptyDir.length - 10} more files`);
      }

      // Удаляем файлы с пустым clientDirectory
      this.printInfo('\n🗑️ Deleting files with empty clientDirectory...');

      const deleteResult = await prisma.clientFile.deleteMany({
        where: {
          clientDirectory: '', // Удаляем только файлы с пустой строкой
        },
      });

      this.printSuccess(`\n✅ Successfully deleted ${deleteResult.count} files with empty clientDirectory`);
      this.printInfo('💡 Note: Files with null clientDirectory (proper version files) were kept intact');
    } catch (error: any) {
      this.printError(`Failed to cleanup files: ${error.message}`);
    }
  }
}

