#!/bin/bash

# Ensure script stops on first error
set -e

echo "============================================="
echo "Starting Deployment..."
echo "============================================="

# Pull new changes
echo "Pulling latest code from GitHub..."
git pull origin main

# ================= BACKEND =================
echo "Setting up Backend..."
cd backend

echo "Installing backend dependencies..."
npm install

echo "Restarting backend process..."
# If PM2 is already managing a process named "backend", it restarts it.
# Otherwise, it starts the process and names it "backend".
pm2 restart backend || pm2 start src/server.js --name "backend"

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
# If PM2 is already managing a process named "frontend", it restarts it.
# Otherwise, it starts the Next.js process and names it "frontend".
pm2 restart frontend || pm2 start npm --name "frontend" -- start

echo "============================================="
echo "Deployment completed successfully!"
echo "============================================="
