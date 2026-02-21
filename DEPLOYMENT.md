# Atabat Deployment Guide

Comprehensive guide for deploying the Atabat application on an Ubuntu server.

## Prerequisites

- **Ubuntu 22.04+** (or similar Debian-based distro)
- **Git** installed
- **PostgreSQL** database (local or remote)
- **Nginx** (optional, for reverse proxy)

---

## 1. System Dependencies

### 1.1 Install Node.js 22.x

```bash
# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

nvm install --lts

# Verify installation
node -v  # Should show v2x.x.x
```

### 1.2 Install pnpm

```bash
# Install pnpm globally
corepack enable

# Verify
pnpm -v
```

### 1.3 Install Python 3 and Dependencies

The captcha OCR system requires Python with EasyOCR:

```bash
# Install Python 3 and pip
sudo apt update
sudo apt install -y python3 python3-pip python-is-python3

# Verify Python is accessible via 'python' command
python --version  # Should show Python 3.x.x

# Install EasyOCR (may take a few minutes)
pip3 install easyocr

# Verify EasyOCR installation
python -c "import easyocr; print('EasyOCR installed successfully')"
```

> [!NOTE]
> The `python-is-python3` package creates a symlink so `python` points to `python3`.
> Alternatively, set `PYTHON=/usr/bin/python3` in your `.env` file.

### 1.4 Install PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Verify
pm2 -v
```

### 1.5 Install Playwright System Dependencies

```bash
# Install Playwright browser dependencies
npx playwright install-deps

# This installs required system libraries for Chromium, Firefox, and WebKit
```

---

## 2. Clone and Setup Project

### 2.1 Clone Repository

```bash
# Navigate to your deployment directory
cd /var/www  # or your preferred location

# Clone the repository
git clone <repository-url> atabat
cd atabat
```

### 2.2 Install Node Dependencies

```bash
pnpm install --frozen-lockfile
```

### 2.3 Install Playwright Browsers

```bash
# Install Chromium browser for Playwright
pnpm exec playwright install chromium

# Optional: Install all browsers
# pnpm exec playwright install
```

---

## 3. Environment Configuration

### 3.1 Create Environment File

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

### 3.2 Configure Environment Variables

Edit `.env` with your production values:

```env
# Database connection
DATABASE_URI=postgres://username:password@localhost:5432/atabat

# Security secrets (generate unique random strings)
PAYLOAD_SECRET=your-super-secret-random-string-here
PREVIEW_SECRET=your-preview-secret-here

# Python path (verify with 'which python3')
PYTHON=/usr/bin/python3

# Playwright configuration
PLAYWRIGHT_HEADLESS=true

# Production mode
NODE_ENV=production
CI=true

# Scraper settings
USE_MOCK_SCRAPER=false

# Optional: Context7 API key
CONTEXT7_API_KEY=your-key-here
```

> [!IMPORTANT]
> Generate strong random secrets for `PAYLOAD_SECRET` and `PREVIEW_SECRET`:
>
> ```bash
> openssl rand -base64 32
> ```

---

## 4. Database Setup

### 4.1 Create Database

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE atabat;
CREATE USER atabat_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE atabat TO atabat_user;
\q
```

### 4.2 Run Migrations

Run the database migrations to create the schema:

```bash
pnpm payload migrate
```

### 4.3 Seed Data

Initialize the database with default static pages (About, Contact, Terms, etc.):

```bash
pnpm payload seed-static-pages
```

---

## 5. Build Application

```bash
# Build production bundle
pnpm build
```

This compiles the Next.js application with Payload CMS.

---

## 6. Create Data Directories

```bash
# Create required data directories
mkdir -p data/captcha data/temp_captcha

# Set proper permissions
chmod -R 755 data
```

---

## 7. PM2 Configuration

### 7.1 Create PM2 Ecosystem File

Create `ecosystem.config.cjs` in the project root:

```bash
nano ecosystem.config.cjs
```

Add the following content:

```javascript
module.exports = {
  apps: [
    {
      name: 'atabat',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/atabat', // Update to your project path
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
```

### 7.2 Create Logs Directory

```bash
mkdir -p logs
```

### 7.3 Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.cjs

# Verify it's running
pm2 status

# View logs
pm2 logs atabat
```

### 7.4 Save PM2 Configuration

```bash
# Save current process list for auto-restart
pm2 save

# Setup PM2 to auto-start on system boot
pm2 startup

# Follow the command output to run the generated sudo command
```

---

## 8. Kargozar Configuration

### 8.1 Initial Admin Setup

1. Open your application in browser: `http://your-server:3000/admin`
2. Create the first admin user
3. Login to the admin panel

### 8.2 Configure Kargozar Settings

1. Navigate to **Settings → Kargozar Config** in the admin panel
2. Fill in the required fields:
   - **Username**: Kargozar portal username
   - **Password**: Kargozar portal password
   - **Captcha Max Attempts**: Maximum OCR retries (default: 5)

3. Click **Save**

### 8.3 Bale OTP Setup (One-time)

For automated OTP scraping from Bale messenger:

```bash
# Temporarily disable headless mode on your local machine
# (requires display/GUI access)
PLAYWRIGHT_HEADLESS=false pnpm payload bale-login

# Follow the prompts:
# 1. Browser opens Bale web app
# 2. Login with your phone number
# 3. Enter OTP sent to your Bale app
# 4. Wait for session to be saved
```

After login, copy `data/bale-storage.json` to your server:

```bash
scp data/bale-storage.json user@server:/var/www/atabat/data/
```

---

## 9. Nginx Reverse Proxy (Recommended)

