# 📁 FileShare — Сервис обмена файлами

Клиент-серверное приложение для быстрого обмена файлами, текстом и изображениями через короткие ссылки.

## 📋 Оглавление

- [🏗 Архитектура](#-архитектура)
  - [Стек технологий](#стек-технологий)
  - [Принципы SOLID в архитектуре](#принципы-solid-в-архитектуре)
- [🚀 Быстрый старт](#-быстрый-старт)
  - [Через Docker (рекомендуется)](#через-docker-рекомендуется)
  - [Production (с реальным доменом)](#production-с-реальным-доменом)
  - [Локальная разработка (без Docker)](#локальная-разработка-без-docker)
- [🔧 Инфраструктура и конфигурация](#-инфраструктура-и-конфигурация)
  - [Порты и сервисы](#порты-и-сервисы)
  - [Reverse Proxy (Nginx)](#reverse-proxy-nginx)
  - [Хранение файлов](#хранение-файлов)
  - [База данных](#база-данных)
  - [SSL/TLS сертификаты](#ssltls-сертификаты)
- [📡 API Endpoints](#-api-endpoints)
- [🐳 Публикация на Docker Hub](#-публикация-на-docker-hub)
  - [Подготовка](#подготовка)
  - [Ручная публикация](#ручная-публикация)
  - [Автоматическая публикация (скрипт)](#автоматическая-публикация-скрипт)
  - [Развёртывание с Docker Hub](#развёртывание-с-docker-hub)
  - [CI/CD с GitHub Actions](#cicd-с-github-actions)
  - [Полезные команды](#полезные-команды)
- [🔒 HTTPS / SSL](#-https--ssl)
  - [Архитектура HTTPS](#архитектура-https)
  - [Варианты сертификатов](#варианты-сертификатов)
  - [Security Headers](#security-headers)
  - [SSL/TLS настройки](#ssltls-настройки)
- [📁 Структура проекта](#-структура-проекта)
- [⚙️ Конфигурация](#-конфигурация)
- [🔧 Расширение](#-расширение)
- [📋 TODO](#-todo)

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

## 🔧 Инфраструктура и конфигурация

### Порты и сервисы

| Сервис | Порт (внешний) | Порт (внутренний) | Описание |
|--------|----------------|-------------------|----------|
| **Nginx** (Frontend) | `80` | `80` | HTTP → HTTPS редирект |
| **Nginx** (Frontend) | `443` | `443` | HTTPS + Reverse Proxy |
| **Backend API** | `3001` (только внутри сети) | `3001` | Node.js + Express API |
| **PostgreSQL** | `5432` (опционально) | `5432` | База данных |

**Примечание:** Backend API не экспортируется наружу напрямую. Все запросы проходят через Nginx.

### Reverse Proxy (Nginx)

Nginx выполняет роль reverse proxy и SSL terminator:

```
┌─────────────────────────────────────────────────────────────┐
│                        Клиент (Browser)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (443)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         Nginx Container                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • SSL Termination (TLS 1.2/1.3)                     │   │
│  │  • HTTP → HTTPS редирект (301)                       │   │
│  │  • Security Headers (HSTS, CSP, X-Frame-Options)     │   │
│  │  • Rate Limiting (10 req/s для API, 2 req/s uploads) │   │
│  │  • Gzip сжатие                                        │   │
│  │  • Кэширование статики (1 год)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    ┌─────────────────┐      ┌─────────────────┐
    │  Frontend (SPA) │      │   Backend API   │
    │  /usr/share/    │      │   http://       │
    │  nginx/html     │      │   backend:3001  │
    └─────────────────┘      └─────────────────┘
```

#### Маршрутизация Nginx:

| Путь | Назначение | Rate Limit |
|------|-----------|------------|
| `/` | Frontend SPA (React) | — |
| `/api/*` | Backend API (проксирование) | 10 req/s |
| `/api/files` | Загрузка файлов | 2 req/s |
| `/api/health` | Health check | Без лимита |
| `/.well-known/acme-challenge/` | Let's Encrypt | — |

#### Передаваемые заголовки:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Request-ID $request_id;
```

### Хранение файлов

#### Структура директорий:

```
FileSharing/
├── ssl/                          # SSL сертификаты (не в git!)
│   ├── fullchain.pem            # Полный сертификат
│   └── privkey.pem              # Приватный ключ
│
├── data/                         # Данные Let's Encrypt
│   ├── certbot/
│   │   ├── conf/                # Конфигурация certbot
│   │   │   ├── live/            # Активные сертификаты
│   │   │   ├── archive/         # Архив сертификатов
│   │   │   └── renewal/         # Конфигурация продления
│   │   └── www/                 # Webroot для ACME challenge
│   │
├── uploads/                      # Загруженные файлы (volume)
│   └── files/                   # Файлы пользователей
│       ├── 1234567890-doc.pdf
│       ├── 1234567891-image.png
│       └── ...
│
├── postgres_/                  # PostgreSQL данные (volume)
│
├── server/
│   └── migrations/              # SQL миграции БД
│       └── 001_initial.sql
│
└── docker-compose.yml           # Основная конфигурация
```

#### Volumes (Docker):

| Volume | Путь в контейнере | Назначение |
|--------|-------------------|------------|
| `postgres_` | `/var/lib/postgresql/data` | Данные PostgreSQL |
| `uploads_` | `/app/uploads` | Загруженные файлы |
| `./ssl` | `/etc/nginx/ssl` (ro) | SSL сертификаты |
| `./data/certbot/conf` | `/etc/letsencrypt` | Let's Encrypt конфиг |
| `./data/certbot/www` | `/var/www/certbot` (ro) | ACME challenge |
| `./nginx.conf` | `/etc/nginx/conf.d/default.conf` (ro) | Nginx конфиг |

#### Жизненный цикл файлов:

```
1. Загрузка файла
   └─> POST /api/files (multipart/form-data)
       └─> Backend сохраняет файл в /app/uploads/files/
       └─> Метаданные в PostgreSQL (files table)
       └─> Возвращается shortUrl (7 символов)

2. Скачивание файла
   └─> GET /api/files/:shortUrl/download
       └─> Nginx проксирует на Backend
       └─> Backend читает файл из /app/uploads/files/
       └─> Stream передаётся клиенту
       └─> download_count увеличивается в БД

3. Автоматическая очистка (cron)
   └─> Каждую минуту проверяются просроченные файлы
   └─> Файлы удаляются из /app/uploads/files/
   └─> Записи удаляются из PostgreSQL
```

#### Лимиты:

| Параметр | Значение | Где настраивается |
|----------|----------|-------------------|
| Макс. размер файла | 100 MB | `client_max_body_size` в nginx.conf |
| Макс. срок хранения | 30 дней | `MAX_EXPIRATION_DAYS` в .env |
| Timeout загрузки | 300 сек | `proxy_read_timeout` в nginx.conf |
| Rate limit (API) | 10 req/s | `limit_req_zone` в nginx.conf |
| Rate limit (uploads) | 2 req/s | `limit_req_zone` в nginx.conf |

### База данных

#### PostgreSQL 16

**Таблицы:**

```sql
-- Файлы
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_url VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  size BIGINT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_downloads INTEGER,
  download_count INTEGER DEFAULT 0,
  password VARCHAR(255)
);

-- Текстовые сниппеты
CREATE TABLE text_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_url VARCHAR(10) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL,
  language VARCHAR(50) NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

**Индексы:**

```sql
CREATE INDEX idx_files_short_url ON files(short_url);
CREATE INDEX idx_files_expires_at ON files(expires_at);
CREATE INDEX idx_texts_short_url ON text_snippets(short_url);
CREATE INDEX idx_texts_expires_at ON text_snippets(expires_at);
```

**Подключение:**

```env
DB_HOST=db
DB_PORT=5432
DB_USER=fileshare
DB_PASSWORD=your_secure_password
DB_NAME=fileshare
```

### SSL/TLS сертификаты

#### Self-Signed (разработка)

```bash
./generate-self-signed.sh localhost
```

**Где хранятся:**
- `./ssl/fullchain.pem` — сертификат
- `./ssl/privkey.pem` — приватный ключ

**Срок действия:** 365 дней

#### Let's Encrypt (production)

```bash
./init-letsencrypt.sh your-domain.com admin@example.com
```

**Где хранятся:**
- `./data/certbot/conf/live/your-domain.com/fullchain.pem`
- `./data/certbot/conf/live/your-domain.com/privkey.pem`
- Копируются в `./ssl/` для Nginx

**Продление:**
```bash
# Вручную
docker-compose run --rm certbot renew
docker-compose exec nginx nginx -s reload

# Автоматически (cron в контейнере certbot)
# Каждые 12 часов проверяет необходимость продления
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
curl -X POST http://localhost:3001/api/texts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Code",
    "content": "console.log(\"hello\")",
    "language": "javascript",
    "expiresInDays": 7
  }'
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

Файл `docker-compose.prod.yml` уже есть в репозитории и использует готовые образы из Docker Hub.

Запуск на сервере:

```bash
# 1. Клонировать проект
git clone https://github.com/yourusername/FileSharing.git
cd FileSharing

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

Файл `.github/workflows/docker-publish.yml` уже есть в репозитории. Для автоматической публикации образов при создании тега:

1. Добавьте secrets в GitHub репозиторий:
   - **Settings → Secrets and variables → Actions → New repository secret**
   - `DOCKER_USERNAME` — ваш username на Docker Hub
   - `DOCKER_PASSWORD` — Access Token (создаётся в Docker Hub → Account Settings → Security)

2. Создайте тег и запушьте:

```bash
git tag v1.0.0
git push origin v1.0.0
# → Автоматически запустится публикация образов
```

<details>
<summary>Содержимое workflow (уже добавлено в репозиторий)</summary>

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

</details>

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
