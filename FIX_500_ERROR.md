# 🐛 Решение проблемы HTTP 500 при загрузке файла

## 🎯 Проблема

При загрузке файла backend возвращает **HTTP 500 Internal Server Error**.

В консоли браузера видно:
```
POST https://fileshare.local/api/files
[HTTP/2 500  242ms]
API ошибка, переключаемся на localStorage: Error: Ошибка загрузки файла
```

## 🔍 Что было исправлено

Добавлено **подробное логирование** на всех уровнях backend:

### 1. FileController.ts
- ✅ Логирование получения файла
- ✅ Логирование вызова FileService
- ✅ Логирование успешной загрузки
- ✅ Подробное логирование ошибок

### 2. FileService.ts
- ✅ Логирование начала загрузки
- ✅ Логирование сохранения в хранилище
- ✅ Логирование генерации shortUrl
- ✅ Логирование сохранения в БД

### 3. LocalStorageProvider.ts
- ✅ Логирование пути сохранения
- ✅ Логирование создания директории
- ✅ Логирование записи файла
- ✅ Логирование ошибок записи

### 4. PostgresFileRepository.ts
- ✅ Логирование создания записи
- ✅ Логирование срока действия
- ✅ Логирование выполнения SQL
- ✅ Логирование ошибок БД

## 🚀 Что нужно сделать

### 1. Пересоберите Docker образы

```bash
sudo sh publish-docker.sh katana31337 1.0.6
```

### 2. Обновите код на сервере

```bash
cd ~/FileSharing
git pull
```

### 3. Перезапустите контейнеры

```bash
docker compose restart
```

### 4. Откройте логи backend в реальном времени

**В ОТДЕЛЬНОМ терминале:**

```bash
docker compose logs -f backend
```

### 5. Попробуйте загрузить файл снова

В браузере:
1. Откройте сайт
2. Загрузите файл
3. Смотрите в консоль браузера (F12)

В терминале с логами backend вы увидите **подробную цепочку**:

```
[FileController] Получен файл: { originalname: 'test.txt', size: 1234, ... }
[FileController] Вызов fileService.uploadFile...
[FileService] Начало загрузки файла: { filename: 'test.txt', ... }
[FileService] Сохранение файла в хранилище...
[LocalStorageProvider] Начало сохранения файла: { filename: 'test.txt', ... }
[LocalStorageProvider] Путь для сохранения: /app/uploads/files/1234567890-test.txt
[LocalStorageProvider] Создание директории: /app/uploads/files
[LocalStorageProvider] ✅ Директория создана
[LocalStorageProvider] Файл является Readable stream...
[LocalStorageProvider] ✅ Файл успешно записан на диск
[LocalStorageProvider] Возвращаем storagePath: files/1234567890-test.txt
[FileService] ✅ Файл сохранён в хранилище: files/1234567890-test.txt
[FileService] Сгенерирован shortUrl: AbCdEfG
[FileService] Сохранение метаданных в БД...
[PostgresFileRepository] Создание записи в БД: { shortUrl: 'AbCdEfG', ... }
[PostgresFileRepository] Срок действия: 2024-12-25T...
[PostgresFileRepository] Выполнение SQL INSERT...
[PostgresFileRepository] ✅ Запись успешно создана в БД
[FileService] ✅ Метаданные сохранены в БД
[FileController] Файл успешно загружен: AbCdEfG
```

## 🔬 Если снова ошибка 500

### Смотрите логи backend

В терминале с `docker compose logs -f backend` вы увидите **точное место ошибки**:

### Пример 1: Ошибка хранилища

```
[LocalStorageProvider] ❌ Ошибка записи файла: Error: EACCES: permission denied
```

**Решение:** Проверьте права на директорию `/app/uploads`

```bash
docker compose exec backend ls -la /app
docker compose exec backend chmod -R 755 /app/uploads
```

### Пример 2: Ошибка БД

```
[PostgresFileRepository] ❌ Ошибка создания записи в БД: error: relation "files" does not exist
```

**Решение:** Примените миграции

```bash
docker compose exec db psql -U fileshare -d fileshare < server/migrations/001_initial.sql
```

### Пример 3: Ошибка multer

```
[FileController] ❌ Upload error: Error: Unexpected field
```

**Решение:** Проверьте, что frontend отправляет файл с правильным именем поля `file`

### Пример 4: Ошибка размера файла

```
[FileController] ❌ Upload error: Error: File too large
```

**Решение:** Увеличьте лимит в `server/src/routes/index.ts`:

```typescript
const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});
```

## 📊 Проверка состояния системы

### Проверьте, что backend работает

```bash
curl -k https://localhost/api/health
```

Должно вернуть:
```json
{"status":"ok","timestamp":"...","version":"1.0.0"}
```

### Проверьте файлы в БД

```bash
docker compose exec db psql -U fileshare -d fileshare -c "SELECT * FROM files;"
```

### Проверьте файлы на диске

```bash
docker compose exec backend ls -la /app/uploads/files/
```

### Проверьте права на директорию

```bash
docker compose exec backend ls -la /app/
```

Должно быть:
```
drwxr-xr-x    1 node     node          4096 ... uploads
```

## 🎯 Чек-лист

- [ ] Docker образы пересобраны (версия 1.0.6)
- [ ] Код обновлён (`git pull`)
- [ ] Контейнеры перезапущены (`docker compose restart`)
- [ ] Логи backend открыты в отдельном терминале (`docker compose logs -f backend`)
- [ ] Попытка загрузки файла выполнена
- [ ] В логах backend видна полная цепочка вызовов
- [ ] Если ошибка - видно точное место ошибки в логах

## 💡 Полезные команды

```bash
# Логи backend в реальном времени
docker compose logs -f backend

# Логи всех сервисов
docker compose logs -f

# Перезапуск backend
docker compose restart backend

# Проверка здоровья backend
curl -k https://localhost/api/health

# Подключение к БД
docker compose exec db psql -U fileshare -d fileshare

# Проверка файлов в БД
docker compose exec db psql -U fileshare -d fileshare -c "SELECT * FROM files;"

# Проверка файлов на диске
docker compose exec backend ls -la /app/uploads/files/

# Полная диагностика
bash full-diagnose.sh
```

## 📞 Если ничего не помогло

Пришлите:

1. **Полные логи backend** (скопируйте из терминала с `docker compose logs -f backend`)
2. **Вывод `bash full-diagnose.sh`**
3. **Скриншот консоли браузера** (F12 → Console)

---

**Последнее обновление:** 2024  
**Версия FileShare:** 1.0.6
