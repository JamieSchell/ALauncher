#!/bin/bash
# Production Backend Startup Script
# Uses production IP 5.188.119.206

set -e

cd "$(dirname "$0")/../packages/backend"

# Ensure .env.prod exists with prod settings
if [ ! -f .env.prod ]; then
  cat > .env.prod << 'ENVEOF'
NODE_ENV=production
PORT=7240
HOST=5.188.119.206
CORS_ORIGIN=http://5.188.119.206,http://5.188.119.206:5173,https://5.188.119.206
DATABASE_URL=mysql://skala1_newl:Alekcey2009%40%40%40%40@skala1.beget.tech:3306/skala1_newl
JWT_SECRET=71b647b9d7a663f2d0cffc6432b94f6f
JWT_EXPIRY=24h
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=60000
LOG_LEVEL=info
ENVEOF
fi

# Copy .env.prod to .env for use
cp .env.prod .env > /dev/null 2>&1

# Check if --build-only flag is set
if [ "$1" = "--build-only" ]; then
  npm run build > /dev/null 2>&1
  exit 0
fi

# Build for production (silent)
npm run build > /dev/null 2>&1

# Start production server
npm start

