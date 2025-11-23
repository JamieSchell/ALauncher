# ⚡ Быстрое решение: Лаунчер не обновляется

## Проверка за 5 минут

### 1. Откройте консоль разработчика
- Нажмите `F12` в лаунчере
- Перейдите на вкладку **Console**

### 2. Проверьте логи
Ищите строки с `[LauncherUpdate]`:
```
[LauncherUpdate] Current version: 1.0.133
[LauncherUpdate] Checking for updates... (current: 1.0.133, API: http://localhost:7240)
[LauncherUpdate] Update check result: {...}
```

### 3. Проверьте вручную
1. Откройте **Settings** (Настройки)
2. Найдите секцию **Launcher Updates**
3. Нажмите **"Проверить обновления"**
4. Смотрите результат в консоли

### 4. Проверьте API
Откройте в браузере:
```
http://localhost:7240/api/launcher/check-update?currentVersion=1.0.133
```

Должен вернуть JSON с `hasUpdate: true` если есть обновление.

### 5. Проверьте БД
```sql
SELECT version, downloadUrl, enabled 
FROM launcher_versions 
WHERE enabled = 1 
ORDER BY createdAt DESC 
LIMIT 1;
```

Убедитесь:
- ✅ Версия новее текущей (например, 1.0.134 > 1.0.133)
- ✅ `enabled = 1`
- ✅ `downloadUrl` заполнен

## Частые проблемы

### ❌ "Network error" в логах
**Решение**: Проверьте, что backend сервер запущен на порту 7240

### ❌ "Invalid response from server"
**Решение**: Проверьте, что API endpoint работает (см. шаг 4)

### ❌ "No updates available" но версия в БД есть
**Решение**: 
1. Проверьте, что версия в БД действительно новее
2. Убедитесь, что версия в `package.json` совпадает с установленной

### ❌ Модальное окно не появляется
**Решение**: 
1. Проверьте логи: `[App] Update available, showing modal`
2. Убедитесь, что `updateCheckResult.hasUpdate === true`

## Тестовая проверка

В консоли разработчика выполните:
```javascript
// Проверить текущую версию
await window.electronAPI.getAppVersion()

// Проверить обновления вручную
const result = await window.electronAPI.checkLauncherUpdate('1.0.133', 'http://localhost:7240');
console.log(result);
```

## Если ничего не помогло

1. Соберите все логи из консоли
2. Проверьте логи Electron (в терминале где запущен лаунчер)
3. Проверьте ответ API endpoint
4. Убедитесь, что все версии правильные

Подробная инструкция: `TROUBLESHOOTING_UPDATES.md`

