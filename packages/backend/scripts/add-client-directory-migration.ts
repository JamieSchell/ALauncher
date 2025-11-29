/**
 * Migration: Add clientDirectory field to client_profiles table
 * This allows profiles to have custom directory names (e.g., "HiTech", "HiPower")
 * instead of using version numbers (e.g., "1.12.2")
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration: Add clientDirectory field...');

  try {
    // Check if column already exists
    const result = await prisma.$queryRaw<Array<{ COLUMN_NAME: string }>>`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'client_profiles' 
        AND COLUMN_NAME = 'clientDirectory'
    `;

    if (result.length > 0) {
      console.log('✓ Column clientDirectory already exists, skipping migration');
      return;
    }

    // Add the column
    await prisma.$executeRaw`
      ALTER TABLE client_profiles 
      ADD COLUMN clientDirectory VARCHAR(255) NOT NULL DEFAULT '' AFTER assetIndex
    `;

    console.log('✓ Column clientDirectory added successfully');

    // Update existing profiles: generate clientDirectory from title
    const profiles = await prisma.clientProfile.findMany({
      select: { id: true, title: true },
    });

    for (const profile of profiles) {
      // Generate safe directory name from title
      const safeDirectoryName = profile.title
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .toLowerCase();

      await prisma.clientProfile.update({
        where: { id: profile.id },
        data: { clientDirectory: safeDirectoryName },
      });

      console.log(`✓ Updated profile "${profile.title}" with clientDirectory: ${safeDirectoryName}`);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });

