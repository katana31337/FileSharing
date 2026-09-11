# ⚡ Быстрая миграция настроек админ-панели в PostgreSQL

## Что изменилось?

Настройки админ-панели теперь хранятся в PostgreSQL вместо localStorage.

**Было:** Frontend → localStorage ❌  
**Стало:** Frontend → API → PostgreSQL ✅

## Преимущества

- ✅ Настройки доступны с любого устройства
- ✅ Не теряются при очистке браузера
- ✅ Централизованное хранение
- ✅ Резервное копирование через бэкап БД
- ✅ Безопасное хранение учётных данных

## Установка

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

## Проверка

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

## API Endpoints

```
GET    /api/admin/settings              — получить настройки
PUT    /api/admin/settings              — обновить настройки
POST   /api/admin/settings/reset        — сбросить настройки
POST   /api/admin/settings/validate     — проверить учётные данные
GET    /api/admin/settings/has-credentials — проверить наличие учётных данных
```

## Подробнее

Смотрите [MIGRATION_ADMIN_SETTINGS.md](./MIGRATION_ADMIN_SETTINGS.md) для полной документации.

---

**Версия:** 1.0.14
