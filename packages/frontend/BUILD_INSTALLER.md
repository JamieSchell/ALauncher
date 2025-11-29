# Сборка Windows установщика

## Исправления

### 1. Черный экран в portable версии
- ✅ Убрано автоматическое открытие DevTools в production
- ✅ Исправлены пути к файлам для portable версии
- ✅ Улучшена обработка путей для разных режимов сборки

### 2. Красивый NSIS установщик
- ✅ Добавлена иконка приложения (`build/icon.ico`)
- ✅ Настроен кастомный NSIS скрипт
- ✅ Добавлены иконки для установщика и деинсталлятора

## Сборка

### Portable версия (рекомендуется для Linux)
```bash
cd packages/frontend
npm run build:portable
```
Результат: `release/Modern Launcher-*-portable.exe`

### NSIS установщик
```bash
cd packages/frontend
npm run build:installer
```
Результат: `release/Modern Launcher-*-Setup.exe`

**Примечание:** NSIS установщик может иметь проблемы на Linux из-за особенностей NSIS uninstaller. В этом случае используйте portable версию или скрипт автоматически переключится на portable.

### Автоматическая сборка
```bash
./scripts/build-windows-installer.sh --auto-install
```

## Иконка

Иконка должна находиться в `build/icon.ico`. Если иконки нет, electron-builder использует стандартную иконку Electron.

## Проверка

После сборки проверьте:
1. Portable версия запускается без черного экрана
2. NSIS установщик устанавливает приложение корректно
3. Иконка отображается в установщике и ярлыках

