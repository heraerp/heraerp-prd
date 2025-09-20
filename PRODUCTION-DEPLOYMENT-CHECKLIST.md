# 🚀 HERA ERP Production Deployment Checklist

## Pre-Deployment Tasks

### 1. ✅ Fix RLS Policies (CRITICAL)
- [ ] Run `mcp-server/PRODUCTION-RLS-FIX.sql` in Supabase Dashboard
- [ ] Verify all tables work with authenticated users
- [ ] Test with `node verify-rls-fix.js`

### 2. ✅ Environment Variables
- [ ] Set all production environment variables:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  DEFAULT_ORGANIZATION_ID=your-default-org-id
  ```

### 3. ✅ JWT Configuration
- [ ] Ensure Supabase JWT includes organization claims
- [ ] Update Auth Hook in Supabase to add custom claims:
  ```sql
  -- Add to Supabase Auth Hook
  CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
  RETURNS jsonb
  LANGUAGE plpgsql
  AS $$
  DECLARE
    claims jsonb;
    user_org_id uuid;
    user_entity_id uuid;
  BEGIN
    claims := event->'claims';
    
    -- Get user's organization and entity from relationships
    SELECT cr.organization_id, cr.from_entity_id 
    INTO user_org_id, user_entity_id
    FROM core_relationships cr
    JOIN core_entities ce ON ce.id = cr.from_entity_id
    WHERE ce.metadata->>'supabase_user_id' = (event->>'user_id')::text
    AND cr.relationship_type = 'membership'
    AND cr.is_active = true
    LIMIT 1;
    
    -- Add claims
    IF user_org_id IS NOT NULL THEN
      claims := jsonb_set(claims, '{organization_id}', to_jsonb(user_org_id));
      claims := jsonb_set(claims, '{entity_id}', to_jsonb(user_entity_id));
    END IF;
    
    RETURN jsonb_set(event, '{claims}', claims);
  END;
  $$;
  ```

### 4. ✅ Database Indexes
- [ ] Ensure all performance indexes exist (included in PRODUCTION-RLS-FIX.sql)

### 5. ✅ Build and Test
- [ ] Run `npm run predeploy` to catch any build errors
- [ ] Fix any TypeScript errors
- [ ] Test all critical paths locally

## Deployment Steps

### 1. Database Migration
```bash
# Apply production RLS fix
# Run in Supabase SQL Editor: mcp-server/PRODUCTION-RLS-FIX.sql
```

### 2. Deploy to Vercel/Railway
```bash
# Ensure all environment variables are set in deployment platform
# Deploy
git push origin main
```

### 3. Post-Deployment Verification
- [ ] Test authentication flow
- [ ] Verify organization isolation
- [ ] Check no 400 errors on API calls
- [ ] Confirm data access works correctly

## Known Issues Fixed

1. **RLS app.current_org errors** ✅
   - Fixed by PRODUCTION-RLS-FIX.sql
   - Uses JWT-based organization filtering

2. **Multiple Supabase Client instances** ✅
   - Fixed with global singleton pattern
   - Prevents memory leaks and warnings

3. **JWT Organization Context** ✅
   - Auth hook adds organization_id to JWT
   - RLS policies use JWT claims

## Production Configuration

### Supabase Dashboard Settings
1. **Authentication**
   - Enable email auth
   - Configure JWT expiry (recommended: 1 hour)
   - Set up custom claims hook

2. **API Settings**
   - Enable RLS on all tables
   - Set appropriate rate limits
   - Configure CORS for your domain

3. **Database**
   - Enable pgAudit for compliance
   - Set up automated backups
   - Configure connection pooling

## Monitoring

1. **Supabase Dashboard**
   - Monitor API usage
   - Check error rates
   - Review slow queries

2. **Application Monitoring**
   - Set up error tracking (Sentry)
   - Monitor performance (Vercel Analytics)
   - Track user sessions

## Emergency Rollback

If issues arise:

1. **Quick Fix - Disable RLS temporarily**
   ```sql
   ALTER TABLE core_dynamic_data DISABLE ROW LEVEL SECURITY;
   ALTER TABLE core_entities DISABLE ROW LEVEL SECURITY;
   -- etc for other tables
   ```

2. **Revert to service role**
   - Update API to use service role key (temporary)
   - Fix issues
   - Re-enable RLS

## Support Contacts

- Supabase Support: support@supabase.com
- HERA Team: [Your contact]
- Emergency: [Your emergency contact]

---

## Final Checklist

- [ ] All RLS policies updated and tested
- [ ] No 400 errors in browser console
- [ ] Authentication flow works correctly
- [ ] Organization isolation verified
- [ ] Performance acceptable
- [ ] Monitoring configured
- [ ] Team notified of deployment

**Ready for Production! 🚀**