/**
 * Script to add a launcher version to the database
 * Usage: npm run add-launcher-version <version> <downloadUrl> [releaseNotes] [isRequired]
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function addLauncherVersion() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.error('Usage: npm run add-launcher-version <version> <downloadUrl> [releaseNotes] [isRequired]');
      console.error('Example: npm run add-launcher-version 1.2.0 https://example.com/launcher-1.2.0.exe "Bug fixes" false');
      process.exit(1);
    }

    const version = args[0];
    const downloadUrl = args[1];
    const releaseNotes = args[2] || null;
    const isRequired = args[3] === 'true' || args[3] === '1';

    console.log(`\n📦 Adding launcher version: ${version}`);
    console.log(`   Download URL: ${downloadUrl}`);
    console.log(`   Release Notes: ${releaseNotes || 'None'}`);
    console.log(`   Required: ${isRequired}\n`);

    // Check if version already exists
    const existing = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version
      FROM launcher_versions
      WHERE version = ${version}
    `;

    if (existing.length > 0) {
      console.error(`❌ Version ${version} already exists!`);
      process.exit(1);
    }

    // Insert new version
    await prisma.$executeRaw`
      INSERT INTO launcher_versions (id, version, downloadUrl, releaseNotes, isRequired, enabled, createdAt)
      VALUES (${uuidv4()}, ${version}, ${downloadUrl}, ${releaseNotes}, ${isRequired}, 1, NOW())
    `;

    console.log(`✅ Launcher version ${version} added successfully!\n`);
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error adding launcher version:');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

addLauncherVersion();

