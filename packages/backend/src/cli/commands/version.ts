/**
 * Version Commands
 * Команды для управления версиями клиентов
 */

import readline from 'readline';
import { BaseCommand } from './base';
import { prisma } from '../../services/database';
import { syncVersion, verifyVersionIntegrity, getSyncStats } from '../../services/fileSyncService';
import { ClientVersionService } from '../../services/clientVersionService';

export class VersionCommands extends BaseCommand {
  getNames(): string[] {
    return ['version'];
  }

  getDescription(): string {
    return 'Client version management commands';
  }

  getUsage(): string {
    return `version list [--all] - List all client versions (--all includes disabled)
version info <version> - Show version information
version sync <version> - Sync files for version from updates directory
version verify <version> - Verify integrity of all files for version
version stats <version> - Show sync statistics for version
version enable <version> - Enable version
version disable <version> - Disable version`;
  }

  getExamples(): string[] {
    return [
      'version list',
      'version list --all',
      'version info 1.12.2',
      'version sync 1.12.2',
      'version verify 1.12.2',
      'version stats 1.12.2',
      'version enable 1.12.2',
      'version disable 1.12.2',
    ];
  }

  async execute(args: string[], rl: readline.Interface, commandName?: string): Promise<void> {
    if (args.length === 0) {
      this.printError('Subcommand required. Use "version list", "version sync", etc.');
      this.printInfo('Type "help version" for usage information');
      return;
    }

    const subcommand = args[0].toLowerCase();

    switch (subcommand) {
      case 'list':
        await this.handleList(args.slice(1));
        break;
      case 'info':
        await this.handleInfo(args.slice(1));
        break;
      case 'sync':
        await this.handleSync(args.slice(1));
        break;
      case 'verify':
        await this.handleVerify(args.slice(1));
        break;
      case 'stats':
        await this.handleStats(args.slice(1));
        break;
      case 'enable':
        await this.handleEnable(args.slice(1));
        break;
      case 'disable':
        await this.handleDisable(args.slice(1));
        break;
      default:
        this.printError(`Unknown subcommand: ${subcommand}`);
        this.printInfo('Type "help version" for usage information');
    }
  }

  private async handleList(args: string[]): Promise<void> {
    const showAll = args.includes('--all');

    try {
      const versions = await prisma.clientVersion.findMany({
        where: showAll ? {} : { enabled: true },
        select: {
          id: true,
          version: true,
          title: true,
          enabled: true,
          isDefault: true,
          createdAt: true,
          _count: {
            select: {
              files: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (versions.length === 0) {
        this.printInfo('No versions found');
        return;
      }

      this.printTable(
        ['Version', 'Title', 'Files', 'Default', 'Enabled', 'Created'],
        versions.map((v) => [
          v.version,
          v.title,
          v._count.files.toString(),
          v.isDefault ? '\x1b[33mYes\x1b[0m' : 'No',
          v.enabled ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m',
          this.formatDate(v.createdAt),
        ])
      );

      this.print(`\nTotal: ${versions.length} version(s)`);
    } catch (error: any) {
      this.printError(`Failed to list versions: ${error.message}`);
    }
  }

  private async handleInfo(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: version info <version>');
      return;
    }

    const version = args[0];

    try {
      const versionInfo = await ClientVersionService.getVersionByVersion(version);

      if (!versionInfo) {
        this.printError(`Version "${version}" not found`);
        return;
      }

      this.print(`\x1b[1mVersion Information:\x1b[0m\n`);
      this.print(`  Version: ${versionInfo.version}`);
      this.print(`  Title: ${versionInfo.title}`);
      this.print(`  ID: ${versionInfo.id}`);
      this.print(`  Enabled: ${versionInfo.enabled ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`);
      this.print(`  Main Class: ${versionInfo.mainClass}`);
      this.print(`  JVM Version: ${versionInfo.jvmVersion}`);
      this.print(`  Client JAR: ${versionInfo.clientJarPath} (${this.formatBytes(BigInt(versionInfo.clientJarSize))})`);
      this.print(`  Files: ${versionInfo.files.length}`);
      
      if (versionInfo.description) {
        this.print(`  Description: ${versionInfo.description}`);
      }

      // Show file types breakdown
      const fileTypes = versionInfo.files.reduce((acc, file) => {
        acc[file.fileType] = (acc[file.fileType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      if (Object.keys(fileTypes).length > 0) {
        this.print(`\n  File Types:`);
        Object.entries(fileTypes).forEach(([type, count]) => {
          this.print(`    ${type}: ${count}`);
        });
      }
    } catch (error: any) {
      this.printError(`Failed to get version info: ${error.message}`);
    }
  }

  private async handleSync(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: version sync <version>');
      return;
    }

    const version = args[0];

    try {
      this.printInfo(`Syncing files for version "${version}"...`);
      const result = await syncVersion(version);
      
      this.printSuccess(`Sync completed for version "${version}"`);
      this.print(`  Added: ${result.added} file(s)`);
      this.print(`  Updated: ${result.updated} file(s)`);
      this.print(`  Errors: ${result.errors} file(s)`);
    } catch (error: any) {
      this.printError(`Failed to sync version: ${error.message}`);
    }
  }

  private async handleVerify(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: version verify <version>');
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
      this.printError(`Failed to verify version: ${error.message}`);
    }
  }

  private async handleStats(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: version stats <version>');
      return;
    }

    const version = args[0];

    try {
      const stats = await getSyncStats(version);
      
      this.print(`\x1b[1mSync Statistics for "${version}":\x1b[0m\n`);
      this.print(`  Total Files: ${stats.totalFiles}`);
      this.print(`  Verified Files: \x1b[32m${stats.verifiedFiles}\x1b[0m`);
      this.print(`  Failed Files: \x1b[31m${stats.failedFiles}\x1b[0m`);
      
      if (stats.lastSync) {
        this.print(`  Last Sync: ${this.formatDate(stats.lastSync)}`);
      } else {
        this.print(`  Last Sync: Never`);
      }
    } catch (error: any) {
      this.printError(`Failed to get stats: ${error.message}`);
    }
  }

  private async handleEnable(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: version enable <version>');
      return;
    }

    const version = args[0];

    try {
      const clientVersion = await prisma.clientVersion.findUnique({
        where: { version },
      });

      if (!clientVersion) {
        this.printError(`Version "${version}" not found`);
        return;
      }

      if (clientVersion.enabled) {
        this.printWarning(`Version "${version}" is already enabled`);
        return;
      }

      await prisma.clientVersion.update({
        where: { version },
        data: { enabled: true },
      });

      this.printSuccess(`Version "${version}" has been enabled`);
    } catch (error: any) {
      this.printError(`Failed to enable version: ${error.message}`);
    }
  }

  private async handleDisable(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: version disable <version>');
      return;
    }

    const version = args[0];

    try {
      const clientVersion = await prisma.clientVersion.findUnique({
        where: { version },
      });

      if (!clientVersion) {
        this.printError(`Version "${version}" not found`);
        return;
      }

      if (!clientVersion.enabled) {
        this.printWarning(`Version "${version}" is already disabled`);
        return;
      }

      await prisma.clientVersion.update({
        where: { version },
        data: { enabled: false },
      });

      this.printSuccess(`Version "${version}" has been disabled`);
    } catch (error: any) {
      this.printError(`Failed to disable version: ${error.message}`);
    }
  }
}

