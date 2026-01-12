# ALauncher Project Context

## Project Overview

**ALauncher** - Modern Minecraft Launcher built with modern web technologies.

**Type:** Monorepo (Turborepo)
**Repository:** https://github.com/JamieSchell/ALauncher
**Language:** Russian & English
**Primary Language:** Russian (user communicates in Russian)

## Project Structure

```
/opt/ALauncher/
├── packages/
│   ├── backend/         # Node.js/Express backend (port 7240)
│   ├── frontend/        # Tauri desktop application
│   └── shared/          # Shared TypeScript utilities & types
├── docs/                # Documentation
└── .claude/             # Claude Code context (this directory)
```

## Technology Stack

### Backend
- **Runtime:** Node.js v22.21.1
- **Framework:** Express.js
- **Database:** MySQL (Prisma ORM)
- **Host:** api.alauncher.su (HTTPS only)
- **Port:** 7240
- **Environment:** Production

### Frontend
- **Framework:** Tauri (Rust + React + Vite)
- **UI:** React with TypeScript
- **Styling:** Tailwind CSS
- **Build:** Vite

### Shared
- **Language:** TypeScript
- **Testing:** Jest (95 tests, all passing)
- **Build Quality:** ESLint, Prettier
- **Version:** 2.0.0 (REMEDIATED)

## Current Production Configuration

### Domain & SSL
- **Domain:** api.alauncher.su
- **Protocol:** HTTPS only (HTTP → HTTPS redirect)
- **SSL:** Let's Encrypt
- **Nginx:** Configured for reverse proxy

### Database
- **Host:** skala1.beget.tech:3306
- **Database:** skala1_testl
- **Status:** Connected (tables need migration)

### Environment Files
- Backend: `/opt/ALauncher/packages/backend/.env.prod`
- CORS_ORIGIN: `https://api.alauncher.su` ONLY

## Recent Completed Work

1. **SHARED_AUDIT Remediation** (v2.0.0)
   - Fixed security vulnerabilities in PathHelper, UUIDHelper, SecurityHelper
   - Added discriminated unions for type safety
   - Created 95 passing tests
   - Full JSDoc documentation in Russian

2. **Nginx & SSL Setup**
   - Configured api.alauncher.su with HTTPS
   - HTTP → HTTPS redirect (301)
   - SSL certificate from Let's Encrypt
   - Removed old IP-based configurations

3. **Build System**
   - Fixed missing progressBar.ts utility
   - ESLint & Prettier configuration
   - prepublishOnly hooks

## Important Files

### Critical Configuration
- `/etc/nginx/sites-available/api.alauncher.su` - Nginx config
- `/opt/ALauncher/packages/backend/.env.prod` - Backend env
- `/opt/ALauncher/packages/backend/src/utils/progressBar.ts` - Utility (was missing)

### Documentation
- `/opt/ALauncher/docs/SHARED_AUDIT.md` - Security audit & remediation
- `/opt/ALauncher/packages/shared/README.md` - Shared package docs

### Build & Run
- Backend: `NODE_ENV=production npm run start`
- Frontend: `npm run tauri build`
- Shared: `npm run build && npm run test`

## Development Workflow

1. **Always** read files before editing
2. **Always** use TodoWrite for multi-step tasks
3. **Always** communicate in Russian with the user
4. **Never** create unnecessary files
5. **Never** add features beyond what's requested

## Server Status

- **Backend Process:** Running (PID changes on restart)
- **Port:** 7240
- **Health Check:** `curl https://api.alauncher.su/health`
- **Logs:** `/var/log/alauncher-backend.log`

## User Preferences

- **Language:** Russian
- **Communication:** Concise, no emojis unless requested
- **Git:** Already configured (JamieSchell/ALauncher)
- **VSCode:** Extensions installed (Claude Code, Claude Code Assist History)

## Memory Protocol

To maintain context between sessions:
1. Update this file (CLAUDE.md) after major changes
2. Update `.claude/context/current-state.md` for work-in-progress
3. Commit changes to git with descriptive messages
4. Use `.claude/rules/` for persistent instructions

## Next Steps / Known Issues

1. **Database:** Tables (`users`, `launcher_errors`) don't exist - need Prisma migration
2. **Frontend:** Tauri build not tested yet
3. **Testing:** Integration tests needed
