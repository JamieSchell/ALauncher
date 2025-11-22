# 🗺️ Modern Minecraft Launcher - Project Map

## 📁 Полная структура проекта

```
.
│
├── 📄 package.json                 # Root package (monorepo config)
├── 📄 README.md                    # Main documentation
├── 📄 QUICKSTART.md               # Quick start guide
├── 📄 FEATURES.md                 # Feature list
├── 📄 ARCHITECTURE.md             # Architecture docs
├── 📄 CONTRIBUTING.md             # Contributing guide
├── 📄 PROJECT_SUMMARY.md          # Project summary
├── 📄 PROJECT_MAP.md              # This file
├── 📄 LICENSE                     # GNU GPL v3
├── 📄 .gitignore                  # Git ignore rules
├── 📄 .env.example                # Environment template
│
├── 📦 packages/
│   │
│   ├── 🔧 backend/                # Node.js Backend Server
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 .env.example
│   │   │
│   │   ├── 📂 prisma/
│   │   │   └── 📄 schema.prisma   # Database schema
│   │   │
│   │   └── 📂 src/
│   │       ├── 📄 index.ts        # Main server entry
│   │       │
│   │       ├── 📂 config/
│   │       │   └── 📄 index.ts    # Configuration loader
│   │       │
│   │       ├── 📂 services/
│   │       │   ├── 📄 database.ts     # Prisma client
│   │       │   ├── 📄 crypto.ts       # RSA encryption
│   │       │   ├── 📄 auth.ts         # Authentication
│   │       │   ├── 📄 hasher.ts       # File integrity
│   │       │   └── 📄 serverPing.ts   # MC server ping
│   │       │
│   │       ├── 📂 routes/
│   │       │   ├── 📄 auth.ts         # Auth endpoints
│   │       │   ├── 📄 profiles.ts     # Profile endpoints
│   │       │   ├── 📄 updates.ts      # Update endpoints
│   │       │   ├── 📄 users.ts        # User endpoints
│   │       │   └── 📄 servers.ts      # Server status
│   │       │
│   │       ├── 📂 middleware/
│   │       │   ├── 📄 auth.ts         # JWT middleware
│   │       │   └── 📄 errorHandler.ts # Error handling
│   │       │
│   │       ├── 📂 websocket/
│   │       │   └── 📄 index.ts        # WebSocket server
│   │       │
│   │       └── 📂 utils/
│   │           └── 📄 logger.ts       # Logging utility
│   │
│   ├── 💻 frontend/               # Electron + React Frontend
│   │   ├── 📄 package.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 tsconfig.node.json
│   │   ├── 📄 vite.config.ts
│   │   ├── 📄 tailwind.config.js
│   │   ├── 📄 postcss.config.js
│   │   ├── 📄 index.html
│   │   ├── 📄 .env.example
│   │   │
│   │   ├── 📂 electron/
│   │   │   ├── 📄 main.ts         # Electron main process
│   │   │   └── 📄 preload.ts      # IPC bridge
│   │   │
│   │   └── 📂 src/
│   │       ├── 📄 main.tsx        # React entry point
│   │       ├── 📄 App.tsx         # Main App component
│   │       ├── 📄 index.css       # Global styles
│   │       │
│   │       ├── 📂 stores/
│   │       │   ├── 📄 authStore.ts      # Auth state (Zustand)
│   │       │   └── 📄 settingsStore.ts  # Settings state
│   │       │
│   │       ├── 📂 api/
│   │       │   ├── 📄 client.ts         # Axios client
│   │       │   ├── 📄 auth.ts           # Auth API
│   │       │   └── 📄 profiles.ts       # Profiles API
│   │       │
│   │       ├── 📂 components/
│   │       │   ├── 📄 Layout.tsx        # Main layout
│   │       │   ├── 📄 TitleBar.tsx      # Custom title bar
│   │       │   └── 📄 Sidebar.tsx       # Navigation sidebar
│   │       │
│   │       └── 📂 pages/
│   │           ├── 📄 LoginPage.tsx     # Login/Register
│   │           ├── 📄 HomePage.tsx      # Main launcher
│   │           └── 📄 SettingsPage.tsx  # Settings
│   │
│   └── 📚 shared/                 # Shared TypeScript Types
│       ├── 📄 package.json
│       ├── 📄 tsconfig.json
│       │
│       └── 📂 src/
│           ├── 📄 index.ts
│           ├── 📂 types/
│           │   └── 📄 index.ts    # Shared interfaces
│           └── 📂 utils/
│               └── 📄 index.ts    # Shared utilities
│
└── 📂 (Runtime directories - created on first run)
    ├── 📂 updates/                # Client files
    ├── 📂 profiles/               # Profile configs
    └── 📂 keys/                   # RSA keys (auto-generated)
```

