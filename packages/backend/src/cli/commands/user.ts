/**
 * User Commands
 * Команды для управления пользователями
 */

import readline from 'readline';
import { BaseCommand } from './base';
import { UserRole } from '@prisma/client';
import { prisma } from '../../services/database';
import { AuthService } from '../../services/auth';
import bcrypt from 'bcrypt';

export class UserCommands extends BaseCommand {
  getNames(): string[] {
    return ['user'];
  }

  getDescription(): string {
    return 'User management commands';
  }

  getUsage(): string {
    return `user list [--all] - List all users (--all includes banned)
user create <username> <password> [--email <email>] [--role <USER|ADMIN>] - Create new user
user delete <username> - Delete user
user ban <username> [--reason <reason>] - Ban user
user unban <username> - Unban user
user role <username> <USER|ADMIN> - Change user role
user info <username> - Show user information`;
  }

  getExamples(): string[] {
    return [
      'user list',
      'user list --all',
      'user create testuser password123',
      'user create admin admin123 --role ADMIN',
      'user ban testuser --reason "Violation of rules"',
      'user unban testuser',
      'user role testuser ADMIN',
      'user info testuser',
    ];
  }

  async execute(args: string[], rl: readline.Interface, commandName?: string): Promise<void> {
    if (args.length === 0) {
      this.printError('Subcommand required. Use "user list", "user create", etc.');
      this.printInfo('Type "help user" for usage information');
      return;
    }

    const subcommand = args[0].toLowerCase();

    switch (subcommand) {
      case 'list':
        await this.handleList(args.slice(1));
        break;
      case 'create':
        await this.handleCreate(args.slice(1), rl);
        break;
      case 'delete':
        await this.handleDelete(args.slice(1), rl);
        break;
      case 'ban':
        await this.handleBan(args.slice(1));
        break;
      case 'unban':
        await this.handleUnban(args.slice(1));
        break;
      case 'role':
        await this.handleRole(args.slice(1));
        break;
      case 'info':
        await this.handleInfo(args.slice(1));
        break;
      default:
        this.printError(`Unknown subcommand: ${subcommand}`);
        this.printInfo('Type "help user" for usage information');
    }
  }

  private async handleList(args: string[]): Promise<void> {
    const showAll = args.includes('--all');

    try {
      const users = await prisma.user.findMany({
        where: showAll ? {} : { banned: false },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          banned: true,
          bannedAt: true,
          banReason: true,
          createdAt: true,
          lastLogin: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (users.length === 0) {
        this.printInfo('No users found');
        return;
      }

      this.printTable(
        ['Username', 'Email', 'Role', 'Banned', 'Created', 'Last Login'],
        users.map((u) => [
          u.username,
          u.email || '-',
          u.role,
          u.banned ? '\x1b[31mYes\x1b[0m' : '\x1b[32mNo\x1b[0m',
          this.formatDate(u.createdAt),
          u.lastLogin ? this.formatDate(u.lastLogin) : 'Never',
        ])
      );

      this.print(`\nTotal: ${users.length} user(s)`);
    } catch (error: any) {
      this.printError(`Failed to list users: ${error.message}`);
    }
  }

  private async handleCreate(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length < 2) {
      this.printError('Usage: user create <username> <password> [--email <email>] [--role <USER|ADMIN>]');
      return;
    }

    const username = args[0];
    const password = args[1];
    let email: string | undefined;
    let role: UserRole = UserRole.USER;

    // Parse optional arguments
    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--email' && i + 1 < args.length) {
        email = args[++i];
      } else if (args[i] === '--role' && i + 1 < args.length) {
        const roleStr = args[++i].toUpperCase();
        if (roleStr === 'ADMIN' || roleStr === 'USER') {
          role = roleStr as UserRole;
        } else {
          this.printError('Invalid role. Use USER or ADMIN');
          return;
        }
      }
    }

