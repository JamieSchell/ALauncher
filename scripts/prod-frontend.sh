#!/bin/bash
# Production Frontend Build Script
# Uses environment variables for configuration

set -eE

# Load utilities
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

# Load configuration
load_config

# Set defaults if not configured
PROD_API_URL="${PROD_API_URL:-http://localhost:7240}"
PROD_WS_URL="${PROD_WS_URL:-ws://localhost/ws}"

cd "$(dirname "$0")/../packages/frontend"

log_step "Building Frontend for PRODUCTION"
log_info "API URL: $PROD_API_URL"
log_info "WebSocket URL: $PROD_WS_URL"
echo ""

# Ensure .env.prod exists with prod settings
if [ ! -f .env.prod ]; then
  log_warning ".env.prod not found, creating from environment variables"
  cat > .env.prod << EOF
VITE_API_URL=${PROD_API_URL}
VITE_WS_URL=${PROD_WS_URL}
EOF
  log_success "Created .env.prod file"
fi

# Copy .env.prod to .env for build
cp .env.prod .env
log_success "Using .env.prod configuration"
echo ""

# Verify .env content
log_info "Current configuration:"
if grep -q "VITE_API_URL" .env; then
  grep "VITE_API_URL" .env | sed 's/^/  /'
else
  log_warning "VITE_API_URL not found in .env!"
fi

if grep -q "VITE_WS_URL" .env; then
  grep "VITE_WS_URL" .env | sed 's/^/  /'
else
  log_warning "VITE_WS_URL not found in .env!"
fi
echo ""

# Build for production
log_step "Building frontend with Vite..."
if npm run build; then
  log_success "Build completed successfully"
else
  log_error "Build failed"
  exit 1
fi

# Verify CSP in built HTML
echo ""
log_info "Verifying CSP in built HTML..."
if [ -f dist/index.html ]; then
  # Extract API host from URL
  API_HOST=$(echo "$PROD_API_URL" | sed -E 's|https?://([^:/]+).*|\1|')
  if grep -q "$API_HOST" dist/index.html 2>/dev/null; then
    log_success "CSP contains production host ($API_HOST)"
  else
    log_warning "CSP does not contain production host ($API_HOST)!"
    log_warning "This means the build may have used wrong .env file"
    log_info "Please check that .env.prod contains: VITE_API_URL=$PROD_API_URL"
  fi
else
  log_warning "dist/index.html not found - cannot verify CSP"
fi

echo ""
log_success "Build complete!"
log_info "Built files are in: dist/"
log_info "To serve: npm run preview"
echo ""

