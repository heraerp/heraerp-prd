# HERA ERP Railway Deployment Guide

## Quick Start

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/yourusername/heraerp-prd.git
   cd heraerp-prd
   ```

2. **Install Railway CLI** (Optional)
   ```bash
   npm install -g @railway/cli
   ```

3. **Deploy with Railway CLI**
   ```bash
   railway login
   railway init
   railway up
   ```

4. **Or Deploy via Dashboard**
   - Visit https://railway.app/new
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Configure environment variables
   - Deploy!

## Environment Variables

Required variables for production:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security (Required)
HERA_JWT_SECRET=generate-a-secure-secret
NEXTAUTH_SECRET=generate-another-secure-secret

# Application (Required)
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
DEFAULT_ORGANIZATION_ID=your-default-org-uuid

# AI Services (Optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Features Included

- ✅ Multi-Organization Support
- ✅ Organization Switcher
- ✅ Organization Dashboard/Settings
- ✅ Member Management
- ✅ Universal 6-Table Architecture
- ✅ Progressive Web App Support
- ✅ AI Integration Ready
- ✅ Production Monitoring

## Common Issues

1. **Build Failures**
   - Check Node.js version (requires 18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Database Connection**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Ensure RLS policies allow access

3. **Authentication Issues**
   - Verify JWT secret is set
   - Check Supabase auth configuration
   - Ensure callback URLs are configured

## Support

- Documentation: /docs
- GitHub Issues: https://github.com/yourusername/heraerp-prd/issues
- Railway Community: https://discord.gg/railway
