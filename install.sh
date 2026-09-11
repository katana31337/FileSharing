#!/bin/bash
# ==========================================
# FileShare Installation Script
# ==========================================
# Автоматическая установка FileShare
# Usage: curl -sSL https://raw.githubusercontent.com/katana31337/FileSharing/main/install.sh | sudo bash
# или:   sudo bash install.sh
#
# ВАЖНО: Скрипт требует bash! Не используйте sh.
# Если скрипт запущен через sh, он автоматически перезапустится через bash.
# ==========================================

# Проверка: если запущен не через bash, перезапустить через bash
if [ -z "$BASH_VERSION" ]; then
    exec bash "$0" "$@"
fi

set -e

# Error handler (только для bash)
trap 'echo "❌ Ошибка на строке $LINENO. Выход." >&2' ERR

# Fix stdin when running via curl | bash
# If stdin is not a terminal (piped), redirect from /dev/tty
if [ ! -t 0 ]; then
    exec < /dev/tty
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/opt/fileshare"
REPO_URL="https://github.com/katana31337/FileSharing.git"
VERSION="1.0.0"

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                          ║${NC}"
    echo -e "${BLUE}║   📁 FileShare Installation Script v${VERSION}                ║${NC}"
    echo -e "${BLUE}║                                                          ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${CYAN}[$1] $2${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================
# Генерация случайного пароля
# ============================================
# Создаёт криптографически безопасный случайный пароль
# указанной длины (по умолчанию 32 символа)
# Использует openssl для генерации случайных данных
# ============================================
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $((length * 3 / 4)) | tr -d '\n=' | head -c $length
}

