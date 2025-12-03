# 🚀 Complete Server Setup Guide for runtown.work.gd

## Step-by-Step Instructions

### Step 1: SSH into Your Server

Open a terminal and run:

```bash
ssh root@23.95.6.163
# Enter password: Matata@2025
```

### Step 2: Download and Run the Professional Setup Script

Once logged in, run these commands:

```bash
# Download the setup script
curl -sSL https://raw.githubusercontent.com/Deniswarui4/new/main/scripts/professional-setup.sh -o setup.sh

# Make it executable
chmod +x setup.sh

# Run the script
./setup.sh
```

This script will:
- ✅ Clean up all existing Docker containers, images, and volumes
- ✅ Remove old SSL certificates
- ✅ Stop and disable old web servers
- ✅ Install fresh Docker & Docker Compose
- ✅ Configure firewall (UFW)
- ✅ Setup fail2ban
- ✅ Clone your repository to `/opt/event-ticketing`
- ✅ Get SSL certificate for `runtown.work.gd`
- ✅ Setup automatic SSL renewal
- ✅ Generate SSH key for GitHub

**NOTE**: The script will display an SSH public key at the end. Copy it!

### Step 3: Add SSH Key to GitHub

1. Copy the SSH key displayed by the script
2. Go to: https://github.com/settings/ssh/new
3. Paste the key and save

### Step 4: Configure Environment Variables on Server

Still on your server, run:

```bash
cd /opt/event-ticketing

# Create API environment file
cat > api/.env << 'EOF'
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=event_ticketing_user
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD_HERE
DB_NAME=event_ticketing

# JWT
JWT_SECRET=YOUR_JWT_SECRET_HERE

# Paystack
PAYSTACK_SECRET_KEY=YOUR_PAYSTACK_SECRET_KEY
PAYSTACK_PUBLIC_KEY=YOUR_PAYSTACK_PUBLIC_KEY

# Resend (Email)
RESEND_API_KEY=YOUR_RESEND_API_KEY
FROM_EMAIL=noreply@runtown.work.gd

# Server
PORT=8080
GIN_MODE=release
ALLOWED_ORIGINS=https://runtown.work.gd,https://www.runtown.work.gd
EOF

# Create Docker Compose environment file
cat > .env << 'EOF'
DB_USER=event_ticketing_user
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD_HERE
DB_NAME=event_ticketing
NEXT_PUBLIC_API_URL=https://runtown.work.gd/api/v1
EOF
```

**Replace the placeholders:**
- `YOUR_SECURE_DB_PASSWORD_HERE` - Generate with: `openssl rand -base64 32`
- `YOUR_JWT_SECRET_HERE` - Generate with: `openssl rand -hex 64`
- `YOUR_PAYSTACK_SECRET_KEY` - From Paystack dashboard
- `YOUR_PAYSTACK_PUBLIC_KEY` - From Paystack dashboard
- `YOUR_RESEND_API_KEY` - From Resend dashboard

### Step 5: First Deployment

```bash
cd /opt/event-ticketing

# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 6: Verify Deployment

1. **Check services**: `docker-compose ps`
2. **Check API**: `curl https://runtown.work.gd/api/v1/health`
3. **Check Web**: Open `https://runtown.work.gd` in browser

### Step 7: Configure GitHub Secrets for CI/CD

Go to: `https://github.com/Deniswarui4/new/settings/secrets/actions`

Add these secrets:

| Secret Name | Value | How to Get |
|------------|-------|------------|
| `SSH_PRIVATE_KEY` | Your server's private key | Run `cat ~/.ssh/id_ed25519` on server |
| `SERVER_IP` | `23.95.6.163` | Your server IP |
| `SERVER_USER` | `root` | Your SSH username |
| `DB_PASSWORD` | Your DB password | From step 4 |
| `JWT_SECRET` | Your JWT secret | From step 4 |
| `PAYSTACK_SECRET_KEY` | Your Paystack secret | From Paystack |
| `PAYSTACK_PUBLIC_KEY` | Your Paystack public key | From Paystack |
| `RESEND_API_KEY` | Your Resend key | From Resend |
| `DOMAIN` | `runtown.work.gd` | Your domain |

### Step 8: Test Automatic Deployment

From your local machine:

```bash
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "test: trigger deployment"
git push origin main
```

Go to GitHub Actions to watch the deployment: 
`https://github.com/Deniswarui4/new/actions`

---

## 📊 Monitoring Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f nginx
docker-compose logs -f postgres

# Check service status
docker-compose ps

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Start services
docker-compose up -d
```

---

## 🔐 SSL Certificate Renewal

SSL certificates auto-renew via cron. To check:

```bash
sudo crontab -l
```

To manually renew:

```bash
sudo certbot renew
sudo cp /etc/letsencrypt/live/runtown.work.gd/*.pem /opt/event-ticketing/nginx/ssl/
cd /opt/event-ticketing && docker-compose restart nginx
```

---

## 🆘 Troubleshooting

### If deployment fails:

```bash
# Check logs
docker-compose logs

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### If SSL doesn't work:

```bash
# Check nginx config
docker-compose logs nginx

# Restart nginx
docker-compose restart nginx
```

### If database connection fails:

```bash
# Check postgres logs
docker-compose logs postgres

# Verify .env files match
cat api/.env
cat .env
```

---

## ✅ Success Checklist

- [ ] Server cleaned up
- [ ] Docker installed
- [ ] SSL certificate obtained
- [ ] Project cloned to `/opt/event-ticketing`
- [ ] Environment variables configured
- [ ] Services running (`docker-compose ps` shows all healthy)
- [ ] Website accessible at `https://runtown.work.gd`
- [ ] API accessible at `https://runtown.work.gd/api/v1`
- [ ] GitHub secrets configured
- [ ] Auto-deployment tested

---

**Need help?** Run `docker-compose logs -f` and share the output!
