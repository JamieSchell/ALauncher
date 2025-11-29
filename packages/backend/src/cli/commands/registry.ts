/**
 * Command Registry
 * Реестр всех доступных команд
 */

import { BaseCommand } from './base';

export class CommandRegistry {
  private commands: Map<string, BaseCommand> = new Map();

  register(command: BaseCommand) {
    for (const name of command.getNames()) {
      this.commands.set(name.toLowerCase(), command);
    }
  }

  getCommand(name: string): BaseCommand | undefined {
    return this.commands.get(name.toLowerCase());
  }

  getCommandNames(): string[] {
    return Array.from(this.commands.keys());
  }

  getAllCommands(): BaseCommand[] {
    const uniqueCommands = new Set(this.commands.values());
    return Array.from(uniqueCommands);
  }
}

