# 🚂 Railway Deployment Guide for HERA WhatsApp Integration

## Prerequisites
- Railway account (https://railway.app)
- GitHub repository with your code
- WhatsApp Business API credentials

## 🚀 Quick Deploy Steps

### Step 1: Prepare Your Repository

1. **Ensure your code is committed to GitHub**:
```bash
git add .
git commit -m "Add WhatsApp integration"
git push origin main
```

2. **Create a `railway.json` file** in your project root:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 3
  }
}
```

### Step 2: Deploy to Railway

1. **Login to Railway**: https://railway.app

2. **Create New Project**:
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your repository

3. **Configure Environment Variables**:
   Add all your environment variables from `.env.local`:

   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://awfcrncxngqwbhqapffb.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # WhatsApp
   WHATSAPP_PHONE_NUMBER_ID=712631301940690
   WHATSAPP_BUSINESS_ACCOUNT_ID=1112225330318984
   WHATSAPP_ACCESS_TOKEN=your_access_token
   WHATSAPP_BUSINESS_NUMBER=+919945896033
   WHATSAPP_WEBHOOK_TOKEN=hera-whatsapp-webhook-2024-secure-token

   # Other
   ANTHROPIC_API_KEY=your_anthropic_key
   OPENAI_API_KEY=your_openai_key
   DEFAULT_ORGANIZATION_ID=44d2d8f8-167d-46a7-a704-c0e5435863d6
   ```

4. **Deploy**:
   - Railway will automatically detect Next.js and deploy
   - Wait for the build to complete (3-5 minutes)

### Step 3: Configure WhatsApp Webhook

1. **Get your Railway URL**:
   - In Railway, go to your service
   - Click "Settings" → "Domains"
   - Copy your domain (e.g., `hera-salon.up.railway.app`)

2. **Update WhatsApp Webhook**:
   - Go to Meta Business Manager
   - Navigate to WhatsApp → Configuration → Webhooks
   - Update webhook URL to: `https://your-app.up.railway.app/api/v1/whatsapp/webhook`
   - Use your `WHATSAPP_WEBHOOK_TOKEN` for verification

### Step 4: Set Up Automated Reminders (Optional)

Railway supports cron jobs. Add to your `railway.json`:

```json
{
  "cron": [
    {
      "name": "whatsapp-reminders",
      "schedule": "*/30 * * * *",
      "command": "cd mcp-server && node send-whatsapp-reminders.js"
    }
  ]
}
```

## 🔧 Railway-Specific Configuration

### Port Configuration
Railway provides a `PORT` environment variable. Ensure your app uses it:

```javascript
// In your server configuration
const port = process.env.PORT || 3000
```

### Health Check Endpoint
Add a health check for Railway monitoring:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'healthy',
    service: 'hera-whatsapp',
    timestamp: new Date().toISOString()
  })
}
```

### Database Connections
Railway works well with Supabase. No changes needed to your existing setup.

## 📊 Monitoring

### Railway Dashboard
- View logs: Service → Logs
- Monitor metrics: Service → Metrics
- Set up alerts: Service → Settings → Notifications

### WhatsApp Specific Monitoring
```javascript
// Add to your webhook handler
console.log('WhatsApp webhook received:', {
  messageId: message.id,
  from: message.from,
  timestamp: new Date().toISOString()
})
```

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Not Verifying**
   - Check `WHATSAPP_WEBHOOK_TOKEN` matches exactly
   - Ensure HTTPS is working (Railway provides this automatically)
   - Check logs for verification attempts

2. **Environment Variables Not Loading**
   - Double-check all variables are added in Railway dashboard
   - Restart the service after adding variables
   - Use Railway CLI to verify: `railway variables`

3. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are in `package.json`
   - Review build logs in Railway dashboard

### Debugging Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# View logs
railway logs

# Run commands in production
railway run node mcp-server/verify-whatsapp-setup.js
```

## 🔒 Security Considerations

1. **Never commit `.env` files**
2. **Use Railway's environment variables**
3. **Enable 2FA on your Railway account**
4. **Regularly rotate your WhatsApp access token**
5. **Monitor webhook logs for suspicious activity**

## 📈 Scaling

Railway automatically handles:
- HTTPS/SSL certificates
- Load balancing
- Auto-scaling (with Pro plan)
- Zero-downtime deployments

## 🎯 Next Steps After Deployment

1. **Test the webhook**:
   ```bash
   curl https://your-app.up.railway.app/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your-token&hub.challenge=test
   ```

2. **Send a test message** to your WhatsApp Business number

3. **Monitor logs** in Railway dashboard

4. **Set up custom domain** (optional):
   - Add your domain in Railway settings
   - Update DNS records
   - Update webhook URL in Meta

Your WhatsApp integration is now live on Railway! 🎉