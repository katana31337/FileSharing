# ⚡ Быстрое исправление ошибки "column does not exist"

## 🎯 Проблема

```
error: column "name" of relation "files" does not exist
```

## ✅ Быстрое решение (30 секунд)

```bash
# 1. Перейдите в директорию проекта
cd ~/FileSharing  # или /opt/fileshare

# 2. Запустите скрипт исправления
sudo bash fix-db-schema.sh

# 3. Введите "yes" для подтверждения

# 4. Готово! Попробуйте загрузить файл снова
```

## 📋 Что делает скрипт

- ✅ Удаляет старые таблицы с неправильной схемой
- ✅ Создаёт новые таблицы с правильной схемой
- ✅ Перезапускает backend
- ✅ Проверяет структуру таблиц

⚠️ **Внимание:** Это удалит все загруженные файлы и тексты!

## 🔍 Проверка после исправления

```bash
# Проверьте структуру таблицы
docker compose exec db psql -U fileshare -d fileshare -c "\d files"

# Должны увидеть колонки:
# - id
# - short_url
# - name          ← ВАЖНО!
# - size
# - mime_type
# - storage_path  ← ВАЖНО!
# - created_at
# - expires_at
# - max_downloads
# - download_count
# - password
```

## 🚀 Что делать дальше

1. **Откройте логи backend:**
   ```bash
   docker compose logs -f backend
   ```

2. **Загрузите файл через сайт**

3. **В логах должно быть:**
   ```
   [FileController] Получен файл: { ... }
   [FileService] ✅ Файл сохранён в хранилище
   [PostgresFileRepository] ✅ Запись успешно создана в БД
   [FileController] ✅ Файл успешно загружен: AbCdEfG
   ```

## ❌ Если не помогло

Смотрите подробную инструкцию: [FIX_DB_SCHEMA.md](./FIX_DB_SCHEMA.md)

---

**Версия:** 1.0.6  
**Обновлено:** 2024
