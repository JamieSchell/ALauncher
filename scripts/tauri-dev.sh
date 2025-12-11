#!/bin/bash

# Tauri development script with Xvfb support

# Check if DISPLAY is set
if [ -z "$DISPLAY" ]; then
    echo "No DISPLAY detected, starting Xvfb..."
    export DISPLAY=:99
    Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
    XVFB_PID=$!
    echo "Xvfb started with PID: $XVFB_PID"

    # Wait a moment for Xvfb to initialize
    sleep 2

    # Set up cleanup
    trap "kill $XVFB_PID 2>/dev/null || true" EXIT
fi

# Run Tauri dev
cd packages/frontend
npm run tauri:dev