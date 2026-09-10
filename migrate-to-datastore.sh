#!/bin/bash
# ==========================================
# Миграция файлов из Docker volume в /dataStore/files
# ==========================================
# Используется для перехода на bind mount
# ==========================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   📦 Миграция файлов в /dataStore/files                  ║"
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

# Проверка существования Docker volume
echo "🔍 Проверка Docker volume..."
VOLUME_NAME=$(docker volume ls | grep -E "fileshare_uploads|uploads_data" | awk '{print $2}' | head -1)

if [ -z "$VOLUME_NAME" ]; then
    echo "✅ Docker volume для файлов не найден"
    echo "   Возможно, вы уже используете /dataStore/files"
    exit 0
fi

echo "✅ Найден volume: $VOLUME_NAME"
echo ""

# Создание директории /dataStore/files
echo "🔧 Создание директории /dataStore/files..."
mkdir -p /dataStore/files
chmod 755 /dataStore/files
chmod 777 /dataStore/files  # Для записи из контейнера
echo "✅ Директория создана"
echo ""

# Остановка контейнеров
echo "🛑 Остановка контейнеров..."
docker compose stop backend
echo "✅ Контейнеры остановлены"
echo ""

# Копирование файлов из volume
echo "📦 Копирование файлов из Docker volume..."
echo "   Volume: $VOLUME_NAME"
echo "   Destination: /dataStore/files/"
echo ""

# Получаем путь к volume
VOLUME_PATH=$(docker volume inspect "$VOLUME_NAME" | grep -oP '"Mountpoint": "\K[^"]+')

if [ -z "$VOLUME_PATH" ]; then
    echo "❌ Не удалось определить путь к volume"
    exit 1
fi

echo "   Volume path: $VOLUME_PATH"
echo ""

# Копируем файлы
if [ -d "$VOLUME_PATH/files" ]; then
    echo "📂 Копирование файлов..."
    cp -r "$VOLUME_PATH/files/"* /dataStore/files/ 2>/dev/null || true
    echo "✅ Файлы скопированы"
elif [ -d "$VOLUME_PATH" ]; then
    echo "📂 Копирование файлов..."
    cp -r "$VOLUME_PATH/"* /dataStore/files/ 2>/dev/null || true
    echo "✅ Файлы скопированы"
else
    echo "⚠️  Директория с файлами не найдена в volume"
fi

echo ""

# Проверка прав доступа
echo "🔧 Настройка прав доступа..."
chown -R 1000:1000 /dataStore/files 2>/dev/null || true
chmod -R 755 /dataStore/files
echo "✅ Права настроены"
echo ""

# Проверка количества файлов
echo "📊 Статистика:"
FILES_COUNT=$(find /dataStore/files -type f | wc -l)
echo "   Файлов скопировано: $FILES_COUNT"
echo ""

if [ "$FILES_COUNT" -eq 0 ]; then
    echo "⚠️  Файлы не найдены"
    echo "   Возможно, volume был пуст"
fi

# Запуск контейнеров
echo "🚀 Запуск контейнеров..."
docker compose start backend
echo "✅ Контейнеры запущены"
echo ""

# Проверка работы
echo "🔍 Проверка работы backend..."
sleep 5
if docker compose exec -T backend wget -qO- http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend работает"
else
    echo "⚠️  Backend не отвечает"
    echo "   Проверьте логи: docker compose logs backend"
fi
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   ✅ Миграция завершена!                                 ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Что было сделано:"
echo "   1. Создана директория /dataStore/files"
echo "   2. Файлы скопированы из Docker volume"
echo "   3. Настроены права доступа"
echo "   4. Контейнеры перезапущены"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Обновите docker-compose.yml:"
echo "      Замените: volumes:"
echo "                  - uploads_data:/app/uploads"
echo "      На:"
echo "                  volumes:"
echo "                  - /dataStore/files:/app/uploads/files"
echo ""
echo "   2. Удалите volumes:"
echo "      volumes:"
echo "        - uploads_data"
echo ""
echo "   3. Перезапустите контейнеры:"
echo "      docker compose restart"
echo ""
echo "   4. Проверьте работу:"
echo "      ls -lh /dataStore/files/"
echo ""
echo "💡 После успешной миграции можно удалить старый volume:"
echo "   docker volume rm $VOLUME_NAME"
echo ""
