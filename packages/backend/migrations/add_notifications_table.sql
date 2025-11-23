-- Migration: Add Notification table for notification system
-- Date: 2025-01-23

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  type ENUM(
    'CLIENT_UPDATE_AVAILABLE',
    'SERVER_STATUS_CHANGE',
    'LAUNCHER_UPDATE_AVAILABLE',
    'GAME_CRASH',
    'CONNECTION_ISSUE',
    'LAUNCHER_ERROR',
    'SYSTEM_MESSAGE',
    'ADMIN_ALERT'
  ) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSON NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  readAt DATETIME(3) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_type (type),
  INDEX idx_read (read),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

