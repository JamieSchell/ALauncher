/**
 * Profile Commands
 * Команды для управления профилями клиентов
 */

import readline from 'readline';
import { BaseCommand } from './base';
import { prisma } from '../../services/database';
import { syncProfileFiles } from '../../services/fileSyncService';
import { ensureAssetsDownloaded, getAssetIndexForVersion } from '../../services/assetDownloadService';

export class ProfileCommands extends BaseCommand {
  getNames(): string[] {
    return ['profile'];
  }

  getDescription(): string {
    return 'Client profile management commands';
  }

  getUsage(): string {
    return `profile list [--all] - List all profiles (--all includes disabled)
profile info <id> - Show profile information
profile add <title> <loader> <version> [serverAddress] [serverPort] - Create new profile
profile sync <id> - Sync client files for profile from updates directory
profile set-jvm <id> <version> - Set Java version for profile (e.g., 8, 16, 17, 21)
profile enable <id> - Enable profile
profile disable <id> - Disable profile
profile delete <id> - Delete profile`;
  }

  getExamples(): string[] {
    return [
      'profile list',
      'profile list --all',
      'profile info <profile-id>',
      'profile add "HiTech" Forge 1.12.2',
      'profile add "My Server" Fabric 1.20.1 192.168.1.100 25565',
      'profile add "Vanilla" Vanilla 1.21.0',
      'profile sync <profile-id>',
      'profile set-jvm <profile-id> 16',
      'profile set-jvm <profile-id> 8',
      'profile enable <profile-id>',
      'profile disable <profile-id>',
      'profile delete <profile-id>',
    ];
  }

  async execute(args: string[], rl: readline.Interface, commandName?: string): Promise<void> {
    if (args.length === 0) {
      this.printError('Subcommand required. Use "profile list", "profile info", etc.');
      this.printInfo('Type "help profile" for usage information');
      return;
    }

    const subcommand = args[0].toLowerCase();

    switch (subcommand) {
      case 'list':
        await this.handleList(args.slice(1));
        break;
      case 'info':
        await this.handleInfo(args.slice(1));
        break;
      case 'add':
        await this.handleAdd(args.slice(1), rl);
        break;
      case 'sync':
        await this.handleSync(args.slice(1));
        break;
      case 'set-jvm':
        await this.handleSetJvm(args.slice(1));
        break;
      case 'enable':
        await this.handleEnable(args.slice(1));
        break;
      case 'disable':
        await this.handleDisable(args.slice(1));
        break;
      case 'delete':
        await this.handleDelete(args.slice(1), rl);
        break;
      default:
        this.printError(`Unknown subcommand: ${subcommand}`);
        this.printInfo('Type "help profile" for usage information');
    }
  }

  private async handleList(args: string[]): Promise<void> {
    const showAll = args.includes('--all');

    try {
      const profiles = await prisma.clientProfile.findMany({
        where: showAll ? {} : { enabled: true },
        select: {
          id: true,
          title: true,
          version: true,
          serverAddress: true,
          serverPort: true,
          enabled: true,
          sortIndex: true,
          createdAt: true,
        },
        orderBy: { sortIndex: 'asc' },
      });

      if (profiles.length === 0) {
        this.printInfo('No profiles found');
        return;
      }

      this.printTable(
        ['ID', 'Title', 'Version', 'Server', 'Enabled', 'Sort', 'Created'],
        profiles.map((p) => [
          p.id.substring(0, 8) + '...',
          p.title,
          p.version,
          `${p.serverAddress}:${p.serverPort}`,
          p.enabled ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m',
          p.sortIndex.toString(),
          this.formatDate(p.createdAt),
        ])
      );

      this.print(`\nTotal: ${profiles.length} profile(s)`);
    } catch (error: any) {
      this.printError(`Failed to list profiles: ${error.message}`);
    }
  }

  private async handleInfo(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: profile info <id>');
      return;
    }

    const id = args[0];

