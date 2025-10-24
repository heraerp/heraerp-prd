# HERA App Catalog & Permissions - Migration Plan

## Overview

This document outlines the step-by-step migration plan from the current authentication system to the HERA Multi-Tenant App Catalog & Permissions Architecture.

**Environment:** Development Supabase → Production Supabase (after testing)
**Approach:** Incremental, RPC-by-RPC deployment with verification
**Rollback Strategy:** Keep existing auth system operational during migration

---

## Current State Analysis

### Existing System
```typescript
// Current auth flow (salon-access/page.tsx)
const response = await fetch('/api/v2/auth/resolve-membership')
// Returns: { organization_id, roles: ['owner'], user_entity_id }

// Current data structure
- Users have MEMBER_OF relationships
- Roles stored in relationship_data.role
- No page-level permissions
- Hardcoded navigation based on role
```

### Existing Organizations
- **Hair Talkz**: `378f24fb-d496-4ff7-8afa-ea34895a0eb8`
- **Owner**: hairtalkz2022@gmail.com (`5ac911a5-aedd-48dc-8d0a-0009f9d22f9a`)
- **Receptionists**: hairtalkz01@gmail.com, hairtalkz02@gmail.com

---

## Phase 1: Database Setup (RPC Functions)

### 1.1 Core Infrastructure RPCs

#### Priority 1: App Catalog Management
- [ ] `hera_app_catalog_register_v1` - Register SALON app with pages
- [ ] `hera_app_catalog_update_pages_v1` - Update catalog pages (add/remove/rename)

#### Priority 2: Tenant Installation
- [ ] `hera_app_install_for_org_v1` - Install app for organization
- [ ] `hera_app_uninstall_for_org_v1` - Uninstall app (soft delete)

#### Priority 3: Permission Management
- [ ] `hera_permissions_ensure_pages_v1` - Create PAGE_PERMISSION entities
- [ ] `hera_role_set_pages_v1` - Grant/deny pages to roles
- [ ] `hera_user_override_page_v1` - User-specific page overrides

#### Priority 4: Login Context
- [ ] `hera_user_effective_pages_v1` - Calculate user's allowed pages
- [ ] `hera_login_context_v1` - Full login context (org, role, pages)

#### Priority 5: Custom Pages (Optional)
- [ ] `hera_org_custom_page_upsert_v1` - Create custom pages
- [ ] `hera_org_page_archive_v1` - Archive/delete pages
- [ ] `hera_page_request_submit_v1` - Request new page
- [ ] `hera_page_request_decide_v1` - Approve/reject request

### 1.2 Database Indexes

```sql
-- Performance optimization indexes
CREATE INDEX CONCURRENTLY idx_entities_org_type_code
  ON core_entities(organization_id, entity_type, entity_code);

CREATE INDEX CONCURRENTLY idx_relationships_org_type_from
  ON core_relationships(organization_id, relationship_type, from_entity_id);

CREATE INDEX CONCURRENTLY idx_relationships_org_type_to
  ON core_relationships(organization_id, relationship_type, to_entity_id);
```

### 1.3 Verification Queries

```sql
-- Verify indexes created
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname LIKE 'idx_%org%';

-- Verify RPCs created
SELECT proname, prosrc
FROM pg_proc
WHERE proname LIKE 'hera_%';
```

---

## Phase 2: Platform App Catalog Setup

### 2.1 Register SALON App

```sql
-- Register SALON app with all pages
SELECT public.hera_app_catalog_register_v1(
  'SALON',
  ARRAY[
    'PAGE_SALON_DASHBOARD',
    'PAGE_SALON_APPOINTMENTS',
    'PAGE_SALON_POS',
    'PAGE_SALON_CUSTOMERS',
    'PAGE_SALON_SERVICES',
    'PAGE_SALON_STAFF',
    'PAGE_SALON_REPORTS',
    'PAGE_SALON_SETTINGS',
    'PAGE_SALON_INVENTORY',
    'PAGE_SALON_CALENDAR',
    'PAGE_SALON_FINANCE'
  ],
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a' -- hairtalkz2022@gmail.com
);
```

