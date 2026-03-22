#!/bin/bash

# Ensure script stops on first error
set -e

echo "============================================="
echo "Starting Deployment..."
echo "============================================="

# Files are now transferred directly by GitHub Actions via SCP
echo "Local files updated, beginning installation and restart steps..."

# ================= BACKEND =================
echo "Setting up Backend..."
cd backend

echo "Installing backend dependencies..."
npm install

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
npm install

echo "Building frontend..."
npm run build

echo "Restarting frontend process..."
# If PM2 is already managing a process named "ccr-frontend", it restarts it.
# Otherwise, it starts the Next.js process and names it "ccr-frontend".
sudo pm2 restart ccr-frontend || sudo pm2 start npm --name "ccr-frontend" -- start

echo "============================================="
echo "Deployment completed successfully!"
echo "============================================="
