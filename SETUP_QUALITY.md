# Настройка инструментов качества кода

## Установка зависимостей

После клонирования репозитория выполните:

```bash
npm install
```

Это установит все необходимые зависимости, включая:
- ESLint и плагины для TypeScript и React
- Prettier для форматирования кода
- Husky для pre-commit hooks
- lint-staged для проверки только измененных файлов

## Настройка Husky

После установки зависимостей инициализируйте Husky:

```bash
npx husky init
```

Или вручную создайте директорию `.husky` и файл `pre-commit` (уже создан).

Убедитесь, что файл `.husky/pre-commit` имеет права на выполнение:

```bash
chmod +x .husky/pre-commit
```

## Использование

### Линтинг

Проверить код на ошибки:

```bash
# Все пакеты
npm run lint

# Отдельный пакет
cd packages/frontend && npm run lint
cd packages/backend && npm run lint
cd packages/shared && npm run lint
```

Исправить автоматически исправимые ошибки:

```bash
# Все пакеты
npm run lint:fix --workspaces

# Отдельный пакет
cd packages/frontend && npm run lint:fix
```

### Форматирование

Отформатировать код:

```bash
# Все пакеты
npm run format

# Отдельный пакет
cd packages/frontend && npm run format
```

Проверить форматирование без изменений:

```bash
cd packages/frontend && npm run format:check
```

## Pre-commit Hook

При каждом коммите автоматически:
1. Запускается ESLint для проверки измененных файлов
2. Запускается Prettier для форматирования измененных файлов
3. Если есть ошибки, коммит блокируется

Чтобы пропустить pre-commit hook (не рекомендуется):

```bash
git commit --no-verify -m "message"
```

## Конфигурация

### ESLint

- **Базовый конфиг**: `.eslintrc.base.js` - общие правила для всех пакетов
- **Frontend**: `packages/frontend/.eslintrc.js` - расширяет базовый с React правилами
- **Backend**: `packages/backend/.eslintrc.js` - расширяет базовый для Node.js
- **Shared**: `packages/shared/.eslintrc.js` - расширяет базовый

### Prettier

- **Конфиг**: `.prettierrc.js` - единый стиль форматирования
- **Игнорируемые файлы**: `.prettierignore`

### lint-staged

- **Конфиг**: `.lintstagedrc.js` - настройки для pre-commit hook

## Интеграция с IDE

### VS Code

Рекомендуемые расширения:
- ESLint
- Prettier - Code formatter

Настройки VS Code (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Правила линтинга

### Общие правила (базовый конфиг)

- `@typescript-eslint/no-explicit-any`: предупреждение (не ошибка)
- `@typescript-eslint/no-unused-vars`: предупреждение для неиспользуемых переменных
- `no-console`: разрешено (для Electron/Node приложений)
- `prefer-const`: предупреждение
- `no-var`: ошибка (использовать let/const)

### Frontend (React)

- `react/prop-types`: отключено (используется TypeScript)
- `react/react-in-jsx-scope`: отключено (React 17+)
- `react-hooks/rules-of-hooks`: ошибка
- `react-hooks/exhaustive-deps`: предупреждение

## Troubleshooting

### ESLint не находит конфиг

Убедитесь, что вы находитесь в правильной директории и конфиг существует.

### Pre-commit hook не работает

1. Проверьте права на выполнение: `chmod +x .husky/pre-commit`
2. Убедитесь, что Husky установлен: `npm list husky`
3. Переустановите Husky: `npx husky install`

### Конфликты форматирования

Если Prettier и ESLint конфликтуют, убедитесь, что:
1. Используется последняя версия обоих инструментов
2. Конфиги синхронизированы
3. В IDE выбран правильный форматтер