# ============================================
# Генерация случайного имени пользователя БД
# ============================================
# Создаёт уникальное имя пользователя для PostgreSQL
# в стиле имён контейнеров Docker (прилагательное_учёный_число)
# 
# Примеры генерируемых имён:
#   - clever_feynman_427
#   - happy_tesla_123
#   - brave_einstein_999
#
# Зачем это нужно:
#   - Уникальность: каждое имя случайно и уникально
#   - Безопасность: сложно угадать имя пользователя БД
#   - Читаемость: легче запомнить, чем случайный набор символов
#   - Стиль Docker: привычный формат для разработчиков
#
# Где используется:
#   - При установке создаётся пользователь БД с этим именем
#   - Имя записывается в .env файл
#   - Используется для подключения backend к PostgreSQL
# ============================================
generate_random_name() {
    # Прилагательные (описательные слова)
    local adjectives=(
        "adoring" "affectionate" "agitated" "amazing" "angry" "awesome"
        "beautiful" "blissful" "bold" "brave" "busy" "charming"
        "clever" "compassionate" "competent" "confident" "cool" "cranky"
        "crazy" "dazzling" "determined" "dreamy" "eager" "ecstatic"
        "elastic" "elated" "elegant" "eloquent" "epic" "exciting"
        "fervent" "festive" "flamboyant" "focused" "friendly" "frosty"
        "funny" "gallant" "gifted" "goofy" "gracious" "happy"
        "hardcore" "heuristic" "hopeful" "hungry" "inspiring" "intelligent"
        "interesting" "jolly" "jovial" "keen" "kind" "laughing"
        "loving" "lucid" "magical" "modest" "musing" "mystifying"
        "naughty" "nervous" "nice" "nifty" "nostalgic" "objective"
        "optimistic" "peaceful" "pensive" "practical" "quirky" "quizzical"
        "recursing" "relaxed" "reverent" "romantic" "serene" "sharp"
        "silly" "sleepy" "stoic" "strange" "stupefied" "suspicious"
        "sweet" "tender" "thirsty" "trusting" "unruffled" "upbeat"
        "vibrant" "vigilant" "vigorous" "wizardly" "wonderful" "youthful"
        "zealous" "zen"
    )
    
    # Существительные (имена известных учёных и инженеров)
    local nouns=(
        "albattani" "allen" "almeida" "antonelli" "archimedes" "ardinghelli"
        "aryabhata" "austin" "babbage" "banach" "banzai" "bardeen"
        "bartik" "bassi" "beaver" "bell" "benz" "bhabha"
        "bhaskara" "blackburn" "blackwell" "bohr" "booth" "borg"
        "bose" "boyd" "brahmagupta" "brattain" "brown" "buck"
        "burnell" "cannon" "carson" "cartwright" "carver" "cerf"
        "chandrasekhar" "chaplygin" "chatelet" "chatterjee" "chebyshev" "cohen"
        "chaum" "clarke" "colden" "cori" "cray" "curran"
        "curie" "darwin" "davinci" "dewdney" "dhawan" "diffie"
        "dijkstra" "dirac" "driscoll" "dubinsky" "easley" "edison"
        "einstein" "elbakyan" "elgamal" "elion" "ellis" "engelbart"
        "euclid" "euler" "faraday" "feistel" "fermat" "fermi"
        "feynman" "franklin" "gagarin" "galileo" "galois" "ganguly"
        "gates" "gauss" "germain" "goldberg" "goldstine" "goldwasser"
        "golick" "goodall" "gould" "greider" "grothendieck" "haibt"
        "hamilton" "haslett" "hawking" "hellman" "heisenberg" "hermann"
        "herschel" "hertz" "heyrovsky" "hodgkin" "hofstadter" "hoover"
        "hopper" "hugle" "hypatia" "ishizaka" "jackson" "jang"
        "jennings" "jepsen" "johnson" "joliot" "jones" "kalam"
        "kapitsa" "kare" "keldysh" "keller" "kepler" "khayyam"
        "khorana" "kilby" "kirchhoff" "knuth" "kowalevski" "lalande"
        "lamarr" "lamport" "leakey" "leavitt" "lederberg" "lehmann"
        "lewin" "lichterman" "liskov" "lovelace" "lumiere" "mahavira"
        "margulis" "matsumoto" "maxwell" "mayer" "mccarthy" "mcclintock"
        "mclaren" "mclean" "mcnulty" "mendel" "mendeleev" "meitner"
        "meninsky" "merkle" "mestorf" "minsky" "mirzakhani" "montalcini"
        "moore" "morse" "murdock" "moser" "napier" "nash"
        "neumann" "newton" "nightingale" "nobel" "noether" "northcutt"
        "noyce" "panini" "pare" "pascal" "pasteur" "payne"
        "perlman" "pike" "poincare" "poitras" "proskuriakova" "ptolemy"
        "raman" "ramanujan" "ride" "ritchie" "rhodes" "robinson"
        "roentgen" "rosalind" "rubin" "saha" "sammet" "sanderson"
        "satoshi" "shamir" "shannon" "shaw" "shirley" "shockley"
        "shtern" "snyder" "solomon" "spence" "stonebraker" "sutherland"
        "swanson" "swartz" "swirles" "taussig" "tereshkova" "tesla"
        "tharp" "thompson" "torvalds" "tu" "turing" "varahamihira"
        "vaughan" "villani" "visvesvaraya" "volhard" "wescoff" "wilbur"
        "wiles" "williams" "williamson" "wilson" "wing" "wozniak"
        "wright" "wu" "yalow" "yang" "zhukovsky"
    )
    
    # Выбираем случайные индексы для прилагательного и существительного
    local adj_idx=$((RANDOM % ${#adjectives[@]}))
    local noun_idx=$((RANDOM % ${#nouns[@]}))
    # Генерируем случайное число от 0 до 999
    local number=$((RANDOM % 1000))
    
    # Возвращаем имя в формате: прилагательное_учёный_число
    echo "${adjectives[$adj_idx]}_${nouns[$noun_idx]}_$number"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
check_dependencies() {
    print_step "1/8" "Проверка зависимостей..."
    
    local missing=()
    
    if ! command_exists docker; then
        missing+=("docker")
    fi
    
    if ! docker compose version >/dev/null 2>&1; then
        missing+=("docker compose")
    fi
    
    if ! command_exists git; then
        missing+=("git")
    fi
    
    if ! command_exists openssl; then
        missing+=("openssl")
    fi
    
    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Отсутствуют необходимые зависимости:"
        for cmd in "${missing[@]}"; do
            echo "  - $cmd"
        done
        echo ""
        echo "Установите их и запустите скрипт снова."
        echo ""
        echo "Установка Docker: https://docs.docker.com/get-docker/"
        echo "Установка Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "Все зависимости установлены"
}

# Ask questions
ask_questions() {
    print_step "2/8" "Настройка параметров..."
    echo ""
    
    # SSL Certificate type - спрашиваем первым, чтобы адаптировать вопрос о домене
    echo -e "${CYAN}Какой SSL сертификат вы хотите использовать?${NC}"
    echo "  1) Let's Encrypt (для production с публичным доменом)"
    echo "  2) Self-signed (для локальной сети, IP-адреса или разработки)"
    echo ""
    while true; do
        read -p "Выберите [1-2]: " SSL_CHOICE
        case $SSL_CHOICE in
            1)
                SSL_TYPE="letsencrypt"
                break
                ;;
            2)
                SSL_TYPE="selfsigned"
                break
                ;;
            *)
                print_warning "Пожалуйста, введите 1 или 2"
                ;;
        esac
    done
    echo ""
    
    # Domain - вопрос зависит от типа SSL
    if [ "$SSL_TYPE" = "letsencrypt" ]; then
        echo -e "${CYAN}Введите публичный домен для FileShare${NC}"
        echo -e "${YELLOW}⚠️  Домен должен указывать на этот сервер и быть доступен из интернета${NC}"
        echo -e "   Например: files.example.com"
    else
        echo -e "${CYAN}Введите адрес для FileShare${NC}"
        echo -e "${YELLOW}💡  Это может быть домен, IP-адрес или имя хоста в локальной сети${NC}"
        echo -e "   Например: files.local, 192.168.1.100, или files.example.com"
    fi
    echo ""
    while true; do
        read -p "> " DOMAIN
        if [ -n "$DOMAIN" ]; then
            break
        fi
        print_warning "Адрес не может быть пустым"
    done
    echo ""
    
    # Email for Let's Encrypt
    if [ "$SSL_TYPE" = "letsencrypt" ]; then
        while true; do
            echo -e "${CYAN}Введите email для Let's Encrypt${NC} (для уведомлений о сертификате):"
            read -p "> " EMAIL
            if [ -n "$EMAIL" ] && [[ "$EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
                break
            fi
            print_warning "Пожалуйста, введите корректный email"
        done
        echo ""
    else
        EMAIL="admin@$DOMAIN"
    fi
    
    # Admin secret path
    echo -e "${CYAN}Создайте секретную ссылку для доступа к админ-панели${NC}"
    echo -e "${YELLOW}💡  Это будет скрытый URL, который нужно знать для входа в админку${NC}"
    echo -e "   Например: my-secret-admin-panel-2024"
    echo ""
    while true; do
        read -p "> " ADMIN_SECRET_PATH
        if [ -n "$ADMIN_SECRET_PATH" ] && [[ "$ADMIN_SECRET_PATH" =~ ^[a-zA-Z0-9_-]+$ ]]; then
            break
        fi
        print_warning "Используйте только буквы, цифры, дефис и подчёркивание"
    done
    echo ""
    
    # Admin credentials will be set on first login
    echo -e "${CYAN}Учётные данные администратора${NC}"
    echo -e "${YELLOW}💡  Логин и пароль будут созданы при первом входе в админ-панель${NC}"
    echo ""
    
    # Generate database credentials
    print_info "Генерация учётных данных для базы данных..."
    DB_USER=$(generate_random_name)
    DB_PASSWORD=$(generate_password 32)
    
    print_success "Все пароли созданы"
    print_info "Пользователь БД: $DB_USER"
}

# Create installation directory
setup_directory() {
    print_step "3/8" "Создание директорий..."
    
    # Создание директории проекта
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Директория $INSTALL_DIR уже существует"
        read -p "Удалить и продолжить? [y/N]: " REMOVE_OLD
        if [[ "$REMOVE_OLD" =~ ^[Yy]$ ]]; then
            rm -rf "$INSTALL_DIR"
            print_success "Старая установка удалена"
        else
            print_error "Установка отменена"
            exit 1
        fi
    fi
    
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    print_success "Директория проекта создана: $INSTALL_DIR"
    
    # Создание директории для хранения файлов
    print_info "Создание директории для файлов: /dataStore/files"
    mkdir -p /dataStore/files
    chmod 755 /dataStore/files
    chmod 777 /dataStore/files  # Для записи из контейнера
    print_success "Директория /dataStore/files создана"
}

# Create docker-compose file
create_docker_compose() {
    print_step "4/8" "Создание конфигурации Docker..."
    
    # Создаём директорию для миграций
    mkdir -p server/migrations
    
    # Создаём миграцию 001_initial.sql
    cat > server/migrations/001_initial.sql << 'SQLEOF'
-- Таблица для хранения файлов
CREATE TABLE IF NOT EXISTS files (
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

-- Таблица для хранения текстовых сниппетов
CREATE TABLE IF NOT EXISTS text_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_url VARCHAR(10) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
    content TEXT NOT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_files_short_url ON files(short_url);
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at);
CREATE INDEX IF NOT EXISTS idx_text_snippets_short_url ON text_snippets(short_url);
CREATE INDEX IF NOT EXISTS idx_text_snippets_expires_at ON text_snippets(expires_at);

-- Функция очистки истёкших записей
CREATE OR REPLACE FUNCTION cleanup_expired() RETURNS void AS $$
BEGIN
    DELETE FROM files WHERE expires_at < NOW();
    DELETE FROM text_snippets WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
SQLEOF
    
    # Создаём миграцию 002_admin_settings.sql
    cat > server/migrations/002_admin_settings.sql << 'SQLEOF'
-- Таблица для хранения настроек админки
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по ключу
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- Вставляем начальные значения по умолчанию
INSERT INTO admin_settings (key, value) VALUES
    ('max_file_size', '104857600'),
    ('min_expiration_days', '1'),
    ('max_expiration_days', '30'),
    ('default_expiration_days', '7'),
    ('admin_secret_path', 'admin'),
    ('logo', ''),
    ('logo_type', 'none')
ON CONFLICT (key) DO NOTHING;
SQLEOF
    
    # Базовая часть (общая для всех)
    cat > docker-compose.yml << EOF
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: \${DB_USER}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_DB: \${DB_NAME:-fileshare}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/migrations/001_initial.sql:/docker-entrypoint-initdb.d/001_initial.sql:ro
      - ./server/migrations/002_admin_settings.sql:/docker-entrypoint-initdb.d/002_admin_settings.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER} -d \${DB_NAME:-fileshare}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 30s
    restart: unless-stopped

  backend:
    image: \${DOCKER_USERNAME:-katana31337}/fileshare-backend:\${VERSION:-latest}
    expose:
      - "3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: \${DB_USER}
      DB_PASSWORD: \${DB_PASSWORD}
      DB_NAME: \${DB_NAME:-fileshare}
      STORAGE_PROVIDER: local
      STORAGE_PATH: /app/uploads
      CORS_ORIGIN: https://\${DOMAIN}
    volumes:
      - /dataStore/files:/app/uploads/files
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  nginx:
    image: \${DOCKER_USERNAME:-katana31337}/fileshare-frontend:\${VERSION:-latest}
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
EOF

    # Добавляем специфичные настройки в зависимости от типа SSL
    if [ "$SSL_TYPE" = "letsencrypt" ]; then
        cat >> docker-compose.yml << 'EOF'
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
EOF
    else
        cat >> docker-compose.yml << 'EOF'
    depends_on:
      - backend
    restart: unless-stopped
EOF
    fi

    # Volumes (общая часть)
    cat >> docker-compose.yml << 'EOF'

volumes:
  postgres_data:
EOF
    
    print_success "docker-compose.yml создан (SSL: $SSL_TYPE)"
}

# Create nginx configuration
create_nginx_config() {
    print_step "5/8" "Создание конфигурации Nginx..."
    
    # Начало nginx.conf
    cat > nginx.conf << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=2r/s;

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name _;
EOF

    # Для Let's Encrypt добавляем ACME challenge
    if [ "$SSL_TYPE" = "letsencrypt" ]; then
        cat >> nginx.conf << 'EOF'

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
EOF
    fi

    # Завершение HTTP сервера
    cat >> nginx.conf << 'EOF'

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name _;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    client_max_body_size 100M;
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;
    }

    location /api/files {
        limit_req zone=upload_limit burst=5 nodelay;
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/health {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF
    
    print_success "nginx.conf создан"
}

# Create .env file
create_env_file() {
    print_step "6/8" "Создание конфигурации..."
    
    cat > .env << EOF
# FileShare Configuration
# Generated by install.sh on $(date)

# Domain
DOMAIN=$DOMAIN

# Database
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=fileshare

# SSL
SSL_TYPE=$SSL_TYPE

# Admin Panel
ADMIN_SECRET_PATH=$ADMIN_SECRET_PATH
EOF
    
    chmod 600 .env
    print_success "Файл .env создан"
}

# Setup SSL certificate
setup_ssl() {
    print_step "7/8" "Настройка SSL сертификата..."
    
    if [ "$SSL_TYPE" = "letsencrypt" ]; then
        print_info "Получение сертификата Let's Encrypt..."
        echo ""
        
        # Create directories for certbot
        mkdir -p ./data/certbot/conf
        mkdir -p ./data/certbot/www
        mkdir -p ./data/certbot/live/$DOMAIN
        mkdir -p ./data/certbot/archive/$DOMAIN
        mkdir -p ./ssl
        
        # Generate temporary self-signed certificate for initial nginx start
        print_info "Создание временного сертификата..."
        openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
            -keyout ./data/certbot/conf/privkey.pem \
            -out ./data/certbot/conf/fullchain.pem \
            -subj "/CN=localhost"
        
        # Copy temp cert to ssl directory for nginx
        cp ./data/certbot/conf/privkey.pem ./ssl/privkey.pem
        cp ./data/certbot/conf/fullchain.pem ./ssl/fullchain.pem
        
        # Start nginx with temp certificate
        print_info "Запуск nginx с временным сертификатом..."
        docker compose up -d nginx
        sleep 5
        
        # Request real certificate from Let's Encrypt
        print_info "Запрос сертификата от Let's Encrypt..."
        docker compose run --rm --entrypoint "\
            certbot certonly --webroot \
            -w /var/www/certbot \
            --email $EMAIL \
            -d $DOMAIN \
            --rsa-key-size 4096 \
            --agree-tos \
            --force-renewal \
            --non-interactive" certbot || {
            print_warning "Не удалось получить сертификат Let's Encrypt"
            print_info "Остановка nginx..."
            docker compose stop nginx
            print_error "Проверьте, что домен $DOMAIN указывает на этот сервер и порт 80 открыт"
            exit 1
        }
        
        # Copy real certificate to ssl directory
        print_info "Установка сертификата..."
        cp ./data/certbot/live/$DOMAIN/privkey.pem ./ssl/privkey.pem
        cp ./data/certbot/live/$DOMAIN/fullchain.pem ./ssl/fullchain.pem
        
        # Reload nginx with real certificate
        print_info "Перезагрузка nginx..."
        docker compose exec nginx nginx -s reload
        
        print_success "Сертификат Let's Encrypt получен"
    else
        print_info "Генерация self-signed сертификата..."
        
        # Create SSL directory
        mkdir -p ./ssl
        
        # Generate private key
        print_info "Создание приватного ключа..."
        openssl genrsa -out ./ssl/privkey.pem 2048
        
        # Generate CSR (Certificate Signing Request)
        print_info "Создание запроса на подпись сертификата..."
        openssl req -new -key ./ssl/privkey.pem \
            -out ./ssl/cert.csr \
            -subj "/C=US/ST=State/L=City/O=FileShare/CN=$DOMAIN"
        
        # Create extensions file for SAN (Subject Alternative Names)
        print_info "Создание расширений сертификата..."
        cat > ./ssl/cert.ext << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = *.$DOMAIN
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
        
        # Generate self-signed certificate
        print_info "Генерация самоподписанного сертификата..."
        openssl x509 -req -in ./ssl/cert.csr \
            -signkey ./ssl/privkey.pem \
            -out ./ssl/fullchain.pem \
            -days 365 -sha256 -extfile ./ssl/cert.ext
        
        # Clean up temporary files
        rm -f ./ssl/cert.csr ./ssl/cert.ext ./ssl/privkey.srl
        
        # Set permissions
        chmod 600 ./ssl/privkey.pem
        chmod 644 ./ssl/fullchain.pem
        
        print_success "Self-signed сертификат создан"
        print_warning "Браузер будет показывать предупреждение о безопасности"
    fi
}

# Start services
start_services() {
    print_step "8/8" "Запуск сервисов..."
    
    # Pull images
    print_info "Загрузка Docker образов..."
    docker compose pull
    
    # Start services
    print_info "Запуск контейнеров..."
    docker compose up -d
    
    # Wait for services to be ready
    print_info "Ожидание запуска сервисов..."
    sleep 10
    
    print_success "Сервисы запущены"
}

# Print final information
print_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                          ║${NC}"
    echo -e "${GREEN}║              ✅ FileShare установлен успешно!            ║${NC}"
    echo -e "${GREEN}║                                                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}📍 Информация для доступа:${NC}"
    echo ""
    echo -e "   Сайт:     ${GREEN}https://$DOMAIN${NC}"
    echo -e "   API:      ${GREEN}https://$DOMAIN/api${NC}"
    echo -e "   Папка:    ${GREEN}$INSTALL_DIR${NC}"
    echo ""
    echo -e "${CYAN}🔐 Админ-панель:${NC}"
    echo ""
    echo -e "   URL:      ${GREEN}https://$DOMAIN/#/$ADMIN_SECRET_PATH${NC}"
    echo ""
    echo -e "${YELLOW}💡 При первом входе в админ-панель вам будет предложено создать логин и пароль.${NC}"
    echo -e "${YELLOW}   Сохраните их в безопасном месте после создания!${NC}"
    echo ""
    echo -e "${CYAN}🗄️  База данных:${NC}"
    echo ""
    echo -e "   User:     ${YELLOW}$DB_USER${NC}"
    echo -e "   Password: ${YELLOW}$DB_PASSWORD${NC}"
    echo ""
    echo -e "${CYAN}📋 Полезные команды:${NC}"
    echo ""
    echo -e "   ${BLUE}cd $INSTALL_DIR${NC}"
    echo -e "   ${BLUE}docker compose ps${NC}                    # Статус сервисов"
    echo -e "   ${BLUE}docker compose logs -f${NC}               # Логи"
    echo -e "   ${BLUE}docker compose restart${NC}               # Перезапуск"
    echo -e "   ${BLUE}docker compose down${NC}                  # Остановка"
    echo ""
    
    if [ "$SSL_TYPE" = "selfsigned" ]; then
        echo -e "${YELLOW}⚠️  Важно: Self-signed сертификат${NC}"
        echo ""
        echo "   Ваш браузер будет показывать предупреждение о безопасности."
        echo "   Это нормально для self-signed сертификата."
        echo ""
        echo "   Чтобы доверять сертификату:"
        echo "   - macOS:  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $INSTALL_DIR/ssl/fullchain.pem"
        echo "   - Linux:  sudo cp $INSTALL_DIR/ssl/fullchain.pem /usr/local/share/ca-certificates/fileshare.crt && sudo update-ca-certificates"
        echo ""
    fi
    
    if [ "$SSL_TYPE" = "letsencrypt" ]; then
        echo -e "${CYAN}🔒 SSL сертификат Let's Encrypt${NC}"
        echo ""
        echo "   Сертификат автоматически продлевается каждые 12 часов."
        echo "   Уведомления отправляются на: $EMAIL"
        echo ""
    fi
    
    echo -e "${GREEN}🎉 Готово! Откройте https://$DOMAIN в браузере${NC}"
    echo ""
}

# Main installation flow
main() {
    print_header
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        print_error "Этот скрипт должен быть запущен с правами root (sudo)"
        exit 1
    fi
    
    check_dependencies
    ask_questions
    setup_directory
    create_docker_compose
    create_nginx_config
    create_env_file
    setup_ssl
    start_services
    print_summary
}

# Run main function
main "$@"
