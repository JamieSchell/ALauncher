/**
 * Script to list all users in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('📋 Listing all users...\n');

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        uuid: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (users.length === 0) {
      console.log('⚠️  No users found in database.');
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   UUID: ${user.uuid}`);
        console.log(`   Email: ${user.email || 'none'}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
        console.log(`   Last Login: ${user.lastLogin ? user.lastLogin.toLocaleString() : 'never'}`);
        console.log('');
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error listing users:');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

listUsers();

