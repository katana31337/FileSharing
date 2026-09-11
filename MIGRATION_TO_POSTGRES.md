# 🔄 Миграция с localStorage на PostgreSQL

## 🎯 Что изменилось

### Старая архитектура
```
Cookie (session_id) → localStorage (история) ❌
```

**Проблемы:**
- ❌ История привязана к браузеру
- ❌ При смене браузера история теряется
- ❌ localStorage может быть очищен пользователем
- ❌ Нет синхронизации между устройствами
- ❌ Нет резервного копирования

### Новая архитектура
```
Cookie (session_id) → PostgreSQL (история) ✅
```

**Преимущества:**
- ✅ История синхронизируется между устройствами
- ✅ Надёжное хранение в БД
- ✅ Резервное копирование через бэкап БД
- ✅ Администратор может управлять историями
- ✅ Не зависит от очистки браузера

## 📊 Структура данных

### Таблица session_files
```sql
CREATE TABLE session_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,
  short_url VARCHAR(10) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### Таблица session_texts
```sql
CREATE TABLE session_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,
  short_url VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

## 🔌 API Endpoints

### GET /api/session/history
Получить историю сессии

**Запрос:**
```http
GET /api/session/history
Cookie: fileshare_session_id=sess_lx7k9m2_a7b9c3d
```

**Ответ:**
```json
{
  "files": [
    {
      "id": "uuid",
      "session_id": "sess_lx7k9m2_a7b9c3d",
      "short_url": "abc123",
      "file_name": "document.pdf",
      "file_size": 1048576,
      "uploaded_at": "2024-12-18T12:00:00Z",
      "expires_at": "2024-12-25T12:00:00Z"
    }
  ],
  "texts": []
}
```

### POST /api/session/history/file
Добавить файл в историю сессии

**Запрос:**
```http
POST /api/session/history/file
Cookie: fileshare_session_id=sess_lx7k9m2_a7b9c3d
Content-Type: application/json

{
  "shortUrl": "abc123",
  "fileName": "document.pdf",
  "fileSize": 1048576,
  "expiresInDays": 7
}
```

### POST /api/session/history/text
Добавить текст в историю сессии

**Запрос:**
```http
POST /api/session/history/text
Cookie: fileshare_session_id=sess_lx7k9m2_a7b9c3d
Content-Type: application/json

{
  "shortUrl": "xyz789",
  "title": "My Code",
  "expiresInDays": 7
}
```

### DELETE /api/session/history/file/:shortUrl
Удалить файл из истории сессии

**Запрос:**
```http
DELETE /api/session/history/file/abc123
Cookie: fileshare_session_id=sess_lx7k9m2_a7b9c3d
```

### DELETE /api/session/history/text/:shortUrl
Удалить текст из истории сессии

**Запрос:**
```http
DELETE /api/session/history/text/xyz789
Cookie: fileshare_session_id=sess_lx7k9m2_a7b9c3d
```

### DELETE /api/session/history
Очистить всю историю сессии

**Запрос:**
```http
DELETE /api/session/history
Cookie: fileshare_session_id=sess_lx7k9m2_a7b9c3d
```

## 🔄 Поток данных

### Загрузка файла
```
1. Пользователь выбирает файл
   ↓
2. Frontend отправляет POST /api/files
   ↓
3. Backend сохраняет файл в /dataStore/files/
   ↓
4. Backend сохраняет метаданные в PostgreSQL (таблица files)
   ↓
5. Backend возвращает shortUrl
   ↓
6. Frontend отправляет POST /api/session/history/file
   ↓
7. Backend добавляет файл в историю сессии (таблица session_files)
   ↓
8. Пользователь видит файл в истории
```

### Повторный визит
```
1. Пользователь заходит на сайт
   ↓
2. Frontend читает cookie fileshare_session_id
   ↓
3. Frontend отправляет GET /api/session/history
   ↓
4. Backend возвращает историю из PostgreSQL
   ↓
5. Frontend отображает историю загрузок
```

## 🚀 Установка и запуск

### 1. Применить миграцию
```bash
cd server
psql -U fileshare -d fileshare -f migrations/003_session_history.sql
```

### 2. Установить зависимости backend
```bash
cd server
npm install
```

### 3. Запустить backend
```bash
npm run dev
```

### 4. Запустить frontend
```bash
npm run dev
```

## 🧪 Тестирование

### Тест 1: Загрузка файла
```
1. Откройте сайт
2. Загрузите файл
3. Проверьте PostgreSQL:
   SELECT * FROM session_files;
4. Должна быть запись с session_id из cookie
```

### Тест 2: Повторный визит
```
1. Загрузите файл
2. Закройте браузер
3. Откройте браузер снова
4. Перейдите на сайт
5. История должна восстановиться из БД
```

### Тест 3: Удаление из истории
```
1. Загрузите файл
2. Удалите файл из истории
3. Проверьте PostgreSQL:
   SELECT * FROM session_files WHERE short_url = 'abc123';
4. Запись должна быть удалена
```

## 💡 Преимущества новой архитектуры

### Для пользователей
- ✅ История сохраняется между устройствами
- ✅ Не теряется при очистке браузера
- ✅ Надёжное хранение

### Для администраторов
- ✅ Можно управлять историями через БД
- ✅ Резервное копирование через бэкап БД
- ✅ Можно анализировать использование

### Для разработчиков
- ✅ Чистая архитектура
- ✅ API-based подход
- ✅ Легко тестировать

## 📚 Связанные документы

- [SESSIONS.md](./SESSIONS.md) - общая документация по сессиям
- [README.md](./README.md) - основная документация проекта

---

**Версия:** 1.0.13  
**Обновлено:** 2024
