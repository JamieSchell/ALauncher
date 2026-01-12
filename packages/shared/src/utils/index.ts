/**
 * Shared utilities
 */

export class VersionComparator {
  /**
   * Compare two Minecraft versions
   * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  static compare(v1: string, v2: string): number {
    const v1Parts = v1.split('.').map(p => parseInt(p, 10));
    const v2Parts = v2.split('.').map(p => parseInt(p, 10));
    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }

    return 0;
  }

  static isAtLeast(version: string, minVersion: string): boolean {
    return this.compare(version, minVersion) >= 0;
  }
}

export class UUIDHelper {
  /**
   * Convert UUID to hash (remove dashes)
   */
  static toHash(uuid: string): string {
    return uuid.replace(/-/g, '');
  }

  /**
   * Convert hash to UUID (add dashes)
   */
  static fromHash(hash: string): string {
    if (hash.length !== 32) {
      throw new Error('Invalid hash length');
    }
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
  }

  /**
   * Generate offline UUID from username
   */
  static generateOffline(username: string): string {
    // This is a simplified version, you should use proper UUID v3 generation
    try {
      // Try Node.js crypto module first (for backend)
      if (typeof require !== 'undefined') {
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update(`OfflinePlayer:${username}`).digest('hex');
        return this.fromHash(hash);
      }
    } catch (error) {
      // Fallback if crypto module is not available
    }

    // Simple fallback for browser/frontend
    let hash = 0;
    const str = `OfflinePlayer:${username}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const hashHex32 = Math.abs(hash).toString(16).padStart(32, '0').slice(0, 32);
    return this.fromHash(hashHex32);
  }
}

export class PathHelper {
  /**
   * Normalize path separators
   */
  static normalize(path: string): string {
    return path.replace(/\\/g, '/');
  }

  /**
   * Join paths
   */
  static join(...paths: string[]): string {
    return paths
      .map(p => p.replace(/^\/+|\/+$/g, ''))
      .filter(p => p.length > 0)
      .join('/');
  }

  /**
   * Get file extension
   */
  static getExtension(path: string): string {
    const match = path.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : '';
  }

  /**
   * Check if path has extension
   */
  static hasExtension(path: string, ext: string): boolean {
    return this.getExtension(path) === ext.toLowerCase();
  }
}

export class SecurityHelper {
  /**
   * Verify JWT token format
   */
  static isValidToken(token: string): boolean {
    return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token);
  }

  /**
   * Sanitize username
   */
  static sanitizeUsername(username: string): string {
    return username.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16);
  }

  /**
   * Validate username
   */
  static isValidUsername(username: string): boolean {
    return /^[a-zA-Z0-9_]{3,16}$/.test(username);
  }
}
