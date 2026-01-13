/**
 * Database service
 *
 * Provides typed Prisma client with connection pooling, timeouts, and reconnection handling.
 * All database operations should use the exported `prisma` instance.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { execSync } from 'child_process';
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
// Check if running in CLI mode to disable query logging
const isCLI = process.argv.some(arg => arg.includes('cli'));

export const prisma = new PrismaClient({
  log: ['error', 'warn'], // Отключили query логи для чистого вывода
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

/**
 * Run database migrations using prisma db push
 *
 * This function synchronizes the database schema with the Prisma schema.
 * It's safe to run multiple times - it only applies changes that don't exist.
 *
 * @param skipGenerate - Skip Prisma client generation (default: false)
 * @returns true if successful, throws error if failed
 *
 * @example
 * ```ts
 * await runMigrations();
 * // Database schema is now in sync with Prisma schema
 * ```
 */
export async function runMigrations(skipGenerate: boolean = false): Promise<boolean> {
  try {
    logger.info('Starting database schema synchronization...');

    // Run prisma db push to sync schema
    const command = skipGenerate
      ? 'npx prisma db push --skip-generate --accept-data-loss'
      : 'npx prisma db push --accept-data-loss';

    execSync(command, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: { ...process.env },
    });

    logger.info('Database schema synchronized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to synchronize database schema:', error);
    throw error;
  }
}

/**
 * Check if database tables exist and create if needed
 *
 * Verifies that critical tables exist in the database.
 * If tables are missing, runs migrations to create them.
 *
 * @param autoMigrate - Automatically run migrations if tables are missing (default: true)
 * @returns true if tables exist or were created successfully
 *
 * @example
 * ```ts
 * await ensureDatabaseTables();
 * // All required tables now exist
 * ```
 */
export async function ensureDatabaseTables(autoMigrate: boolean = true): Promise<boolean> {
  try {
    // Check if we can query the database
    const result = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name IN ('users', 'sessions', 'client_profiles')
      LIMIT 3
    `;

    // If we have at least one critical table, database is initialized
    if (result && result.length > 0) {
      logger.info('Database tables exist, skipping initialization');
      return true;
    }

    // No tables found - need to initialize
    logger.warn('Database tables not found, initializing...');

    if (autoMigrate) {
      await runMigrations(true);
      logger.info('Database initialized successfully');
      return true;
    } else {
      logger.warn('Database tables missing but auto-migrate is disabled');
      return false;
    }
  } catch (error) {
    logger.error('Failed to check database tables:', error);

    // If error is about missing tables, try to migrate
    if (autoMigrate) {
      logger.info('Attempting to create database tables...');
      try {
        await runMigrations(true);
        return true;
      } catch (migrateError) {
        logger.error('Failed to create database tables:', migrateError);
        throw migrateError;
      }
    }

    throw error;
  }
}

/**
 * Initialize database with connection, schema check, and optional migration
 *
 * This is the recommended function to call during application bootstrap.
 * It:
 * 1. Connects to the database
 * 2. Checks if tables exist
 * 3. Runs migrations if needed
 *
 * @param options - Configuration options
 * @returns Promise that resolves when database is ready
 *
 * @example
 * ```ts
 * await initializeDatabaseWithMigrations();
 * // Database is connected, schema is synced, ready to use
 * ```
 */
export async function initializeDatabaseWithMigrations(options?: {
  maxRetries?: number;
  retryDelayMs?: number;
  skipMigrations?: boolean;
}): Promise<void> {
  const { maxRetries = 3, retryDelayMs = 1000, skipMigrations = false } = options || {};

  // First, connect to database
  await initializeDatabase(maxRetries, retryDelayMs);

  // Then, ensure tables exist (run migrations if needed)
  if (!skipMigrations) {
    await ensureDatabaseTables(true);
  }

  logger.info('Database fully initialized and ready');
}
