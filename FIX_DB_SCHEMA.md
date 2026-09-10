# 🔧 Исправление ошибки "column does not exist"

## 🐛 Проблема

При загрузке файла возникает ошибка:

```
error: column "name" of relation "files" does not exist
```

или

```
error: column "original_name" of relation "files" does not exist
```

## 🔍 Причина

Таблица `files` в базе данных была создана с неправильной схемой. Это произошло потому, что:

1. Старая версия `install.sh` создавала таблицу с колонками `original_name` и `stored_name`
2. Новая версия backend ожидает колонки `name` и `storage_path`
3. Миграция `001_initial.sql` была обновлена, но существующая таблица не была пересоздана

## ✅ Решение

### Вариант 1: Автоматическое исправление (рекомендуется)

Запустите скрипт исправления схемы:

```bash
cd ~/FileSharing  # или /opt/fileshare для production
sudo bash fix-db-schema.sh
```

Скрипт:
- ✅ Удалит старые таблицы `files` и `text_snippets`
- ✅ Создаст новые таблицы с правильной схемой
- ✅ Перезапустит backend
- ✅ Проверит структуру таблиц

⚠️ **Внимание:** Это удалит все загруженные файлы и тексты!

### Вариант 2: Ручное исправление

Если скрипт не работает, выполните вручную:

```bash
# Подключитесь к БД
docker compose exec db psql -U fileshare -d fileshare

# Выполните SQL команды
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS text_snippets CASCADE;

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

CREATE TABLE text_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_url VARCHAR(10) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
    content TEXT NOT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_files_short_url ON files(short_url);
CREATE INDEX idx_files_expires_at ON files(expires_at);
CREATE INDEX idx_text_snippets_short_url ON text_snippets(short_url);
CREATE INDEX idx_text_snippets_expires_at ON text_snippets(expires_at);

# Выйдите из psql
\q

# Перезапустите backend
docker compose restart backend
```

### Вариант 3: Полная переустановка

Если ничего не помогает:

```bash
# Остановка и удаление всех данных
docker compose down -v

# Переустановка
sudo bash install.sh
```

⚠️ **Внимание:** Это удалит ВСЕ данные!

## 📋 Проверка схемы таблицы

После исправления проверьте структуру таблицы:

```bash
docker compose exec db psql -U fileshare -d fileshare -c "\d files"
```

Должно быть:

```
                                    Table "public.files"
    Column     |           Type           | Collation | Nullable |      Default      
---------------+--------------------------+-----------+----------+-------------------
 id            | uuid                     |           | not null | gen_random_uuid()
 short_url     | character varying(10)    |           | not null | 
 name          | character varying(500)   |           | not null | 
 size          | bigint                   |           | not null | 
 mime_type     | character varying(255)   |           | not null | 
 storage_path  | text                     |           | not null | 
 created_at    | timestamp with time zone |           |          | CURRENT_TIMESTAMP
 expires_at    | timestamp with time zone |           | not null | 
 max_downloads | integer                  |           |          | 
 download_count| integer                  |           |          | 0
 password      | character varying(255)   |           |          | 
Indexes:
    "files_pkey" PRIMARY KEY, btree (id)
    "files_short_url_key" UNIQUE CONSTRAINT, btree (short_url)
    "idx_files_expires_at" btree (expires_at)
    "idx_files_short_url" btree (short_url)
```

## 🎯 Что делать после исправления

1. **Перезапустите backend:**
   ```bash
   docker compose restart backend
   ```

2. **Откройте логи backend:**
   ```bash
   docker compose logs -f backend
   ```

3. **Попробуйте загрузить файл снова**

4. **Проверьте, что файл загружен:**
   ```bash
   docker compose exec db psql -U fileshare -d fileshare -c "SELECT * FROM files;"
   ```

## 📊 Полная структура БД

### Таблица `files`

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID | Уникальный идентификатор |
| `short_url` | VARCHAR(10) | Короткая ссылка |
| `name` | VARCHAR(500) | Оригинальное имя файла |
| `size` | BIGINT | Размер файла в байтах |
| `mime_type` | VARCHAR(255) | MIME тип файла |
| `storage_path` | TEXT | Путь к файлу в хранилище |
| `created_at` | TIMESTAMP | Дата создания |
| `expires_at` | TIMESTAMP | Дата истечения срока |
| `max_downloads` | INTEGER | Максимальное количество скачиваний |
| `download_count` | INTEGER | Текущее количество скачиваний |
| `password` | VARCHAR(255) | Пароль для доступа (опционально) |

### Таблица `text_snippets`

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID | Уникальный идентификатор |
| `short_url` | VARCHAR(10) | Короткая ссылка |
| `title` | VARCHAR(255) | Заголовок сниппета |
| `content` | TEXT | Содержимое сниппета |
| `language` | VARCHAR(50) | Язык программирования |
| `created_at` | TIMESTAMP | Дата создания |
| `expires_at` | TIMESTAMP | Дата истечения срока |

### Таблица `admin_settings`

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | SERIAL | Уникальный идентификатор |
| `key` | VARCHAR(255) | Ключ настройки |
| `value` | TEXT | Значение настройки |
| `updated_at` | TIMESTAMP | Дата обновления |

## 💡 Полезные команды

```bash
# Проверка структуры таблицы
docker compose exec db psql -U fileshare -d fileshare -c "\d files"

# Просмотр всех файлов
docker compose exec db psql -U fileshare -d fileshare -c "SELECT * FROM files;"

# Просмотр всех текстов
docker compose exec db psql -U fileshare -d fileshare -c "SELECT * FROM text_snippets;"

# Просмотр настроек админки
docker compose exec db psql -U fileshare -d fileshare -c "SELECT * FROM admin_settings;"

# Подсчёт файлов
docker compose exec db psql -U fileshare -d fileshare -c "SELECT COUNT(*) FROM files;"

# Удаление истёкших файлов
docker compose exec db psql -U fileshare -d fileshare -c "SELECT cleanup_expired();"
```

## 🚀 Что было исправлено

### Backend

- ✅ Обновлена миграция `001_initial.sql` с правильной схемой
- ✅ Обновлён `install.sh` для создания правильной схемы
- ✅ Создан скрипт `fix-db-schema.sh` для исправления существующих БД

### Документация

- ✅ Создан `FIX_DB_SCHEMA.md` с подробной инструкцией
- ✅ Обновлён `README.md` с ссылкой на инструкцию

## 📞 Если ничего не помогло

Пришлите:

1. **Вывод команды:**
   ```bash
   docker compose exec db psql -U fileshare -d fileshare -c "\d files"
   ```

2. **Логи backend:**
   ```bash
   docker compose logs --tail=50 backend
   ```

3. **Вывод `bash full-diagnose.sh`**

---

**Последнее обновление:** 2024  
**Версия FileShare:** 1.0.6
