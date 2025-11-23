@echo off
chcp 65001 >nul
echo ========================================
echo   Запуск Backend сервера
echo ========================================
echo.

cd /d "%~dp0.."
cd packages\backend

echo [1/1] Запуск backend сервера...
echo.
echo Сервер будет доступен по адресу: http://localhost:7240
echo Для остановки нажмите Ctrl+C
echo.

call npm run dev

pause

