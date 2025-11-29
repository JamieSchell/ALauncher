/**
 * Base Command
 * Базовый класс для всех команд
 */

import readline from 'readline';

export abstract class BaseCommand {
  abstract getNames(): string[];
  abstract getDescription(): string;
  abstract getUsage(): string;
  abstract getExamples(): string[];
  abstract execute(args: string[], rl: readline.Interface): Promise<void>;

  protected print(message: string) {
    console.log(message);
  }

  protected printSuccess(message: string) {
    console.log(`\x1b[32m✓ ${message}\x1b[0m`);
  }

  protected printError(message: string) {
    console.log(`\x1b[31m✗ ${message}\x1b[0m`);
  }

  protected printWarning(message: string) {
    console.log(`\x1b[33m⚠ ${message}\x1b[0m`);
  }

  protected printInfo(message: string) {
    console.log(`\x1b[36mℹ ${message}\x1b[0m`);
  }

  protected printTable(headers: string[], rows: string[][]) {
    // Calculate column widths
    const widths = headers.map((h, i) => {
      const headerWidth = h.length;
      const maxRowWidth = Math.max(
        ...rows.map((row) => (row[i] || '').toString().length)
      );
      return Math.max(headerWidth, maxRowWidth, 10);
    });

    // Print header
    const headerRow = headers
      .map((h, i) => h.padEnd(widths[i]))
      .join(' │ ');
    console.log('\x1b[1m' + headerRow + '\x1b[0m');
    console.log('─'.repeat(headerRow.length));

    // Print rows
    rows.forEach((row) => {
      const rowStr = row
        .map((cell, i) => (cell || '').toString().padEnd(widths[i]))
        .join(' │ ');
      console.log(rowStr);
    });
  }

  protected formatBytes(bytes: number | bigint): string {
    const b = typeof bytes === 'bigint' ? Number(bytes) : bytes;
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return Math.round((b / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  protected formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  protected async askQuestion(rl: readline.Interface, question: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(`\x1b[36m${question}\x1b[0m `, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  protected async askYesNo(rl: readline.Interface, question: string): Promise<boolean> {
    const answer = await this.askQuestion(rl, `${question} (y/n): `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }
}

