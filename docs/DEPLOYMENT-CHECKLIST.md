# HERA ERP Deployment Checklist

Use this checklist before deploying HERA to production environments like Railway, Vercel, or other platforms.

## Pre-Deployment Checks

### 1. Environment Variables ✓
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly
- [ ] `DEFAULT_ORGANIZATION_ID` is set (for MCP operations)
- [ ] No placeholder values are being used
- [ ] All sensitive values are in environment variables, not in code

### 2. Configuration Files ✓
- [ ] `next.config.js` has no experimental warnings
- [ ] Global polyfills are disabled or conditional
- [ ] Production optimizations are enabled for target platform
- [ ] `outputFileTracingExcludes` is at top level (not in experimental)

### 3. Database Schema ✓
- [ ] Run `npm run schema:types` to ensure types match database
- [ ] Verify column names match actual database schema
- [ ] No hardcoded status columns (use relationships)
- [ ] Organization isolation is properly implemented

### 4. Build Process ✓
- [ ] Local build completes successfully: `npm run build`
- [ ] No TypeScript errors (or `ignoreBuildErrors: true` is intentional)
- [ ] No ESLint errors (or `ignoreDuringBuilds: true` is intentional)
- [ ] Memory limits are sufficient for build

### 5. API Routes ✓
- [ ] Health check endpoint exists and works: `/api/health`
- [ ] Universal API endpoints are accessible
- [ ] All API routes include organization_id filtering
- [ ] Error handling returns proper status codes

## Railway-Specific Checks

### 1. Health Checks ✓
- [ ] Health check path is configured in Railway settings
- [ ] Health endpoint returns 200 OK status
- [ ] Response time is under Railway's timeout limit

### 2. Build Configuration ✓
```javascript
// Verify this exists in next.config.js:
if (process.env.RAILWAY_ENVIRONMENT) {
  // Production optimizations
}
```

### 3. Memory Configuration ✓
- [ ] Build command includes memory limit if needed:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npm run build
  ```

### 4. Port Configuration ✓
- [ ] Application listens on `process.env.PORT || 3000`
- [ ] No hardcoded port numbers

## Common Issues to Avoid

### 1. Global Polyfills ❌
**Don't do this:**
```javascript
// In next.config.js
require('./scripts/setup-globals.js'); // Can cause SSR issues
```

**Do this instead:**
```javascript
// Apply polyfills conditionally in components
if (typeof window !== 'undefined') {
  // Browser-only code
}
```

### 2. Browser APIs in SSR ❌
**Don't do this:**
```javascript
// At module level
const element = document.createElement('div'); // Fails in SSR
```

**Do this instead:**
```javascript
// Inside useEffect or with window check
useEffect(() => {
  const element = document.createElement('div');
}, []);
```

### 3. Missing Organization Context ❌
**Don't do this:**
```javascript
const data = await api.query('core_entities');
```

**Do this instead:**
```javascript
const data = await api.query('core_entities', {
  organization_id: currentOrganization.id
});
```

## Post-Deployment Verification

### 1. Smoke Tests ✓
- [ ] Homepage loads without errors
- [ ] Can navigate to main sections
- [ ] Authentication flow works
- [ ] API endpoints respond correctly

### 2. Performance Checks ✓
- [ ] Initial page load under 3 seconds
- [ ] No memory leaks observed
- [ ] Database queries are optimized
- [ ] Static assets are being cached

### 3. Error Monitoring ✓
- [ ] Check deployment logs for errors
- [ ] Monitor memory usage
- [ ] Verify no 500 errors in production
- [ ] Health checks passing consistently

## Rollback Plan

If deployment fails:
1. Revert to previous deployment in Railway/platform
2. Check error logs for root cause
3. Fix issues locally and test thoroughly
4. Re-attempt deployment with fixes

## Quick Commands

```bash
# Local testing before deployment
npm run build
npm run start

# Check for type issues
npm run schema:types
npm run type-check

# Clean build
rm -rf .next
npm run build

# Test production build locally
NODE_ENV=production npm run build
NODE_ENV=production npm run start
```

---

Last Updated: 2025-09-05