/**
 * File system utilities
 * 
 * Common helper functions for file operations used across services.
 */

import fs from 'fs/promises';

/**
 * Check if a file or directory exists at the given path
 * 
 * Pure function: no side effects, only checks file system.
 * 
 * @param filePath - Absolute or relative path to check
 * @returns `true` if file/directory exists, `false` otherwise
 * 
 * @example
 * ```ts
 * const exists = await fileExists('/path/to/file.txt');
 * if (exists) {
 *   // File exists
 * }
 * ```
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate SHA-256 hash of a file
 * 
 * Pure function: reads file and calculates hash, no side effects.
 * 
 * @param filePath - Path to file to hash
 * @returns Hexadecimal hash string
 * @throws {Error} If file cannot be read
 * 
 * @example
 * ```ts
 * const hash = await calculateFileHash('/path/to/file.jar');
 * // Use hash for integrity verification
 * ```
 */
export async function calculateFileHash(filePath: string): Promise<string> {
  const crypto = await import('crypto');
  const buffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculate SHA-256 hash of a buffer
 * 
 * Pure function: calculates hash from buffer, no side effects.
 * 
 * @param buffer - Buffer to hash
 * @returns Hexadecimal hash string
 * 
 * @example
 * ```ts
 * const hash = calculateBufferHash(Buffer.from('data'));
 * ```
 */
export function calculateBufferHash(buffer: Buffer): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

