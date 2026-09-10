# 🔍 Диагностика проблемы "Не найдено"

## 📋 Что делать прямо сейчас

### 1. Пересоберите Docker образы

```bash
sudo sh publish-docker.sh katana31337 1.0.5
```

### 2. Обновите код

```bash
cd ~/FileSharing  # или где у вас проект
git pull
```

### 3. Перезапустите контейнеры

```bash
docker compose restart
```

### 4. Откройте сайт и загрузите файл

1. Откройте сайт в браузере
2. Загрузите файл
3. Скопируйте ссылку (должна быть типа `https://fileshare.local/#/s/AbCdEfG`)

### 5. Откройте консоль браузера (F12)

Перейдите на вкладку **Console**.

### 6. Откройте ссылку в другом браузере или в режиме инкогнито

### 7. Смотрите в консоль

Теперь вы увидите **подробные цветные логи** от `[FileShare]`:

```
🚀 [FileShare] ShareView компонент загружен
📎 [FileShare] shortUrl из URL: AbCdEfG
🌐 [FileShare] Текущий URL: https://fileshare.local/#/s/AbCdEfG
⚡ [FileShare] useEffect loadData запущен
📎 [FileShare] shortUrl: AbCdEfG
🔍 [FileShare] Поиск файла/текста по ссылке: AbCdEfG
✅ [FileShare] API ✅ доступен
📁 [FileShare] Попытка получить файл...
🔎 [FileShare] getFileByShortUrl вызван для: AbCdEfG
🔧 [FileShare] useApi = true
📡 [FileShare] Запрос к API: getFileInfo(AbCdEfG)
📡 [API] GET /api/files/AbCdEfG
📨 [API] Response status: 200 OK
✅ [API] Response data: {...}
✅ [FileShare] API вернул: {...}
✅ [FileShare] Файл найден: {...}
```

## 🎯 Что означают разные логи

### ✅ Всё работает правильно

Если видите такую последовательность:
```
🚀 ShareView компонент загружен
📎 shortUrl из URL: AbCdEfG
⚡ useEffect loadData запущен
🔍 Поиск файла/текста по ссылке: AbCdEfG
✅ API ✅ доступен
📁 Попытка получить файл...
📡 [API] GET /api/files/AbCdEfG
📨 [API] Response status: 200 OK
✅ Файл найден
```

**Всё работает!** Файл должен отобразиться.

### ❌ Проблема: shortUrl пустой

Если видите:
```
🚀 ShareView компонент загружен
📎 shortUrl из URL: undefined
❌ shortUrl пустой или undefined!
```

**Проблема:** Роутинг не работает правильно.

**Решение:**
1. Проверьте, что ссылка имеет формат `https://fileshare.local/#/s/AbCdEfG`
2. Обратите внимание на `#/s/` — это важно для HashRouter
3. Если ссылка без `#/s/`, значит она сгенерирована неправильно

### ❌ Проблема: API недоступен

Если видите:
```
🚀 ShareView компонент загружен
📎 shortUrl из URL: AbCdEfG
⚡ useEffect loadData запущен
❌ API ❌ недоступен
```

**Проблема:** Frontend не может подключиться к Backend API.

**Решение:**
1. Запустите `bash full-diagnose.sh`
2. Проверьте, что backend запущен: `docker compose ps | grep backend`
3. Проверьте логи backend: `docker compose logs backend`
4. Перезапустите: `docker compose restart`

### ❌ Проблема: Файл не найден в API

Если видите:
```
🚀 ShareView компонент загружен
📎 shortUrl из URL: AbCdEfG
⚡ useEffect loadData запущен
✅ API ✅ доступен
📁 Попытка получить файл...
🔎 getFileByShortUrl вызван для: AbCdEfG
📡 [API] GET /api/files/AbCdEfG
📨 [API] Response status: 404 Not Found
❌ Ошибка API: Error: Файл не найден или срок хранения истёк
💾 Проверка localStorage...
❌ localStorage: не найден
```

**Проблема:** Файл не существует в базе данных или срок хранения истёк.

**Решение:**
1. Проверьте файлы в БД:
   ```bash
   docker compose exec db psql -U fileshare -d fileshare -c "SELECT * FROM files WHERE short_url = 'AbCdEfG';"
   ```
2. Если файл есть, но срок истёк — загрузите заново
3. Если файла нет — загрузите заново

### ❌ Проблема: useApi = false

Если видите:
```
🔎 getFileByShortUrl вызван для: AbCdEfG
⚠️ useApi = false, используем localStorage
💾 Проверка localStorage...
❌ localStorage: не найден
```

**Проблема:** Frontend переключился на localStorage вместо API.

**Причина:** При загрузке файла API был недоступен, и файл сохранился в localStorage.

**Решение:**
1. Перезапустите контейнеры: `docker compose restart`
2. Обновите страницу (F5)
3. Загрузите файл заново
4. Проверьте, что в консоли видно `✅ API ✅ доступен`

## 📊 Проверка файлов в базе данных

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

### Найти конкретный файл:

```bash
docker compose exec db psql -U fileshare -d fileshare -c "
SELECT * FROM files WHERE short_url = 'AbCdEfG';
"
```

## 🔧 Полезные команды

```bash
# Перезапуск всех сервисов
docker compose restart

# Логи backend в реальном времени
docker compose logs -f backend

# Логи nginx в реальном времени
docker compose logs -f nginx

# Проверка здоровья API
curl -k https://localhost/api/health

# Полная диагностика
bash full-diagnose.sh
```

## 📞 Если ничего не помогло

Пришлите:

1. **Полный вывод консоли браузера** (F12 → Console → правый клик → Save as...)
2. **Вывод `bash full-diagnose.sh`**
3. **Содержимое БД:**
   ```bash
   docker compose exec db psql -U fileshare -d fileshare -c "SELECT * FROM files;" > files.txt
   docker compose exec db psql -U fileshare -d fileshare -c "SELECT * FROM text_snippets;" > texts.txt
   ```

## 💡 Частые ошибки

### Ошибка 1: Ссылка без `#/s/`

**Неправильно:** `https://fileshare.local/s/AbCdEfG`  
**Правильно:** `https://fileshare.local/#/s/AbCdEfG`

Обратите внимание на `#` — это важно для HashRouter!

### Ошибка 2: Файл загружен в localStorage

Если при загрузке файла API был недоступен, файл сохраняется в localStorage браузера. Этот файл будет доступен только в том браузере, где он был загружен.

**Решение:** Убедитесь, что API доступен перед загрузкой файла.

### Ошибка 3: Срок хранения истёк

Файлы автоматически удаляются по истечении срока хранения. Проверьте `expires_at` в базе данных.

## 🎯 Чек-лист

- [ ] Docker образы пересобраны (версия 1.0.5)
- [ ] Код обновлён (`git pull`)
- [ ] Контейнеры перезапущены (`docker compose restart`)
- [ ] В консоли браузера видны цветные логи от `[FileShare]`
- [ ] API доступен (`✅ API ✅ доступен`)
- [ ] shortUrl не пустой
- [ ] Файл есть в базе данных
- [ ] Срок хранения не истёк

---

**Последнее обновление:** 2024  
**Версия FileShare:** 1.0.5
