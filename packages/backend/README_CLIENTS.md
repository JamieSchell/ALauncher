# Настройка игровых клиентов для ALauncher

## Обзор

ALauncher поддерживает несколько типов игровых клиентов:
- **Vanilla** - Чистый Minecraft без модов
- **Forge** - Minecraft с поддержкой модов Forge
- **Fabric** - Minecraft с поддержкой модов Fabric

## Структура файлов

```
updates/
├── assets/                 # Ассеты Minecraft (текстуры, звуки и т.д.)
│   ├── 1.12/              # Ассеты для версий 1.12.x
│   └── 1.20/              # Ассеты для версий 1.20.x
├── minecraft-1.12.2/      # Клиент Vanilla 1.12.2
│   ├── client.jar         # <-- Главный jar файл клиента
│   ├── libraries/         # Библиотеки Minecraft
│   └── mods/              # Моды (если используются)
└── minecraft-1.12.2-forge/ # Клиент Forge 1.12.2
    ├── client.jar         # <-- Главный jar файл клиента
    ├── libraries/         # Библиотеки + Forge
    └── mods/              # Моды
```

## Быстрая настройка

1. **Запустите автоматический скрипт:**
   ```bash
   cd /opt/ALauncher/packages/backend
   ./scripts/setup-client-profiles.sh
   ```

2. **Скачайте файлы клиентов** (см. ниже инструкции)

3. **Синхронизируйте файлы с базой данных:**
   ```bash
   npm run cli profile sync <profile-id>
   ```

## Скачивание клиентов

### Вариант 1: Использование CLI (Рекомендуется)

```bash
# Скачать и автоматически настроить клиент
npm run cli client download "My Vanilla" Vanilla 1.12.2

# Скачать Forge клиент
npm run cli client download "My Forge" Forge 1.12.2

# Скачать клиент для конкретного сервера
npm run cli client download "Server Client" Vanilla 1.20.1 192.168.1.100 25565
```

### Вариант 2: Ручная настройка

#### 1. Minecraft Vanilla 1.12.2

1. Скачайте Minecraft 1.12.2 клиент:
   - Используйте Minecraft Launcher от Mojang
   - Или скачайте с официальных источников

2. Скопируйте файлы:
   ```bash
   # Копируйте client.jar из .minecraft/versions/1.12.2/
   cp ~/.minecraft/versions/1.12.2/1.12.2.jar \
      /opt/ALauncher/packages/backend/updates/minecraft-1.12.2/client.jar

   # Копируйте библиотеки
   cp -r ~/.minecraft/libraries/* \
      /opt/ALauncher/packages/backend/updates/minecraft-1.12.2/libraries/
   ```

#### 2. Minecraft Forge 1.12.2

1. Установите Forge:
   - Скачайте Forge installer с https://files.minecraftforge.net/net/minecraftforge/forge/
   - Рекомендуемая версия: 1.12.2-14.23.5.2860
   - Запустите installer для установки

2. Скопируйте файлы:
   ```bash
   # Копируйте client.jar (Forge-версия)
   cp ~/.minecraft/versions/1.12.2-forge-*/1.12.2-forge-*.jar \
      /opt/ALauncher/packages/backend/updates/minecraft-1.12.2-forge/client.jar

   # Копируйте библиотеки (включая Forge)
   cp -r ~/.minecraft/libraries/* \
      /opt/ALauncher/packages/backend/updates/minecraft-1.12.2-forge/libraries/

   # Скопируйте Forge JAR если он отдельный
   cp ~/.minecraft/libraries/net/minecraftforge/forge/*/forge-*.jar \
      /opt/ALauncher/packages/backend/updates/minecraft-1.12.2-forge/libraries/
   ```

## Скачивание ассетов

Ассеты (текстуры, звуки и т.д.) скачиваются автоматически при создании профиля.

Для ручной загрузки:
```bash
npm run cli assets download 1.12.2
npm run cli assets download 1.20.4
```

## Управление профилями

### CLI команды

```bash
# Показать все профили
npm run cli profile list

# Информация о профиле
npm run cli profile info <profile-id>

# Создать новый профиль
npm run cli profile add "Название" Forge 1.12.2

# Синхронизировать файлы
npm run cli profile sync <profile-id>

# Установить версию Java
npm run cli profile set-jvm <profile-id> 8

# Включить/Отключить профиль
npm run cli profile enable <profile-id>
npm run cli profile disable <profile-id>
```

### Скрипты

```bash
# Показать все профили
npm run list-profiles

# Создать преднастроенные профили
npm run create-profile-1.12.2              # Vanilla 1.12.2
npm run create-profile-1.12.2-forge         # Forge 1.12.2
npm run create-profile-1.21                 # Vanilla 1.21

# Скачать Minecraft (если настроено)
npm run download-minecraft
```

## Добавление модов

1. Для Forge/Fabric профилей:
   ```bash
   # Создайте папку для модов
   mkdir -p updates/minecraft-1.12.2-forge/mods

   # Скопируйте JAR файлы модов
   cp *.jar updates/minecraft-1.12.2-forge/mods/
   ```

2. Активируйте профиль в лаунчере, чтобы моды загружались

## Настройка сервера

При создании профиля можно указать адрес сервера:
```bash
npm run cli profile add "My Server" Vanilla 1.12.2 192.168.1.100 25565
```

Или изменить позже через базу данных:
```sql
UPDATE "ClientProfile"
SET "serverAddress" = 'your-server.com',
    "serverPort" = 25565
WHERE "title" = 'Your Profile Name';
```

## Проверка

1. Проверьте профили:
   ```bash
   npm run list-profiles
   ```

2. Проверьте файлы:
   ```bash
   ls -la updates/minecraft-1.12.2/
   ls -la updates/minecraft-1.12.2-forge/
   ```

3. Проверьте ассеты:
   ```bash
   npm run cli assets check 1.12.2
   ```

## Поиск ошибок

Если клиент не запускается:
1. Проверьте логи в лаунчере
2. Убедитесь, что все файлы на месте
3. Проверьте версию Java (`profile set-jvm`)
4. Убедитесь, что Forge/Fabric правильно установлен

## Дополнительные ресурсы

- Forge: https://files.minecraftforge.net/
- Fabric: https://fabricmc.net/use/
- Minecraft Wiki: https://minecraft.fandom.com/wiki/Version_history/Java_Edition