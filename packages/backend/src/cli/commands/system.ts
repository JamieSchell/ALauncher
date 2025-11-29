/**
 * System Commands
 * Команды для управления системой
 */

import readline from 'readline';
import { BaseCommand } from './base';
import { prisma } from '../../services/database';
import { logger } from '../../utils/logger';

export class SystemCommands extends BaseCommand {
  getNames(): string[] {
    return ['help', 'status', 'clear', 'cls'];
  }

  getDescription(): string {
    return 'System management commands';
  }

  getUsage(): string {
    return `help [command] - Show help for all commands or specific command
status - Show system status
clear/cls - Clear console`;
  }

  getExamples(): string[] {
    return ['help', 'help user', 'status'];
  }

  async execute(args: string[], rl: readline.Interface): Promise<void> {
    const command = args[0]?.toLowerCase();

    switch (command) {
      case 'help':
        await this.handleHelp(args.slice(1), rl);
        break;
      case 'status':
        await this.handleStatus();
        break;
      case 'clear':
      case 'cls':
        process.stdout.write('\x1b[2J\x1b[0f');
        break;
      default:
        if (!command) {
          await this.handleHelp([], rl);
        } else {
          this.printError(`Unknown system command: ${command}`);
        }
    }
  }

  private async handleHelp(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length > 0) {
      // Show help for specific command
      const commandName = args[0].toLowerCase();
      // This will be handled by the registry
      this.printInfo(`Help for command: ${commandName}`);
      this.print('Use "help" without arguments to see all commands');
    } else {
      // Show all commands
      this.print('\x1b[1mAvailable Commands:\x1b[0m\n');
      
      const categories = [
        { name: 'System', commands: ['help', 'status', 'clear'] },
        { name: 'Users', commands: ['user list', 'user create', 'user delete', 'user ban', 'user unban', 'user role'] },
        { name: 'Profiles', commands: ['profile list', 'profile create', 'profile delete', 'profile enable', 'profile disable'] },
        { name: 'Client Download', commands: ['client download', 'client list'] },
        { name: 'Client Versions', commands: ['version list', 'version sync', 'version verify', 'version stats'] },
        { name: 'Files', commands: ['file sync', 'file verify', 'file stats', 'file list', 'file delete', 'file delete-all'] },
        { name: 'Assets', commands: ['assets download', 'assets list', 'assets check'] },
        { name: 'Launcher', commands: ['launcher list', 'launcher create', 'launcher enable', 'launcher disable'] },
        { name: 'Notifications', commands: ['notify send', 'notify list', 'notify clear'] },
        { name: 'Statistics', commands: ['stats users', 'stats launches', 'stats crashes'] },
      ];

      categories.forEach((category) => {
        console.log(`\x1b[36m${category.name}:\x1b[0m`);
        category.commands.forEach((cmd) => {
          console.log(`  ${cmd}`);
        });
        console.log('');
      });

      this.print('\x1b[33mTip:\x1b[0m Type "help <command>" for detailed help on a specific command');
      this.print('Type "exit" or "quit" to close the CLI\n');
    }
  }

  private async handleStatus(): Promise<void> {
    try {
      // Database status
      await prisma.$queryRaw`SELECT 1`;
      this.printSuccess('Database: Connected');

      // Get statistics
      const [userCount, profileCount, versionCount, launcherVersionCount] = await Promise.all([
        prisma.user.count(),
        prisma.clientProfile.count(),
        prisma.clientVersion.count(),
        prisma.launcherVersion.count({ where: { enabled: true } }),
      ]);

      this.print('\x1b[1mSystem Statistics:\x1b[0m');
      this.print(`  Users: ${userCount}`);
      this.print(`  Profiles: ${profileCount}`);
      this.print(`  Client Versions: ${versionCount}`);
      this.print(`  Launcher Versions (enabled): ${launcherVersionCount}`);

      // Memory usage
      const memUsage = process.memoryUsage();
      this.print('\x1b[1mMemory Usage:\x1b[0m');
      this.print(`  RSS: ${this.formatBytes(memUsage.rss)}`);
      this.print(`  Heap Used: ${this.formatBytes(memUsage.heapUsed)}`);
      this.print(`  Heap Total: ${this.formatBytes(memUsage.heapTotal)}`);

      // Uptime
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      this.print(`\n\x1b[1mUptime:\x1b[0m ${hours}h ${minutes}m ${seconds}s`);
    } catch (error: any) {
      this.printError(`Failed to get status: ${error.message}`);
      logger.error('Status command error:', error);
    }
  }
}

