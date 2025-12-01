# GitHub Actions Workflows

This directory contains CI/CD workflows for the Modern Minecraft Launcher project.

## Workflows

### 1. `ci.yml` - Continuous Integration

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**
- **lint-and-format**: Runs ESLint, Prettier, and TypeScript type checking
- **test**: Runs tests (currently skipped if not configured)
- **build**: Builds all packages (shared, backend, frontend)
- **build-matrix**: Parallel builds for each package

**Features:**
- Automatic npm cache using `actions/setup-node@v4`
- Artifact uploads for build outputs
- Fast failure detection

### 2. `build-electron.yml` - Electron Build & Release

**Triggers:**
- Push to `main` branch
- Tags starting with `v*` (e.g., `v1.0.0`)
- Manual workflow dispatch

**Jobs:**
- **build-electron**: Builds Electron app for Windows, Linux, and macOS
- **create-release**: Creates GitHub Release with artifacts (only on tags)

**Features:**
- Multi-platform builds (Windows, Linux, macOS)
- Artifact uploads with extended retention (30-90 days)
- Automatic release creation on version tags
- Manual trigger with platform selection

**Usage:**
```bash
# Automatic on push to main or tag
git push origin main
git tag v1.0.0 && git push origin v1.0.0

# Manual trigger via GitHub UI
# Actions → Build Electron Launcher → Run workflow
```

### 3. `pr-checks.yml` - Pull Request Quality Checks

**Triggers:**
- Pull request opened, updated, or reopened

**Features:**
- Code formatting check
- Linting
- Type checking
- Build verification
- Automatic PR comments with results

## Caching

All workflows use npm caching via `actions/setup-node@v4`:
- Cache key: Based on `package-lock.json` hash
- Cache scope: Repository-level
- Automatic cache invalidation on dependency changes

## Artifacts

### CI Artifacts
- **build-artifacts**: Build outputs from all packages
- Retention: 7 days

### Electron Build Artifacts
- **electron-win**: Windows installers (.exe)
- **electron-linux**: Linux packages (.AppImage, .deb)
- **electron-mac**: macOS packages (.dmg, .zip)
- Retention: 30 days

### Release Artifacts
- **launcher-installer**: Final installers for release
- Retention: 90 days

## Environment Variables

Workflows use environment variables for configuration:

```yaml
env:
  PROD_API_URL: ${{ secrets.PROD_API_URL }}
  PROD_WS_URL: ${{ secrets.PROD_WS_URL }}
  SKIP_DB_UPDATE: 'true'  # For CI builds
```

**Required Secrets:**
- `PROD_API_URL` (optional, defaults to localhost)
- `PROD_WS_URL` (optional, defaults to localhost)

## Troubleshooting

### Build Fails with "Module not found"

1. Check that `npm ci` completed successfully
2. Verify `package-lock.json` is up to date
3. Check that shared package is built before other packages

### Electron Build Fails

1. Ensure frontend is built first (`npm run build`)
2. Check that `.env.prod` exists or environment variables are set
3. Verify Electron builder configuration in `package.json`

### Cache Issues

If cache seems stale:
1. Clear cache manually via GitHub Actions UI
2. Or update `package-lock.json` to invalidate cache

### Artifacts Not Uploading

1. Check workflow logs for file paths
2. Verify `if-no-files-found: warn` is set (won't fail on missing files)
3. Check retention settings

## Best Practices

1. **Always test locally** before pushing
2. **Use tags** for releases (e.g., `v1.0.0`)
3. **Review PR checks** before merging
4. **Monitor artifact retention** to avoid storage issues
5. **Keep secrets secure** - never commit sensitive data

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or download from https://github.com/nektos/act/releases

# Run CI workflow
act push

# Run specific workflow
act workflow_dispatch -W .github/workflows/build-electron.yml
```

## Next Steps

- Add deployment workflows (optional)
- Configure branch protection rules
- Set up status checks for required workflows
- Add notification webhooks (Slack, Discord, etc.)

