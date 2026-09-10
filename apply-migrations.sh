#!/bin/bash
# ==========================================
# Скрипт применения миграций к БД
# ==========================================
# Используется для применения новых миграций
# к уже существующей базе данных
# ==========================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   🗄️  Применение миграций к базе данных                 ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Переход в директорию проекта
cd "$(dirname "$0")"

# Проверка наличия docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Файл docker-compose.yml не найден"
    echo "   Сначала запустите install.sh"
    exit 1
fi

# Получение имени контейнера с PostgreSQL
DB_CONTAINER=$(docker compose ps -q db 2>/dev/null || echo "")

if [ -z "$DB_CONTAINER" ]; then
    echo "❌ Контейнер с PostgreSQL не запущен"
    echo "   Запустите: docker compose up -d db"
    exit 1
fi

echo "📦 Контейнер PostgreSQL: $DB_CONTAINER"
echo ""

# Применение миграции 002_admin_settings.sql
echo "🔄 Применение миграции 002_admin_settings.sql..."
docker compose exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} < server/migrations/002_admin_settings.sql

if [ $? -eq 0 ]; then
    echo "✅ Миграция успешно применена"
else
    echo "❌ Ошибка применения миграции"
    exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   ✅ Миграции применены успешно!                         ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Теперь перезапустите backend для применения изменений:"
echo "   docker compose restart backend"
echo ""
