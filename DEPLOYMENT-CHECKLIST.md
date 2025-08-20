# 🚀 HERA Deployment Checklist

## Pre-Deployment

- [ ] **Code is committed and pushed to GitHub**
  ```bash
  git status
  git add -A
  git commit -m "Your commit message"
  git push origin main
  ```

- [ ] **Environment variables prepared**
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - DEFAULT_ORGANIZATION_ID

- [ ] **Supabase database is set up**
  - Tables created (6 universal tables)
  - RLS policies configured
  - Service role key obtained

## Railway Deployment

### Option 1: One-Click Deploy (Easiest)
- [ ] Click the Railway deploy button in README
- [ ] Connect your GitHub account
- [ ] Enter required environment variables
- [ ] Deploy!

### Option 2: Manual Deploy
- [ ] Login to Railway: `railway login`
- [ ] Create new project: `railway new`
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Deploy: `railway up`

## Post-Deployment Verification

- [ ] **Check deployment health**
  ```bash
  node scripts/check-deployment.js https://your-app.railway.app
  ```

- [ ] **Test Universal API**
  ```bash
  curl https://your-app.railway.app/api/v1/universal?action=schema
  ```

- [ ] **Run production tests**
  ```bash
  cd packages/hera-testing
  node bin/direct-production-test.js salon --org-id "your-org-id"
  ```

- [ ] **Verify database connection**
  - Check health endpoint shows Supabase as "ok"
  - Create a test entity via API

## Domain Configuration (Optional)

- [ ] Generate Railway domain or add custom domain
- [ ] Update NEXT_PUBLIC_APP_URL environment variable
- [ ] Test SSL certificate is working

## Monitoring Setup

- [ ] Check Railway logs: `railway logs`
- [ ] Set up alerts for failures
- [ ] Monitor memory and CPU usage
- [ ] Check response times

## Production Readiness

- [ ] **Security**
  - [ ] All API keys are using secrets
  - [ ] CORS is properly configured
  - [ ] Rate limiting is enabled

- [ ] **Performance**
  - [ ] Build completes successfully
  - [ ] Response times < 500ms
  - [ ] Memory usage < 1GB

- [ ] **Business Features**
  - [ ] Authentication working
  - [ ] Multi-tenant isolation verified
  - [ ] Smart codes validating correctly
  - [ ] Transactions creating successfully

## Troubleshooting Commands

```bash
# View logs
railway logs

# Check environment variables
railway variables

# Restart service
railway restart

# Run locally with Railway env
railway run npm run dev

# SSH into container (if enabled)
railway shell
```

## Success Criteria

✅ Health check returning "healthy"
✅ Can create entities via API
✅ Can run business process tests
✅ Response times acceptable
✅ No errors in logs

---

**Ready to go live? Your HERA instance is production-ready! 🎉**