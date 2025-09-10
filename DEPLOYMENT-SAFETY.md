# 🛡️ HERA Deployment Safety Guide

## Overview
This guide explains the safety mechanisms we've implemented to prevent bad code from crashing production.

## 🚨 Pre-Deployment Checks

### 1. **Local Validation** (Before Push)
```bash
# Run this before every deployment
npm run validate

# Or use the safe deployment wrapper
npm run safe-deploy
```

This checks:
- ✅ TypeScript compilation
- ✅ ESLint errors
- ✅ Problematic imports (Edit2, Grid3X3, wrong column names)
- ✅ Build success
- ✅ Build artifacts exist

### 2. **GitHub Actions** (On Push/PR)
The `.github/workflows/pre-merge-checks.yml` runs automatically and checks:
- TypeScript types
- Linting
- Build process
- Bundle size
- Security audit

## 🎯 Safe Deployment Process

### Option 1: Manual Safe Deploy
```bash
# This runs all checks and creates a deployment tag
npm run safe-deploy
```

### Option 2: Step by Step
```bash
# 1. Validate locally
npm run validate

# 2. If validation passes, commit and push
git add .
git commit -m "fix: your changes"
git push origin main
```

## 🔥 Production Server Safety

### 1. **Use Production Server Wrapper**
Update your Railway/deployment platform to use:
```bash
npm run start:production
```

Instead of:
```bash
npm start
```

### 2. **Features of Production Server**
- ✅ Automatic restart on crash (max 5 attempts)
- ✅ Graceful shutdown handling
- ✅ Health checks every 30 seconds
- ✅ Build artifact verification before start
- ✅ Error logging without crashing
- ✅ Restart delay to prevent rapid crash loops

## 🚫 Common Issues That Will Be Caught

1. **Import Errors**
   ```typescript
   // ❌ Will be caught
   import { Edit2 } from 'lucide-react'  // Should be Edit
   import { Grid3X3 } from 'lucide-react'  // Should be Grid3x3
   import { UniversalApiClient } from '@/lib/universal-api'  // Should be universalApi
   ```

2. **Wrong Column Names**
   ```typescript
   // ❌ Will be caught
   transaction_number  // Should be transaction_code
   parent_entity_id    // Should be from_entity_id
   child_entity_id     // Should be to_entity_id
   ```

3. **Build Errors**
   - Missing components
   - TypeScript errors
   - Multi-line string issues

## 📋 Deployment Checklist

Before deploying to production:

- [ ] Run `npm run validate` locally
- [ ] Fix all reported issues
- [ ] Test critical user flows locally
- [ ] Check bundle size hasn't increased dramatically
- [ ] Review changed files for obvious issues
- [ ] Use `npm run safe-deploy` for final deployment

## 🔧 Railway Configuration Update

Update your Railway configuration:

1. **Build Command**: Keep as is
   ```
   npm ci && npm run build:railway
   ```

2. **Start Command**: Update to
   ```
   npm run start:production
   ```

Or update `railway.json`:
```json
{
  "deploy": {
    "startCommand": "npm run start:production"
  }
}
```

## 🚑 Emergency Procedures

### If Production Crashes:
1. Check Railway logs for the specific error
2. The production server will attempt 5 restarts
3. If it keeps crashing, rollback to previous deployment
4. Fix the issue locally with `npm run validate`
5. Deploy the fix using `npm run safe-deploy`

### Rollback Process:
```bash
# Find the last working deployment tag
git tag -l "deploy-*"

# Checkout that tag
git checkout deploy-2025-09-10-xxxxx

# Force push to main (emergency only!)
git push origin HEAD:main --force
```

## 📊 Monitoring

Add these to your monitoring:
- Server restart count
- Build success rate
- Deployment frequency
- Error rates in first 5 minutes after deploy

## 🎯 Best Practices

1. **Never Skip Validation**
   - Always run `npm run validate` before deploying
   - Don't bypass checks "just this once"

2. **Small, Frequent Deploys**
   - Deploy small changes frequently
   - Easier to identify and fix issues

3. **Test Locally First**
   - Run `npm run build` locally
   - Test the feature you're deploying

4. **Use Feature Flags**
   - For risky changes, use feature flags
   - Can disable without redeploying

5. **Monitor After Deploy**
   - Watch logs for 5-10 minutes after deploy
   - Check that key features still work

## 🔐 Environment Variables

Ensure these are set in Railway:
- `NODE_ENV=production`
- All required Supabase variables
- Any other production configs

## 💡 Future Improvements

Consider adding:
1. Automated rollback on high error rate
2. Canary deployments
3. Blue-green deployments
4. More comprehensive health checks
5. Performance regression tests