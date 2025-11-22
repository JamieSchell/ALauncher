# 🚀 Руководство по развертыванию лаунчера на VDS

Полное руководство по установке и настройке Modern Minecraft Launcher на виртуальном выделенном сервере (VDS).

---

## 📋 Содержание

1. [Требования](#требования)
2. [Подготовка VDS](#подготовка-vds)
3. [Установка зависимостей](#установка-зависимостей)
4. [Настройка базы данных](#настройка-базы-данных)
5. [Настройка проекта](#настройка-проекта)
6. [Запуск Backend сервера](#запуск-backend-сервера)
7. [Сборка Frontend для Production](#сборка-frontend-для-production)
8. [Создание клиентских версий для игроков](#создание-клиентских-версий-для-игроков)
9. [Сборка Electron приложения](#сборка-electron-приложения)
10. [Настройка автозапуска](#настройка-автозапуска)
11. [Настройка Nginx (опционально)](#настройка-nginx-опционально)
12. [Безопасность](#безопасность)

---

## 📦 Требования

### Минимальные требования к VDS:
- **ОС**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM**: минимум 2GB (рекомендуется 4GB+)
- **CPU**: минимум 2 ядра
- **Диск**: минимум 20GB свободного места
- **Сеть**: статический IP-адрес

### Программное обеспечение:
- **Node.js**: версия 18.0.0 или выше
- **npm**: версия 9.0.0 или выше
- **MySQL**: версия 8.0 или выше
- **Git**: для клонирования репозитория

---

## 🖥️ Подготовка VDS

### 1. Подключение к серверу

```bash
ssh root@your-vds-ip
```

### 2. Обновление системы

```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/RHEL
yum update -y
```

### 3. Установка Node.js

```bash
# Используем NodeSource для установки Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Проверяем версию
node --version  # Должно быть v18.x.x или выше
npm --version   # Должно быть 9.x.x или выше
```

### 4. Установка MySQL

```bash
# Ubuntu/Debian
apt install -y mysql-server

# CentOS/RHEL
yum install -y mysql-server
systemctl start mysqld
systemctl enable mysqld
```

### 5. Настройка MySQL

```bash
# Запускаем безопасную настройку
mysql_secure_installation

# Создаем базу данных и пользователя
mysql -u root -p
```

В MySQL консоли:

```sql
CREATE DATABASE launcher_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'launcher_user'@'localhost' IDENTIFIED BY 'your_strong_password_here';
GRANT ALL PRIVILEGES ON launcher_db.* TO 'launcher_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 6. Установка Git

```bash
apt install -y git  # Ubuntu/Debian
# или
yum install -y git  # CentOS/RHEL
```

---

## 📥 Установка зависимостей

### 1. Клонирование репозитория

```bash
cd /opt
git clone https://github.com/your-username/LauncherSchool-sashok724-v3-Fork.git launcher
cd launcher
```

### 2. Установка зависимостей проекта

```bash
# Устанавливаем зависимости для всех пакетов
npm install

# Собираем shared пакет
npm run build:shared
```

---

## 🗄️ Настройка базы данных

### 1. Настройка переменных окружения

Создайте файл `.env` в директории `packages/backend/`:

```bash
cd packages/backend
nano .env
```

Добавьте следующее содержимое:

```env
# Окружение
NODE_ENV=production

# Сервер
PORT=7240
HOST=0.0.0.0
CORS_ORIGIN=http://your-domain.com

# База данных
DATABASE_URL=mysql://launcher_user:your_strong_password_here@localhost:3306/launcher_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
JWT_EXPIRY=24h

# RSA ключи (пути будут созданы автоматически)
RSA_PUBLIC_KEY_PATH=/opt/launcher/packages/backend/keys/public.key
RSA_PRIVATE_KEY_PATH=/opt/launcher/packages/backend/keys/private.key

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=60000

# Логирование
LOG_LEVEL=info
```

**⚠️ ВАЖНО**: Замените все значения на ваши реальные данные!

### 2. Инициализация базы данных

```bash
cd /opt/launcher/packages/backend

# Генерируем Prisma Client
npm run generate

# Применяем миграции (если есть)
npx prisma migrate deploy

# Или синхронизируем схему напрямую
npx prisma db push
```

### 3. Создание первого пользователя

```bash
npm run create-user
# Следуйте инструкциям для создания администратора
```

---

## ⚙️ Настройка проекта

### 1. Создание директорий

```bash
cd /opt/launcher/packages/backend

# Создаем необходимые директории
mkdir -p keys
mkdir -p profiles
mkdir -p updates
```

### 2. Генерация RSA ключей (если еще не созданы)

RSA ключи будут созданы автоматически при первом запуске сервера, но вы можете создать их вручную:

```bash
# Ключи будут созданы автоматически при первом запуске
# Или используйте скрипт для генерации (если есть)
```

---

## 🚀 Запуск Backend сервера

### Вариант 1: Запуск напрямую (для тестирования)

```bash
cd /opt/launcher/packages/backend
npm run build
npm start
```

### Вариант 2: Использование PM2 (рекомендуется)

```bash
# Устанавливаем PM2 глобально
npm install -g pm2

# Собираем backend
cd /opt/launcher/packages/backend
npm run build

# Запускаем через PM2
pm2 start dist/index.js --name "launcher-backend"

# Сохраняем конфигурацию PM2
pm2 save

# Настраиваем автозапуск при перезагрузке
pm2 startup
# Выполните команду, которую выведет PM2
```

### Проверка работы сервера

```bash
# Проверяем статус
pm2 status

# Смотрим логи
pm2 logs launcher-backend

# Проверяем, что сервер отвечает
curl http://localhost:7240/api/health
```

---

## 🎨 Сборка Frontend для Production

### 1. Настройка переменных окружения для Frontend

Создайте файл `.env.production` в `packages/frontend/`:

```bash
cd /opt/launcher/packages/frontend
nano .env.production
```

```env
VITE_API_URL=http://your-domain.com:7240
VITE_WS_URL=ws://your-domain.com:7240
```

### 2. Сборка Frontend

```bash
cd /opt/launcher/packages/frontend
npm run build
```

Собранные файлы будут в директории `packages/frontend/dist/`.

### 3. Настройка статического сервера (опционально)

Если вы хотите раздавать frontend через Nginx:

```bash
# Копируем собранные файлы
cp -r packages/frontend/dist /var/www/launcher-frontend
```

---

## 📦 Создание клиентских версий для игроков

### 1. Подготовка клиентских файлов

Для каждой версии Minecraft, которую вы хотите поддерживать:

```bash
cd /opt/launcher/packages/backend

# Скачиваем клиент Minecraft (например, версия 1.20.4)
npm run download-minecraft 1.20.4

# Или используйте скрипт для добавления версии в базу данных
npm run add-client-version
```

### 2. Добавление версии в базу данных

Используйте скрипт для добавления информации о клиентской версии:

```bash
npm run add-client-version
```

Или создайте версию вручную через Prisma Studio:

```bash
npx prisma studio
# Откройте http://localhost:5555 в браузере
```

### 3. Загрузка файлов на сервер

Убедитесь, что файлы клиента доступны по HTTP/HTTPS:

```bash
# Пример структуры:
# /opt/launcher/packages/backend/updates/
#   └── 1.20.4/
#       ├── client.jar
#       ├── libraries/
#       └── version.json
```

### 4. Настройка путей для скачивания

В базе данных таблица `ClientFile` должна содержать правильные URL для скачивания файлов. Убедитесь, что URL указывают на ваш сервер:

```
http://your-domain.com:7240/api/client-versions/1.20.4/files/client.jar
```

---

## 📱 Сборка Electron приложения

### 1. Настройка для Production

Отредактируйте `packages/frontend/vite.config.ts` и убедитесь, что API URL указывает на ваш сервер:

```typescript
// В vite.config.ts или через переменные окружения
const API_URL = process.env.VITE_API_URL || 'http://your-domain.com:7240';
```

### 2. Сборка для Windows

```bash
cd /opt/launcher/packages/frontend

# Устанавливаем зависимости (если еще не установлены)
npm install

# Собираем приложение
npm run electron:build

# Собранные файлы будут в packages/frontend/release/
```

### 3. Сборка для Linux

```bash
# На Linux сервере можно собрать Linux версию
npm run electron:build

# Или используйте Docker для кроссплатформенной сборки
```

### 4. Сборка для macOS (требуется macOS или Docker)

```bash
# Требуется macOS система или Docker с macOS образами
npm run electron:build
```

### 5. Распространение собранных файлов

После сборки файлы будут в `packages/frontend/release/`:

- **Windows**: `.exe` (NSIS installer) или `.exe` (portable)
- **Linux**: `.AppImage` или `.deb`
- **macOS**: `.dmg` или `.zip`

Загрузите эти файлы на ваш сервер или файлообменник для скачивания игроками.

---

## 🔄 Настройка автозапуска

### Использование PM2 (рекомендуется)

PM2 уже настроен выше. Для управления:

```bash
# Перезапуск
pm2 restart launcher-backend

# Остановка
pm2 stop launcher-backend

# Просмотр логов
pm2 logs launcher-backend

# Мониторинг
pm2 monit
```

### Использование systemd (альтернатива)

Создайте файл `/etc/systemd/system/launcher-backend.service`:

```ini
[Unit]
Description=Modern Launcher Backend Service
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/launcher/packages/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=launcher-backend

[Install]
WantedBy=multi-user.target
```

Активируйте сервис:

```bash
systemctl daemon-reload
systemctl enable launcher-backend
systemctl start launcher-backend
systemctl status launcher-backend
```

---

## 🌐 Настройка Nginx (опционально)

Если вы хотите использовать Nginx как reverse proxy:

### 1. Установка Nginx

```bash
apt install -y nginx  # Ubuntu/Debian
# или
yum install -y nginx  # CentOS/RHEL
```

### 2. Настройка конфигурации

Создайте файл `/etc/nginx/sites-available/launcher`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (если раздаете статику)
    location / {
        root /var/www/launcher-frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:7240;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:7240;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Активация конфигурации

```bash
# Ubuntu/Debian
ln -s /etc/nginx/sites-available/launcher /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# CentOS/RHEL
cp /etc/nginx/sites-available/launcher /etc/nginx/conf.d/launcher.conf
nginx -t
systemctl restart nginx
```

### 4. Настройка SSL (рекомендуется)

```bash
# Устанавливаем Certbot
apt install -y certbot python3-certbot-nginx

# Получаем SSL сертификат
certbot --nginx -d your-domain.com

# Автоматическое обновление
certbot renew --dry-run
```

---

## 🔒 Безопасность

### 1. Настройка Firewall

```bash
# Ubuntu/Debian (UFW)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 7240/tcp # Backend (или только через Nginx)
ufw enable

# CentOS/RHEL (firewalld)
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=7240/tcp
firewall-cmd --reload
```

### 2. Обновление переменных окружения

- ✅ Используйте сильные пароли для базы данных
- ✅ Генерируйте случайный `JWT_SECRET` (минимум 32 символа)
- ✅ Ограничьте доступ к `.env` файлам (права 600)
- ✅ Не коммитьте `.env` файлы в Git

### 3. Регулярные обновления

```bash
# Обновление системы
apt update && apt upgrade -y

# Обновление Node.js зависимостей
cd /opt/launcher
npm update

# Обновление базы данных
cd packages/backend
npx prisma migrate deploy
```

---

## 📝 Полезные команды

### Управление пользователями

```bash
cd /opt/launcher/packages/backend

# Создать пользователя
npm run create-user

# Список пользователей
npm run list-users
```

### Управление профилями

```bash
# Создать профиль
npm run create-profile

# Список профилей
npm run list-profiles
```

### Просмотр логов

```bash
# PM2 логи
pm2 logs launcher-backend

# Systemd логи
journalctl -u launcher-backend -f

# Prisma Studio (для просмотра БД)
npx prisma studio
```

### Резервное копирование

```bash
# Резервная копия базы данных
mysqldump -u launcher_user -p launcher_db > backup_$(date +%Y%m%d).sql

# Восстановление
mysql -u launcher_user -p launcher_db < backup_20231122.sql
```

---

## 🐛 Решение проблем

### Сервер не запускается

1. Проверьте логи: `pm2 logs launcher-backend`
2. Проверьте переменные окружения в `.env`
3. Убедитесь, что база данных доступна
4. Проверьте, что порт 7240 свободен: `netstat -tulpn | grep 7240`

### Ошибки подключения к базе данных

1. Проверьте `DATABASE_URL` в `.env`
2. Убедитесь, что MySQL запущен: `systemctl status mysql`
3. Проверьте права пользователя БД

### Файлы клиента не скачиваются

1. Проверьте пути в базе данных (`ClientFile` таблица)
2. Убедитесь, что файлы существуют на сервере
3. Проверьте права доступа к файлам: `chmod -R 755 updates/`

---

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи сервера
2. Проверьте документацию проекта
3. Создайте issue в репозитории

---

## ✅ Чеклист развертывания

- [ ] VDS подготовлен и обновлен
- [ ] Node.js 18+ установлен
- [ ] MySQL установлен и настроен
- [ ] База данных создана
- [ ] `.env` файл настроен
- [ ] Prisma миграции применены
- [ ] Первый пользователь создан
- [ ] Backend сервер запущен (PM2 или systemd)
- [ ] Frontend собран для production
- [ ] Клиентские версии добавлены в БД
- [ ] Electron приложение собрано
- [ ] Firewall настроен
- [ ] SSL сертификат установлен (опционально)
- [ ] Резервное копирование настроено

---

**Успешного развертывания! 🚀**

