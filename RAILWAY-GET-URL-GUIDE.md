# 🚂 How to Get Your Railway URL

## Method 1: Railway CLI Commands

```bash
# 1. Install Railway CLI (if not installed)
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Link to your project (if not linked)
railway link

# 4. Get your domain
railway domain

# OR

# Get full project status including URL
railway status

# OR

# Open Railway dashboard in browser
railway open
```

## Method 2: Railway Dashboard

1. Go to https://railway.app/dashboard
2. Click on your project
3. Click on your service (usually called "web" or your app name)
4. Go to **Settings** tab
5. Scroll to **Domains** section
6. Your URL will be shown there (e.g., `hera-production-abc123.up.railway.app`)

## Method 3: After Deployment

When you deploy, Railway will show the URL in the deployment logs:

```bash
# Deploy and watch for URL
railway up

# The output will include:
# ✅ Deployed to https://your-app-name.up.railway.app
```

## 📱 Your WhatsApp Webhook URL

Once you have your Railway domain, your webhook URL will be:

```
https://[your-railway-domain]/api/v1/whatsapp/webhook
```

For example:
- Railway domain: `hera-salon-production.up.railway.app`
- Webhook URL: `https://hera-salon-production.up.railway.app/api/v1/whatsapp/webhook`

## 🧪 Quick Test

After getting your URL, test the webhook:

```bash
# Replace YOUR_DOMAIN with your actual Railway domain
curl "https://YOUR_DOMAIN.up.railway.app/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test123"
```

Should return: `test123`

## 🎯 Common Railway Domains

Railway domains typically look like:
- `appname-production.up.railway.app`
- `appname-abc123.up.railway.app`
- `projectname.up.railway.app`

## 💡 No Domain Yet?

If you don't have a domain yet:
1. Deploy your app first: `railway up`
2. Go to Railway dashboard
3. Click on your service
4. Go to Settings → Domains
5. Click **"Generate Domain"**
6. Railway will create one instantly

## 📝 Update WhatsApp Webhook

Once you have your Railway URL:
1. Go to Meta Business Manager
2. WhatsApp → Configuration → Webhooks
3. Update URL to: `https://your-actual-domain.up.railway.app/api/v1/whatsapp/webhook`
4. Verify token: `hera-whatsapp-webhook-2024-secure-token`
5. Click "Verify and Save"