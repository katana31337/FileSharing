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

## 🐳 Публикация на Docker Hub

### Подготовка

1. **Создайте аккаунт на Docker Hub**: https://hub.docker.com/signup

2. **Войдите в Docker Hub из CLI**:
   ```bash
   docker login
   # Введите username и password от Docker Hub
   ```

3. **Создайте репозитории на Docker Hub**:
   - `yourusername/fileshare-frontend`
   - `yourusername/fileshare-backend`

### Ручная публикация

```bash
# === Переменные ===
export DOCKER_USERNAME="yourusername"
export VERSION="1.0.0"

# === Сборка образов ===
# Frontend
docker build -t $DOCKER_USERNAME/fileshare-frontend:$VERSION -f Dockerfile.frontend .
docker tag $DOCKER_USERNAME/fileshare-frontend:$VERSION $DOCKER_USERNAME/fileshare-frontend:latest

# Backend
docker build -t $DOCKER_USERNAME/fileshare-backend:$VERSION -f Dockerfile.backend .
docker tag $DOCKER_USERNAME/fileshare-backend:$VERSION $DOCKER_USERNAME/fileshare-backend:latest

# === Публикация ===
docker push $DOCKER_USERNAME/fileshare-frontend:$VERSION
docker push $DOCKER_USERNAME/fileshare-frontend:latest

docker push $DOCKER_USERNAME/fileshare-backend:$VERSION
docker push $DOCKER_USERNAME/fileshare-backend:latest

# === Проверка ===
docker images | grep fileshare
```

### Автоматическая публикация (скрипт)

```bash
# Сделать скрипт исполняемым
chmod +x publish-docker.sh

# Запустить публикацию
./publish-docker.sh yourusername 1.0.0
```

### Развёртывание с Docker Hub

Создайте `docker-compose.prod.yml` для использования образов из Docker Hub:

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER:-fileshare}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME:-fileshare}
    volumes:
      - postgres_/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fileshare"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    image: yourusername/fileshare-backend:latest
    expose:
      - "3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: ${DB_USER:-fileshare}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME:-fileshare}
      STORAGE_PROVIDER: local
      STORAGE_PATH: /app/uploads
      CORS_ORIGIN: https://${DOMAIN}
    volumes:
      - uploads_/app/uploads
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  nginx:
    image: yourusername/fileshare-frontend:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./data/certbot/www:/var/www/certbot:ro
    depends_on:
      - backend
    restart: unless-stopped

  certbot:
    image: certbot/certbot:latest
    volumes:
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    restart: unless-stopped

volumes:
  postgres_
  uploads_
```

Запуск на сервере:

```bash
# 1. Клонировать проект
git clone https://github.com/yourusername/fileshare.git
cd fileshare

# 2. Создать .env
cat > .env << EOF
DOMAIN=files.example.com
DB_PASSWORD=your_secure_password
DB_USER=fileshare
DB_NAME=fileshare
EOF

# 3. Получить SSL сертификат
./init-letsencrypt.sh files.example.com admin@example.com

# 4. Запустить
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD с GitHub Actions

Создайте `.github/workflows/docker-publish.yml`:

```yaml
name: Publish Docker Images

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

env:
  DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
  DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Extract version
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build & Push Frontend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.frontend
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/fileshare-frontend:${{ steps.version.outputs.VERSION }}
            ${{ secrets.DOCKER_USERNAME }}/fileshare-frontend:latest

      - name: Build & Push Backend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.backend
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/fileshare-backend:${{ steps.version.outputs.VERSION }}
            ${{ secrets.DOCKER_USERNAME }}/fileshare-backend:latest
```

Для автоматической публикации при создании тега:

```bash
# Добавить secrets в GitHub:
# Settings → Secrets → Actions:
#   DOCKER_USERNAME = yourusername
#   DOCKER_PASSWORD = your_docker_hub_token

# Создать тег и запушить
git tag v1.0.0
git push origin v1.0.0
# → Автоматически запустится публикация
```

### Полезные команды

```bash
# Посмотреть все локальные образы
docker images | grep fileshare

# Удалить старые образы
docker rmi $(docker images | grep fileshare | awk '{print $3}')

# Проверить образ перед публикацией
docker run --rm -p 3001:3001 yourusername/fileshare-backend:latest

# Pull и запуск на другом сервере
docker pull yourusername/fileshare-backend:latest
docker pull yourusername/fileshare-frontend:latest
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
