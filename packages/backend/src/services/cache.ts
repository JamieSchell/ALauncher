/**
 * Cache Service
 *
 * Simple in-memory caching service with TTL (Time To Live) support.
 * Automatically expires entries and provides statistics for monitoring.
 *
 * @example
 * ```ts
 * import { cacheService, CacheKeys } from './services/cache';
 *
 * // Cache a user for 5 minutes
 * cacheService.set(CacheKeys.USER_BY_ID('123'), userData);
 *
 * // Retrieve from cache
 * const user = cacheService.get(CacheKeys.USER_BY_ID('123'));
 *
 * // Get or set with automatic caching
 * const user = await cacheService.getOrSet(
 *   CacheKeys.USER_BY_ID('123'),
 *   () => fetchUserFromDatabase('123'),
 *   60000 // 1 minute TTL
 * );
 *
 * // Invalidate all user caches
 * cacheService.invalidate('user:*');
 * ```
 *
 * @feature Periodic cleanup of expired entries (every minute)
 * @feature Cache statistics (hits, misses, hit rate)
 * @feature Pattern-based invalidation with wildcards
 * @feature Thread-safe singleton pattern
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
  createdAt: number;
}

interface CacheStats {
  /** Approximate cache size in bytes */
  size: number;
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Hit rate as percentage (0-100) */
  hitRate: number;
  /** Number of cached entries */
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
   *
   * Returns null if not found or expired. Increments hit/miss counters.
   *
   * @template T - Type of cached value
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   *
   * @example
   * ```ts
   * const user = cacheService.get<User>('user:123');
   * if (user) {
   *   // Use cached user
   * }
   * ```
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
   * @template T - Type of value to cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   *
   * @example
   * ```ts
   * // Cache for default 5 minutes
   * cacheService.set('user:123', userData);
   *
   * // Cache for 1 minute
   * cacheService.set('user:123', userData, 60000);
   * ```
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
   *
   * @param key - Cache key to delete
   * @returns true if key was deleted, false if not found
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries and reset statistics
   *
   * @example
   * ```ts
   * cacheService.clear();
   * // All entries and stats are reset
   * ```
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Invalidate cache entries by pattern
   *
   * Supports * wildcard for matching any characters.
   *
   * @param pattern - Pattern to match (supports * wildcard)
   * @returns Number of entries invalidated
   *
   * @example
   * ```ts
   * // Invalidate all user caches
   * cacheService.invalidate('user:*');
   *
   * // Invalidate all profile caches
   * cacheService.invalidate('profile:*');
   *
   * // Invalidate specific pattern
   * cacheService.invalidate('user:name:*');
   * ```
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
   * Get from cache or compute and cache result
   *
   * If key exists in cache and is not expired, returns cached value.
   * Otherwise, computes value using factory function, caches it, and returns it.
   *
   * @template T - Type of value
   * @param key - Cache key
   * @param factory - Function to compute value if not in cache
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   * @returns Cached or computed value
   *
   * @example
   * ```ts
   * const user = await cacheService.getOrSet(
   *   'user:123',
   *   () => prisma.user.findUnique({ where: { id: '123' } }),
   *   60000 // 1 minute
   * );
   * ```
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
   *
   * @returns Cache statistics including size, hits, misses, hit rate, and entry count
   *
   * @example
   * ```ts
   * const stats = cacheService.getStats();
   * console.log(`Hit rate: ${stats.hitRate}%`);
   * console.log(`Entries: ${stats.entries}`);
   * ```
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
   * Get all cache entries sorted by hit count
   *
   * Useful for debugging and monitoring cache usage.
   *
   * @returns Array of cache entries with key, hits, and remaining TTL
   *
   * @example
   * ```ts
   * const entries = cacheService.getAllEntries();
   * entries.slice(0, 10).forEach(e => {
   *   console.log(`${e.key}: ${e.hits} hits, TTL: ${e.ttl}s`);
   * });
   * ```
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
   *
   * @returns Number of entries removed
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
   * Stop cleanup interval and clear all cache
   *
   * Should be called during application shutdown.
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

/**
 * Common cache key patterns
 *
 * Provides type-safe cache key generators for common use cases.
 *
 * @example
 * ```ts
 * import { CacheKeys } from './services/cache';
 *
 * const userKey = CacheKeys.USER_BY_ID('123');
 * const profileKey = CacheKeys.PROFILE_BY_ID('456');
 * ```
 */
export const CacheKeys = {
  /** Cache key for user by ID: `user:id:{id}` */
  USER_BY_ID: (id: string) => `user:id:${id}`,
  /** Cache key for user by username: `user:name:{name}` */
  USER_BY_NAME: (name: string) => `user:name:${name}`,
  /** Cache key for all profiles */
  PROFILES_ALL: 'profiles:all',
  /** Cache key for enabled profiles only */
  PROFILES_ENABLED: 'profiles:enabled',
  /** Cache key for profile by ID: `profile:id:{id}` */
  PROFILE_BY_ID: (id: string) => `profile:id:${id}`,
  /** Cache key for server status: `server:{address}:{port}` */
  SERVER_STATUS: (address: string, port: number) => `server:${address}:${port}`,
  /** Cache key for statistics summary */
  STATISTICS: 'statistics:summary',
} as const;
