#!/bin/bash
# Development Backend Startup Script
# Uses localhost configuration

set -e

cd "$(dirname "$0")/../packages/backend"

echo "🚀 Starting Backend in DEVELOPMENT mode..."
echo "📍 API URL: http://localhost:7240"
echo ""

# Ensure .env.dev exists with dev settings
if [ ! -f .env.dev ]; then
  cat > .env.dev << 'ENVEOF'
NODE_ENV=development
PORT=7240
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
DATABASE_URL=mysql://launcher:password@localhost:3306/launcher_db
JWT_SECRET=dev_secret_key_change_in_production_min_32_chars
JWT_EXPIRY=24h
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_ATTEMPTS=10
RATE_LIMIT_WINDOW_MS=60000
LOG_LEVEL=debug
ENVEOF
  echo "✅ Created .env.dev file"
fi

# Copy .env.dev to .env for use
cp .env.dev .env
echo "✅ Using .env.dev configuration"

# Build if needed
if [ ! -f dist/index.js ]; then
  echo "📦 Building backend..."
  npm run build
fi

# Start with tsx watch in development
echo "🔄 Starting with hot reload..."
npm run dev

