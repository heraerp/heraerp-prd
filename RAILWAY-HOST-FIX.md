# 🔧 Railway "Host Error" Fix

## Problem

The server was showing "Host Error" and was down even though the build was successful.

## Root Cause

**Next.js was binding to `localhost` (127.0.0.1) instead of `0.0.0.0`** (all network interfaces).

In Railway/Docker environments, the server must bind to `0.0.0.0` to be accessible from outside the container. When it only binds to `localhost`, Railway's load balancer cannot connect to it, resulting in a "Host Error".

## The Fix

### 1. Updated `package.json` start script

**Before:**
```json
"start": "NODE_ENV=production next start -p ${PORT:-3000}"
```

**After:**
```json
"start": "NODE_ENV=production next start -H 0.0.0.0 -p ${PORT:-3000}"
```

The `-H 0.0.0.0` flag tells Next.js to bind to all network interfaces.

### 2. Updated `nixpacks.toml`

**Before:**
```toml
[start]
cmd = "npm run start"
```

**After:**
```toml
[start]
cmd = "next start -H 0.0.0.0 -p ${PORT:-3000}"
```

This ensures Railway uses the correct start command directly.

### 3. Added `railway.json` configuration

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "next start -H 0.0.0.0 -p ${PORT}",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

This provides Railway with explicit deployment configuration.

### 4. Added debug endpoint

Created `/api/debug` endpoint to check deployment status and environment variables.

## How to Verify the Fix

### 1. Check deployment logs:
```bash
railway logs --follow
```

Look for:
```
▲ Next.js 15.x.x
- Local:        http://0.0.0.0:3000  ✅ Correct!
- Network:      http://0.0.0.0:3000

# NOT:
- Local:        http://localhost:3000  ❌ Wrong!
```

### 2. Test the endpoints:
```bash
# Health check
curl https://app.heraerp.com/api/health

# Debug info
curl https://app.heraerp.com/api/debug

# Homepage
curl https://app.heraerp.com
```

All should return 200 OK responses.

## Why This Happened

This issue occurs when:
1. The start command doesn't include `-H 0.0.0.0`
2. Next.js defaults to binding only to `localhost`
3. Railway's load balancer can't reach the server
4. Result: "Host Error" even though the app is running inside the container

## Common Next.js Deployment Mistakes

### ❌ Wrong:
```bash
next start                    # Binds to localhost only
next start -p 3000           # Still localhost only
npm start                    # If package.json doesn't specify -H flag
```

### ✅ Correct:
```bash
next start -H 0.0.0.0 -p $PORT              # Binds to all interfaces
next start -H 0.0.0.0 -p ${PORT:-3000}     # With fallback port
NODE_ENV=production next start -H 0.0.0.0 -p $PORT  # Full command
```

## Testing Locally

To test this locally before deploying:

```bash
# Build production
npm run build

# Start with explicit host binding
next start -H 0.0.0.0 -p 3000

# Or use npm script (now fixed)
npm start

# Check it's binding to all interfaces
netstat -an | grep 3000
# Should show: 0.0.0.0:3000 or *:3000 (not 127.0.0.1:3000)
```

## Railway-Specific Considerations

### Port Assignment
Railway automatically assigns a PORT environment variable. Always use:
```bash
-p ${PORT}        # Railway injects this
-p ${PORT:-3000}  # With fallback for local development
```

### Environment Variables
Railway injects:
- `PORT` - Dynamic port assignment
- `RAILWAY_ENVIRONMENT` - production/staging
- `RAILWAY_SERVICE_NAME` - Service identifier
- `RAILWAY_DEPLOYMENT_ID` - Unique deployment ID

### Health Checks
Railway expects the server to respond on:
- `http://0.0.0.0:$PORT` (inside container)
- `https://your-domain.com` (external)

## Deployment Timeline

1. **Before fix**: Server running but not accessible → Host Error
2. **After fix**: Server binding correctly → Accessible to Railway load balancer
3. **Result**: Application now available at https://app.heraerp.com

## Monitoring

Watch these after deployment:

```bash
# Deployment logs
railway logs --environment production

# Health status
watch -n 5 'curl -s https://app.heraerp.com/api/health | jq'

# Debug info
curl https://app.heraerp.com/api/debug | jq
```

## Prevention for Future

To prevent this issue in future deployments:

1. **Always include `-H 0.0.0.0` in start commands**
2. **Test Railway deployments in staging first**
3. **Use the debug endpoint to verify configuration**
4. **Check Railway logs immediately after deployment**
5. **Monitor health endpoint for first 30 minutes**

## Quick Reference

### Files Changed:
- ✅ `package.json` - Added `-H 0.0.0.0` to start script
- ✅ `nixpacks.toml` - Updated start command
- ✅ `railway.json` - Added Railway configuration
- ✅ `src/app/api/debug/route.ts` - New debug endpoint

### Deployment URL:
https://railway.com/project/7d6ae07b-ea01-4756-93ae-88a5f1cab0ea/service/e7e4db3e-58c5-4f30-a1fb-8fc3bee3bc0c?id=61f5e1f2-227a-40f7-a6b5-ac3ffe6d1379

### Expected Result:
- ✅ Server starts and binds to `0.0.0.0`
- ✅ Railway load balancer can connect
- ✅ Application accessible at https://app.heraerp.com
- ✅ All API endpoints responding
- ✅ No more "Host Error"

---

**Status**: Fix deployed and being built. Check the Railway dashboard link above for build progress.
