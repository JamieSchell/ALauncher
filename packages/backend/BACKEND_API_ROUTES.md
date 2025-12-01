## HTTP API Routes (v1)

> **Базовый URL:** `/api` (см. монтирование в `src/index.ts`)

---

## 1. Auth (`/api/auth`)

| Метод | Путь          | Вход                         | Ответ (успех)                          | Ошибки / коды |
|-------|---------------|-----------------------------|----------------------------------------|---------------|
| POST  | `/login`      | `{ login, password }`       | `{ success: true, data: { playerProfile, accessToken, role } }` | `400` (валидация), `401` (ошибка логина), `429` (rate‑limit) |
| POST  | `/register`   | `{ username, password, email? }` | `{ success: true, data: { userId } }` | `400` (валидация / конфликт) |
| POST  | `/logout`     | `Authorization: Bearer`     | `{ success: true, message }`          | `401` (нет токена) |
| GET   | `/validate`   | `Authorization: Bearer`     | `{ success: true, data: { user } }`   | `401` |

---

## 2. Profiles (`/api/profiles`)

| Метод | Путь                    | Вход                      | Ответ (успех)           | Ошибки / коды |
|-------|-------------------------|---------------------------|-------------------------|---------------|
| GET   | `/`                     | —                         | Список активных профилей | `500` |
| GET   | `/:id`                  | `id` профиля             | Детальный профиль       | `404`, `500` |
| POST  | `/`                     | Данные профиля           | Созданный профиль       | `400`, `500` |
| PUT   | `/:id`                  | Обновлённые поля профиля | Обновлённый профиль     | `400`, `404`, `500` |
| DELETE| `/:id`                  | `id` профиля             | `{ success: true }`     | `404`, `500` |
| GET   | `/:id/economy/top`      | `limit?`, `offset?` и др.| Топ игроков экономики   | `500` |

---

## 3. Updates (`/api/updates`)

| Метод | Путь                         | Вход                             | Ответ (успех)                         |
|-------|------------------------------|----------------------------------|---------------------------------------|
| GET   | `/:profileId/:dirType`       | `profileId`, `dirType`          | Хэш‑структура файлов (`HashedDir`)    |
| GET   | `/:profileId/:dirType/file`  | `profileId`, `dirType`, `path`  | Скачивание конкретного файла          |
| POST  | `/sync/:profileId`           | `profileId`                     | Запуск/результат синхронизации       |
| POST  | `/download/:version`         | `version`                       | Запуск скачивания клиента и профиля  |

---

## 4. Client Versions (`/api/client-versions`)

| Метод | Путь                              | Вход                    | Ответ (успех)                    |
|-------|-----------------------------------|-------------------------|----------------------------------|
| GET   | `/`                               | —                       | Список всех версий клиента       |
| GET   | `/version/:version`               | `version`               | Версия по номеру                 |
| GET   | `/:versionId/files`               | `versionId`             | Список файлов версии             |
| GET   | `/:versionId`                     | `versionId`             | Детали версии                    |
| GET   | `/:versionId/file`                | query `filePath`        | Скачивание файла                 |
| POST  | `/version/:version/sync`          | `version`               | Синхронизация файлов версии      |
| POST  | `/version/:version/verify`        | `version`               | Проверка целостности файлов      |
| GET   | `/version/:version/sync-stats`    | `version`               | Статистика синхронизации         |

---

## 5. Users (`/api/users`)

| Метод | Путь                  | Вход                          | Ответ (успех)                         |
|-------|-----------------------|-------------------------------|---------------------------------------|
| GET   | `/me`                 | `Authorization: Bearer`       | Данные текущего пользователя          |
| PUT   | `/me`                 | Обновление профиля            | Обновлённый пользователь             |
| PATCH | `/me/password`        | Старый/новый пароль           | `{ success: true }`                  |
| POST  | `/me/skin`            | multipart `skin`              | Обновлённый профиль/скин             |
| POST  | `/me/cloak`           | multipart `cloak`             | Обновлённый профиль/плащ             |
| GET   | `/`                   | (админ) фильтры/пагинация     | Список пользователей                  |
| PATCH | `/:id/ban`            | `banned`, `banReason?`        | Обновлённый пользователь             |
| PATCH | `/:id`                | Изменение email/username/role | Обновлённый пользователь             |
| DELETE| `/:id`                | Удаление пользователя         | `{ success: true }`                  |

---

## 6. Servers (`/api/servers`)

| Метод | Путь                      | Вход         | Ответ (успех)                     |
|-------|---------------------------|--------------|-----------------------------------|
| GET   | `/:address/status`        | `address`    | Текущий статус сервера           |
| GET   | `/:address/statistics`    | `address`    | Статистика онлайна за 24 часа    |

---

## 7. Crashes (`/api/crashes`)

| Метод | Путь                         | Вход                        | Ответ (успех)                  |
|-------|------------------------------|-----------------------------|--------------------------------|
| POST  | `/`                          | Данные краша лаунчера/игры | `{ success: true }`           |
| GET   | `/`                          | Фильтры/пагинация          | Список крашей лаунчера/игры   |
| POST  | `/launcher-error`            | Ошибка лаунчера            | `{ success: true }`           |
| GET   | `/connection-issues`         | Фильтры/пагинация          | Список сетевых проблем        |
| POST  | `/connection-issue`          | Данные сетевой проблемы    | `{ success: true }`           |

---

## 8. Statistics (`/api/statistics`)

| Метод | Путь              | Вход                               | Ответ (успех)                 |
|-------|-------------------|------------------------------------|-------------------------------|
| POST  | `/game-launch`    | Данные запуска игры               | `{ success: true, data }`     |
| POST  | `/game-session`   | Данные сессии игры                | `{ success: true }`          |
| GET   | `/users`          | —                                  | Агрегированная статистика    |
| GET   | `/admin/analytics`| `days?`                            | Расширенная аналитика        |

---

## 9. Notifications (`/api/notifications`)

| Метод | Путь              | Вход                                    | Ответ (успех)                             |
|-------|-------------------|-----------------------------------------|-------------------------------------------|
| GET   | `/`               | Параметры пагинации/фильтров           | `{ success: true, data: NotificationDTO[] }` |
| POST  | `/`               | Создание уведомления                   | `{ success: true, data: NotificationDTO }`    |
| PATCH | `/:id/read`       | `id` уведомления                       | `{ success: true, data: NotificationDTO }`    |
| PATCH | `/read-all`       | —                                      | `{ success: true }`                        |
| DELETE| `/:id`            | `id` уведомления                       | `{ success: true }`                        |
| DELETE| `/`               | Фильтры (readOnly, type)              | `{ success: true }`                        |
| GET   | `/unread-count`   | —                                      | `{ success: true, data: { count } }`       |

---

## 10. Launcher (`/api/launcher`)

| Метод | Путь             | Вход              | Ответ (успех)                          |
|-------|------------------|-------------------|----------------------------------------|
| GET   | `/version`       | —                 | Текущая версия лаунчера               |
| GET   | `/check-update`  | Версия клиента    | Информация об обновлении лаунчера     |
| GET   | `/version/:version` | `version`      | Детали конкретной версии лаунчера    |
| GET   | `/versions`      | —                 | Список доступных версий лаунчера     |
| GET   | `/download/:version` | `version`     | Ссылка/файл обновления лаунчера      |


