# @modern-launcher/shared

Общий пакет для Modern Minecraft Launcher. Содержит типы, интерфейсы и утилиты, используемые в frontend и backend.

## Особенности

- 🛡️ **Безопасность типов**: Discriminated unions для всех API ответов
- 🔒 **Безопасность**: SHA-256 для UUID, защита от path traversal, валидация JWT
- ✅ **Тестирование**: 95 тестов с покрытием >80%
- 📚 **Документация**: Полные JSDoc комментарии на русском языке
- 🔧 **Инструменты**: ESLint, Prettier, TypeScript strict mode

## Установка

```bash
npm install @modern-launcher/shared
```

## Использование

### Типы

```typescript
import {
  AuthResponse,
  isAuthSuccess,
  isAuthFailure,
  PlayerProfile,
  ClientProfile
} from '@modern-launcher/shared';

// Type-safe обработка ответа аутентификации
function handleAuth(response: AuthResponse) {
  if (isAuthSuccess(response)) {
    // TypeScript знает, что здесь response.success === true
    console.log(response.playerProfile.username);
    console.log(response.accessToken);
  } else {
    // TypeScript знает, что здесь response.success === false
    console.error(response.error);
  }
}
```

### Утилиты

```typescript
import {
  UUIDHelper,
  PathHelper,
  SecurityHelper,
  VersionComparator
} from '@modern-launcher/shared';

// Генерация UUID (безопасная, с SHA-256)
const uuid = UUIDHelper.generateOffline('playername');

// Безопасная работа с путями
const safePath = PathHelper.joinSafe('/var/www', 'uploads', 'file.txt');

// Валидация JWT
const isValid = SecurityHelper.isValidToken(token);

// Сравнение версий
const comparison = VersionComparator.compare('2.0.0', '1.5.0'); // 1
```

## Скрипты

```bash
# Сборка
npm run build

# Тесты
npm run test
npm run test:coverage

# Проверка типов
npm run typecheck

# Линтинг
npm run lint
npm run lint:fix

# Форматирование
npm run format
npm run format:fix

# Полная проверка (перед коммитом)
npm run precommit
```

## API

### Типы

#### Auth
- `AuthRequest` - Запрос аутентификации
- `AuthResponse` - Ответ аутентификации (discriminated union)
- `isAuthSuccess()` - Type guard для успешного ответа
- `isAuthFailure()` - Type guard для ошибки

#### API
- `ApiResponse<T>` - Общий API ответ (discriminated union)
- `ApiSuccess<T>` - Успешный ответ
- `ApiFailure` - Ошибка
- `isApiSuccess()` - Type guard
- `isApiFailure()` - Type guard

#### Профили
- `PlayerProfile` - Профиль игрока
- `ClientProfile` - Профиль клиента Minecraft

#### Обновление
- `UpdateRequest` - Запрос обновления
- `UpdateResponse` - Ответ обновления
- `HashedEntry` - Хешированная запись (файл или директория)
- `isHashedFile()` - Type guard
- `isHashedDir()` - Type guard

### Утилиты

#### UUIDHelper
- `generateOffline(username)` - Генерация offline UUID (SHA-256)
- `generateRandom()` - Генерация случайного UUID v4
- `isValidUUID(uuid)` - Валидация формата UUID
- `toHash(uuid)` - Конвертация UUID в хеш
- `fromHash(hash)` - Конвертация хеша в UUID

#### PathHelper
- `normalize(path)` - Нормализация разделителей
- `join(...paths)` - Объединение путей с защитой от traversal
- `joinSafe(basePath, ...paths)` - Безопасное объединение с базовым путем
- `getExtension(path)` - Получение расширения файла
- `hasExtension(path, ext)` - Проверка расширения
- `isSafe(path)` - Проверка безопасности пути

#### SecurityHelper
- `isValidToken(token)` - Валидация JWT формата
- `sanitizeUsername(username)` - Очистка имени пользователя
- `isValidUsername(username)` - Валидация имени пользователя
- `sanitizeEmail(email)` - Очистка email
- `escapeHtml(html)` - Экранирование HTML

#### VersionComparator
- `compare(v1, v2)` - Сравнение версий (1, 0, -1)
- `isAtLeast(version, minimum)` - Проверка минимальной версии
- `isValidFormat(version)` - Валидация формата версии

## Безопасность

- **UUID v4**: Используется SHA-256 вместо MD5 с серверной солью
- **Path traversal**: Защита от `../`, encoded sequences, null bytes
- **JWT**: Полная валидация формата, Base64URL декодирование, проверка claims
- **Input validation**: Централизованный InputValidator для всех методов

## Лицензия

MIT
