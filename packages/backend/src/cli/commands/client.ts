/**
 * Client Download Commands
 * Команды для автоматического скачивания клиентов с официальных сайтов
 */

import readline from 'readline';
import { BaseCommand } from './base';
import { downloadAndCreateClient } from '../../services/clientDownloadService';
import { prisma } from '../../services/database';

export class ClientCommands extends BaseCommand {
  getNames(): string[] {
    return ['client'];
  }

  getDescription(): string {
    return 'Client download and management commands';
  }

  getUsage(): string {
    return `client download <title> <loader> <version> [serverAddress] [serverPort] - Download client from official sources and create profile
client list - List all downloaded clients`;
  }

  getExamples(): string[] {
    return [
      'client download "My Vanilla" Vanilla 1.21.0',
      'client download "Forge Server" Forge 1.12.2',
      'client download "Fabric Client" Fabric 1.20.1',
      'client download "My Server" Vanilla 1.20.4 192.168.1.100 25565',
      'client list',
    ];
  }

  async execute(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length === 0) {
      this.printError('Usage: client <command>');
      this.printInfo('Commands: download, list');
      return;
    }

    const command = args[0].toLowerCase();

    switch (command) {
      case 'download':
        await this.handleDownload(args.slice(1), rl);
        break;
      case 'list':
        await this.handleList(args.slice(1), rl);
        break;
      default:
        this.printError(`Unknown command: ${command}`);
        this.printInfo('Available commands: download, list');
    }
  }

  private async handleDownload(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length < 3) {
      this.printError('Usage: client download <title> <loader> <version> [serverAddress] [serverPort]');
      this.printInfo('Example: client download "My Vanilla" Vanilla 1.21.0');
      this.printInfo('Example: client download "Forge Server" Forge 1.12.2 192.168.1.100 25565');
      this.printInfo('\nSupported loaders: Vanilla, Forge, Fabric');
      return;
    }

    const title = args[0];
    const loader = args[1];
    const version = args[2];
    const serverAddress = args[3];
    const serverPort = args[4] ? parseInt(args[4], 10) : undefined;

    // Валидация loader
    const validLoaders = ['Vanilla', 'Forge', 'Fabric'];
    if (!validLoaders.includes(loader)) {
      this.printError(`Invalid loader: ${loader}`);
      this.printInfo(`Supported loaders: ${validLoaders.join(', ')}`);
      return;
    }

    // Валидация serverPort
    if (serverPort !== undefined && (isNaN(serverPort) || serverPort < 1 || serverPort > 65535)) {
      this.printError(`Invalid server port: ${args[4]}. Must be between 1 and 65535.`);
      return;
    }

    try {
      this.printInfo(`\n🎮 Starting download of ${loader} client ${version}...`);
      this.print(`   Title: ${title}`);
      if (serverAddress) {
        this.print(`   Server: ${serverAddress}:${serverPort || 25565}`);
      }
      this.print('');

      let lastProgress = -1;
      let lastStage = '';

      const result = await downloadAndCreateClient(
        title,
        loader as 'Vanilla' | 'Forge' | 'Fabric',
        version,
        serverAddress,
        serverPort,
        (stage, progress, message) => {
          // Обновлять прогресс только если изменился
          if (stage !== lastStage || Math.floor(progress / 5) !== Math.floor(lastProgress / 5)) {
            const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
            process.stdout.write(`\r   [${progressBar}] ${progress}% - ${message}   `);
            lastProgress = progress;
            lastStage = stage;
          }
        }
      );

      process.stdout.write('\n'); // Новая строка после прогресса

      this.printSuccess(`\n✅ Client "${title}" downloaded and created successfully!`);
      this.print(`   Profile ID: ${result.profileId}`);
      this.print(`   Client Directory: ${result.clientDir}`);
      
      const path = require('path');
      const { config } = require('../../config');
      const fullPath = path.join(config.paths.updates, result.clientDir);
      this.print(`   Location: ${fullPath}`);
      this.print('\n📝 Next steps:');
      this.print(`   1. Add mods to: updates/${result.clientDir}/mods/`);
      this.print(`   2. Configure server: profile info ${result.profileId}`);
      this.print(`   3. Sync files: profile sync ${result.profileId}`);

      if (loader === 'Forge' || loader === 'Fabric') {
        this.printSuccess(`\n✅ ${loader} loader has been automatically installed!`);
        this.print(`   The client is ready to use. Just add your mods to the mods folder.`);
      }

    } catch (error: any) {
      this.printError(`Failed to download client: ${error.message}`);
      if (error.stack) {
        this.printError(`Stack: ${error.stack}`);
      }
    }
  }

  private async handleList(args: string[], rl: readline.Interface): Promise<void> {
    try {
      // Получить все профили и отфильтровать по тегам
      const allProfiles = await prisma.clientProfile.findMany({
        orderBy: { sortIndex: 'asc' },
        select: {
          id: true,
          title: true,
          version: true,
          clientDirectory: true,
          enabled: true,
          createdAt: true,
          tags: true,
        },
      });

      // Отфильтровать профили с тегом AUTO-DOWNLOADED
      const profiles = allProfiles.filter(profile => {
        const tags = profile.tags as string[] | null;
        return tags && tags.includes('AUTO-DOWNLOADED');
      });

      if (profiles.length === 0) {
        this.printInfo('No auto-downloaded clients found.');
        return;
      }

      this.printInfo(`\n📦 Auto-downloaded clients (${profiles.length}):\n`);

      const headers = ['ID', 'Title', 'Version', 'Directory', 'Status', 'Created'];
      const rows = profiles.map((profile) => [
        profile.id.substring(0, 8) + '...',
        profile.title,
        profile.version,
        profile.clientDirectory || profile.version,
        profile.enabled ? '✓ Enabled' : '✗ Disabled',
        new Date(profile.createdAt).toLocaleDateString(),
      ]);

      this.printTable(headers, rows);
      this.print(`\n💡 Use "profile info <id>" to see full details`);
      this.print(`💡 Use "profile sync <id>" to sync files with database`);

    } catch (error: any) {
      this.printError(`Failed to list clients: ${error.message}`);
    }
  }
}

