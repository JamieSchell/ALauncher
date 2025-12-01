# Electron Security Configuration

## Security Settings

### Main Process (`main.ts`)

- **contextIsolation: true** - Изолирует preload скрипт от веб-контента
- **nodeIntegration: false** - Предотвращает доступ renderer процесса к Node.js API
- **sandbox: false** - Требуется для preload скриптов, но безопасность обеспечивается через contextIsolation
- **webSecurity: enabled in dev, disabled in prod** - Отключено в production для работы с file:// протоколом (безопасно благодаря contextIsolation)

### Preload Script (`preload.ts`)

- Использует `contextBridge` для безопасного IPC общения
- Экспонирует только типизированные API через `ElectronAPI` интерфейс
- Все API проверены на использование в кодовой базе
- Минимальная поверхность атаки - только необходимые методы

## Content Security Policy (CSP)

### Development Mode

- **unsafe-inline** и **unsafe-eval** разрешены для Vite HMR (Hot Module Replacement)
- Разрешены подключения к localhost для dev сервера

### Production Mode

- **unsafe-eval** УДАЛЕН из `script-src` и `default-src` (не нужен, т.к. Vite бандлит все скрипты)
- **unsafe-inline** УДАЛЕН из `script-src` (Vite бандлит все скрипты, можно использовать только `'self'`)
- **unsafe-inline** оставлен только для `style-src` (приемлемый компромисс для inline стилей в React)
- Разрешены только необходимые источники: API сервер, WebSocket сервер, data: и blob: для файлов

### CSP Configuration

CSP настраивается через Vite плагин `csp-replace.ts`, который:
- Читает `VITE_API_URL` и `VITE_WS_URL` из `.env`
- Генерирует CSP директивы на основе окружения
- Заменяет CSP meta tag в `index.html` при сборке

## API Surface Audit

Все API в `preload.ts` проверены на использование:

### Window Controls
- `minimizeWindow`, `maximizeWindow`, `minimizeToTray`, `closeWindow` - используются в TitleBar и LoginPage

### App Info
- `getAppVersion` - используется в errorLogger, TitleBar, useLauncherUpdate, LoginPage
- `getAppPaths` - используется в GameLogsModal
- `getUpdatesDir` - используется в ServerDetailsPage, HomePage

### Java Operations
- `findJavaInstallations` - используется в SettingsPage
- `selectJavaFile` - используется в SettingsPage
- `checkJavaVersion`, `getJavaVersion` - доступны для будущего использования

### Game Events
- Все listeners (`onGameLog`, `onGameError`, `onGameExit`, `onGameCrash`, `onGameConnectionIssue`) - используются в HomePage и ServerDetailsPage

### File Operations
- Все методы (`ensureDir`, `writeFile`, `deleteFile`, `readFile`, `calculateFileHash`, `downloadFile`, `fileExists`) - используются в ServerDetailsPage, HomePage, GameLogsModal

### Notifications
- `showNotification` - используется в NotificationCenter и notificationService

### HTTP Requests
- `httpRequest` - используется в api/client.ts для IPC прокси в production

### Launcher Updates
- Все методы обновлений - используются в useLauncherUpdate и LauncherUpdateModal

## Recommendations

1. **Не добавлять новые API без необходимости** - каждый новый API увеличивает поверхность атаки
2. **Использовать типы из `@modern-launcher/shared`** - обеспечивает консистентность и безопасность
3. **Регулярно проверять использование API** - удалять неиспользуемые методы
4. **Мониторить CSP в production** - убедиться, что нет ошибок CSP в консоли браузера

