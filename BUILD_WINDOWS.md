# Сборка Windows Portable версии ALauncher

## Варианты сборки для Windows

### 1. Автоматическая сборка через GitHub Actions (Рекомендуется)

Самый простой способ получить Windows версию - использовать GitHub Actions:

1. Запушьте изменения в репозиторий GitHub
2. Перейдите в раздел Actions
3. Запустите workflow "Build Windows Portable"
4. Скачайте готовые артефакты из раздела Artifacts

Готовые файлы:
- `ALauncher-Setup.exe` - Установщик для Windows
- `ALauncher-Windows-Portable.zip` - Портативная версия

### 2. Сборка на Windows машине

Если у вас есть доступ к Windows машине:

```bash
# Установить зависимости
# Установить Node.js 18+ с https://nodejs.org
# Установить Rust с https://rustup.rs

# Клонировать репозиторий
git clone <repository-url>
cd ALauncher

# Установить зависимости
npm install

# Собрать frontend
cd packages/frontend
npm install
npm run build

# Собрать Tauri приложение
npm run tauri build
```

Готовые файлы будут в `packages/frontend/src-tauri/target/release/bundle/`

### 3. Использование Docker для Windows сборки

Создайте Dockerfile для Windows кросс-компиляции:

```dockerfile
FROM mcr.microsoft.com/windows/servercore:ltsc2022

# Установить Node.js, Rust и другие зависимости
# Собрать приложение
```

### 4. Cross-compilation из Linux (Сложно)

Настроенная cross-compilation требует:

```bash
# Установить Windows target
rustup target add x86_64-pc-windows-msvc

# Установить MinGW
sudo apt install mingw-w64

# Настроить переменные окружения
export CC_x86_64-pc-windows-msvc=x86_64-w64-mingw32-gcc
export CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER=x86_64-w64-mingw32-gcc

# Собрать (может потребоваться дополнительная настройка)
npm run tauri build -- --target x86_64-pc-windows-msvc
```

## Структура готовой сборки

После сборки вы получите:

```
packages/frontend/src-tauri/target/release/bundle/
├── msi/
│   └── ALauncher_1.0.0_x64_en-US.msi    # MSI установщик
├── nsis/
│   └── ALauncher_1.0.0_x64-setup.exe     # NSIS установщик
├── deb/
│   └── alauncher_1.0.0_amd64.deb          # Debian пакет (Linux)
└── appimage/
    └── ALauncher_1.0.0_amd64.AppImage     # AppImage (Linux)
```

## Создание портативной версии

Для создания портативной версии из установщика:

1. Запустите установщик на Windows
2. Установите приложение
3. Скопируйте файлы из `C:\Program Files\ALauncher\`
4. Упакуйте в ZIP архив:

```bash
# В Windows PowerShell
Compress-Archive -Path "C:\Program Files\ALauncher\*" -DestinationPath "ALauncher-Portable.zip"
```

## Автоматическая генерация портативной версии

Можно модифицировать `tauri.conf.json` для генерации портативной версии:

```json
{
  "bundle": {
    "active": true,
    "targets": ["nsis"],
    "windows": {
      "nsis": {
        "displayLanguageSelector": false,
        "installMode": "portable"
      }
    }
  }
}
```

## Рекомендации

1. **Используйте GitHub Actions** - самый надежный способ
2. **Тестируйте на Windows** перед распространением
3. **Проверьте антивирусами** - exe файлы могут вызывать ложные срабатывания
4. **Создайте код подписи** для избежания предупреждений Windows SmartScreen
5. **Включите автоматические обновления** в приложении

## Поиск проблем

- Ошибки сборки: Проверьте версии Node.js и Rust
- Проблемы с зависимостями: Очистите кэш `npm cache clean --force`
- Cross-compilation ошибки: Используйте Docker или GitHub Actions

## Дистрибуция

Готовые файлы можно распространять через:
- GitHub Releases
- Прямые ссылки на артефакты
- Собственный CDN
- Google Drive / OneDrive