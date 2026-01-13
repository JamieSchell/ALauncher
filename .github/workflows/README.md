# GitHub Actions Workflows

This directory contains automated build workflows for ALauncher.

## Workflows

### 1. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Push a tag: `git tag v1.0.0 && git push origin v1.0.0`
- Manual trigger via GitHub Actions UI

**What it does:**
- Builds Tauri installers for all platforms (Windows, macOS, Linux)
- Creates GitHub Release with installers
- Uploads artifacts for 30 days

**Platforms:**
| Platform | Runner | Artifacts |
|----------|---------|-----------|
| Linux | ubuntu-24.04 | `.deb`, `.rpm`, `.AppImage` |
| Windows | windows-latest | `.nsis`, `.msi` |
| macOS | macos-latest | `.dmg`, `.app` |

### 2. Build Test Workflow (`.github/workflows/build.yml`)

**Triggers:**
- Pull request to `main`
- Push to `main`
- Manual trigger

**What it does:**
- Tests build on all platforms (without bundles)
- Runs TypeScript type checking
- Runs linter checks

## How to Create a Release

### Option 1: Using Git Tags (Recommended)

```bash
# Create and push a new tag
git tag v1.0.0
git push origin v1.0.0
```

This will:
1. Trigger the Release workflow
2. Build installers for all platforms
3. Create a GitHub Release
4. Attach installers to the release

### Option 2: Manual Trigger

1. Go to GitHub Actions tab
2. Select "Release" workflow
3. Click "Run workflow"
4. Enter version (e.g., `1.0.0`)
5. Click "Run workflow"

## Versioning

Follow [Semantic Versioning](https://semver.org/):
- `v1.0.0` - Major release (breaking changes)
- `v1.1.0` - Minor release (new features)
- `v1.0.1` - Patch release (bug fixes)

## Secrets Configuration

The following secrets should be configured in GitHub repository settings:

### Optional (for code signing):
- `TAURI_PRIVATE_KEY` - Private key for signing installers
- `TAURI_KEY_PASSWORD` - Password for the private key

To generate keys:
```bash
npm run tauri signer generate
```

## Artifacts

Build artifacts are stored for 30 days and can be downloaded from:
1. GitHub Actions tab → Workflow run → Artifacts section
2. GitHub Release page (for tagged releases)

## Troubleshooting

### Build fails on macOS
- Ensure macOS-13 runner is available
- Check if Xcode version is compatible

### Build fails on Windows
- Check MSVC toolchain installation
- Verify Visual Studio dependencies

### Build fails on Linux
- Check libwebkit2gtk version
- Verify Rust toolchain compatibility

## Local Testing

To test builds locally before pushing:

```bash
# Linux
npm run build:linux

# Windows (run on Windows)
npm run build:windows

# macOS (run on macOS)
npm run build:macos
```
