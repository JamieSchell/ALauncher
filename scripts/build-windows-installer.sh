#!/bin/bash
set -e

echo "========================================"
echo "  Build Windows Portable Version"
echo "========================================"
echo ""

cd "$(dirname "$0")/.."

cd packages/frontend

echo "[1/3] Building shared package..."
cd ../../packages/shared
npm run build
echo "✅ Shared package built"
echo ""

echo "[2/3] Building frontend..."
cd ../frontend

# Build frontend
npm run build:portable

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Portable version built successfully!"
    echo "📦 File: packages/frontend/release/Modern Launcher-*-portable.exe"
    ls -lh release/*portable.exe 2>/dev/null || echo "Check release directory for output files"
    echo ""
    echo "ℹ️  Note: Portable version doesn't require installation - users can just run the .exe file."
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi

