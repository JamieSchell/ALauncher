@echo off
chcp 65001 >nul
echo ========================================
echo   Сборка установщика NSIS
echo ========================================
echo.

cd /d "%~dp0.."
cd packages\frontend

echo [1/1] Сборка установщика...
call npm run build:installer

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Установщик собран успешно!
    echo 📦 Файл: packages\frontend\release\Modern Launcher-*.exe
    echo.
) else (
    echo.
    echo ❌ Ошибка при сборке установщика!
    echo.
    pause
    exit /b 1
)

pause

