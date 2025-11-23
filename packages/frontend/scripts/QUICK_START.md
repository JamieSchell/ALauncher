# 🚀 Быстрый старт - Обновление лаунчера

## Windows (CMD/PowerShell)

### Способ 1: Одна строка (рекомендуется)

```cmd
npm run update-launcher -- --url https://0.0.0.0:7240/Modern%20Launcher-1.0.133-Setup.exe --auto-find
```

**Важно**: В URL замените пробелы на `%20` или используйте кавычки.

### Способ 2: С кавычками

```cmd
npm run update-launcher -- --url "https://0.0.0.0:7240/Modern Launcher-1.0.133-Setup.exe" --auto-find
```

### Способ 3: С заметками о релизе

```cmd
npm run update-launcher -- --url "https://0.0.0.0:7240/Modern Launcher-1.0.133-Setup.exe" --auto-find --release-notes "Версия 1.0.133: Исправлены баги"
```

### Способ 4: Прямой вызов node (если npm не работает)

```cmd
node scripts/update-launcher-full.js --url "https://0.0.0.0:7240/Modern Launcher-1.0.133-Setup.exe" --auto-find
```

## Примеры для вашего случая

### Базовое обновление
```cmd
npm run update-launcher -- --url "https://0.0.0.0:7240/Modern Launcher-1.0.133-Setup.exe" --auto-find
```

### С заметками
```cmd
npm run update-launcher -- --url "https://0.0.0.0:7240/Modern Launcher-1.0.133-Setup.exe" --auto-find --release-notes "Версия 1.0.133: Исправлены баги, улучшена производительность"
```

### Обязательное обновление
```cmd
npm run update-launcher -- --url "https://0.0.0.0:7240/Modern Launcher-1.0.133-Setup.exe" --auto-find --required
```

## Linux/Mac

```bash
npm run update-launcher -- \
  --url "https://example.com/launcher.exe" \
  --auto-find \
  --release-notes "Версия 1.0.133"
```

## Параметры

- `--url` - URL для скачивания (обязательно)
- `--auto-find` - автоматически найти файл в release/
- `--release-notes` - заметки о релизе
- `--required` - сделать обновление обязательным
- `--version` - указать версию (по умолчанию из package.json)
- `--file` - путь к файлу (если не используете --auto-find)

## Помощь

```cmd
node scripts/update-launcher-full.js --help
```

