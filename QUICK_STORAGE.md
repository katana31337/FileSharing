# ⚡ Быстрый переход на /dataStore/files

## 🎯 Что это?

Файлы теперь хранятся в `/dataStore/files/` вместо Docker volume.

**Преимущества:**
- ✅ Прямой доступ к файлам с хоста
- ✅ Легко делать бэкапы
- ✅ Просто перенести на другой сервер

## 🚀 Новая установка

```bash
sudo bash install.sh
```

Готово! Директория `/dataStore/files/` создастся автоматически.

## 🔄 Миграция существующей установки

```bash
# 1. Запустить миграцию
sudo bash migrate-to-datastore.sh

# 2. Обновить docker-compose.yml
# Замените:
#   volumes:
#     - uploads_data:/app/uploads
# На:
#   volumes:
#     - /dataStore/files:/app/uploads/files

# 3. Перезапустить
docker compose restart
```

## 💻 Работа с файлами

```bash
# Посмотреть файлы
ls -lh /dataStore/files/

# Размер
du -sh /dataStore/files/

# Бэкап
tar czf backup.tar.gz /dataStore/files/
```

## 📚 Подробнее

Смотрите [STORAGE.md](./STORAGE.md) для полной документации.

---

**Версия:** 1.0.7
