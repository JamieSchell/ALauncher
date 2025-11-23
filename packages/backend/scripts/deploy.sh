#!/bin/bash

# Скрипт автоматического развертывания на Debian
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_DIR="/opt/launcher"
BACKEND_DIR="$PROJECT_DIR/packages/backend"
FRONTEND_DIR="$PROJECT_DIR/packages/frontend"

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Проверка прав
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root or with sudo"
    exit 1
fi

# Переход в директорию проекта
cd $PROJECT_DIR

# Обновление кода
echo "📥 Updating code..."
sudo -u launcher git pull origin main

# Установка зависимостей
echo "📦 Installing dependencies..."
sudo -u launcher npm install

# Сборка shared
echo "🔨 Building shared package..."
sudo -u launcher npm run build:shared

# Backend
echo "🔨 Building backend..."
cd $BACKEND_DIR
sudo -u launcher npm run generate
sudo -u launcher npx prisma db push
sudo -u launcher npm run build

# Frontend
echo "🔨 Building frontend..."
cd $FRONTEND_DIR
sudo -u launcher npm run build

# Перезапуск сервисов
echo "🔄 Restarting services..."
systemctl restart launcher-backend

# Проверка статуса
echo "✅ Checking service status..."
sleep 2
systemctl status launcher-backend --no-pager

echo "✨ Deployment completed!"

