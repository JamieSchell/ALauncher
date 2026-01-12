# Технический стек ALauncher

## Backend

### Core
- **Runtime:** Node.js v22.21.1
- **Framework:** Express.js
- **Language:** TypeScript
- **Port:** 7240
- **Host:** 127.0.0.1 (internal) / api.alauncher.su (external)

### Database
- **Type:** MySQL
- **ORM:** Prisma
- **Host:** skala1.beget.tech:3306
- **Database:** skala1_testl
- **Status:** Connected, tables need migration

### Key Dependencies
```json
{
  "express": "^4.x",
  "@prisma/client": "^6.0.0",
  "ws": "^8.x",
  "dotenv": "^17.x",
  "cors": "^2.x"
}
```

### API Structure
- `/api/*` - REST endpoints
- `/ws` - WebSocket
- `/health` - Health check
- `/uploads/*` - Static files

## Frontend

### Core
- **Framework:** Tauri v2 (Rust + Web)
- **UI:** React 18
- **Language:** TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS

### Tauri Config
```json
{
  "productName": "ALauncher",
  "version": "1.0.0",
  "identifier": "com.alauncher.app"
}
```

### Key Dependencies
```json
{
  "react": "^18.x",
  "@tauri-apps/api": "^2.x",
  "@tauri-apps/plugin-shell": "^2.x",
  "tailwindcss": "^3.x"
}
```

## Shared Package

### Purpose
- Общие типы для frontend/backend
- Утилиты (UUID, Path, Version, Security)
- Type guards и discriminated unions

### Version
**2.0.0 (REMEDIATED)**

### Key Modules

#### UUIDHelper
- `generateOffline(username, serverSalt)` - UUID v4 с SHA-256
- `validateUUID(uuid)` - Валидация формата
- `isValidUUID(uuid)` - Type guard

#### PathHelper
- `join(...parts)` - Безопасное соединение путей
- `normalize(path)` - Нормализация
- `isSafe(path)` - Проверка на traversal атаки
- `hasTraversalAttack(path)` - Детект `../`

#### SecurityHelper
- `sanitizeEmail(email)` - Валидация email
- `sanitizeUsername(username)` - Очистка имени
- `validateJWT(token)` - Проверка JWT
- `hashPassword(password)` - SHA-256 хеш

#### VersionComparator
- `compare(v1, v2)` - Сравнение версий
- `isGreater(v1, v2)` - Проверка newer

## DevOps

### Nginx
- **Version:** 1.22.1
- **Config:** `/etc/nginx/sites-available/api.alauncher.su`
- **SSL:** Let's Encrypt
- **Protocols:** TLSv1.2, TLSv1.3

### SSL Certificate
```
/etc/letsencrypt/live/api.alauncher.su/
├── fullchain.pem
├── privkey.pem
└── chain.pem
```

### Process Management
- Backend: PM2 or nohup
- Logs: `/var/log/alauncher-backend.log`
- Restart: `pkill -f "node.*dist/index.js"`

## Build Tools

### Backend
```bash
npm run build      # TypeScript compilation
npm run start      # Production start
npm run dev        # Development with ts-node
```

### Frontend
```bash
npm run tauri dev     # Development mode
npm run tauri build   # Production build
```

### Shared
```bash
npm run build         # Compile TypeScript
npm run test          # Run Jest tests
npm run lint          # ESLint check
npm run format        # Prettier format
```

## Testing

### Framework: Jest
- **Tests:** 95 total
- **Status:** All passing
- **Coverage:** >80%

### Test Files
```
packages/shared/src/utils/__tests__/
├── UUIDHelper.test.ts
├── PathHelper.test.ts
├── VersionComparator.test.ts
└── SecurityHelper.test.ts
```

## Security

### Implemented
- ✅ Path traversal protection
- ✅ SHA-256 password hashing
- ✅ JWT validation
- ✅ Input sanitization
- ✅ CORS restriction
- ✅ TLS 1.2/1.3

### Pending
- ⏳ Rate limiting (disabled in prod)
- ⏳ Request signing
- ⏳ CSRF protection

## Architecture Patterns

### Backend
- Middleware-based (Express)
- Service layer (auth, database, fileSync)
- WebSocket for real-time
- Prisma for database access

### Frontend
- Component-based (React)
- Custom hooks for state
- Tauri IPC for native calls
- Tailwind for styling

### Shared
- Pure functions (no side effects)
- Discriminated unions for type safety
- Type guards for runtime validation
- Comprehensive JSDoc (Russian)

## Environment Variables

### Backend (.env.prod)
```bash
PORT=7240
HOST=0.0.0.0
CORS_ORIGIN=https://api.alauncher.su
DATABASE_URL=mysql://...
JWT_SECRET=change-this
JWT_EXPIRY=24h
LOG_LEVEL=info
```

## Monitoring & Logging

### Logs
- Backend: `/var/log/alauncher-backend.log`
- Nginx access: `/var/log/nginx/alauncher-api-ssl-access.log`
- Nginx error: `/var/log/nginx/alauncher-api-ssl-error.log`

### Health Check
```bash
curl https://api.alauncher.su/health
# {"status":"ok","timestamp":"...","version":"1.0.0"}
```

## Known Limitations

1. **Database:** Tables not created yet
2. **Frontend:** Build not tested
3. **Auth:** No refresh token rotation
4. **Files:** No CDN, local storage only
