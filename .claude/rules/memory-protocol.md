# Протокол памяти ALauncher

## Обновление памяти между сессиями

### Обязательные действия после завершения работы

1. **Обновить `.claude/context/current-state.md`**
   - Добавить выполненные задачи
   - Обновить статус систем
   - Изменить дату последнего обновления

2. **Обновить `.claude/CLAUDE.md`** если:
   - Изменилась архитектура
   - Добавились новые компоненты
   - Изменились критичные конфигурации

3. **Сохранить в Git** (если пользователь попросил):
   ```bash
   git add .claude/
   git commit -m "docs: update Claude Code context"
   ```

## При начале новой сессии

### Чеклист

- [1] Прочитать `.claude/CLAUDE.md`
- [2] Прочитать `.claude/context/current-state.md`
- [3] Прочитать `.claude/rules/project-context.md`
- [4] Проверить статус backend (`curl https://api.alauncher.su/health`)
- [5] Проверить процесс backend (`ps aux | grep "node.*dist/index.js"`)

### Если контекст утерян

1. **Изучить последние коммиты:**
   ```bash
   git log --oneline -10
   git diff HEAD~1
   ```

2. **Проверить логи backend:**
   ```bash
   tail -50 /var/log/alauncher-backend.log
   ```

3. **Проверить Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

4. **Спросить пользователя** что было последним изменением

## Форматирование обновлений

### Добавление выполненной задачи в current-state.md

```markdown
### YYYY-MM-DD
1. ✅ Краткое описание задачи
   - Деталь 1
   - Деталь 2
2. ✅ Следующая задача
```

### Обновление статуса системы

```markdown
| Компонент | Статус | Детали |
|-----------|--------|--------|
| Backend | ✅/⚠️/❌ | Описание |
```

### Добавление проблемы

```markdown
## Текущие проблемы

### N. Название проблемы
- Описание
- **Решение:**
  ```bash
  команда
  ```
```

## Критичная информация (всегда актуально)

### Backend
- **Порт:** 7240
- **Env:** .env.prod (симлинк .env)
- **PID:** меняется при рестарте
- **Лог:** /var/log/alauncher-backend.log

### Frontend
- **Tauri v2** - Rust + React
- **Сборка:** npm run tauri build

### Database
- **Prisma** - ORM
- **Статус:** Connected, no tables

### Domain
- **api.alauncher.su** - HTTPS only
- **SSL:** Let's Encrypt
- **CORS:** only https://api.alauncher.su

## Сохранение состояния работы

### Если работа прервана

Создай заметку в `current-state.md`:

```markdown
## Работа в процессе (прервано YYYY-MM-DD)

### Задача: Название
**Статус:** В процессе
**Что сделано:**
- [x] Шаг 1
- [x] Шаг 2
- [ ] Шаг 3 (следующий)

**Следующие действия:**
1. Действие 1
2. Действие 2
```

### После восстановления работы

1. ✅ Прочитать заметку "Работа в процессе"
2. ✅ Продолжить с "Следующие действия"
3. ✅ Удалить заметку после завершения

## Сигнатуры изменений

### Backend changes
- Изменение `.env.prod`
- Изменение `prisma/schema.prisma`
- Изменение `src/routes/*`
- Migration базы

### Frontend changes
- Изменение `src-tauri/tauri.conf.json`
- Изменение `src/App.tsx`
- Новый компонент

### DevOps changes
- Изменение `/etc/nginx/sites-available/*`
- SSL certificate
- Systemd service

## Автоматическое обновление (если возможно)

### При коммите
Добавить в `.git/hooks/post-commit`:
```bash
# Обновить дату в current-state.md
sed -i "s/\*\*Последнее обновление:\*\* .*/\*\*Последнее обновление:\*\* $(date -u +%Y-%m-%d\ %H:%M\ UTC)/" .claude/context/current-state.md
```

## Резервное копирование контекста

### Перед массовыми изменениями
```bash
cp -r .claude .claude.backup.$(date +%Y%m%d)
```

### Восстановление
```bash
rm -rf .claude
cp -r .claude.backup.YYYYMMDD .claude
```

## Проверка целостности контекста

### Скрипт проверки
```bash
# Проверить наличие всех файлов
ls -la .claude/CLAUDE.md
ls -la .claude/rules/project-context.md
ls -la .claude/rules/memory-protocol.md
ls -la .claude/context/current-state.md
ls -la .claude/context/tech-stack.md
```

### Если файл отсутствует
1. Проверить `.claude.backup.*`
2. Восстановить из бэкапа
3. Или пересоздать из git history

## Интеграция с Claude Code History VSCode

Расширение `agsoft.claude-history-viewer` сохраняет историю сессий в:
```
~/.claude/projects/<project-id>/sessions/
```

Контекстные файлы в `.claude/` помогают:
- Быстро восстановить понимание проекта
- Понять что было сделано
- Продолжить прерванную работу
