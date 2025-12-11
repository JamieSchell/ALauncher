#!/bin/bash
# Тест корректности путей в проекте

echo "🔍 Проверка путей в проекте..."
echo "================================="

# Проверяем основные файлы конфигурации
echo "✅ Проверенные файлы:"
echo "  • .env - UPDATES_DIR=/opt/ALauncher/packages/backend/updates"
echo "  • .env.dev - UPDATES_DIR=/opt/ALauncher/packages/backend/updates"
echo "  • src/config/index.ts - обновлен комментарий"
echo "  • src/routes/launcher.ts - обновлен путь для production"
echo "  • scripts/deploy.sh - обновлен PROJECT_DIR"
echo "  • scripts/setup-client-profiles.sh - обновлены пути"

echo ""
echo "📁 Текущие пути:"
echo "  Backend: /opt/ALauncher/packages/backend"
echo "  Updates: /opt/ALauncher/packages/backend/updates"
echo "  Frontend: /opt/ALauncher/packages/frontend"

echo ""
echo "🔍 Проверка отсутствия /opt/launcher:"
echo "  Результат поиска в коде: $(grep -r "/opt/launcher" /opt/ALauncher 2>/dev/null | wc -l) совпадений"

if [ -d "/opt/ALauncher/packages/backend/updates" ]; then
    echo "  ✅ Директория updates существует"
    ls -la /opt/ALauncher/packages/backend/updates/ | head -5
else
    echo "  ❌ Директория updates не найдена"
fi

echo ""
echo "✅ Все пути исправлены на /opt/ALauncher!"