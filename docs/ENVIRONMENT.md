# ALauncher Environment Setup Guide

Complete guide for configuring the ALauncher environment and configuration files.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Directory Structure](#directory-structure)
- [Configuration Files](#configuration-files)
- [Production Setup](#production-setup)
- [Security](#security)

---

## Overview

ALauncher uses environment variables for configuration. The backend loads configuration from `.env` files, and different files are used for development and production environments.

### Configuration Files

| File | Environment | Description |
|------|-------------|-------------|
| `.env.dev` | Development | Development environment variables |
| `.env.prod` | Production | Production environment variables |
| `.env` | Fallback | Default environment (if NODE_ENV not set) |

The configuration is loaded from `packages/backend/src/config/index.ts`.

---

## Quick Start

### 1. Create Environment File

```bash
cd packages/backend
cp .env.example .env
# or for development
cp .env.example .env.dev
```

### 2. Set NODE_ENV

```bash
# Development
export NODE_ENV=development

# Production
export NODE_ENV=production
```

### 3. Start the Application

```bash
npm run dev        # Development
npm run start      # Production
```

---

## Environment Variables

### Required Variables

#### `DATABASE_URL`

MySQL database connection string.

```
DATABASE_URL=mysql://username:password@hostname:port/database
```

**Examples:**
```bash
# Local MySQL
DATABASE_URL=mysql://launcher:password@localhost:3306/launcher

# Remote MySQL
DATABASE_URL=mysql://launcher:securePassword@db.example.com:3306/launcher

# With connection pool
DATABASE_URL=mysql://launcher:password@localhost:3306/launcher?connection_limit=10&pool_timeout=20
```

#### `JWT_SECRET`

Secret key for JWT token signing.

```bash
# Generate a secure secret
JWT_SECRET=your-very-secure-random-secret-key-min-32-chars
```

**Generate secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### Server Configuration

#### `PORT`

Server port (default: 7240).

```bash
PORT=7240
```

#### `HOST`

Server host binding (default: 0.0.0.0).

```bash
HOST=0.0.0.0          # All interfaces
HOST=localhost         # Local only
HOST=127.0.0.1         # Local only
```

#### `CORS_ORIGIN`

CORS allowed origin for frontend.

```bash
# Development
CORS_ORIGIN=http://localhost:5173

# Production
CORS_ORIGIN=https://launcher.example.com

# Multiple origins (comma-separated)
CORS_ORIGIN=https://launcher.example.com,https://admin.example.com
```

---

### JWT Configuration

#### `JWT_EXPIRY`

JWT token expiration time (default: 24h).

```bash
JWT_EXPIRY=24h         # 24 hours
JWT_EXPIRY=7d          # 7 days
JWT_EXPIRY=1h          # 1 hour
```

---

### RSA Keys

#### `RSA_PUBLIC_KEY_PATH`

Path to RSA public key file.

```bash
RSA_PUBLIC_KEY_PATH=/path/to/keys/public.key
```

#### `RSA_PRIVATE_KEY_PATH`

Path to RSA private key file.

```bash
RSA_PRIVATE_KEY_PATH=/path/to/keys/private.key
```

**Generate RSA keys:**
```bash
mkdir -p keys
ssh-keygen -t rsa -b 4096 -f keys/private.key -m PEM
openssl rsa -in keys/private.key -pubout -out keys/public.key

# Set permissions
chmod 600 keys/private.key
chmod 644 keys/public.key
```

---

### Rate Limiting

#### `RATE_LIMIT_ENABLED`

Enable rate limiting (default: false).

```bash
RATE_LIMIT_ENABLED=true
```

#### `RATE_LIMIT_MAX_ATTEMPTS`

Maximum requests per window (default: 5).

```bash
RATE_LIMIT_MAX_ATTEMPTS=10
```

#### `RATE_LIMIT_WINDOW_MS`

Time window in milliseconds (default: 60000 = 1 minute).

```bash
RATE_LIMIT_WINDOW_MS=60000    # 1 minute
RATE_LIMIT_WINDOW_MS=300000   # 5 minutes
```

---

### Texture Provider

#### `TEXTURE_PROVIDER`

Texture/skin provider (default: mojang).

```bash
TEXTURE_PROVIDER=mojang       # Official Mojang APIs
TEXTURE_PROVIDER=custom       # Custom texture server
```

#### `TEXTURE_CACHE_ENABLED`

Enable texture caching (default: false).

```bash
TEXTURE_CACHE_ENABLED=true
```

---

### Updates Configuration

#### `COMPRESSION_ENABLED`

Enable file compression for updates (default: false).

```bash
COMPRESSION_ENABLED=true
```

#### `UPDATE_CHECK_INTERVAL`

Update check interval in milliseconds (default: 300000 = 5 minutes).

```bash
UPDATE_CHECK_INTERVAL=300000   # 5 minutes
UPDATE_CHECK_INTERVAL=600000   # 10 minutes
```

---

### Economy Configuration

#### `ECONOMY_LEADERBOARD_DEFAULT_LIMIT`

Default leaderboard entry limit (default: 5).

```bash
ECONOMY_LEADERBOARD_DEFAULT_LIMIT=10
```

#### `ECONOMY_LEADERBOARD_MAX_LIMIT`

Maximum leaderboard entry limit (default: 20).

```bash
ECONOMY_LEADERBOARD_MAX_LIMIT=50
```

---

### Paths

#### `UPDATES_DIR`

Directory for client updates and assets.

```bash
# Relative to backend directory
UPDATES_DIR=./updates

# Absolute path
UPDATES_DIR=/opt/ALauncher/updates

# Shared network storage
UPDATES_DIR=/mnt/nfs/launcher-updates
```

---

### Logging

#### `LOG_LEVEL`

Logging level (default: info).

```bash
LOG_LEVEL=error      # Errors only
LOG_LEVEL=warn       # Warnings and errors
LOG_LEVEL=info       # Info, warnings, errors
LOG_LEVEL=debug      # All messages including debug
LOG_LEVEL=trace      # Verbose logging
```

---

## Database Setup

### MySQL Installation

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### macOS

```bash
brew install mysql
brew services start mysql
```

#### Windows

Download from [MySQL Official Site](https://dev.mysql.com/downloads/mysql/)

---

### Database Creation

```sql
-- Create database
CREATE DATABASE launcher CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'launcher'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON launcher.* TO 'launcher'@'localhost';
FLUSH PRIVILEGES;
```

---

### Running Migrations

```bash
cd packages/backend

# Generate Prisma client
npm run generate

# Run migrations
npm run migrate

# Optional: Open Prisma Studio for database GUI
npm run studio
```

---

### Prisma Schema Location

The Prisma schema is located at:
```
packages/backend/prisma/schema.prisma
```

---

## Directory Structure

### Backend Directories

```
packages/backend/
├── keys/                   # RSA keys (generated)
│   ├── public.key
│   └── private.key
├── updates/                # Client files and assets
│   ├── assets/            # Minecraft assets
│   │   └── indexes/       # Asset index files
│   └── <clientDirs>/      # Client directories
│       ├── client.jar
│       ├── libraries/
│       └── mods/
├── profiles/              # User profiles data (optional)
├── dist/                  # Compiled JavaScript
├── prisma/                # Database schema and migrations
│   ├── schema.prisma
│   └── migrations/
├── src/                   # Source code
│   ├── cli/              # CLI commands
│   ├── config/           # Configuration
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── utils/            # Utilities
└── .env                  # Environment variables
```

### Frontend Directories

```
packages/frontend/
├── src/                   # React source code
│   ├── components/       # React components
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── hooks/            # Custom React hooks
│   ├── i18n/             # Internationalization
│   ├── config/           # Frontend configuration
│   └── utils/            # Utilities
├── src-tauri/            # Tauri configuration
│   ├── src/              # Rust code
│   ├── icons/            # Application icons
│   ├── gen/              # Generated schemas
│   └── tauri.conf.json   # Tauri config
├── dist/                 # Build output
└── public/               # Static assets
```

---

## Configuration Files

### Tauri Configuration

**Location:** `packages/frontend/src-tauri/tauri.conf.json`

Key settings:
- Window size and title
- Bundle formats (deb, rpm, msi, nsis)
- Security settings
- Plugin permissions

### Vite Configuration

**Location:** `packages/frontend/vite.config.ts`

Key settings:
- Build configuration
- Code splitting
- CSP (Content Security Policy)
- Base path for Tauri

### TypeScript Configuration

**Location:** `tsconfig.json` (root and per-package)

Key settings:
- Compiler options
- Path aliases
- Target ES version

---

## Production Setup

### Production Environment File

Create `.env.prod` in `packages/backend/`:

```bash
# Server
NODE_ENV=production
PORT=7240
HOST=0.0.0.0
CORS_ORIGIN=https://your-launcher-domain.com

# Database
DATABASE_URL=mysql://launcher:STRONG_PASSWORD@localhost:3306/launcher

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRY=7d

# RSA Keys
RSA_PUBLIC_KEY_PATH=/opt/ALauncher/packages/backend/keys/public.key
RSA_PRIVATE_KEY_PATH=/opt/ALauncher/packages/backend/keys/private.key

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_ATTEMPTS=10
RATE_LIMIT_WINDOW_MS=60000

# Paths
UPDATES_DIR=/opt/ALauncher/updates

# Logging
LOG_LEVEL=info
```

---

### Production Build

```bash
# Build all packages
cd /opt/ALauncher
npm run build

# Build Tauri application
npm run tauri:build
```

---

### Running with PM2

```bash
# Install PM2
npm install -g pm2

# Start backend
cd packages/backend
pm2 start dist/index.js --name alauncer-backend

# View logs
pm2 logs alauncer-backend

# Monitor
pm2 monit

# Save process list
pm2 save
pm2 startup
```

---

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name launcher.example.com;

    location / {
        proxy_pass http://localhost:7240;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Security

### Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use strong JWT secrets** - Minimum 32 characters, randomly generated
3. **Use strong database passwords** - Mix of letters, numbers, symbols
4. **Enable rate limiting in production** - Prevent brute force attacks
5. **Keep RSA keys private** - Set file permissions to 600
6. **Use HTTPS in production** - Encrypt all traffic
7. **Rotate secrets regularly** - Update JWT secret periodically
8. **Limit CORS origins** - Only allow trusted domains

---

### File Permissions

```bash
# RSA keys
chmod 600 keys/private.key
chmod 644 keys/public.key

# Environment files
chmod 600 .env .env.prod .env.dev

# Updates directory
chmod 755 updates
```

---

### Environment File Template

Create `.env.example` with placeholders (safe to commit):

```bash
# Server
PORT=7240
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173

# Database
DATABASE_URL=mysql://launcher:password@localhost:3306/launcher

# Security
JWT_SECRET=change-this-in-production
JWT_EXPIRY=24h

# RSA Keys
RSA_PUBLIC_KEY_PATH=./keys/public.key
RSA_PRIVATE_KEY_PATH=./keys/private.key

# Rate Limiting
RATE_LIMIT_ENABLED=false
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=60000

# Updates
COMPRESSION_ENABLED=false
UPDATE_CHECK_INTERVAL=300000

# Economy
ECONOMY_LEADERBOARD_DEFAULT_LIMIT=5
ECONOMY_LEADERBOARD_MAX_LIMIT=20

# Logging
LOG_LEVEL=info

# Paths
UPDATES_DIR=./updates
```

---

## Troubleshooting

### Database Connection Failed

```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u launcher -p -h localhost launcher

# Check DATABASE_URL format
echo $DATABASE_URL
```

### JWT Secret Not Set

```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to .env file
JWT_SECRET=<generated-secret>
```

### RSA Keys Not Found

```bash
# Generate keys
mkdir -p keys
ssh-keygen -t rsa -b 4096 -f keys/private.key -m PEM
openssl rsa -in keys/private.key -pubout -out keys/public.key

# Update paths in .env if using absolute paths
```

### Updates Directory Not Writable

```bash
# Check permissions
ls -la updates/

# Fix permissions
chmod 755 updates/
```

### Port Already in Use

```bash
# Find process using port 7240
lsof -i :7240

# Kill process
kill -9 <PID>

# Or use different port
PORT=7241 npm start
```

---

## Next Steps

- Read [BUILD_GUIDE.md](BUILD_GUIDE.md) for build instructions
- Read [CLI_GUIDE.md](CLI_GUIDE.md) for CLI usage
- Read [NPM_SCRIPTS.md](NPM_SCRIPTS.md) for available scripts
