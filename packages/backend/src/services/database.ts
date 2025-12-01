/**
 * Database service
 * 
 * Provides typed Prisma client with connection pooling, timeouts, and reconnection handling.
 * All database operations should use the exported `prisma` instance.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Prisma client instance with optimized connection pool settings
 * 
 * Connection pool configuration:
 * - Connection timeout: 10 seconds
 * - Query timeout: 20 seconds (via datasource URL params)
 * - Pool size: Managed by Prisma (defaults based on database provider)
 * 
 * Reconnection: Prisma automatically handles reconnection on connection loss.
 * For manual reconnection, use `prisma.$connect()`.
 */
export const prisma = new PrismaClient({
  log: config.env === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error', 'warn'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: config.database.url,
    },
  },
});

/**
 * Initialize database connection with retry logic
 * 
 * Attempts to connect to the database with exponential backoff retry.
 * Throws error if connection fails after all retries.
 * 
 * @param maxRetries - Maximum number of connection retry attempts (default: 3)
 * @param retryDelayMs - Initial delay between retries in milliseconds (default: 1000)
 * @throws {Error} If connection fails after all retries
 * 
 * @example
 * ```ts
 * await initializeDatabase();
 * // Database is ready for queries
 * ```
 */
export async function initializeDatabase(
  maxRetries: number = 3,
  retryDelayMs: number = 1000
): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      logger.info('Database connected successfully');
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed:`, {
        error: lastError.message,
        attempt,
        maxRetries,
      });
      
      if (attempt < maxRetries) {
        const delay = retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logger.error('Failed to connect to database after all retries:', lastError);
  throw lastError || new Error('Database connection failed');
}

/**
 * Disconnect from database gracefully
 * 
 * Closes all active connections and releases connection pool resources.
 * Should be called during application shutdown.
 * 
 * @example
 * ```ts
 * await disconnectDatabase();
 * // All database connections closed
 * ```
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error during database disconnection:', error);
    throw error;
  }
}

/**
 * Health check for database connection
 * 
 * Performs a simple query to verify database connectivity.
 * Useful for health check endpoints and monitoring.
 * 
 * @returns `true` if database is reachable, `false` otherwise
 * 
 * @example
 * ```ts
 * const isHealthy = await checkDatabaseHealth();
 * if (!isHealthy) {
 *   // Handle degraded state
 * }
 * ```
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.warn('Database health check failed:', error);
    return false;
  }
}

/**
 * Execute a database transaction with automatic retry on connection errors
 * 
 * Wraps Prisma transaction with retry logic for transient connection failures.
 * 
 * @param callback - Transaction callback that receives Prisma transaction client
 * @param maxRetries - Maximum retry attempts (default: 2)
 * @returns Result of the transaction callback
 * @throws {Error} If transaction fails after all retries
 * 
 * @example
 * ```ts
 * const result = await withRetryTransaction(async (tx) => {
 *   return await tx.user.create({ data: { username: 'test' } });
 * });
 * ```
 */
export async function withRetryTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(callback, {
        timeout: 20000, // 20 second timeout
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Retry only on connection-related errors
      const isConnectionError = 
        lastError.message.includes("Can't reach database") ||
        lastError.message.includes("database server") ||
        lastError.message.includes("connection") ||
        lastError.message.includes("timeout");
      
      if (!isConnectionError || attempt >= maxRetries) {
        throw lastError;
      }
      
      logger.warn(`Transaction retry ${attempt}/${maxRetries}:`, {
        error: lastError.message,
      });
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw lastError || new Error('Transaction failed');
}
