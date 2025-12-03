#!/bin/bash

# Server Setup Script for Event Ticketing Platform
# Run this script on your Ubuntu server to set up the environment

set -e

echo "🚀 Starting server setup..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt install -y \
    git \
    curl \
    wget \
    vim \
    ufw \
    fail2ban \
    certbot \
    python3-certbot-nginx

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose already installed"
fi

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Configure fail2ban
echo "🛡️  Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create project directory
echo "📁 Creating project directory..."
sudo mkdir -p /opt/event-ticketing
sudo chown $USER:$USER /opt/event-ticketing

# Clone repository (you'll need to add SSH key to GitHub)
echo "📥 Cloning repository..."
read -p "Enter your GitHub repository URL (e.g., git@github.com:username/repo.git): " REPO_URL
cd /opt/event-ticketing
git clone $REPO_URL .

# Create necessary directories
echo "📁 Creating storage directories..."
mkdir -p api/storage/uploads api/storage/qrcodes api/storage/pdfs
mkdir -p nginx/ssl

# Setup SSL (Let's Encrypt)
echo "🔐 Setting up SSL..."
read -p "Enter your domain name (e.g., example.com): " DOMAIN
read -p "Enter your email for Let's Encrypt: " EMAIL

# Create temporary nginx for certbot
sudo docker run -d --name temp-nginx -p 80:80 -p 443:443 nginx:alpine
sleep 5

# Get SSL certificate
sudo certbot certonly --nginx \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN

# Stop temporary nginx
sudo docker stop temp-nginx
sudo docker rm temp-nginx

# Copy SSL certificates
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/
sudo chown $USER:$USER nginx/ssl/*.pem

# Setup SSL renewal
echo "🔄 Setting up SSL auto-renewal..."
echo "0 0 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/*.pem /opt/event-ticketing/nginx/ssl/ && cd /opt/event-ticketing && docker-compose restart nginx" | sudo crontab -

# Update nginx config with domain
echo "🔧 Updating nginx configuration..."
sed -i "s/your-domain.com/$DOMAIN/g" nginx/nginx.conf

# Enable HTTPS in nginx config
sed -i 's/# return 301/return 301/' nginx/nginx.conf
sed -i '/# server {/,/# }/s/^# //' nginx/nginx.conf

echo ""
echo "✅ Server setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Add your server's SSH public key to GitHub:"
echo "   - Generate key: ssh-keygen -t ed25519 -C 'your-email@example.com'"
echo "   - Copy key: cat ~/.ssh/id_ed25519.pub"
echo "   - Add it to GitHub: Settings → SSH and GPG keys → New SSH key"
echo ""
echo "2. Add GitHub repository secrets (Settings → Secrets → Actions):"
echo "   - SSH_PRIVATE_KEY: Copy from ~/.ssh/id_ed25519"
echo "   - SERVER_IP: $(curl -s ifconfig.me)"
echo "   - SERVER_USER: $USER"
echo "   - DB_PASSWORD: (generate a strong password)"
echo "   - JWT_SECRET: (generate a random string)"
echo "   - PAYSTACK_SECRET_KEY: (from Paystack dashboard)"
echo "   - PAYSTACK_PUBLIC_KEY: (from Paystack dashboard)"
echo "   - RESEND_API_KEY: (from Resend dashboard)"
echo "   - AWS_ACCESS_KEY_ID: (from AWS if using S3)"
echo "   - AWS_SECRET_ACCESS_KEY: (from AWS if using S3)"
echo "   - DOMAIN: $DOMAIN"
echo ""
echo "3. Push to GitHub main branch to trigger automatic deployment!"
echo ""
