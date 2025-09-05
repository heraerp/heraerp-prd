# HERA Deployment Checklist 🚀

## Pre-Deployment Checks

### 1. **Run Automated Checks** ✅
```bash
npm run predeploy
```

This will automatically:
- Fix useSearchParams Suspense issues
- Fix import errors
- Check dependencies
- Run TypeScript checks
- Run production build

### 2. **Manual Checks** 👀

#### Code Quality
- [ ] All new features have been tested locally
- [ ] No console.log statements in production code
- [ ] All TODOs addressed or documented

#### Dependencies
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] All required dependencies installed
- [ ] No conflicting dependency versions

#### Environment Variables
- [ ] All required env vars documented
- [ ] Railway has all necessary env vars set
- [ ] No sensitive data in code

### 3. **Common Issues & Fixes** 🔧

#### Next.js 15 Suspense Error
**Error**: `useSearchParams() should be wrapped in a suspense boundary`
**Fix**: Run `node scripts/fix-use-search-params.js`

#### Import Errors
**Error**: `'toast' is not exported from '@/components/ui/use-toast'`
**Fix**: Run `node scripts/fix-toast-imports.js`

#### Missing Dependencies
**Error**: `Module not found: Can't resolve '@opentelemetry/...'`
**Fix**: Check enterprise features dependencies

### 4. **Railway Deployment** 🚂

1. **Before Pushing**:
   ```bash
   npm run predeploy
   git add .
   git commit -m "fix: pre-deployment fixes"
   ```

2. **Push to Deploy**:
   ```bash
   git push origin main
   ```

3. **Monitor Build**:
   - Watch Railway logs for build errors
   - Check health endpoint after deployment
   - Verify all features working

### 5. **Post-Deployment** ✨

- [ ] Check application is accessible
- [ ] Test critical user flows
- [ ] Monitor error logs
- [ ] Verify database connections
- [ ] Check performance metrics

## Emergency Rollback 🚨

If deployment fails:
1. Revert to previous commit: `git revert HEAD`
2. Push to trigger rollback: `git push origin main`
3. Investigate issues locally

## Continuous Improvement 📈

After each deployment:
1. Document any new issues in this checklist
2. Update automated scripts to catch new error patterns
3. Consider adding more pre-commit hooks
4. Update CI/CD pipeline if needed