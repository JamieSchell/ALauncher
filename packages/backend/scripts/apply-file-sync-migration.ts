/**
 * Migration: Add file integrity check fields to client_files table
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    logger.info('[Migration] Adding file integrity check fields to client_files table...');

    // Check if columns already exist
    const tableInfo = await prisma.$queryRaw<Array<{ COLUMN_NAME: string }>>`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'client_files'
    `;

    const existingFields = tableInfo.map(row => row.COLUMN_NAME);
    const fieldsToAdd: Array<{ name: string; sql: string }> = [];

    if (!existingFields.includes('verified')) {
      fieldsToAdd.push({
        name: 'verified',
        sql: 'ALTER TABLE `client_files` ADD COLUMN `verified` BOOLEAN NOT NULL DEFAULT FALSE',
      });
    }

    if (!existingFields.includes('lastVerified')) {
      fieldsToAdd.push({
        name: 'lastVerified',
        sql: 'ALTER TABLE `client_files` ADD COLUMN `lastVerified` DATETIME(3) NULL',
      });
    }

    if (!existingFields.includes('integrityCheckFailed')) {
      fieldsToAdd.push({
        name: 'integrityCheckFailed',
        sql: 'ALTER TABLE `client_files` ADD COLUMN `integrityCheckFailed` BOOLEAN NOT NULL DEFAULT FALSE',
      });
    }

    if (fieldsToAdd.length === 0) {
      logger.info('[Migration] All fields already exist, skipping migration');
      return;
    }

    // Add indexes if needed
    const indexInfo = await prisma.$queryRaw<Array<{ INDEX_NAME: string }>>`
      SELECT DISTINCT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'client_files'
    `;

    const existingIndexes = indexInfo.map(row => row.INDEX_NAME);

    // Execute migrations
    for (const field of fieldsToAdd) {
      logger.info(`[Migration] Adding field: ${field.name}`);
      await prisma.$executeRawUnsafe(field.sql);
    }

    // Add indexes
    if (!existingIndexes.includes('idx_verified')) {
      logger.info('[Migration] Adding index: idx_verified');
      await prisma.$executeRawUnsafe('CREATE INDEX `idx_verified` ON `client_files` (`verified`)');
    }

    if (!existingIndexes.includes('idx_integrityCheckFailed')) {
      logger.info('[Migration] Adding index: idx_integrityCheckFailed');
      await prisma.$executeRawUnsafe('CREATE INDEX `idx_integrityCheckFailed` ON `client_files` (`integrityCheckFailed`)');
    }

    logger.info('[Migration] ✅ File sync migration completed successfully');
  } catch (error) {
    logger.error('[Migration] ❌ Error applying file sync migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

