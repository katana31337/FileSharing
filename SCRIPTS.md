# 📜 Скрипты управления FileShare

Все скрипты работают из **любой директории проекта** — не обязательно переходить в `/opt/fileshare`.

## 🔍 Диагностика

### full-diagnose.sh
**Полная диагностика всех компонентов системы**

```bash
# Production
cd /opt/fileshare
sudo bash full-diagnose.sh

# Development
cd /path/to/FileSharing
bash full-diagnose.sh
```

Проверяет:
- ✅ Статус всех контейнеров
- ✅ Здоровье PostgreSQL
- ✅ Работу Backend API
- ✅ Проксирование через Nginx
- ✅ Наличие файлов в базе данных
- ✅ Настройки админки

### check-install.sh
**Быстрая проверка установки**

```bash
bash check-install.sh
```

Проверяет:
- ✅ Наличие всех необходимых файлов
- ✅ Статус контейнеров Docker
- ✅ Здоровье PostgreSQL
- ✅ Доступность backend API
- ✅ Работу nginx и HTTPS
- ✅ Наличие таблиц в базе данных

### diagnose.sh
**Базовая диагностика (старая версия)**

```bash
bash diagnose.sh
```

## 🔄 Управление

### rebuild.sh
**Пересборка и перезапуск всех сервисов**

```bash
bash rebuild.sh
```

Что делает:
- Останавливает контейнеры
- Пересобирает Docker образы
- Запускает контейнеры
- Проверяет здоровье сервисов

### apply-migrations.sh
**Применение миграций к существующей БД**

```bash
bash apply-migrations.sh
```

Что делает:
- Применяет миграцию `002_admin_settings.sql`
- Создаёт таблицу `admin_settings`
- Вставляет начальные значения

## 📝 Установка и удаление

### install.sh
**Автоматическая установка FileShare**

```bash
sudo bash install.sh
```

Что делает:
- Проверяет зависимости
- Задаёт интерактивные вопросы
- Генерирует пароли
- Создаёт конфигурационные файлы
- Получает SSL сертификат
- Запускает сервисы

### uninstall.sh
**Полное удаление FileShare**

```bash
sudo bash uninstall.sh
```

Что делает:
- Останавливает контейнеры
- Удаляет Docker volumes (с подтверждением)
- Удаляет Docker образы (с подтверждением)
- Удаляет директорию установки

## 🚀 Публикация

### publish-docker.sh
**Публикация Docker образов на Docker Hub**

```bash
bash publish-docker.sh <username> <version>
```

Пример:
```bash
bash publish-docker.sh katana31337 1.0.4
```

Что делает:
- Собирает frontend образ
- Собирает backend образ
- Публикует на Docker Hub

## 💡 Советы

### Автоматическое определение директории

Все скрипты автоматически определяют, где находится проект:
- Если есть `/opt/fileshare/docker-compose.yml` → используют `/opt/fileshare`
- Иначе → используют текущую директорию

Это значит, что вы можете:
- Делать `git pull` в свою папку
- Запускать скрипты из этой папки
- Не нужно вручную переходить в `/opt/fileshare`

### Production vs Development

**Production** (сервер):
```bash
cd /opt/fileshare
sudo bash full-diagnose.sh
```

**Development** (локальный компьютер):
```bash
cd ~/FileSharing
bash full-diagnose.sh
```

### Права доступа

- `install.sh`, `uninstall.sh` — требуют `sudo` (создают файлы в `/opt/fileshare`)
- Остальные скрипты — работают без `sudo` (если у вас есть права на директорию)

## 📋 Примеры использования

### Сценарий 1: Production установка

```bash
# Установка
sudo bash install.sh

# Проверка
sudo bash check-install.sh

# Полная диагностика
sudo bash full-diagnose.sh

# Пересборка после обновления
sudo bash rebuild.sh
```

### Сценарий 2: Разработка

```bash
# Клонирование
git clone https://github.com/katana31337/FileSharing.git
cd FileSharing

# Запуск для разработки
docker compose up -d

# Проверка
bash check-install.sh

# Диагностика
bash full-diagnose.sh

# Применение миграций
bash apply-migrations.sh
```

### Сценарий 3: Обновление

```bash
# Переход в директорию проекта
cd /path/to/FileSharing

# Обновление кода
git pull

# Пересборка
bash rebuild.sh

# Проверка
bash check-install.sh

# Полная диагностика
bash full-diagnose.sh
```

## 🐛 Решение проблем

Если скрипт не работает:

1. **Проверьте права доступа:**
   ```bash
   chmod +x *.sh
   ```

2. **Проверьте, что вы в директории проекта:**
   ```bash
   ls docker-compose.yml
   ```

3. **Запустите с отладкой:**
   ```bash
   bash -x full-diagnose.sh
   ```

4. **Проверьте логи:**
   ```bash
   docker compose logs
   ```

## 📚 Дополнительная информация

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — диагностика проблем
- [DEVELOPMENT.md](./DEVELOPMENT.md) — разработка
- [UPDATE.md](./UPDATE.md) — обновление
- [INSTALL.md](./INSTALL.md) — установка