### 2.2 Verify Catalog Creation

```sql
-- Verify APP entity created
SELECT id, entity_type, entity_code, entity_name, organization_id
FROM core_entities
WHERE entity_type = 'APP'
  AND entity_code = 'SALON'
  AND organization_id = '00000000-0000-0000-0000-000000000000';

-- Verify PAGE_PERMISSION templates created
SELECT id, entity_type, entity_code, organization_id
FROM core_entities
WHERE entity_type = 'PAGE_PERMISSION'
  AND entity_code LIKE 'PAGE_SALON_%'
  AND organization_id = '00000000-0000-0000-0000-000000000000';

-- Verify HAS_PAGE relationships created
SELECT r.id, r.relationship_type,
       e1.entity_code as app_code,
       e2.entity_code as page_code
FROM core_relationships r
JOIN core_entities e1 ON e1.id = r.from_entity_id
JOIN core_entities e2 ON e2.id = r.to_entity_id
WHERE r.relationship_type = 'HAS_PAGE'
  AND e1.entity_code = 'SALON';
```

---

## Phase 3: Migrate Existing Organizations

### 3.1 Hair Talkz Organization Setup

```sql
-- Install SALON app for Hair Talkz
SELECT public.hera_app_install_for_org_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8', -- Hair Talkz org_id
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a', -- Owner as actor
  '{
    "ORG_OWNER": {
      "allow": [
        "PAGE_SALON_DASHBOARD",
        "PAGE_SALON_APPOINTMENTS",
        "PAGE_SALON_POS",
        "PAGE_SALON_CUSTOMERS",
        "PAGE_SALON_SERVICES",
        "PAGE_SALON_STAFF",
        "PAGE_SALON_REPORTS",
        "PAGE_SALON_SETTINGS",
        "PAGE_SALON_INVENTORY",
        "PAGE_SALON_CALENDAR",
        "PAGE_SALON_FINANCE"
      ],
      "deny": []
    },
    "ORG_EMPLOYEE": {
      "allow": [
        "PAGE_SALON_DASHBOARD",
        "PAGE_SALON_APPOINTMENTS"
      ],
      "deny": [
        "PAGE_SALON_POS",
        "PAGE_SALON_REPORTS",
        "PAGE_SALON_SETTINGS"
      ]
    }
  }'::jsonb
);
```

### 3.2 Verify Tenant Installation

```sql
-- Verify USES_APP relationship created
SELECT r.id, r.relationship_type,
       o.organization_name,
       e.entity_code as app_code
FROM core_relationships r
JOIN core_organizations o ON o.id = r.from_entity_id
JOIN core_entities e ON e.id = r.to_entity_id
WHERE r.relationship_type = 'USES_APP'
  AND o.id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

-- Verify PAGE_PERMISSION entities cloned to tenant scope
SELECT id, entity_type, entity_code, organization_id
FROM core_entities
WHERE entity_type = 'PAGE_PERMISSION'
  AND entity_code LIKE 'PAGE_SALON_%'
  AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

-- Verify role permissions created
SELECT r.id, r.relationship_type,
       e1.entity_code as role_code,
       e2.entity_code as page_code,
       r.relationship_data->>'effect' as effect
FROM core_relationships r
JOIN core_entities e1 ON e1.id = r.from_entity_id
JOIN core_entities e2 ON e2.id = r.to_entity_id
WHERE r.relationship_type = 'HAS_PERMISSION'
  AND r.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
```

---

## Phase 4: Migrate Existing Users

### 4.1 Re-onboard Owner

```sql
-- Ensure owner has proper relationships
SELECT public.hera_onboard_user_v1(
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a', -- hairtalkz2022@gmail.com
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8', -- Hair Talkz org
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a', -- Self as actor
  'owner',
  NULL, -- No page overrides (owner sees all)
  NULL
);
```

