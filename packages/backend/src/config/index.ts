/**
 * Configuration loader
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.dev' : '.env'
});

export const config = {
  env: process.env.NODE_ENV || 'development',
  
  server: {
    port: parseInt(process.env.PORT || '7240', 10),
    host: process.env.HOST || '0.0.0.0',
    corsOrigin: process.env.CORS_ORIGIN,
  },
  
  database: {
    url: process.env.DATABASE_URL || 'mysql://launcher:password@localhost:3306/launcher',
  },
  
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;

      // Check if secret is set
      if (!secret) {
        throw new Error(
          'JWT_SECRET environment variable is not set. ' +
          'Please set a secure JWT secret in your .env file (minimum 32 characters).'
        );
      }

      // Check minimum length
      if (secret.length < 32) {
        throw new Error(
          `JWT_SECRET must be at least 32 characters long. Current length: ${secret.length}`
        );
      }

      // Check for default/insecure values
      const insecureSecrets = [
        'your-secret-key-change-in-production',
        'secret',
        'jwt-secret',
        'change-me',
        'example-secret',
        'test-secret'
      ];

      if (insecureSecrets.includes(secret.toLowerCase())) {
        throw new Error(
          'JWT_SECRET is using a default/insecure value. ' +
          'Please generate a secure random secret (e.g., using: openssl rand -base64 64)'
        );
      }

      return secret;
    })(),
    expiry: process.env.JWT_EXPIRY || '24h',
  },
  
  rsa: {
    publicKeyPath: process.env.RSA_PUBLIC_KEY_PATH || path.join(process.cwd(), 'keys', 'public.key'),
    privateKeyPath: process.env.RSA_PRIVATE_KEY_PATH || path.join(process.cwd(), 'keys', 'private.key'),
  },
  
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    maxAttempts: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  },
  
  texture: {
    provider: process.env.TEXTURE_PROVIDER || 'mojang',
    cacheEnabled: process.env.TEXTURE_CACHE_ENABLED === 'true',
  },
  
  updates: {
    compressionEnabled: process.env.COMPRESSION_ENABLED === 'true',
    checkInterval: parseInt(process.env.UPDATE_CHECK_INTERVAL || '300000', 10),
  },
  
  economy: {
    defaultLimit: parseInt(process.env.ECONOMY_LEADERBOARD_DEFAULT_LIMIT || '5', 10),
    maxLimit: parseInt(process.env.ECONOMY_LEADERBOARD_MAX_LIMIT || '20', 10),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  paths: {
    // Базовая директория, где backend ищет client.jar, libraries и т.п.
    // Можно переопределить через переменную окружения UPDATES_DIR,
    // например: /opt/ALauncher/updates-hitech
    updates: process.env.UPDATES_DIR || path.join(process.cwd(), 'updates'),
    profiles: path.join(process.cwd(), 'profiles'),
    keys: path.join(process.cwd(), 'keys'),
  },
};
