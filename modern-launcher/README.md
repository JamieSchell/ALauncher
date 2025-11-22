# Modern Minecraft Launcher

Современный лаунчер для Minecraft, разработанный с использованием React, Electron и Node.js.

## 🚀 Возможности

- ✨ Современный UI на React + TailwindCSS
- 🔐 Безопасная система авторизации (JWT + bcrypt)
- 📦 Автоматическое обновление клиента
- 🎨 Поддержка скинов и плащей
- 🔄 Real-time обновления через WebSocket
- 💾 Проверка целостности файлов
- 🎮 Поддержка множества профилей
- 🌐 Модульная система авторизации (MySQL, PostgreSQL, JSON)
- 📊 Мониторинг статуса серверов

## 📁 Структура проекта

```
modern-launcher/
├── packages/
│   ├── frontend/          # Electron + React приложение
│   │   ├── src/
│   │   │   ├── main/      # Electron main process
│   │   │   ├── renderer/  # React приложение
│   │   │   └── shared/    # Общий код
│   │   └── package.json
│   ├── backend/           # Node.js сервер
│   │   ├── src/
│   │   │   ├── routes/    # API endpoints
│   │   │   ├── services/  # Бизнес-логика
│   │   │   ├── models/    # Модели данных
│   │   │   └── utils/     # Утилиты
│   │   └── package.json
│   └── shared/            # Общие типы и утилиты
│       └── package.json
└── package.json
```

## 🛠️ Технологии

### Frontend
- **React 18** + TypeScript
- **Electron** - десктопное приложение
- **Vite** - быстрая сборка
- **TailwindCSS** - стилизация
- **Zustand** - управление состоянием
- **React Query** - работа с API
- **Framer Motion** - анимации

### Backend
- **Node.js** + TypeScript
- **Express** - веб-сервер
- **Prisma** - ORM
- **PostgreSQL** - база данных
- **JWT** - авторизация
- **bcrypt** - хеширование паролей
- **WebSocket** - real-time обновления
- **node-rsa** - шифрование

## 📦 Установка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build
```

## 🔧 Настройка

1. Скопируйте `.env.example` в `.env` в папке `packages/backend`
2. Настройте подключение к базе данных
3. Запустите миграции: `npm run migrate --workspace=backend`
4. Запустите приложение: `npm run dev`

## 📝 Конфигурация сервера

Создайте файл `config.json` в корне проекта:

```json
{
  "server": {
    "port": 7240,
    "host": "0.0.0.0"
  },
  "auth": {
    "provider": "database",
    "jwtSecret": "your-secret-key",
    "sessionExpiry": "24h"
  },
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "launcher",
    "username": "launcher",
    "password": "your-password"
  }
}
```

## 🎮 Добавление профиля

Профили хранятся в папке `profiles/`. Пример профиля:

```json
{
  "id": "vanilla-1.20.4",
  "version": "1.20.4",
  "title": "Vanilla 1.20.4",
  "serverAddress": "mc.example.com",
  "serverPort": 25565,
  "mainClass": "net.minecraft.client.main.Main",
  "jvmArgs": ["-XX:+UseG1GC"],
  "sortIndex": 0
}
```

## 🔐 Безопасность

- RSA шифрование для критичных данных
- JWT токены с истечением
- bcrypt для хеширования паролей
- Проверка целостности файлов через SHA-256
- Защита от брутфорса с rate limiting

## 📄 Лицензия

GNU GPL v3.0

## 👨‍💻 Автор

Основано на LauncherSchool (sashok724 v3)
Современная реализация: 2024
