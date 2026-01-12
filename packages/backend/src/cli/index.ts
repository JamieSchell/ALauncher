/**
 * CLI Command System
 * Профессиональная система команд для управления лаунчером
 */

import readline from 'readline';
import { logger } from '../utils/logger';
import { initializeDatabase, prisma } from '../services/database';
import { CommandRegistry } from './commands/registry';
import { UserCommands } from './commands/user';
import { ProfileCommands } from './commands/profile';
import { VersionCommands } from './commands/version';
import { FileCommands } from './commands/file';
import { LauncherCommands } from './commands/launcher';
import { NotificationCommands } from './commands/notification';
import { SystemCommands } from './commands/system';
import { StatisticsCommands } from './commands/statistics';
import { AssetsCommands } from './commands/assets';
import { ClientCommands } from './commands/client';

export class CLI {
  private rl: readline.Interface;
  private registry: CommandRegistry;
  private isRunning: boolean = false;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\x1b[36mlauncher>\x1b[0m ',
      completer: (line: string) => {
        const completions = this.registry.getCommandNames();
        const hits = completions.filter((c) => c.startsWith(line));
        return [hits.length ? hits : completions, line];
      },
    });

    this.registry = new CommandRegistry();
    this.registerCommands();
  }

  private registerCommands() {
    // System commands
    this.registry.register(new SystemCommands());
    // User commands
    this.registry.register(new UserCommands());
    // Profile commands
    this.registry.register(new ProfileCommands());
    // Version commands
    this.registry.register(new VersionCommands());
    // File commands
    this.registry.register(new FileCommands());
    // Launcher commands
    this.registry.register(new LauncherCommands());
    // Notification commands
    this.registry.register(new NotificationCommands());
    // Statistics commands
    this.registry.register(new StatisticsCommands());
    // Assets commands
    this.registry.register(new AssetsCommands());
    // Client download commands
    this.registry.register(new ClientCommands());
  }

  async start() {
    // Initialize database connection
    try {
      await initializeDatabase();
      logger.info('✅ Database connected for CLI');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      this.printError('Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    this.isRunning = true;
    this.printWelcome();

    this.rl.on('line', async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) {
        this.rl.prompt();
        return;
      }

      // Handle exit commands
      if (trimmed === 'exit' || trimmed === 'quit' || trimmed === 'q') {
        await this.shutdown();
        return;
      }

      // Handle clear
      if (trimmed === 'clear' || trimmed === 'cls') {
        process.stdout.write('\x1b[2J\x1b[0f');
        this.rl.prompt();
        return;
      }

      // Parse command
      const parts = trimmed.split(/\s+/);
      const commandName = parts[0].toLowerCase();
      const args = parts.slice(1);

      try {
        const command = this.registry.getCommand(commandName);
        if (command) {
          await command.execute(args, this.rl, commandName);
        } else {
          this.printError(`Unknown command: ${commandName}`);
          this.printInfo('Type "help" to see available commands');
        }
      } catch (error: any) {
        this.printError(`Error executing command: ${error.message}`);
        logger.error('CLI command error:', error);
      }

      this.rl.prompt();
    });

    this.rl.on('close', async () => {
      await this.shutdown();
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', async () => {
      console.log('\n');
      await this.shutdown();
    });

    this.rl.prompt();
  }

  private printWelcome() {
    console.log('\x1b[36m');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║     Modern Minecraft Launcher - CLI Command System        ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\x1b[0m');
    console.log('Type "help" to see available commands');
    console.log('Type "exit" or "quit" to close the CLI');
    console.log('');
  }

  private printError(message: string) {
    console.log(`\x1b[31m✗ ${message}\x1b[0m`);
  }

  private printInfo(message: string) {
    console.log(`\x1b[36mℹ ${message}\x1b[0m`);
  }

  async executeCommand(commandLine: string): Promise<void> {
    // Initialize database connection if not already done
    try {
      await initializeDatabase();
      logger.info('✅ Database connected for CLI');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      this.printError('Failed to connect to database. Please check your configuration.');
      throw error;
    }

    const trimmed = commandLine.trim();
    if (!trimmed) {
      this.printError('No command provided');
      return;
    }

    // Parse command
    const parts = trimmed.split(/\s+/);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    
    try {
      const command = this.registry.getCommand(commandName);
      if (command) {
        await command.execute(args, this.rl, commandName);
      } else {
        this.printError(`Unknown command: ${commandName}`);
        this.printInfo('Type "help" to see available commands');
      }
    } catch (error: any) {
      this.printError(`Error executing command: ${error.message}`);
      logger.error('CLI command error:', error);
      throw error;
    }
  }

  private async shutdown() {
    if (!this.isRunning) return;
    this.isRunning = false;

    console.log('\n\x1b[33mShutting down CLI...\x1b[0m');
    try {
      await prisma.$disconnect();
      logger.info('Database disconnected');
      this.rl.close();
      console.log('\x1b[32mCLI closed successfully\x1b[0m');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      this.rl.close();
      process.exit(1);
    }
  }
}

// Start CLI if this file is run directly
if (require.main === module) {
  const cli = new CLI();

  // Check if command line arguments are provided for non-interactive mode
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Execute command directly and exit
    cli.executeCommand(args.join(' '))
      .then(() => {
        process.exit(0);
      })
      .catch((error) => {
        logger.error('Failed to execute command:', error);
        process.exit(1);
      });
  } else {
    // Start interactive mode
    cli.start().catch((error) => {
      logger.error('Failed to start CLI:', error);
      process.exit(1);
    });
  }
}

