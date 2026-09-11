#!/bin/bash
# ==========================================
# Let's Encrypt Certificate Initialization
# ==========================================
# Usage: ./init-letsencrypt.sh your-domain.com [email@example.com]
#
# This script:
# 1. Creates necessary directories
# 2. Generates a temporary self-signed cert for initial nginx start
# 3. Starts nginx to respond to ACME challenges
# 4. Requests real certificate from Let's Encrypt
# 5. Restarts nginx with real certificate

set -e

DOMAIN=${1:-"localhost"}
EMAIL=${2:-"admin@${DOMAIN}"}
RSA_KEY_SIZE=4096
DATA_PATH="./data/certbot"
CONF_PATH="./data/conf"

echo "=== FileShare SSL Certificate Setup ==="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Create directories
echo "[1/6] Creating directories..."
mkdir -p "$DATA_PATH/conf"
mkdir -p "$DATA_PATH/www"
mkdir -p "$DATA_PATH/live/$DOMAIN"
mkdir -p "$DATA_PATH/archive/$DOMAIN"
mkdir -p "./ssl"

# Check if certificate already exists
if [ -d "$DATA_PATH/live/$DOMAIN" ] && [ -f "$DATA_PATH/live/$DOMAIN/fullchain.pem" ]; then
    echo "[!] Certificate already exists for $DOMAIN"
    echo "    To renew: docker compose run --rm certbot renew"
    exit 0
fi

# Generate temporary self-signed certificate
echo "[2/6] Generating temporary self-signed certificate..."
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$DATA_PATH/conf/privkey.pem" \
    -out "$DATA_PATH/conf/fullchain.pem" \
    -subj "/CN=localhost" 2>/dev/null

# Copy temp cert to ssl directory for nginx
cp "$DATA_PATH/conf/privkey.pem" ./ssl/privkey.pem
cp "$DATA_PATH/conf/fullchain.pem" ./ssl/fullchain.pem

# Start nginx with temp certificate
echo "[3/6] Starting nginx with temporary certificate..."
docker compose up -d nginx

# Wait for nginx to be ready
echo "    Waiting for nginx..."
sleep 5

# Request real certificate from Let's Encrypt
echo "[4/6] Requesting certificate from Let's Encrypt..."

if [ "$DOMAIN" = "localhost" ]; then
    echo "[!] Cannot obtain Let's Encrypt certificate for localhost"
    echo "    Using self-signed certificate instead."
    echo ""
    echo "    To generate a proper self-signed certificate:"
    echo "    ./generate-self-signed.sh"
    echo ""
    docker compose stop nginx
    exit 0
fi

docker compose run --rm --entrypoint "\
    certbot certonly --webroot \
    -w /var/www/certbot \
    --email $EMAIL \
    -d $DOMAIN \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

# Copy real certificate to ssl directory
echo "[5/6] Installing certificate..."
cp "$DATA_PATH/live/$DOMAIN/privkey.pem" ./ssl/privkey.pem
cp "$DATA_PATH/live/$DOMAIN/fullchain.pem" ./ssl/fullchain.pem

# Reload nginx with real certificate
echo "[6/6] Reloading nginx with real certificate..."
docker compose exec nginx nginx -s reload

echo ""
echo "=== ✅ Certificate installed successfully! ==="
echo "    Domain: $DOMAIN"
echo "    Expires: $(docker compose run --rm certbot certificates 2>/dev/null | grep 'Expiration Date' | head -1 || echo 'Check with: docker compose run --rm certbot certificates')"
echo ""
echo "    Auto-renewal: docker compose run --rm certbot renew"
echo "    Cron (add to host): 0 12 * * * cd $(pwd) && docker compose run --rm certbot renew && docker compose exec nginx nginx -s reload"
