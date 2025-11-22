-- Migration: Add server_statistics table
-- Run this SQL script directly in your MySQL database

CREATE TABLE IF NOT EXISTS `server_statistics` (
  `id` VARCHAR(191) NOT NULL,
  `serverAddress` VARCHAR(191) NOT NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `hour` INTEGER NOT NULL,
  `online` INTEGER NOT NULL,
  `average` INTEGER NOT NULL,
  `minimum` INTEGER NOT NULL,
  `maximum` INTEGER NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `server_statistics_serverAddress_timestamp_idx` (`serverAddress`, `timestamp`),
  INDEX `server_statistics_serverAddress_hour_idx` (`serverAddress`, `hour`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

