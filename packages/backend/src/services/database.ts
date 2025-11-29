/**
 * Database service
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Prisma 7.x: The adapter requirement might be a configuration issue
// For now, using standard PrismaClient - if adapter is truly required,
// we may need to check Prisma 7.x migration guide or use Prisma 6.x
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export async function initializeDatabase() {
  try {
    await prisma.$connect();
    // Logging handled in index.ts
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
