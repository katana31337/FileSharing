#!/bin/bash
# ==========================================
# FileShare Installation Script
# ==========================================
# Автоматическая установка FileShare
# Usage: curl -sSL https://raw.githubusercontent.com/katana31337/FileSharing/main/install.sh | bash
# или:   ./install.sh

set -e

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

# Generate random password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $((length * 3 / 4)) | tr -d '\n=' | head -c $length
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
check_dependencies() {
    print_step "1/7" "Проверка зависимостей..."
    
    local missing=()
    
    if ! command_exists docker; then
        missing+=("docker")
    fi
    
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        missing+=("docker-compose")
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
    print_step "2/7" "Настройка параметров..."
    echo ""
    
    # Domain
    while true; do
        echo -e "${CYAN}Введите домен для FileShare${NC} (например: files.example.com):"
        read -p "> " DOMAIN
        if [ -n "$DOMAIN" ]; then
            break
        fi
        print_warning "Домен не может быть пустым"
    done
    echo ""
    
    # SSL Certificate type
    echo -e "${CYAN}Какой SSL сертификат вы хотите использовать?${NC}"
    echo "  1) Let's Encrypt (рекомендуется для production)"
    echo "  2) Self-signed (для разработки/тестирования)"
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
    
    # Generate passwords
    print_info "Генерация безопасных паролей..."
    DB_PASSWORD=$(generate_password 32)
    
    print_success "Пароли сгенерированы"
}

# Create installation directory
setup_directory() {
    print_step "3/7" "Создание директории установки..."
    
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
    
    print_success "Директория создана: $INSTALL_DIR"
}

# Clone repository
clone_repository() {
    print_step "4/7" "Загрузка FileShare..."
    
    if command_exists git; then
        git clone --depth 1 "$REPO_URL" .
        print_success "Репозиторий клонирован"
    else
        print_info "Скачивание архива..."
        curl -sSL "${REPO_URL%/git}/archive/main.tar.gz" | tar xz --strip-components=1
        print_success "Архив распакован"
    fi
}

# Create .env file
create_env_file() {
    print_step "5/7" "Создание конфигурации..."
    
    cat > .env << EOF
# FileShare Configuration
# Generated by install.sh on $(date)

# Domain
DOMAIN=$DOMAIN

# Database
DB_USER=fileshare
DB_PASSWORD=$DB_PASSWORD
DB_NAME=fileshare

# SSL
SSL_TYPE=$SSL_TYPE
EOF
    
    chmod 600 .env
    print_success "Файл .env создан"
}

# Setup SSL certificate
setup_ssl() {
    print_step "6/7" "Настройка SSL сертификата..."
    
    if [ "$SSL_TYPE" = "letsencrypt" ]; then
        print_info "Получение сертификата Let's Encrypt..."
        echo ""
        
        # Make script executable
        chmod +x init-letsencrypt.sh
        
        # Run Let's Encrypt script
        ./init-letsencrypt.sh "$DOMAIN" "$EMAIL"
        
        print_success "Сертификат Let's Encrypt получен"
    else
        print_info "Генерация self-signed сертификата..."
        
        # Make script executable
        chmod +x generate-self-signed.sh
        
        # Generate self-signed certificate
        ./generate-self-signed.sh "$DOMAIN"
        
        print_success "Self-signed сертификат создан"
        print_warning "Браузер будет показывать предупреждение о безопасности"
    fi
}

# Start services
start_services() {
    print_step "7/7" "Запуск сервисов..."
    
    # Determine which compose file to use
    if [ -f "docker-compose.prod.yml" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi
    
    # Pull images
    print_info "Загрузка Docker образов..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Start services
    print_info "Запуск контейнеров..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
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
    echo -e "   URL:      ${GREEN}https://$DOMAIN${NC}"
    echo -e "   API:      ${GREEN}https://$DOMAIN/api${NC}"
    echo -e "   Папка:    ${GREEN}$INSTALL_DIR${NC}"
    echo ""
    echo -e "${CYAN}🔐 Учетные данные:${NC}"
    echo ""
    echo -e "   DB User:  ${YELLOW}fileshare${NC}"
    echo -e "   DB Pass:  ${YELLOW}$DB_PASSWORD${NC}"
    echo ""
    echo -e "${CYAN}📋 Полезные команды:${NC}"
    echo ""
    echo -e "   ${BLUE}cd $INSTALL_DIR${NC}"
    echo -e "   ${BLUE}docker-compose ps${NC}                    # Статус сервисов"
    echo -e "   ${BLUE}docker-compose logs -f${NC}               # Логи"
    echo -e "   ${BLUE}docker-compose restart${NC}               # Перезапуск"
    echo -e "   ${BLUE}docker-compose down${NC}                  # Остановка"
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
    clone_repository
    create_env_file
    setup_ssl
    start_services
    print_summary
}

# Run main function
main "$@"
