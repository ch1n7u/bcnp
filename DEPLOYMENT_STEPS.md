# CI/CD Deployment Documentation

This document outlines all the steps taken to automate the deployment process from the private GitHub repository to the EC2 instance.

## 1. Prerequisites and Environment Setup
- **Project Path:** The web application is located at `/var/www/bcnp/` on the EC2 instance.
- **Process Manager:** `pm2` is running using `sudo` to manage `ccr-backend` and `ccr-frontend`.
- **Permissions:** The EC2 user (`ubuntu`, `ec2-user`, etc.) has passwordless `sudo` privileges configured for executing `npm` and `pm2` commands.

## 2. GitHub Secrets Configuration
The deployment relies on three mandatory secrets added in **GitHub Repository > Settings > Secrets and variables > Actions**:
1. `EC2_HOST`: The public IP or DNS domain of the EC2 instance.
2. `EC2_USERNAME`: The SSH username used to access the server.
3. `EC2_SSH_KEY`: The complete private SSH key (`.pem` file content) used for server authentication.

## 3. GitHub Actions Workflow (`.github/workflows/deploy.yml`)
The pipeline runs automatically on every `push` event to the `main` branch. It executes the following steps:
1. **Checkout Code:** Uses `actions/checkout@v4` to pull the latest code repository directly into the GitHub runner.
2. **Transfer Files to EC2:** Uses `appleboy/scp-action@v0.1.7` to securely copy all files from the GitHub runner straight into the `/var/www/bcnp/` directory on the EC2 server, overriding existing files without needing `git pull`.
3. **Execute Deployment Script:** Uses `appleboy/ssh-action@v1.0.3` to SSH into the EC2 instance, make the `deploy.sh` script executable, and run it.

## 4. Deployment Script Execution (`deploy.sh`)
Once executed on the EC2 instance, the script performs the following sequentially:

### Backend Deployment Steps
1. Changes directory to `/var/www/bcnp/backend`.
2. Runs `sudo npm install` to install any new dependencies as the root user.
3. Restarts the PM2 process using `sudo pm2 restart backend` (or starts it if it does not currently exist).

### Frontend Deployment Steps
1. Changes directory to `/var/www/bcnp/frontend`.
2. Runs `sudo npm install` to install new dependencies as the root user.
3. Runs `sudo npm run build` to build the Next.js production package.
4. Restarts the PM2 process using `sudo pm2 restart frontend` (or starts it if it does not currently exist).
