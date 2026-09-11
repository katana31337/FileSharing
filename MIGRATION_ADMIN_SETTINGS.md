# 🔄 Миграция настроек админ-панели в PostgreSQL

## 🎯 Что изменилось

### Старая архитектура
```
Frontend → localStorage (настройки) ❌
```

**Проблемы:**
- ❌ Настройки привязаны к браузеру
- ❌ При смене браузера настройки теряются
- ❌ localStorage может быть очищен пользователем
- ❌ Нет синхронизации между устройствами
- ❌ Логин/пароль хранятся в браузере (небезопасно)

### Новая архитектура
```
Frontend → API → PostgreSQL (настройки) ✅
```

**Преимущества:**
- ✅ Централизованное хранение настроек
- ✅ Синхронизация между устройствами
- ✅ Надёжное хранение в БД
- ✅ Резервное копирование через бэкап БД
- ✅ Безопасное хранение учётных данных

## 📊 Структура данных

### Таблица admin_settings
```sql
CREATE TABLE admin_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Хранимые настройки
| Ключ | Описание | Пример значения |
|------|----------|-----------------|
| `max_file_size` | Максимальный размер файла | `104857600` (100 MB) |
| `min_expiration_days` | Минимальный срок хранения | `1` |
| `max_expiration_days` | Максимальный срок хранения | `30` |
| `default_expiration_days` | Срок по умолчанию | `7` |
| `expiration_buttons` | Кнопки срока хранения | `[1,3,7,14,30]` |
| `session_duration_days` | Срок жизни сессии | `7` |
| `admin_login` | Логин администратора | `admin` |
| `admin_password` | Пароль администратора | `SecurePass123!` |
| `admin_secret_path` | Секретный путь | `secret-admin` |
| `logo` | Логотип (base64 или URL) | `data:image/png;base64,...` |
| `logo_type` | Тип логотипа | `none`, `file`, `url` |

## 🔌 API Endpoints

### GET /api/admin/settings
Получить все настройки

**Запрос:**
```http
GET /api/admin/settings
```

**Ответ:**
```json
{
  "maxFileSize": 104857600,
  "minExpirationDays": 1,
  "maxExpirationDays": 30,
  "defaultExpirationDays": 7,
  "expirationButtons": [1, 3, 7, 14, 30],
  "sessionDurationDays": 7,
  "adminLogin": "admin",
  "adminSecretPath": "secret-admin",
  "logo": "",
  "logoType": "none"
}
```

**Примечание:** Пароль НЕ возвращается в ответе для безопасности.

### PUT /api/admin/settings
Обновить настройки

**Запрос:**
```http
PUT /api/admin/settings
Content-Type: application/json

{
  "maxFileSize": 524288000,
  "expirationButtons": [1, 5, 10, 15, 30]
}
```

**Ответ:**
```json
{
  "maxFileSize": 524288000,
  "minExpirationDays": 1,
  "maxExpirationDays": 30,
  "defaultExpirationDays": 7,
  "expirationButtons": [1, 5, 10, 15, 30],
  "sessionDurationDays": 7,
  "adminLogin": "admin",
  "adminSecretPath": "secret-admin",
  "logo": "",
  "logoType": "none"
}
```

### POST /api/admin/settings/reset
Сбросить все настройки к значениям по умолчанию

**Запрос:**
```http
POST /api/admin/settings/reset
```

### POST /api/admin/settings/validate
Проверить учётные данные

**Запрос:**
```http
POST /api/admin/settings/validate
Content-Type: application/json

{
  "login": "admin",
  "password": "SecurePass123!"
}
```

**Ответ:**
```json
{
  "valid": true
}
```

### GET /api/admin/settings/has-credentials
Проверить, настроены ли учётные данные

**Запрос:**
```http
GET /api/admin/settings/has-credentials
```

**Ответ:**
```json
{
  "hasCredentials": true
}
```

## 🔄 Поток данных

### Загрузка настроек
```
1. Frontend запрашивает GET /api/admin/settings
   ↓
2. Backend читает из PostgreSQL
   ↓
3. Backend возвращает настройки (без пароля)
   ↓
4. Frontend кэширует настройки
```

### Сохранение настроек
```
1. Пользователь изменяет настройки в админ-панели
   ↓
2. Frontend отправляет PUT /api/admin/settings
   ↓
3. Backend валидирует данные
   ↓
4. Backend сохраняет в PostgreSQL
   ↓
5. Backend возвращает обновлённые настройки
   ↓
6. Frontend обновляет кэш
```

### Проверка учётных данных
```
1. Пользователь вводит логин и пароль
   ↓
2. Frontend отправляет POST /api/admin/settings/validate
   ↓
3. Backend сравнивает с данными из PostgreSQL
   ↓
4. Backend возвращает { valid: true/false }
```

## 🚀 Установка и запуск

### 1. Применить миграцию
```bash
cd server
psql -U fileshare -d fileshare -f migrations/002_admin_settings.sql
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

### Тест 1: Загрузка настроек
```
1. Откройте сайт
2. Откройте консоль (F12)
3. Должно быть сообщение:
   [AdminService] 📥 Настройки загружены из API
```

### Тест 2: Изменение настроек
```
1. Войдите в админ-панель
2. Измените максимальный размер файла
3. Сохраните настройки
4. Проверьте PostgreSQL:
   SELECT * FROM admin_settings WHERE key = 'max_file_size';
5. Значение должно обновиться
```

### Тест 3: Синхронизация между устройствами
```
1. Измените настройки на устройстве 1
2. Откройте сайт на устройстве 2
3. Настройки должны быть такими же
```

### Тест 4: Проверка учётных данных
```
1. Войдите в админ-панель
2. Введите логин и пароль
3. Должен произойти успешный вход
4. Проверьте PostgreSQL:
   SELECT * FROM admin_settings WHERE key IN ('admin_login', 'admin_password');
```

## 💡 Преимущества новой архитектуры

### Для пользователей
- ✅ Настройки доступны с любого устройства
- ✅ Не теряются при очистке браузера
- ✅ Надёжное хранение

### Для администраторов
- ✅ Централизованное управление
- ✅ Резервное копирование через бэкап БД
- ✅ Можно управлять через SQL

### Для разработчиков
- ✅ Чистая архитектура
- ✅ API-based подход
- ✅ Легко тестировать

## 🔒 Безопасность

### Что защищено?
- ✅ Пароль хранится в PostgreSQL (не в браузере)
- ✅ Пароль НЕ возвращается в API ответах
- ✅ Валидация учётных данных на сервере

### Рекомендации
- Используйте HTTPS (уже настроено)
- Регулярно меняйте пароль администратора
- Делайте резервные копии БД
- Ограничьте доступ к PostgreSQL

## 📚 Связанные документы

- [MIGRATION_TO_POSTGRES.md](./MIGRATION_TO_POSTGRES.md) - миграция истории загрузок
- [SESSIONS.md](./SESSIONS.md) - система сессий
- [README.md](./README.md) - основная документация

---

**Версия:** 1.0.14  
**Обновлено:** 2024
