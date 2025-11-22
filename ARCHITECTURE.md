# 🏗️ Архитектура Modern Minecraft Launcher

## 📐 Общая структура

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                       │
│              (Electron + React + Vite)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Renderer  │  │  Main Process │  │   Preload    │  │
│  │   Process   │◄─┤   (Electron)  │◄─┤    Script    │  │
│  │   (React)   │  │               │  │              │  │
│  └──────┬──────┘  └───────┬───────┘  └──────────────┘  │
│         │                 │                             │
│         │ HTTP/WS         │ Child Process               │
│         ▼                 ▼                             │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  REST API    │  │  Minecraft   │                    │
│  │  WebSocket   │  │   Client     │                    │
│  └──────┬───────┘  └──────────────┘                    │
└─────────┼──────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend Server                        │
│              (Node.js + Express + WS)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐           │
│  │  Routes  │  │ Services │  │ Middleware │           │
│  │          │─►│          │◄─│            │           │
│  └──────────┘  └────┬─────┘  └────────────┘           │
│                     │                                   │
│                     ▼                                   │
│              ┌────────────┐                             │
│              │   Prisma   │                             │
│              │    ORM     │                             │
│              └──────┬─────┘                             │
└─────────────────────┼───────────────────────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │  PostgreSQL  │
              │   Database   │
              └──────────────┘
```

## 🎯 Frontend Architecture

### Component Hierarchy

```
App
├── Router
│   ├── LoginPage
│   └── Layout
│       ├── TitleBar
│       ├── Sidebar
│       └── Content
│           ├── HomePage
│           │   ├── ProfileCard []
│           │   └── LaunchButton
│           └── SettingsPage
│               └── SettingsForm
```

### State Management (Zustand)

```typescript
// Auth Store
interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  playerProfile: PlayerProfile | null
  setAuth()
  clearAuth()
}

// Settings Store
interface SettingsState {
  ram: number
  width: number
  height: number
  fullScreen: boolean
  autoEnter: boolean
  selectedProfile: string | null
  javaPath: string
  updateSettings()
  resetSettings()
}
```

### Data Flow

```
User Action → Component → API Call → React Query → Cache
                                          │
                                          ▼
                                    Update UI
                                          │
                                          ▼
                                   Zustand Store (if needed)
```

### React Query Queries

```typescript
// Fetch profiles
useQuery(['profiles'], profilesAPI.getProfiles)

// Fetch single profile
useQuery(['profile', id], () => profilesAPI.getProfile(id))

// Fetch user
useQuery(['user'], userAPI.getMe)
```

## 🖥️ Backend Architecture

### Layered Structure

```
┌──────────────────────────────────────────┐
│            HTTP Server Layer             │
│         (Express + WebSocket)            │
├──────────────────────────────────────────┤
│            Middleware Layer              │
│   (Auth, Error Handling, Validation)     │
├──────────────────────────────────────────┤
│             Routes Layer                 │
│  (auth, profiles, updates, users, etc)   │
├──────────────────────────────────────────┤
│            Services Layer                │
│  (Business Logic, Hasher, Crypto, etc)   │
├──────────────────────────────────────────┤
│            Data Access Layer             │
│           (Prisma Client)                │
├──────────────────────────────────────────┤
│            Database Layer                │
│             (PostgreSQL)                 │
└──────────────────────────────────────────┘
```

### Request Flow

```
HTTP Request
    │
    ▼
Express Middleware (cors, helmet, body-parser)
    │
    ▼
Rate Limiter (optional)
    │
    ▼
Auth Middleware (if protected route)
    │
    ▼
Validation Middleware
    │
    ▼
Route Handler
    │
    ▼
Service Layer
    │
    ▼
Database (Prisma)
    │
    ▼
Response
    │
    ▼
Error Handler (if error)
```

### Services

```typescript
// Auth Service
class AuthService {
  hashPassword()
  verifyPassword()
  generateToken()
  verifyToken()
  authenticate()
  register()
  validateSession()
  revokeSession()
}

// Hasher Service
class HasherService {
  hashFile()
  hashDirectory()
  compareDirs()
  verifyFile()
  flattenHashedDir()
}

// Crypto Service
initializeKeys()
getPublicKey()
getPrivateKey()
sign()
verify()
encrypt()
decrypt()
```

## 📡 Communication Protocols

### REST API

```
POST   /api/auth/login      - Authenticate user
POST   /api/auth/register   - Register new user
POST   /api/auth/logout     - Revoke session
GET    /api/auth/validate   - Validate token

GET    /api/profiles        - Get all profiles
GET    /api/profiles/:id    - Get single profile
POST   /api/profiles        - Create profile
PUT    /api/profiles/:id    - Update profile
DELETE /api/profiles/:id    - Delete profile

