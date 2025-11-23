/**
 * Script to reset user password
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const username = process.argv[2] || 'XuViGaN';
    const newPassword = process.argv[3] || 'XuViGaN123';

    console.log('🔐 Resetting password...\n');
    console.log(`Username: ${username}`);
    console.log(`New Password: ${newPassword}\n`);

    // Find user (without selecting role to avoid errors)
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
      },
    });

    if (!user) {
      console.log('❌ User not found!');
      await prisma.$disconnect();
      return;
    }

    console.log('✅ User found!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Current password hash: ${user.password.substring(0, 30)}...\n`);

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log('✅ Password updated successfully!\n');
    console.log('🎮 You can now login with:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${newPassword}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

resetPassword();

