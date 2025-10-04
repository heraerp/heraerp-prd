# 🚂 Railway Multi-Environment Setup Guide

## Quick Setup (10 minutes)

### Step 1: Create Staging Environment

1. **Go to Railway Dashboard**: https://railway.app
2. **Navigate to your project**: `heraprd`
3. **Create staging environment**:
   ```
   Click "Environments" → "New Environment"
   Name: staging
   Copy from: production (to clone settings)
   ```

### Step 2: Create Staging Service

1. **In staging environment**:
   ```
   Click "New" → "Empty Service"
   Name: heraerp-staging
   ```

2. **Connect to GitHub**:
   ```
   Service Settings → Source
   Connect to: your-github-repo
   Branch: develop
   ```

3. **Configure Build**:
   ```
   Service Settings → Build
   Builder: Nixpacks (auto-detected)
   Build Command: npm run build
   Start Command: next start -H 0.0.0.0 -p $PORT
   ```

### Step 3: Set Staging Environment Variables

Copy all production environment variables but use **staging Supabase instance**:

```bash
# Switch to staging environment in CLI
railway environment --environment staging

# Or manually set in Railway Dashboard:
# heraerp-staging → Variables → Add Variables

# Required variables (use STAGING database URLs):
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key
DEFAULT_ORGANIZATION_ID=your-staging-org-id

# Keep these the same:
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
RESEND_API_KEY=re_...
ENCRYPTION_MASTER_KEY=dev-encryption-master-key-2024-universal-hera-data-protection
PWM_MASTER_KEY=dev-pwm-master-key-2024-hera-wealth-management-encryption-secure
SESSION_SECRET=another_secure_secret_for_session_management
```

### Step 4: Configure Staging Domain

```
heraerp-staging → Settings → Networking
Add Custom Domain: staging.heraerp.com

DNS Configuration (in your domain provider):
Type: CNAME
Name: staging
Value: [Railway provides this after adding domain]
TTL: 3600
```

### Step 5: Enable Auto-Deploy on `develop` Branch

```
heraerp-staging → Settings → Source
Watch Paths: (leave empty to watch all)
Auto Deploy: ON
Automatic Deploys from: develop

✅ Now every push to develop will auto-deploy to staging!
```

### Step 6: Configure Production Environment

```
production environment → heraerp-prd → Settings → Source
Auto Deploy: ON (for main branch)
Require CI Checks to Pass: ON ✅ Important!

This ensures GitHub Actions must pass before deploying to production
```

### Step 7: Get Railway Tokens for GitHub Actions

```bash
# Login to Railway CLI
railway login

# Get staging token
railway environment --environment staging
railway tokens create

# Copy the token and add to GitHub:
# GitHub repo → Settings → Secrets → New secret
# Name: RAILWAY_STAGING_TOKEN
# Value: [paste token]

# Get production token
railway environment --environment production
railway tokens create

# Add to GitHub:
# Name: RAILWAY_PRODUCTION_TOKEN
# Value: [paste token]
```

---

## Verification

### Test Staging Deployment

```bash
# Make a change
git checkout develop
echo "// test change" >> src/app/page.tsx
git add .
git commit -m "test: staging deployment"
git push origin develop

# Watch deployment
railway logs --environment staging --follow

# Check health
curl https://staging.heraerp.com/api/health

# Should return:
# {
#   "status": "healthy",
#   "environment": "staging",
#   ...
# }
```

### Test Production Deployment

```bash
# Create PR from develop to main
gh pr create --base main --head develop --title "Deploy to production"

# After review and merge, production will auto-deploy
# Monitor with:
railway logs --environment production --follow
```

---

## Environment Comparison

| Feature | Development | Staging | Production |
|---------|------------|---------|------------|
| **Branch** | Any | `develop` | `main` |
| **URL** | localhost:3000 | staging.heraerp.com | app.heraerp.com, *.heraerp.com |
| **Database** | Local/Dev Supabase | Staging Supabase | Production Supabase |
| **Auto Deploy** | Manual | ✅ On push to develop | ✅ On merge to main |
| **CI Checks** | Optional | ✅ Required | ✅ Required |
| **Purpose** | Development | Pre-production testing | Live application |

---

## Cost Optimization

Railway pricing:
- **Hobby Plan**: $5/month + usage
- **Pro Plan**: $20/month + usage

Tips to reduce costs:
1. **Use sleep schedule for staging**:
   ```
   staging → Settings → Sleep
   Sleep after 1 hour of inactivity: ON
   ```

2. **Limit staging resources**:
   ```
   staging → Settings → Resources
   Memory: 512 MB (vs 1GB production)
   CPU: 0.5 vCPU (vs 1 vCPU production)
   ```

3. **Use shared Supabase project** for staging:
   - Create separate organizations in same Supabase project
   - No need for dedicated staging Supabase instance

---

## Troubleshooting

### Staging not deploying?

```bash
# Check logs
railway logs --environment staging

# Check service status
railway status --environment staging

# Redeploy manually
railway up --environment staging
```

### GitHub Actions failing?

```bash
# Check secrets are set
gh secret list

# Required:
# - RAILWAY_STAGING_TOKEN
# - RAILWAY_PRODUCTION_TOKEN
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Health check failing?

```bash
# Test locally first
npm run build
npm run start
curl http://localhost:3000/api/health

# Should return status 200
```

---

## Quick Commands Reference

```bash
# Deploy to staging
railway up --environment staging

# Deploy to production
railway up --environment production

# View logs
railway logs --environment staging
railway logs --environment production

# Check status
railway status --environment staging
railway status --environment production

# List deployments
railway list

# Rollback
railway rollback --environment production
```

---

## Next Steps

1. ✅ **Set up staging environment** (this guide)
2. 📝 **Test deployment workflow**
3. 🔧 **Configure monitoring alerts**
4. 📊 **Set up error tracking** (Sentry/LogRocket)
5. 🔐 **Add security scanning** (Snyk/Dependabot)

For detailed deployment procedures, see [DEPLOYMENT-STRATEGY.md](./docs/DEPLOYMENT-STRATEGY.md)
