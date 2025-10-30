# HERA RBAC Quick Reference Card

**Last Updated:** 2025-10-27

---

## 🚀 Essential Commands

### Test Current Production API
```bash
cd /home/san/PRD/heraerp-dev
node mcp-server/test-upgraded-api.mjs
```

### Deploy Introspect Fix to Supabase
```sql
-- Copy contents of this file to Supabase SQL Editor:
/home/san/PRD/heraerp-dev/db/migrations/fix_hera_auth_introspect_v1_type_casting.sql

-- Or via CLI:
supabase db execute --file db/migrations/fix_hera_auth_introspect_v1_type_casting.sql
```

### Test After Deployment
```bash
node mcp-server/test-introspect-v2.mjs
```

### Verify Migration Results
```bash
node mcp-server/verify-migration.mjs
```

---

## 📚 Key Documentation Files

| File | Purpose | Status |
|------|---------|--------|
| `HERA-RBAC-USER-MANAGEMENT-API.md` | Complete API reference | ✅ Ready |
| `HERA-RBAC-MIGRATION-REPORT.md` | Migration results & stats | ✅ Complete |
| `SALON-ACCESS-UPGRADE-SUMMARY.md` | Login API upgrade docs | ✅ Deployed |
| `HERA-AUTH-INTROSPECT-DEPLOYMENT-REVIEW.md` | Pre-deployment review | ✅ Approved |
| `DEPLOYMENT-CHECKLIST.md` | Complete deployment guide | ✅ Ready |
| `QUICK-REFERENCE.md` | This file | ✅ Current |

**Location:** `/home/san/PRD/heraerp-dev/docs/rbac/`

---

## 🔧 RPC Functions Reference

### Production (Currently Used)

**`_hera_resolve_org_role(p_actor_user_id uuid, p_organization_id uuid)`**
- Returns: `text` (role code)
- Usage: Resolve user's primary role for an organization
- Strategy: HAS_ROLE (primary) → HAS_ROLE (precedence) → MEMBER_OF (fallback)

**`_hera_role_rank(p_role_code text)`**
- Returns: `integer` (rank)
- Usage: Get role precedence (1=OWNER, 2=ADMIN, etc.)

**`hera_onboard_user_v1(...)`**
- Usage: Onboard users with role assignment
- Creates: MEMBER_OF + HAS_ROLE relationships

### Ready for Deployment

**`hera_auth_introspect_v1(p_actor_user_id uuid)`**
- Returns: `jsonb` (complete auth context)
- Usage: Get full user context in single call
- Status: Fixed, pending deployment
- File: `fix_hera_auth_introspect_v1_type_casting.sql`

---

## 🎯 Role Precedence Order

```
1. ORG_OWNER        (rank 1) - Highest priority
2. ORG_ADMIN        (rank 2)
3. ORG_MANAGER      (rank 3)
4. ORG_ACCOUNTANT   (rank 4)
5. ORG_EMPLOYEE     (rank 5)
6. MEMBER           (rank 6) - Default
7. Custom roles     (rank 999)
```

---

## 📊 Current System Status

### Migration Statistics
- **Total Users:** 29 with MEMBER_OF relationships
- **Migrated to HAS_ROLE:** 6 users
- **Without Roles:** 23 users (using fallback)
- **ROLE Entities Created:** 2 (ORG_OWNER, ORG_EMPLOYEE)

### Production Status
- ✅ Login API upgraded and working
- ✅ Role resolution via `_hera_resolve_org_role`
- ✅ Backward compatibility maintained
- ⏳ Introspect function fix pending deployment

---

## 🔍 Quick Diagnostics

### Check User's Current Role
```javascript
const { data: role } = await supabase.rpc('_hera_resolve_org_role', {
  p_actor_user_id: 'user-uuid',
  p_organization_id: 'org-uuid'
})
console.log('Resolved Role:', role)
```

### Verify HAS_ROLE Relationships
```sql
SELECT
  cr.from_entity_id AS user_id,
  cr.organization_id,
  cr.relationship_data->>'role_code' AS role_code,
  cr.relationship_data->>'is_primary' AS is_primary,
  cr.is_active
FROM core_relationships cr
WHERE cr.relationship_type = 'HAS_ROLE'
  AND cr.organization_id = 'your-org-uuid'
ORDER BY cr.created_at DESC;
```

### Check MEMBER_OF Relationships
```sql
SELECT
  from_entity_id AS user_id,
  organization_id,
  relationship_data->>'role' AS legacy_role,
  created_at,
  is_active
FROM core_relationships
WHERE relationship_type = 'MEMBER_OF'
  AND organization_id = 'your-org-uuid'
ORDER BY created_at DESC;
```

