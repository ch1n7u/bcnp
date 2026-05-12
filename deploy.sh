#!/bin/bash

# Ensure script stops on first error
set -e

echo "============================================="
echo "Starting Deployment..."
echo "============================================="

# ================= INSTALL DEPENDENCIES =================
echo "Installing system dependencies..."

# Update package manager
sudo apt update

# Install Node.js and npm
echo "Installing Node.js and npm..."
sudo apt install -y nodejs npm

# Install PM2 globally for process management
echo "Installing PM2 globally..."
sudo npm install -g pm2

# Files are now transferred directly by GitHub Actions via SCP
echo "Local files updated, beginning installation and restart steps..."

# ================= NGINX SETUP =================
echo "Configuring Nginx reverse proxy..."

# Create Nginx configuration for reverse proxy
sudo tee /etc/nginx/sites-available/ccr > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Create symbolic link to enable the site
sudo ln -sf /etc/nginx/sites-available/ccr /etc/nginx/sites-enabled/ccr

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

# ================= BACKEND =================
echo "Setting up Backend..."
cd backend

echo "Installing backend dependencies..."
sudo npm install
sudo npm audit fix

echo "Restarting backend process..."
# If PM2 is already managing a process named "ccr-backend", it restarts it.
# Otherwise, it starts the process and names it "ccr-backend".
sudo pm2 restart ccr-backend || sudo pm2 start src/server.js --name "backend"

# Go back to root
cd ..

# ================= FRONTEND =================
echo "Setting up Frontend..."
cd frontend

echo "Installing frontend dependencies..."
sudo npm install
sudo npm audit fix

echo "Building frontend..."
sudo npm run build

echo "Restarting frontend process..."
# If PM2 is already managing a process named "ccr-frontend", it restarts it.
# Otherwise, it starts the Next.js process and names it "ccr-frontend".
sudo pm2 restart ccr-frontend || sudo pm2 start npm --name "frontend" -- start

# ================= PM2 STARTUP =================
echo "Configuring PM2 to start on system boot..."
sudo pm2 startup
sudo pm2 save

# ================= ENABLE SERVICES ON BOOT =================
echo "Enabling Nginx to start on system boot..."
sudo systemctl enable nginx

echo "============================================="
echo "Deployment completed successfully!"
echo "============================================="
