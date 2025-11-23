-- Migration: Add role column to users table
-- Run this SQL script directly in your MySQL database

-- Add role column with default value 'USER'
ALTER TABLE users 
ADD COLUMN role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER' 
AFTER cloakUrl;

-- Optional: Set a specific user as admin (uncomment and change username if needed)
-- UPDATE users SET role = 'ADMIN' WHERE username = 'XuViGaN';

