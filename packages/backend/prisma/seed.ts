/**
 * Database Seed Script
 *
 * Fills the database with initial data for development and production.
 * Run with: npx ts-node prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Default admin user credentials
 */
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'Admin123!', // Change this after first login!
  email: 'admin@alauncher.su',
  role: 'ADMIN' as const,
};

/**
 * Default test user credentials
 */
const DEFAULT_TEST_USER = {
  username: 'testuser',
  password: 'Test123!',
  email: 'test@example.com',
  role: 'USER' as const,
};

/**
 * Sample client profile for a Minecraft server
 */
const SAMPLE_PROFILE = {
  version: '1.20.4',
  assetIndex: '20',
  clientDirectory: 'hitech',
  sortIndex: 1,
  title: 'HiTech Server',
  description: 'Официальный клиент сервера HiTech',
  tags: ['TOP', 'NEW'],
  economyConfig: {
    enabled: true,
    tableName: 'economy',
    balanceColumn: 'money',
    orderBy: 'money DESC',
    limit: 100,
  },
  serverAddress: 'play.hitech.ru',
  serverPort: 25565,
  jvmVersion: '17',
  updateFastCheck: true,
  update: [],
  updateVerify: [],
  updateExclusions: [],
  mainClass: 'net.minecraft.client.main.Main',
  classPath: [],
  jvmArgs: [
    '-Xmx2G',
    '-Xms1G',
    '-XX:+UseG1GC',
    '-XX:+UnlockExperimentalVMOptions',
    '-XX:G1NewSizePercent=20',
    '-XX:G1ReservePercent=20',
    '-XX:MaxGCPauseMillis=50',
    '-XX:G1HeapRegionSize=32M',
  ],
  clientArgs: [],
  enabled: true,
};

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Create admin user if not exists
    console.log('Creating admin user...');
    const existingAdmin = await prisma.user.findUnique({
      where: { username: DEFAULT_ADMIN.username },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

      // Generate a random UUID for Minecraft account
      const minecraftUUID = generateUUID();

      await prisma.user.create({
        data: {
          username: DEFAULT_ADMIN.username,
          password: hashedPassword,
          email: DEFAULT_ADMIN.email,
          role: DEFAULT_ADMIN.role,
          uuid: minecraftUUID,
          banned: false,
        },
      });

      console.log(`   ✅ Admin user created (username: ${DEFAULT_ADMIN.username}, password: ${DEFAULT_ADMIN.password})`);
      console.log(`   ⚠️  IMPORTANT: Change the default password after first login!`);
    } else {
      console.log(`   ℹ️  Admin user already exists (username: ${DEFAULT_ADMIN.username})`);
    }

    // 2. Create test user if not exists
    console.log('\nCreating test user...');
    const existingTestUser = await prisma.user.findUnique({
      where: { username: DEFAULT_TEST_USER.username },
    });

    if (!existingTestUser) {
      const hashedPassword = await bcrypt.hash(DEFAULT_TEST_USER.password, 10);
      const minecraftUUID = generateUUID();

      await prisma.user.create({
        data: {
          username: DEFAULT_TEST_USER.username,
          password: hashedPassword,
          email: DEFAULT_TEST_USER.email,
          role: DEFAULT_TEST_USER.role,
          uuid: minecraftUUID,
          banned: false,
        },
      });

      console.log(`   ✅ Test user created (username: ${DEFAULT_TEST_USER.username}, password: ${DEFAULT_TEST_USER.password})`);
    } else {
      console.log(`   ℹ️  Test user already exists (username: ${DEFAULT_TEST_USER.username})`);
    }

    // 3. Create sample client profile if not exists
    console.log('\nCreating sample client profile...');
    const existingProfile = await prisma.clientProfile.findFirst({
      where: { title: SAMPLE_PROFILE.title },
    });

    if (!existingProfile) {
      await prisma.clientProfile.create({
        data: SAMPLE_PROFILE as any,
      });

      console.log(`   ✅ Sample profile created (title: ${SAMPLE_PROFILE.title})`);
    } else {
      console.log(`   ℹ️  Sample profile already exists (title: ${SAMPLE_PROFILE.title})`);
    }

    // 4. Display summary
    const userCount = await prisma.user.count();
    const profileCount = await prisma.clientProfile.count();

    console.log('\n📊 Seeding summary:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Profiles: ${profileCount}`);
    console.log('\n✅ Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

/**
 * Generate a random UUID (format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

main()
  .catch((e) => {
    console.error('Fatal error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
