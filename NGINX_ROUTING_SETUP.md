# Nginx Routing Setup

## Nginx Configuration

**File:** `/etc/nginx/sites-available/ccr`

```nginx
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
```

## Setup Commands

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/ccr

# Create symbolic link
sudo ln -sf /etc/nginx/sites-available/ccr /etc/nginx/sites-enabled/ccr

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Frontend Configuration

**File:** `frontend/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=/api
```

## Backend Configuration

**File:** `backend/.env`

```bash
NODE_ENV=development
FRONTEND_URLS=http://YOUR_ELASTIC_IP,http://YOUR_ELASTIC_IP:3000
PORT=5000
```

Replace `YOUR_ELASTIC_IP` with your actual IP.

## Restart Services

```bash
# Rebuild and restart frontend
cd frontend
npm install
npm run build
pm2 restart ccr-frontend --update-env

# Restart backend
cd ../backend
pm2 restart ccr-backend --update-env

# Reload Nginx
sudo systemctl reload nginx
```

## Test Routing

```bash
# Test backend API
curl -i http://127.0.0.1/api/health

# Test frontend
curl -i http://127.0.0.1/

# Test with public IP
curl -i http://YOUR_ELASTIC_IP/api/health
curl -i http://YOUR_ELASTIC_IP/
```
