/**
 * Script to create a test user in the database
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Generate offline UUID from username (Minecraft style)
 */
function generateOfflineUUID(username: string): string {
  const hash = crypto.createHash('md5').update(`OfflinePlayer:${username}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
}

async function createTestUser() {
  try {
    console.log('🔧 Creating test user...\n');

    // Test user data
    const username = 'testuser';
    const password = 'test123';
    const email = 'test@example.com';

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      console.log('⚠️  User already exists!');
      console.log(`   Username: ${existing.username}`);
      console.log(`   UUID: ${existing.uuid}`);
      console.log(`   Created: ${existing.createdAt}`);
      console.log('\n💡 To create a new user, use a different username or delete the existing one.');
      await prisma.$disconnect();
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate UUID
    const uuid = generateOfflineUUID(username);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        uuid,
        email,
      },
    });

    console.log('✅ Test user created successfully!\n');
    console.log('📋 User details:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Password: ${password} (plain text - remember to change!)`);
    console.log(`   Email: ${user.email || 'none'}`);
    console.log(`   UUID: ${user.uuid}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log('\n🎮 You can now login with:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  Remember to change the password in production!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error creating test user:');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the script
createTestUser();

