#!/bin/bash
# Java Version Manager for Minecraft Launcher
# Usage: java-version.sh [8|17|21|list]

JAVA_8_PATH="/opt/java/jdk8u412-b08/bin/java"
JAVA_17_PATH="/opt/java/jdk-17.0.12+7/bin/java"
JAVA_21_PATH="/opt/java/jdk-21.0.5+11/bin/java"

case "$1" in
  8)
    echo "Setting Java 8 as default..."
    export JAVA_HOME="/opt/java/jdk8u412-b08"
    export PATH="$JAVA_HOME/bin:$PATH"
    $JAVA_8_PATH -version
    ;;
  17)
    echo "Setting Java 17 as default..."
    export JAVA_HOME="/opt/java/jdk-17.0.12+7"
    export PATH="$JAVA_HOME/bin:$PATH"
    $JAVA_17_PATH -version
    ;;
  21)
    echo "Setting Java 21 as default..."
    export JAVA_HOME="/opt/java/jdk-21.0.5+11"
    export PATH="$JAVA_HOME/bin:$PATH"
    $JAVA_21_PATH -version
    ;;
  list|"")
    echo "Available Java versions:"
    echo ""
    echo "Java 8:"
    $JAVA_8_PATH -version 2>&1 | head -1
    echo "  Path: $JAVA_8_PATH"
    echo "  For: Minecraft 1.12.2 - 1.16.5"
    echo ""
    echo "Java 17:"
    $JAVA_17_PATH -version 2>&1 | head -1
    echo "  Path: $JAVA_17_PATH"
    echo "  For: Minecraft 1.17+ - 1.20.x"
    echo ""
    echo "Java 21:"
    $JAVA_21_PATH -version 2>&1 | head -1
    echo "  Path: $JAVA_21_PATH"
    echo "  For: Minecraft 1.21+"
    ;;
  *)
    echo "Usage: java-version.sh [8|17|21|list]"
    exit 1
    ;;
esac

