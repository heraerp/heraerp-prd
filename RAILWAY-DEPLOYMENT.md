# 🚂 Railway Deployment Guide for HERA ERP

This guide walks you through deploying HERA to Railway with all required environment variables and configurations.

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be pushed to GitHub (✅ Already done!)
3. **Supabase Project**: You need Supabase credentials
4. **Domain (Optional)**: For custom domain setup

## 🚀 Quick Deploy

### Option 1: Deploy via Railway Button (Recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/hera-erp)

### Option 2: Manual Deployment

1. **Login to Railway**
   ```bash
   railway login
   ```

2. **Create New Project**
   ```bash
   railway new
   # Select "Empty Project"
   ```

3. **Connect GitHub Repository**
   - In Railway dashboard, click "New Service"
   - Select "GitHub Repo"
   - Choose `heraerp/heraerp-prd`
   - Select `main` branch

## 🔐 Environment Variables

### Required Variables

Add these in Railway dashboard → Your Service → Variables:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# HERA Configuration (REQUIRED)
DEFAULT_ORGANIZATION_ID=your-org-uuid
HERA_ORG_ID=your-org-uuid

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.railway.app

# Optional: AI Services
OPENAI_API_KEY=your-openai-key

# Optional: Email Service
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@yourdomain.com

# Optional: Authentication Service
AUTH_SERVICE_API_KEY=your-auth-service-key
NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth.yourdomain.com

# Optional: Encryption
PWM_MASTER_KEY=your-secure-master-key
ENCRYPTION_MASTER_KEY=your-encryption-key
```

### Using Railway CLI to Set Variables

```bash
# Set all variables at once
railway variables set \
  NEXT_PUBLIC_SUPABASE_URL="your-url" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-key" \
  DEFAULT_ORGANIZATION_ID="your-org-id"
```

## 🏗️ Build Configuration

Railway uses the existing `railway.json` configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 🌐 Domain Setup

### Using Railway's Domain
1. Go to Settings → Networking
2. Click "Generate Domain"
3. You'll get: `your-app.up.railway.app`

### Custom Domain
1. Go to Settings → Networking → Custom Domain
2. Add your domain: `app.yourdomain.com`
3. Update DNS records:
   ```
   Type: CNAME
   Name: app
   Value: your-app.up.railway.app
   ```

## 📊 Database Migration

After deployment, run database migrations:

### Option 1: Via Railway CLI
```bash
railway run npm run db:migrate
```

### Option 2: Manual Migration
1. SSH into Railway service
2. Run migration command:
   ```bash
   node scripts/run-supabase-migration.js
   ```

## 🧪 Testing Deployment

### 1. Health Check
```bash
curl https://your-app.railway.app/api/health
```

### 2. Universal API Test
```bash
curl https://your-app.railway.app/api/v1/universal?action=schema
```

### 3. Run Production Tests
```bash
cd packages/hera-testing
node bin/direct-production-test.js salon \
  --org-id "your-org-id" \
  --api-url "https://your-app.railway.app"
```

## 🔍 Monitoring

### Railway Logs
```bash
railway logs
```

### Railway Metrics
- CPU Usage
- Memory Usage
- Network I/O
- Build Times

Available in Railway dashboard → Metrics tab

## 🚨 Troubleshooting

### Build Failures

1. **Module not found errors**
   ```bash
   # Clear cache and rebuild
   railway up --detach
   ```

2. **Memory issues during build**
   - Upgrade to Pro plan for more resources
   - Or use local build:
   ```bash
   npm run build
   railway up --detach
   ```

### Runtime Issues

1. **Database connection errors**
   - Verify Supabase credentials
   - Check if Supabase allows Railway's IPs

2. **Missing environment variables**
   ```bash
   railway variables
   ```

3. **Health check failures**
   - Increase `healthcheckTimeout` in railway.json
   - Check `/api/health` endpoint

## 🔄 CI/CD with GitHub Actions

Create `.github/workflows/railway.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Railway
        run: npm i -g @railway/cli
        
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

Get your Railway token:
```bash
railway tokens create production-deploy
```

Add to GitHub Secrets as `RAILWAY_TOKEN`.

## 📈 Scaling

### Horizontal Scaling
1. Go to Settings → Scaling
2. Increase replicas (Pro plan required)

### Vertical Scaling
1. Go to Settings → Resources
2. Adjust CPU and Memory limits

### Recommended Production Settings
- **Replicas**: 2-3 for high availability
- **CPU**: 1-2 vCPU
- **Memory**: 1-2 GB
- **Disk**: 10 GB

## 🔒 Security Best Practices

1. **Use Railway's Private Networking** for service-to-service communication
2. **Enable Web Application Firewall (WAF)** if available
3. **Rotate credentials regularly**
4. **Use Railway Secrets** for sensitive data
5. **Enable 2FA** on Railway account

## 📱 Progressive Web App (PWA)

After deployment, test PWA features:

1. **Install Prompt**
   - Visit on mobile: `https://your-app.railway.app`
   - Should see "Add to Home Screen" prompt

2. **Offline Support**
   - Install PWA
   - Turn on airplane mode
   - App should still load with cached data

3. **Service Worker**
   ```javascript
   // Check in browser console
   navigator.serviceWorker.ready.then(reg => {
     console.log('Service Worker ready:', reg);
   });
   ```

## 🎯 Post-Deployment Checklist

- [ ] Health check passing
- [ ] Environment variables set
- [ ] Database migrations completed
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place
- [ ] PWA features working
- [ ] Production tests passing

## 🆘 Support

- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **HERA Issues**: [github.com/heraerp/heraerp-prd/issues](https://github.com/heraerp/heraerp-prd/issues)

---

**Ready to deploy? Your HERA instance will be live in minutes!** 🚀