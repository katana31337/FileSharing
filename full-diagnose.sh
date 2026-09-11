#!/bin/bash
# ==========================================
# Полная диагностика FileShare
# ==========================================
# Проверяет ВСЕ компоненты системы
# ==========================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   🔍 Полная диагностика FileShare                        ║"
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

# ==========================================
# 1. Проверка контейнеров
# ==========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Проверка статуса контейнеров"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose ps
echo ""

# ==========================================
# 2. Проверка PostgreSQL
# ==========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Проверка PostgreSQL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker compose ps | grep -q "db.*healthy"; then
    echo "✅ PostgreSQL работает и здоров"
else
    echo "❌ PostgreSQL не здоров"
    echo ""
    echo "📋 Логи PostgreSQL:"
    docker compose logs --tail=30 db
    exit 1
fi

# Проверка подключения к БД
echo ""
echo "🔍 Проверка подключения к БД..."
if docker compose exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Подключение к БД работает"
else
    echo "❌ Не удалось подключиться к БД"
    exit 1
fi

# Проверка таблиц
echo ""
echo "🔍 Проверка таблиц..."
docker compose exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} -c "\dt"
echo ""

# ==========================================
# 3. Проверка Backend
# ==========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Проверка Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker compose ps | grep -q "backend.*running"; then
    echo "✅ Backend запущен"
else
    echo "❌ Backend не запущен"
    echo ""
    echo "📋 Логи backend:"
    docker compose logs --tail=30 backend
    exit 1
fi

# Проверка API напрямую
echo ""
echo "🔍 Проверка API напрямую (через docker exec)..."
if docker compose exec -T backend wget -qO- http://localhost:3001/api/health 2>/dev/null; then
    echo ""
    echo "✅ Backend API отвечает"
else
    echo "❌ Backend API не отвечает"
    echo ""
    echo "📋 Логи backend:"
    docker compose logs --tail=30 backend
    exit 1
fi

# Проверка файлов в БД
echo ""
echo "🔍 Проверка файлов в БД..."
FILES_COUNT=$(docker compose exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} -t -c "SELECT COUNT(*) FROM files;" 2>/dev/null | tr -d ' ')
echo "   Количество файлов в БД: $FILES_COUNT"

if [ "$FILES_COUNT" -gt 0 ]; then
    echo ""
    echo "📋 Последние 5 файлов:"
    docker compose exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} -c "SELECT short_url, original_name, size, expires_at FROM files ORDER BY created_at DESC LIMIT 5;"
else
    echo "⚠️  В БД нет файлов"
    echo "   Это нормально, если вы ещё не загружали файлы"
fi

# Проверка текстов в БД
echo ""
echo "🔍 Проверка текстов в БД..."
TEXTS_COUNT=$(docker compose exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} -t -c "SELECT COUNT(*) FROM text_snippets;" 2>/dev/null | tr -d ' ')
echo "   Количество текстов в БД: $TEXTS_COUNT"

# ==========================================
# 4. Проверка Nginx
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Проверка Nginx"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker compose ps | grep -q "nginx.*running"; then
    echo "✅ Nginx запущен"
else
    echo "❌ Nginx не запущен"
    echo ""
    echo "📋 Логи nginx:"
    docker compose logs --tail=30 nginx
    exit 1
fi

# Проверка HTTPS
echo ""
echo "🔍 Проверка HTTPS..."
if curl -k -f https://localhost > /dev/null 2>&1; then
    echo "✅ HTTPS работает"
else
    echo "⚠️  HTTPS не отвечает (это может быть нормально для self-signed сертификата)"
fi

# Проверка API через Nginx
echo ""
echo "🔍 Проверка API через Nginx..."
if curl -k -f https://localhost/api/health 2>/dev/null; then
    echo ""
    echo "✅ API доступен через Nginx (HTTPS)"
else
    echo "❌ API не доступен через Nginx"
    echo ""
    echo "📋 Логи nginx:"
    docker compose logs --tail=30 nginx
    exit 1
fi

# ==========================================
# 5. Проверка настроек
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Проверка настроек админки"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔍 Настройки из БД:"
docker compose exec -T db psql -U ${DB_USER:-fileshare} -d ${DB_NAME:-fileshare} -c "SELECT key, value FROM admin_settings;" 2>/dev/null || echo "⚠️  Таблица admin_settings не существует"

# ==========================================
# 6. Проверка файлов на диске
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Проверка файлов на диске"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔍 Проверка директории uploads..."
if docker compose exec -T backend ls -la /app/uploads 2>/dev/null; then
    echo "✅ Директория uploads существует"
else
    echo "⚠️  Директория uploads не существует или пуста"
fi

# ==========================================
# 7. Итоговая проверка
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  Итоговая проверка"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "🔍 Проверка доступности сайта..."
DOMAIN=$(grep DOMAIN .env 2>/dev/null | cut -d'=' -f2 || echo "localhost")
echo "   Домен: $DOMAIN"

if curl -k -f "https://$DOMAIN" > /dev/null 2>&1; then
    echo "✅ Сайт доступен по адресу: https://$DOMAIN"
else
    echo "⚠️  Сайт не доступен по адресу: https://$DOMAIN"
    echo "   Попробуйте: https://localhost"
fi

# ==========================================
# Рекомендации
# ==========================================
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   ✅ Диагностика завершена!                              ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Если файлы не доступны по ссылке:"
echo ""
echo "   1. Откройте консоль браузера (F12)"
echo "   2. Перейдите на вкладку Console"
echo "   3. Найдите сообщение:"
echo "      ✅ 'API доступен, используем backend' - всё хорошо"
echo "      ❌ 'API недоступен, используем localStorage' - проблема!"
echo ""
echo "   4. Если видите 'API недоступен':"
echo "      - Проверьте, что backend запущен"
echo "      - Проверьте логи: docker compose logs backend"
echo "      - Проверьте nginx: docker compose logs nginx"
echo ""
echo "   5. Если API доступен, но файлы не находятся:"
echo "      - Проверьте, что файлы есть в БД (см. выше)"
echo "      - Проверьте, что short_url совпадает"
echo "      - Проверьте срок действия файла"
echo ""
echo "📋 Полезные команды:"
echo "   docker compose ps              # Статус контейнеров"
echo "   docker compose logs -f         # Логи в реальном времени"
echo "   docker compose restart         # Перезапуск всех сервисов"
echo "   docker compose down -v         # Полная очистка (УДАЛИТ ВСЕ ДАННЫЕ!)"
echo ""
