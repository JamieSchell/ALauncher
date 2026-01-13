/**
 * CSRF Service
 *
 * Manages CSRF tokens for protecting against Cross-Site Request Forgery attacks.
 *
 * Generates cryptographically secure tokens and validates them on state-changing requests.
 *
 * @example
 * ```ts
 * import { csrfService } from './services/csrf';
 *
 * // Generate a token for a session
 * const token = csrfService.generateToken('session-123');
 *
 * // Validate a token
 * const isValid = csrfService.validateToken('session-123', 'provided-token');
 *
 * // Invalidate a token (after use or logout)
 * csrfService.invalidateToken('session-123');
 * ```
 */

import crypto from 'crypto';
import { LRUCache } from 'lru-cache';

/**
 * CSRF Token data
 */
interface CsrfTokenData {
  token: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * CSRF Service
 *
 * Uses in-memory LRU cache for token storage.
 * Tokens expire after 1 hour by default.
 */
class CsrfService {
  private tokens: Map<string, CsrfTokenData> = new Map();
  private readonly TOKEN_LENGTH = 32;
  private readonly TOKEN_TTL = 60 * 60 * 1000; // 1 hour
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic cleanup of expired tokens
    this.startCleanup();
  }

  /**
   * Generate a CSRF token for a session
   *
   * @param sessionId - Session identifier (user ID or session ID)
   * @returns Generated token
   *
   * @example
   * ```ts
   * const token = csrfService.generateToken('user-123');
   * // Returns: 'a1b2c3d4e5f6...'
   * ```
   */
  generateToken(sessionId: string): string {
    const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
    const now = Date.now();

    const tokenData: CsrfTokenData = {
      token,
      createdAt: now,
      expiresAt: now + this.TOKEN_TTL,
    };

    // Store token with session as key (one token per session)
    this.tokens.set(sessionId, tokenData);

    return token;
  }

  /**
   * Validate a CSRF token for a session
   *
   * @param sessionId - Session identifier
   * @param token - Token to validate
   * @returns true if token is valid, false otherwise
   *
   * @example
   * ```ts
   * const isValid = csrfService.validateToken('user-123', 'provided-token');
   * if (!isValid) {
   *   throw new Error('Invalid CSRF token');
   * }
   * ```
   */
  validateToken(sessionId: string, token: string): boolean {
    const tokenData = this.tokens.get(sessionId);

    if (!tokenData) {
      return false;
    }

    // Check if expired
    if (Date.now() > tokenData.expiresAt) {
      this.tokens.delete(sessionId);
      return false;
    }

    // Check if token matches (timing-safe comparison)
    try {
      return crypto.timingSafeEqual(
        Buffer.from(tokenData.token, 'hex'),
        Buffer.from(token, 'hex')
      );
    } catch {
      // Buffer length mismatch or other comparison error
      return false;
    }
  }

  /**
   * Invalidate a CSRF token for a session
   *
   * Call this after token validation or on logout.
   *
   * @param sessionId - Session identifier
   *
   * @example
   * ```ts
   * // After successful validation, invalidate token
   * csrfService.validateToken(sessionId, token);
   * csrfService.invalidateToken(sessionId);
   * // Generate new token for next request
   * const newToken = csrfService.generateToken(sessionId);
   * ```
   */
  invalidateToken(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  /**
   * Get a token for a session without validation
   *
   * @param sessionId - Session identifier
   * @returns Token data or null
   *
   * @example
   * ```ts
   * const tokenData = csrfService.getTokenData('user-123');
   * if (tokenData) {
   *   console.log('Token expires at:', new Date(tokenData.expiresAt));
   * }
   * ```
   */
  getTokenData(sessionId: string): CsrfTokenData | null {
    const tokenData = this.tokens.get(sessionId);
    if (!tokenData) {
      return null;
    }

    // Check if expired
    if (Date.now() > tokenData.expiresAt) {
      this.tokens.delete(sessionId);
      return null;
    }

    return tokenData;
  }

  /**
   * Check if a session has a valid token
   *
   * @param sessionId - Session identifier
   * @returns true if session has valid token
   *
   * @example
   * ```ts
   * if (!csrfService.hasToken('user-123')) {
   *   // Generate new token
   *   const token = csrfService.generateToken('user-123');
   * }
   * ```
   */
  hasToken(sessionId: string): boolean {
    return this.getTokenData(sessionId) !== null;
  }

  /**
   * Get CSRF service statistics
   *
   * @returns Statistics object
   *
   * @example
   * ```ts
   * const stats = csrfService.getStats();
   * console.log(`Active tokens: ${stats.activeTokens}`);
   * ```
   */
  getStats(): {
    activeTokens: number;
    oldestToken: number | null;
    newestToken: number | null;
  } {
    const tokens = Array.from(this.tokens.values());

    if (tokens.length === 0) {
      return {
        activeTokens: 0,
        oldestToken: null,
        newestToken: null,
      };
    }

    const createdAtTimes = tokens.map(t => t.createdAt);

    return {
      activeTokens: tokens.length,
      oldestToken: Math.min(...createdAtTimes),
      newestToken: Math.max(...createdAtTimes),
    };
  }

  /**
   * Clear all tokens (for testing or maintenance)
   *
   * @example
   * ```ts
   * csrfService.clear();
   * ```
   */
  clear(): void {
    this.tokens.clear();
  }

  /**
   * Start periodic cleanup of expired tokens
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Remove expired tokens
   *
   * @returns Number of tokens removed
   */
  private cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [sessionId, tokenData] of this.tokens.entries()) {
      if (now > tokenData.expiresAt) {
        this.tokens.delete(sessionId);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Stop cleanup interval
   *
   * Should be called during graceful shutdown.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Singleton instance
export const csrfService = new CsrfService();
