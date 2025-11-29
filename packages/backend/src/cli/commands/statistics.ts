/**
 * Statistics Commands
 * Команды для просмотра статистики
 */

import readline from 'readline';
import { BaseCommand } from './base';
import { prisma } from '../../services/database';

export class StatisticsCommands extends BaseCommand {
  getNames(): string[] {
    return ['stats', 'statistics'];
  }

  getDescription(): string {
    return 'Statistics and monitoring commands';
  }

  getUsage(): string {
    return `stats users - Show user statistics
stats launches [--days <n>] - Show game launch statistics
stats crashes [--days <n>] - Show crash statistics
stats sessions [--days <n>] - Show game session statistics
stats errors [--days <n>] - Show launcher error statistics`;
  }

  getExamples(): string[] {
    return [
      'stats users',
      'stats launches',
      'stats launches --days 7',
      'stats crashes --days 30',
      'stats sessions',
      'stats errors',
    ];
  }

  async execute(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length === 0) {
      this.printError('Subcommand required. Use "stats users", "stats launches", etc.');
      this.printInfo('Type "help stats" for usage information');
      return;
    }

    const subcommand = args[0].toLowerCase();

    switch (subcommand) {
      case 'users':
        await this.handleUsers();
        break;
      case 'launches':
        await this.handleLaunches(args.slice(1));
        break;
      case 'crashes':
        await this.handleCrashes(args.slice(1));
        break;
      case 'sessions':
        await this.handleSessions(args.slice(1));
        break;
      case 'errors':
        await this.handleErrors(args.slice(1));
        break;
      default:
        this.printError(`Unknown subcommand: ${subcommand}`);
        this.printInfo('Type "help stats" for usage information');
    }
  }

  private async handleUsers(): Promise<void> {
    try {
      const [total, active, banned, admins] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            lastLogin: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
        prisma.user.count({ where: { banned: true } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
      ]);

      this.print(`\x1b[1mUser Statistics:\x1b[0m\n`);
      this.print(`  Total Users: ${total}`);
      this.print(`  Active (last 30 days): ${active}`);
      this.print(`  Banned: \x1b[31m${banned}\x1b[0m`);
      this.print(`  Administrators: ${admins}`);
      this.print(`  Regular Users: ${total - admins}`);
    } catch (error: any) {
      this.printError(`Failed to get user statistics: ${error.message}`);
    }
  }

  private async handleLaunches(args: string[]): Promise<void> {
    const days = this.parseDays(args);

    try {
      const where: any = {};
      if (days) {
        where.createdAt = {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        };
      }

      const [total, byProfile, byVersion] = await Promise.all([
        prisma.gameLaunch.count({ where }),
        prisma.gameLaunch.groupBy({
          by: ['profileId'],
          where,
          _count: true,
          orderBy: { _count: { profileId: 'desc' } },
          take: 10,
        }),
        prisma.gameLaunch.groupBy({
          by: ['profileVersion'],
          where,
          _count: {
            profileVersion: true,
          },
          orderBy: {
            _count: {
              profileVersion: 'desc',
            },
          },
          take: 10,
        }),
      ]);

      this.print(`\x1b[1mGame Launch Statistics${days ? ` (last ${days} days)` : ''}:\x1b[0m\n`);
      this.print(`  Total Launches: ${total}`);

      if (byProfile.length > 0) {
        this.print(`\n  Top Profiles:`);
        for (const item of byProfile) {
          const profileId = item.profileId as string | null;
          if (profileId) {
            const profile = await prisma.clientProfile.findUnique({
              where: { id: profileId },
              select: { title: true },
            });
            const count = (item._count as any).profileId || 0;
            this.print(`    ${profile?.title || profileId}: ${count}`);
          }
        }
      }

      if (byVersion.length > 0) {
        this.print(`\n  Top Versions:`);
        for (const item of byVersion) {
          const profileVersion = item.profileVersion as string | null;
          if (profileVersion) {
            const count = (item._count as any).profileVersion || 0;
            this.print(`    ${profileVersion}: ${count}`);
          }
        }
      }
    } catch (error: any) {
      this.printError(`Failed to get launch statistics: ${error.message}`);
    }
  }

  private async handleCrashes(args: string[]): Promise<void> {
    const days = this.parseDays(args);

    try {
      const where: any = {};
      if (days) {
        where.createdAt = {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        };
      }

      const [total, byProfile, recent] = await Promise.all([
        prisma.gameCrash.count({ where }),
        prisma.gameCrash.groupBy({
          by: ['profileId'],
          where,
          _count: true,
          orderBy: { _count: { profileId: 'desc' } },
          take: 10,
        }),
        prisma.gameCrash.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            username: true,
            profileVersion: true,
            exitCode: true,
            createdAt: true,
          },
        }),
      ]);

      this.print(`\x1b[1mCrash Statistics${days ? ` (last ${days} days)` : ''}:\x1b[0m\n`);
      this.print(`  Total Crashes: \x1b[31m${total}\x1b[0m`);

      if (byProfile.length > 0) {
        this.print(`\n  Top Profiles by Crashes:`);
        for (const item of byProfile) {
          const profileId = item.profileId as string | null;
          if (profileId) {
            const profile = await prisma.clientProfile.findUnique({
              where: { id: profileId },
              select: { title: true },
            });
            const count = (item._count as any).profileId || 0;
            this.print(`    ${profile?.title || profileId}: \x1b[31m${count}\x1b[0m`);
          }
        }
      }

      if (recent.length > 0) {
        this.print(`\n  Recent Crashes:`);
        this.printTable(
          ['Username', 'Version', 'Exit Code', 'Time'],
          recent.map((c) => [
            c.username || 'Unknown',
            c.profileVersion || '-',
            c.exitCode.toString(),
            this.formatDate(c.createdAt),
          ])
        );
      }
    } catch (error: any) {
      this.printError(`Failed to get crash statistics: ${error.message}`);
    }
  }

  private async handleSessions(args: string[]): Promise<void> {
    const days = this.parseDays(args);

    try {
      const where: any = {};
      if (days) {
        where.startedAt = {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        };
      }

      const [total, active, completed, avgDuration] = await Promise.all([
        prisma.gameSession.count({ where }),
        prisma.gameSession.count({
          where: { ...where, endedAt: null },
        }),
        prisma.gameSession.count({
          where: { ...where, endedAt: { not: null } },
        }),
        prisma.gameSession.aggregate({
          where: { ...where, duration: { not: null } },
          _avg: { duration: true },
        }),
      ]);

      this.print(`\x1b[1mGame Session Statistics${days ? ` (last ${days} days)` : ''}:\x1b[0m\n`);
      this.print(`  Total Sessions: ${total}`);
      this.print(`  Active Sessions: \x1b[33m${active}\x1b[0m`);
      this.print(`  Completed Sessions: ${completed}`);
      
      if (avgDuration._avg.duration) {
        const avgMinutes = Math.floor(avgDuration._avg.duration / 60);
        const avgSeconds = avgDuration._avg.duration % 60;
        this.print(`  Average Duration: ${avgMinutes}m ${avgSeconds}s`);
      }
    } catch (error: any) {
      this.printError(`Failed to get session statistics: ${error.message}`);
    }
  }

  private async handleErrors(args: string[]): Promise<void> {
    const days = this.parseDays(args);

    try {
      const where: any = {};
      if (days) {
        where.createdAt = {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        };
      }

      const [total, byType, recent] = await Promise.all([
        prisma.launcherError.count({ where }),
        prisma.launcherError.groupBy({
          by: ['errorType'],
          where,
          _count: true,
          orderBy: { _count: { errorType: 'desc' } },
        }),
        prisma.launcherError.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            errorType: true,
            component: true,
            errorMessage: true,
            createdAt: true,
          },
        }),
      ]);

      this.print(`\x1b[1mLauncher Error Statistics${days ? ` (last ${days} days)` : ''}:\x1b[0m\n`);
      this.print(`  Total Errors: \x1b[31m${total}\x1b[0m`);

      if (byType.length > 0) {
        this.print(`\n  Errors by Type:`);
        for (const item of byType) {
          const errorType = item.errorType as string;
          const count = (item._count as any).errorType || 0;
          this.print(`    ${errorType}: \x1b[31m${count}\x1b[0m`);
        }
      }

      if (recent.length > 0) {
        this.print(`\n  Recent Errors:`);
        this.printTable(
          ['Type', 'Component', 'Message', 'Time'],
          recent.map((e) => [
            e.errorType,
            e.component || '-',
            (e.errorMessage || '').substring(0, 40) + (e.errorMessage && e.errorMessage.length > 40 ? '...' : ''),
            this.formatDate(e.createdAt),
          ])
        );
      }
    } catch (error: any) {
      this.printError(`Failed to get error statistics: ${error.message}`);
    }
  }

  private parseDays(args: string[]): number | undefined {
    const daysIndex = args.indexOf('--days');
    if (daysIndex !== -1 && daysIndex + 1 < args.length) {
      const days = parseInt(args[daysIndex + 1], 10);
      return isNaN(days) ? undefined : days;
    }
    return undefined;
  }
}

