/**
 * Cache Service
 * Simple in-memory caching for frequently accessed data
 * Uses TTL (Time To Live) for automatic expiration
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
  createdAt: number;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  entries: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute

  constructor() {
    // Start periodic cleanup of expired entries
    this.startCleanup();
  }

  /**
   * Get a value from cache
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Cache hit - increment hit counter
    entry.hits++;
    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * Set a value in cache with TTL
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl,
      hits: 0,
      createdAt: Date.now(),
    };

    this.cache.set(key, entry as CacheEntry<any>);
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Invalidate cache entries by pattern
   * Supports * wildcard
   *
   * @example
   * cache.invalidate('user:*'); // Deletes all keys starting with 'user:'
   */
  invalidate(pattern: string): number {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );

    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   *
   * @param key - Cache key
   * @param factory - Function to compute value if not in cache
   * @param ttl - Time to live in milliseconds
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? this.stats.hits / (this.stats.hits + this.stats.misses)
        : 0;

    return {
      size: this.getCacheSize(),
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 10000) / 100, // Round to 2 decimal places
      entries: this.cache.size,
    };
  }

  /**
   * Get approximate cache size in bytes
   */
  private getCacheSize(): number {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length + JSON.stringify(entry).length;
    }
    return size;
  }

  /**
   * Get all cache entries (for debugging)
   */
  getAllEntries(): Array<{ key: string; hits: number; ttl: number }> {
    const now = Date.now();
    const entries: Array<{ key: string; hits: number; ttl: number }> = [];

    for (const [key, entry] of this.cache.entries()) {
      entries.push({
        key,
        hits: entry.hits,
        ttl: Math.max(0, Math.floor((entry.expiresAt - now) / 1000)),
      });
    }

    return entries.sort((a, b) => b.hits - a.hits);
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Remove expired entries
   */
  private cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Stop cleanup interval
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
export const cacheService = new CacheService();

// Common cache key prefixes
export const CacheKeys = {
  USER_BY_ID: (id: string) => `user:id:${id}`,
  USER_BY_NAME: (name: string) => `user:name:${name}`,
  PROFILES_ALL: 'profiles:all',
  PROFILES_ENABLED: 'profiles:enabled',
  PROFILE_BY_ID: (id: string) => `profile:id:${id}`,
  SERVER_STATUS: (address: string, port: number) => `server:${address}:${port}`,
  STATISTICS: 'statistics:summary',
} as const;