---

## 🚨 Common Issues & Solutions

### Issue: User has no role assigned
```typescript
// Solution: Onboard user with role
await supabase.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: userId,
  p_organization_id: orgId,
  p_actor_user_id: adminId,
  p_role: 'member'
})
```

### Issue: Wrong role displayed
```sql
-- Check is_primary flag
SELECT
  relationship_data->>'is_primary' AS is_primary,
  relationship_data->>'role_code' AS role_code
FROM core_relationships
WHERE relationship_type = 'HAS_ROLE'
  AND from_entity_id = 'user-uuid'
  AND organization_id = 'org-uuid';

-- Should have exactly ONE is_primary=true per (user, org)
```

### Issue: API returns 404 "no_membership"
```sql
-- User needs MEMBER_OF relationship
-- Use hera_onboard_user_v1 to create it
```

### Issue: "polymorphic type" error
```
-- Introspect function needs type casting fix
-- Deploy: fix_hera_auth_introspect_v1_type_casting.sql
```

---

## 🎯 Assignment Workflow

### Assign Role to Existing User

**Step 1: Verify user has MEMBER_OF**
```sql
SELECT * FROM core_relationships
WHERE from_entity_id = 'user-uuid'
  AND relationship_type = 'MEMBER_OF'
  AND organization_id = 'org-uuid';
```

**Step 2: Assign role via onboarding**
```typescript
const { data, error } = await supabase.rpc('hera_onboard_user_v1', {
  p_supabase_user_id: userId,
  p_organization_id: orgId,
  p_actor_user_id: currentUserId,
  p_role: 'org_admin' // or 'org_employee', 'member', etc.
})
```

**Step 3: Verify role assignment**
```bash
node mcp-server/verify-migration.mjs
```

---

## 📂 File Locations

### Documentation
```
/home/san/PRD/heraerp-dev/docs/rbac/
├── HERA-RBAC-USER-MANAGEMENT-API.md
├── HERA-RBAC-MIGRATION-REPORT.md
├── SALON-ACCESS-UPGRADE-SUMMARY.md
├── HERA-AUTH-INTROSPECT-DEPLOYMENT-REVIEW.md
├── DEPLOYMENT-CHECKLIST.md
└── QUICK-REFERENCE.md (this file)
```

### Database Migrations
```
/home/san/PRD/heraerp-dev/db/migrations/
└── fix_hera_auth_introspect_v1_type_casting.sql
```

### Test Scripts
```
/home/san/PRD/heraerp-dev/mcp-server/
├── test-introspect-v2.mjs
├── test-upgraded-api.mjs
├── test-auth-introspect.mjs
└── verify-migration.mjs
```

### Production Code
```
/home/san/PRD/heraerp-dev/src/app/
├── api/v2/auth/resolve-membership/route.ts (UPGRADED)
└── salon-access/page.tsx (no changes needed)
```

---

## 🎓 Learning Resources

### Understanding HERA RBAC Architecture
Read: `HERA-RBAC-USER-MANAGEMENT-API.md` - Section "Data Model"

### Migration Process
Read: `HERA-RBAC-MIGRATION-REPORT.md` - Complete migration story

### Login Flow Analysis
Read: `SALON-ACCESS-UPGRADE-SUMMARY.md` - Authentication flow diagram

### Deployment Process
Read: `HERA-AUTH-INTROSPECT-DEPLOYMENT-REVIEW.md` - Comprehensive review

---

## 🔐 Security Checklist

- [x] ✅ Actor stamping via `created_by`/`updated_by`
- [x] ✅ Organization isolation via `organization_id`
- [x] ✅ Role precedence enforcement
- [x] ✅ Primary role uniqueness (one per user/org)
- [x] ✅ Advisory locking to prevent race conditions
- [x] ✅ Backward compatibility with MEMBER_OF
- [x] ✅ RLS policies enforced

---

## 📞 Support

**For questions about:**
- **RPC Functions:** See `HERA-RBAC-USER-MANAGEMENT-API.md`
- **Migration Status:** See `HERA-RBAC-MIGRATION-REPORT.md`
- **API Upgrade:** See `SALON-ACCESS-UPGRADE-SUMMARY.md`
- **Deployment:** See `DEPLOYMENT-CHECKLIST.md`

**Test Scripts:** All located in `/mcp-server/` directory

---

**Quick Reference Card v1.0**
**Last Updated:** 2025-10-27
**Maintained By:** Claude Code (MCP Server)
