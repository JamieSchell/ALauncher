# Текущее состояние проекта ALauncher

**Последнее обновление:** 2026-01-13 02:00 UTC (PM2 настройка)

## Статус систем

| Компонент | Статус | Детали |
|-----------|--------|--------|
| Backend | ✅ Работает | PM2, порт 7240, HTTPS |
| Frontend | ⚠️ Не собран | Tauri build не тестировался |
| Shared | ✅ v2.0.0 | 95 тестов проходят |
| Nginx | ✅ Настроен | HTTPS only, SSL cert |
| Database | ❌ Таблицы нет | Нужно migration |
| PM2 | ✅ Настроен | Автозапуск systemd |

## Последние выполненные задачи

### 2026-01-13
1. ✅ Получен SSL сертификат Let's Encrypt
2. ✅ Nginx настроен для HTTPS-only
3. ✅ CORS обновлён для `https://api.alauncher.su`
4. ✅ Установлено VSCode расширение "Claude Code Assist"

### 2026-01-12 (ранее)
1. ✅ SHARED_AUDIT фазы 4-7 завершены
2. ✅ Создано 95 тестов (все passing)
3. ✅ Исправлены баги в PathHelper, UUIDHelper, SecurityHelper
4. ✅ Добавлены discriminated unions и type guards
5. ✅ Полная документация JSDoc на русском
6. ✅ Отправлено в GitHub (JamieSchell/ALauncher)

## Текущие проблемы

### 1. Database Migration
- Таблицы `users`, `launcher_errors` не существуют
- Prisma schema создана, но migration не запущена
- Backend работает, но авторизация падает с ошибкой P2021

**Решение:**
```bash
cd packages/backend
npx prisma migrate deploy
# или
npx prisma db push
```

### 2. Frontend Build
- Tauri конфигурация обновлена
- Но сборка не тестировалась
- Нужно проверить: `npm run tauri build`

## Файлы, которые были изменены

### Backend
- `.env.prod` - CORS_ORIGIN изменён на `https://api.alauncher.su`
- `src/utils/progressBar.ts` - создан (был missing)

### Nginx
- `/etc/nginx/sites-available/api.alauncher.su` - создан
- `/etc/nginx/sites-available/launcher` - удалён (old IP-based config)

### Shared
- `src/utils/index.ts` - исправлены баги
- `src/types/index.ts` - discriminated unions
- `package.json` - build scripts
- `.eslintrc.json`, `.prettierrc.json` - созданы
- `README.md` - документация
- 95 тестов создано

## Команды для быстрого доступа

### Backend (PM2)
```bash
# Управление
pm2 start alauncher-backend    # Запустить
pm2 stop alauncher-backend     # Остановить
pm2 restart alauncher-backend  # Рестарт
pm2 logs alauncher-backend     # Логи
pm2 status                     # Статус

# Проверка API
curl https://api.alauncher.su/health

# Логи
tail -f /var/log/alauncher-backend-error.log
tail -f /var/log/alauncher-backend-out.log
```

### Frontend
```bash
cd /opt/ALauncher/packages/frontend
npm run tauri dev    # разработка
npm run tauri build  # сборка
```

### Shared
```bash
cd /opt/ALauncher/packages/shared
npm run test         # тесты
npm run build        # сборка
npm run lint         # проверка
```

### Nginx
```bash
sudo nginx -t        # тест конфига
sudo systemctl reload nginx  # перезагрузка
```

## Следующие шаги (при необходимости)

1. **Database Migration**
   ```bash
   cd /opt/ALauncher/packages/backend
   npx prisma db push
   ```

2. **Frontend Build Test**
   ```bash
   cd /opt/ALauncher/packages/frontend
   npm run tauri build
   ```

3. **Integration Testing**
   - Тест авторизации
   - Тест WebSocket
   - Тест API endpoints

## Важная информация

### Git
- Remote: https://github.com/JamieSchell/ALauncher
- Branch: main
- Последний коммит: Tauri migration

### Environment
- Node.js: v22.21.1
- Пользователь: root
- Рабочая директория: /opt/ALauncher

### VSCode Extensions
- `anthropic.claude-code` - официальный
- `agsoft.claude-history-viewer` - история чатов

## Примечания

- Backend работает через **PM2** с автозапуском
- PM2 конфиг: `/opt/ALauncher/packages/backend/ecosystem.config.js`
- Nginx конфигурация HTTPS-only (HTTP → HTTPS 301)
- CORS настроен только для `https://api.alauncher.su`
- Локальный/IP доступ отключен по требованию пользователя
