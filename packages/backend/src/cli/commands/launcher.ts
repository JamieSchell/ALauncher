/**
 * Launcher Commands
 * Команды для управления версиями лаунчера
 */

import readline from 'readline';
import { BaseCommand } from './base';
import { prisma } from '../../services/database';
import { LauncherUpdateService } from '../../services/launcherUpdateService';

export class LauncherCommands extends BaseCommand {
  getNames(): string[] {
    return ['launcher'];
  }

  getDescription(): string {
    return 'Launcher version management commands';
  }

  getUsage(): string {
    return `launcher list [--all] - List all launcher versions (--all includes disabled)
launcher info <version> - Show launcher version information
launcher create <version> [--url <url>] [--required] - Create new launcher version
launcher enable <version> - Enable launcher version
launcher disable <version> - Disable launcher version
launcher delete <version> - Delete launcher version`;
  }

  getExamples(): string[] {
    return [
      'launcher list',
      'launcher list --all',
      'launcher info 1.0.224',
      'launcher create 1.0.225 --url http://example.com/launcher.exe',
      'launcher enable 1.0.225',
      'launcher disable 1.0.224',
    ];
  }

  async execute(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length === 0) {
      this.printError('Subcommand required. Use "launcher list", "launcher create", etc.');
      this.printInfo('Type "help launcher" for usage information');
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
      case 'create':
        await this.handleCreate(args.slice(1), rl);
        break;
      case 'enable':
        await this.handleEnable(args.slice(1));
        break;
      case 'disable':
        await this.handleDisable(args.slice(1));
        break;
      case 'delete':
        await this.handleDelete(args.slice(1), rl);
        break;
      default:
        this.printError(`Unknown subcommand: ${subcommand}`);
        this.printInfo('Type "help launcher" for usage information');
    }
  }

  private async handleList(args: string[]): Promise<void> {
    const showAll = args.includes('--all');

    try {
      const versions = await prisma.launcherVersion.findMany({
        where: showAll ? {} : { enabled: true },
        select: {
          version: true,
          downloadUrl: true,
          fileSize: true,
          isRequired: true,
          enabled: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (versions.length === 0) {
        this.printInfo('No launcher versions found');
        return;
      }

      this.printTable(
        ['Version', 'Size', 'Required', 'Enabled', 'URL', 'Created'],
        versions.map((v) => [
          v.version,
          v.fileSize ? this.formatBytes(v.fileSize) : '-',
          v.isRequired ? '\x1b[33mYes\x1b[0m' : 'No',
          v.enabled ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m',
          v.downloadUrl ? (v.downloadUrl.length > 40 ? v.downloadUrl.substring(0, 37) + '...' : v.downloadUrl) : '-',
          this.formatDate(v.createdAt),
        ])
      );

      this.print(`\nTotal: ${versions.length} version(s)`);
    } catch (error: any) {
      this.printError(`Failed to list launcher versions: ${error.message}`);
    }
  }

  private async handleInfo(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: launcher info <version>');
      return;
    }

    const version = args[0];

    try {
      const versionInfo = await LauncherUpdateService.getVersionInfo(version);

      if (!versionInfo) {
        this.printError(`Launcher version "${version}" not found`);
        return;
      }

      // Get full version info from database
      const dbVersion = await prisma.launcherVersion.findUnique({
        where: { version },
      });

      this.print(`\x1b[1mLauncher Version Information:\x1b[0m\n`);
      this.print(`  Version: ${versionInfo.version}`);
      this.print(`  Enabled: ${dbVersion?.enabled ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`);
      this.print(`  Required: ${versionInfo.isRequired ? '\x1b[33mYes\x1b[0m' : 'No'}`);
      
      if (versionInfo.downloadUrl) {
        this.print(`  Download URL: ${versionInfo.downloadUrl}`);
      }
      
      if (versionInfo.fileSize) {
        this.print(`  File Size: ${this.formatBytes(Number(versionInfo.fileSize))}`);
      }
      
      if (versionInfo.fileHash) {
        this.print(`  File Hash: ${versionInfo.fileHash}`);
      }
      
      if (versionInfo.releaseNotes) {
        this.print(`  Release Notes: ${versionInfo.releaseNotes}`);
      }
      
      if (versionInfo.createdAt) {
        this.print(`  Created: ${this.formatDate(versionInfo.createdAt)}`);
      }
    } catch (error: any) {
      this.printError(`Failed to get launcher version info: ${error.message}`);
    }
  }

  private async handleCreate(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: launcher create <version> [--url <url>] [--required]');
      return;
    }

    const version = args[0];
    let downloadUrl: string | undefined;
    let isRequired = false;

    // Parse optional arguments
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--url' && i + 1 < args.length) {
        downloadUrl = args[++i];
      } else if (args[i] === '--required') {
        isRequired = true;
      }
    }

    try {
      // Check if version exists
      const existing = await prisma.launcherVersion.findUnique({
        where: { version },
      });

      if (existing) {
        this.printError(`Launcher version "${version}" already exists`);
        return;
      }

      const launcherVersion = await prisma.launcherVersion.create({
        data: {
          version,
          downloadUrl: downloadUrl || null,
          isRequired,
          enabled: true,
        },
      });

      this.printSuccess(`Launcher version "${version}" created successfully`);
      this.print(`  ID: ${launcherVersion.id}`);
      if (downloadUrl) {
        this.print(`  Download URL: ${downloadUrl}`);
      }
      this.print(`  Required: ${isRequired ? 'Yes' : 'No'}`);
    } catch (error: any) {
      this.printError(`Failed to create launcher version: ${error.message}`);
    }
  }

  private async handleEnable(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: launcher enable <version>');
      return;
    }

    const version = args[0];

    try {
      const launcherVersion = await prisma.launcherVersion.findUnique({
        where: { version },
      });

      if (!launcherVersion) {
        this.printError(`Launcher version "${version}" not found`);
        return;
      }

      if (launcherVersion.enabled) {
        this.printWarning(`Launcher version "${version}" is already enabled`);
        return;
      }

      await prisma.launcherVersion.update({
        where: { version },
        data: { enabled: true },
      });

      this.printSuccess(`Launcher version "${version}" has been enabled`);
    } catch (error: any) {
      this.printError(`Failed to enable launcher version: ${error.message}`);
    }
  }

  private async handleDisable(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: launcher disable <version>');
      return;
    }

    const version = args[0];

    try {
      const launcherVersion = await prisma.launcherVersion.findUnique({
        where: { version },
      });

      if (!launcherVersion) {
        this.printError(`Launcher version "${version}" not found`);
        return;
      }

      if (!launcherVersion.enabled) {
        this.printWarning(`Launcher version "${version}" is already disabled`);
        return;
      }

      await prisma.launcherVersion.update({
        where: { version },
        data: { enabled: false },
      });

      this.printSuccess(`Launcher version "${version}" has been disabled`);
    } catch (error: any) {
      this.printError(`Failed to disable launcher version: ${error.message}`);
    }
  }

  private async handleDelete(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: launcher delete <version>');
      return;
    }

    const version = args[0];

    try {
      const launcherVersion = await prisma.launcherVersion.findUnique({
        where: { version },
      });

      if (!launcherVersion) {
        this.printError(`Launcher version "${version}" not found`);
        return;
      }

      const confirmed = await this.askYesNo(
        rl,
        `Are you sure you want to delete launcher version "${version}"? This action cannot be undone.`
      );

      if (!confirmed) {
        this.printInfo('Deletion cancelled');
        return;
      }

      await prisma.launcherVersion.delete({
        where: { version },
      });

      this.printSuccess(`Launcher version "${version}" deleted successfully`);
    } catch (error: any) {
      this.printError(`Failed to delete launcher version: ${error.message}`);
    }
  }
}