    try {
      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { username },
      });

      if (existing) {
        this.printError(`User "${username}" already exists`);
        return;
      }

      // Check email uniqueness if provided
      if (email) {
        const emailExists = await prisma.user.findUnique({
          where: { email },
        });
        if (emailExists) {
          this.printError(`Email "${email}" is already in use`);
          return;
        }
      }

      // Generate UUID for Minecraft
      const { UUIDHelper } = await import('@modern-launcher/shared');
      const uuid = UUIDHelper.generateOffline(username);

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          uuid,
          email: email || null,
          role,
        },
      });

      this.printSuccess(`User "${username}" created successfully`);
      this.print(`  ID: ${user.id}`);
      this.print(`  UUID: ${user.uuid}`);
      this.print(`  Role: ${user.role}`);
      if (email) {
        this.print(`  Email: ${email}`);
      }
    } catch (error: any) {
      this.printError(`Failed to create user: ${error.message}`);
    }
  }

  private async handleDelete(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: user delete <username>');
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

      const confirmed = await this.askYesNo(
        rl,
        `Are you sure you want to delete user "${username}"? This action cannot be undone.`
      );

      if (!confirmed) {
        this.printInfo('Deletion cancelled');
        return;
      }

      await prisma.user.delete({
        where: { username },
      });

      this.printSuccess(`User "${username}" deleted successfully`);
    } catch (error: any) {
      this.printError(`Failed to delete user: ${error.message}`);
    }
  }

  private async handleBan(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: user ban <username> [--reason <reason>]');
      return;
    }

    const username = args[0];
    let reason: string | undefined;

    // Parse reason
    const reasonIndex = args.indexOf('--reason');
    if (reasonIndex !== -1 && reasonIndex + 1 < args.length) {
      reason = args.slice(reasonIndex + 1).join(' ');
    }

    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        this.printError(`User "${username}" not found`);
        return;
      }

      if (user.banned) {
        this.printWarning(`User "${username}" is already banned`);
        return;
      }

      await prisma.user.update({
        where: { username },
        data: {
          banned: true,
          bannedAt: new Date(),
          banReason: reason || null,
        },
      });

      this.printSuccess(`User "${username}" has been banned`);
      if (reason) {
        this.print(`  Reason: ${reason}`);
      }
    } catch (error: any) {
      this.printError(`Failed to ban user: ${error.message}`);
    }
  }

  private async handleUnban(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: user unban <username>');
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

      if (!user.banned) {
        this.printWarning(`User "${username}" is not banned`);
        return;
      }

      await prisma.user.update({
        where: { username },
        data: {
          banned: false,
          bannedAt: null,
          banReason: null,
        },
      });

      this.printSuccess(`User "${username}" has been unbanned`);
    } catch (error: any) {
      this.printError(`Failed to unban user: ${error.message}`);
    }
  }

  private async handleRole(args: string[]): Promise<void> {
    if (args.length < 2) {
      this.printError('Usage: user role <username> <USER|ADMIN>');
      return;
    }

    const username = args[0];
    const roleStr = args[1].toUpperCase();

    if (roleStr !== 'USER' && roleStr !== 'ADMIN') {
      this.printError('Invalid role. Use USER or ADMIN');
      return;
    }

    const role = roleStr as UserRole;

    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        this.printError(`User "${username}" not found`);
        return;
      }

      if (user.role === role) {
        this.printWarning(`User "${username}" already has role "${role}"`);
        return;
      }

      await prisma.user.update({
        where: { username },
        data: { role },
      });

      this.printSuccess(`User "${username}" role changed to "${role}"`);
    } catch (error: any) {
      this.printError(`Failed to change user role: ${error.message}`);
    }
  }

  private async handleInfo(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: user info <username>');
      return;
    }

    const username = args[0];

    try {
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          _count: {
            select: {
              sessions: true,
              notifications: true,
            },
          },
        },
      });

      if (!user) {
        this.printError(`User "${username}" not found`);
        return;
      }

      this.print(`\x1b[1mUser Information:\x1b[0m\n`);
      this.print(`  Username: ${user.username}`);
      this.print(`  ID: ${user.id}`);
      this.print(`  UUID: ${user.uuid}`);
      this.print(`  Email: ${user.email || 'Not set'}`);
      this.print(`  Role: ${user.role}`);
      this.print(`  Banned: ${user.banned ? '\x1b[31mYes\x1b[0m' : '\x1b[32mNo\x1b[0m'}`);
      if (user.banned && user.banReason) {
        this.print(`  Ban Reason: ${user.banReason}`);
      }
      if (user.banned && user.bannedAt) {
        this.print(`  Banned At: ${this.formatDate(user.bannedAt)}`);
      }
      this.print(`  Created: ${this.formatDate(user.createdAt)}`);
      this.print(`  Last Login: ${user.lastLogin ? this.formatDate(user.lastLogin) : 'Never'}`);
      this.print(`  Active Sessions: ${user._count.sessions}`);
      this.print(`  Notifications: ${user._count.notifications}`);
    } catch (error: any) {
      this.printError(`Failed to get user info: ${error.message}`);
    }
  }
}

