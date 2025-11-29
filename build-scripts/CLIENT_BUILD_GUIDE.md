# Руководство по сборке клиентов для Modern Minecraft Launcher

Это руководство описывает процесс подготовки и сборки клиентов Minecraft для различных версий и модлоадеров (Vanilla, Forge, Fabric).

## Содержание

1. [Общая структура](#общая-структура)
2. [Подготовка профиля](#подготовка-профиля)
3. [Сборка Vanilla клиента](#сборка-vanilla-клиента)
4. [Сборка Forge клиента](#сборка-forge-клиента)
5. [Сборка Fabric клиента](#сборка-fabric-клиента)
6. [Синхронизация файлов](#синхронизация-файлов)
7. [Примеры для разных версий](#примеры-для-разных-версий)
8. [Часто задаваемые вопросы](#часто-задаваемые-вопросы)

---

## Общая структура

Все клиенты хранятся в папке `updates/` с именем профиля (например, `updates/hitech/`, `updates/hipower/`).

### Структура папки клиента:

```
updates/
└── <profile-name>/          # Имя папки = clientDirectory из профиля
    ├── client.jar           # Основной файл клиента (обязательно)
    ├── version.json         # Метаданные версии (опционально)
    ├── libraries/           # Библиотеки Minecraft и модлоадеров
    │   ├── net/
    │   │   └── minecraft/
    │   │       └── ...
    │   └── ...
    ├── mods/                # Моды (для Forge/Fabric)
    │   └── ...
    ├── assets/              # Ресурсы (текстуры, звуки и т.д.)
    │   ├── indexes/
    │   ├── objects/
    │   └── ...
    └── natives/             # Нативные библиотеки (опционально)
        └── ...
```

---

## Подготовка профиля

### 1. Создание профиля через CLI

```bash
# Для Forge клиента
profile add "HiTech" Forge 1.12.2

# Для Fabric клиента
profile add "HiPower" Fabric 1.20.1

# Для Vanilla клиента
profile add "Vanilla Server" Vanilla 1.21.0
```

### 2. Проверка созданного профиля

```bash
profile list
profile info <profile-id>
```

Обратите внимание на поле `Client Directory` - это имя папки, где должны храниться файлы клиента.

### 3. Создание папки для файлов

```bash
mkdir -p /opt/launcher/packages/backend/updates/<client-directory>
```

Например:
```bash
mkdir -p /opt/launcher/packages/backend/updates/hitech
```

---

## Сборка Vanilla клиента

Vanilla клиент - это стандартный клиент Minecraft без модлоадеров.

### Шаги:

1. **Скачайте официальный клиент Minecraft**

   Используйте официальный launcher или скачайте с [minecraft.net](https://www.minecraft.net/).

2. **Извлеките файлы клиента**

   Из папки `.minecraft/versions/<version>/` скопируйте:
   - `<version>.jar` → переименуйте в `client.jar`
   - Папку `libraries/` (со всем содержимым)
   - Папку `assets/` (если нужны ресурсы)

3. **Разместите файлы**

   ```
   updates/<profile-name>/
   ├── client.jar
   ├── libraries/
   └── assets/          # Опционально, можно использовать общую папку
   ```

4. **Синхронизируйте с базой данных**

   ```bash
   profile sync <profile-id>
   ```

### Пример для версии 1.21.0:

```bash
# 1. Создайте профиль
profile add "Vanilla 1.21" Vanilla 1.21.0

# 2. Создайте папку
mkdir -p updates/vanilla_1_21

# 3. Скопируйте файлы из .minecraft/versions/1.21/
cp ~/.minecraft/versions/1.21/1.21.jar updates/vanilla_1_21/client.jar
cp -r ~/.minecraft/libraries updates/vanilla_1_21/

# 4. Синхронизируйте
profile sync <profile-id>
```

---

## Сборка Forge клиента

Forge - популярный модлоадер для Minecraft.

### Шаги:

1. **Скачайте Forge Installer**

   С официального сайта [files.minecraftforge.net](https://files.minecraftforge.net/):
   - Выберите версию Minecraft (например, 1.12.2)
   - Скачайте Installer (рекомендуется) или Universal

2. **Установите Forge**

   ```bash
   # Для версии 1.12.2
   java -jar forge-1.12.2-14.23.5.2860-installer.jar --installServer
   ```

   Или используйте клиентскую установку через официальный launcher.

3. **Извлеките файлы**

   Из папки `.minecraft/versions/<version>-forge-<forge-version>/`:
   - `<version>-forge-<forge-version>.jar` → переименуйте в `client.jar`
   - Папку `libraries/` (включая Forge библиотеки)
   - Папку `mods/` (если есть моды)

4. **Разместите файлы**

   ```
   updates/<profile-name>/
   ├── client.jar
   ├── libraries/
   │   ├── net/
   │   │   └── minecraftforge/
   │   │       └── forge/
   │   │           └── 1.12.2-14.23.5.2860/
   │   │               └── forge-1.12.2-14.23.5.2860.jar
   │   └── ...
   ├── mods/
   │   └── ...
   └── assets/
   ```

5. **Синхронизируйте с базой данных**

   ```bash
   profile sync <profile-id>
   ```

### Пример для Forge 1.12.2:

```bash
# 1. Создайте профиль
profile add "HiTech" Forge 1.12.2

# 2. Создайте папку
mkdir -p updates/hitech

# 3. Установите Forge через официальный launcher
# Или скачайте и установите вручную

# 4. Скопируйте файлы
cp ~/.minecraft/versions/1.12.2-forge-14.23.5.2860/1.12.2-forge-14.23.5.2860.jar \
   updates/hitech/client.jar
cp -r ~/.minecraft/libraries updates/hitech/
cp -r ~/.minecraft/mods updates/hitech/  # Если есть моды

# 5. Синхронизируйте
profile sync <profile-id>
```

### Важные замечания для Forge:

- **Версия 1.12.2**: Использует `net.minecraft.launchwrapper.Launch` как main class
- **Версия 1.16+**: Использует `cpw.mods.bootstraplauncher.BootstrapLauncher`
- Убедитесь, что все Forge библиотеки находятся в `libraries/net/minecraftforge/forge/`

---

## Сборка Fabric клиента

Fabric - современный модлоадер с хорошей производительностью.

### Шаги:

1. **Скачайте Fabric Loader**

   С официального сайта [fabricmc.net](https://fabricmc.net/):
   - Выберите версию Minecraft
   - Скачайте Fabric Installer

2. **Установите Fabric**

   ```bash
   java -jar fabric-installer-<version>.jar client
   ```

   Или используйте официальный launcher с Fabric Installer.

3. **Извлеките файлы**

   Из папки `.minecraft/versions/fabric-loader-<loader-version>-<mc-version>/`:
   - `fabric-loader-<loader-version>-<mc-version>.jar` → переименуйте в `client.jar`
   - Папку `libraries/` (включая Fabric библиотеки)
   - Папку `mods/` (если есть моды)

4. **Разместите файлы**

   ```
   updates/<profile-name>/
   ├── client.jar
   ├── libraries/
   │   ├── net/
   │   │   └── fabricmc/
   │   │       └── ...
   │   └── ...
   ├── mods/
   │   └── ...
   └── assets/
   ```

5. **Синхронизируйте с базой данных**

   ```bash
   profile sync <profile-id>
   ```

### Пример для Fabric 1.20.1:

```bash
# 1. Создайте профиль
profile add "HiPower" Fabric 1.20.1

# 2. Создайте папку
mkdir -p updates/hipower

# 3. Установите Fabric через официальный launcher
# Или используйте Fabric Installer

# 4. Скопируйте файлы
cp ~/.minecraft/versions/fabric-loader-0.14.22-1.20.1/fabric-loader-0.14.22-1.20.1.jar \
   updates/hipower/client.jar
cp -r ~/.minecraft/libraries updates/hipower/
cp -r ~/.minecraft/mods updates/hipower/  # Если есть моды

# 5. Синхронизируйте
profile sync <profile-id>
```

### Важные замечания для Fabric:

- Fabric требует Java 17+ для версий 1.17+
- Убедитесь, что все Fabric библиотеки находятся в `libraries/net/fabricmc/`
- Fabric API должен быть в папке `mods/` для работы большинства модов

---

## Синхронизация файлов

После размещения файлов в папке профиля, их нужно синхронизировать с базой данных.

### Автоматическая синхронизация

Система автоматически отслеживает изменения в папке `updates/` и синхронизирует файлы при:
- Добавлении новых файлов
- Изменении существующих файлов
- Удалении файлов

### Ручная синхронизация

```bash
# Синхронизировать файлы профиля
profile sync <profile-id>

# Или синхронизировать по версии (для обратной совместимости)
version sync <version>
```

### Проверка синхронизации

```bash
# Просмотр статистики синхронизации
version stats <version>

# Просмотр списка файлов
file list <version>

# Проверка целостности файлов
version verify <version>
```

---

## Примеры для разных версий

### Forge 1.12.2 (Legacy)

```bash
# 1. Создание профиля
profile add "Legacy Forge" Forge 1.12.2

# 2. Подготовка папки
mkdir -p updates/legacy_forge

# 3. Файлы для копирования:
# - client.jar (из 1.12.2-forge-14.23.5.2860)
# - libraries/ (включая net/minecraftforge/forge/1.12.2-14.23.5.2860/)
# - mods/ (если есть)

# 4. Синхронизация
profile sync <profile-id>
```

### Forge 1.20.1 (Modern)

```bash
# 1. Создание профиля
profile add "Modern Forge" Forge 1.20.1

# 2. Подготовка папки
mkdir -p updates/modern_forge

# 3. Файлы для копирования:
# - client.jar (из 1.20.1-forge-47.1.0)
# - libraries/ (включая net/minecraftforge/forge/1.20.1-47.1.0/)
# - mods/ (если есть)

# 4. Синхронизация
profile sync <profile-id>
```

### Fabric 1.20.1

```bash
# 1. Создание профиля
profile add "Fabric Client" Fabric 1.20.1

# 2. Подготовка папки
mkdir -p updates/fabric_client

# 3. Файлы для копирования:
# - client.jar (из fabric-loader-0.14.22-1.20.1)
# - libraries/ (включая net/fabricmc/)
# - mods/ (включая fabric-api)

# 4. Синхронизация
profile sync <profile-id>
```

### Vanilla 1.21.0

```bash
# 1. Создание профиля
profile add "Latest Vanilla" Vanilla 1.21.0

# 2. Подготовка папки
mkdir -p updates/latest_vanilla

# 3. Файлы для копирования:
# - client.jar (из 1.21.jar)
# - libraries/ (стандартные библиотеки Minecraft)

# 4. Синхронизация
profile sync <profile-id>
```

---

## Часто задаваемые вопросы

### Q: Как узнать, какие файлы нужны для клиента?

A: Используйте официальный launcher Minecraft для установки нужной версии, затем скопируйте файлы из папки `.minecraft/versions/<version>/`.

### Q: Можно ли использовать одну папку `libraries/` для нескольких профилей?

A: Нет, каждый профиль должен иметь свою папку `libraries/` в своей директории. Это необходимо для правильной работы системы синхронизации и проверки целостности.

### Q: Что делать, если файлы не синхронизируются?

A: 
1. Проверьте, что папка существует: `ls -la updates/<profile-name>`
2. Убедитесь, что `client.jar` присутствует
3. Проверьте права доступа к файлам
4. Запустите ручную синхронизацию: `profile sync <profile-id>`

### Q: Как добавить моды в клиент?

A: 
1. Поместите `.jar` файлы модов в папку `updates/<profile-name>/mods/`
2. Убедитесь, что моды совместимы с версией Minecraft и модлоадером
3. Запустите синхронизацию: `profile sync <profile-id>`

### Q: Можно ли использовать общую папку `assets/`?

A: Да, можно использовать общую папку `updates/assets/` для всех профилей. В этом случае укажите `assetIndex` в профиле, и система будет использовать общую папку.

### Q: Как проверить целостность файлов?

A: Используйте команду:
```bash
version verify <version>
```

Это проверит все файлы версии и сравнит их хеши с базой данных.

### Q: Что делать, если клиент не запускается?

A: 
1. Проверьте логи лаунчера
2. Убедитесь, что все необходимые библиотеки присутствуют
3. Проверьте версию Java (должна соответствовать требованиям версии Minecraft)
4. Проверьте целостность файлов: `version verify <version>`

### Q: Как обновить клиент?

A: 
1. Замените файлы в папке `updates/<profile-name>/`
2. Запустите синхронизацию: `profile sync <profile-id>`
3. Система автоматически обновит информацию в базе данных

### Q: Можно ли использовать кастомные моды и библиотеки?

A: Да, просто поместите их в соответствующие папки (`mods/` или `libraries/`) и синхронизируйте.

---

## Полезные команды CLI

```bash
# Список всех профилей
profile list

# Информация о профиле
profile info <profile-id>

# Создание профиля
profile add "<title>" <loader> <version> [server] [port]

# Синхронизация файлов профиля
profile sync <profile-id>

# Список версий
version list

# Информация о версии
version info <version>

# Синхронизация версии
version sync <version>

# Проверка целостности
version verify <version>

# Статистика синхронизации
version stats <version>

# Список файлов версии
file list <version>
```

---

## Рекомендации

1. **Используйте понятные имена профилей** - это упростит управление клиентами
2. **Регулярно проверяйте целостность файлов** - используйте `version verify`
3. **Делайте резервные копии** - важные клиенты лучше сохранять отдельно
4. **Следите за обновлениями** - регулярно обновляйте клиенты и моды
5. **Используйте версионирование** - для разных версий одного клиента создавайте отдельные профили

---

## Поддержка

Если у вас возникли проблемы:
1. Проверьте логи: `journalctl -u launcher-backend -f`
2. Проверьте консоль CLI на наличие ошибок
3. Убедитесь, что все файлы на месте и имеют правильные права доступа
4. Проверьте документацию CLI: `help` в CLI или `CLI_README.md`

---

**Последнее обновление:** 2025-11-29

