# 🚀 Quick Start Guide

## Шаг 1: Установка зависимостей

```bash
cd /workspace/modern-launcher
npm install
```

## Шаг 2: Настройка Backend

### 2.1 Создайте файл `.env` в `packages/backend/`

```bash
cp packages/backend/.env.example packages/backend/.env
```

### 2.2 Настройте базу данных PostgreSQL

Установите PostgreSQL, затем создайте базу данных:

```sql
CREATE DATABASE launcher;
CREATE USER launcher WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE launcher TO launcher;
```

### 2.3 Обновите `.env` файл

```env
DATABASE_URL="postgresql://launcher:your_password@localhost:5432/launcher?schema=public"
JWT_SECRET="your-super-secret-key-change-this"
```

### 2.4 Запустите миграции

```bash
cd packages/backend
npx prisma migrate dev
npx prisma generate
```

## Шаг 3: Создайте структуру папок

```bash
cd /workspace/modern-launcher
mkdir -p updates profiles keys
```

## Шаг 4: Запуск проекта

### Вариант 1: Запуск всего (backend + frontend)

```bash
npm run dev
```

### Вариант 2: Запуск по отдельности

#### Backend:
```bash
npm run dev:backend
```

#### Frontend:
```bash
npm run dev:frontend
```

## Шаг 5: Первый запуск

1. Backend запустится на `http://localhost:7240`
2. Frontend (Electron) запустится автоматически
3. Зарегистрируйте первого пользователя через UI

## 📁 Структура файлов

```
modern-launcher/
├── packages/
│   ├── backend/          # Node.js сервер
│   │   ├── src/
│   │   ├── prisma/
│   │   └── .env         # Конфигурация (создайте сами)
│   │
│   ├── frontend/         # Electron + React приложение
│   │   ├── src/
│   │   ├── electron/
│   │   └── vite.config.ts
│   │
│   └── shared/           # Общие типы
│       └── src/types/
│
├── updates/              # Файлы клиентов (создайте)
├── profiles/             # JSON профили (создайте)
├── keys/                 # RSA ключи (авто-генерация)
└── package.json
```

## 🎮 Добавление профиля Minecraft

Создайте файл в папке `profiles/`, например `vanilla-1.20.json`:

```json
{
  "id": "vanilla-1.20",
  "version": "1.20.4",
  "assetIndex": "1.20",
  "title": "Vanilla 1.20.4",
  "serverAddress": "localhost",
  "serverPort": 25565,
  "sortIndex": 0,
  "mainClass": "net.minecraft.client.main.Main",
  "classPath": ["libraries", "client.jar"],
  "jvmArgs": ["-XX:+UseG1GC"],
  "clientArgs": [],
  "updateFastCheck": true,
  "update": [],
  "updateVerify": ["libraries", "client\\.jar"],
  "updateExclusions": [],
  "enabled": true
}
```

Затем добавьте его через API или напрямую в базу:

```bash
curl -X POST http://localhost:7240/api/profiles \
  -H "Content-Type: application/json" \
  -d @profiles/vanilla-1.20.json
```

## 🔧 Команды разработки

```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Сборка для продакшена
npm run build

# Запуск только backend
npm run dev:backend

# Запуск только frontend
npm run dev:frontend

# Prisma команды
cd packages/backend
npx prisma studio          # GUI для БД
npx prisma migrate dev     # Создать миграцию
npx prisma generate        # Генерация клиента
```

## ❓ Решение проблем

### Backend не запускается

1. Проверьте что PostgreSQL запущен
2. Проверьте `DATABASE_URL` в `.env`
3. Запустите `npx prisma migrate dev`

### Frontend не подключается к Backend

1. Убедитесь что backend запущен на порту 7240
2. Проверьте `VITE_API_URL` в `packages/frontend/.env`

### Ошибка при запуске игры

1. Проверьте что Java установлена
2. Проверьте путь к Java в настройках
3. Убедитесь что файлы клиента находятся в правильной папке

## 📚 Дополнительно

- [Документация Backend API](./packages/backend/README.md)
- [Компоненты Frontend](./packages/frontend/README.md)
- [Shared Types](./packages/shared/README.md)

## 🎉 Готово!

Теперь у вас есть полнофункциональный современный лаунчер Minecraft!
