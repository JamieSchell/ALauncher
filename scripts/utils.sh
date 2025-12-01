#!/bin/bash
# Utility functions for build scripts
# Provides logging, error handling, and configuration loading

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠️${NC} $1"
}

log_error() {
  echo -e "${RED}❌${NC} $1" >&2
}

log_step() {
  echo -e "\n${BLUE}📦${NC} $1"
}

# Error handling
set_error_handler() {
  set -eE
  trap 'error_handler $? $LINENO' ERR
}

error_handler() {
  local exit_code=$1
  local line_no=$2
  log_error "Error occurred at line $line_no with exit code $exit_code"
  exit $exit_code
}

# Load configuration
load_config() {
  local config_file="${1:-config.sh}"
  local script_dir="$(cd "$(dirname "$0")" && pwd)"
  local config_path="$script_dir/$config_file"
  
  if [ -f "$config_path" ]; then
    log_info "Loading configuration from $config_file"
    source "$config_path"
  elif [ -f "$script_dir/config.example.sh" ]; then
    log_warning "Configuration file not found. Using environment variables or defaults."
    log_info "To create config, copy config.example.sh to config.sh"
  fi
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check required commands
check_requirements() {
  local missing=()
  
  for cmd in "$@"; do
    if ! command_exists "$cmd"; then
      missing+=("$cmd")
    fi
  done
  
  if [ ${#missing[@]} -ne 0 ]; then
    log_error "Missing required commands: ${missing[*]}"
    log_info "Please install missing commands and try again"
    return 1
  fi
  
  return 0
}

# Get project root directory
get_project_root() {
  local script_dir="$(cd "$(dirname "$0")" && pwd)"
  echo "$(cd "$script_dir/.." && pwd)"
}

# Ensure directory exists
ensure_dir() {
  if [ ! -d "$1" ]; then
    mkdir -p "$1"
    log_success "Created directory: $1"
  fi
}

# Clean directory
clean_dir() {
  if [ -d "$1" ]; then
    log_info "Cleaning directory: $1"
    rm -rf "$1"/*
    log_success "Cleaned directory: $1"
  fi
}

