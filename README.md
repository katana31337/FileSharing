# 📁 FileShare — Сервис обмена файлами

Клиент-серверное приложение для быстрого обмена файлами, текстом и изображениями через короткие ссылки.

## 🏗 Архитектура

### Стек технологий

| Компонент | Технология |
|-----------|-----------|
| Frontend | React + TypeScript + Tailwind CSS + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 |
| Storage | Local FS (расширяемо до S3/GCS) |
| Short URLs | nanoid (7 символов) |
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |

### Принципы SOLID в архитектуре

```
┌─────────────────────────────────────────────────────┐
│                    HTTP Layer                         │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │FileController│  │TextController│  ← SRP           │
│  └──────┬───────┘  └──────┬───────┘                  │
│         │                  │                          │
│  ┌──────▼───────┐  ┌──────▼───────┐                  │
│  │ FileService  │  │ TextService  │  ← SRP           │
│  └──────┬───────┘  └──────┬───────┘                  │
│         │                  │                          │
│  ┌──────▼───────┐  ┌──────▼───────┐                  │
│  │FileRepository│  │TextRepository│  ← DIP, ISP      │
│  └──────┬───────┘  └──────┬───────┘                  │
│         │                  │                          │
│  ┌──────▼──────────────────▼──────┐                  │
│  │      PostgreSQL Database       │                  │
│  └────────────────────────────────┘                  │
│                                                      │
│  ┌────────────────────────────────┐                  │
│  │    IStorageProvider (OCP)      │                  │
│  │  ┌────────┐ ┌─────┐ ┌─────┐   │                  │
│  │  │ Local  │ │ S3  │ │ GCS │   │  ← Strategy      │
│  │  └────────┘ └─────┘ └─────┘   │                  │
│  └────────────────────────────────┘                  │
└─────────────────────────────────────────────────────┘
```

- **S (SRP)** — каждый класс отвечает за одну задачу
- **O (OCP)** — новые хранилища добавляются без изменения кода (Strategy pattern)
- **L (LSP)** — все реализации взаимозаменяемы через интерфейсы
- **I (ISP)** — разделённые интерфейсы репозиториев
- **D (DIP)** — зависимости внедряются через DI контейнер

## 🚀 Быстрый старт

### Через Docker (рекомендуется)

```bash
# 1. Сгенерировать self-signed сертификат (для разработки)
./generate-self-signed.sh localhost

# 2. Запустить все сервисы
docker-compose up -d

# Приложение доступно на https://localhost
# API на https://localhost/api
```

### Production (с реальным доменом)

```bash
# 1. Получить Let's Encrypt сертификат
./init-letsencrypt.sh your-domain.com admin@your-domain.com

# 2. Запустить сервисы
docker-compose up -d

# Приложение доступно на https://your-domain.com
```

### Локальная разработка (без Docker)

```bash
# 1. Запустить PostgreSQL
docker-compose up -d db

# 2. Frontend
npm install
npm run dev          # http://localhost:5173

# 3. Backend
cd server
cp .env.example .env
npm install
npm run dev          # http://localhost:3001
```

## 📡 API Endpoints

### Файлы
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/files` | Загрузить файл (multipart) |
| GET | `/api/files/:shortUrl` | Информация о файле |
| GET | `/api/files/:shortUrl/download` | Скачать файл |
| DELETE | `/api/files/:shortUrl` | Удалить файл |

### Текст
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/texts` | Создать сниппет |
| GET | `/api/texts/:shortUrl` | Получить сниппет |
| DELETE | `/api/texts/:shortUrl` | Удалить сниппет |

### Примеры

```bash
# Загрузить файл
curl -X POST http://localhost:3001/api/files \
  -F "file=@document.pdf" \
  -F "expiresInDays=7"

# Создать текстовый сниппет
curl -X POST http://localhost:3001/api/files \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Code",
    "content": "console.log(\"hello\")",
    "language": "javascript",
    "expiresInDays": 7
  }'
```

## 📁 Структура проекта