    try {
      const profile = await prisma.clientProfile.findUnique({
        where: { id },
      });

      if (!profile) {
        this.printError(`Profile with ID "${id}" not found`);
        return;
      }

      this.print(`\x1b[1mProfile Information:\x1b[0m\n`);
      this.print(`  ID: ${profile.id}`);
      this.print(`  Title: ${profile.title}`);
      this.print(`  Version: ${profile.version}`);
      this.print(`  Server: ${profile.serverAddress}:${profile.serverPort}`);
      this.print(`  Enabled: ${profile.enabled ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`);
      this.print(`  Sort Index: ${profile.sortIndex}`);
      this.print(`  Main Class: ${profile.mainClass}`);
      this.print(`  JVM Version: ${profile.jvmVersion || 'Not set'}`);
      this.print(`  Created: ${this.formatDate(profile.createdAt)}`);
      this.print(`  Updated: ${this.formatDate(profile.updatedAt)}`);
      
      if (profile.description) {
        this.print(`  Description: ${profile.description}`);
      }
      
      if (profile.tags) {
        const tags = profile.tags as string[];
        if (Array.isArray(tags) && tags.length > 0) {
          this.print(`  Tags: ${tags.join(', ')}`);
        }
      }
    } catch (error: any) {
      this.printError(`Failed to get profile info: ${error.message}`);
    }
  }

  private async handleEnable(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: profile enable <id>');
      return;
    }

    const id = args[0];

    try {
      const profile = await prisma.clientProfile.findUnique({
        where: { id },
      });

      if (!profile) {
        this.printError(`Profile with ID "${id}" not found`);
        return;
      }

      if (profile.enabled) {
        this.printWarning(`Profile "${profile.title}" is already enabled`);
        return;
      }

      await prisma.clientProfile.update({
        where: { id },
        data: { enabled: true },
      });

      this.printSuccess(`Profile "${profile.title}" has been enabled`);
    } catch (error: any) {
      this.printError(`Failed to enable profile: ${error.message}`);
    }
  }

  private async handleDisable(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: profile disable <id>');
      return;
    }

    const id = args[0];

    try {
      const profile = await prisma.clientProfile.findUnique({
        where: { id },
      });

      if (!profile) {
        this.printError(`Profile with ID "${id}" not found`);
        return;
      }

      if (!profile.enabled) {
        this.printWarning(`Profile "${profile.title}" is already disabled`);
        return;
      }

      await prisma.clientProfile.update({
        where: { id },
        data: { enabled: false },
      });

      this.printSuccess(`Profile "${profile.title}" has been disabled`);
    } catch (error: any) {
      this.printError(`Failed to disable profile: ${error.message}`);
    }
  }

  private async handleAdd(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length < 3) {
      this.printError('Usage: profile add <title> <loader> <version> [serverAddress] [serverPort]');
      this.printInfo('Loaders: Forge, Fabric, Vanilla');
      this.printInfo('Example: profile add "HiTech" Forge 1.12.2');
      this.printInfo('Example: profile add "My Server" Fabric 1.20.1 192.168.1.100 25565');
      return;
    }

    const title = args[0];
    const loader = args[1].toLowerCase();
    const version = args[2];
    const serverAddress = args[3] || 'localhost';
    const serverPort = args[4] ? parseInt(args[4], 10) : 25565;

    if (!['forge', 'fabric', 'vanilla'].includes(loader)) {
      this.printError(`Invalid loader: ${loader}. Must be one of: Forge, Fabric, Vanilla`);
      return;
    }

    if (isNaN(serverPort) || serverPort < 1 || serverPort > 65535) {
      this.printError(`Invalid server port: ${args[4]}. Must be between 1 and 65535`);
      return;
    }

    try {
      // Check if version exists
      const clientVersion = await prisma.clientVersion.findUnique({
        where: { version },
      });

      if (!clientVersion) {
        this.printWarning(`Version ${version} not found in database.`);
        const create = await this.askYesNo(rl, 'Do you want to create it automatically?');
        if (!create) {
          this.printInfo('Profile creation cancelled. Create version first using "version create" command.');
          return;
        }
      }

      // Get max sortIndex
      const maxProfile = await prisma.clientProfile.findFirst({
        orderBy: { sortIndex: 'desc' },
        select: { sortIndex: true },
      });
      const sortIndex = (maxProfile?.sortIndex ?? -1) + 1;

      // Get assetIndex from version via API
      this.printInfo(`Fetching asset index for version ${version}...`);
      let assetIndex: string;
      try {
        assetIndex = await getAssetIndexForVersion(version);
        this.printSuccess(`Asset index: ${assetIndex}`);
      } catch (error: any) {
        this.printWarning(`Failed to get asset index from API: ${error.message}`);
        this.printInfo(`Using fallback: calculating from version`);
        // Fallback: calculate from version
        assetIndex = version.split('.').slice(0, 2).join('.');
      }

      // Determine JVM version based on Minecraft version
      let jvmVersion = '17';
      if (version.startsWith('1.21') || version.startsWith('1.22')) {
        jvmVersion = '21';
      } else if (version.startsWith('1.17') || version.startsWith('1.18') || version.startsWith('1.19') || version.startsWith('1.20')) {
        jvmVersion = '17';
      } else if (version.startsWith('1.12') || version.startsWith('1.13') || version.startsWith('1.14') || version.startsWith('1.15') || version.startsWith('1.16')) {
        jvmVersion = '8';
      }

      // Base configuration
      let mainClass = 'net.minecraft.client.main.Main';
      let classPath: string[] = ['libraries', 'client.jar'];
      let jvmArgs: string[] = [
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
        '-Dusing.aikars.flags=https://mcflags.emc.gs',
        '-Daikars.new.flags=true',
      ];
      let clientArgs: string[] = [
        '--username', '${username}',
        '--version', version,
        '--gameDir', '${gameDir}',
        '--assetsDir', '${assetsDir}',
        '--assetIndex', assetIndex,
        '--uuid', '${uuid}',
        '--accessToken', '${accessToken}',
        '--userType', 'mojang',
        '--versionType', 'release',
        '--server', '${serverAddress}',
        '--port', '${serverPort}',
      ];
      let tags: string[] = [loader.toUpperCase()];

      // Loader-specific configuration
      if (loader === 'forge') {
        // Forge configuration
        if (version.startsWith('1.12')) {
          // Forge 1.12.2
          mainClass = 'net.minecraft.launchwrapper.Launch';
          classPath = [
            'libraries',
            'client.jar',
            'libraries/net/minecraftforge/forge/1.12.2-14.23.5.2860/forge-1.12.2-14.23.5.2860.jar',
          ];
          jvmArgs.push(
            '-Dforge.logging.markers=REGISTRIES',
            '-Dforge.logging.console.level=debug'
          );
          clientArgs.push(
            '--tweakClass',
            'net.minecraftforge.fml.common.launcher.FMLTweaker'
          );
        } else if (version.startsWith('1.16') || version.startsWith('1.17') || version.startsWith('1.18') || version.startsWith('1.19') || version.startsWith('1.20')) {
          // Forge 1.16+
          mainClass = 'cpw.mods.bootstraplauncher.BootstrapLauncher';
          clientArgs.push(
            '--launchTarget', 'fmlclient',
            '--fml.mcpVersion', '20210309.102130',
            '--fml.mcVersion', version,
            '--fml.forgeGroup', 'net.minecraftforge',
            '--fml.forgeVersion', 'latest'
          );
        }
        tags.push('MODS');
      } else if (loader === 'fabric') {
        // Fabric configuration
        if (version.startsWith('1.12') || version.startsWith('1.13') || version.startsWith('1.14') || version.startsWith('1.15')) {
          this.printWarning('Fabric is not recommended for versions below 1.16');
        }
        mainClass = 'net.fabricmc.loader.launch.knot.KnotClient';
        clientArgs.push(
          '--tweakClass',
          'net.fabricmc.loader.launch.knot.KnotClient'
        );
        tags.push('MODS');
      } else {
        // Vanilla configuration
        tags.push('VANILLA');
      }

      // Generate safe directory name from title (remove special characters, spaces -> underscores)
      const safeDirectoryName = title
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .toLowerCase();

      // Create profile
      const profile = await prisma.clientProfile.create({
        data: {
          version,
          assetIndex,
          clientDirectory: safeDirectoryName, // Use profile title as directory name
          sortIndex,
          title,
          description: `${title} - ${loader.toUpperCase()} ${version}`,
          tags,
          serverAddress,
          serverPort,
          jvmVersion,
          updateFastCheck: true,
          update: loader === 'forge' ? ['.*\\.jar$', '.*\\.json$', '.*forge.*\\.jar$'] : ['.*\\.jar$', '.*\\.json$'],
          updateVerify: loader === 'forge' ? ['.*\\.jar$', '.*forge.*\\.jar$'] : ['.*\\.jar$'],
          updateExclusions: [],
          mainClass,
          classPath,
          jvmArgs,
          clientArgs,
          enabled: true,
        },
      });

      this.printSuccess(`\n✅ Profile "${title}" created successfully!`);
      this.print(`\n📋 Profile Details:`);
      this.print(`   ID: ${profile.id}`);
      this.print(`   Title: ${profile.title}`);
      this.print(`   Version: ${profile.version}`);
      this.print(`   Loader: ${loader.toUpperCase()}`);
      this.print(`   Client Directory: ${profile.clientDirectory}`);
      this.print(`   Server: ${profile.serverAddress}:${profile.serverPort}`);
      this.print(`   Main Class: ${profile.mainClass}`);
      this.print(`   JVM Version: ${profile.jvmVersion}`);
      this.print(`   Sort Index: ${profile.sortIndex}`);
      this.print(`   Enabled: ${profile.enabled ? 'Yes' : 'No'}`);

      // Автоматическая загрузка assets
      this.print(`\n🎨 Checking assets for ${assetIndex}...`);
      try {
        let lastProgress = 0;
        await ensureAssetsDownloaded(assetIndex, version, (current, total, file) => {
          if (current % 100 === 0 || current === total) {
            const percent = Math.round((current / total) * 100);
            if (percent !== lastProgress) {
              process.stdout.write(`\r   Progress: ${current}/${total} (${percent}%) - ${file.substring(0, 40)}...`);
              lastProgress = percent;
            }
          }
        });
        process.stdout.write('\n');
        this.printSuccess(`✅ Assets for ${assetIndex} are ready!`);
        this.print(`   Location: updates/assets/${assetIndex}/`);
      } catch (error: any) {
        this.printWarning(`⚠️  Failed to download assets: ${error.message}`);
        this.printInfo(`   You can download assets manually later`);
      }

      this.print(`\n📁 Next Steps:`);
      this.print(`   • Create directory: updates/${profile.clientDirectory}/`);
      this.print(`   • Place client files in: updates/${profile.clientDirectory}/`);
      this.print(`   • Run: profile sync ${profile.id.substring(0, 8)}...`);
      
      if (loader === 'forge') {
        this.print(`\n💡 Forge Notes:`);
        this.print(`   • Make sure Forge is installed in the libraries folder`);
        if (version.startsWith('1.12')) {
          this.print(`   • Recommended Forge version: 1.12.2-14.23.5.2860`);
        }
        this.print(`   • Mods should be in the mods/ folder`);
      } else if (loader === 'fabric') {
        this.print(`\n💡 Fabric Notes:`);
        this.print(`   • Make sure Fabric Loader is installed`);
        this.print(`   • Mods should be in the mods/ folder`);
      }
    } catch (error: any) {
      this.printError(`Failed to create profile: ${error.message}`);
      if (error.code === 'P2002') {
        this.printError('A profile with this title or configuration may already exist');
      }
    }
  }

  private async handleSync(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: profile sync <id>');
      return;
    }

    const id = args[0];

    try {
      const profile = await prisma.clientProfile.findUnique({
        where: { id },
      });

      if (!profile) {
        this.printError(`Profile with ID "${id}" not found`);
        return;
      }

      const clientDir = profile.clientDirectory || profile.version;
      this.printInfo(`Syncing files for profile "${profile.title}" (directory: ${clientDir})...`);

      const result = await syncProfileFiles(id);

      this.printSuccess(`Sync completed for profile "${profile.title}"`);
      this.print(`  Added: ${result.added} file(s)`);
      this.print(`  Updated: ${result.updated} file(s)`);
      this.print(`  Errors: ${result.errors} file(s)`);
    } catch (error: any) {
      this.printError(`Failed to sync profile: ${error.message}`);
    }
  }

  private async handleSetJvm(args: string[]): Promise<void> {
    if (args.length < 2) {
      this.printError('Usage: profile set-jvm <id> <version>');
      this.printInfo('Example: profile set-jvm <profile-id> 16');
      this.printInfo('Valid versions: 8, 11, 16, 17, 21');
      return;
    }

    const profileId = args[0];
    const jvmVersion = args[1];

    // Validate JVM version
    const validVersions = ['8', '11', '16', '17', '21'];
    if (!validVersions.includes(jvmVersion)) {
      this.printError(`Invalid JVM version: ${jvmVersion}`);
      this.printInfo(`Valid versions: ${validVersions.join(', ')}`);
      return;
    }

    try {
      const profile = await prisma.clientProfile.findUnique({
        where: { id: profileId },
      });

      if (!profile) {
        this.printError(`Profile with ID "${profileId}" not found`);
        return;
      }

      await prisma.clientProfile.update({
        where: { id: profileId },
        data: { jvmVersion },
      });

      this.printSuccess(`\n✅ JVM version updated for profile "${profile.title}"`);
      this.print(`   Old JVM version: ${profile.jvmVersion || 'not set'}`);
      this.print(`   New JVM version: ${jvmVersion}`);
      this.print(`\n⚠️  Note: Make sure you have Java ${jvmVersion} installed and configured in launcher settings.`);
    } catch (error: any) {
      this.printError(`Failed to update JVM version: ${error.message}`);
      if (error.code === 'P2025') {
        this.printError('Profile not found');
      }
    }
  }

  private async handleDelete(args: string[], rl: readline.Interface): Promise<void> {
    if (args.length < 1) {
      this.printError('Usage: profile delete <id>');
      return;
    }

    const id = args[0];

    try {
      const profile = await prisma.clientProfile.findUnique({
        where: { id },
      });

      if (!profile) {
        this.printError(`Profile with ID "${id}" not found`);
        return;
      }

      const confirmed = await this.askYesNo(
        rl,
        `Are you sure you want to delete profile "${profile.title}"? This action cannot be undone.`
      );

      if (!confirmed) {
        this.printInfo('Deletion cancelled');
        return;
      }

      await prisma.clientProfile.delete({
        where: { id },
      });

      this.printSuccess(`Profile "${profile.title}" deleted successfully`);
    } catch (error: any) {
      this.printError(`Failed to delete profile: ${error.message}`);
    }
  }
}

