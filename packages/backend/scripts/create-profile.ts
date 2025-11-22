/**
 * Universal script to create a Minecraft profile
 * Usage: npm run create-profile-custom -- <id> <version> <title>
 * Example: npm run create-profile-custom -- "vanilla-1.21" "1.21" "Vanilla 1.21"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createProfile() {
  try {
    // Get arguments from command line
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
      console.log('📋 Usage: npm run create-profile-custom -- <id> <version> <title> [serverAddress] [serverPort]');
      console.log('📋 Example: npm run create-profile-custom -- "vanilla-1.21" "1.21" "Vanilla 1.21" "localhost" 25565');
      console.log('\n💡 Or use predefined scripts:');
      console.log('   npm run create-profile        - Creates Vanilla 1.20.4');
      console.log('   npm run create-profile-1.21  - Creates Vanilla 1.21');
      process.exit(1);
    }

    const [id, version, title, serverAddress = 'localhost', serverPort = 25565] = args;
    const assetIndex = version.split('.').slice(0, 2).join('.'); // 1.21 -> 1.21, 1.20.4 -> 1.20

    console.log(`🔧 Creating Minecraft profile: ${title} (${version})...\n`);

    const profileData = {
      id,
      version,
      assetIndex,
      sortIndex: 999, // Will be set to max + 1
      title,
      serverAddress,
      serverPort: parseInt(serverPort.toString()),
      jvmVersion: version.startsWith('1.21') ? '21' : '17',
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

    // Get max sortIndex
    const maxProfile = await prisma.clientProfile.findFirst({
      orderBy: { sortIndex: 'desc' },
      select: { sortIndex: true },
    });
    
    profileData.sortIndex = (maxProfile?.sortIndex ?? -1) + 1;

    const existing = await prisma.clientProfile.findUnique({
      where: { id: profileData.id },
    });

    if (existing) {
      console.log('⚠️  Profile already exists!');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Title: ${existing.title}`);
      console.log(`   Enabled: ${existing.enabled ? '✅' : '❌'}`);
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
    console.log(`   Enabled: ${profile.enabled ? '✅' : '❌'}`);
    console.log(`   Sort Index: ${profile.sortIndex}`);
    console.log('\n🎮 Profile is now available in the launcher!');
    console.log('   Click "Refresh" button in the launcher to see it.');

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Error creating profile:');
    console.error(error.message);
    if (error.code === 'P2002') {
      console.error('\n💡 Profile with this ID already exists. Use a different ID.');
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

createProfile();

