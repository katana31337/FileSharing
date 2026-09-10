# 📦 Хранение файлов в /dataStore/files

## 🎯 Что изменилось

Файлы теперь хранятся в **внешней директории** `/dataStore/files/` вместо Docker volume.

### Преимущества

| Аспект | Docker Volume (старое) | /dataStore/files (новое) |
|--------|------------------------|---------------------------|
| Доступ к файлам | Только через `docker exec` | ✅ Прямой доступ с хоста |
| Бэкапы | Нужно копировать из контейнера | ✅ Просто `rsync` / `tar` |
| Мониторинг диска | Сложно | ✅ `du -sh /dataStore` |
| Переезд на другой сервер | Нужно экспортировать volumes | ✅ Просто копируем папку |
| Права доступа | Docker управляет | ✅ Вы контролируете |
| RAID / внешние диски | Сложно | ✅ Легко примонтировать |

## 📁 Структура хранения

```
/dataStore/
└── files/
    ├── 1789064440281-node-v24.20.0-linux-x64.tar.xz
    ├── 1789064440282-document.pdf
    ├── 1789064440283-image.png
    └── ...
```

**Метаданные файлов** по-прежнему хранятся в PostgreSQL (Docker volume `postgres_data`).

## 🚀 Установка с нуля

При установке через `install.sh` директория создаётся автоматически:

```bash
sudo bash install.sh
```

Скрипт создаст:
- ✅ `/dataStore/files/` — для файлов
- ✅ Docker volume `postgres_data` — для базы данных

## 🔄 Миграция с Docker volume

Если у вас уже установлена система с Docker volume, выполните миграцию:

```bash
sudo bash migrate-to-datastore.sh
```

Скрипт:
1. ✅ Остановит backend
2. ✅ Скопирует файлы из Docker volume в `/dataStore/files/`
3. ✅ Настроит права доступа
4. ✅ Запустит backend

После миграции обновите `docker-compose.yml`:

```yaml
# Было:
volumes:
  - uploads_data:/app/uploads

# Стало:
volumes:
  - /dataStore/files:/app/uploads/files
```

И удалите старый volume:

```bash
docker volume rm fileshare_uploads_data
```

## 💻 Работа с файлами

### Просмотр файлов

```bash
# Список всех файлов
ls -lh /dataStore/files/

# Размер всех файлов
du -sh /dataStore/files/

# Подсчёт количества файлов
find /dataStore/files -type f | wc -l
```

### Бэкап файлов

```bash
# Создать архив всех файлов
tar czf backup-$(date +%Y%m%d).tar.gz /dataStore/files/

# Или использовать rsync для инкрементального бэкапа
rsync -av /dataStore/files/ /backup/fileshare/files/
```

### Восстановление из бэкапа

```bash
# Распаковать архив
tar xzf backup-20240101.tar.gz -C /

# Или скопировать из бэкапа
rsync -av /backup/fileshare/files/ /dataStore/files/
```

### Очистка старых файлов

Файлы автоматически удаляются по истечении срока хранения. Но можно очистить вручную:

```bash
# Удалить файлы старше 30 дней
find /dataStore/files -type f -mtime +30 -delete

# Удалить все файлы (ОСТОРОЖНО!)
rm -rf /dataStore/files/*
```

## 🔍 Мониторинг

### Проверка дискового пространства

```bash
# Размер директории
du -sh /dataStore/

# Размер файлов
du -sh /dataStore/files/

# Свободное место на диске
df -h /dataStore
```

### Проверка прав доступа

```bash
ls -ld /dataStore/files/
# Должно быть: drwxrwxrwx (777)
```

Если права неправильные:

```bash
sudo chmod 777 /dataStore/files/
```

## 📊 Структура docker-compose.yml

### Backend

```yaml
backend:
  image: katana31337/fileshare-backend:latest
  environment:
    STORAGE_PROVIDER: local
    STORAGE_PATH: /app/uploads
  volumes:
    - /dataStore/files:/app/uploads/files  # Bind mount
```

### PostgreSQL

```yaml
db:
  image: postgres:16-alpine
  volumes:
    - postgres_data:/var/lib/postgresql/data  # Docker volume
```

**Итого:**
- Файлы → `/dataStore/files/` (bind mount)
- База данных → Docker volume `postgres_data`

## 🛡️ Безопасность

### Права доступа

Директория `/dataStore/files/` должна иметь права `777` для записи из контейнера:

```bash
sudo chmod 777 /dataStore/files/
```

### Резервное копирование

Рекомендуется настроить автоматический бэкап:

```bash
# /etc/cron.daily/fileshare-backup
#!/bin/bash
tar czf /backup/fileshare/files-$(date +%Y%m%d).tar.gz /dataStore/files/
docker compose -f /opt/fileshare/docker-compose.yml exec -T db pg_dump -U fileshare fileshare > /backup/fileshare/db-$(date +%Y%m%d).sql
```

### Ограничение размера

Если нужно ограничить размер хранилища, можно использовать quota или отдельный раздел:

```bash
# Создать отдельный раздел для файлов
sudo mkfs.ext4 /dev/sdb1
sudo mount /dev/sdb1 /dataStore

# Добавить в /etc/fstab для автоматического монтирования
/dev/sdb1 /dataStore ext4 defaults 0 2
```

## 🚚 Переезд на другой сервер

### Экспорт

```bash
# На старом сервере
tar czf fileshare-backup.tar.gz /dataStore/files/
docker compose exec db pg_dump -U fileshare fileshare > database.sql
```

### Импорт

```bash
# На новом сервере
tar xzf fileshare-backup.tar.gz -C /
sudo chmod 777 /dataStore/files/

# Восстановить базу данных
docker compose exec -T db psql -U fileshare fileshare < database.sql
```

## 💡 Полезные команды

```bash
# Найти конкретный файл
find /dataStore/files -name "*node*"

# Показать самые большие файлы
du -h /dataStore/files/* | sort -rh | head -10

# Показать файлы, изменённые за последний день
find /dataStore/files -type f -mtime -1

# Показать количество файлов по типам
find /dataStore/files -type f | sed 's/.*\.//' | sort | uniq -c | sort -rn
```

## 📞 Решение проблем

### Ошибка: Permission denied

```bash
sudo chmod 777 /dataStore/files/
```

### Ошибка: No space left on device

```bash
# Проверить свободное место
df -h /dataStore

# Удалить старые файлы
find /dataStore/files -type f -mtime +30 -delete
```

### Файлы не видны в контейнере

Проверьте `docker-compose.yml`:

```yaml
volumes:
  - /dataStore/files:/app/uploads/files  # Правильный путь!
```

Перезапустите контейнеры:

```bash
docker compose restart backend
```

## 📚 Дополнительная информация

- [QUICKSTART.md](./QUICKSTART.md) — быстрый старт
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — диагностика проблем
- [UPDATE.md](./UPDATE.md) — обновление системы

---

**Версия:** 1.0.7  
**Обновлено:** 2024
