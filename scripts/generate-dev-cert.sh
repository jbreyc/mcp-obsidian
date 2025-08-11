#!/bin/bash

# Development certificate generation script for MCP-Obsidian
# Generates self-signed certificates for local development

set -e

CERTS_DIR="certs"
DAYS=365
DOMAIN="localhost"

echo "🔐 Generating development certificates..."

# Create certs directory
mkdir -p "${CERTS_DIR}"

# Generate private key and certificate
openssl req -x509 -newkey rsa:4096 \
    -keyout "${CERTS_DIR}/key.pem" \
    -out "${CERTS_DIR}/cert.pem" \
    -days ${DAYS} \
    -nodes \
    -subj "/CN=${DOMAIN}" \
    -addext "subjectAltName=DNS:${DOMAIN},DNS:*.${DOMAIN},IP:127.0.0.1,IP:0.0.0.0"

# Set proper permissions
chmod 600 "${CERTS_DIR}/key.pem"
chmod 644 "${CERTS_DIR}/cert.pem"

echo "✅ Development certificates generated in ./${CERTS_DIR}/"
echo ""
echo "📋 Certificate Details:"
echo "   Certificate: ${CERTS_DIR}/cert.pem"
echo "   Private Key: ${CERTS_DIR}/key.pem"
echo "   Valid for: ${DAYS} days"
echo "   Subject: CN=${DOMAIN}"
echo ""
echo "🔧 Usage:"
echo "   For MCP Server HTTPS:"
echo "   MCP_SSL_CERT=${CERTS_DIR}/cert.pem MCP_SSL_KEY=${CERTS_DIR}/key.pem"
echo ""
echo "   For Obsidian Plugin (copy to plugin directory):"
echo "   cp ${CERTS_DIR}/cert.pem ~/.obsidian-plugins/obsidian-local-rest-api/certs/server.crt"
echo "   cp ${CERTS_DIR}/key.pem ~/.obsidian-plugins/obsidian-local-rest-api/certs/server.key"
echo ""
echo "⚠️  Note: These are self-signed certificates for development only!"
echo "   Production deployments should use CA-signed certificates."