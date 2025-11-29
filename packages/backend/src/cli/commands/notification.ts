/**
 * Notification Commands
 * Команды для управления уведомлениями
 */

import readline from 'readline';
import { BaseCommand } from './base';
import { NotificationType } from '@prisma/client';
import { prisma } from '../../services/database';
import { NotificationService } from '../../services/notificationService';

export class NotificationCommands extends BaseCommand {
  getNames(): string[] {
    return ['notify', 'notification'];
  }

  getDescription(): string {
    return 'Notification management commands';
  }

  getUsage(): string {
    return `notify send <username> <type> <title> <message> - Send notification to user
notify send-all <type> <title> <message> - Send notification to all users
notify list <username> [--unread] - List notifications for user
notify clear <username> - Clear all notifications for user
notify types - List available notification types`;
  }

  getExamples(): string[] {
    return [
      'notify send testuser LAUNCHER_UPDATE_AVAILABLE "Update Available" "New version is available"',
      'notify send-all SYSTEM_MESSAGE "Maintenance" "Server maintenance in 1 hour"',
      'notify list testuser',
      'notify list testuser --unread',
      'notify clear testuser',
      'notify types',
    ];
  }

  async execute(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length === 0) {
      this.printError('Subcommand required. Use "notify send", "notify list", etc.');
      this.printInfo('Type "help notify" for usage information');
      return;
    }

    const subcommand = args[0].toLowerCase();

    switch (subcommand) {
      case 'send':
        await this.handleSend(args.slice(1));
        break;
      case 'send-all':
        await this.handleSendAll(args.slice(1));
        break;
      case 'list':
        await this.handleList(args.slice(1));
        break;
      case 'clear':
        await this.handleClear(args.slice(1));
        break;
      case 'types':
        await this.handleTypes();
        break;
      default:
        this.printError(`Unknown subcommand: ${subcommand}`);
        this.printInfo('Type "help notify" for usage information');
    }
  }

  private async handleSend(args: string[]): Promise<void> {
    if (args.length < 4) {
      this.printError('Usage: notify send <username> <type> <title> <message>');
      this.printInfo('Available types: ' + Object.values(NotificationType).join(', '));
      return;
    }

    const username = args[0];
    const typeStr = args[1].toUpperCase();
    const title = args[2];
    const message = args.slice(3).join(' ');

    // Validate type
    if (!Object.values(NotificationType).includes(typeStr as NotificationType)) {
      this.printError(`Invalid notification type: ${typeStr}`);
      this.printInfo('Available types: ' + Object.values(NotificationType).join(', '));
      return;
    }

    const type = typeStr as NotificationType;

    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        this.printError(`User "${username}" not found`);
        return;
      }

      await NotificationService.createNotification({
        userId: user.id,
        type,
        title,
        message,
      });

      this.printSuccess(`Notification sent to "${username}"`);
    } catch (error: any) {
      this.printError(`Failed to send notification: ${error.message}`);
    }
  }

  private async handleSendAll(args: string[]): Promise<void> {
    if (args.length < 3) {
      this.printError('Usage: notify send-all <type> <title> <message>');
      this.printInfo('Available types: ' + Object.values(NotificationType).join(', '));
      return;
    }

    const typeStr = args[0].toUpperCase();
    const title = args[1];
    const message = args.slice(2).join(' ');

    // Validate type
    if (!Object.values(NotificationType).includes(typeStr as NotificationType)) {
      this.printError(`Invalid notification type: ${typeStr}`);
      this.printInfo('Available types: ' + Object.values(NotificationType).join(', '));
      return;
    }

    const type = typeStr as NotificationType;

    try {
      this.printWarning('This will send notification to ALL users.');
      this.printInfo(`Sending notification to all users...`);
      
      // Get all users and send notification to each
      const users = await prisma.user.findMany({
        select: { id: true },
      });

      let sent = 0;
      for (const user of users) {
        try {
          await NotificationService.createNotification({
            userId: user.id,
            type,
            title,
            message,
          });
          sent++;
        } catch (error) {
          // Continue with other users
        }
      }

      this.printSuccess(`Notification sent to ${sent} user(s)`);
    } catch (error: any) {
      this.printError(`Failed to send notification: ${error.message}`);
    }
  }

  private async handleList(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: notify list <username> [--unread]');
      return;
    }

    const username = args[0];
    const unreadOnly = args.includes('--unread');

    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        this.printError(`User "${username}" not found`);
        return;
      }

      const notifications = await prisma.notification.findMany({
        where: {
          userId: user.id,
          read: unreadOnly ? false : undefined,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      if (notifications.length === 0) {
        this.printInfo(`No notifications found for "${username}"`);
        return;
      }

      this.printTable(
        ['Type', 'Title', 'Read', 'Created'],
        notifications.map((n) => [
          n.type,
          n.title.length > 40 ? n.title.substring(0, 37) + '...' : n.title,
          n.read ? '\x1b[32mYes\x1b[0m' : '\x1b[33mNo\x1b[0m',
          this.formatDate(n.createdAt),
        ])
      );

      this.print(`\nTotal: ${notifications.length} notification(s)`);
    } catch (error: any) {
      this.printError(`Failed to list notifications: ${error.message}`);
    }
  }

  private async handleClear(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: notify clear <username>');
      return;
    }

    const username = args[0];

    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        this.printError(`User "${username}" not found`);
        return;
      }

      const count = await prisma.notification.deleteMany({
        where: { userId: user.id },
      });

      this.printSuccess(`Cleared ${count.count} notification(s) for "${username}"`);
    } catch (error: any) {
      this.printError(`Failed to clear notifications: ${error.message}`);
    }
  }

  private async handleTypes(): Promise<void> {
    this.print('\x1b[1mAvailable Notification Types:\x1b[0m\n');
    Object.values(NotificationType).forEach((type) => {
      this.print(`  ${type}`);
    });
  }
}

