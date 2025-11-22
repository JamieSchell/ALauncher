/**
 * Script to add a client version to the database
 * Usage: npm run add-client-version <version> <title> <clientJarPath> <mainClass>
 * 
 * Example:
 * npm run add-client-version 1.20.4 "Vanilla 1.20.4" "./updates/1.20.4/client.jar" "net.minecraft.client.main.Main"
 */

import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { config } from '../src/config';

const prisma = new PrismaClient();

async function addClientVersion() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 4) {
      console.error('Usage: npm run add-client-version <version> <title> <clientJarPath> <mainClass>');
      console.error('Example: npm run add-client-version 1.20.4 "Vanilla 1.20.4" "./updates/1.20.4/client.jar" "net.minecraft.client.main.Main"');
      process.exit(1);
    }

    const [version, title, clientJarPath, mainClass] = args;

    console.log(`\n🔧 Adding client version: ${title} (${version})\n`);

    // Проверить существование client.jar
    const fullClientJarPath = path.isAbsolute(clientJarPath) 
      ? clientJarPath 
      : path.join(process.cwd(), clientJarPath);

    if (!await fs.access(fullClientJarPath).then(() => true).catch(() => false)) {
      throw new Error(`Client JAR not found: ${fullClientJarPath}`);
    }

    // Вычислить хеш и размер
    const clientJarContent = await fs.readFile(fullClientJarPath);
    const clientJarHash = crypto.createHash('sha256').update(clientJarContent).digest('hex');
    const clientJarSize = BigInt(clientJarContent.length);

    console.log(`✓ Client JAR: ${path.basename(fullClientJarPath)}`);
    console.log(`  Size: ${(Number(clientJarSize) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Hash: ${clientJarHash.substring(0, 16)}...`);

    // Проверить, существует ли версия
    const existing = await prisma.clientVersion.findUnique({
      where: { version },
    });

    if (existing) {
      console.log(`\n⚠️  Version ${version} already exists!`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   Title: ${existing.title}`);
      console.log(`\n💡 Use a different version number or update the existing one.`);
      await prisma.$disconnect();
      return;
    }

    // Создать версию
    const clientVersion = await prisma.clientVersion.create({
      data: {
        version,
        title,
        description: `Minecraft ${version} client`,
        clientJarPath: fullClientJarPath,
        clientJarHash,
        clientJarSize,
        mainClass,
        jvmVersion: '17',
        jvmArgs: [
          '-XX:+UseG1GC',
          '-XX:+UnlockExperimentalVMOptions',
          '-XX:G1NewSizePercent=20',
          '-XX:G1ReservePercent=20',
          '-XX:MaxGCPauseMillis=50',
          '-XX:G1HeapRegionSize=32M',
        ],
        clientArgs: [],
        enabled: true,
      },
    });

    console.log(`\n✅ Client version created successfully!`);
    console.log(`   ID: ${clientVersion.id}`);
    console.log(`   Version: ${clientVersion.version}`);
    console.log(`   Title: ${clientVersion.title}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Add client files using: npm run add-client-files ${clientVersion.id}`);
    console.log(`   2. Or manually add files to the database`);

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('\n❌ Error adding client version:');
    console.error(error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

addClientVersion();

