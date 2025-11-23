#!/bin/bash

# Скрипт проверки здоровья системы
# Usage: ./health-check.sh

API_URL=${API_URL:-http://localhost:7240}
MYSQL_USER=${MYSQL_USER:-launcher_user}
MYSQL_DB=${MYSQL_DB:-launcher_db}

echo "🏥 Health Check"
echo "==============="

# Проверка API
echo -n "API Status: "
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" || echo "000")
if [ "$API_RESPONSE" = "200" ]; then
    echo "✅ OK"
else
    echo "❌ FAILED (HTTP $API_RESPONSE)"
fi

# Проверка MySQL
echo -n "MySQL Status: "
if systemctl is-active --quiet mysql; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Проверка подключения к БД
echo -n "Database Connection: "
if mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" -e "SELECT 1" "$MYSQL_DB" &>/dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

# Проверка systemd сервиса
echo -n "Backend Service: "
if systemctl is-active --quiet launcher-backend; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Проверка Nginx
echo -n "Nginx Status: "
if systemctl is-active --quiet nginx; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Использование диска
echo -n "Disk Usage: "
df -h / | tail -1 | awk '{print $5}'

# Использование памяти
echo -n "Memory Usage: "
free -h | grep Mem | awk '{print $3 "/" $2}'

echo "==============="

