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

# Install git (if not already installed)
echo "Installing git..."
sudo apt install -y git

# Files are now transferred directly by GitHub Actions via SCP
echo "Local files updated, beginning installation and restart steps..."

# ================= BACKEND =================
echo "Setting up Backend..."
cd backend

echo "Installing backend dependencies..."
sudo npm install

echo "Restarting backend process..."
# If PM2 is already managing a process named "ccr-backend", it restarts it.
# Otherwise, it starts the process and names it "ccr-backend".
sudo pm2 restart ccr-backend || sudo pm2 start src/server.js --name "ccr-backend"

# Go back to root
cd ..

# ================= FRONTEND =================
echo "Setting up Frontend..."
cd frontend

echo "Installing frontend dependencies..."
sudo npm install

echo "Building frontend..."
sudo npm run build

echo "Restarting frontend process..."
# If PM2 is already managing a process named "ccr-frontend", it restarts it.
# Otherwise, it starts the Next.js process and names it "ccr-frontend".
sudo pm2 restart ccr-frontend || sudo pm2 start npm --name "ccr-frontend" -- start

# ================= PM2 STARTUP =================
echo "Configuring PM2 to start on system boot..."
sudo pm2 startup
sudo pm2 save

echo "============================================="
echo "Deployment completed successfully!"
echo "============================================="
