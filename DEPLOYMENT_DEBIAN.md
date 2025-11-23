# 🚀 Полное руководство по развертыванию на Debian

## Содержание

1. [Требования](#требования)
2. [Подготовка сервера](#подготовка-сервера)
3. [Установка зависимостей](#установка-зависимостей)
4. [Настройка базы данных](#настройка-базы-данных)
5. [Клонирование и настройка проекта](#клонирование-и-настройка-проекта)
6. [Настройка Backend](#настройка-backend)
7. [Настройка Frontend](#настройка-frontend)
8. [Настройка systemd](#настройка-systemd)
9. [Настройка Nginx](#настройка-nginx)
10. [Настройка SSL (Let's Encrypt)](#настройка-ssl-lets-encrypt)
11. [Развертывание обновлений лаунчера](#развертывание-обновлений-лаунчера)
12. [Мониторинг и логирование](#мониторинг-и-логирование)
13. [Резервное копирование](#резервное-копирование)
14. [Обновление проекта](#обновление-проекта)
15. [Решение проблем](#решение-проблем)

---

## Требования

- **ОС**: Debian 11 (Bullseye) или Debian 12 (Bookworm)
- **RAM**: Минимум 2 GB (рекомендуется 4 GB+)
- **Диск**: Минимум 20 GB свободного места
- **Процессор**: 2+ ядра
- **Сеть**: Статический IP адрес или доменное имя
- **Права**: Доступ root или sudo

---

## Подготовка сервера

### 1. Обновление системы

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 2. Создание пользователя для приложения

```bash
sudo adduser --system --group --home /opt/launcher launcher
sudo mkdir -p /opt/launcher
sudo chown launcher:launcher /opt/launcher
```

### 3. Настройка firewall (UFW)

```bash
sudo apt install -y ufw
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 7240/tcp  # Backend API
sudo ufw enable
```

---

## Установка зависимостей

### 1. Установка Node.js 18+

```bash
# Установка NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Установка Node.js
sudo apt install -y nodejs

# Проверка версии
node --version  # Должно быть v18.x.x или выше
npm --version   # Должно быть 9.x.x или выше
```

### 2. Установка MySQL 8.0

```bash
# Установка MySQL
sudo apt install -y mysql-server

# Запуск и включение автозапуска
sudo systemctl start mysql
sudo systemctl enable mysql

# Безопасная настройка MySQL
sudo mysql_secure_installation
```

При настройке:
- Установите пароль для root
- Удалите анонимных пользователей: **Yes**
- Отключите удаленный вход root: **Yes**
- Удалите тестовую БД: **Yes**
- Перезагрузите таблицы привилегий: **Yes**

### 3. Установка PM2 (для управления процессами)

```bash
sudo npm install -g pm2
```

### 4. Установка Nginx (опционально, для reverse proxy)

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Настройка базы данных

### 1. Создание базы данных и пользователя

```bash
sudo mysql -u root -p
```

В MySQL консоли выполните:

```sql
-- Создание базы данных
CREATE DATABASE launcher_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Создание пользователя
CREATE USER 'launcher_user'@'localhost' IDENTIFIED BY 'your_strong_password_here';

-- Выдача привилегий
GRANT ALL PRIVILEGES ON launcher_db.* TO 'launcher_user'@'localhost';
FLUSH PRIVILEGES;

-- Проверка
SHOW DATABASES;
SELECT user, host FROM mysql.user WHERE user = 'launcher_user';

-- Выход
EXIT;
```

**Важно**: Замените `your_strong_password_here` на надежный пароль!

### 2. Проверка подключения

```bash
mysql -u launcher_user -p launcher_db
# Введите пароль, если подключилось - всё ок
EXIT;
```

---

## Клонирование и настройка проекта

### 1. Клонирование репозитория

```bash
cd /opt/launcher
sudo -u launcher git clone https://github.com/xuviga/LauncherSchool-sashok724-v3-Fork.git .
# Или если используете SSH ключ:
# sudo -u launcher git clone git@github.com:xuviga/LauncherSchool-sashok724-v3-Fork.git .
```

### 2. Установка зависимостей

```bash
cd /opt/launcher
sudo -u launcher npm install

# Сборка shared пакета
sudo -u launcher npm run build:shared
```

### 3. Настройка прав доступа

```bash
sudo chown -R launcher:launcher /opt/launcher
```

---

## Настройка Backend

### 1. Создание .env файла

```bash
cd /opt/launcher/packages/backend
sudo -u launcher cp .env.example .env  # Если есть пример
sudo -u launcher nano .env
```

Добавьте следующее содержимое:

```env
# Окружение
NODE_ENV=production

# Сервер
PORT=7240
HOST=0.0.0.0
CORS_ORIGIN=https://your-domain.com

# База данных
DATABASE_URL=mysql://launcher_user:your_strong_password_here@localhost:3306/launcher_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long_random_string
JWT_EXPIRY=24h

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=60000

# RSA Keys (будут созданы автоматически)
RSA_PUBLIC_KEY_PATH=/opt/launcher/packages/backend/keys/public.key
RSA_PRIVATE_KEY_PATH=/opt/launcher/packages/backend/keys/private.key

# Логирование
LOG_LEVEL=info
```

**Важно**: 
- Замените `your_strong_password_here` на пароль из MySQL
- Сгенерируйте надежный `JWT_SECRET` (минимум 32 символа)
- Замените `your-domain.com` на ваш домен

### 2. Генерация JWT секрета

```bash
# Генерация случайного секрета
openssl rand -base64 32
# Скопируйте результат в JWT_SECRET
```

### 3. Создание директорий

```bash
cd /opt/launcher/packages/backend
sudo -u launcher mkdir -p keys profiles updates uploads
```

### 4. Применение миграций базы данных

```bash
cd /opt/launcher/packages/backend

# Генерация Prisma Client
sudo -u launcher npm run generate

# Применение схемы к БД
sudo -u launcher npx prisma db push

# Или применение миграций (если используете миграции)
# sudo -u launcher npm run migrate
```

### 5. Создание тестовых данных

```bash
cd /opt/launcher/packages/backend

# Создание администратора
sudo -u launcher npm run create-user
# Введите: username, password, email

# Создание профиля сервера
sudo -u launcher npm run create-profile

# Скачивание клиента Minecraft (опционально)
sudo -u launcher npm run download-minecraft 1.20.4
```

### 6. Сборка Backend

```bash
cd /opt/launcher/packages/backend
sudo -u launcher npm run build
```

---

## Настройка Frontend

### 1. Создание .env файла

```bash
cd /opt/launcher/packages/frontend
sudo -u launcher nano .env
```

Добавьте:

```env
VITE_API_URL=https://your-domain.com
VITE_WS_URL=wss://your-domain.com
```

**Важно**: Замените `your-domain.com` на ваш домен или IP адрес.

### 2. Сборка Frontend

```bash
cd /opt/launcher/packages/frontend
sudo -u launcher npm run build
```

---

## Настройка systemd

### 1. Создание сервиса для Backend

```bash
sudo nano /etc/systemd/system/launcher-backend.service
```

Добавьте:

```ini
[Unit]
Description=Modern Launcher Backend Service
After=network.target mysql.service

[Service]
Type=simple
User=launcher
Group=launcher
WorkingDirectory=/opt/launcher/packages/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=launcher-backend

# Ограничения ресурсов
LimitNOFILE=65536
MemoryMax=2G

[Install]
WantedBy=multi-user.target
```

### 2. Запуск сервиса

```bash
# Перезагрузка systemd
sudo systemctl daemon-reload

# Запуск сервиса
sudo systemctl start launcher-backend

# Включение автозапуска
sudo systemctl enable launcher-backend

# Проверка статуса
sudo systemctl status launcher-backend

# Просмотр логов
sudo journalctl -u launcher-backend -f
```

### 3. Проверка работы

```bash
# Проверка что сервер отвечает
curl http://localhost:7240/health

# Должен вернуть:
# {"status":"ok","timestamp":"...","version":"1.0.0"}
```

---

## Настройка Nginx

### 1. Создание конфигурации

```bash
sudo nano /etc/nginx/sites-available/launcher
```

Добавьте:

```nginx
# HTTP -> HTTPS редирект
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Для Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS сервер
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL сертификаты (будут настроены позже)
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Логи
    access_log /var/log/nginx/launcher-access.log;
    error_log /var/log/nginx/launcher-error.log;

    # Максимальный размер загружаемых файлов
    client_max_body_size 100M;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:7240;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
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
        proxy_read_timeout 3600s;
    }

    # Статические файлы (uploads)
    location /uploads/ {
        proxy_pass http://localhost:7240;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Кеширование
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 2. Активация конфигурации

```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/launcher /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации (опционально)
sudo rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
```

**Важно**: Замените `your-domain.com` на ваш домен или IP адрес.

---

## Настройка SSL (Let's Encrypt)

### 1. Установка Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Получение сертификата

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Следуйте инструкциям:
- Введите email для уведомлений
- Согласитесь с условиями
- Выберите редирект HTTP -> HTTPS (рекомендуется)

### 3. Автоматическое обновление

Certbot автоматически настроит обновление сертификатов. Проверить можно:

```bash
sudo certbot renew --dry-run
```

### 4. Обновление Nginx конфигурации

После получения сертификата, Certbot автоматически обновит конфигурацию Nginx. Проверьте:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Развертывание обновлений лаунчера

### 1. Подготовка директории для файлов

```bash
sudo mkdir -p /var/www/launcher
sudo chown launcher:launcher /var/www/launcher
```

### 2. Настройка Nginx для раздачи файлов

Добавьте в конфигурацию Nginx:

```nginx
# Раздача файлов лаунчера
location /launcher/ {
    alias /var/www/launcher/;
    autoindex off;
    
    # Безопасность
    add_header X-Content-Type-Options "nosniff" always;
    
    # Кеширование
    expires 7d;
    add_header Cache-Control "public";
}
```

### 3. Загрузка файлов установщика

```bash
# Загрузите файлы установщика в директорию
sudo cp /path/to/Modern\ Launcher-1.0.134-Setup.exe /var/www/launcher/
sudo chown launcher:launcher /var/www/launcher/*

# Установите правильные права
sudo chmod 644 /var/www/launcher/*
```

### 4. Обновление информации в БД

```bash
cd /opt/launcher/packages/frontend
sudo -u launcher npm run update-launcher -- \
  --url "https://your-domain.com/launcher/Modern%20Launcher-1.0.134-Setup.exe" \
  --auto-find \
  --release-notes "Версия 1.0.134: Исправлены баги, улучшена производительность"
```

---

## Мониторинг и логирование

### 1. Просмотр логов Backend

```bash
# Systemd логи
sudo journalctl -u launcher-backend -f

# Последние 100 строк
sudo journalctl -u launcher-backend -n 100

# Логи за сегодня
sudo journalctl -u launcher-backend --since today
```

### 2. Просмотр логов Nginx

```bash
# Access лог
sudo tail -f /var/log/nginx/launcher-access.log

# Error лог
sudo tail -f /var/log/nginx/launcher-error.log
```

### 3. Мониторинг ресурсов

```bash
# Использование памяти и CPU
htop

# Использование диска
df -h

# Использование памяти процессами
ps aux --sort=-%mem | head
```

### 4. Настройка logrotate

```bash
sudo nano /etc/logrotate.d/launcher-backend
```

Добавьте:

```
/var/log/launcher/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 launcher launcher
    sharedscripts
    postrotate
        systemctl reload launcher-backend > /dev/null 2>&1 || true
    endscript
}
```

---

## Резервное копирование

### 1. Скрипт резервного копирования БД

```bash
sudo nano /opt/launcher/scripts/backup-db.sh
```

Добавьте:

```bash
#!/bin/bash

# Конфигурация
BACKUP_DIR="/opt/launcher/backups"
DB_NAME="launcher_db"
DB_USER="launcher_user"
DB_PASS="your_strong_password_here"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/launcher_db_$DATE.sql"

# Создание директории
mkdir -p $BACKUP_DIR

# Резервное копирование
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE

# Сжатие
gzip $BACKUP_FILE

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Сделайте исполняемым:

```bash
sudo chmod +x /opt/launcher/scripts/backup-db.sh
sudo chown launcher:launcher /opt/launcher/scripts/backup-db.sh
```

### 2. Настройка cron для автоматического бэкапа

```bash
sudo crontab -e -u launcher
```

Добавьте (бэкап каждый день в 2:00):

```
0 2 * * * /opt/launcher/scripts/backup-db.sh >> /var/log/launcher-backup.log 2>&1
```

### 3. Резервное копирование файлов

```bash
sudo nano /opt/launcher/scripts/backup-files.sh
```

Добавьте:

```bash
#!/bin/bash

BACKUP_DIR="/opt/launcher/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/files_$DATE.tar.gz"

mkdir -p $BACKUP_DIR

# Архивирование важных директорий
tar -czf $BACKUP_FILE \
    /opt/launcher/packages/backend/uploads \
    /opt/launcher/packages/backend/profiles \
    /opt/launcher/packages/backend/keys \
    /var/www/launcher

# Удаление старых бэкапов
find $BACKUP_DIR -name "files_*.tar.gz" -mtime +30 -delete

echo "Files backup completed: $BACKUP_FILE"
```

---

## Обновление проекта

### 1. Обновление кода

```bash
cd /opt/launcher
sudo -u launcher git pull origin main

# Установка новых зависимостей
sudo -u launcher npm install

# Пересборка shared
sudo -u launcher npm run build:shared
```

### 2. Обновление Backend

```bash
cd /opt/launcher/packages/backend

# Применение миграций БД (если есть)
sudo -u launcher npx prisma db push

# Пересборка
sudo -u launcher npm run build

# Перезапуск сервиса
sudo systemctl restart launcher-backend

# Проверка статуса
sudo systemctl status launcher-backend
```

### 3. Обновление Frontend

```bash
cd /opt/launcher/packages/frontend

# Пересборка
sudo -u launcher npm run build
```

---

## Решение проблем

### Проблема: Backend не запускается

```bash
# Проверка логов
sudo journalctl -u launcher-backend -n 50

# Проверка порта
sudo netstat -tlnp | grep 7240

# Проверка конфигурации
cd /opt/launcher/packages/backend
sudo -u launcher node dist/index.js
```

### Проблема: Ошибки подключения к БД

```bash
# Проверка MySQL
sudo systemctl status mysql

# Проверка подключения
mysql -u launcher_user -p launcher_db

# Проверка прав пользователя
mysql -u root -p
SELECT user, host FROM mysql.user WHERE user = 'launcher_user';
```

### Проблема: Nginx не проксирует запросы

```bash
# Проверка конфигурации
sudo nginx -t

# Проверка логов
sudo tail -f /var/log/nginx/launcher-error.log

# Проверка что backend работает
curl http://localhost:7240/health
```

### Проблема: SSL сертификат не работает

```bash
# Проверка сертификата
sudo certbot certificates

# Обновление сертификата
sudo certbot renew

# Проверка конфигурации Nginx
sudo nginx -t
```

### Проблема: Недостаточно памяти

```bash
# Проверка использования
free -h

# Добавление swap (если нужно)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Сделать постоянным
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Безопасность

### 1. Настройка fail2ban

```bash
sudo apt install -y fail2ban

# Создание конфигурации для SSH
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

### 2. Регулярные обновления

```bash
# Настройка автоматических обновлений безопасности
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Ограничение доступа к MySQL

Убедитесь, что MySQL слушает только localhost:

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Проверьте:
```
bind-address = 127.0.0.1
```

### 4. Firewall правила

```bash
# Проверка правил
sudo ufw status verbose

# Разрешить только необходимые порты
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## Проверочный список развертывания

- [ ] Система обновлена
- [ ] Node.js 18+ установлен
- [ ] MySQL установлен и настроен
- [ ] База данных создана
- [ ] Пользователь БД создан
- [ ] Проект клонирован
- [ ] Зависимости установлены
- [ ] Backend .env настроен
- [ ] Frontend .env настроен
- [ ] Миграции применены
- [ ] Backend собран
- [ ] Frontend собран
- [ ] Systemd сервис создан и запущен
- [ ] Nginx настроен
- [ ] SSL сертификат установлен
- [ ] Firewall настроен
- [ ] Резервное копирование настроено
- [ ] Мониторинг настроен

---

## Полезные команды

```bash
# Перезапуск всех сервисов
sudo systemctl restart launcher-backend nginx mysql

# Просмотр логов в реальном времени
sudo journalctl -u launcher-backend -f

# Проверка использования ресурсов
sudo systemctl status launcher-backend

# Проверка подключений к БД
mysql -u launcher_user -p launcher_db -e "SHOW PROCESSLIST;"

# Очистка логов
sudo journalctl --vacuum-time=7d
```

---

## Поддержка

При возникновении проблем:
1. Проверьте логи: `sudo journalctl -u launcher-backend -n 100`
2. Проверьте статус сервисов: `sudo systemctl status launcher-backend`
3. Проверьте конфигурацию: `sudo nginx -t`
4. Проверьте подключение к БД: `mysql -u launcher_user -p launcher_db`

---

## Дополнительные скрипты

### Скрипт автоматического развертывания

```bash
sudo /opt/launcher/packages/backend/scripts/deploy.sh
```

Этот скрипт автоматически:
- Обновляет код из Git
- Устанавливает зависимости
- Собирает все пакеты
- Применяет миграции БД
- Перезапускает сервисы

### Скрипт проверки здоровья

```bash
sudo /opt/launcher/packages/backend/scripts/health-check.sh
```

Проверяет:
- Статус API
- Статус MySQL
- Подключение к БД
- Статус systemd сервисов
- Использование ресурсов

### Настройка cron для автоматических проверок

```bash
sudo crontab -e
```

Добавьте:
```
# Проверка здоровья каждые 5 минут
*/5 * * * * /opt/launcher/packages/backend/scripts/health-check.sh >> /var/log/launcher-health.log 2>&1
```

---

## Оптимизация производительности

### 1. Настройка MySQL

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Добавьте/измените:
```ini
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
query_cache_size = 64M
query_cache_type = 1
```

Перезапустите MySQL:
```bash
sudo systemctl restart mysql
```

### 2. Настройка Node.js

Для production используйте переменные окружения:

```bash
sudo nano /etc/systemd/system/launcher-backend.service
```

Добавьте в секцию `[Service]`:
```ini
Environment=NODE_OPTIONS="--max-old-space-size=2048"
```

### 3. Кеширование в Nginx

Добавьте в конфигурацию Nginx:
```nginx
# Кеширование статических файлов
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    # ... остальные настройки
}
```

---

## Масштабирование

### Горизонтальное масштабирование

Для увеличения нагрузки можно запустить несколько экземпляров backend:

1. Измените порты в `.env` для каждого экземпляра
2. Создайте отдельные systemd сервисы
3. Настройте load balancer в Nginx:

```nginx
upstream backend {
    least_conn;
    server localhost:7240;
    server localhost:7241;
    server localhost:7242;
}

location /api/ {
    proxy_pass http://backend;
    # ... остальные настройки
}
```

### Вертикальное масштабирование

Увеличьте ресурсы сервера:
- RAM: минимум 4 GB для production
- CPU: 4+ ядра для высокой нагрузки
- Диск: SSD рекомендуется для БД

---

## Мониторинг с помощью PM2 (альтернатива systemd)

Если предпочитаете PM2:

```bash
# Установка PM2
sudo npm install -g pm2

# Запуск backend
cd /opt/launcher/packages/backend
sudo -u launcher pm2 start dist/index.js --name launcher-backend

# Сохранение конфигурации
sudo -u launcher pm2 save
sudo -u launcher pm2 startup systemd -u launcher --hp /opt/launcher
```

---

## Безопасность: Дополнительные меры

### 1. Ограничение доступа к SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Измените:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

### 2. Настройка fail2ban для защиты API

```bash
sudo nano /etc/fail2ban/jail.local
```

Добавьте:
```ini
[launcher-api]
enabled = true
port = 7240
filter = launcher-api
logpath = /var/log/launcher-backend.log
maxretry = 5
bantime = 3600
```

### 3. Регулярные обновления безопасности

```bash
# Настройка автоматических обновлений
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Troubleshooting: Расширенная диагностика

### Проверка производительности БД

```sql
-- Медленные запросы
SHOW VARIABLES LIKE 'slow_query_log';
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Активные соединения
SHOW PROCESSLIST;

-- Статистика таблиц
SELECT table_name, table_rows, data_length, index_length 
FROM information_schema.tables 
WHERE table_schema = 'launcher_db';
```

### Анализ логов

```bash
# Поиск ошибок в логах
sudo journalctl -u launcher-backend | grep -i error

# Статистика запросов
sudo tail -f /var/log/nginx/launcher-access.log | awk '{print $1}' | sort | uniq -c | sort -rn
```

### Проверка сетевых соединений

```bash
# Активные соединения
sudo netstat -tulpn | grep 7240

# Проверка портов
sudo ss -tlnp | grep 7240
```

---

## Чеклист production-ready развертывания

- [ ] Все сервисы настроены и запущены
- [ ] SSL сертификат установлен и обновляется автоматически
- [ ] Firewall настроен правильно
- [ ] Резервное копирование настроено и тестировано
- [ ] Мониторинг настроен
- [ ] Логи ротируются
- [ ] Автоматические обновления безопасности включены
- [ ] Fail2ban настроен
- [ ] Производительность оптимизирована
- [ ] Документация обновлена
- [ ] Тестовые данные удалены
- [ ] Пароли изменены с дефолтных
- [ ] SSH ключи настроены
- [ ] Health checks работают

---

## Полезные ссылки

- [Node.js документация](https://nodejs.org/docs/)
- [MySQL документация](https://dev.mysql.com/doc/)
- [Nginx документация](https://nginx.org/en/docs/)
- [Let's Encrypt документация](https://letsencrypt.org/docs/)
- [systemd документация](https://www.freedesktop.org/software/systemd/man/)

---

**Документация обновлена**: 2025-01-23  
**Версия**: 1.0.0  
**Для**: Debian 11/12

