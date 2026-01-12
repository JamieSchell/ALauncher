# ALauncher NPM Scripts Guide

Complete guide for all npm scripts available in the ALauncher monorepo.

## Table of Contents

- [Overview](#overview)
- [Root Scripts](#root-scripts)
- [Backend Scripts](#backend-scripts)
- [Frontend Scripts](#frontend-scripts)
- [Shared Scripts](#shared-scripts)
- [Development Workflow](#development-workflow)
- [Build Workflow](#build-workflow)

---

## Overview

ALauncher is organized as a monorepo using npm workspaces. Scripts are organized at different levels:

- **Root scripts** - Operate on the entire monorepo
- **Backend scripts** - Backend-specific operations
- **Frontend scripts** - Frontend and Tauri operations
- **Shared scripts** - Shared utilities package

---

## Root Scripts

Located in `/opt/ALauncher/package.json`

### `npm install`

Install all dependencies for the monorepo.

```bash
npm install
```

**What it does:**
- Installs root dependencies
- Installs dependencies for all workspaces (packages/backend, packages/frontend, packages/shared)
- Links internal packages together

### `npm run build`

Build all packages in the correct order.

```bash
npm run build
```

**Build order:**
1. `packages/shared` - Shared utilities (built first as other packages depend on it)
2. All other packages in parallel (backend, frontend)

### `npm run build:shared`

Build only the shared package.

```bash
npm run build:shared
```

**When to use:**
- After modifying shared utilities
- Before building other packages that depend on shared
- As a quick rebuild when only shared code changed

**Output:** `packages/shared/dist/`

### `npm run tauri:build`

Build the Tauri desktop application.

```bash
npm run tauri:build
```

**What it does:**
1. Builds frontend with Vite
2. Compiles Rust code for Tauri
3. Creates platform-specific installers

**Output varies by platform:**
- **Linux**: `.deb`, `.rpm`, `.AppImage` in `packages/frontend/src-tauri/target/release/bundle/`
- **macOS**: `.app`, `.dmg` in `packages/frontend/src-tauri/target/release/bundle/macos/`
- **Windows**: `.msi`, `.nsis` in `packages/frontend/src-tauri/target/release/bundle/`

### `npm run clean`

Clean all build artifacts and dependencies.

```bash
npm run clean
```

**What it removes:**
- `dist-builds/` - Build artifacts
- `packages/frontend/dist/` - Frontend build output
- `packages/backend/dist/` - Backend build output
- `packages/shared/dist/` - Shared package build output
- `dist/` - Root dist directory
- `node_modules/` - All dependencies

**When to use:**
- Starting fresh
- Resolving dependency conflicts
- Reducing disk space

---

## Backend Scripts

Located in `packages/backend/package.json`

### `npm run build`

Compile TypeScript to JavaScript.

```bash
cd packages/backend
npm run build
```

**What it does:**
- Runs TypeScript compiler (`tsc`)
- Type-checks all TypeScript files
- Outputs JavaScript to `dist/`

**Output:** `packages/backend/dist/`

### `npm run start`

Start the production backend server.

```bash
cd packages/backend
npm run start
```

**What it does:**
- Runs compiled JavaScript from `dist/index.js`
- Starts Express server on configured port (default: 7240)
- Connects to database
- Serves API routes
- Starts WebSocket server

**Prerequisites:**
- Must run `npm run build` first
- Database must be running
- Environment variables must be configured

### `npm run migrate`

Run Prisma database migrations.

```bash
cd packages/backend
npm run migrate
```

**What it does:**
- Runs pending Prisma migrations
- Creates/updates database schema
- Applies migration files from `prisma/migrations/`

**When to use:**
- Initial database setup
- After schema changes
- After pulling new migrations

### `npm run generate`

Generate Prisma client.

```bash
cd packages/backend
npm run generate
```

**What it does:**
- Generates Prisma Client from schema
- Creates TypeScript types for database models
- Updates `@prisma/client` package

**When to use:**
- After schema changes
- After pulling from git
- Before running `npm run build` if schema changed

### `npm run studio`

Open Prisma Studio (database GUI).

```bash
cd packages/backend
npm run studio
```

**What it does:**
- Opens web-based database browser
- Allows viewing/editing data
- Shows relationships between tables

**Access:** Opens browser window (default: http://localhost:5555)

---

## Frontend Scripts

Located in `packages/frontend/package.json`

### `npm run build`

Build frontend for production.

```bash
cd packages/frontend
npm run build
```

**What it does:**
- Runs Vite build
- Compiles React/TypeScript
- Optimizes assets
- Code splitting
- CSP replacements

**Output:** `packages/frontend/dist/`

### `npm run tauri:build`

Build Tauri desktop application.

```bash
cd packages/frontend
npm run tauri:build
```

**What it does:**
- Builds frontend with Vite
- Compiles Rust backend
- Creates native installers
- Code signing (if configured)

---

## Shared Scripts

Located in `packages/shared/package.json`

The shared package typically has minimal scripts since it only exports utilities.

### `npm run build`

Compile TypeScript utilities.

```bash
cd packages/shared
npm run build
```

**What it does:**
- Compiles shared TypeScript code
- Outputs to `dist/`
- Makes utilities available to other packages

**Output:** `packages/shared/dist/`

---

## Development Workflow

### Initial Setup

```bash
# Install dependencies
npm install

# Setup environment
cd packages/backend
cp .env.example .env
# Edit .env with your configuration

# Setup database
npm run generate
npm run migrate

# Return to root
cd ../..
```

---

### Development Mode

**Option 1: Run both frontend and backend**

```bash
# Terminal 1 - Backend
cd packages/backend
npm run dev        # Note: Add "dev": "tsx src/index.ts" to package.json first

# Terminal 2 - Frontend
cd packages/frontend
npm run dev        # Note: Standard Vite dev server
```

**Option 2: Use CLI for backend operations**

```bash
cd packages/backend
npm run cli
```

Then use CLI commands interactively.

---

### Making Changes

**Shared utilities changes:**
```bash
cd packages/shared
npm run build
cd ../..
npm run build
```

**Backend changes:**
```bash
cd packages/backend
npm run build
npm run start
```

**Frontend changes:**
```bash
cd packages/frontend
npm run dev        # Hot reload enabled
```

---

## Build Workflow

### Full Production Build

```bash
# Clean everything
npm run clean

# Install dependencies
npm install

# Build shared package
npm run build:shared

# Build all packages
npm run build

# Build Tauri application
npm run tauri:build
```

### Quick Build (After Code Changes)

```bash
# Just rebuild what changed
cd packages/backend
npm run build

# Or frontend
cd packages/frontend
npm run build
```

---

## Adding Custom Scripts

### Backend Development Server

Add to `packages/backend/package.json`:

```json
{
  "scripts": {
    "dev": "tsx src/index.ts"
  }
}
```

### Frontend Development Server

Add to `packages/frontend/package.json`:

```json
{
  "scripts": {
    "dev": "vite"
  }
}
```

### Database Seeding

Add to `packages/backend/package.json`:

```json
{
  "scripts": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## Script Reference Table

| Script | Location | Purpose |
|--------|----------|---------|
| `install` | Root | Install all dependencies |
| `build` | Root | Build all packages |
| `build:shared` | Root | Build shared package only |
| `tauri:build` | Root | Build Tauri desktop app |
| `clean` | Root | Remove all build artifacts |
| `build` | Backend | Compile TypeScript to JavaScript |
| `start` | Backend | Start production server |
| `migrate` | Backend | Run database migrations |
| `generate` | Backend | Generate Prisma client |
| `studio` | Backend | Open Prisma Studio |
| `cli` | Backend | Start CLI interface |
| `build` | Frontend | Build frontend for production |
| `tauri:build` | Frontend | Build Tauri application |

---

## Common Workflows

### First Time Setup

```bash
git clone https://github.com/JamieSchell/ALauncher.git
cd ALauncher
npm install
cd packages/backend
cp .env.example .env
# Edit .env
npm run generate
npm run migrate
```

### Daily Development

```bash
# Pull latest changes
git pull

# Install new dependencies (if any)
npm install

# If shared changed
npm run build:shared

# Build what you're working on
cd packages/backend
npm run build
npm run cli        # Or npm run start
```

### Before Committing

```bash
# Build everything
npm run build

# Check for errors
cd packages/backend
npm run build

cd ../frontend
npm run build

cd ../shared
npm run build
```

### Preparing Release

```bash
# Clean everything
npm run clean

# Fresh install
npm install

# Full build
npm run build

# Create Tauri installers
npm run tauri:build

# Test installers from target/release/bundle/
```

---

## Troubleshooting

### Build Fails

```bash
# Clean and retry
npm run clean
npm install
npm run build
```

### Prisma Client Issues

```bash
cd packages/backend
rm -rf node_modules/@prisma
npm run generate
npm install
```

### TypeScript Errors

```bash
# Ensure types are installed
npm install

# Regenerate Prisma types (if database related)
cd packages/backend
npm run generate
```

### Tauri Build Fails

```bash
# Ensure frontend builds first
cd packages/frontend
npm run build

# Then try Tauri build
npm run tauri:build
```

---

## Next Steps

- [BUILD_GUIDE.md](BUILD_GUIDE.md) - Platform-specific build instructions
- [ENVIRONMENT.md](ENVIRONMENT.md) - Environment configuration
- [CLI_GUIDE.md](CLI_GUIDE.md) - Command-line interface usage
