-- Migration: Add LauncherError table for launcher error monitoring
-- Date: 2025-01-23

-- Create launcher_errors table
CREATE TABLE IF NOT EXISTS launcher_errors (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NULL,
  username VARCHAR(255) NULL,
  errorType ENUM(
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
  errorMessage TEXT NOT NULL,
  stackTrace TEXT NULL,
  component VARCHAR(255) NULL,
  action VARCHAR(255) NULL,
  url VARCHAR(500) NULL,
  statusCode INT NULL,
  userAgent VARCHAR(500) NULL,
  os VARCHAR(100) NULL,
  osVersion VARCHAR(100) NULL,
  launcherVersion VARCHAR(50) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  INDEX idx_userId (userId),
  INDEX idx_errorType (errorType),
  INDEX idx_component (component),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