### 4.2 Re-onboard Receptionists

```sql
-- Get receptionist user IDs first
SELECT id, email
FROM auth.users
WHERE email IN ('hairtalkz01@gmail.com', 'hairtalkz02@gmail.com');

-- Onboard each receptionist (example for hairtalkz01)
SELECT public.hera_onboard_user_v1(
  '[receptionist-uuid]', -- Replace with actual UUID
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a', -- Owner as actor
  'employee',
  ARRAY['PAGE_SALON_DASHBOARD', 'PAGE_SALON_APPOINTMENTS', 'PAGE_SALON_POS', 'PAGE_SALON_CUSTOMERS'],
  NULL
);
```

### 4.3 Verify User Relationships

```sql
-- Verify MEMBER_OF relationships
SELECT u.email,
       r.relationship_type,
       r.relationship_data->>'role' as role,
       o.organization_name
FROM core_relationships r
JOIN auth.users u ON u.id = r.from_entity_id
JOIN core_organizations o ON o.id = r.organization_id
WHERE r.relationship_type = 'MEMBER_OF'
  AND o.id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

-- Verify HAS_ROLE relationships
SELECT u.email,
       r.relationship_type,
       e.entity_code as role_code,
       o.organization_name
FROM core_relationships r
JOIN auth.users u ON u.id = r.from_entity_id
JOIN core_entities e ON e.id = r.to_entity_id
JOIN core_organizations o ON o.id = r.organization_id
WHERE r.relationship_type = 'HAS_ROLE'
  AND o.id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
```

---

## Phase 5: Backend API Development

### 5.1 Create Login Context Endpoint

**File:** `/src/app/api/v2/auth/login-context/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const body = await request.json()
    const { organization_code } = body

    // Verify JWT
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Call hera_login_context_v1
    const supabaseService = getSupabaseService()
    const { data, error } = await supabaseService.rpc('hera_login_context_v1', {
      p_user_id: user.id,
      p_organization_code: organization_code
    })

    if (error) {
      console.error('[login-context] RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('[login-context] Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### 5.2 Create Permissions Management Endpoints

**File:** `/src/app/api/v2/permissions/effective/route.ts`

```typescript
// GET /api/v2/permissions/effective
// Returns user's effective pages for current organization
```

**File:** `/src/app/api/v2/permissions/role-grant/route.ts`

```typescript
// POST /api/v2/permissions/role-grant
// Admin-only: Grant/deny pages to roles
```

**File:** `/src/app/api/v2/permissions/user-override/route.ts`

```typescript
// POST /api/v2/permissions/user-override
// Admin-only: Override page access for specific users
```

### 5.3 API Testing Plan

```bash
# Test login context
curl -X POST http://localhost:3000/api/v2/auth/login-context \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"organization_code": "hairtalkz"}'

