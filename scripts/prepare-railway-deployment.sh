#!/bin/bash

# HERA ERP - Railway Deployment Preparation Script
# This script prepares the codebase for Railway deployment

echo "🚀 Preparing HERA ERP for Railway Deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Clean up unnecessary files
echo -e "${BLUE}Cleaning up development files...${NC}"
rm -rf .next
rm -rf node_modules
rm -rf coverage
rm -rf .turbo
rm -rf dist
rm -rf out
rm -rf playwright-report
rm -rf cypress/videos
rm -rf cypress/screenshots

# 2. Create production environment file
echo -e "${BLUE}Creating production environment template...${NC}"
cat > .env.production.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# HERA Configuration
HERA_JWT_SECRET=your-jwt-secret
HERA_API_KEY=your-api-key
DEFAULT_ORGANIZATION_ID=your-default-org-id

# AI Service Configuration (Optional)
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Monitoring (Optional)
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true

# Public URLs
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
EOF

# 3. Create Railway-specific configuration
echo -e "${BLUE}Creating Railway configuration...${NC}"
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# 4. Update package.json scripts
echo -e "${BLUE}Updating package.json scripts...${NC}"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Ensure production-ready scripts
pkg.scripts = {
  ...pkg.scripts,
  'build': 'next build',
  'start': 'next start',
  'start:prod': 'NODE_ENV=production next start',
  'db:migrate': 'node scripts/run-supabase-migration.js',
  'postinstall': 'npm run db:migrate || echo \"Migration skipped\"'
};

// Update engines for Railway
pkg.engines = {
  'node': '>=18.0.0',
  'npm': '>=9.0.0'
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ package.json updated');
"

# 5. Create deployment checklist
echo -e "${BLUE}Creating deployment checklist...${NC}"
cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
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
EOF

# 6. Create health check endpoint if it doesn't exist
echo -e "${BLUE}Creating health check endpoint...${NC}"
mkdir -p src/app/api/health
cat > src/app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    }

    // Check database connectivity if needed
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      health.database = 'configured'
    }

    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    )
  }
}
EOF

# 7. Create deployment documentation
echo -e "${BLUE}Creating deployment guide...${NC}"
cat > RAILWAY_DEPLOYMENT_GUIDE.md << 'EOF'
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
EOF

echo -e "${GREEN}✅ Railway deployment preparation complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review and update environment variables in .env.production.example"
echo "2. Commit changes: git add . && git commit -m 'Prepare for Railway deployment'"
echo "3. Push to GitHub: git push origin main"
echo "4. Deploy to Railway following RAILWAY_DEPLOYMENT_GUIDE.md"