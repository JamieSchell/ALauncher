/**
 * File hasher service - calculate and verify file integrity
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { HashedDir, HashedFile } from '@modern-launcher/shared';
import { logger } from '../utils/logger';

export class HasherService {
  /**
   * Calculate SHA-256 hash of a file
   */
  static async hashFile(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Hash a directory recursively
   */
  static async hashDirectory(
    dirPath: string,
    includePatterns?: string[],
    excludePatterns?: string[] 
  ): Promise<HashedDir> {
    const entries: Record<string, HashedFile | HashedDir> = {};

    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      const relativePath = path.relative(dirPath, itemPath);

      // Check exclusions
      if (excludePatterns && this.matchesPattern(relativePath, excludePatterns)) {
        continue;
      }

      // Check inclusions (if specified)
      if (includePatterns && includePatterns.length > 0) {
        if (!this.matchesPattern(relativePath, includePatterns)) {
          continue;
        }
      }

      if (item.isDirectory()) {
        entries[item.name] = await this.hashDirectory(
          itemPath,
          includePatterns,
          excludePatterns
        );
      } else if (item.isFile()) {
        const stats = await fs.stat(itemPath);
        const hash = await this.hashFile(itemPath);

        entries[item.name] = {
          type: 'file',
          path: relativePath,
          size: stats.size,
          hash,
        };
      }
    }

    return {
      type: 'dir',
      path: dirPath,
      entries,
    };
  }

  /**
   * Compare two hashed directories
   */
  static compareDirs(
    local: HashedDir,
    remote: HashedDir
  ): {
    missing: string[];
    modified: string[];
    extra: string[];
  } {
    const missing: string[] = [];
    const modified: string[] = [];
    const extra: string[] = [];

    // Check remote entries
    for (const [name, remoteEntry] of Object.entries(remote.entries)) {
      const localEntry = local.entries[name];

      if (!localEntry) {
        missing.push(remoteEntry.path);
        continue;
      }

      if (remoteEntry.type === 'file' && localEntry.type === 'file') {
        if (remoteEntry.hash !== localEntry.hash) {
          modified.push(remoteEntry.path);
        }
      } else if (remoteEntry.type === 'dir' && localEntry.type === 'dir') {
        const subDiff = this.compareDirs(localEntry, remoteEntry);
        missing.push(...subDiff.missing);
        modified.push(...subDiff.modified);
        extra.push(...subDiff.extra);
      }
    }

    // Check for extra local files
    for (const [name, localEntry] of Object.entries(local.entries)) {
      if (!remote.entries[name]) {
        extra.push(localEntry.path);
      }
    }

    return { missing, modified, extra };
  }

  /**
   * Match path against patterns (regex)
   */
  private static matchesPattern(path: string, patterns: string[]): boolean {
    const normalizedPath = path.replace(/\\/g, '/');
    
    return patterns.some(pattern => {
      try {
        const regex = new RegExp(pattern);
        return regex.test(normalizedPath);
      } catch (error) {
        logger.warn(`Invalid pattern: ${pattern}`);
        return false;
      }
    });
  }

  /**
   * Verify file integrity
   */
  static async verifyFile(filePath: string, expectedHash: string): Promise<boolean> {
    try {
      const actualHash = await this.hashFile(filePath);
      return actualHash === expectedHash;
    } catch {
      return false;
    }
  }

  /**
   * Get file list from hashed dir
   */
  static flattenHashedDir(hashedDir: HashedDir): HashedFile[] {
    const files: HashedFile[] = [];

    for (const entry of Object.values(hashedDir.entries)) {
      if (entry.type === 'file') {
        files.push(entry);
      } else if (entry.type === 'dir') {
        files.push(...this.flattenHashedDir(entry));
      }
    }

    return files;
  }
}
