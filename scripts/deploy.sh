#!/bin/bash

# Manual deployment script
# Use this for manual deployments or troubleshooting

set -e

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Build and deploy
echo "🐳 Building Docker images..."
docker-compose build

echo "🚀 Deploying containers..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services..."
sleep 10

# Show status
echo "📊 Service status:"
docker-compose ps

echo "📝 Recent logs:"
docker-compose logs --tail=50

echo "✅ Deployment completed!"
