# HERA Integration Runtime - Quick Deployment Reference

## 🚀 One-Command Deployments

### Development Environment

```bash
# Complete development deployment
./scripts/deploy-integration-runtime.sh dev

# Manual step-by-step (if script fails)
supabase start
supabase migration up  
supabase functions deploy api-v2 --no-verify-jwt=false
supabase functions deploy outbox-worker --no-verify-jwt=false
psql -h localhost -p 54322 -U postgres -d postgres -f scripts/setup-prebuilt-connectors.sql
```

### Production Environment

```bash
# Set production project reference
export PRODUCTION_PROJECT_REF=your-project-ref

# Complete production deployment
./scripts/deploy-integration-runtime.sh prod

# Manual step-by-step (if script fails)
supabase link --project-ref $PRODUCTION_PROJECT_REF
supabase db push
supabase functions deploy api-v2 --project-ref $PRODUCTION_PROJECT_REF --no-verify-jwt=false
supabase functions deploy outbox-worker --project-ref $PRODUCTION_PROJECT_REF --no-verify-jwt=false
# Manual connector setup required for production database
```

## 📋 Verification Commands

```bash
# Verify development deployment
./scripts/deploy-integration-runtime.sh verify development

# Verify production deployment  
PRODUCTION_PROJECT_REF=your-ref ./scripts/deploy-integration-runtime.sh verify production

# Manual database verification
psql -h localhost -p 54322 -U postgres -d postgres -f scripts/verify-integration-setup.sql
```

## 🔍 Health Checks

### Development
```bash
# API v2 Gateway health
curl http://localhost:54321/functions/v1/api-v2/health

# Outbox Worker health  
curl http://localhost:54321/functions/v1/outbox-worker/health

# Database connectivity
supabase db ping
```

### Production
```bash
# Replace PROJECT_REF with your production reference
curl https://PROJECT_REF.supabase.co/functions/v1/api-v2/health
curl https://PROJECT_REF.supabase.co/functions/v1/outbox-worker/health
```

## 📊 Component Status Check

### Database Functions
```sql
-- Check integration RPC functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE 'hera_%integration%' 
   OR routine_name LIKE 'hera_%outbox%' 
   OR routine_name LIKE 'hera_%webhook%'
ORDER BY routine_name;
```

### Connector Definitions  
```sql
-- Check pre-built connectors
SELECT entity_code, entity_name, created_at 
FROM core_entities 
WHERE entity_type = 'INTEGRATION_CONNECTOR_DEF'
ORDER BY entity_code;
```

### Edge Functions
```bash
# List deployed functions
supabase functions list [--project-ref PROJECT_REF]

# Check function logs
supabase functions logs api-v2 [--project-ref PROJECT_REF]
supabase functions logs outbox-worker [--project-ref PROJECT_REF]
```

## 🛠️ Troubleshooting Quick Fixes

### Migration Issues
```bash
# Reset and reapply migrations
supabase db reset --linked
supabase migration up

# Check migration status
supabase migration list
```

### Function Deployment Issues
```bash
# Redeploy with explicit settings
supabase functions deploy api-v2 --no-verify-jwt=false --debug
supabase functions deploy outbox-worker --no-verify-jwt=false --debug
```

### Connector Setup Issues
```bash
# Check for existing connectors before rerunning
psql -c "SELECT count(*) FROM core_entities WHERE entity_type = 'INTEGRATION_CONNECTOR_DEF'"

# Clean up if needed
psql -c "DELETE FROM core_entities WHERE entity_type = 'INTEGRATION_CONNECTOR_DEF' AND organization_id = '00000000-0000-0000-0000-000000000000'"

# Rerun connector setup
psql -f scripts/setup-prebuilt-connectors.sql
```

## 🔧 Environment Variables

### Development (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
INTEGRATION_RUNTIME_ENABLED=true
OUTBOX_WORKER_ENABLED=true
NODE_ENV=development
```

### Production
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<production_service_role_key>
INTEGRATION_RUNTIME_ENABLED=true
OUTBOX_WORKER_ENABLED=true
NODE_ENV=production
```

## 📱 UI Access Points

### Development
- **Integration Control Center**: http://localhost:3000/platform/integrations/control-center
- **Integration Hub**: http://localhost:3000/settings/integrations

### Production  
- **Integration Control Center**: https://yourdomain.com/platform/integrations/control-center
- **Integration Hub**: https://yourdomain.com/settings/integrations

## 🎯 Success Criteria

### ✅ Development Ready When:
- [ ] All RPC functions deployed (8+ functions)
- [ ] All relationship types created (10+ types)
- [ ] All connector definitions created (5 connectors: WhatsApp, LinkedIn, Meta, Zapier, HubSpot)
- [ ] Edge functions healthy (api-v2, outbox-worker)
- [ ] Integration UIs accessible
- [ ] Health checks passing

### ✅ Production Ready When:
- [ ] All development criteria met in production
- [ ] SSL certificates configured
- [ ] Domain routing working
- [ ] Environment variables set correctly
- [ ] Production health checks passing
- [ ] Monitoring configured

## 🚨 Emergency Rollback

### Development
```bash
# Stop Supabase
supabase stop

# Reset database
supabase db reset --linked

# Restart clean
supabase start
```

### Production
```bash
# Rollback migrations (if needed)
supabase migration down --remote

# Redeploy previous function versions
supabase functions deploy api-v2 --project-ref $PROD_REF --no-verify-jwt=false

# Remove connector definitions (if needed)
psql -c "DELETE FROM core_entities WHERE entity_type LIKE 'INTEGRATION_%'"
```

---

## 📞 Support & Documentation

- **Full Deployment Guide**: [HERA-INTEGRATION-RUNTIME-DEPLOYMENT-GUIDE.md](HERA-INTEGRATION-RUNTIME-DEPLOYMENT-GUIDE.md)
- **Pre-Built Connectors Guide**: [PREBUILT-CONNECTORS-GUIDE.md](PREBUILT-CONNECTORS-GUIDE.md)
- **Supabase CLI Docs**: https://supabase.com/docs/reference/cli
- **HERA Integration Docs**: `/docs/integrations/`

---

**🎉 With these commands, HERA Integration Runtime deploys in under 5 minutes and connects immediately with WhatsApp, LinkedIn, Meta, Zapier, and HubSpot!**