#!/bin/bash
# Production Frontend Build Script
# Uses production IP 5.188.119.206

set -e

cd "$(dirname "$0")/../packages/frontend"

echo "🚀 Building Frontend for PRODUCTION..."
echo "📍 API URL: http://5.188.119.206:7240"
echo ""

# Ensure .env.prod exists with prod settings
if [ ! -f .env.prod ]; then
  cat > .env.prod << 'ENVEOF'
VITE_API_URL=http://5.188.119.206:7240
VITE_WS_URL=ws://5.188.119.206/ws
ENVEOF
  echo "✅ Created .env.prod file"
fi

# Copy .env.prod to .env for build
cp .env.prod .env
echo "✅ Using .env.prod configuration"
echo ""

# Verify .env content
echo "📋 Current configuration:"
grep "VITE_API_URL" .env || echo "⚠️  VITE_API_URL not found in .env!"
grep "VITE_WS_URL" .env || echo "⚠️  VITE_WS_URL not found in .env!"
echo ""

# Build for production
echo "📦 Building frontend..."
npm run build

# Verify CSP in built HTML
echo ""
echo "🔍 Verifying CSP in built HTML..."
if grep -q "5.188.119.206" dist/index.html 2>/dev/null; then
  echo "✅ CSP contains production IP (5.188.119.206)"
else
  echo "⚠️  WARNING: CSP does not contain production IP!"
  echo "   This means the build used wrong .env file"
  echo "   Please check that .env.prod contains: VITE_API_URL=http://5.188.119.206:7240"
fi

echo ""
echo "✅ Build complete!"
echo "📍 Built files are in: dist/"
echo "📍 To serve: npm run preview"
echo ""

