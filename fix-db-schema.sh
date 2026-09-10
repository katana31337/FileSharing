#!/bin/bash
# ==========================================
# Скрипт исправления схемы базы данных
# ==========================================
# Пересоздаёт таблицы с правильной схемой
# ==========================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   🔧 Исправление схемы базы данных                       ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Определяем директорию проекта
if [ -d "/opt/fileshare" ] && [ -f "/opt/fileshare/docker-compose.yml" ]; then
    PROJECT_DIR="/opt/fileshare"
else
    PROJECT_DIR="$(pwd)"
fi

if [ ! -f "$PROJECT_DIR/docker-compose.yml" ]; then
    echo "❌ Файл docker-compose.yml не найден в $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
echo "📁 Рабочая директория: $PROJECT_DIR"
echo ""

# Получаем переменные из .env
if [ -f ".env" ]; then
    source .env
else
    echo "⚠️  Файл .env не найден, используем значения по умолчанию"
    DB_USER="fileshare"
    DB_PASSWORD="fileshare_secret"
    DB_NAME="fileshare"
fi

echo "🔍 Проверка подключения к БД..."
if ! docker compose exec -T db psql -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Не удалось подключиться к БД"
    exit 1
fi
echo "✅ Подключение к БД работает"
echo ""

# Создаём SQL скрипт для исправления схемы
echo "🔧 Создание SQL скрипта для исправления схемы..."
cat > /tmp/fix_schema.sql << 'SQLEOF'
-- Удаляем старые таблицы
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS text_snippets CASCADE;

-- Создаём таблицу files с правильной схемой
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_url VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  size BIGINT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_downloads INTEGER,
  download_count INTEGER DEFAULT 0,
  password VARCHAR(255)
);

-- Создаём таблицу text_snippets с правильной схемой
CREATE TABLE text_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_url VARCHAR(10) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL,
  language VARCHAR(50) NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Создаём индексы
CREATE INDEX idx_files_short_url ON files(short_url);
CREATE INDEX idx_files_expires_at ON files(expires_at);
CREATE INDEX idx_text_snippets_short_url ON text_snippets(short_url);
CREATE INDEX idx_text_snippets_expires_at ON text_snippets(expires_at);

-- Создаём функцию очистки
CREATE OR REPLACE FUNCTION cleanup_expired() RETURNS void AS $$
BEGIN
  DELETE FROM files WHERE expires_at < NOW();
  DELETE FROM text_snippets WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
SQLEOF

echo "✅ SQL скрипт создан"
echo ""

# Применяем SQL скрипт
echo "🔧 Применение SQL скрипта к БД..."
echo "⚠️  ВНИМАНИЕ: Это удалит все существующие файлы и тексты!"
echo ""
read -p "Продолжить? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Операция отменена"
    exit 0
fi

docker compose exec -T db psql -U ${DB_USER} -d ${DB_NAME} < /tmp/fix_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Схема БД успешно исправлена"
else
    echo "❌ Ошибка применения SQL скрипта"
    exit 1
fi

echo ""

# Проверяем структуру таблиц
echo "🔍 Проверка структуры таблиц..."
echo ""
echo "📋 Таблица files:"
docker compose exec -T db psql -U ${DB_USER} -d ${DB_NAME} -c "\d files"
echo ""
echo "📋 Таблица text_snippets:"
docker compose exec -T db psql -U ${DB_USER} -d ${DB_NAME} -c "\d text_snippets"
echo ""

# Перезапускаем backend
echo "🔄 Перезапуск backend..."
docker compose restart backend

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   ✅ Схема базы данных успешно исправлена!               ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Теперь попробуйте загрузить файл снова"
echo ""
echo "💡 Полезные команды:"
echo "   docker compose logs -f backend    # Логи backend"
echo "   docker compose ps                 # Статус контейнеров"
echo ""
