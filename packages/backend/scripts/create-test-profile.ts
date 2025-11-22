/**
 * Script to create a test Minecraft profile
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestProfile() {
  try {
    // Get version from command line argument or use default
    const version = process.argv[2] || '1.20.4';
    const assetIndex = version.split('.').slice(0, 2).join('.'); // 1.12.2 -> 1.12, 1.20.4 -> 1.20
    const id = `vanilla-${version}`;
    const title = `Vanilla ${version}`;
    
    // Determine JVM version based on Minecraft version
    let jvmVersion = '17';
    if (version.startsWith('1.21')) {
      jvmVersion = '21';
    } else if (version.startsWith('1.17') || version.startsWith('1.18') || version.startsWith('1.19') || version.startsWith('1.20')) {
      jvmVersion = '17';
    } else if (version.startsWith('1.16')) {
      jvmVersion = '16';
    } else if (version.startsWith('1.12') || version.startsWith('1.13') || version.startsWith('1.14') || version.startsWith('1.15')) {
      jvmVersion = '8';
    }

    console.log(`🔧 Creating Minecraft profile: ${title}...\n`);

    // Get max sortIndex to append new profile
    const maxProfile = await prisma.clientProfile.findFirst({
      orderBy: { sortIndex: 'desc' },
      select: { sortIndex: true },
    });
    const sortIndex = (maxProfile?.sortIndex ?? -1) + 1;

    // Profile data
    const profileData = {
      id,
      version,
      assetIndex,
      sortIndex,
      title,
      serverAddress: 'localhost',
      serverPort: 25565,
      jvmVersion,
      updateFastCheck: true,
      update: ['libraries', 'client\\.jar'], // Regex patterns
      updateVerify: ['libraries', 'client\\.jar'],
      updateExclusions: [],
      mainClass: 'net.minecraft.client.main.Main',
      classPath: ['libraries', 'client.jar'], // Will be stored as JSON
      jvmArgs: ['-XX:+UseG1GC', '-XX:+UnlockExperimentalVMOptions', '-XX:+UseG1GC', '-XX:G1NewSizePercent=20', '-XX:G1ReservePercent=20', '-XX:MaxGCPauseMillis=50', '-XX:G1HeapRegionSize=32M'],
      clientArgs: [],
      enabled: true,
    };

    // Check if profile already exists
    const existing = await prisma.clientProfile.findUnique({
      where: { id: profileData.id },
    });

    if (existing) {
      console.log('⚠️  Profile already exists!');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Title: ${existing.title}`);
      console.log(`   Version: ${existing.version}`);
      console.log('\n💡 To create a new profile, use a different ID or delete the existing one.');
      await prisma.$disconnect();
      return;
    }

    // Create profile
    const profile = await prisma.clientProfile.create({
      data: {
        id: profileData.id,
        version: profileData.version,
        assetIndex: profileData.assetIndex,
        sortIndex: profileData.sortIndex,
        title: profileData.title,
        serverAddress: profileData.serverAddress,
        serverPort: profileData.serverPort,
        jvmVersion: profileData.jvmVersion,
        updateFastCheck: profileData.updateFastCheck,
        update: profileData.update as any, // JSON array
        updateVerify: profileData.updateVerify as any,
        updateExclusions: profileData.updateExclusions as any,
        mainClass: profileData.mainClass,
        classPath: profileData.classPath as any,
        jvmArgs: profileData.jvmArgs as any,
        clientArgs: profileData.clientArgs as any,
        enabled: profileData.enabled,
      },
    });

    console.log('✅ Test profile created successfully!\n');
    console.log('📋 Profile details:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Title: ${profile.title}`);
    console.log(`   Version: ${profile.version}`);
    console.log(`   Server: ${profile.serverAddress}:${profile.serverPort}`);
    console.log(`   Main Class: ${profile.mainClass}`);
    console.log(`   JVM Args: ${profile.jvmArgs.length} arguments`);
    console.log(`   ClassPath: ${profile.classPath.length} entries`);
    console.log(`   Enabled: ${profile.enabled}`);
    console.log('\n🎮 Profile is now available in the launcher!');
    console.log('   Click "Refresh" button in the launcher or reload the page to see it.');

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Error creating test profile:');
    console.error(error.message);
    if (error.code === 'P2002') {
      console.error('\n💡 Profile with this ID already exists. Use a different ID or delete the existing one.');
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the script
createTestProfile();
