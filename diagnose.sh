#!/bin/bash
# ==========================================
# Скрипт диагностики FileShare
# ==========================================
# Проверяет работоспособность всех сервисов
# ==========================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   🔍 Диагностика FileShare                               ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Переход в директорию проекта
# Поддерживает как production установку (/opt/fileshare), так и разработку (любая директория)
if [ -d "/opt/fileshare" ] && [ -f "/opt/fileshare/docker-compose.yml" ]; then
    cd "/opt/fileshare"
else
    cd "$(dirname "$0")"
fi

# Проверка docker-compose.yml
if [ ! -f "docker-compose.yml" ] && [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Файл docker-compose.yml не найден"
    exit 1
fi

COMPOSE_FILE="docker-compose.yml"
if [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

echo "📋 Используемый файл: $COMPOSE_FILE"
echo ""

# Проверка статуса контейнеров
echo "🔍 Статус контейнеров:"
docker compose -f $COMPOSE_FILE ps
echo ""

# Проверка здоровья backend
echo "🔍 Проверка здоровья backend..."
if docker compose -f $COMPOSE_FILE exec -T backend wget -qO- http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend работает"
    echo ""
    echo "📊 Ответ backend:"
    docker compose -f $COMPOSE_FILE exec -T backend wget -qO- http://localhost:3001/api/health
    echo ""
else
    echo "❌ Backend не отвечает"
    echo ""
    echo "📋 Логи backend:"
    docker compose -f $COMPOSE_FILE logs --tail=50 backend
    exit 1
fi

# Проверка здоровья PostgreSQL
echo "🔍 Проверка здоровья PostgreSQL..."
if docker compose -f $COMPOSE_FILE exec -T db pg_isready -U ${DB_USER:-fileshare} > /dev/null 2>&1; then
    echo "✅ PostgreSQL работает"
else
    echo "❌ PostgreSQL не отвечает"
    echo ""
    echo "📋 Логи PostgreSQL:"
    docker compose -f $COMPOSE_FILE logs --tail=50 db
    exit 1
fi

# Проверка nginx
echo "🔍 Проверка nginx..."
if curl -k -f https://localhost > /dev/null 2>&1; then
    echo "✅ Nginx работает (HTTPS)"
else
    echo "⚠️  Nginx не отвечает на HTTPS (это нормально, если SSL сертификат не настроен)"
fi

if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Nginx работает (HTTP)"
else
    echo "⚠️  Nginx не отвечает на HTTP"
fi
echo ""

# Проверка API через nginx
echo "🔍 Проверка API через nginx..."
if curl -k -f https://localhost/api/health > /dev/null 2>&1; then
    echo "✅ API доступен через nginx (HTTPS)"
    echo ""
    echo "📊 Ответ API:"
    curl -k -s https://localhost/api/health | jq . 2>/dev/null || curl -k -s https://localhost/api/health
    echo ""
elif curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ API доступен через nginx (HTTP)"
    echo ""
    echo "📊 Ответ API:"
    curl -s http://localhost/api/health | jq . 2>/dev/null || curl -s http://localhost/api/health
    echo ""
else
    echo "❌ API не доступен через nginx"
    echo ""
    echo "📋 Логи nginx:"
    docker compose -f $COMPOSE_FILE logs --tail=50 nginx
    exit 1
fi

# Проверка базы данных
echo "🔍 Проверка таблиц в базе данных..."
docker compose -f $COMPOSE_FILE exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} -c "\dt"
echo ""

# Проверка количества файлов
echo "🔍 Количество файлов в базе данных:"
docker compose -f $COMPOSE_FILE exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} -c "SELECT COUNT(*) as total_files FROM files;"
echo ""

# Проверка количества текстов
echo "🔍 Количество текстов в базе данных:"
docker compose -f $COMPOSE_FILE exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} -c "SELECT COUNT(*) as total_texts FROM text_snippets;"
echo ""

# Проверка настроек админки
echo "🔍 Настройки админки:"
docker compose -f $COMPOSE_FILE exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} -c "SELECT key, value FROM admin_settings;"
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   ✅ Диагностика завершена успешно!                      ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Если все проверки прошли успешно, но файлы не доступны:"
echo "   1. Проверьте консоль браузера (F12) на наличие ошибок"
echo "   2. Проверьте, что frontend использует API, а не localStorage"
echo "   3. Проверьте логи frontend: docker compose logs nginx"
echo ""
