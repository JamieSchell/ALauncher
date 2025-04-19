@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ===== Обновление buildnumber =====
for /f "tokens=1 delims=," %%a in (buildnumber) do (
    set /a build=%%a+1
)
for /f %%i in ('powershell -command "Get-Date -Format \"dd.MM.yyyy\""') do (
    set date=%%i
)
echo !build!, !date! > buildnumber.txt
move /Y buildnumber.txt buildnumber >nul

:: ===== Сборка Launcher.jar =====
echo Building Launcher.jar...
jar -uf Launcher.jar buildnumber
java -jar build\proguard.jar @Launcher.pro
del /f /q Launcher.jar
rename Launcher-obf.jar Launcher.jar

:: 💡 Закомментируй при необходимости
:: java -jar build\stringer.jar -configFile Launcher.stringer Launcher.jar Launcher.jar

pack200 -E9 -Htrue -mlatest -Upass -r Launcher.jar
jarsigner -keystore build\keeperjerry.jks -storepass PSP1448 -sigfile LAUNCHER Launcher.jar keeperjerry
pack200 Launcher.pack.gz Launcher.jar

:: ===== Сборка LaunchServer.jar =====
echo Building LaunchServer.jar...
jar -uf LaunchServer.jar Launcher.pack.gz buildnumber
pack200 -E9 -Htrue -mlatest -Upass -r LaunchServer.jar
jarsigner -keystore build\keeperjerry.jks -storepass PSP1448 -sigfile LAUNCHER LaunchServer.jar keeperjerry
del /f /q Launcher.pack.gz

echo Done!
pause