GET    /api/updates/:profileId/:dirType        - Get hashed dir
GET    /api/updates/:profileId/:dirType/file/* - Download file
POST   /api/updates/sync/:profileId            - Trigger sync

GET    /api/users/me              - Get current user
PUT    /api/users/me              - Update user
GET    /api/users/:username/profile - Get public profile

GET    /api/servers/:address/status - Ping server
```

### WebSocket Events

```typescript
// Client → Server
{
  event: 'auth',
  token: 'jwt-token'
}

// Server → Client
{
  event: 'update_progress',
  data: {
    profileId: string,
    stage: 'downloading' | 'verifying' | 'extracting' | 'complete',
    progress: number,
    currentFile: string,
    totalFiles: number,
    downloadedFiles: number
  }
}

{
  event: 'launch_status',
  data: {
    status: 'preparing' | 'launching' | 'running' | 'crashed' | 'closed',
    message?: string,
    error?: string
  }
}
```

### IPC (Electron)

```typescript
// Renderer → Main
ipcRenderer.send('window:minimize')
ipcRenderer.send('window:maximize')
ipcRenderer.send('window:close')

ipcRenderer.invoke('launcher:launch', {
  javaPath: string,
  jvmArgs: string[],
  mainClass: string,
  classPath: string[],
  gameArgs: string[],
  workingDir: string
})

// Main → Renderer
mainWindow.webContents.send('game:log', log)
mainWindow.webContents.send('game:error', error)
mainWindow.webContents.send('game:exit', code)
```

## 🗄️ Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String   // bcrypt
  uuid      String   @unique
  email     String?  @unique
  skinUrl   String?
  cloakUrl  String?
  sessions  Session[]
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  accessToken  String   @unique
  expiresAt    DateTime
  user         User     @relation(fields: [userId])
}

model ClientProfile {
  id              String   @id @default(uuid())
  version         String
  title           String
  serverAddress   String
  serverPort      Int
  mainClass       String
  classPath       String[]
  jvmArgs         String[]
  // ... more fields
}
```

## 🔒 Security Flow

```
1. User enters credentials
   ↓
2. Frontend encrypts password (optional)
   ↓
3. POST /api/auth/login
   ↓
4. Rate limiter check
   ↓
5. Find user in DB
   ↓
6. bcrypt.compare(password, hash)
   ↓
7. Generate JWT token
   ↓
8. Create session in DB
   ↓
9. Return token + profile
   ↓
10. Store in Zustand + localStorage
    ↓
11. All future requests include:
    Authorization: Bearer <token>
    ↓
12. Auth middleware validates token
    ↓
13. Check session in DB
    ↓
14. Attach user to request
    ↓
15. Continue to route handler
```

## 🎮 Game Launch Flow

```
1. User clicks "Launch"
   ↓
2. Frontend prepares launch params
   ↓
3. IPC call to Electron main process
   ↓
4. Check/download updates
   ↓
5. Verify file integrity
   ↓
6. Build command line args
   ↓
7. spawn() Java process
   ↓
8. Pipe stdout/stderr to frontend
   ↓
9. Monitor process status
   ↓
10. Handle exit code
```

## 📦 Build Process

### Development
```
npm run dev
  ↓
  ├─► Backend: tsx watch (hot reload)
  └─► Frontend: vite + electron (hot reload)
```

### Production
```
npm run build
  ↓
  ├─► Backend: tsc → dist/
  ├─► Frontend: vite build → dist/
  └─► Electron: electron-builder → release/
```

## 🔧 Configuration Management

```
Backend:
  .env → config/index.ts → Services

Frontend:
  .env → import.meta.env → Components

Shared:
  packages/shared/types → Both sides
```

## 🌐 Deployment Architecture

```
┌──────────────────┐
│   Nginx/Caddy    │  (Reverse proxy)
│   SSL/TLS        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Backend Server  │  (PM2/systemd)
│  Node.js         │
│  Port 7240       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   PostgreSQL     │  (Database)
│   Port 5432      │
└──────────────────┘

Client Side:
┌──────────────────┐
│ Electron App     │  (Desktop)
│ (Built binary)   │
└──────────────────┘
```

## 🧩 Module Dependencies

```
frontend
  ├── @modern-launcher/shared (types)
  ├── react, react-dom
  ├── electron
  ├── zustand (state)
  ├── @tanstack/react-query (API)
  ├── framer-motion (animations)
  └── tailwindcss (styles)

backend
  ├── @modern-launcher/shared (types)
  ├── express (HTTP)
  ├── ws (WebSocket)
  ├── prisma (ORM)
  ├── bcrypt (passwords)
  ├── jsonwebtoken (JWT)
  └── node-rsa (crypto)

shared
  └── types (interfaces)
```

Эта архитектура обеспечивает:
- ✅ Масштабируемость
- ✅ Безопасность
- ✅ Производительность
- ✅ Поддерживаемость
- ✅ Тестируемость
