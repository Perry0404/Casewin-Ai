#!/bin/bash

# CaseWin-NG VPS Deployment Script
# Requires: Ubuntu 22.04+, 8GB RAM, 4 vCPU

set -e

echo "🚀 Starting CaseWin-NG deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Clone repository
echo "📥 Cloning repository..."
cd /var/www
sudo git clone https://github.com/Perry0404/Casewin-Ai.git casewin
cd casewin

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build applications
echo "🔨 Building applications..."
cd apps/web && npm run build && cd ../..
cd apps/whatsapp-bot && npm run build && cd ../..

# Copy environment file
echo "📝 Setting up environment..."
cp .env.example .env
echo "⚠️  Please edit .env with your actual credentials"

# Start Docker services (Ollama + Qdrant)
echo "🐳 Starting Docker services..."
docker-compose up -d

# Pull Ollama models
echo "🤖 Pulling Ollama models (this may take 10-15 minutes)..."
docker exec -it casewin-ollama-1 ollama pull llama3.2:1b
docker exec -it casewin-ollama-1 ollama pull llama3.2:3b

# Index Nigerian cases into Qdrant
echo "📚 Indexing Nigerian case law..."
npm run index-cases

# Setup Nginx
echo "🌐 Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL (Let's Encrypt)
echo "🔒 Setting up SSL..."
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d casewin.ng -d www.casewin.ng

# Start applications with PM2
echo "🚀 Starting applications with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit /var/www/casewin/.env with your credentials"
echo "2. Restart services: pm2 restart all"
echo "3. Check status: pm2 status"
echo "4. View logs: pm2 logs"
echo ""
echo "🌐 Your app should be live at https://casewin.ng"
