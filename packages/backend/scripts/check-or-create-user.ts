/**
 * Script to check if user exists and create/update if needed
 */

import { PrismaClient, UserRole } from '@prisma/client';
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

async function checkOrCreateUser() {
  try {
    const username = process.argv[2] || 'XuViGaN';
    const password = process.argv[3] || 'XuViGaN123';
    const role = (process.argv[4] || 'ADMIN').toUpperCase() as UserRole;

    console.log('🔍 Checking user...\n');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}\n`);

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        uuid: true,
        email: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (existing) {
      console.log('✅ User found!\n');
      console.log('📋 Current user details:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Username: ${existing.username}`);
      console.log(`   UUID: ${existing.uuid}`);
      console.log(`   Email: ${existing.email || 'none'}`);
      console.log(`   Role: ${existing.role}`);
      console.log(`   Created: ${existing.createdAt.toLocaleString()}`);
      console.log(`   Last Login: ${existing.lastLogin ? existing.lastLogin.toLocaleString() : 'never'}\n`);

      // Check password
      const userWithPassword = await prisma.user.findUnique({
        where: { username },
        select: { password: true },
      });

      if (userWithPassword) {
        console.log('🔐 Verifying password...');
        const isValid = await bcrypt.compare(password, userWithPassword.password);
        
        if (isValid) {
          console.log('✅ Password is correct!\n');
        } else {
          console.log('❌ Password is incorrect!');
          console.log('💡 Updating password...\n');
          
          const newHash = await bcrypt.hash(password, 10);
          await prisma.user.update({
            where: { id: existing.id },
            data: { password: newHash },
          });
          
          console.log('✅ Password updated!\n');
        }
      }

      // Update role if needed
      if (existing.role !== role) {
        console.log(`🔄 Updating role from ${existing.role} to ${role}...\n`);
        await prisma.user.update({
          where: { id: existing.id },
          data: { role },
        });
        console.log('✅ Role updated!\n');
      }

      console.log('🎮 You can now login with:');
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: ${role}`);

      await prisma.$disconnect();
      return;
    }

    // User doesn't exist, create it
    console.log('⚠️  User not found. Creating new user...\n');

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
        role,
      },
    });

    console.log('✅ User created successfully!\n');
    console.log('📋 User details:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Password: ${password} (plain text - remember to change!)`);
    console.log(`   UUID: ${user.uuid}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.createdAt.toLocaleString()}\n`);
    console.log('🎮 You can now login with:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the script
checkOrCreateUser();

