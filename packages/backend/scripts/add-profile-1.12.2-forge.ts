/**
 * Скрипт для добавления профиля версии 1.12.2 с поддержкой Forge
 * Использование: npx tsx scripts/add-profile-1.12.2-forge.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addProfile1122Forge() {
  try {
    console.log('🔧 Добавление профиля для версии 1.12.2 с Forge...\n');

    // Получаем максимальный sortIndex
    const maxProfile = await prisma.clientProfile.findFirst({
      orderBy: { sortIndex: 'desc' },
      select: { sortIndex: true },
    });
    
    const sortIndex = (maxProfile?.sortIndex ?? -1) + 1;

    const profile = await prisma.clientProfile.create({
      data: {
        version: '1.12.2',
        assetIndex: '1.12',
        sortIndex: sortIndex,
        title: 'Minecraft 1.12.2 Forge',
        description: 'Minecraft 1.12.2 с поддержкой модов Forge',
        tags: ['FORGE', 'MODS'],
        serverAddress: '5.188.119.206',
        serverPort: 25565,
        jvmVersion: '8',
        updateFastCheck: true,
        update: ['.*\\.jar$', '.*\\.json$', '.*forge.*\\.jar$'],
        updateVerify: ['.*\\.jar$', '.*forge.*\\.jar$'],
        updateExclusions: ['.*\\.log$', '.*\\.txt$'],
        // Forge использует LaunchWrapper
        mainClass: 'net.minecraft.launchwrapper.Launch',
        classPath: [
          '${clientJar}',
          'libraries/net/minecraftforge/forge/1.12.2-14.23.5.2860/forge-1.12.2-14.23.5.2860.jar',
          'libraries/net/minecraft/launchwrapper/1.12/launchwrapper-1.12.jar',
        ],
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
          // Forge специфичные аргументы
          '-Dforge.logging.markers=REGISTRIES',
          '-Dforge.logging.console.level=debug',
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
          // Forge tweaker класс
          '--tweakClass',
          'net.minecraftforge.fml.common.launcher.FMLTweaker',
        ],
        enabled: true,
      },
    });

    console.log('✅ Профиль с Forge успешно добавлен!\n');
    console.log('📋 Детали профиля:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Версия: ${profile.version}`);
    console.log(`   Название: ${profile.title}`);
    console.log(`   Main Class: ${profile.mainClass}`);
    console.log(`   Tweaker: net.minecraftforge.fml.common.launcher.FMLTweaker`);
    console.log(`   Java: ${profile.jvmVersion}`);
    console.log(`   Server: ${profile.serverAddress}:${profile.serverPort}`);
    console.log(`   Sort Index: ${profile.sortIndex}`);
    console.log('\n💡 Примечание:');
    console.log('   • Убедитесь, что Forge установлен в папке libraries');
    console.log('   • Рекомендуемая версия Forge: 1.12.2-14.23.5.2860');
    console.log('   • Моды должны быть в папке mods/');
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('❌ Ошибка: Профиль с такой конфигурацией уже существует');
    } else {
      console.error('❌ Ошибка при добавлении профиля:', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addProfile1122Forge();

