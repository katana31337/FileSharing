# 🚀 Быстрый старт по сценариям

## 📋 Выберите ваш сценарий

### 🏢 Production (сервер)

Вы установили FileShare на сервер через `install.sh` в `/opt/fileshare`.

**Все команды выполняйте из `/opt/fileshare`:**

```bash
cd /opt/fileshare

# Диагностика
sudo bash full-diagnose.sh

# Пересборка после обновления
sudo bash rebuild.sh

# Применение миграций
sudo bash apply-migrations.sh
```

---

### 💻 Разработка (локальный компьютер)

Вы делаете `git pull` в свою папку и работаете оттуда.

**Все команды выполняйте из вашей папки с проектом:**

```bash
cd ~/FileSharing  # или где у вас проект

# Запуск для разработки
docker compose up -d

# Диагностика
bash full-diagnose.sh

# Пересборка после обновления
bash rebuild.sh

# Применение миграций
bash apply-migrations.sh
```

> 💡 **Не нужно переходить в `/opt/fileshare`!** Скрипты работают из любой директории.

---

## 🔍 Как проверить, что всё работает

### 1. Запустите диагностику

```bash
bash full-diagnose.sh
```

Должны увидеть:
```
✅ PostgreSQL работает и здоров
✅ Backend запущен
✅ Backend API отвечает
✅ Nginx запущен
✅ API доступен через Nginx (HTTPS)
```

### 2. Откройте сайт в браузере

Перейдите по адресу вашего сайта (например, `https://fileshare.local`).

### 3. Загрузите файл

1. Выберите файл
2. Дождитесь загрузки
3. Скопируйте ссылку

### 4. Откройте консоль браузера (F12)

Перейдите на вкладку **Console**.

### 5. Откройте ссылку в другом браузере

Должны увидеть в консоли:
```
✅ [FileShare] API ✅ доступен, используем backend
✅ [FileShare] 🔍 Поиск файла/текста по ссылке: AbCdEfG
✅ [FileShare] 📁 Попытка получить файл...
✅ [FileShare] ✅ Файл найден: {...}
```

---

## 🐛 Если что-то не работает

### Проблема: "Не найдено"

1. **Откройте консоль браузера (F12)**
   - Найдите сообщения `[FileShare]`
   - Проверьте, что API доступен

2. **Запустите диагностику**
   ```bash
   bash full-diagnose.sh
   ```

3. **Проверьте файлы в БД**
   ```bash
   docker compose exec db psql -U fileshare -d fileshare -c "SELECT * FROM files;"
   ```

4. **Перезапустите сервисы**
   ```bash
   docker compose restart
   ```

5. **Полная переустановка** (если ничего не помогает)
   ```bash
   docker compose down -v
   bash rebuild.sh
   ```

---

## 📚 Подробная документация

- [SCRIPTS.md](./SCRIPTS.md) — все скрипты и их использование
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — диагностика проблем
- [DEVELOPMENT.md](./DEVELOPMENT.md) — разработка
- [UPDATE.md](./UPDATE.md) — обновление

---

## 💡 Полезные команды

```bash
# Статус контейнеров
docker compose ps

# Логи в реальном времени
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f backend

# Перезапуск всех сервисов
docker compose restart

# Полная очистка (УДАЛИТ ВСЕ ДАННЫЕ!)
docker compose down -v
```