## 🔍 Файлы по категориям

### 📘 Документация (6 файлов)
- `README.md` - Главная документация
- `QUICKSTART.md` - Быстрый старт
- `FEATURES.md` - Список возможностей
- `ARCHITECTURE.md` - Архитектура
- `CONTRIBUTING.md` - Гайд для разработчиков
- `PROJECT_SUMMARY.md` - Итоговый summary

### 🔧 Backend (15 файлов)
**Core:**
- `index.ts` - Main server
- `config/index.ts` - Configuration

**Services (5):**
- `database.ts` - Prisma
- `crypto.ts` - RSA
- `auth.ts` - Authentication
- `hasher.ts` - File integrity
- `serverPing.ts` - Server status

**Routes (5):**
- `auth.ts` - /api/auth
- `profiles.ts` - /api/profiles
- `updates.ts` - /api/updates
- `users.ts` - /api/users
- `servers.ts` - /api/servers

**Middleware (2):**
- `auth.ts` - JWT validation
- `errorHandler.ts` - Error handling

**WebSocket (1):**
- `websocket/index.ts` - Real-time

**Utils (1):**
- `logger.ts` - Logging

### 💻 Frontend (20 файлов)
**Electron (2):**
- `main.ts` - Main process
- `preload.ts` - IPC bridge

**Core (3):**
- `main.tsx` - Entry
- `App.tsx` - Root component
- `index.css` - Styles

**Stores (2):**
- `authStore.ts` - Auth state
- `settingsStore.ts` - Settings state

**API (3):**
- `client.ts` - Axios
- `auth.ts` - Auth API
- `profiles.ts` - Profiles API

**Components (3):**
- `Layout.tsx` - Layout
- `TitleBar.tsx` - Title bar
- `Sidebar.tsx` - Sidebar

**Pages (3):**
- `LoginPage.tsx` - Login
- `HomePage.tsx` - Main
- `SettingsPage.tsx` - Settings

**Config (4):**
- `vite.config.ts`
- `tailwind.config.js`
- `postcss.config.js`
- `tsconfig.json`

### 📚 Shared (3 файла)
- `types/index.ts` - TypeScript interfaces
- `utils/index.ts` - Shared utilities
- `index.ts` - Exports

## 📊 Статистика

```
Всего файлов: 60+
TypeScript: 35 файлов
Markdown: 7 документов
JSON configs: 9 файлов
CSS/Tailwind: 3 файла
Prisma: 1 schema

Строк кода: ~8,000+
```

## 🎯 Ключевые точки входа

1. **Запуск Backend:**
   ```
   packages/backend/src/index.ts
   → config/index.ts
   → routes/*
   → services/*
   ```

2. **Запуск Frontend:**
   ```
   packages/frontend/electron/main.ts
   → packages/frontend/src/main.tsx
   → App.tsx
   → pages/*
   ```

3. **Типы:**
   ```
   packages/shared/src/types/index.ts
   ```

## 🔄 Data Flow

```
User Action
    ↓
React Component
    ↓
API Call (axios)
    ↓
Backend Route
    ↓
Middleware (auth, validation)
    ↓
Service Layer
    ↓
Database (Prisma)
    ↓
Response
    ↓
React Query Cache
    ↓
Zustand Store (if needed)
    ↓
UI Update
```

## 🚀 Быстрая навигация

**Хочу изменить:**

- **UI компонент** → `packages/frontend/src/components/`
- **Страницу** → `packages/frontend/src/pages/`
- **API endpoint** → `packages/backend/src/routes/`
- **Бизнес-логику** → `packages/backend/src/services/`
- **Базу данных** → `packages/backend/prisma/schema.prisma`
- **Типы** → `packages/shared/src/types/index.ts`
- **Стили** → `packages/frontend/src/index.css` + Tailwind classes
- **Конфигурацию** → `.env` files

**Хочу добавить:**

- **Новый API endpoint** → Создать в `packages/backend/src/routes/`
- **Новую страницу** → Создать в `packages/frontend/src/pages/`
- **Новый компонент** → Создать в `packages/frontend/src/components/`
- **Новый сервис** → Создать в `packages/backend/src/services/`

## 🎓 Учебные примеры

**Как работает авторизация:**
```
frontend/pages/LoginPage.tsx
    → frontend/api/auth.ts
    → backend/routes/auth.ts
    → backend/services/auth.ts
    → backend/services/database.ts (Prisma)
```

**Как работает запуск игры:**
```
frontend/pages/HomePage.tsx
    → electron/main.ts (IPC)
    → spawn() Java process
    → pipe logs to frontend
```

**Как работает проверка файлов:**
```
backend/services/hasher.ts
    → hashDirectory()
    → compareDirs()
    → verify integrity
```

---

**Навигация упрощена! Код хорошо структурирован!** 🎯
