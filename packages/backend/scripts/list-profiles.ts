/**
 * Script to list all profiles in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listProfiles() {
  try {
    console.log('📋 Listing all profiles...\n');

    // List all profiles (including disabled ones)
    const allProfiles = await prisma.clientProfile.findMany({
      orderBy: { sortIndex: 'asc' },
      select: {
        id: true,
        title: true,
        version: true,
        serverAddress: true,
        serverPort: true,
        mainClass: true,
        enabled: true,
        sortIndex: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Separate enabled and disabled
    const profiles = allProfiles.filter(p => p.enabled);
    const disabledProfiles = allProfiles.filter(p => !p.enabled);

    if (allProfiles.length === 0) {
      console.log('⚠️  No profiles found in database.');
      console.log('💡 Create a profile using: npm run create-profile');
    } else {
      console.log(`✅ Found ${allProfiles.length} profile(s) total:\n`);
      
      if (profiles.length > 0) {
        console.log(`📋 Enabled profiles (${profiles.length}):\n`);
        profiles.forEach((profile, index) => {
          console.log(`${index + 1}. ${profile.title} (${profile.id})`);
          console.log(`   Version: ${profile.version}`);
          console.log(`   Server: ${profile.serverAddress}:${profile.serverPort}`);
          console.log(`   Main Class: ${profile.mainClass}`);
          console.log(`   Enabled: ✅`);
          console.log(`   Sort Index: ${profile.sortIndex}`);
          console.log(`   Created: ${profile.createdAt.toLocaleString()}`);
          console.log(`   Updated: ${profile.updatedAt.toLocaleString()}`);
          console.log('');
        });
      }

      if (disabledProfiles.length > 0) {
        console.log(`\n⚠️  Disabled profiles (${disabledProfiles.length}):\n`);
        disabledProfiles.forEach((profile, index) => {
          console.log(`${index + 1}. ${profile.title} (${profile.id})`);
          console.log(`   Version: ${profile.version}`);
          console.log(`   Enabled: ❌ (will not appear in launcher)`);
          console.log(`   Sort Index: ${profile.sortIndex}`);
          console.log('');
        });
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error listing profiles:');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

listProfiles();
