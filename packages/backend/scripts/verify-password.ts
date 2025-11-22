/**
 * Script to verify user password
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function verifyPassword() {
  try {
    const username = 'testuser';
    const password = 'test123';

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.log('❌ User not found');
      await prisma.$disconnect();
      return;
    }

    console.log('🔍 Verifying password...');
    console.log(`Username: ${user.username}`);
    console.log(`Password hash: ${user.password.substring(0, 20)}...`);

    const isValid = await bcrypt.compare(password, user.password);
    
    if (isValid) {
      console.log('✅ Password is correct!');
    } else {
      console.log('❌ Password is incorrect!');
      console.log('💡 Creating new password hash...');
      
      const newHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });
      
      console.log('✅ Password hash updated!');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyPassword();

