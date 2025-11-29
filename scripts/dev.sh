#!/bin/bash
# Start both Backend and Frontend in Development mode
# Uses localhost configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Starting Launcher in DEVELOPMENT mode..."
echo "📍 Backend: http://localhost:7240"
echo "📍 Frontend: http://localhost:5173"
echo ""

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "🛑 Stopping services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "📦 Starting Backend..."
cd "$PROJECT_ROOT/packages/backend"
bash "$SCRIPT_DIR/dev-backend.sh" &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "📦 Starting Frontend..."
cd "$PROJECT_ROOT/packages/frontend"
bash "$SCRIPT_DIR/dev-frontend.sh" &
FRONTEND_PID=$!

echo ""
echo "✅ Both services started!"
echo "📍 Backend PID: $BACKEND_PID"
echo "📍 Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait

