#!/bin/bash
# ==========================================
# Скрипт проверки установки FileShare
# ==========================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   🔍 Проверка установки FileShare                        ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Определяем директорию проекта
# Если скрипт запущен из /opt/fileshare - используем её
# Иначе используем текущую директорию
if [ -d "/opt/fileshare" ] && [ -f "/opt/fileshare/docker-compose.yml" ]; then
    INSTALL_DIR="/opt/fileshare"
else
    INSTALL_DIR="$(pwd)"
fi

if [ ! -f "$INSTALL_DIR/docker-compose.yml" ]; then
    echo "❌ Файл docker-compose.yml не найден в $INSTALL_DIR"
    echo "   Убедитесь, что вы находитесь в директории проекта"
    exit 1
fi

cd "$INSTALL_DIR"
echo "📁 Рабочая директория: $INSTALL_DIR"
echo ""

echo "📁 Директория установки: $INSTALL_DIR"
echo ""

# Проверка наличия файлов
echo "🔍 Проверка наличия файлов..."
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml не найден"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "❌ .env не найден"
    exit 1
fi

if [ ! -d "server/migrations" ]; then
    echo "❌ Директория server/migrations не найдена"
    exit 1
fi

if [ ! -f "server/migrations/001_initial.sql" ]; then
    echo "❌ Миграция 001_initial.sql не найдена"
    exit 1
fi

if [ ! -f "server/migrations/002_admin_settings.sql" ]; then
    echo "❌ Миграция 002_admin_settings.sql не найдена"
    exit 1
fi

echo "✅ Все файлы на месте"
echo ""

# Проверка Docker
echo "🔍 Проверка Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose не установлен"
    exit 1
fi

echo "✅ Docker и Docker Compose установлены"
echo ""

# Проверка статуса контейнеров
echo "🔍 Статус контейнеров..."
docker compose ps
echo ""

# Проверка здоровья PostgreSQL
echo "🔍 Проверка здоровья PostgreSQL..."
if docker compose ps | grep -q "db.*healthy"; then
    echo "✅ PostgreSQL работает и здоров"
else
    echo "⚠️  PostgreSQL не здоров или не запущен"
    echo ""
    echo "📋 Логи PostgreSQL:"
    docker compose logs --tail=20 db
    exit 1
fi
echo ""

# Проверка здоровья backend
echo "🔍 Проверка здоровья backend..."
if docker compose ps | grep -q "backend.*running"; then
    echo "✅ Backend запущен"
    
    # Проверка API
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Backend API отвечает"
    else
        echo "⚠️  Backend API не отвечает"
        echo ""
        echo "📋 Логи backend:"
        docker compose logs --tail=20 backend
    fi
else
    echo "⚠️  Backend не запущен"
    echo ""
    echo "📋 Логи backend:"
    docker compose logs --tail=20 backend
fi
echo ""

# Проверка nginx
echo "🔍 Проверка nginx..."
if docker compose ps | grep -q "nginx.*running"; then
    echo "✅ Nginx запущен"
    
    # Проверка HTTPS
    if curl -k -f https://localhost > /dev/null 2>&1; then
        echo "✅ HTTPS работает"
    else
        echo "⚠️  HTTPS не отвечает"
    fi
else
    echo "⚠️  Nginx не запущен"
    echo ""
    echo "📋 Логи nginx:"
    docker compose logs --tail=20 nginx
fi
echo ""

# Проверка базы данных
echo "🔍 Проверка базы данных..."
if docker compose exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} -c "\dt" > /dev/null 2>&1; then
    echo "✅ База данных доступна"
    
    # Проверка таблиц
    TABLES=$(docker compose exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    echo "   Таблиц в базе данных: $TABLES"
    
    if [ "$TABLES" -lt 3 ]; then
        echo "⚠️  Ожидается минимум 3 таблицы (files, text_snippets, admin_settings)"
        echo ""
        echo "📋 Список таблиц:"
        docker compose exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} -c "\dt"
    else
        echo "✅ Все таблицы созданы"
    fi
else
    echo "❌ База данных недоступна"
    exit 1
fi
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   ✅ Проверка завершена успешно!                         ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Ваш сайт доступен по адресу:"
grep DOMAIN .env | cut -d'=' -f2 | xargs -I {} echo "   https://{}"
echo ""
echo "📋 Полезные команды:"
echo "   docker compose ps          # Статус контейнеров"
echo "   docker compose logs -f     # Логи в реальном времени"
echo "   docker compose restart     # Перезапуск всех сервисов"
echo "   sudo bash diagnose.sh      # Полная диагностика"
echo ""