### 9.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 9.2 Create Site Configuration

```bash
sudo nano /etc/nginx/sites-available/atabat
```

Add the following:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Increase body size for file uploads
    client_max_body_size 50M;
}
```

### 9.3 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/atabat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9.4 SSL Certificate (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

---

## 10. Verification

### 10.1 Check Application Status

```bash
# PM2 status
pm2 status

# Application logs
pm2 logs atabat --lines 50

# Check if port is listening
sudo ss -tlnp | grep 3000
```

### 10.2 Test Python OCR

```bash
# Test Python environment
python -c "import easyocr; reader = easyocr.Reader(['fa']); print('OCR ready')"
```

### 10.3 Test Playwright

```bash
# Verify Chromium is installed
pnpm exec playwright install --dry-run chromium
```

### 10.4 Access Application

- **Frontend**: `http://your-server:3000`
- **Admin Panel**: `http://your-server:3000/admin`

---

## 11. Maintenance Commands

### Common PM2 Commands

```bash
# Restart application
pm2 restart atabat

# Stop application
pm2 stop atabat

# Delete from PM2
pm2 delete atabat

# View real-time logs
pm2 logs atabat

# Monitor resources
pm2 monit
```

### Update Application

```bash
cd /var/www/atabat

# Pull latest changes
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Rebuild
pnpm build

# Restart PM2
pm2 restart atabat
```

### Run Scheduled Jobs Manually

```bash
# Trigger nightly OTP refresh
pnpm payload jobs:run --queue nightly
```

---

## 12. Troubleshooting

### Python OCR Errors

If you see `spawn python ENOENT`:

```bash
# Option 1: Install python-is-python3
sudo apt install python-is-python3

# Option 2: Set PYTHON in .env
echo 'PYTHON=/usr/bin/python3' >> .env
pm2 restart atabat
```

### Playwright Browser Issues

```bash
# Reinstall browser dependencies
npx playwright install-deps
pnpm exec playwright install chromium --with-deps
```

### Permission Issues

```bash
# Fix data directory permissions
sudo chown -R $USER:$USER data/
chmod -R 755 data/
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql $DATABASE_URI -c "SELECT 1;"
```

### View Error Logs

```bash
# PM2 error logs
pm2 logs atabat --err --lines 100

# Application logs
tail -f logs/error.log
```

### Issue: Python OCR fails with "Unsupported hardware" (NNPACK) or "weights_only" errors

This typically happens on modern Ubuntu systems (24.04+) where the system Python (3.12+) is too new for legacy PyTorch 1.8.1, or when the CPU does not support the NNPACK optimization library.

#### Error Symptoms:

[W NNPACK.cpp:56] Could not initialize NNPACK! Reason: Unsupported hardware.

Error: Python OCR failed with code 1: {"error": "'weights_only' is an invalid keyword argument for load()"}

A module that was compiled using NumPy 1.x cannot be run in NumPy 2.0.2

#### Solution:

You must isolate the OCR environment using Python 3.9 and specific legacy versions of the dependencies.

Install System Build Dependencies:

```bash
sudo apt update && sudo apt install -y build-essential libssl-dev zlib1g-dev \
libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm \
libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev
```

Setup Python 3.9 using pyenv:

```bash
# Install Python 3.9.13
pyenv install 3.9.13

# Move to your project directory and set the local version
cd /home/ubuntu/var/www/atabat
pyenv local 3.9.13
```

Recreate the Virtual Environment:

```bash
# Remove old environment if it exists
rm -rf venv

# Create a fresh 3.9 environment
python -m venv venv
source venv/bin/activate
```

Install Compatible Legacy Packages:

```bash
# Install Torch 1.8.1 (CPU version)
pip install torch==1.8.1+cpu torchvision==0.9.1+cpu -f [https://download.pytorch.org/whl/lts/1.8/torch_lts.html](https://download.pytorch.org/whl/lts/1.8/torch_lts.html)

# Force NumPy to version 1.x (to avoid NumPy 2.0 crashes)
pip install "numpy<2"

# Install EasyOCR version compatible with Torch 1.8.1
pip install easyocr==1.4.1
```

Restart the Application:

```bash
# Ensure the environment is active when starting the app
pm2 restart atabat-app
```

Note on NNPACK Error: The "Unsupported hardware" message is a warning regarding CPU optimization. By using the +cpu specific wheels and the downgraded easyocr version above, the OCR will bypass the incompatible hardware checks and function normally.

---

## Quick Reference

| Task        | Command                                 |
| ----------- | --------------------------------------- |
| Start app   | `pm2 start ecosystem.config.cjs`        |
| Start app   | `pm2 start pnpm --name atabat -- start` |
| Stop app    | `pm2 stop atabat`                       |
| Restart app | `pm2 restart atabat`                    |
| View logs   | `pm2 logs atabat`                       |
| Build       | `pnpm build`                            |
| Migrate     | `pnpm payload migrate`                  |
| Seed Data   | `pnpm payload seed-static-pages`        |
| Update deps | `pnpm install --frozen-lockfile`        |
| Run OTP job | `pnpm payload jobs:run --queue nightly` |
| Test OCR    | `python scripts/ocr_captcha.py <image>` |

---

## File Locations

| Purpose        | Path                     |
| -------------- | ------------------------ |
| Application    | `/var/www/atabat`        |
| Environment    | `.env`                   |
| PM2 config     | `ecosystem.config.cjs`   |
| Logs           | `./logs/`                |
| Bale session   | `data/bale-storage.json` |
| Atabat cookies | `data/cookies.json`      |
| Captcha temp   | `data/temp_captcha/`     |
