-- Migration: Add LauncherVersion table for launcher update management
-- Date: 2025-01-23

-- Create launcher_versions table
CREATE TABLE IF NOT EXISTS launcher_versions (
  id VARCHAR(36) PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  downloadUrl VARCHAR(500) NULL,
  releaseNotes TEXT NULL,
  isRequired BOOLEAN NOT NULL DEFAULT FALSE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  INDEX idx_version (version),
  INDEX idx_enabled (enabled),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

