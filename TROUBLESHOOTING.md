# 🔍 Диагностика проблемы "Не найдено"

Если при переходе по ссылке вы видите ошибку **"Ссылка не найдена или срок хранения истёк"**, следуйте этой инструкции.

## 🎯 Быстрая проверка

### 1. Откройте консоль браузера (F12)

Перейдите на вкладку **Console** и найдите сообщения от `[FileShare]`:

```
✅ [FileShare] API ✅ доступен, используем backend
✅ [FileShare] 🔍 Поиск файла/текста по ссылке: AbCdEfG
✅ [FileShare] 📁 Попытка получить файл...
✅ [FileShare] ✅ Файл найден: {...}
```

Или если есть проблема:

```
❌ [FileShare] API ❌ недоступен, используем localStorage
❌ [FileShare] ❌ Файл не найден
❌ [FileShare] ❌ Текст не найден
```

### 2. Запустите полную диагностику

```bash
cd /opt/fileshare
sudo bash full-diagnose.sh
```

Этот скрипт проверит:
- ✅ Статус всех контейнеров
- ✅ Здоровье PostgreSQL
- ✅ Работу Backend API
- ✅ Проксирование через Nginx
- ✅ Наличие файлов в базе данных
- ✅ Настройки админки

## 🔧 Типичные проблемы и решения

### Проблема 1: API недоступен

**Симптом:** В консоли браузера видите:
```
❌ [FileShare] API ❌ недоступен, используем localStorage
```

**Причина:** Frontend не может подключиться к Backend API.

**Решение:**

1. Проверьте, что backend запущен:
   ```bash
   docker compose ps | grep backend
   ```

2. Проверьте логи backend:
   ```bash
   docker compose logs --tail=50 backend
   ```

3. Проверьте, что API отвечает напрямую:
   ```bash
   docker compose exec backend wget -qO- http://localhost:3001/api/health
   ```

4. Проверьте, что nginx проксирует запросы:
   ```bash
   curl -k https://localhost/api/health
   ```

5. Перезапустите сервисы:
   ```bash
   docker compose restart
   ```

### Проблема 2: Файл не найден в БД

**Симптом:** API доступен, но файл не находится.

**Причина:** Файл был загружен в localStorage, а не в backend.

**Решение:**

1. Проверьте, есть ли файл в базе данных:
   ```bash
   docker compose exec db psql -U fileshare -d fileshare -c "SELECT * FROM files WHERE short_url = 'AbCdEfG';"
   ```
   (Замените `AbCdEfG` на ваш short_url)

2. Если файл есть в БД, но не находится:
   - Проверьте срок действия файла
   - Проверьте, что short_url совпадает
   - Проверьте логи backend: `docker compose logs backend`

3. Если файла нет в БД:
   - Файл был загружен в localStorage (старая версия)
   - Загрузите файл заново через текущую версию

### Проблема 3: CORS ошибки

**Симптом:** В консоли браузера видите ошибки CORS.

**Причина:** Backend не разрешает запросы с вашего домена.

**Решение:**

1. Проверьте переменную окружения `CORS_ORIGIN` в `.env`:
   ```bash
   cat /opt/fileshare/.env | grep CORS_ORIGIN
   ```

2. Должно быть что-то вроде:
   ```
   CORS_ORIGIN=https://fileshare.local
   ```

3. Если нужно изменить, отредактируйте `.env` и перезапустите backend:
   ```bash
   nano /opt/fileshare/.env
   docker compose restart backend
   ```

### Проблема 4: Nginx не проксирует API

**Симптом:** Backend работает, но API недоступен через nginx.

**Причина:** Nginx не настроен на проксирование `/api` на backend.

**Решение:**

1. Проверьте конфигурацию nginx:
   ```bash
   cat /opt/fileshare/nginx.conf | grep -A 10 "location /api"
   ```

2. Должно быть:
   ```nginx
   location /api {
       proxy_pass http://backend:3001;
       ...
   }
   ```

3. Перезапустите nginx:
   ```bash
   docker compose restart nginx
   ```

## 📊 Проверка данных в базе данных

### Посмотреть все файлы:

```bash
docker compose exec db psql -U fileshare -d fileshare -c "
SELECT 
    short_url,
    original_name,
    size,
    mime_type,
    created_at,
    expires_at,
    CASE 
        WHEN expires_at > NOW() THEN '✅ Активен'
        ELSE '❌ Истёк'
    END as status
FROM files
ORDER BY created_at DESC;
"
```

### Посмотреть все тексты:

```bash
docker compose exec db psql -U fileshare -d fileshare -c "
SELECT 
    short_url,
    title,
    language,
    created_at,
    expires_at,
    CASE 
        WHEN expires_at > NOW() THEN '✅ Активен'
        ELSE '❌ Истёк'
    END as status
FROM text_snippets
ORDER BY created_at DESC;
"
```

### Найти конкретный файл по short_url:

```bash
docker compose exec db psql -U fileshare -d fileshare -c "
SELECT * FROM files WHERE short_url = 'AbCdEfG';
"
```

## 🔄 Полная переустановка

Если ничего не помогает, выполните полную переустановку:

⚠️ **Внимание:** Это удалит все данные!

```bash
# Остановка и удаление всех данных
cd /opt/fileshare
docker compose down -v

# Переустановка
sudo bash install.sh
```

## 📞 Получение помощи

Если проблема не решена, соберите следующую информацию:

1. Вывод `sudo bash full-diagnose.sh`
2. Скриншот консоли браузера (F12 → Console)
3. Логи всех сервисов:
   ```bash
   docker compose logs > logs.txt
   ```

## 🎯 Чек-лист диагностики

- [ ] Контейнеры запущены (`docker compose ps`)
- [ ] PostgreSQL здоров
- [ ] Backend API отвечает (`curl -k https://localhost/api/health`)
- [ ] Nginx проксирует API
- [ ] Файл есть в базе данных
- [ ] Срок действия файла не истёк
- [ ] В консоли браузера нет ошибок
- [ ] CORS настроен правильно

## 💡 Полезные команды

```bash
# Статус всех контейнеров
docker compose ps

# Логи в реальном времени
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f backend
docker compose logs -f nginx
docker compose logs -f db

# Перезапуск всех сервисов
docker compose restart

# Перезапуск конкретного сервиса
docker compose restart backend

# Проверка здоровья backend
curl -k https://localhost/api/health

# Подключение к БД
docker compose exec db psql -U fileshare -d fileshare

# Полная очистка (УДАЛИТ ВСЕ ДАННЫЕ!)
docker compose down -v
```

---

**Последнее обновление:** 2024
**Версия FileShare:** 1.0.3
