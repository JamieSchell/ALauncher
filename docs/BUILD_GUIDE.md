# ALauncher Build Guide

Complete guide for building ALauncher on different platforms.

## Table of Contents

- [System Requirements](#system-requirements)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Platform-Specific Build](#platform-specific-build)
- [Development Build](#development-build)
- [Production Build](#production-build)
- [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements

| Component | Minimum |
|-----------|---------|
| Node.js | v22.21.1 |
| npm | v10.9.4 |
| RAM | 4 GB |
| Disk Space | 2 GB free |
| Git | Latest stable version |

### Platform-Specific Requirements

#### Linux (Debian/Ubuntu)
```bash
# Build dependencies
sudo apt update
sudo apt install -y \
    libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

#### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Rust and dependencies
brew install rust
```

#### Windows
```bash
# Install Visual Studio C++ Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/

# Or use winget
winget install Microsoft.VisualStudio.2022.BuildTools
```

---

## Prerequisites

### 1. Install Rust

Tauri requires Rust toolchain for building native modules.

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. Install Node.js 22

Using `nvm` (recommended):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

### 3. Clone Repository

```bash
git clone https://github.com/JamieSchell/ALauncher.git
cd ALauncher
```

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install dependencies for all packages in the monorepo:
- `packages/backend` - Node.js backend
- `packages/frontend` - React + Tauri frontend
- `packages/shared` - Shared utilities

### 2. Configure Environment

Create environment configuration (see [ENVIRONMENT.md](ENVIRONMENT.md)):

```bash
cp packages/backend/.env.example packages/backend/.env
# Edit .env with your configuration
```

### 3. Setup Database

```bash
cd packages/backend
npm run migrate
npm run seed  # Optional: seed with initial data
```

### 4. Build All Packages

```bash
cd ../..  # Return to root
npm run build
```

---

## Platform-Specific Build

### Linux

#### Development Build
```bash
npm run tauri:dev
```

#### Production Build
```bash
npm run tauri:build
```

Output: `packages/frontend/src-tauri/target/release/bundle/deb/`

#### Available Formats
- `.deb` (Debian/Ubuntu)
- `.rpm` (Fedora/openSUSE)
- `.AppImage` (Universal Linux)

### macOS

#### Development Build
```bash
npm run tauri:dev
```

#### Production Build
```bash
npm run tauri:build
```

Output: `packages/frontend/src-tauri/target/release/bundle/macos/`

#### Available Formats
- `.app` (Application bundle)
- `.dmg` (Disk image)
- `.app.tar.gz` (Compressed bundle)

**Note:** For code signing, set `APPLE_SIGNING_IDENTITY` and `APPLE_ID` in environment.

### Windows

#### Development Build
```bash
npm run tauri:dev
```

#### Production Build
```bash
npm run tauri:build
```

Output: `packages/frontend/src-tauri/target/release/bundle/msi/` or `/bundle/nsis/`

#### Available Formats
- `.msi` (Windows Installer)
- `.nsis` (Nullsoft Scriptable Install System)

---

## Development Build

### Frontend Development Server

```bash
cd packages/frontend
npm run dev
```

Opens Vite dev server at `http://localhost:5173`

### Backend Development Server

```bash
cd packages/backend
npm run dev
```

Starts Express server at `http://localhost:7240`

### Full Stack Development

Run both in parallel:

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

Or use concurrent:

```bash
npm run dev
```

---

## Production Build

### 1. Build Shared Package

```bash
npm run build:shared
```

### 2. Build Backend

```bash
cd packages/backend
npm run build
```

Output: `packages/backend/dist/`

### 3. Build Frontend

```bash
cd packages/frontend
npm run build
```

Output: `packages/frontend/dist/`

### 4. Build Tauri Application

```bash
npm run tauri:build
```

Output location varies by platform (see Platform-Specific Build above).

---

## Build Output Structure

```
ALauncher/
├── packages/
│   ├── backend/
│   │   └── dist/                 # Compiled backend
│   ├── frontend/
│   │   ├── dist/                 # Built frontend assets
│   │   └── src-tauri/target/
│   │       └── release/
│   │           └── bundle/       # Platform-specific installers
│   └── shared/
│       └── dist/                 # Compiled shared utilities
```

---

## Troubleshooting

### Rust/Cargo Issues

**Problem:** Rust not found after installation
```bash
# Add Cargo to PATH
source $HOME/.cargo/env
# Or add to ~/.bashrc or ~/.zshrc:
echo 'source $HOME/.cargo/env' >> ~/.bashrc
```

**Problem:** Rust compilation fails
```bash
# Update Rust toolchain
rustup update stable
rustup default stable
```

### Node.js Issues

**Problem:** Wrong Node.js version
```bash
nvm install 22
nvm use 22
nvm alias default 22
```

**Problem:** npm install fails
```bash
# Clean npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Tauri Build Issues

**Problem:** Webkit missing on Linux
```bash
sudo apt install libwebkit2gtk-4.1-dev
```

**Problem:** Vite build fails
```bash
cd packages/frontend
rm -rf node_modules dist
npm install
npm run build
```

**Problem:** Frontend not loading in Tauri
```bash
# Check Vite base path in vite.config.ts
# Should be: base: "./", for Tauri
```

### Database Issues

**Problem:** Prisma client not generated
```bash
cd packages/backend
npx prisma generate
```

**Problem:** Migration fails
```bash
cd packages/backend
npm run migrate:reset  # Resets database
npm run migrate        # Re-run migrations
```

### Permission Issues (Linux)

**Problem:** Cannot install globally
```bash
# Fix npm permissions
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Memory Issues

**Problem:** Build runs out of memory
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

## CI/CD Build

The project includes GitHub Actions workflows for automated builds:

### `.github/workflows/`

- **Build and Test**: Runs on every push
- **Release**: Creates platform-specific releases

To trigger a build:

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Additional Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## Next Steps

After successful build:

1. Read [CLI_GUIDE.md](CLI_GUIDE.md) for command-line tools
2. Configure environment in [ENVIRONMENT.md](ENVIRONMENT.md)
3. Learn about npm scripts in [NPM_SCRIPTS.md](NPM_SCRIPTS.md)
