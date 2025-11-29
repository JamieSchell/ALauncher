#!/bin/bash
# Development Frontend Startup Script
# Uses localhost configuration

set -e

cd "$(dirname "$0")/../packages/frontend"

echo "🚀 Starting Frontend in DEVELOPMENT mode..."
echo "📍 Frontend URL: http://localhost:5173"
echo "📍 API URL: http://localhost:7240"
echo ""

# Ensure .env.dev exists with dev settings
if [ ! -f .env.dev ]; then
  cat > .env.dev << 'ENVEOF'
VITE_API_URL=http://localhost:7240
VITE_WS_URL=ws://localhost:7240/ws
VITE_DEV_SERVER_URL=http://localhost:5173
ENVEOF
  echo "✅ Created .env.dev file"
fi

# Copy .env.dev to .env for Vite
cp .env.dev .env
echo "✅ Using .env.dev configuration"

# Start dev server
echo "🔄 Starting Vite dev server with hot reload..."
npm run dev

