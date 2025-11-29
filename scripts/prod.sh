#!/bin/bash
# Production deployment script
# Builds and prepares for production with IP 5.188.119.206

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Building Launcher for PRODUCTION..."
echo "📍 Production IP: 5.188.119.206"
echo ""

# Build shared package first
echo "📦 Building shared package..."
cd "$PROJECT_ROOT"
npm run build:shared

# Build backend
echo "📦 Building Backend..."
cd "$PROJECT_ROOT/packages/backend"
bash "$SCRIPT_DIR/prod-backend.sh" --build-only 2>/dev/null || {
  # If --build-only not supported, just build
  if [ -f .env.prod ]; then
    cp .env.prod .env
  fi
  npm run build
}

# Build frontend
echo "📦 Building Frontend..."
cd "$PROJECT_ROOT/packages/frontend"
bash "$SCRIPT_DIR/prod-frontend.sh"

echo ""
echo "✅ Production build complete!"
echo ""
echo "To start backend:"
echo "  cd packages/backend && npm start"
echo ""
echo "Or use systemd:"
echo "  sudo systemctl restart launcher-backend"
echo ""

