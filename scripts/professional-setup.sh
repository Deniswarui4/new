#!/bin/bash

# Server Cleanup and Professional Setup Script
# Domain: runtown.work.gd
# Server: 23.95.6.163

set -e
export DEBIAN_FRONTEND=noninteractive

# Configure needrestart to be non-interactive if installed
if [ -f /etc/needrestart/needrestart.conf ]; then
    sudo sed -i "s/#\$nrconf{restart} = 'i';/\$nrconf{restart} = 'a';/" /etc/needrestart/needrestart.conf
fi

echo "🧹 Starting server cleanup and professional setup..."

# 1. Stop and remove all existing containers
echo "📦 Stopping all Docker containers..."
if command -v docker &> /dev/null; then
    docker stop $(docker ps -aq) 2>/dev/null || true
    docker rm $(docker ps -aq) 2>/dev/null || true
    echo "✅ All containers stopped and removed"
fi

# 2. Remove all Docker images
echo "🗑️  Removing all Docker images..."
if command -v docker &> /dev/null; then
    docker rmi $(docker images -q) -f 2>/dev/null || true
    echo "✅ All images removed"
fi

# 3. Remove all Docker volumes
echo "🗑️  Removing all Docker volumes..."
if command -v docker &> /dev/null; then
    docker volume rm $(docker volume ls -q) 2>/dev/null || true
    echo "✅ All volumes removed"
fi

# 4. Clean up old SSL certificates
echo "🔐 Cleaning up old SSL certificates..."
sudo rm -rf /etc/letsencrypt/live/* /etc/letsencrypt/archive/* /etc/letsencrypt/renewal/* 2>/dev/null || true
echo "✅ Old SSL certificates removed"

# 5. Stop and remove nginx/apache if running
echo "🛑 Stopping web servers..."
sudo systemctl stop nginx 2>/dev/null || true
sudo systemctl stop apache2 2>/dev/null || true
sudo systemctl disable nginx 2>/dev/null || true
sudo systemctl disable apache2 2>/dev/null || true
echo "✅ Web servers stopped"

# 6. Remove old project directories
echo "📁 Cleaning up old project directories..."
sudo rm -rf /opt/* /var/www/* /home/*/projects/* 2>/dev/null || true
echo "✅ Old projects removed"

# 7. Clean up system
echo "🧹 Cleaning up system..."
sudo apt autoremove -y
sudo apt clean
sudo apt clean
if command -v docker &> /dev/null; then
    docker system prune -af --volumes
fi
echo "✅ System cleaned"

echo ""
echo "✅ Server cleanup completed!"
echo ""
echo "🚀 Now installing fresh setup..."
echo ""

# 8. Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 9. Install required packages
echo "📦 Installing required packages..."
sudo apt install -y \
    git \
    curl \
    wget \
    vim \
    ufw \
    fail2ban \
    software-properties-common

# 10. Install Docker (fresh)
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# 11. Install Docker Compose
echo "🐳 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
echo "✅ Docker Compose installed"

# 12. Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
echo "✅ Firewall configured"

# 13. Configure fail2ban
echo "🛡️  Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
echo "✅ fail2ban configured"

# 14. Create project directory
echo "📁 Creating project directory..."
sudo mkdir -p /opt/event-ticketing
sudo chown -R $USER:$USER /opt/event-ticketing
cd /opt/event-ticketing

# 15. Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/Deniswarui4/new.git .

# 16. Create necessary directories
echo "📁 Creating storage directories..."
mkdir -p api/storage/uploads api/storage/qrcodes api/storage/pdfs
mkdir -p nginx/ssl

# 17. Install Certbot for SSL
echo "🔐 Installing Certbot..."
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# 18. Get SSL certificate for runtown.work.gd
echo "🔐 Getting SSL certificate for runtown.work.gd..."
sudo certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email admin@runtown.work.gd \
    -d runtown.work.gd \
    -d www.runtown.work.gd \
    --preferred-challenges http

# 19. Copy SSL certificates
echo "🔐 Copying SSL certificates..."
sudo cp /etc/letsencrypt/live/runtown.work.gd/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/runtown.work.gd/privkey.pem nginx/ssl/
sudo chown -R $USER:$USER nginx/ssl/

# 20. Update nginx config with domain
echo "🔧 Updating nginx configuration..."
sed -i 's/server_name _;/server_name runtown.work.gd www.runtown.work.gd;/' nginx/nginx.conf
sed -i 's/your-domain.com/runtown.work.gd/g' nginx/nginx.conf

# Enable HTTPS in nginx
sed -i 's/# return 301/return 301/' nginx/nginx.conf
sed -i '/# server {/,/# }/s/^#//' nginx/nginx.conf | head -50 > nginx/nginx.conf.tmp
mv nginx/nginx.conf.tmp nginx/nginx.conf

# 21. Setup SSL auto-renewal
echo "🔄 Setting up SSL auto-renewal..."
echo "0 0 * * * certbot renew --quiet && cp /etc/letsencrypt/live/runtown.work.gd/*.pem /opt/event-ticketing/nginx/ssl/ && cd /opt/event-ticketing && docker-compose restart nginx" | sudo crontab -

# 22. Generate SSH key for GitHub
echo "🔑 Generating SSH key for GitHub..."
if [ ! -f ~/.ssh/id_ed25519 ]; then
    ssh-keygen -t ed25519 -C "admin@runtown.work.gd" -N "" -f ~/.ssh/id_ed25519
fi

echo ""
echo "✅ Server setup completed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 IMPORTANT: Add this SSH key to GitHub:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat ~/.ssh/id_ed25519.pub
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Go to: https://github.com/settings/ssh/new"
echo ""
echo "📊 Server IP: $(curl -s ifconfig.me)"
echo "🌐 Domain: runtown.work.gd"
echo "📁 Project Directory: /opt/event-ticketing"
echo ""
echo "🚀 Next steps:"
echo "1. Add the SSH key above to GitHub"
echo "2. Configure GitHub Secrets (use the setup-secrets.sh script)"
echo "3. Push to main branch to deploy automatically!"
echo ""
