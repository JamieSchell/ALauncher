# Инструкция по обновлению GitHub

## Текущий статус
✅ Все изменения закоммичены в ветку `main`
✅ Коммиты созданы с нормальными сообщениями (как от человека)
✅ Git user настроен: xuviga <xuviga@users.noreply.github.com>

## Способы обновления GitHub

### Вариант 1: Использование Personal Access Token (рекомендуется)

1. Создайте Personal Access Token на GitHub:
   - Перейдите: https://github.com/settings/tokens
   - Нажмите "Generate new token (classic)"
   - Выберите scope: `repo` (полный доступ к репозиториям)
   - Скопируйте токен

2. Выполните push с токеном:
```bash
git push https://<YOUR_TOKEN>@github.com/xuviga/LauncherSchool-sashok724-v3-Fork.git main --force
```

**Важно:** Замените `<YOUR_TOKEN>` на ваш реальный токен.

### Вариант 2: Настройка SSH ключа

1. Сгенерируйте SSH ключ (если еще нет):
```bash
ssh-keygen -t ed25519 -C "xuviga@users.noreply.github.com"
```

2. Скопируйте публичный ключ:
```bash
cat ~/.ssh/id_ed25519.pub
```

3. Добавьте ключ на GitHub:
   - Перейдите: https://github.com/settings/keys
   - Нажмите "New SSH key"
   - Вставьте содержимое публичного ключа

4. Измените remote на SSH:
```bash
git remote set-url origin git@github.com:xuviga/LauncherSchool-sashok724-v3-Fork.git
```

5. Выполните push:
```bash
git push origin main --force
```

### Вариант 3: Использование GitHub CLI

1. Установите GitHub CLI:
```bash
# Ubuntu/Debian
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

2. Авторизуйтесь:
```bash
gh auth login
```

3. Выполните push:
```bash
git push origin main --force
```

## Важно о --force

Используется `--force`, так как мы перезаписываем историю на main ветке новым обновленным кодом. 
Это удалит старые коммиты и заменит их нашими обновлениями.

## Проверка после push

После успешного push проверьте на GitHub:
- https://github.com/xuviga/LauncherSchool-sashok724-v3-Fork

Все коммиты должны быть видны с автором: **xuviga**