# Expected response:
{
  "success": true,
  "organization": {
    "id": "378f24fb-d496-4ff7-8afa-ea34895a0eb8",
    "code": "hairtalkz",
    "name": "Hair Talkz"
  },
  "role": "ORG_OWNER",
  "owner": true,
  "pages": ["PAGE_SALON_DASHBOARD", "PAGE_SALON_APPOINTMENTS", ...]
}
```

---

## Phase 6: Frontend Integration

### 6.1 Update HERAAuthProvider

**File:** `/src/components/auth/HERAAuthProvider.tsx`

**Changes:**
1. Add new context fields: `allowedPages`, `isOwner`
2. Call new `/api/v2/auth/login-context` endpoint
3. Fallback to `/api/v2/auth/resolve-membership` if new endpoint fails
4. Store `allowedPages` and `isOwner` in context

### 6.2 Update Salon Access Login

**File:** `/src/app/salon-access/page.tsx`

**Changes:**
1. Call new login-context endpoint
2. Store `allowedPages` in localStorage
3. Intelligent redirect based on first allowed page

### 6.3 Update Navigation Components

**File:** `/src/components/salon/SalonRoleBasedDarkSidebar.tsx`

**Changes:**
1. Read `allowedPages` from context
2. Filter navigation items based on pages
3. Hide unauthorized pages

**File:** `/src/components/salon/mobile/SalonMobileBottomNav.tsx`

**Changes:**
1. Same filtering logic for mobile navigation
2. Show only allowed pages in bottom nav

### 6.4 Frontend Testing Checklist

- [ ] Owner login shows all pages
- [ ] Employee login shows limited pages
- [ ] Unauthorized pages are hidden from navigation
- [ ] Page access is blocked at route level
- [ ] Role changes reflect immediately
- [ ] Multi-org switching works correctly

---

## Phase 7: Data Migration Scripts

### 7.1 Create Migration Script

**File:** `/scripts/migrate-to-app-catalog.mjs`

```javascript
#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrate() {
  console.log('🚀 Starting HERA App Catalog Migration...')

  // 1. Register SALON app
  console.log('📦 Registering SALON app...')
  // ... implementation

  // 2. Install app for existing orgs
  console.log('🏢 Installing app for existing organizations...')
  // ... implementation

  // 3. Re-onboard users
  console.log('👥 Re-onboarding users...')
  // ... implementation

  console.log('✅ Migration complete!')
}

