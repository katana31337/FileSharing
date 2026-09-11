#!/bin/bash
# ==========================================
# FileShare Uninstallation Script
# ==========================================
# Полное удаление FileShare
# Usage: sudo ./uninstall.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

INSTALL_DIR="/opt/fileshare"

print_header() {
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                          ║${NC}"
    echo -e "${RED}║   🗑️  FileShare Uninstallation Script                     ║${NC}"
    echo -e "${RED}║                                                          ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Этот скрипт должен быть запущен с правами root (sudo)"
    exit 1
fi

print_header

# Check if installation exists
if [ ! -d "$INSTALL_DIR" ]; then
    print_error "FileShare не установлен в $INSTALL_DIR"
    exit 1
fi

cd "$INSTALL_DIR"

# Warning
echo -e "${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  ⚠️  ВНИМАНИЕ: Это действие необратимо!                  ║${NC}"
echo -e "${YELLOW}║                                                          ║${NC}"
echo -e "${YELLOW}║  Будут удалены:                                          ║${NC}"
echo -e "${YELLOW}║  • Все загруженные файлы                                 ║${NC}"
echo -e "${YELLOW}║  • База данных                                           ║${NC}"
echo -e "${YELLOW}║  • SSL сертификаты                                       ║${NC}"
echo -e "${YELLOW}║  • Конфигурационные файлы                                ║${NC}"
echo -e "${YELLOW}║                                                          ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

read -p "Вы уверены, что хотите удалить FileShare? [y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Удаление отменено"
    exit 0
fi

echo ""

# Stop services
print_step "1/4" "Остановка сервисов..."

if [ -f "docker-compose.prod.yml" ]; then
    docker compose -f docker-compose.prod.yml down || true
elif [ -f "docker-compose.yml" ]; then
    docker compose down || true
fi

print_success "Сервисы остановлены"

# Remove volumes
print_step "2/4" "Удаление Docker volumes..."

read -p "Удалить все данные (БД, файлы)? [y/N]: " REMOVE_DATA
if [[ "$REMOVE_DATA" =~ ^[Yy]$ ]]; then
    if [ -f "docker-compose.prod.yml" ]; then
        docker compose -f docker-compose.prod.yml down -v || true
    elif [ -f "docker-compose.yml" ]; then
        docker compose down -v || true
    fi
    print_success "Docker volumes удалены"
else
    print_warning "Docker volumes сохранены"
fi

# Remove images
print_step "3/4" "Удаление Docker образов..."

read -p "Удалить Docker образы FileShare? [y/N]: " REMOVE_IMAGES
if [[ "$REMOVE_IMAGES" =~ ^[Yy]$ ]]; then
    docker images | grep fileshare | awk '{print $3}' | xargs -r docker rmi -f || true
    print_success "Docker образы удалены"
else
    print_warning "Docker образы сохранены"
fi

# Remove installation directory
print_step "4/4" "Удаление файлов установки..."

rm -rf "$INSTALL_DIR"
print_success "Директория $INSTALL_DIR удалена"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║          ✅ FileShare успешно удалён                     ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Для повторной установки выполните:${NC}"
echo ""
echo -e "  ${BLUE}curl -sSL https://raw.githubusercontent.com/katana31337/FileSharing/main/install.sh | sudo bash${NC}"
echo ""
