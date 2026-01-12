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
    // Поддерживаем как короткие команды, так и пространство имён "system"
    // Примеры:
    //   help profile       -> детальная справка по profile
    //   system status      -> статус системы
    //   system dashboard   -> дашборд
    //   clear / cls        -> очистка консоли
    return ['system', 'help', 'status', 'clear', 'cls'];
  }

  getDescription(): string {
    return 'System management commands';
  }

  getUsage(): string {
    return `help [command] - Show help for all commands or specific command
status - Show system status
dashboard - Show system dashboard
clear/cls - Clear console`;
  }

  getExamples(): string[] {
    return ['help', 'help user', 'status'];
  }

  async execute(args: string[], rl: readline.Interface, commandName?: string): Promise<void> {
    const sub = args[0]?.toLowerCase();

    // Если вызвана как "status" без аргументов
    if (commandName === 'status' && args.length === 0) {
      await this.handleStatus();
      return;
    }

    // Если вызвана как "dashboard" без аргументов
    if (commandName === 'dashboard' && args.length === 0) {
      await this.handleDashboard();
      return;
    }

    // Если вызвана как "clear" или "cls" без аргументов
    if ((commandName === 'clear' || commandName === 'cls') && args.length === 0) {
      process.stdout.write('\x1b[2J\x1b[0f');
      return;
    }

    // Нет аргументов: показать общий help
    if (!sub) {
      await this.handleHelp([], rl);
      return;
    }

    // Системные подкоманды, когда вызываем как "system <sub>"
    if (sub === 'status') {
      await this.handleStatus();
      return;
    }
    if (sub === 'dashboard') {
      await this.handleDashboard();
      return;
    }
    if (sub === 'clear' || sub === 'cls') {
      process.stdout.write('\x1b[2J\x1b[0f');
      return;
    }

    // Во всех остальных случаях трактуем как "help <command>"
    await this.handleHelp(args, rl);
  }

  private async handleHelp(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();

      // Ручной подробный help для ключевых команд (profile, client, assets, file)
      switch (commandName) {
        case 'profile':
          console.log('\x1b[1mCommand:\x1b[0m profile');
          console.log('\x1b[1mDescription:\x1b[0m Client profile management commands');
          console.log('\x1b[1mUsage:\x1b[0m');
          console.log('  profile list [--all] - List all profiles (--all includes disabled)');
          console.log('  profile info <id> - Show profile information');
          console.log('  profile add <title> <loader> <version> [serverAddress] [serverPort] - Create new profile');
          console.log('  profile sync <id> - Sync client files for profile from updates directory');
          console.log('  profile set-jvm <id> <version> - Set Java version for profile (e.g., 8, 16, 17, 21)');
          console.log('  profile enable <id> - Enable profile');
          console.log('  profile disable <id> - Disable profile');
          console.log('  profile delete <id> - Delete profile');
          console.log('\x1b[1mExamples:\x1b[0m');
          console.log('  profile list');
          console.log('  profile list --all');
          console.log('  profile info <profile-id>');
          console.log('  profile add "HiTech" Forge 1.12.2');
          console.log('  profile add "My Server" Fabric 1.20.1 192.168.1.100 25565');
          console.log('  profile set-jvm <profile-id> 16');
          console.log('  profile sync <profile-id>');
          return;
        case 'client':
          console.log('\x1b[1mCommand:\x1b[0m client');
          console.log('\x1b[1mDescription:\x1b[0m Client download and management commands');
          console.log('\x1b[1mUsage:\x1b[0m');
          console.log('  client download <title> <loader> <version> [serverAddress] [serverPort]');
          console.log('  client list');
          console.log('\x1b[1mExamples:\x1b[0m');
          console.log('  client download "My Vanilla" Vanilla 1.21.0');
          console.log('  client download "Forge Server" Forge 1.12.2');
          console.log('  client download "Fabric Client" Fabric 1.20.1');
          console.log('  client download "My Server" Vanilla 1.20.4 192.168.1.100 25565');
          console.log('  client list');
          return;
        case 'assets':
          console.log('\x1b[1mCommand:\x1b[0m assets');
          console.log('\x1b[1mDescription:\x1b[0m Minecraft assets management commands');
          console.log('\x1b[1mUsage:\x1b[0m');
          console.log('  assets download <version> - Download assets for a specific Minecraft version');
          console.log('  assets list - List all downloaded asset indexes');
          console.log('  assets check <version> - Check if assets are downloaded for a version');
          console.log('\x1b[1mExamples:\x1b[0m');
          console.log('  assets download 1.12.2');
          console.log('  assets download 1.20.4');
          console.log('  assets list');
          console.log('  assets check 1.12.2');
          return;
        case 'file':
          console.log('\x1b[1mCommand:\x1b[0m file');
          console.log('\x1b[1mDescription:\x1b[0m File management and synchronization commands');
          console.log('\x1b[1mUsage:\x1b[0m');
          console.log('  file sync <version|clientDirectory> - Sync files for version or specific client');
          console.log('  file verify <version> - Verify integrity of all files for version');
          console.log('  file stats <version> - Show sync statistics for version');
          console.log('  file list <version> - List all files for version');
          console.log('  file delete <version> <filePath> - Delete file from database');
          console.log('  file delete-all <version> - Delete all files for version from database');
          console.log('\x1b[1mExamples:\x1b[0m');
          console.log('  file sync 1.12.2');
          console.log('  file sync hitech');
          console.log('  file verify 1.12.2');
          console.log('  file stats 1.12.2');
          console.log('  file list 1.12.2');
          console.log('  file delete 1.12.2 libraries/.../forge-1.12.2-14.23.5.2860.jar');
          console.log('  file delete-all 1.12.2');
          console.log('  file cleanup - Remove files with empty clientDirectory from database');
          return;
        case 'user':
          console.log('\x1b[1mCommand:\x1b[0m user');
          console.log('\x1b[1mDescription:\x1b[0m User management commands');
          console.log('\x1b[1mUsage:\x1b[0m');
          console.log('  user list [--all] - List all users (--all includes banned)');
          console.log('  user create <username> <password> [--email <email>] [--role <USER|ADMIN>] - Create new user');
          console.log('  user delete <username> - Delete user');
          console.log('  user ban <username> [--reason <reason>] - Ban user');
          console.log('  user unban <username> - Unban user');
          console.log('  user role <username> <USER|ADMIN> - Change user role');
          console.log('  user info <username> - Show user information');
          console.log('\x1b[1mExamples:\x1b[0m');
          console.log('  user list');
          console.log('  user list --all');
          console.log('  user create testuser password123');
          console.log('  user create admin admin123 --role ADMIN');
          console.log('  user ban testuser --reason "Violation of rules"');
          console.log('  user unban testuser');
          console.log('  user role testuser ADMIN');
          console.log('  user info testuser');
          return;
        default:
          this.printError(`Unknown command: ${commandName}`);
          this.printInfo('Use "help" without arguments to see all commands');
          return;
      }
    }

    // Общий список команд по категориям
    this.print('\x1b[1mAvailable Commands:\x1b[0m\n');

    const categories = [
      { name: 'System', commands: ['help', 'status', 'dashboard', 'clear'] },
      { name: 'Users', commands: ['user list', 'user create', 'user delete', 'user ban', 'user unban', 'user role'] },
      { name: 'Profiles', commands: ['profile list', 'profile info', 'profile add', 'profile sync', 'profile set-jvm', 'profile enable', 'profile disable', 'profile delete'] },
      { name: 'Client Download', commands: ['client download', 'client list'] },
      { name: 'Client Versions', commands: ['version list', 'version sync', 'version verify', 'version stats'] },
      { name: 'Files', commands: ['file sync', 'file verify', 'file stats', 'file list', 'file delete', 'file delete-all', 'file cleanup'] },
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

  private async handleDashboard(): Promise<void> {
    try {
      this.print('\x1b[1mSystem Dashboard:\x1b[0m\n');

      const [
        userCount,
        profileCount,
        versionCount,
        launcherVersionCount,
        crashCount,
        launchCount,
        recentProfiles,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.clientProfile.count(),
        prisma.clientVersion.count(),
        prisma.launcherVersion.count({ where: { enabled: true } }),
        prisma.gameCrash.count(),
        prisma.gameLaunch.count(),
        prisma.clientProfile.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, title: true, version: true, clientDirectory: true, enabled: true },
        }),
      ]);

      console.log('\x1b[36mOverview:\x1b[0m');
      console.log(`  Users:             ${userCount}`);
      console.log(`  Profiles:          ${profileCount}`);
      console.log(`  Client Versions:   ${versionCount}`);
      console.log(`  Launcher Versions: ${launcherVersionCount}`);
      console.log(`  Total Launches:    ${launchCount}`);
      console.log(`  Total Crashes:     ${crashCount}\n`);

      console.log('\x1b[36mRecent Profiles:\x1b[0m');
      if (recentProfiles.length === 0) {
        console.log('  No profiles found');
      } else {
        recentProfiles.forEach((p) => {
          const statusLabel = p.enabled ? '\x1b[32mENABLED\x1b[0m' : '\x1b[31mDISABLED\x1b[0m';
          const dir = p.clientDirectory || p.version;
          console.log(`  [${statusLabel}] ${p.title} (v${p.version}, dir: ${dir})`);
        });
      }

      console.log('\n\x1b[36mShortcuts:\x1b[0m');
      console.log('  profile list      - list all profiles');
      console.log('  client list       - list auto-downloaded clients');
      console.log('  stats launches    - detailed launch statistics');
      console.log('  stats crashes     - detailed crash statistics');
    } catch (error: any) {
      this.printError(`Failed to show dashboard: ${error.message}`);
      logger.error('Dashboard command error:', error);
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

