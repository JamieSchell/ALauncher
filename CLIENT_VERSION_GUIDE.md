# 📦 Руководство по созданию клиентских версий для игроков

Подробное руководство по подготовке и добавлению клиентских версий Minecraft в лаунчер.

---

## 📋 Содержание

1. [Подготовка клиентских файлов](#подготовка-клиентских-файлов)
2. [Скачивание Minecraft клиента](#скачивание-minecraft-клиента)
3. [Добавление версии в базу данных](#добавление-версии-в-базу-данных)
4. [Добавление файлов клиента](#добавление-файлов-клиента)
5. [Настройка путей для скачивания](#настройка-путей-для-скачивания)
6. [Тестирование](#тестирование)

---

## 🎮 Подготовка клиентских файлов

### Вариант 1: Автоматическое скачивание (рекомендуется)

Используйте встроенный скрипт для скачивания всех необходимых файлов:

```bash
cd /opt/launcher/packages/backend

# Скачиваем клиент Minecraft версии 1.20.4
npm run download-minecraft 1.20.4

# Скрипт автоматически:
# - Скачает client.jar
# - Скачает все библиотеки (libraries)
# - Скачает ресурсы (assets)
# - Сохранит все в директорию updates/1.20.4/
```

### Вариант 2: Ручная подготовка

Если у вас уже есть файлы клиента:

```bash
# Создайте структуру директорий
mkdir -p /opt/launcher/packages/backend/updates/1.20.4
mkdir -p /opt/launcher/packages/backend/updates/1.20.4/libraries
mkdir -p /opt/launcher/packages/backend/updates/1.20.4/assets

# Скопируйте файлы:
# - client.jar → updates/1.20.4/client.jar
# - libraries/* → updates/1.20.4/libraries/
# - assets/* → updates/1.20.4/assets/
```

---

## 📥 Скачивание Minecraft клиента

### Использование скрипта download-minecraft

```bash
cd /opt/launcher/packages/backend

# Базовое использование
npm run download-minecraft <версия>

# Примеры:
npm run download-minecraft 1.20.4
npm run download-minecraft 1.19.2
npm run download-minecraft 1.12.2
```

### Что скачивает скрипт:

1. **client.jar** - основной файл клиента Minecraft
2. **libraries/** - все необходимые библиотеки (LWJGL, Log4j, и т.д.)
3. **assets/** - ресурсы игры (текстуры, звуки, шрифты)
4. **version.json** - метаданные версии

### Структура после скачивания:

```
updates/1.20.4/
├── client.jar
├── version.json
├── libraries/
│   ├── com/
│   ├── net/
│   ├── org/
│   └── ...
└── assets/
    ├── indexes/
    └── objects/
```

---

## 💾 Добавление версии в базу данных

### Шаг 1: Добавление основной информации о версии

```bash
cd /opt/launcher/packages/backend

# Используйте скрипт add-client-version
npm run add-client-version <version> <title> <clientJarPath> <mainClass>

# Пример:
npm run add-client-version \
  1.20.4 \
  "Vanilla 1.20.4" \
  "./updates/1.20.4/client.jar" \
  "net.minecraft.client.main.Main"
```

### Параметры:

- **version**: версия Minecraft (например, `1.20.4`)
- **title**: отображаемое название (например, `"Vanilla 1.20.4"`)
- **clientJarPath**: путь к client.jar (относительно `packages/backend/`)
- **mainClass**: главный класс для запуска (обычно `net.minecraft.client.main.Main`)

### Шаг 2: Проверка добавленной версии

```bash
# Откройте Prisma Studio для просмотра
npx prisma studio

# Или используйте MySQL напрямую
mysql -u launcher_user -p launcher_db
SELECT * FROM ClientVersion WHERE version = '1.20.4';
```

---

## 📁 Добавление файлов клиента

После добавления версии нужно добавить все файлы, которые будут скачиваться игроками.

### Вариант 1: Через API (программно)

Используйте API endpoint для добавления файлов:

```bash
# Пример добавления client.jar
curl -X POST http://localhost:7240/api/client-versions/1.20.4/files \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "path": "client.jar",
    "hash": "sha256_hash_here",
    "size": 12345678,
    "type": "jar",
    "downloadUrl": "http://your-domain.com:7240/api/client-versions/1.20.4/files/client.jar"
  }'
```

### Вариант 2: Через Prisma Studio (визуально)

1. Откройте Prisma Studio: `npx prisma studio`
2. Перейдите в таблицу `ClientFile`
3. Нажмите "Add record"
4. Заполните поля:
   - `versionId`: ID версии из таблицы `ClientVersion`
   - `path`: путь к файлу (например, `client.jar` или `libraries/com/mojang/...`)
   - `hash`: SHA256 хеш файла
   - `size`: размер файла в байтах
   - `type`: тип файла (`jar`, `library`, `asset`, `native`)
   - `downloadUrl`: URL для скачивания

### Вариант 3: Через скрипт (если есть)

```bash
# Если есть скрипт для добавления файлов
npm run add-client-files <versionId>
```

### Вычисление хешей файлов

```bash
# Для Linux/Mac
sha256sum updates/1.20.4/client.jar

# Для Windows (PowerShell)
Get-FileHash -Path "updates\1.20.4\client.jar" -Algorithm SHA256
```

---

## 🔗 Настройка путей для скачивания

### Вариант 1: Использование API endpoints

Backend автоматически предоставляет endpoints для скачивания файлов:

```
GET /api/client-versions/:versionId/files/:filePath
GET /api/client-versions/version/:version/files/:filePath
```

Примеры URL:
- `http://your-domain.com:7240/api/client-versions/version/1.20.4/files/client.jar`
- `http://your-domain.com:7240/api/client-versions/version/1.20.4/files/libraries/com/mojang/...`

### Вариант 2: Прямые ссылки на файлы

Если файлы раздаются через Nginx или другой веб-сервер:

```nginx
# В конфигурации Nginx
location /client-files/ {
    alias /opt/launcher/packages/backend/updates/;
    autoindex off;
}
```

Тогда URL будет:
- `http://your-domain.com/client-files/1.20.4/client.jar`

### Настройка downloadUrl в базе данных

Обновите поле `downloadUrl` в таблице `ClientFile`:

```sql
UPDATE ClientFile 
SET downloadUrl = 'http://your-domain.com:7240/api/client-versions/version/1.20.4/files/client.jar'
WHERE versionId = 'version-id' AND path = 'client.jar';
```

---

## ✅ Тестирование

### 1. Проверка доступности файлов

```bash
# Проверка через curl
curl -I http://localhost:7240/api/client-versions/version/1.20.4/files/client.jar

# Должен вернуть HTTP 200 OK
```

### 2. Проверка через лаунчер

1. Запустите лаунчер
2. Выберите профиль с версией 1.20.4
3. Нажмите "Launch Game" или "Download & Launch"
4. Проверьте, что файлы скачиваются корректно

### 3. Проверка логов

```bash
# Логи backend сервера
pm2 logs launcher-backend

# Или
tail -f /var/log/launcher-backend.log
```

### 4. Проверка базы данных

```bash
# Проверка версий
mysql -u launcher_user -p launcher_db
SELECT id, version, title, enabled FROM ClientVersion;

# Проверка файлов
SELECT versionId, path, size, type FROM ClientFile WHERE versionId = 'version-id';
```

---

## 📝 Пример полного процесса

### Создание версии 1.20.4 с нуля:

```bash
# 1. Переходим в директорию backend
cd /opt/launcher/packages/backend

# 2. Скачиваем файлы Minecraft
npm run download-minecraft 1.20.4

# 3. Добавляем версию в БД
npm run add-client-version \
  1.20.4 \
  "Vanilla 1.20.4" \
  "./updates/1.20.4/client.jar" \
  "net.minecraft.client.main.Main"

# 4. Получаем ID версии
npx prisma studio
# Или через MySQL:
mysql -u launcher_user -p launcher_db -e "SELECT id FROM ClientVersion WHERE version = '1.20.4';"

# 5. Добавляем файлы (через Prisma Studio или API)
# - client.jar
# - Все библиотеки из libraries/
# - Ресурсы из assets/ (опционально)

# 6. Проверяем доступность
curl http://localhost:7240/api/client-versions/version/1.20.4/files/client.jar
```

---

## 🔧 Дополнительные настройки

### Настройка JVM аргументов

Для разных версий Minecraft могут потребоваться разные JVM аргументы:

```sql
-- Обновление JVM аргументов для версии
UPDATE ClientVersion 
SET jvmArgs = JSON_ARRAY(
  '-XX:+UseG1GC',
  '-Xmx2G',
  '-Xms1G'
)
WHERE version = '1.20.4';
```

### Настройка аргументов клиента

```sql
-- Обновление аргументов клиента
UPDATE ClientVersion 
SET clientArgs = JSON_ARRAY(
  '--username',
  '${username}',
  '--version',
  '${version}'
)
WHERE version = '1.20.4';
```

### Включение/отключение версии

```sql
-- Отключить версию (скрыть от игроков)
UPDATE ClientVersion SET enabled = false WHERE version = '1.20.4';

-- Включить версию
UPDATE ClientVersion SET enabled = true WHERE version = '1.20.4';
```

---

## 🐛 Решение проблем

### Файлы не скачиваются

1. Проверьте права доступа: `chmod -R 755 updates/`
2. Проверьте пути в базе данных
3. Проверьте, что файлы существуют на диске
4. Проверьте логи сервера

### Ошибки хешей

1. Пересчитайте хеши файлов
2. Обновите хеши в базе данных
3. Убедитесь, что используется SHA256

### Версия не отображается в лаунчере

1. Проверьте, что `enabled = true` в БД
2. Проверьте API endpoint: `GET /api/client-versions`
3. Проверьте логи frontend

---

## 📚 Полезные команды

```bash
# Список всех версий
mysql -u launcher_user -p launcher_db -e "SELECT version, title, enabled FROM ClientVersion;"

# Количество файлов для версии
mysql -u launcher_user -p launcher_db -e "SELECT COUNT(*) FROM ClientFile WHERE versionId = 'version-id';"

# Размер всех файлов версии
mysql -u launcher_user -p launcher_db -e "SELECT SUM(size) as total_size FROM ClientFile WHERE versionId = 'version-id';"

# Открыть Prisma Studio
npx prisma studio
```

---

**Готово! Теперь игроки могут скачивать и запускать ваши клиентские версии! 🎮**

