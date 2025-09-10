# Railway Deployment Checklist

## Pre-Deployment Checklist

### 1. Local Build Test
```bash
# Clean build directory
npm run clean:build

# Test the Railway build command locally
npm run build:railway

# Verify .next directory exists
ls -la .next/BUILD_ID

# Test the start command
npm run start:custom
```

### 2. Environment Variables
Ensure these are set in Railway's dashboard under **Build & Deploy** settings:

#### Build-time Variables (Required for build)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Runtime Variables (Required for runtime)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (keep secret, never expose to client)

### 3. Configuration Files Status
- ✅ `railway.json` - Build command: `npm run build:railway`
- ✅ `nixpacks.toml` - Node.js 20.18.0 forced
- ✅ `.nvmrc` - Node version specified
- ✅ `package-lock.json` - Single lockfile committed
- ✅ Health endpoint - `/api/health`

### 4. Safe Deployment Process

#### Option A: Deploy via Git Push
1. Create a new branch: `git checkout -b deploy/yyyy-mm-dd`
2. Make changes and test locally
3. Push to GitHub: `git push origin deploy/yyyy-mm-dd`
4. Monitor Railway dashboard for build success
5. Test the deployment at your Railway URL
6. If successful, merge to main

#### Option B: Use Railway CLI
```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy current directory
railway up

# View logs
railway logs
```

### 5. Quick Rollback Process

#### Via Railway Dashboard
1. Go to your service in Railway
2. Click on "Deployments"
3. Find the last working deployment (green dot)
4. Click the three dots menu
5. Select "Redeploy"

#### Via Git (if needed)
```bash
# Find the last working commit
git log --oneline -10

# Create a rollback branch from that commit
git checkout -b rollback/<date> <commit-hash>

# Push to trigger deployment
git push origin rollback/<date>
```

### 6. Monitoring After Deployment

1. **Check health endpoint**: `curl https://your-app.railway.app/api/health`
2. **Monitor logs**: Use Railway dashboard or `railway logs`
3. **Test critical paths**:
   - Homepage loads
   - Authentication works
   - Database queries succeed

### 7. Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "No .next directory" | Check build logs, ensure `build:railway` runs |
| "Module not found" | Check if `npm ci` completed, verify lockfile |
| "Port binding error" | Ensure using `$PORT` or Railway's assigned port |
| "Environment variable undefined" | Add to both Build & Runtime variables in Railway |

### 8. Emergency Contacts
- Railway Status: https://status.railway.app/
- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app/

## Current Working Configuration

```json
// railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build:railway"
  },
  "deploy": {
    "startCommand": "node simple-server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "numReplicas": 1
  }
}
```

```toml
# nixpacks.toml
providers = ["node"]

[variables]
NODE_VERSION = "20.18.0"
NODE_ENV = "production"

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build:railway"]
```

## Remember: Keep Production Running!
- **CI blocks on quality**: Type errors and lint issues fail CI
- **Production stays up**: Build ignores type/lint errors to prevent downtime
- **Test in staging first**: Use preview environments or a staging service
- **Have a rollback plan**: Know how to quickly revert if issues arise