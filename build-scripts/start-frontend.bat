@echo off
chcp 65001 >nul
echo ========================================
echo   Запуск Frontend в режиме разработки
echo ========================================
echo.

cd /d "%~dp0.."
cd packages\frontend

echo [1/1] Запуск frontend dev сервера...
echo.
echo Frontend будет доступен по адресу: http://localhost:5173
echo Для остановки нажмите Ctrl+C
echo.

call npm run dev

pause

