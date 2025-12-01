#!/bin/bash
# Production Backend Startup Script
# Uses environment variables for configuration

set -eE

# Load utilities
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

# Load configuration
load_config

# Set defaults if not configured
PROD_API_HOST="${PROD_API_HOST:-localhost}"
PROD_API_PORT="${PROD_API_PORT:-7240}"
PROD_API_URL="${PROD_API_URL:-http://${PROD_API_HOST}:${PROD_API_PORT}}"
DATABASE_URL="${DATABASE_URL:-mysql://user:password@localhost:3306/launcher_db}"

cd "$(dirname "$0")/../packages/backend"

log_step "Starting Backend for PRODUCTION"
log_info "Host: $PROD_API_HOST"
log_info "Port: $PROD_API_PORT"
echo ""

# Ensure .env.prod exists with prod settings
if [ ! -f .env.prod ]; then
  log_warning ".env.prod not found, creating from environment variables"
  cat > .env.prod << EOF
NODE_ENV=production
PORT=${PROD_API_PORT}
HOST=${PROD_API_HOST}
CORS_ORIGIN=${PROD_API_URL},${PROD_API_URL}:5173
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=\${JWT_SECRET:-change-this-secret-in-production-min-32-chars}
JWT_EXPIRY=24h
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=60000
LOG_LEVEL=info
EOF
  log_success "Created .env.prod file"
  log_warning "Please update JWT_SECRET and DATABASE_URL in .env.prod before production use!"
fi

# Copy .env.prod to .env for use
if cp .env.prod .env 2>/dev/null; then
  log_success "Using .env.prod configuration"
else
  log_error "Failed to copy .env.prod to .env"
  exit 1
fi

# Check if --build-only flag is set
if [ "$1" = "--build-only" ]; then
  log_step "Building backend (build-only mode)..."
  if npm run build; then
    log_success "Build completed"
    exit 0
  else
    log_error "Build failed"
    exit 1
  fi
fi

# Build for production
log_step "Building backend..."
if npm run build; then
  log_success "Build completed"
else
  log_error "Build failed"
  exit 1
fi

# Start production server
log_step "Starting production server..."
log_info "Server will start on ${PROD_API_HOST}:${PROD_API_PORT}"
npm start

