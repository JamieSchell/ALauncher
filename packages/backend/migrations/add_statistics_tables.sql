-- Migration: Add GameLaunch and GameSession tables for statistics
-- Date: 2025-11-23

-- Create game_launches table
CREATE TABLE IF NOT EXISTS game_launches (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NULL,
  username VARCHAR(255) NULL,
  profileId VARCHAR(36) NULL,
  profileVersion VARCHAR(50) NULL,
  serverAddress VARCHAR(255) NULL,
  serverPort INT NULL,
  javaVersion VARCHAR(50) NULL,
  javaPath VARCHAR(500) NULL,
  ram INT NULL,
  resolution VARCHAR(50) NULL,
  fullScreen BOOLEAN NOT NULL DEFAULT FALSE,
  autoEnter BOOLEAN NOT NULL DEFAULT FALSE,
  os VARCHAR(100) NULL,
  osVersion VARCHAR(100) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  INDEX idx_userId (userId),
  INDEX idx_profileId (profileId),
  INDEX idx_serverAddress (serverAddress),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id VARCHAR(36) PRIMARY KEY,
  launchId VARCHAR(36) NOT NULL UNIQUE,
  userId VARCHAR(36) NULL,
  username VARCHAR(255) NULL,
  profileId VARCHAR(36) NULL,
  profileVersion VARCHAR(50) NULL,
  serverAddress VARCHAR(255) NULL,
  serverPort INT NULL,
  startedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  endedAt DATETIME(3) NULL,
  duration INT NULL,
  exitCode INT NULL,
  crashed BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  FOREIGN KEY (launchId) REFERENCES game_launches(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_profileId (profileId),
  INDEX idx_serverAddress (serverAddress),
  INDEX idx_startedAt (startedAt),
  INDEX idx_endedAt (endedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

