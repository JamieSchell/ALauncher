@echo off
chcp 65001 >nul
echo ========================================
echo   Сборка Portable версии лаунчера
echo ========================================
echo.

cd /d "%~dp0.."
cd packages\frontend

echo [1/1] Сборка лаунчера...
call npm run build:packager

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Сборка завершена успешно!
    echo 📦 Файл: packages\frontend\release\@modern-launcher-frontend-win32-x64\@modern-launcher-frontend.exe
    echo.
) else (
    echo.
    echo ❌ Ошибка при сборке!
    echo.
    pause
    exit /b 1
)

pause

