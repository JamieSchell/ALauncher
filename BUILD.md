# Build and Deployment Guide

## Overview

This document describes the build and deployment process for the Modern Minecraft Launcher.

## Build Configuration

### Environment Variables

All build scripts use environment variables for configuration. Create a `scripts/config.sh` file (copy from `scripts/config.example.sh`) with your settings:

```bash
# Production API configuration
export PROD_API_HOST="your-server.com"
export PROD_API_PORT="7240"
export PROD_API_URL="http://${PROD_API_HOST}:${PROD_API_PORT}"
export PROD_WS_URL="ws://${PROD_API_HOST}/ws"

# Development API configuration
export DEV_API_HOST="localhost"
export DEV_API_PORT="7240"
export DEV_API_URL="http://${DEV_API_HOST}:${DEV_API_PORT}"
export DEV_WS_URL="ws://${DEV_API_HOST}:${DEV_API_PORT}/ws"

# Database configuration (for scripts that need it)
export DATABASE_URL="mysql://user:password@localhost:3306/launcher_db"
```

**Important**: Never commit `scripts/config.sh` to git (it's in `.gitignore`).

### Standard Build Commands

#### Frontend

```bash
# Development
cd packages/frontend
npm run dev

# Production build
cd packages/frontend
npm run build
# Output: dist/

# Electron build
cd packages/frontend
npm run electron:build
# Output: release/
```

#### Backend

```bash
# Development (with hot reload)
cd packages/backend
npm run dev

# Production build
cd packages/backend
npm run build
# Output: dist/

# Start production server
cd packages/backend
npm start
```

#### Shared Package

```bash
# Build shared types and utilities
cd packages/shared
npm run build
# Output: dist/
```

## Build Scripts

### Development

```bash
# Start both frontend and backend in development mode
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend
```

### Production

```bash
# Build everything for production
npm run prod

# Build only frontend
npm run prod:frontend

# Build only backend
npm run prod:backend
```

### Using Scripts Directly

```bash
# Cross-platform script runner
node scripts/run-script.js <script-name>

# Examples:
node scripts/run-script.js dev
node scripts/run-script.js prod
node scripts/run-script.js dev-frontend
```

## Build Process

### 1. Shared Package

Always build the shared package first, as other packages depend on it:

```bash
npm run build:shared
```

### 2. Backend

```bash
cd packages/backend
npm run build
```

The backend uses TypeScript compiler (`tsc`) to compile TypeScript to JavaScript. Output goes to `dist/`.

### 3. Frontend

```bash
cd packages/frontend
npm run build
```

The frontend uses Vite to bundle React application. Output goes to `dist/`.

### 4. Electron (Optional)

For Electron builds:

```bash
cd packages/frontend
npm run electron:build
```

This builds the Electron application using `electron-builder`. Output goes to `release/`.

## Error Handling

All build scripts include proper error handling:

- **Exit codes**: Scripts exit with non-zero codes on failure
- **Error messages**: Clear error messages with context
- **Logging**: Structured logging with colors for better readability
- **Validation**: Scripts validate configuration before building

## Logging

Build scripts use structured logging:

- `ℹ` - Info messages
- `✅` - Success messages
- `⚠️` - Warnings
- `❌` - Errors

## Troubleshooting

### Build Fails with "Module not found"

1. Ensure shared package is built: `npm run build:shared`
2. Reinstall dependencies: `npm install`
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Environment Variables Not Working

1. Check that `scripts/config.sh` exists (or environment variables are set)
2. Verify variable names match expected format
3. Check script logs for configuration loading messages

### Database Connection Errors in Scripts

Some scripts (like `update-launcher-version.js`) connect to the database. If you don't need this:

```bash
export SKIP_DB_UPDATE=true
npm run build
```

### Electron Build Fails

1. Ensure all dependencies are installed
2. Check that `dist/` directory exists (frontend must be built first)
3. Verify Electron configuration in `package.json`

## CI/CD Integration

For CI/CD pipelines:

```bash
# Set environment variables
export PROD_API_HOST="your-server.com"
export PROD_API_PORT="7240"
export DATABASE_URL="mysql://..."

# Build
npm run build:shared
npm run build --workspaces

# Or use production script
npm run prod
```

## Security Notes

1. **Never commit** `scripts/config.sh` - it contains sensitive data
2. **Use environment variables** in CI/CD instead of config files
3. **Rotate secrets** regularly (JWT_SECRET, database passwords)
4. **Validate inputs** in all scripts before using them

## Next Steps

- See `SETUP_QUALITY.md` for code quality tools (ESLint, Prettier)
- See `TODO.md` for remaining tasks
- See package-specific README files for detailed documentation

