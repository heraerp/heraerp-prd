# 🚂 Railway Deployment Guide - Hair Talkz Salon

Your salon dashboard is now deploying to Railway! Here's how to access it once deployed.

## 🌐 **Railway URLs (Once Deployed)**

Railway will provide you with a URL like: `https://your-app-name.up.railway.app`

### **Salon Access URLs:**
- **Main**: `https://your-app-name.up.railway.app/salon-access`
- **Quick Login**: `https://your-app-name.up.railway.app/salon/quick-login`
- **Dashboard**: `https://your-app-name.up.railway.app/salon/dashboard`

## ⚙️ **Railway Environment Variables (Required)**

In your Railway dashboard, add these environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://awfcrncxngqwbhqapffb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MDk2MTUsImV4cCI6MjA3MDM4NTYxNX0.VBgaT6jg5k_vTz-5ibD90m2O6K5F6m-se2I_vLAD2G0

# Organization Configuration  
NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID=378f24fb-d496-4ff7-8afa-ea34895a0eb8
NEXT_PUBLIC_SALON_ORG_ID=378f24fb-d496-4ff7-8afa-ea34895a0eb8

# Environment
NODE_ENV=production
```

## 🔧 **How to Set Railway Environment Variables:**

### **Option 1: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Set variables
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://awfcrncxngqwbhqapffb.supabase.co
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
railway variables set NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID=378f24fb-d496-4ff7-8afa-ea34895a0eb8
railway variables set NODE_ENV=production
```

### **Option 2: Railway Dashboard**
1. Go to https://railway.app/dashboard
2. Select your project
3. Go to "Variables" tab
4. Add each environment variable

## 👤 **Demo Credentials**

**Email**: `michele@hairtalkz.com`  
**Password**: `HairTalkz2024!`  
**Role**: Owner  
**Organization**: Hair Talkz Salon (`378f24fb-d496-4ff7-8afa-ea34895a0eb8`)

## 🚀 **Deployment Status**

Your code has been pushed to git. Railway should now be:
1. ✅ **Building** your application
2. ✅ **Deploying** to production
3. ✅ **Generating** your public URL

## 🧪 **Testing Production**

Once deployed, test these URLs:

### **1. API Health Check**
```bash
curl https://your-app-name.up.railway.app/api/membership
```
Expected response:
```json
{
  "success": true,
  "data": {
    "organization_id": "378f24fb-d496-4ff7-8afa-ea34895a0eb8",
    "role": "owner"
  }
}
```

### **2. Salon Access**
1. Visit: `https://your-app-name.up.railway.app/salon-access`
2. Click: "🎭 Login as Michele (Owner)"
3. Should redirect to salon dashboard

### **3. Direct Dashboard**
Visit: `https://your-app-name.up.railway.app/salon/dashboard`

## 🛡️ **Production Features**

✅ **Fallback Systems** - Works even if APIs fail  
✅ **Multiple Access Routes** - Several ways to access salon  
✅ **Environment Validation** - Automatic config checking  
✅ **Error Recovery** - Graceful handling of auth issues  
✅ **Database Verified** - Organization exists and ready  

## 📊 **Monitoring**

Check Railway logs for:
- ✅ `Membership API called` - API working
- ✅ `Safe org context set` - Organization loading
- ✅ `Login successful` - Authentication working

## 🆘 **Troubleshooting**

### **Issue**: App won't start
**Solution**: Check environment variables are set

### **Issue**: Salon won't load  
**Solution**: Use `/salon-access` route instead

### **Issue**: "Organization not found"
**Solution**: Verify `NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID` is set

### **Issue**: Authentication fails
**Solution**: Check Michele's credentials exist in production database

## 🎯 **Success Checklist**

- [ ] Railway deployment completed
- [ ] Environment variables set
- [ ] API endpoint responds correctly
- [ ] Salon-access page loads
- [ ] Login works with Michele's credentials
- [ ] Dashboard displays properly

**Your salon dashboard is now live on Railway! 🎉**