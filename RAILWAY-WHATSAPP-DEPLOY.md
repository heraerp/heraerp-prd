# 🚂 Deploy WhatsApp Integration to Railway - Step by Step

## Prerequisites
✅ GitHub account with your code repository
✅ Railway account (https://railway.app)
✅ WhatsApp Business API credentials (which you have!)

## 🚀 Deployment Steps

### Step 1: Push Your Code to GitHub

```bash
# Add all files
git add .

# Commit with message
git commit -m "Add WhatsApp Business API integration"

# Push to GitHub
git push origin main
```

### Step 2: Create Railway Project

1. **Go to Railway**: https://railway.app
2. **Click "Start a New Project"**
3. **Choose "Deploy from GitHub repo"**
4. **Connect your GitHub account** (if not already connected)
5. **Select your repository**: `heraerp-prd`
6. **Railway will automatically detect Next.js**

### Step 3: Add Environment Variables

1. **In Railway, click on your service**
2. **Go to "Variables" tab**
3. **Click "RAW Editor"**
4. **Copy and paste everything from `.env.railway` file**:

```env
# Copy the entire contents of .env.railway file here
# All your Supabase, WhatsApp, and API keys
```

5. **Click "Update Variables"**

### Step 4: Deploy

Railway will automatically deploy when you add variables. You can also:
- Click **"Deploy"** button to manually trigger
- Watch the build logs in real-time
- Takes about 3-5 minutes

### Step 5: Get Your Domain

1. **Go to Settings → Domains**
2. **Click "Generate Domain"**
3. **You'll get something like**: `hera-production.up.railway.app`

### Step 6: Configure WhatsApp Webhook

1. **Go to Meta Business Manager**
2. **Navigate to WhatsApp → Configuration → Webhooks**
3. **Update webhook URL to**:
   ```
   https://your-railway-domain.up.railway.app/api/v1/whatsapp/webhook
   ```
4. **Verify Token**: `hera-whatsapp-webhook-2024-secure-token`
5. **Click "Verify and Save"**

## 🧪 Test Your Deployment

### 1. Test Webhook Verification
```bash
curl "https://your-railway-domain.up.railway.app/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test123"
```

Should return: `test123`

### 2. Check Health Endpoint
```bash
curl https://your-railway-domain.up.railway.app/api/health
```

Should return: `{"status":"healthy"}`

### 3. Send Test WhatsApp Message
- Message your business number: +91 99458 96033
- Check Railway logs to see the webhook received

## 📊 Monitor Your App

### Railway Dashboard
- **Logs**: Service → Logs (real-time)
- **Metrics**: Service → Metrics
- **Deployments**: Service → Deployments

### Useful Commands (Railway CLI)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# View logs
railway logs

# Run commands on Railway
railway run node mcp-server/verify-whatsapp-setup.js
```

## 🚨 Common Issues & Fixes

### Build Fails
- Check Node version compatibility
- Try: `npm ci --legacy-peer-deps` in build command

### Webhook Not Working
- Ensure HTTPS (Railway provides automatically)
- Check webhook token matches exactly
- View Railway logs during verification

### Environment Variables Not Loading
- Restart service after adding variables
- Check for typos in variable names
- Use RAW editor for bulk paste

## 🎯 Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Domain generated
- [ ] WhatsApp webhook configured
- [ ] Test message working

## 🔒 Security Notes

1. **Never commit `.env.local` to Git**
2. **Use Railway's environment variables**
3. **Enable 2FA on Railway account**
4. **Monitor access logs regularly**

## 🎉 Success!

Your WhatsApp integration is now live on Railway! You can:
- Receive customer messages via webhook
- Send automated responses
- Handle appointment bookings
- Send reminders

**Your Production URL**: `https://[your-app].up.railway.app`

**Next Steps**:
1. Test with real customers
2. Monitor performance
3. Set up alerts for errors
4. Configure custom domain (optional)