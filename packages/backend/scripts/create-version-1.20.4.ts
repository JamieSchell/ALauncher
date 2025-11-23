/**
 * Script to create Minecraft 1.20.4 client version
 * This creates a basic version entry that can be used for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createVersion1204() {
  try {
    const version = '1.20.4';
    
    console.log(`\n🔧 Creating client version: ${version}\n`);

    // Check if version already exists
    const existing = await prisma.clientVersion.findUnique({
      where: { version },
    });

    if (existing) {
      console.log(`⚠️  Version ${version} already exists!`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   Title: ${existing.title}`);
      await prisma.$disconnect();
      return;
    }

    // Create version with minimal required data
    // Note: You'll need to update paths and hashes after adding actual files
    const clientVersion = await prisma.clientVersion.create({
      data: {
        version,
        title: 'Minecraft 1.20.4',
        description: 'Minecraft 1.20.4 client version',
        clientJarPath: './updates/1.20.4/client.jar', // Update this path
        clientJarHash: '0000000000000000000000000000000000000000000000000000000000000000', // Placeholder - update after adding files
        clientJarSize: BigInt(0), // Placeholder - update after adding files
        mainClass: 'net.minecraft.client.main.Main',
        jvmVersion: '17',
        jvmArgs: [
          '-XX:+UseG1GC',
          '-XX:+UnlockExperimentalVMOptions',
          '-XX:G1NewSizePercent=20',
          '-XX:G1ReservePercent=20',
          '-XX:MaxGCPauseMillis=50',
          '-XX:G1HeapRegionSize=32M',
        ],
        clientArgs: [],
        enabled: true,
      },
    });

    console.log(`\n✅ Client version created successfully!`);
    console.log(`   ID: ${clientVersion.id}`);
    console.log(`   Version: ${clientVersion.version}`);
    console.log(`   Title: ${clientVersion.title}`);
    console.log(`\n⚠️  IMPORTANT: This is a placeholder version!`);
    console.log(`   You need to:`);
    console.log(`   1. Download Minecraft 1.20.4 client files`);
    console.log(`   2. Update clientJarPath, clientJarHash, and clientJarSize`);
    console.log(`   3. Add client files to the database using add-client-files script`);
    console.log(`\n💡 To update the version, use:`);
    console.log(`   npx tsx scripts/update-version-files.ts ${clientVersion.id}`);

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('\n❌ Error creating client version:');
    console.error(error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createVersion1204();

