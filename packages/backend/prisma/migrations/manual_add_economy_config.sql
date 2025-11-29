-- Migration: Add economyConfig column to client_profiles
-- Run this SQL script directly in your MySQL database

ALTER TABLE `client_profiles`
ADD COLUMN `economyConfig` JSON NULL AFTER `tags`;


