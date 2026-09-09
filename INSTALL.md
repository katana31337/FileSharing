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
- OpenSSL

### 2. Интерактивная настройка
Скрипт задаст вопросы:
- **Тип SSL сертификата**:
  - Let's Encrypt (для production с публичным доменом)
  - Self-signed (для локальной сети, IP-адреса или разработки)
- **Адрес** — домен, IP-адрес или имя хоста (подсказка зависит от типа SSL)
- **Email** — для уведомлений Let's Encrypt (если выбран)

### 3. Автоматическая генерация
- Безопасный пароль для PostgreSQL (32 символа)
- Файл `.env` с конфигурацией
- `docker-compose.yml` с настройками сервисов (вариативный в зависимости от типа SSL)
- `nginx.conf` с настройками reverse proxy (оптимизирован для выбранного типа SSL)
- SSL сертификаты (Let's Encrypt или self-signed)

**Вариативность конфигурации:**
- **Let's Encrypt**: добавляется контейнер `certbot` для автоматического продления сертификатов, настраивается ACME challenge в nginx
- **Self-signed**: минимальная конфигурация без лишних контейнеров

### 4. Развёртывание
- Создание директории `/opt/fileshare`
- Загрузка Docker образов (только необходимые для выбранного типа SSL)
- Запуск всех сервисов

## Пример вывода

```
╔══════════════════════════════════════════════════════════╗
║   📁 FileShare Installation Script v1.0.0                ║
╚══════════════════════════════════════════════════════════╝

[1/8] Проверка зависимостей...
✓ Все зависимости установлены

[2/8] Настройка параметров...

Какой SSL сертификат вы хотите использовать?
  1) Let's Encrypt (для production с публичным доменом)
  2) Self-signed (для локальной сети, IP-адреса или разработки)

Выберите [1-2]: 1

Введите публичный домен для FileShare
⚠️  Домен должен указывать на этот сервер и быть доступен из интернета
   Например: files.example.com

> files.example.com

Введите email для Let's Encrypt (для уведомлений о сертификате):
> admin@example.com

✓ Пароли сгенерированы

[3/8] Создание директории установки...
✓ Директория создана: /opt/fileshare

[4/8] Создание конфигурации Docker...
✓ docker-compose.yml создан

[5/8] Создание конфигурации Nginx...
✓ nginx.conf создан

[6/8] Создание конфигурации...
✓ Файл .env создан

[7/8] Настройка SSL сертификата...
✓ Сертификат Let's Encrypt получен

[8/8] Запуск сервисов...
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
   docker compose ps                    # Статус сервисов
   docker compose logs -f               # Логи
   docker compose restart               # Перезапуск
   docker compose down                  # Остановка

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
docker compose up -d
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
1. Проверьте логи: `docker compose logs -f`
2. Убедитесь, что порты 80 и 443 свободны
3. Проверьте, что Docker запущен: `docker ps`
4. Создайте issue на GitHub
