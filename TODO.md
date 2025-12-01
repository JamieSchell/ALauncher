## Global Refactoring Roadmap

- **Goal**: Привести кодовую базу `modern-minecraft-launcher` к уровню промышленного продакшн‑качества: единый стиль, прозрачная архитектура, предсказуемое поведение, максимальная простота сопровождения и развития.
- **Scope**: Монорепозиторий `packages/backend`, `packages/frontend`, `packages/shared`, инфраструктурные скрипты и конфиги.

---

## 1. Архитектура монорепозитория

- **1.1. Стандартизация скриптов и воркспейсов**
  - [x] Проверить и выровнять `scripts` во всех `package.json` (root, `backend`, `frontend`, `shared`) по единому неймингу: `dev`, `build`, `test`, `lint`, `typecheck`, `format`.
  - [x] Удалить/задепрекейтить устаревшие команды (`dev:old`, `*:old`), добавить явное описание в `README.md`.
  - [x] Ввести единый способ запуска окружения разработки (одна команда в корне, например `npm run dev`).

- **1.2. Общие типы и утилиты (`packages/shared`)**
  - [x] Провести аудит типов и DTO в `packages/shared`:
    - [x] Убедиться, что все публичные API backend используют типы из `shared` там, где они уже предусмотрены (auth, profiles, updates, notifications).
    - [x] Удалить мёртвые/неиспользуемые типы (`ServerConfig`, `LaunchParams`).
  - [x] Вынести общие константы (enum'ы, error codes, feature flags) из backend/frontend в `shared` (базовый слой): добавить `ErrorCodeV1` и `ApiResponseV1` для API‑ошибок.
  - [x] Ввести версионирование контрактов (например, `v1`, `v2` пространства имён для API‑моделей, если потребуется) — создан базовый набор типов `ApiResponseV1`/`ApiErrorV1`/`ErrorCodeV1` без ломающих изменений существующих ответов.

- **1.3. Конфигурация окружений**
  - [x] Описать единый формат `.env` для backend и frontend (dev/prod) с разделением по файлам (`.env.development`, `.env.production`).
  - [x] Задокументировать переменные среды в `README.md` (таблица: имя, пример, обязательность, описание).
  - [x] Вынести конфигурацию в централизованные модули:
    - [x] Backend: `config/index.ts` как единственный источник правды для чтения `process.env`.
    - [x] Frontend: `src/config/api.ts` и `src/config/electron.ts` как типизированные обёртки над `import.meta.env` / `.env` для React и Electron.

---

## 2. Backend (`packages/backend`)

- **2.1. Структура проекта и слои**
  - [x] Пересмотреть структуру директорий: `routes`, `services`, `websocket`, `middleware`, `config`, `utils`, `cli` — зафиксировать слои в `packages/backend/BACKEND_ARCHITECTURE.md`.
  - [x] Явно ввести слои на уровне документации и договорённостей:
    - [x] **Transport** (Express routes, WebSocket handlers, CLI).
    - [x] **Application/Service** (use‑case логика в `services/*`).
    - [x] **Infrastructure** (БД, внешние API, файловая система, крипто, логирование).
  - [x] Разорвать циклические зависимости, если есть (через аудит импортов) — по результатам поиска импортов циклы между слоями не обнаружены.

- **2.2. HTTP API**
  - [x] Составить сводную таблицу маршрутов (`/api/auth`, `/api/profiles`, `/api/updates`, `/api/users`, `/api/servers`, `/api/client-versions`, `/api/crashes`, `/api/statistics`, `/api/notifications`, `/api/launcher`):
    - [x] Метод, путь, базовый входной контракт, успешный ответ (см. `packages/backend/BACKEND_API_ROUTES.md`).
  - [x] Ввести единый формат ответа API (v1-уровень для ошибок) без ломающих изменений:
    - [x] Успех: базовый формат `{ success: true, data, ... }` сохранён во всех маршрутах.
    - [x] Ошибка: добавлено типизированное поле `errorCode` (см. `ErrorCodeV1` в `@modern-launcher/shared`) во все ответы через `errorHandler`.
  - [x] Стандартизировать коды HTTP‑ответов (2xx, 4xx, 5xx) и убрать «магические» значения на уровне ошибок:
    - [x] Все ошибки, проходящие через `AppError`/`errorHandler`, теперь маппятся в `ErrorCodeV1` по статусу (`400/401/403/404/429/5xx`).
  - [x] Добавить централизованную валидацию входных данных (например, `zod`/`joi`/`yup`) с типизацией:
    - [x] Добавлен модуль `src/validation/index.ts` с универсальным middleware `validate(schema, part)` на базе `zod`.
    - [x] Критичные маршруты `/api/auth/login` и `/api/auth/register` переведены на Zod‑валидацию; `express-validator` постепенно будет убран из остальных роутов по мере рефакторинга.

- **2.3. Ошибки и логирование**
  - [x] Ввести иерархию доменных ошибок (например, `AppError` с кодами `AUTH_ERROR`, `VALIDATION_ERROR`, `NOT_FOUND`, `RATE_LIMITED` и т.д.):
    - [x] Расширен `AppError` полем `code?: ErrorCodeV1`, а `errorHandler` маппит статусы в `ErrorCodeV1` либо использует доменный код, если он задан.
  - [x] Переподключить все места `throw new Error(...)` на типизированные ошибки в доменных сценариях:
    - [x] Пример: `statistics.endGameSession` теперь кидает `new AppError(404, 'Session not found')`, а остальные `new Error(...)` оставлены для внутренних/технических ошибок, обрабатываемых как `INTERNAL_ERROR`.
  - [x] Проверить `errorHandler` middleware:
    - [x] Стек‑трейсы и подробности ошибки не отправляются клиенту, но логируются в БД (`launcherError`) и консоль только для 5xx.
    - [x] Логируется контекст (route, method, userId, username, userAgent, url, statusCode, launcherVersion).
  - [x] Стандартизировать логер (`utils/logger.ts`):
    - [x] Фиксированы уровни `debug`, `info`, `warn`, `error` с единым текстовым префиксом `[timestamp][LEVEL]`, уровень читается из `config.logging.level`.

- **2.4. WebSocket**
  - [x] Аудит `websocket/index.ts`: протокол сообщений, авторизация, повторные подключения.
  - [x] Описать контракты WS‑сообщений (тип события, payload) в `shared` — `WSEvent`, `UpdateProgress`, `LaunchStatus`, `ClientFilesUpdate` в `@modern-launcher/shared`.
  - [x] Добавить heartbeat/ping‑pong и обработку деградации соединения: реализован таймер, который шлёт `ping` всем клиентам, отслеживает `pong` и завершает "мертвые" соединения с логированием.

- **2.5. База данных и сервисы**
  - [x] Проверить `services/database.ts`:
    - [x] Типизация подключения (экспортирован типизированный `prisma: PrismaClient`).
    - [x] Реконнект, таймауты, пул коннекшенов (добавлен `initializeDatabase` с retry-логикой, `checkDatabaseHealth`, `withRetryTransaction` для обработки временных сбоев соединения).
  - [x] Для каждого сервиса (`clientVersionService`, `downloadService`, `assetDownloadService`, `statistics`, `notificationService`, `auth` и др.):
    - [x] Разделить pure‑логику и побочные эффекты (добавлены JSDoc комментарии, явно указаны pure функции и функции с side effects в `AuthService`, `ClientVersionService`, `NotificationService`).
    - [x] Добавить JSDoc/TSDoc к публичным методам (добавлена подробная документация с `@param`, `@returns`, `@example` для всех публичных методов в `AuthService`, `ClientVersionService`, `NotificationService`, `database.ts`).
    - [x] Убрать дублирование кода (общие хелперы в `utils`): создан `utils/file.ts` с `fileExists`, `calculateFileHash`, `calculateBufferHash`; `crypto.ts` теперь использует общий `fileExists` из utils.

- **2.6. Безопасность**
  - [x] Перепроверить `helmet` конфигурацию, особенно в связке с Electron:
    - [x] Оставлен `helmet` с `crossOriginResourcePolicy: "cross-origin"` и отключённым CSP (CSP управляется на уровне Electron/Vite).
  - [x] Аудит CORS:
    - [x] Подтвердить список разрешённых origin'ов (формируется из `CORS_ORIGIN` + локальные dev-оригины в `index.ts`).
    - [x] Убедиться, что `*` не используется в продакшене без строгого контроля: wildcard теперь игнорируется при `NODE_ENV=production` (`allowAllOrigins` активен только в dev), для `/uploads` в продакшене выставляется `Access-Control-Allow-Origin` только для origin'ов из whitelist.
  - [x] Проверить авторизацию для всех маршрутов (в т.ч. статистика, краши, уведомления) — роуты `statistics`, `crashes`, `notifications`, а также пользовательские (`/api/users/*`) защищены через `authenticateToken` / `requireAdmin`.
  - [x] Пересмотреть логику работы с файлами (skins/cloaks):
    - [x] Проверка типа, размера (multer `fileFilter` и `limits.fileSize` для skin/cloak в `routes/users.ts`).
    - [x] Безопасная выдача через `express.static` + заголовки (`/uploads` в `index.ts` с `Cross-Origin-Resource-Policy: cross-origin`, явным CORS для GET/OPTIONS и типами контента для `.png`/`.gif`).

- **2.7. Завершение работы сервера**
  - [x] Аудит `gracefulShutdown`:
    - [x] Гарантированное завершение всех async‑операций (WebSocket, БД, file watchers): реализован последовательный shutdown с обработкой ошибок для каждого компонента (HTTP server → WebSocket → File watcher → Database).
    - [x] Логирование любых ошибок при остановке: добавлено детальное логирование каждого шага shutdown через `logger`, сбор ошибок в массив `shutdownErrors` с выводом итогового отчёта; таймаут увеличен до 15 секунд для более надёжного завершения.
  - [ ] Добавить unit‑тесты для сценариев SIGINT/SIGTERM (по возможности): требует настройки тестового окружения для эмуляции сигналов процесса; может быть добавлено позже при настройке тестовой инфраструктуры.

---

## 3. Frontend (`packages/frontend`)

- **3.1. Архитектура приложения**
  - [x] Зафиксировать архитектурный подход: React + Vite + Electron, Zustand/Jotai‑подобные сторы, React Query — создан `FRONTEND_ARCHITECTURE.md` с полным описанием технологического стека, принципов архитектуры и best practices.
  - [x] Стандартизировать структуру `src`:
    - [x] `components`, `pages`, `hooks`, `stores`, `api`, `config`, `services`, `utils`, `i18n` — структура соответствует стандарту, задокументирована в `FRONTEND_ARCHITECTURE.md`.
  - [x] Вынести общие layout‑элементы (`Layout`, `TitleBar`, `Sidebar`, `Breadcrumbs`) в модуль с чётким API — все layout компоненты перемещены в `components/layout/` с централизованным экспортом через `index.ts`, обновлены импорты в `App.tsx`.

- **3.2. Роутинг и доступы**
  - [x] Оформить защищённые роуты как переиспользуемые компоненты (`ProtectedRoute`, `AdminRoute`): созданы компоненты в `components/routing/` с JSDoc документацией, поддержкой loading состояний и настраиваемыми redirect путями.
  - [x] Вынести описание роутов в конфигурацию (массива/карта), чтобы не дублировать логику в `App.tsx`: создан `config/routes.ts` с массивом `RouteConfig`, функцией `wrapRouteComponent()` для автоматической обёртки компонентов, `App.tsx` теперь генерирует Routes из конфигурации через `routes.map()`.
  - [x] Проверить редиректы (`/admin` → `/admin/profiles`, `/server` → `/`) и ошибки 404: редиректы настроены в конфигурации роутов через `redirectTo`, создана страница `NotFoundPage.tsx` для обработки 404 ошибок, добавлен catch-all route `path="*"` в `App.tsx`.

- **3.3. Состояние и React Query**
  - [x] Аудит `stores/*` (authStore, settingsStore, languageStore): добавлены JSDoc комментарии с описанием типов, методов и назначения каждого store, проверено отсутствие бизнес-логики в компонентах (логика находится в API слое).
  - [x] Стандартизировать использование React Query:
    - [x] Единый клиент с политиками кеширования: создан `config/queryClient.ts` с настройками staleTime (30s), gcTime (5min), retry стратегиями, обновлен `main.tsx` для использования единого QueryClient.
    - [x] Custom hooks для всех API‑запросов: созданы hooks в `hooks/api/` (useProfiles, useUsers, useStatistics, useNotifications, useServers, useCrashes) с типизированными query keys, автоматической инвалидацией кеша при мутациях, централизованным экспортом через `hooks/api/index.ts`.
  - [x] Убрать дублирующийся стейт: рефакторены компоненты (HomePage, ProfilesManagementPage, StatisticsPage, ServerDetailsPage, NotificationCenter, Sidebar) для использования custom hooks вместо прямых useQuery, удалены дублирующиеся query keys и queryFn, проверено отсутствие дублирования между React Query и stores (stores используются только для UI состояния, React Query для серверных данных).

- **3.4. UI‑компоненты и дизайн‑система**
  - [x] Выделить базовые компоненты: созданы компоненты в `components/ui/` (`Button`, `Input`, `Modal`, `Card`, `Table`, `Tabs`), проверены существующие компоненты (`Toast`, `ProgressBar`, `Skeleton`, `LoadingSpinner`, `Container`), все компоненты используют единую дизайн-систему.
  - [x] Ввести единый набор Tailwind‑классов/пресетов: создан `styles/design-system.ts` с пресетами для всех компонентов (buttonVariants, inputVariants, cardVariants, modal styles, table styles, tabs styles), централизованные spacing, borderRadius, shadows пресеты, функция `cn()` для объединения классов.
  - [x] Перепроверить компоненты статистики (`ServerStatusChart`, `PlayersChart`):
    - [x] Ресайз/адаптивность: `ServerStatusChart` использует `ResponsiveContainer` с адаптивными min-height (300px на мобильных, 400px на десктопе), `PlayersChart` адаптивен по умолчанию, оба компонента корректно работают на всех размерах экрана.
    - [x] Производительность: добавлена мемоизация через `useMemo` для форматирования данных и вычислений в обоих компонентах, `ServerStatusChart` использует `useServerStatistics` hook с кешированием вместо прямых API вызовов, `CustomTooltip` мемоизирован через `useCallback`, оптимизированы вычисления `maxYValue` и `yAxisTicks` в `ServerStatusChart`, оптимизированы вычисления `percentage`, `circumference`, `offset` в `PlayersChart`.

- **3.5. UX и перформанс**
  - [x] Использовать `useReducedMotion`, `useOptimizedAnimation`, `useVirtualizedList`: применен `useOptimizedAnimation` в компонентах с анимациями (`Button`, `Card`, `Modal`, `CrashesList`, `ConnectionIssuesList`), `useReducedMotion` используется внутри `useOptimizedAnimation` для учета пользовательских предпочтений, `useVirtualizedList` hook существует и готов к использованию для больших списков (288+ элементов), все motion компоненты проверяют `shouldAnimate` перед применением анимаций.
  - [x] Проверить ленивую загрузку страниц: все страницы загружаются через `lazy()` в `config/routes.ts`, все маршруты обернуты в `Suspense` с `LoadingSpinner` fallback, каждый маршрут имеет свой `loadingMessage` для лучшего UX, исправлен fallback для NotFoundPage в `App.tsx` (заменен `<div>Loading...</div>` на `<LoadingSpinner fullScreen message="Loading page..." />`).
  - [x] Минимизировать количество лишних ререндеров: добавлен `React.memo` для `CrashesList` и `ConnectionIssuesList` компонентов, созданы мемоизированные компоненты `CrashItem` и `ConnectionIssueItem` для оптимизации рендеринга списков, применен `useCallback` для обработчиков событий в `CrashesManagementPage`, применен `useMemo` для форматирования данных в `ServerStatusChart` и `PlayersChart`, все компоненты используют `useOptimizedAnimation` для условного рендеринга анимаций.

- **3.6. I18n**
  - [x] Аудит `i18n/index.ts`, `locales/en.ts`, `locales/ru.ts`:
    - [x] Все ключи типизированы: создан `i18n/types.ts` с типом `TranslationKey` на основе рекурсивного извлечения ключей из структуры переводов, тип `TranslationKey` используется в `getTranslation()` и `useTranslation()` hook, добавлена функция `validateTranslationStructures()` для автоматической проверки соответствия структур en.ts и ru.ts в development режиме.
    - [x] Удалить неиспользуемые ключи, выровнять структуры: структуры en.ts и ru.ts проверены на соответствие через TypeScript типы, добавлена валидация структур при загрузке модуля в development режиме, все ключи в обоих файлах совпадают (351 строка в каждом файле, идентичная структура).
  - [x] Перепроверить `LanguageSwitcher` и границы языка: `LanguageSwitcher` использует `useLanguageStore` с persist через localStorage (проверено), созданы утилиты для локализации дат/чисел (`utils/formatDate.ts`, `utils/formatNumber.ts`), созданы hooks `useFormatDate()` и `useFormatNumber()` для использования в компонентах, обновлены компоненты (`NotificationCenter`, `StatisticsPage`, `ProfilePage`, `ServerDetailsPage`, `CrashesManagementPage`) для использования локализованного форматирования дат и чисел, все `toLocaleDateString`/`toLocaleString` заменены на использование hooks с учетом текущего языка.

- **3.7. Ошибки и мониторинг**
  - [x] Централизовать работу `errorLogger`:
    - [x] Единый метод для логирования UI‑ошибок и ошибок API: улучшен `ErrorLoggerService` с методами `logApiError()` и `logUIError()` для единообразного логирования UI и API ошибок.
    - [x] Логирование в backend через отдельный endpoint: интегрирован `ErrorLoggerService` в API interceptor (`api/client.ts`) для автоматического логирования API ошибок через существующий endpoint `/crashes/launcher-errors`, пропускаются только 401 и 404 ошибки для избежания спама.
  - [x] Покрыть пользовательским фидбеком основные ошибки (toasts, error boundaries, fallback UI): создан `ErrorBoundary` компонент с fallback UI, создан `ToastProvider` для глобального управления toasts, интегрированы в `main.tsx` и `App.tsx`, добавлен показ toasts для критичных ошибок в глобальных обработчиках ошибок (`unhandledError`, `unhandledRejection`).

---

## 4. Electron интеграция (`packages/frontend/electron`)

- **4.1. Архитектура main/preload**
  - [x] Аудит `main.ts` и `preload.ts`:
    - [x] Минимум логики в `preload`, только безопасный мост (`contextIsolation`, `ipcRenderer`/`ipcMain`): `preload.ts` содержит только типизированные обёртки над IPC вызовами через `contextBridge`, вся бизнес-логика находится в `main.ts`, добавлены комментарии о безопасности.
    - [x] Отключение/ограничение `nodeIntegration` в рендерере: проверено, что `nodeIntegration: false` и `contextIsolation: true` установлены в `main.ts` (строки 287-288), добавлены комментарии о безопасности.
  - [x] Типизировать канал общения между Electron и React:
    - [x] Описать каналы и payload'ы в `shared`: создан файл `packages/shared/src/types/electron.ts` с полной типизацией всех IPC каналов и payload'ов (`ElectronAPI`, `LaunchGameArgs`, `GameCrashData`, `UpdateInfo` и др.), обновлены `preload.ts` и `main.ts` для использования типов из `shared`, обновлен `packages/frontend/src/types/electron.d.ts` для использования `ElectronAPI` из `shared`.

- **4.2. Безопасность**
  - [x] Проверить CSP (Vite‑плагин `csp-replace`) и убедиться, что в финальной сборке нет лишнего `unsafe-inline`/`unsafe-eval`, кроме строго необходимого: оптимизирован CSP плагин - в production убран `unsafe-eval` из `script-src` и `default-src` (он нужен только для dev HMR), убран `unsafe-inline` из `script-src` в production (Vite бандлит все скрипты, можно использовать только `'self'`), `unsafe-inline` оставлен только для `style-src` (приемлемый компромисс для inline стилей в React), добавлены комментарии о причинах использования каждого директивы.
  - [x] Минимизировать доступные в `preload` API до нужного минимума: проведен аудит всех API в `preload.ts` - все 30+ методов активно используются в кодовой базе (проверено через grep по всем файлам), добавлены комментарии в `preload.ts` с указанием, где используется каждый API, все API необходимы для функциональности лаунчера (оконные операции, запуск игры, файловые операции, обновления, уведомления).

---

## 5. Качество кода

- **5.1. Линтинг и форматирование**
  - [x] Единый ESLint/TS config для всех пакетов (с общим базовым конфигом): создан `.eslintrc.base.js` с общими правилами, созданы конфиги для frontend (с React правилами), backend и shared, все конфиги расширяют базовый.
  - [x] Настроить Prettier (или форматтер VSCode) и добавить команду `format`: создан `.prettierrc.js` с единым стилем форматирования, создан `.prettierignore`, добавлены команды `format` и `format:check` во все package.json, настроен единый стиль (single quotes, semicolons, 100 символов на строку).
  - [x] Подключить линтер в pre‑commit hook (Husky/lefthook): создан `.husky/pre-commit` hook, настроен `lint-staged` с конфигом `.lintstagedrc.js`, добавлены зависимости husky и lint-staged в корневой package.json, создан файл `SETUP_QUALITY.md` с инструкциями по установке и использованию.

---

## 6. DevOps и сборка

- **6.1. Сборка и деплой**
  - [x] Стандартизировать сборку:
    - [x] Frontend: `vite build` - используется стандартная команда `npm run build` с Vite, настроена в package.json.
    - [x] Backend: `tsc`/bundler (esbuild/tsup) с отдельной настройкой для prod - используется `tsc` для компиляции TypeScript, можно расширить до bundler при необходимости, настроен в package.json.
    - [x] Electron: `electron-builder` с описанными таргетами - настроен в package.json с конфигурацией для Windows (portable), Linux (AppImage, deb), macOS (dmg, zip).
  - [x] Проверить `scripts/*` (`run-script.js`, скрипты обновления лаунчера) на:
    - [x] Обработку ошибок: добавлена обработка ошибок во все скрипты с try-catch, правильными exit codes, обработкой сигналов, таймаутами для подключений к БД.
    - [x] Логирование: создан `scripts/utils.sh` с функциями логирования (log_info, log_success, log_warning, log_error), структурированное логирование во всех скриптах, цветной вывод для лучшей читаемости.
    - [x] Отсутствие хардкодов путей/URL: создан `scripts/config.example.sh` для конфигурации, все хардкоды IP адресов (5.188.119.206) заменены на переменные окружения (PROD_API_HOST, PROD_API_PORT, PROD_API_URL, PROD_WS_URL), хардкоды путей к БД заменены на переменную DATABASE_URL, скрипты используют `load_config()` для загрузки конфигурации, добавлен `scripts/config.sh` в .gitignore для безопасности.

- **6.2. CI/CD**
  - [x] Добавить/обновить CI:
    - [x] Установка зависимостей + кеширование: создан `.github/workflows/ci.yml` с использованием `actions/setup-node@v4` и `cache: 'npm'` для автоматического кеширования node_modules, кеш работает на основе package-lock.json.
    - [x] `lint`, `test`, `build` для всех пакетов: создан основной CI workflow с отдельными jobs для lint-and-format (ESLint, Prettier, TypeScript), test (запуск тестов), build (сборка всех пакетов), build-matrix (параллельная сборка пакетов на разных OS), все проверки выполняются при push и pull_request.
  - [x] Добавить артефакты сборки лаунчера (инсталляторы/архивы): создан `.github/workflows/build-electron.yml` для сборки Electron приложения на Windows, Linux, macOS, артефакты загружаются через `actions/upload-artifact@v4` с retention 30-90 дней, создан workflow для автоматического создания GitHub Release при тегах v*, создан `.github/workflows/pr-checks.yml` для проверки качества PR с комментариями о результатах.

---

## 7. Документация

- **7.1. Техническая документация**
  - [x] Обновить `README.md`:
    - [x] Описание архитектуры (backend, frontend, Electron): добавлены архитектурные принципы, детальное описание компонентов системы, описание потоков данных, улучшена структура описания пакетов с пояснениями назначения каждой директории.
    - [x] Инструкция по запуску dev/prod: добавлены разделы для development и production режимов с объяснением что происходит при запуске, добавлены важные замечания для production, улучшены примеры команд.
    - [x] Описание структуры `packages/*`: детализирована структура всех трех пакетов (frontend, backend, shared) с пояснениями назначения каждой директории и файла, добавлены комментарии о роли каждого компонента.
  - [x] Добавить ADR‑документы (Architecture Decision Records) для ключевых решений:
    - [x] Почему Electron + React + Vite: создан `docs/adr/001-electron-react-vite.md` с анализом альтернатив, обоснованием выбора, последствиями и митигацией рисков.
    - [x] Почему выбран конкретный ORM/подход к БД: создан `docs/adr/002-prisma-orm.md` с сравнением Prisma, TypeORM, Sequelize и raw SQL, обоснованием выбора Prisma, описанием последствий.
    - [x] Стратегия обновлений лаунчера: создан `docs/adr/003-launcher-update-strategy.md` с анализом различных подходов к обновлениям, описанием выбранной стратегии, компонентами системы и будущими улучшениями.

- **7.2. Для разработчиков**
  - [x] Добавить `CONTRIBUTING.md`:
    - [x] Code style: добавлены разделы по TypeScript, React, именованию, форматированию (Prettier), линтингу (ESLint) с примерами хорошего и плохого кода.
    - [x] Git‑флоу (ветки, PR, ревью): описана система веток (main, develop, feature/*, fix/*), формат коммитов (conventional commits), процесс создания PR с чеклистом, процесс review.
    - [x] Требования к тестам и документации для новых фич: описаны когда писать тесты, типы тестов с примерами, требования к обновлению документации, формат JSDoc комментариев.

---

## 8. Приоритизация (предложение)

- **P0 – Критично**
  - [x] Безопасность (CORS, helmet, upload, Electron bridge): CORS настроен с поддержкой Electron file:// протокола, Helmet используется для защиты заголовков, Multer настроен для безопасной загрузки файлов с валидацией типов и размеров, Electron bridge безопасен (contextIsolation: true, nodeIntegration: false, минимальный API в preload), CSP оптимизирован для production (убраны unsafe-eval, минимизирован unsafe-inline).
  - [x] Централизованная обработка ошибок backend/frontend: Backend - errorHandler middleware с логированием в БД, автоматической обработкой AppError и неожиданных ошибок, Frontend - ErrorLoggerService для централизованного логирования UI и API ошибок, ErrorBoundary для отлова React ошибок, глобальные обработчики (window.addEventListener('error'), unhandledrejection), интеграция с API interceptor для автоматического логирования API ошибок.
  - [x] Стандартизация API‑контрактов и auth‑флоу: Все API типы определены в `@modern-launcher/shared` (ApiResponse, AuthRequest, AuthResponse, и др.), стандартизированный auth flow с JWT токенами (accessToken + refreshToken), единые типы для всех API endpoints, типизированные Electron IPC каналы через shared типы.

- **P1 – Высокий приоритет**
  - [x] Архитектура слоёв backend: Создан `BACKEND_ARCHITECTURE.md` с описанием слоев (Transport, Application, Infrastructure), определены правила зависимостей между слоями, структура соответствует архитектурным принципам.
  - [x] Структура frontend и общие UI‑компоненты: Создан `FRONTEND_ARCHITECTURE.md` с описанием структуры, созданы общие UI компоненты в `components/ui/` (Button, Input, Modal, Card, Table, Tabs), компоненты используют единую дизайн-систему, есть layout компоненты (Layout, Sidebar, TitleBar), переиспользуемые компоненты (LoadingSpinner, ProgressBar, Toast, ErrorBoundary).
  - [x] Линтеры, форматирование, базовые тесты: Настроены ESLint с базовым конфигом и расширениями для React, настроен Prettier с единым стилем форматирования, настроен pre-commit hook (Husky + lint-staged), добавлены команды lint, format, format:check во все пакеты, базовые тесты не настроены (по требованию пользователя - тесты убраны из приоритетов).

- **P2 – Средний приоритет**
  - [x] Оптимизации перформанса (виртуализация, мемоизация): Используется React.memo, useMemo, useCallback в компонентах (31 использование в 10 файлах), создан useVirtualizedList hook для виртуализации длинных списков, создан useOptimizedAnimation hook для оптимизации анимаций, мемоизация вычислений в ServerStatusChart и других компонентах, React Query для кеширования серверных данных, lazy loading страниц для code splitting.
  - [x] Детальная документация и ADR: Созданы ADR документы (001-electron-react-vite, 002-prisma-orm, 003-launcher-update-strategy), обновлен README.md с детальным описанием архитектуры, создан CONTRIBUTING.md с руководством для разработчиков, создана документация по сборке (BUILD.md), создана документация по качеству кода (SETUP_QUALITY.md), обновлены архитектурные документы (FRONTEND_ARCHITECTURE.md, BACKEND_ARCHITECTURE.md).


