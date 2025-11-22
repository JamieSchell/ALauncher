/**
 * Script to create Minecraft 1.21 profile
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createProfile121() {
  try {
    console.log('🔧 Creating Minecraft 1.21 profile...\n');

    const profileData = {
      id: 'vanilla-1.21',
      version: '1.21',
      assetIndex: '1.21',
      sortIndex: 1,
      title: 'Vanilla 1.21',
      serverAddress: 'localhost',
      serverPort: 25565,
      jvmVersion: '21',
      updateFastCheck: true,
      update: ['libraries', 'client\\.jar'],
      updateVerify: ['libraries', 'client\\.jar'],
      updateExclusions: [],
      mainClass: 'net.minecraft.client.main.Main',
      classPath: ['libraries', 'client.jar'],
      jvmArgs: ['-XX:+UseG1GC', '-XX:+UnlockExperimentalVMOptions', '-XX:+UseG1GC', '-XX:G1NewSizePercent=20', '-XX:G1ReservePercent=20', '-XX:MaxGCPauseMillis=50', '-XX:G1HeapRegionSize=32M'],
      clientArgs: [],
      enabled: true,
    };

    const existing = await prisma.clientProfile.findUnique({
      where: { id: profileData.id },
    });

    if (existing) {
      console.log('⚠️  Profile already exists!');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Title: ${existing.title}`);
      console.log(`   Enabled: ${existing.enabled}`);
      console.log('\n💡 To update the profile, delete it first or use a different ID.');
      await prisma.$disconnect();
      return;
    }

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
        update: profileData.update as any,
        updateVerify: profileData.updateVerify as any,
        updateExclusions: profileData.updateExclusions as any,
        mainClass: profileData.mainClass,
        classPath: profileData.classPath as any,
        jvmArgs: profileData.jvmArgs as any,
        clientArgs: profileData.clientArgs as any,
        enabled: profileData.enabled,
      },
    });

    console.log('✅ Profile created successfully!\n');
    console.log('📋 Profile details:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Title: ${profile.title}`);
    console.log(`   Version: ${profile.version}`);
    console.log(`   Server: ${profile.serverAddress}:${profile.serverPort}`);
    console.log(`   Enabled: ${profile.enabled}`);
    console.log('\n🎮 Profile is now available in the launcher!');
    console.log('   Click "Refresh" button or reload the launcher to see it.');

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Error creating profile:');
    console.error(error.message);
    if (error.code === 'P2002') {
      console.error('\n💡 Profile with this ID already exists. Use a different ID or delete the existing one.');
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

createProfile121();

