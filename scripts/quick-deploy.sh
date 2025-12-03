#!/bin/bash

# Quick Setup Script - Run this on your server after the main setup
# This configures environment variables and does the first deployment

set -e

echo "🚀 Finalizing deployment setup..."
echo ""

# Navigate to project directory
cd /opt/event-ticketing

# Generate secure passwords if not provided
DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 32)}
JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 64)}

echo "📝 Please provide your API keys (press Enter to skip for now):"
echo ""

read -p "Paystack Secret Key: " PAYSTACK_SECRET
read -p "Paystack Public Key: " PAYSTACK_PUBLIC
read -p "Resend API Key: " RESEND_KEY

# Use defaults if empty
PAYSTACK_SECRET=${PAYSTACK_SECRET:-"sk_test_placeholder"}
PAYSTACK_PUBLIC=${PAYSTACK_PUBLIC:-"pk_test_placeholder"}
RESEND_KEY=${RESEND_KEY:-"re_placeholder"}

echo ""
echo "🔧 Creating environment files..."

# Create API .env
cat > api/.env << EOF
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=event_ticketing_user
DB_PASSWORD=$DB_PASSWORD
DB_NAME=event_ticketing

# JWT
JWT_SECRET=$JWT_SECRET

# Paystack
PAYSTACK_SECRET_KEY=$PAYSTACK_SECRET
PAYSTACK_PUBLIC_KEY=$PAYSTACK_PUBLIC

# Resend (Email)
RESEND_API_KEY=$RESEND_KEY
FROM_EMAIL=noreply@runtown.work.gd

# Server
PORT=8080
GIN_MODE=release
ALLOWED_ORIGINS=https://runtown.work.gd,https://www.runtown.work.gd
EOF

# Create Docker Compose .env
cat > .env << EOF
DB_USER=event_ticketing_user
DB_PASSWORD=$DB_PASSWORD
DB_NAME=event_ticketing
NEXT_PUBLIC_API_URL=https://runtown.work.gd/api/v1
EOF

echo "✅ Environment files created"
echo ""

# Build and start services
echo "🐳 Building Docker images (this may take a few minutes)..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 15

echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Your site should be live at: https://runtown.work.gd"
echo "🔌 API endpoint: https://runtown.work.gd/api/v1"
echo ""
echo "📝 Important credentials (save these!):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DB Password: $DB_PASSWORD"
echo "JWT Secret: $JWT_SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 View logs: docker-compose logs -f"
echo "🔄 Restart: docker-compose restart"
echo "🛑 Stop: docker-compose down"
echo ""
