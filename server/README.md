# FileShare Server — Backend

## Архитектура (SOLID)

Проект построен по принципам SOLID:

### Single Responsibility
Каждый модуль отвечает за одну задачу:
- `controllers/` — обработка HTTP запросов
- `services/` — бизнес-логика
- `repositories/` — работа с данными (БД, файловое хранилище)
- `middleware/` — cross-cutting concerns (auth, logging, rate limiting)

### Open/Closed
- `storage/` — Strategy pattern для хранилищ (local, S3, GCS)
- Новые провайдеры добавляются без изменения существующего кода

### Liskov Substitution
- Все хранилища реализуют интерфейс `IStorageProvider`
- Все репозитории реализуют интерфейс `IRepository`

### Interface Segregation
- Разделённые интерфейсы: `IFileRepository`, `ITextRepository`, `IStorageProvider`

### Dependency Inversion
- DI контейн для внедрения зависимостей
- Модули зависят от абстракций, а не реализаций

## Структура

```
server/
├── src/
│   ├── config/           # Конфигурация приложения
│   ├── controllers/      # HTTP контроллеры
│   ├── middleware/        # Express middleware
│   ├── models/           # TypeScript модели/интерфейсы
│   ├── repositories/     # Работа с данными
│   ├── routes/           # Определение маршрутов
│   ├── services/         # Бизнес-логика
│   ├── storage/          # Стратегии хранения файлов
│   ├── utils/            # Утилиты
│   ├── container.ts      # DI контейнер
│   └── app.ts            # Express приложение
├── migrations/           # SQL миграции
├── package.json
├── tsconfig.json
└── Dockerfile
```

## API Endpoints

### Files
- `POST /api/files` — загрузка файла (multipart/form-data)
- `GET /api/files/:shortUrl` — получение информации о файле
- `GET /api/files/:shortUrl/download` — скачивание файла
- `DELETE /api/files/:shortUrl` — удаление файла

### Text
- `POST /api/texts` — создание текстового сниппета
- `GET /api/texts/:shortUrl` — получение сниппета
- `DELETE /api/texts/:shortUrl` — удаление сниппета

### Health
- `GET /api/health` — проверка работоспособности
