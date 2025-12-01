## Backend Architecture (Layers & Structure)

- **Цель**: зафиксировать целевую архитектуру backend (`packages/backend`) и правила зависимостей между слоями.

---

## 1. Слои

- **Transport слой**
  - Express HTTP маршруты: `src/routes/*`
  - WebSocket обработчики: `src/websocket/*`
  - CLI интерфейс: `src/cli/*`
  - **Задача**: принимать/валидировать вход, вызывать application‑слой, упаковывать ответы.

- **Application / Service слой**
  - Бизнес‑логика и use‑case'ы: `src/services/*`
  - **Задача**: реализовывать сценарии (auth, профили, загрузки, статистика и т.д.), не зная деталей транспорта.

- **Infrastructure слой**
  - Конфигурация: `src/config/*`
  - БД и Prisma: `src/services/database.ts`, `prisma/*`
  - Файловая система, крипто, внешние API: части `src/services/*`, `src/utils/*`
  - Логирование: `src/utils/logger.ts`

- **Cross‑cutting (сквозные) компоненты**
  - Middleware: `src/middleware/*` (auth, rate‑limit, error handling)
  - Общие типы: `@modern-launcher/shared`

---

## 2. Правила зависимостей

- `routes/*`, `websocket/*`, `cli/*` (Transport) **могут зависеть от**:
  - `services/*` (Application)
  - `middleware/*`
  - `config/*`
  - `@modern-launcher/shared`

- `services/*` (Application) **могут зависеть от**:
  - других сервисов (по необходимости, но избегать циклов)
  - `config/*`
  - `services/database.ts` и других infrastructure‑утилит
  - `@modern-launcher/shared`

- `config/*`, `utils/*`, `services/database.ts` (Infrastructure) **не должны зависеть от**:
  - `routes/*`
  - `websocket/*`
  - `cli/*`

---

## 3. Текущее состояние (после аудита)

- Директории уже соответствуют предложенным слоям:
  - `routes`, `websocket`, `cli` — Transport
  - `services` — Application/Infrastructure mix
  - `config`, `utils`, `services/database.ts` — Infrastructure
- Следующий шаг: постепенно очищать `services/*` от прямой transport‑логики (ответы Express, формирование HTTP‑кодoв) и выносить её в `routes/*`.


