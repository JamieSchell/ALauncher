/**
 * Progress Bar Utility
 * Простая утилита для отображения прогресса в консоли
 */

export class ProgressBar {
  private current: number;
  private readonly total: number;
  private readonly title: string;

  constructor(total: number, title: string) {
    this.total = total;
    this.current = 0;
    this.title = title;
  }

  update(current: number, message?: string): void {
    this.current = current;
    const progress = Math.floor((this.current / this.total) * 100);
    const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
    const msg = message ? ` - ${message}` : '';
    process.stdout.write(`\r   [${bar}] ${progress}%${this.title ? ` ${this.title}` : ''}${msg}   `);

    if (this.current >= this.total) {
      process.stdout.write('\n');
    }
  }

  complete(message?: string): void {
    this.update(this.total, message || 'Complete');
  }
}

/**
 * Форматирование байтов в читаемый формат
 */
export function formatBytes(bytes: number | bigint): string {
  const num = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (num === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(k));

  return Math.round((num / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Форматирование миллисекунд в читаемый формат
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
