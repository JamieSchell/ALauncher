/**
 * Скрипт для добавления профиля версии 1.12.2
 * Использование: npx tsx scripts/add-profile-1.12.2.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addProfile1122() {
  try {
    console.log('Добавление профиля для версии 1.12.2...');

    const profile = await prisma.clientProfile.create({
      data: {
        version: '1.12.2',
        assetIndex: '1.12',
        sortIndex: 10,
        title: 'Minecraft 1.12.2',
        description: 'Классическая версия Minecraft 1.12.2',
        tags: ['CLASSIC'],
        serverAddress: '5.188.119.206',
        serverPort: 25565,
        jvmVersion: '8',
        updateFastCheck: true,
        update: ['.*\\.jar$', '.*\\.json$'],
        updateVerify: ['.*\\.jar$'],
        updateExclusions: ['.*\\.log$', '.*\\.txt$'],
        mainClass: 'net.minecraft.client.main.Main',
        classPath: ['${clientJar}'],
        jvmArgs: [
          '-Xmx2G',
          '-Xms1G',
          '-XX:+UseG1GC',
          '-XX:+ParallelRefProcEnabled',
          '-XX:MaxGCPauseMillis=200',
          '-XX:+UnlockExperimentalVMOptions',
          '-XX:+DisableExplicitGC',
          '-XX:+AlwaysPreTouch',
          '-XX:G1NewSizePercent=30',
          '-XX:G1MaxNewSizePercent=40',
          '-XX:G1HeapRegionSize=8M',
          '-XX:G1ReservePercent=20',
          '-XX:G1HeapWastePercent=5',
          '-XX:G1MixedGCCountTarget=4',
          '-XX:InitiatingHeapOccupancyPercent=15',
          '-XX:G1MixedGCLiveThresholdPercent=90',
          '-XX:G1RSetUpdatingPauseTimePercent=5',
          '-XX:SurvivorRatio=32',
          '-XX:+PerfDisableSharedMem',
          '-XX:MaxTenuringThreshold=1',
          '-Dusing.aikars.flags=https://mcflags.emc.gs',
          '-Daikars.new.flags=true',
        ],
        clientArgs: [
          '--username',
          '${username}',
          '--version',
          '1.12.2',
          '--gameDir',
          '${gameDir}',
          '--assetsDir',
          '${assetsDir}',
          '--assetIndex',
          '1.12',
          '--uuid',
          '${uuid}',
          '--accessToken',
          '${accessToken}',
          '--userType',
          'mojang',
          '--versionType',
          'release',
          '--server',
          '${serverAddress}',
          '--port',
          '${serverPort}',
        ],
        enabled: true,
      },
    });

    console.log('✅ Профиль успешно добавлен!');
    console.log('ID:', profile.id);
    console.log('Версия:', profile.version);
    console.log('Название:', profile.title);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('❌ Ошибка: Профиль с такой версией уже существует');
    } else {
      console.error('❌ Ошибка при добавлении профиля:', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addProfile1122();

