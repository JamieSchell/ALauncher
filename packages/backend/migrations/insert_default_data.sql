-- ============================================================================
-- Insert Default Data for Modern Minecraft Launcher
-- This script fills tables with standard test/default data
-- Execute this SQL script after creating all tables
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- ============================================================================
-- 2. CLIENT PROFILES - Create default Minecraft profile
-- ============================================================================

INSERT IGNORE INTO `client_profiles` (
  `id`, `version`, `assetIndex`, `sortIndex`, `title`, `description`, `tags`,
  `serverAddress`, `serverPort`, `jvmVersion`, `updateFastCheck`,
  `update`, `updateVerify`, `updateExclusions`,
  `mainClass`, `classPath`, `jvmArgs`, `clientArgs`, `enabled`,
  `createdAt`, `updatedAt`
) VALUES (
  'vanilla-1.20.4',
  '1.20.4',
  '1.20',
  0,
  'Vanilla 1.20.4',
  'Стандартная версия Minecraft 1.20.4',
  JSON_ARRAY('NEW', 'DEFAULT'),
  'localhost',
  25565,
  '17',
  TRUE,
  JSON_ARRAY('libraries', 'client\\.jar'),
  JSON_ARRAY('libraries', 'client\\.jar'),
  JSON_ARRAY(),
  'net.minecraft.client.main.Main',
  JSON_ARRAY('libraries', 'client.jar'),
  JSON_ARRAY(
    '-XX:+UseG1GC',
    '-XX:+UnlockExperimentalVMOptions',
    '-XX:G1NewSizePercent=20',
    '-XX:G1ReservePercent=20',
    '-XX:MaxGCPauseMillis=50',
    '-XX:G1HeapRegionSize=32M'
  ),
  JSON_ARRAY(),
  TRUE,
  NOW(),
  NOW()
);

-- ============================================================================
-- 3. CLIENT VERSIONS - Create default client version
-- ============================================================================

INSERT IGNORE INTO `client_versions` (
  `id`, `version`, `title`, `description`,
  `clientJarPath`, `clientJarHash`, `clientJarSize`,
  `librariesPath`, `assetsPath`,
  `mainClass`, `jvmVersion`, `jvmArgs`, `clientArgs`,
  `enabled`, `isDefault`, `createdAt`, `updatedAt`
) VALUES (
  UUID(),
  '1.20.4',
  'Minecraft 1.20.4',
  'Стандартная версия Minecraft 1.20.4',
  'updates/1.20.4/client.jar',
  '0000000000000000000000000000000000000000000000000000000000000000', -- Placeholder hash
  0, -- Placeholder size
  'updates/1.20.4/libraries',
  'updates/1.20.4/assets',
  'net.minecraft.client.main.Main',
  '17',
  JSON_ARRAY(
    '-XX:+UseG1GC',
    '-XX:+UnlockExperimentalVMOptions',
    '-XX:G1NewSizePercent=20',
    '-XX:G1ReservePercent=20',
    '-XX:MaxGCPauseMillis=50',
    '-XX:G1HeapRegionSize=32M'
  ),
  JSON_ARRAY(),
  TRUE,
  TRUE,
  NOW(),
  NOW()
);

-- ============================================================================
-- 4. LAUNCHER VERSIONS - Create initial launcher version
-- ============================================================================

INSERT IGNORE INTO `launcher_versions` (
  `id`, `version`, `downloadUrl`, `releaseNotes`, `isRequired`, `enabled`, `createdAt`, `updatedAt`
) VALUES (
  UUID(),
  '1.0.0',
  NULL,
  'Начальная версия лаунчера',
  FALSE,
  TRUE,
  NOW(),
  NOW()
);

-- ============================================================================
-- 5. SERVER STATUS - Create example server status
-- ============================================================================

INSERT IGNORE INTO `server_status` (
  `id`, `serverAddress`, `online`, `players`, `maxPlayers`, `version`, `motd`, `ping`, `lastChecked`
) VALUES (
  UUID(),
  'localhost:25565',
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW()
);

-- ============================================================================
-- 6. NOTIFICATIONS - Create welcome notification for admin
-- ============================================================================

-- Get admin user ID
SET @admin_id = (SELECT `id` FROM `users` WHERE `username` = 'admin' LIMIT 1);

-- Create welcome notification for admin
INSERT IGNORE INTO `notifications` (
  `id`, `userId`, `type`, `title`, `message`, `data`, `read`, `createdAt`
) VALUES (
  UUID(),
  @admin_id,
  'SYSTEM_MESSAGE',
  'Добро пожаловать!',
  'Лаунчер успешно установлен и готов к использованию. Вы можете начать создавать профили и версии клиентов.',
  NULL,
  FALSE,
  NOW()
);

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- ============================================================================
-- VERIFICATION: Show inserted data
-- ============================================================================

SELECT 'Client Profiles created:' as info;
SELECT `id`, `title`, `version`, `enabled` FROM `client_profiles`;

SELECT 'Client Versions created:' as info;
SELECT `id`, `version`, `title`, `isDefault`, `enabled` FROM `client_versions`;

SELECT 'Launcher Versions created:' as info;
SELECT `id`, `version`, `enabled` FROM `launcher_versions`;

SELECT 'Notifications created:' as info;
SELECT COUNT(*) as count FROM `notifications`;
