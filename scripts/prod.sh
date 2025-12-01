#!/bin/bash
# Production deployment script
# Builds and prepares for production using environment variables

set -eE

# Load utilities
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/utils.sh"

# Load configuration
load_config

# Set defaults
PROD_API_HOST="${PROD_API_HOST:-localhost}"
PROD_API_PORT="${PROD_API_PORT:-7240}"

log_step "Building Launcher for PRODUCTION"
log_info "Production Host: $PROD_API_HOST"
log_info "Production Port: $PROD_API_PORT"
echo ""

# Build shared package first
log_step "Building shared package..."
cd "$PROJECT_ROOT"
if npm run build:shared; then
  log_success "Shared package built"
else
  log_error "Failed to build shared package"
  exit 1
fi

# Build backend
log_step "Building Backend..."
cd "$PROJECT_ROOT/packages/backend"
if bash "$SCRIPT_DIR/prod-backend.sh" --build-only; then
  log_success "Backend built"
else
  log_error "Failed to build backend"
  exit 1
fi

# Build frontend
log_step "Building Frontend..."
cd "$PROJECT_ROOT/packages/frontend"
if bash "$SCRIPT_DIR/prod-frontend.sh"; then
  log_success "Frontend built"
else
  log_error "Failed to build frontend"
  exit 1
fi

echo ""
log_success "Production build complete!"
echo ""
log_info "To start backend:"
echo "  cd packages/backend && npm start"
echo ""
log_info "Or use systemd:"
echo "  sudo systemctl restart launcher-backend"
echo ""

