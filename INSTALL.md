# 📦 Установка FileShare

## Быстрая установка (рекомендуется)

```bash
# Один командой
curl -sSL https://raw.githubusercontent.com/katana31337/FileSharing/main/install.sh | sudo bash

# Или скачайте и запустите
wget https://raw.githubusercontent.com/katana31337/FileSharing/main/install.sh
chmod +x install.sh
sudo ./install.sh
```

## Что делает установочный скрипт

### 1. Проверка зависимостей
- Docker
- Docker Compose
- Git
- OpenSSL

### 2. Интерактивная настройка
Скрипт задаст вопросы:
- **Домен** — например, `files.example.com`
- **Тип SSL сертификата**:
  - Let's Encrypt (для production с публичным доменом)
  - Self-signed (для разработки/тестирования)
- **Email** — для уведомлений Let's Encrypt (если выбран)

### 3. Автоматическая генерация
- Безопасный пароль для PostgreSQL (32 символа)
- Файл `.env` с конфигурацией
- SSL сертификаты

### 4. Развёртывание
- Клонирование репозитория в `/opt/fileshare`
- Загрузка Docker образов
- Запуск всех сервисов

## Пример вывода

```
╔══════════════════════════════════════════════════════════╗
║   📁 FileShare Installation Script v1.0.0                ║
╚══════════════════════════════════════════════════════════╝

[1/7] Проверка зависимостей...
✓ Все зависимости установлены

[2/7] Настройка параметров...

Введите домен для FileShare (например: files.example.com):
> files.example.com

Какой SSL сертификат вы хотите использовать?
  1) Let's Encrypt (рекомендуется для production)
  2) Self-signed (для разработки/тестирования)

Выберите [1-2]: 1

Введите email для Let's Encrypt:
> admin@example.com

✓ Пароли сгенерированы

[3/7] Создание директории установки...
✓ Директория создана: /opt/fileshare

[4/7] Загрузка FileShare...
✓ Репозиторий клонирован

[5/7] Создание конфигурации...
✓ Файл .env создан

[6/7] Настройка SSL сертификата...
✓ Сертификат Let's Encrypt получен

[7/7] Запуск сервисов...
✓ Сервисы запущены

╔══════════════════════════════════════════════════════════╗
║              ✅ FileShare установлен успешно!            ║
╚══════════════════════════════════════════════════════════╝

📍 Информация для доступа:

   URL:      https://files.example.com
   API:      https://files.example.com/api
   Папка:    /opt/fileshare

🔐 Учетные данные:

   DB User:  fileshare
   DB Pass:  <сгенерированный_пароль>

📋 Полезные команды:

   cd /opt/fileshare
   docker-compose ps                    # Статус сервисов
   docker-compose logs -f               # Логи
   docker-compose restart               # Перезапуск
   docker-compose down                  # Остановка

🎉 Готово! Откройте https://files.example.com в браузере
```

## Ручная установка

Если вы предпочитаете устанавливать вручную:

```bash
# 1. Клонировать репозиторий
git clone https://github.com/katana31337/FileSharing.git
cd FileSharing

# 2. Создать .env
cat > .env << EOF
DOMAIN=files.example.com
DB_USER=fileshare
DB_PASSWORD=$(openssl rand -base64 32)
DB_NAME=fileshare
EOF

# 3. Получить SSL сертификат
./init-letsencrypt.sh files.example.com admin@example.com
# или
./generate-self-signed.sh files.example.com

# 4. Запустить
docker-compose up -d
```

## Удаление

```bash
# Скачать и запустить
wget https://raw.githubusercontent.com/katana31337/FileSharing/main/uninstall.sh
chmod +x uninstall.sh
sudo ./uninstall.sh
```

Скрипт удалит:
- Все контейнеры
- Docker volumes (БД, файлы) — с подтверждением
- Docker образы — с подтверждением
- Директорию `/opt/fileshare`

## Требования

- **ОС:** Linux (Ubuntu, Debian, CentOS, RHEL)
- **Права:** root (sudo)
- **RAM:** минимум 1 GB
- **Disk:** минимум 2 GB
- **Порты:** 80, 443 (должны быть свободны)

## Поддержка

Если возникли проблемы:
1. Проверьте логи: `docker-compose logs -f`
2. Убедитесь, что порты 80 и 443 свободны
3. Проверьте, что Docker запущен: `docker ps`
4. Создайте issue на GitHub
