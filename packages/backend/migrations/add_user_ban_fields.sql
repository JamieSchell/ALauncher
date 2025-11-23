-- Migration: Add ban fields to users table
-- Date: 2025-11-23

ALTER TABLE `users` 
ADD COLUMN `banned` BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN `bannedAt` DATETIME(3) NULL,
ADD COLUMN `banReason` VARCHAR(500) NULL;

-- Add index for faster queries
CREATE INDEX `users_banned_idx` ON `users`(`banned`);

