-- ============================================================================
-- Complete Database Schema for Modern Minecraft Launcher
-- This script creates all tables in the correct order
-- Execute this SQL script in your MySQL database
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `uuid` VARCHAR(36) NOT NULL UNIQUE,
  `email` VARCHAR(255) NULL UNIQUE,
  `skinUrl` VARCHAR(500) NULL,
  `cloakUrl` VARCHAR(500) NULL,
  `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  `banned` BOOLEAN NOT NULL DEFAULT FALSE,
  `bannedAt` DATETIME(3) NULL,
  `banReason` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `lastLogin` DATETIME(3) NULL,
  INDEX `idx_username` (`username`),
  INDEX `idx_uuid` (`uuid`),
  INDEX `idx_email` (`email`),
  INDEX `idx_banned` (`banned`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. SESSIONS TABLE (depends on users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(36) NOT NULL,
  `accessToken` VARCHAR(500) NOT NULL UNIQUE,
  `refreshToken` VARCHAR(500) NULL UNIQUE,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ipAddress` VARCHAR(45) NULL,
  `userAgent` VARCHAR(500) NULL,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_accessToken` (`accessToken`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. CLIENT PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `client_profiles` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `version` VARCHAR(50) NOT NULL,
  `assetIndex` VARCHAR(100) NOT NULL,
  `sortIndex` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `tags` JSON NULL,
  `serverAddress` VARCHAR(255) NOT NULL,
  `serverPort` INT NOT NULL DEFAULT 25565,
  `jvmVersion` VARCHAR(50) NULL,
  `updateFastCheck` BOOLEAN NOT NULL DEFAULT TRUE,
  `update` JSON NOT NULL,
  `updateVerify` JSON NOT NULL,
  `updateExclusions` JSON NOT NULL,
  `mainClass` VARCHAR(255) NOT NULL,
  `classPath` JSON NOT NULL,
  `jvmArgs` JSON NOT NULL,
  `clientArgs` JSON NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. FILE HASHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `file_hashes` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `profileId` VARCHAR(36) NOT NULL,
  `path` VARCHAR(500) NOT NULL,
  `hash` VARCHAR(64) NOT NULL,
  `size` BIGINT NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `unique_profile_path` (`profileId`, `path`),
  INDEX `idx_profileId` (`profileId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. AUTH ATTEMPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `auth_attempts` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `username` VARCHAR(255) NULL,
  `ipAddress` VARCHAR(45) NOT NULL,
  `success` BOOLEAN NOT NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_ip_timestamp` (`ipAddress`, `timestamp`),
  INDEX `idx_username_timestamp` (`username`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. IP RULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ip_rules` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `ip` VARCHAR(45) NOT NULL UNIQUE,
  `type` ENUM('WHITELIST', 'BLACKLIST') NOT NULL,
  `reason` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. SERVER STATUS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `server_status` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `serverAddress` VARCHAR(255) NOT NULL UNIQUE,
  `online` BOOLEAN NOT NULL DEFAULT FALSE,
  `players` INT NULL,
  `maxPlayers` INT NULL,
  `version` VARCHAR(50) NULL,
  `motd` VARCHAR(500) NULL,
  `ping` INT NULL,
  `lastChecked` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. SERVER STATISTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `server_statistics` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `serverAddress` VARCHAR(255) NOT NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `hour` INT NOT NULL,
  `online` INT NOT NULL,
  `average` INT NOT NULL,
  `minimum` INT NOT NULL,
  `maximum` INT NOT NULL,
  INDEX `idx_server_timestamp` (`serverAddress`, `timestamp`),
  INDEX `idx_server_hour` (`serverAddress`, `hour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. CLIENT VERSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `client_versions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `version` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `clientJarPath` VARCHAR(500) NOT NULL,
  `clientJarHash` VARCHAR(64) NOT NULL,
  `clientJarSize` BIGINT NOT NULL,
  `librariesPath` VARCHAR(500) NULL,
  `librariesHash` VARCHAR(64) NULL,
  `assetsPath` VARCHAR(500) NULL,
  `assetsHash` VARCHAR(64) NULL,
  `mainClass` VARCHAR(255) NOT NULL,
  `jvmVersion` VARCHAR(50) NOT NULL DEFAULT '17',
  `jvmArgs` JSON NOT NULL,
  `clientArgs` JSON NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `isDefault` BOOLEAN NOT NULL DEFAULT FALSE,
  `downloadUrl` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_version` (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. CLIENT FILES TABLE (depends on client_versions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `client_files` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `versionId` VARCHAR(36) NOT NULL,
  `clientDirectory` VARCHAR(191) NULL,
  `filePath` VARCHAR(500) NOT NULL,
  `fileHash` VARCHAR(64) NOT NULL,
  `fileSize` BIGINT NOT NULL,
  `fileType` VARCHAR(50) NOT NULL,
  `downloadUrl` VARCHAR(500) NULL,
  `verified` BOOLEAN NOT NULL DEFAULT 0,
  `lastVerified` DATETIME(3) NULL,
  `integrityCheckFailed` BOOLEAN NOT NULL DEFAULT 0,
  -- Один и тот же относительный путь может существовать в разных директориях клиентов
  UNIQUE KEY `unique_version_client_path` (`versionId`, `clientDirectory`, `filePath`),
  INDEX `idx_versionId` (`versionId`),
  INDEX `idx_fileType` (`fileType`),
  INDEX `idx_clientDirectory` (`clientDirectory`),
  FOREIGN KEY (`versionId`) REFERENCES `client_versions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. GAME CRASHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `game_crashes` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(36) NULL,
  `username` VARCHAR(255) NULL,
  `profileId` VARCHAR(36) NULL,
  `profileVersion` VARCHAR(50) NULL,
  `serverAddress` VARCHAR(255) NULL,
  `serverPort` INT NULL,
  `exitCode` INT NOT NULL,
  `errorMessage` TEXT NULL,
  `stackTrace` TEXT NULL,
  `stderrOutput` TEXT NULL,
  `stdoutOutput` TEXT NULL,
  `javaVersion` VARCHAR(50) NULL,
  `javaPath` VARCHAR(500) NULL,
  `os` VARCHAR(100) NULL,
  `osVersion` VARCHAR(100) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_profileId` (`profileId`),
  INDEX `idx_serverAddress` (`serverAddress`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. SERVER CONNECTION ISSUES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `server_connection_issues` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(36) NULL,
  `username` VARCHAR(255) NULL,
  `profileId` VARCHAR(36) NULL,
  `profileVersion` VARCHAR(50) NULL,
  `serverAddress` VARCHAR(255) NOT NULL,
  `serverPort` INT NOT NULL,
  `issueType` ENUM(
    'CONNECTION_REFUSED',
    'CONNECTION_TIMEOUT',
    'AUTHENTICATION_FAILED',
    'SERVER_FULL',
    'VERSION_MISMATCH',
    'NETWORK_ERROR',
    'UNKNOWN'
  ) NOT NULL,
  `errorMessage` TEXT NULL,
  `logOutput` TEXT NULL,
  `javaVersion` VARCHAR(50) NULL,
  `os` VARCHAR(100) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_profileId` (`profileId`),
  INDEX `idx_server_port` (`serverAddress`, `serverPort`),
  INDEX `idx_issueType` (`issueType`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 13. LAUNCHER ERRORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `launcher_errors` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(36) NULL,
  `username` VARCHAR(255) NULL,
  `errorType` ENUM(
    'PROFILE_LOAD_ERROR',
    'FILE_DOWNLOAD_ERROR',
    'API_ERROR',
    'AUTHENTICATION_ERROR',
    'VALIDATION_ERROR',
    'FILE_SYSTEM_ERROR',
    'NETWORK_ERROR',
    'ELECTRON_ERROR',
    'JAVA_DETECTION_ERROR',
    'CLIENT_LAUNCH_ERROR',
    'UNKNOWN_ERROR'
  ) NOT NULL,
  `errorMessage` TEXT NOT NULL,
  `stackTrace` TEXT NULL,
  `component` VARCHAR(255) NULL,
  `action` VARCHAR(255) NULL,
  `url` VARCHAR(500) NULL,
  `statusCode` INT NULL,
  `userAgent` VARCHAR(500) NULL,
  `os` VARCHAR(100) NULL,
  `osVersion` VARCHAR(100) NULL,
  `launcherVersion` VARCHAR(50) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_errorType` (`errorType`),
  INDEX `idx_component` (`component`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14. GAME LAUNCHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `game_launches` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(36) NULL,
  `username` VARCHAR(255) NULL,
  `profileId` VARCHAR(36) NULL,
  `profileVersion` VARCHAR(50) NULL,
  `serverAddress` VARCHAR(255) NULL,
  `serverPort` INT NULL,
  `javaVersion` VARCHAR(50) NULL,
  `javaPath` VARCHAR(500) NULL,
  `ram` INT NULL,
  `resolution` VARCHAR(50) NULL,
  `fullScreen` BOOLEAN NOT NULL DEFAULT FALSE,
  `autoEnter` BOOLEAN NOT NULL DEFAULT FALSE,
  `os` VARCHAR(100) NULL,
  `osVersion` VARCHAR(100) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_profileId` (`profileId`),
  INDEX `idx_serverAddress` (`serverAddress`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 15. GAME SESSIONS TABLE (depends on game_launches)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `game_sessions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `launchId` VARCHAR(36) NOT NULL UNIQUE,
  `userId` VARCHAR(36) NULL,
  `username` VARCHAR(255) NULL,
  `profileId` VARCHAR(36) NULL,
  `profileVersion` VARCHAR(50) NULL,
  `serverAddress` VARCHAR(255) NULL,
  `serverPort` INT NULL,
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endedAt` DATETIME(3) NULL,
  `duration` INT NULL,
  `exitCode` INT NULL,
  `crashed` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_profileId` (`profileId`),
  INDEX `idx_serverAddress` (`serverAddress`),
  INDEX `idx_startedAt` (`startedAt`),
  INDEX `idx_endedAt` (`endedAt`),
  FOREIGN KEY (`launchId`) REFERENCES `game_launches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 16. NOTIFICATIONS TABLE (depends on users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(36) NOT NULL,
  `type` ENUM(
    'CLIENT_UPDATE_AVAILABLE',
    'SERVER_STATUS_CHANGE',
    'LAUNCHER_UPDATE_AVAILABLE',
    'GAME_CRASH',
    'CONNECTION_ISSUE',
    'LAUNCHER_ERROR',
    'SYSTEM_MESSAGE',
    'ADMIN_ALERT'
  ) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `data` JSON NULL,
  `read` BOOLEAN NOT NULL DEFAULT FALSE,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_type` (`type`),
  INDEX `idx_read` (`read`),
  INDEX `idx_createdAt` (`createdAt`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 17. LAUNCHER VERSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `launcher_versions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `version` VARCHAR(50) NOT NULL UNIQUE,
  `downloadUrl` VARCHAR(500) NULL,
  `releaseNotes` TEXT NULL,
  `isRequired` BOOLEAN NOT NULL DEFAULT FALSE,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NULL ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_version` (`version`),
  INDEX `idx_enabled` (`enabled`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- ============================================================================
-- VERIFICATION: Check all tables were created
-- (Commented out if you don't have access to INFORMATION_SCHEMA)
-- ============================================================================
-- Uncomment the following query if you have access to INFORMATION_SCHEMA:
/*
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'users', 'sessions', 'client_profiles', 'file_hashes', 'auth_attempts',
    'ip_rules', 'server_status', 'server_statistics', 'client_versions',
    'client_files', 'game_crashes', 'server_connection_issues',
    'launcher_errors', 'game_launches', 'game_sessions', 'notifications',
    'launcher_versions'
  )
ORDER BY TABLE_NAME;
*/

-- Alternative verification (works without INFORMATION_SCHEMA access):
-- SHOW TABLES;

