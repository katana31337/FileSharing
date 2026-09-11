#!/bin/bash
# ==========================================
# Self-Signed Certificate Generator
# ==========================================
# For development/testing environments
# Usage: ./generate-self-signed.sh [domain]

set -e

DOMAIN=${1:-"localhost"}
DAYS=365
SSL_DIR="./ssl"

echo "=== Generating Self-Signed Certificate ==="
echo "Domain: $DOMAIN"
echo "Valid for: $DAYS days"
echo ""

# Create SSL directory
mkdir -p "$SSL_DIR"

# Generate private key
echo "[1/4] Generating private key..."
openssl genrsa -out "$SSL_DIR/privkey.pem" 2048 2>/dev/null

# Generate CSR (Certificate Signing Request)
echo "[2/4] Generating certificate signing request..."
openssl req -new -key "$SSL_DIR/privkey.pem" \
    -out "$SSL_DIR/cert.csr" \
    -subj "/C=US/ST=State/L=City/O=FileShare/CN=$DOMAIN" 2>/dev/null

# Create extensions file for SAN (Subject Alternative Names)
echo "[3/4] Creating certificate extensions..."
cat > "$SSL_DIR/cert.ext" << EOF
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
echo "[4/4] Generating self-signed certificate..."
openssl x509 -req -in "$SSL_DIR/cert.csr" \
    -CA "$SSL_DIR/privkey.pem" -CAkey "$SSL_DIR/privkey.pem" \
    -CAcreateserial -out "$SSL_DIR/fullchain.pem" \
    -days $DAYS -sha256 -extfile "$SSL_DIR/cert.ext" 2>/dev/null

# Clean up temporary files
rm -f "$SSL_DIR/cert.csr" "$SSL_DIR/cert.ext" "$SSL_DIR/privkey.srl"

# Set permissions
chmod 600 "$SSL_DIR/privkey.pem"
chmod 644 "$SSL_DIR/fullchain.pem"

echo ""
echo "=== ✅ Self-Signed Certificate Generated ==="
echo "    Private key: $SSL_DIR/privkey.pem"
echo "    Certificate: $SSL_DIR/fullchain.pem"
echo "    Valid until: $(date -d "+$DAYS days" 2>/dev/null || date -v+${DAYS}d 2>/dev/null || echo "$DAYS days from now")"
echo ""
echo "⚠️  Browser Warning:"
echo "    Your browser will show a security warning because this is a self-signed certificate."
echo "    To proceed: Click 'Advanced' → 'Proceed to $DOMAIN (unsafe)'"
echo ""
echo "📋 To trust this certificate on your system:"
echo "    macOS:  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $SSL_DIR/fullchain.pem"
echo "    Linux:  sudo cp $SSL_DIR/fullchain.pem /usr/local/share/ca-certificates/fileshare.crt && sudo update-ca-certificates"
echo "    Windows: Import fullchain.pem into 'Trusted Root Certification Authorities'"
