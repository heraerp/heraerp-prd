# HERA ERP Railway Deployment Checklist

## Pre-Deployment Steps

1. **Environment Variables**
   - [ ] Set all required environment variables in Railway dashboard
   - [ ] Verify Supabase connection details
   - [ ] Set JWT secret and API keys
   - [ ] Configure AI service keys (if using)

2. **Database Setup**
   - [ ] Ensure Supabase database is configured
   - [ ] Run migrations if needed
   - [ ] Verify RLS policies are in place

3. **Domain Configuration**
   - [ ] Configure custom domain (if applicable)
   - [ ] Set up SSL certificate

## Deployment Steps

1. **Connect GitHub Repository**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Create Railway Project**
   - Go to https://railway.app
   - Create new project
   - Connect GitHub repository
   - Select branch (main/master)

3. **Configure Environment**
   - Add all environment variables from .env.production.example
   - Enable auto-deploy from main branch

4. **Deploy**
   - Railway will automatically build and deploy
   - Monitor deployment logs
   - Check health endpoint once deployed

## Post-Deployment

1. **Verification**
   - [ ] Check application is accessible
   - [ ] Test authentication flow
   - [ ] Verify database connectivity
   - [ ] Test key features (Organization Switcher, etc.)

2. **Monitoring**
   - [ ] Set up alerts
   - [ ] Configure logging
   - [ ] Enable performance monitoring

## Troubleshooting

- Check Railway logs: `railway logs`
- Verify environment variables are set correctly
- Ensure database migrations ran successfully
- Check Node.js version compatibility
