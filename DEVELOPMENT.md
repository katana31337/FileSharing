# Запуск FileShare для разработки

## Требования

- Node.js 24+
- PostgreSQL 16+
- npm или yarn

## Шаг 1: Запуск PostgreSQL

### Вариант A: Через Docker (рекомендуется)

```bash
docker run -d \
  --name fileshare-postgres \
  -e POSTGRES_USER=fileshare \
  -e POSTGRES_PASSWORD=fileshare_secret \
  -e POSTGRES_DB=fileshare \
  -p 5432:5432 \
  postgres:16-alpine
```

### Вариант B: Локальная установка

Убедитесь, что PostgreSQL запущен и создайте базу данных:

```bash
createdb fileshare
```

## Шаг 2: Инициализация базы данных

```bash
cd server
psql -U fileshare -d fileshare -f migrations/001_initial.sql
```

## Шаг 3: Запуск Backend

```bash
cd server
npm install
npm run dev
```

Backend будет доступен на `http://localhost:3001`

## Шаг 4: Запуск Frontend

В другом терминале:

```bash
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:3000`

## Шаг 5: Проверка работы

1. Откройте `http://localhost:3000` в браузере
2. Загрузите файл
3. Скопируйте ссылку
4. Откройте ссылку в другом браузере или в режиме инкогнито
5. Файл должен быть доступен!

## Проверка Backend

Проверьте, что backend работает:

```bash
curl http://localhost:3001/api/health
```

Должен вернуться JSON с статусом "ok".

## Проверка Proxy

Vite dev server проксирует запросы `/api` на backend:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- API запросы: `http://localhost:3000/api/*` → `http://localhost:3001/api/*`

## Устранение проблем

### Backend не запускается

Проверьте логи PostgreSQL:

```bash
docker logs fileshare-postgres
```

### CORS ошибки

Убедитесь, что в `server/.env` указано:

```
CORS_ORIGIN=http://localhost:3000
```

### Файлы не загружаются

Проверьте, что директория `server/uploads` существует:

```bash
mkdir -p server/uploads
```

### База данных не подключается

Проверьте настройки в `server/.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=fileshare
DB_PASSWORD=fileshare_secret
DB_NAME=fileshare
```

### Файлы не доступны по ссылке

Если после загрузки файла и перехода по ссылке появляется ошибка "Не найдено":

1. **Запустите диагностику:**
   ```bash
   sudo bash diagnose.sh
   ```

2. **Проверьте, что backend работает:**
   ```bash
   curl http://localhost:3001/api/health
   ```

3. **Проверьте, что API доступен через nginx:**
   ```bash
   curl -k https://localhost/api/health
   ```

4. **Проверьте консоль браузера (F12):**
   - Откройте вкладку Console
   - Найдите сообщения о доступности API
   - Должно быть: "API доступен, используем backend"

5. **Проверьте файлы в базе данных:**
   ```bash
   docker compose exec db psql -U fileshare -d fileshare -c "SELECT * FROM files;"
   ```

6. **Если файлы есть в БД, но не доступны:**
   - Проверьте, что frontend использует API, а не localStorage
   - Проверьте логи nginx: `docker compose logs nginx`
   - Проверьте, что nginx проксирует `/api` на backend

### Очистка и переустановка

Если проблемы не решаются, выполните полную переустановку:

```bash
# Остановка и удаление всех данных
docker compose down -v

# Пересборка образов
docker compose build --no-cache

# Запуск
docker compose up -d
```

## Production запуск

Для production используйте Docker Compose:

```bash
docker-compose up -d
```

Все сервисы запустятся автоматически:
- PostgreSQL
- Backend
- Frontend (Nginx)