migrate().catch(console.error)
```

### 7.2 Verification Script

**File:** `/scripts/verify-app-catalog-migration.mjs`

```javascript
#!/usr/bin/env node
// Verify all data is correctly migrated
// Check relationships, permissions, etc.
```

---

## Phase 8: Testing & Validation

### 8.1 Development Testing

**Test Scenarios:**
1. ✅ Owner login → sees all pages
2. ✅ Receptionist login → sees limited pages
3. ✅ New user signup → proper onboarding
4. ✅ Role change → permissions update
5. ✅ Custom page creation
6. ✅ Page access denied for unauthorized users
7. ✅ Multi-org user switching

### 8.2 Performance Testing

**Metrics to Track:**
- Login context resolution time (target: < 100ms)
- Effective pages calculation (target: < 50ms)
- Navigation rendering time (target: < 200ms)
- Page load time (target: < 1s)

### 8.3 Security Validation

**Checklist:**
- [ ] Owner fast-path works correctly
- [ ] Default deny prevents unauthorized access
- [ ] User override deny is highest precedence
- [ ] Role changes reflect immediately
- [ ] Organization isolation is enforced
- [ ] Catalog updates don't affect existing tenants
- [ ] Deleted pages are properly archived
- [ ] Custom pages don't conflict with catalog
- [ ] Audit trail captures all permission changes
- [ ] RLS policies enforce organization_id filtering

---

## Phase 9: Production Deployment

### 9.1 Pre-Deployment Checklist

- [ ] All RPCs deployed to development Supabase
- [ ] All tests passing in development
- [ ] Migration scripts tested on development data
- [ ] Frontend changes deployed to staging
- [ ] Performance metrics meet targets
- [ ] Security audit completed
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

### 9.2 Deployment Steps

1. **Backup Production Database**
   ```bash
   # Create full backup before migration
   pg_dump production_db > backup_$(date +%Y%m%d).sql
   ```

2. **Deploy RPCs to Production Supabase**
   - Deploy in order of priority
   - Verify each RPC after deployment
   - Run smoke tests

3. **Run Migration Scripts**
   ```bash
   # Dry run first
   npm run migrate:app-catalog -- --dry-run

   # Actual migration
   npm run migrate:app-catalog
   ```

4. **Verify Production Data**
   ```bash
   npm run verify:app-catalog
   ```

5. **Deploy Frontend Changes**
   - Deploy to production with feature flag disabled
   - Enable feature flag for test users
   - Monitor for errors
   - Gradually roll out to all users

### 9.3 Rollback Plan

**If issues occur:**

1. **Disable Feature Flag**
   ```typescript
   // Revert to old auth flow
   const USE_APP_CATALOG = false
   ```

2. **Restore Database Backup** (if needed)
   ```bash
   psql production_db < backup_YYYYMMDD.sql
   ```

3. **Revert Frontend Changes**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

---

## Phase 10: Monitoring & Iteration

### 10.1 Metrics to Monitor

**Performance:**
- Login context resolution time
- Effective pages calculation time
- API response times
- Database query performance

**Business:**
- User adoption rate
- Page access patterns
- Custom page creation rate
- Permission change frequency

**Errors:**
- Failed login attempts
- Permission denied events
- RPC errors
- Database errors

### 10.2 Gradual Rollout Plan

**Week 1:**
- Enable for test users only
- Monitor for errors
- Gather feedback

**Week 2:**
- Enable for 10% of users
- Monitor performance
- Fix any issues

**Week 3:**
- Enable for 50% of users
- Continue monitoring
- Optimize based on data

**Week 4:**
- Enable for 100% of users
- Remove feature flag
- Clean up old code

---

## Implementation Checklist

### Development Supabase Setup
- [ ] Phase 1.1: Deploy core infrastructure RPCs
- [ ] Phase 1.2: Create database indexes
- [ ] Phase 1.3: Verify with test queries
- [ ] Phase 2.1: Register SALON app in catalog
- [ ] Phase 2.2: Verify catalog creation
- [ ] Phase 3.1: Install app for Hair Talkz
- [ ] Phase 3.2: Verify tenant installation
- [ ] Phase 4.1: Re-onboard owner
- [ ] Phase 4.2: Re-onboard receptionists
- [ ] Phase 4.3: Verify user relationships

### Backend Development
- [ ] Phase 5.1: Create login-context endpoint
- [ ] Phase 5.2: Create permissions endpoints
- [ ] Phase 5.3: Test all APIs

### Frontend Integration
- [ ] Phase 6.1: Update HERAAuthProvider
- [ ] Phase 6.2: Update salon-access login
- [ ] Phase 6.3: Update navigation components
- [ ] Phase 6.4: Complete frontend testing

### Data Migration
- [ ] Phase 7.1: Create migration script
- [ ] Phase 7.2: Create verification script

### Testing & Validation
- [ ] Phase 8.1: Development testing
- [ ] Phase 8.2: Performance testing
- [ ] Phase 8.3: Security validation

### Production Deployment
- [ ] Phase 9.1: Pre-deployment checklist
- [ ] Phase 9.2: Deploy to production
- [ ] Phase 9.3: Verify production data

### Monitoring
- [ ] Phase 10.1: Set up monitoring
- [ ] Phase 10.2: Gradual rollout

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|-------------|
| Phase 1: Database Setup | 2-3 days | None |
| Phase 2: Platform Catalog | 1 day | Phase 1 |
| Phase 3: Tenant Migration | 1 day | Phase 2 |
| Phase 4: User Migration | 1 day | Phase 3 |
| Phase 5: Backend APIs | 2 days | Phase 4 |
| Phase 6: Frontend Integration | 3 days | Phase 5 |
| Phase 7: Migration Scripts | 1 day | Phase 6 |
| Phase 8: Testing | 2-3 days | Phase 7 |
| Phase 9: Production Deploy | 1 day | Phase 8 |
| Phase 10: Monitoring | Ongoing | Phase 9 |

**Total Estimated Time:** 14-17 days

---

## Success Criteria

✅ **Phase Complete When:**
1. All RPCs deployed and verified
2. SALON app registered in catalog
3. Hair Talkz org has app installed
4. All users have proper relationships
5. Login returns correct pages
6. Navigation shows only allowed pages
7. Permission changes work correctly
8. No security vulnerabilities
9. Performance targets met
10. Production deployment successful

---

## Contact & Support

**Migration Lead:** HERA Development Team
**Database Admin:** [TBD]
**Frontend Lead:** [TBD]
**QA Lead:** [TBD]

**Status:** 📝 Ready for Implementation
**Last Updated:** 2025-10-23
**Version:** 1.0