```
├── src/                    # React Frontend
│   ├── components/         # UI компоненты
│   ├── pages/              # Страницы
│   ├── services/           # API клиент / storage
│   ├── types/              # TypeScript типы
│   └── utils/              # Утилиты
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── config/         # Конфигурация
│   │   ├── controllers/    # HTTP контроллеры
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # TypeScript модели
│   │   ├── repositories/   # Работа с БД
│   │   ├── routes/         # Маршруты
│   │   ├── services/       # Бизнес-логика
│   │   ├── storage/        # Стратегии хранения
│   │   ├── container.ts    # DI контейнер
│   │   └── app.ts          # Entry point
│   └── migrations/         # SQL миграции
├── docker-compose.yml      # Docker оркестрация
├── Dockerfile.frontend     # Frontend container
├── Dockerfile.backend      # Backend container
├── nginx.conf              # Nginx конфигурация
└── README.md               # Этот файл
```

## 🔒 HTTPS / SSL

Сервис работает **только через HTTPS**. Nginx выступает как SSL terminator.

### Архитектура HTTPS

```
┌─────────────┐     HTTPS      ┌──────────┐     HTTP      ┌──────────┐
│   Browser   │ ──────────────▶│  Nginx   │ ─────────────▶│ Backend  │
│  (Client)   │◀──────────────│  :443    │◀─────────────│  :3001   │
└─────────────┘                └──────────┘               └──────────┘
      ▲                              │
      │                              ▼
      │                        ┌──────────┐
      └────────────────────────│  Certbot │ (Let's Encrypt)
                               └──────────┘
```

### Варианты сертификатов

| Вариант | Когда использовать | Команда |
|---------|-------------------|---------|
| **Self-signed** | Разработка, тестирование | `./generate-self-signed.sh` |
| **Let's Encrypt** | Production с доменом | `./init-letsencrypt.sh domain.com` |

### Self-Signed (разработка)

```bash
# Генерация сертификата
./generate-self-signed.sh localhost

# Браузер покажет предупреждение — это нормально для self-signed
# Нажмите "Advanced" → "Proceed to localhost"
```

### Let's Encrypt (production)

```bash
# Требования:
# - Публичный домен (например, files.example.com)
# - DNS указывает на сервер
# - Порты 80 и 443 открыты

# Получение сертификата
./init-letsencrypt.sh files.example.com admin@example.com

# Продление (автоматически через certbot контейнер)
docker-compose run --rm certbot renew
docker-compose exec nginx nginx -s reload
```

### Security Headers

Nginx добавляет следующие заголовки:
- `Strict-Transport-Security` — HSTS (2 года)
- `X-Frame-Options` — защита от clickjacking
- `X-Content-Type-Options` — защита от MIME sniffing
- `Content-Security-Policy` — защита от XSS
- `Referrer-Policy` — контроль referrer
- `Permissions-Policy` — ограничение доступа к API браузера

### SSL/TLS настройки

- Протоколы: TLS 1.2, TLS 1.3
- Шифры: Modern (Mozilla Intermediate)
- OCSP Stapling: включён
- Session tickets: отключены (для forward secrecy)

## 🔧 Расширение

### Добавить новое хранилище (S3)

1. Создать `server/src/storage/S3StorageProvider.ts`
2. Реализовать интерфейс `IStorageProvider`
3. Добавить в `container.ts`

### Добавить новый тип контента

1. Создать модель в `models/`
2. Создать репозиторий (реализация `IRepository`)
3. Создать сервис
4. Создать контроллер
5. Добавить маршруты

### Добавить аутентификацию

1. Создать middleware в `middleware/`
2. Добавить в нужные маршруты

## ⚙️ Конфигурация

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| PORT | 3001 | Порт сервера |
| DB_HOST | localhost | Хост БД |
| DB_PORT | 5432 | Порт БД |
| STORAGE_PROVIDER | local | Провайдер хранения |
| MAX_FILE_SIZE | 100MB | Макс. размер файла |
| MAX_EXPIRATION_DAYS | 30 | Макс. срок хранения |
| CORS_ORIGIN | http://localhost:5173 | Разрешённый origin |

## 📋 TODO

- [ ] Аутентификация (JWT / OAuth)
- [ ] Парольная защита файлов
- [ ] S3 Storage Provider
- [ ] Rate limiting per user
- [ ] QR-код для ссылок
- [ ] Превью файлов
- [ ] Drag & drop множественная загрузка
- [ ] WebSocket для прогресса загрузки
- [ ] Admin panel
