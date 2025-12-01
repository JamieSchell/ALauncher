# Frontend Architecture

## Обзор

Frontend приложение построено на современном стеке технологий с акцентом на производительность, масштабируемость и удобство разработки.

## Технологический стек

### Основные технологии

- **React 19.2.0** - UI библиотека с поддержкой современных возможностей
- **TypeScript 5.9.3** - Полная типизация для надежности кода
- **Vite 7.2.4** - Быстрая сборка и HMR (Hot Module Replacement)
- **Electron 39.2.4** - Десктопное приложение с нативными возможностями
- **TailwindCSS 4.1.17** - Utility-first CSS фреймворк

### Управление состоянием

- **Zustand 5.0.8** - Легковесное управление состоянием для:
  - Авторизации (`authStore`)
  - Настроек (`settingsStore`)
  - Языка интерфейса (`languageStore`)
- **React Query 5.90.11** - Управление серверным состоянием, кеширование и синхронизация данных

### Роутинг и навигация

- **React Router 7.9.6** - Клиентская маршрутизация
- **Lazy loading** - Код-сплиттинг для оптимизации загрузки страниц

### Анимации и UI

- **Framer Motion 12.23.24** - Плавные анимации и переходы
- **Recharts 3.4.1** - Графики и визуализация данных
- **Lucide React 0.555.0** - Современные иконки

### HTTP и WebSocket

- **Axios 1.13.2** - HTTP клиент для API запросов
- **WebSocket (ws)** - Real-time обновления через WebSocket

## Структура проекта

```
packages/frontend/src/
├── api/                    # API клиенты (axios обёртки)
│   ├── auth.ts            # Авторизация
│   ├── users.ts           # Пользователи
│   ├── servers.ts         # Серверы
│   ├── profiles.ts        # Профили
│   ├── notifications.ts   # Уведомления
│   └── ...
│
├── components/            # React компоненты
│   ├── layout/            # Layout компоненты (Layout, TitleBar, Sidebar, Breadcrumbs)
│   ├── common/            # Общие переиспользуемые компоненты
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Toast.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ...
│   └── server/            # Компоненты для работы с серверами
│       ├── ServerCard.tsx
│       ├── ServerStatusChart.tsx
│       └── ...
│
├── pages/                 # Страницы приложения
│   ├── LoginPage.tsx
│   ├── HomePage.tsx
│   ├── SettingsPage.tsx
│   ├── ProfilePage.tsx
│   ├── StatisticsPage.tsx
│   └── ...
│
├── hooks/                 # Custom React hooks
│   ├── useTranslation.ts
│   ├── useLauncherUpdate.ts
│   ├── useOptimizedAnimation.ts
│   └── ...
│
├── stores/                # Zustand хранилища
│   ├── authStore.ts       # Состояние авторизации
│   ├── settingsStore.ts   # Настройки приложения
│   └── languageStore.ts   # Язык интерфейса
│
├── services/              # Сервисы (бизнес-логика)
│   ├── websocket.ts       # WebSocket клиент
│   ├── errorLogger.ts     # Логирование ошибок
│   └── ...
│
├── utils/                 # Утилиты
│   └── ...
│
├── config/                # Конфигурация
│   ├── api.ts             # API конфигурация (HTTP/WS URLs)
│   └── electron.ts        # Electron конфигурация
│
├── i18n/                  # Интернационализация
│   ├── index.ts
│   ├── locales/
│   │   ├── en.ts
│   │   └── ru.ts
│   └── ...
│
├── types/                 # TypeScript типы (локальные, не shared)
│   └── ...
│
├── App.tsx                # Главный компонент приложения
└── main.tsx               # Точка входа
```

## Архитектурные принципы

### 1. Разделение ответственности

- **Pages** - Организация маршрутов и высокоуровневая композиция
- **Components** - Переиспользуемые UI компоненты
- **Hooks** - Переиспользуемая логика
- **Stores** - Глобальное состояние приложения
- **Services** - Бизнес-логика и интеграции (WebSocket, внешние API)
- **API** - HTTP клиенты для backend API

### 2. Управление состоянием

#### Zustand (локальное состояние)
Используется для:
- Авторизации (токены, профиль пользователя)
- Настроек приложения (тема, язык)
- UI состояния (модальные окна, сайдбары)

#### React Query (серверное состояние)
Используется для:
- Данных с сервера (списки серверов, профили, статистика)
- Кеширования и автоматической синхронизации
- Оптимистичных обновлений

**Правило:** Не дублировать данные между Zustand и React Query без необходимости.

### 3. Layout компоненты

Layout компоненты вынесены в отдельный модуль `components/layout/` с четким API:

- **Layout** - Главный layout контейнер
- **TitleBar** - Кастомная панель заголовка окна
- **Sidebar** - Боковая навигация
- **Breadcrumbs** - Навигационные хлебные крошки

Все layout компоненты экспортируются из `components/layout/index.ts` для удобного импорта.

### 4. Код-сплиттинг

Все страницы загружаются лениво через `React.lazy()` для оптимизации начальной загрузки:

```typescript
const HomePage = lazy(() => import('./pages/HomePage'));
```

### 5. Типизация

- Используются типы из `@modern-launcher/shared` для контрактов API
- Локальные типы в `src/types/` только для внутренних нужд
- Все компоненты полностью типизированы

### 6. Стилизация

- **TailwindCSS** - Utility-first подход
- **Framer Motion** - Анимации и переходы
- **CSS переменные** - Для тем и кастомизации

## Потоки данных

### Авторизация
```
LoginPage → authAPI.login() → authStore.setAuth() → React Query invalidation
```

### Загрузка данных
```
Page → useQuery() → API client → Backend → React Query cache → Component render
```

### Real-time обновления
```
WebSocket message → websocket service → React Query mutation → UI update
```

### Обработка ошибок
```
Error → errorLogger service → Backend API → Logged in database
```

## Best Practices

### Компоненты
- Используйте функциональные компоненты с хуками
- Разбивайте большие компоненты на меньшие
- Используйте `memo`, `useMemo`, `useCallback` для оптимизации
- Следуйте принципу единственной ответственности

### Хуки
- Создавайте переиспользуемые custom hooks
- Используйте `useOptimizedAnimation` для анимаций
- Используйте `useTranslation` для интернационализации

### API запросы
- Всегда используйте React Query для серверных данных
- Создавайте custom hooks для каждого API endpoint
- Используйте правильные query keys для кеширования

### Стили
- Используйте TailwindCSS классы вместо inline стилей
- Создавайте переиспользуемые компоненты вместо дублирования стилей
- Используйте CSS переменные для тем

## Производительность

### Оптимизации
- Lazy loading страниц
- React Query кеширование
- Мемоизация компонентов (`memo`, `useMemo`, `useCallback`)
- Виртуализация длинных списков (при необходимости)
- Оптимизация анимаций через `useOptimizedAnimation`

### Мониторинг
- Используйте React DevTools Profiler
- Отслеживайте размер бандлов
- Мониторьте производительность WebSocket соединений

## Безопасность

- **Context Isolation** - Electron использует context isolation
- **Preload скрипты** - Безопасный мост между main и renderer процессами
- **CSP** - Content Security Policy настроен через Vite
- **Валидация** - Все данные валидируются на backend

## Тестирование

- Unit тесты для утилит и хуков (планируется)
- Integration тесты для API клиентов (планируется)
- E2E тесты для критичных флоу (планируется)

## Дополнительные ресурсы

- [React Documentation](https://react.dev/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)

