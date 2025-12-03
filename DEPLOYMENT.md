# 🚀 Deployment Guide - Event Ticketing Platform

Complete guide for deploying to Ubuntu server with automated CI/CD.

## Quick Start

### 1. Initial Server Setup (One-time)

SSH into your Ubuntu server and run:

```bash
# Download and run the setup script
curl -sSL https://raw.githubusercontent.com/Deniswarui4/new/main/scripts/server-setup.sh -o setup.sh
chmod +x setup.sh
./setup.sh
```

This script will:
- ✅ Install Docker & Docker Compose
- ✅ Configure firewall (UFW)
- ✅ Setup fail2ban for security
- ✅ Clone your repository
- ✅ Setup SSL certificates (Let's Encrypt)
- ✅ Configure automatic SSL renewal

### 2. Configure GitHub Secrets

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

| **Secret Name** | **Description** | **How to Get** |
|-----------------|----------------|----------------|
| `SSH_PRIVATE_KEY` | Your server's SSH private key | Run `cat ~/.ssh/id_ed25519` on server |
| `SERVER_IP` | Your server's IP address | Run `curl ifconfig.me` on server |
| `SERVER_USER` | SSH username | Usually `ubuntu` or `root` |
| `DB_PASSWORD` | PostgreSQL password | Generate: `openssl rand -base64 32` |
| `JWT_SECRET` | JWT signing key | Generate: `openssl rand -hex 64` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | Get from [Paystack Dashboard](https://dashboard.paystack.com) |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | Get from [Paystack Dashboard](https://dashboard.paystack.com) |
| `RESEND_API_KEY` | Resend API key | Get from [Resend Dashboard](https://resend.com/api-keys) |
| `AWS_ACCESS_KEY_ID` | AWS access key (optional) | Get from [AWS IAM](https://console.aws.amazon.com/iam/) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (optional) | Get from [AWS IAM](https://console.aws.amazon.com/iam/) |
| `DOMAIN` | Your domain name | e.g., `example.com` |

### 3. Add Server SSH Key to GitHub

```bash
# On your server, generate SSH key if you haven't
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy the public key
cat ~/.ssh/id_ed25519.pub
```

Add it to GitHub:
- Go to **Settings** → **SSH and GPG keys** → **New SSH key**
- Paste the public key and save

### 4. Deploy! 🎉

Just push to the `main` branch:

```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

GitHub Actions will automatically:
1. ✅ Connect to your server
2. ✅ Pull latest code
3. ✅ Build Docker images
4. ✅ Deploy containers
5. ✅ Verify deployment

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              GitHub (Code Repository)           │
└─────────────┬───────────────────────────────────┘
              │ push to main
              ▼
┌─────────────────────────────────────────────────┐
│         GitHub Actions (CI/CD Pipeline)         │
│  • Build Docker images                          │
│  • Deploy via SSH                               │
│  • Health checks                                │
└─────────────┬───────────────────────────────────┘
              │ SSH deployment
              ▼
┌─────────────────────────────────────────────────┐
│           Ubuntu Server (Production)            │
│                                                 │
│  ┌─────────────┐  ┌──────────────┐             │
│  │   Nginx     │  │  PostgreSQL  │             │
│  │ (Reverse    │  │  (Database)  │             │
│  │  Proxy)     │  └──────────────┘             │
│  └──────┬──────┘                                │
│         │                                       │
│    ┌────┴────┬───────────┐                     │
│    │         │           │                     │
│ ┌──▼───┐  ┌─▼────┐  ┌───▼────┐               │
│ │ API  │  │ Web  │  │ Nginx  │               │
│ │(Go)  │  │      │  │        │               │
│ │      │  │      │  │        │               │
│ └──────┘  └──────┘  └────────┘               │
└─────────────────────────────────────────────────┘
```

---

## Manual Deployment (Optional)

If you need to deploy manually or troubleshoot:

```bash
# SSH into your server
ssh user@your-server-ip

# Navigate to project
cd /opt/event-ticketing

# Run deployment script
./scripts/deploy.sh
```

---

## Monitoring & Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f nginx
docker-compose logs -f postgres
```

### Check Service Status
```bash
docker-compose ps
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api
```

---

## Database Migrations

Migrations run automatically on API startup. To run manually:

```bash
docker-compose exec api ./main migrate
```

---

## Backup & Restore

### Backup Database
```bash
docker-compose exec postgres pg_dump -U event_ticketing_user event_ticketing > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
cat backup.sql | docker-compose exec -T postgres psql -U event_ticketing_user event_ticketing
```

---

## Troubleshooting

### Check if services are running
```bash
docker-compose ps
```

### View latest logs
```bash
docker-compose logs --tail=100
```

### Restart everything
```bash
docker-compose down
docker-compose up -d
```

### Check disk space
```bash
df -h
docker system df
```

### Clean up Docker
```bash
docker system prune -a
```

---

## SSL Certificate Renewal

SSL certificates auto-renew via cron job. To manually renew:

```bash
sudo certbot renew
cp /etc/letsencrypt/live/your-domain.com/*.pem /opt/event-ticketing/nginx/ssl/
docker-compose restart nginx
```

---

## Security Best Practices

✅ **Done automatically by setup script:**
- Firewall (UFW) configured
- fail2ban protection enabled
- SSL/TLS encryption
- SSH key-based authentication

**Additional recommendations:**
- Use strong passwords for database
- Regularly update system: `apt update && apt upgrade`
- Monitor logs for suspicious activity
- Keep Docker images updated
- Regular database backups

---

## Environment Variables

All sensitive configuration is stored in:
- `/opt/event-ticketing/api/.env` - API configuration
- `/opt/event-ticketing/.env` - Docker Compose variables

Never commit these files to Git!

---

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Check service status: `docker-compose ps`
3. Check GitHub Actions logs
4. Verify all secrets are set correctly in GitHub

---

**That's it! Your deployment is fully automated** 🎉

Just commit and push to trigger deployment.
