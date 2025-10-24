# HERA RPC Functions - Usage Guide

## Overview

This document provides comprehensive usage examples for all HERA RPC functions deployed to Supabase. Each function includes syntax, parameters, examples, and common use cases.

**Environment:** Development Supabase
**Schema:** `public`
**Status:** Living Document - Updated as RPCs are deployed

---

## Table of Contents

1. [Utility Functions](#utility-functions)
   - [_hera_sc_build](#_hera_sc_build)
   - [_hera_resolve_org_role](#_hera_resolve_org_role)
2. [App Catalog Functions](#app-catalog-functions)
3. [Organization Management](#organization-management)
4. [User Onboarding](#user-onboarding)
5. [Permission Management](#permission-management)
6. [Login & Session](#login--session)
7. [Custom Pages](#custom-pages)

---

## Utility Functions

### `_hera_sc_build`

**Purpose:** Build HERA DNA-compliant smart codes from segments

**Status:** ✅ Deployed

**Signature:**
```sql
public._hera_sc_build(
  p_segments text[],  -- Array of segments (min 6)
  p_version  int      -- Version number (>= 1)
) RETURNS text
```

**Rules:**
- Dot-separated segments only
- Minimum 6 segments (including HERA)
- Segments must be UPPERCASE [A-Z0-9]
- Version suffix format: `.v<number>` (lowercase v)

**Examples:**

```sql
-- ✅ Valid: Build a product entity smart code
SELECT public._hera_sc_build(
  ARRAY['HERA', 'SALON', 'ENTITY', 'PRODUCT', 'ITEM'],
  1
);
-- Returns: 'HERA.SALON.ENTITY.PRODUCT.ITEM.v1'

-- ✅ Valid: Build a page permission smart code
SELECT public._hera_sc_build(
  ARRAY['HERA', 'UNIVERSAL', 'PERMISSION', 'PAGE', 'TENANT', 'CLONE'],
  1
);
-- Returns: 'HERA.UNIVERSAL.PERMISSION.PAGE.TENANT.CLONE.v1'

-- ✅ Valid: Build a relationship smart code
SELECT public._hera_sc_build(
  ARRAY['HERA', 'ORG', 'RELATIONSHIP', 'MEMBERSHIP', 'OWNER'],
  1
);
-- Returns: 'HERA.ORG.RELATIONSHIP.MEMBERSHIP.OWNER.v1'

-- ❌ Invalid: Too few segments (only 4 total)
SELECT public._hera_sc_build(
  ARRAY['HERA', 'SALON', 'ENTITY'],
  1
);
-- ERROR: need at least 6 segments (got 3)

-- ❌ Invalid: Lowercase segment
SELECT public._hera_sc_build(
  ARRAY['HERA', 'salon', 'ENTITY', 'PRODUCT', 'ITEM'],
  1
);
-- ERROR: invalid segment "salon"

-- ❌ Invalid: Underscore in segment
SELECT public._hera_sc_build(
  ARRAY['HERA', 'SALON_POS', 'ENTITY', 'PRODUCT', 'ITEM'],
  1
);
-- ERROR: invalid segment "SALON_POS"

-- ❌ Invalid: Version less than 1
SELECT public._hera_sc_build(
  ARRAY['HERA', 'SALON', 'ENTITY', 'PRODUCT', 'ITEM'],
  0
);
-- ERROR: version must be >= 1
```

**Common Use Cases:**

```sql
-- 1. Building entity smart codes
SELECT public._hera_sc_build(
  ARRAY['HERA', 'SALON', 'ENTITY', 'CUSTOMER', 'PROFILE'],
  1
);

-- 2. Building relationship smart codes
SELECT public._hera_sc_build(
  ARRAY['HERA', 'SALON', 'RELATIONSHIP', 'APPOINTMENT', 'BOOKED'],
  1
);

-- 3. Building permission smart codes
SELECT public._hera_sc_build(
  ARRAY['HERA', 'SALON', 'PERMISSION', 'PAGE', 'DASHBOARD'],
  1
);

-- 4. Building role smart codes
SELECT public._hera_sc_build(
  ARRAY['HERA', 'UNIVERSAL', 'ROLE', 'ORG', 'OWNER'],
  1
);
```

**TypeScript Integration:**

```typescript
// Frontend usage via RPC
const { data, error } = await supabase.rpc('_hera_sc_build', {
  p_segments: ['HERA', 'SALON', 'ENTITY', 'PRODUCT', 'ITEM'],
  p_version: 1
})

if (error) {
  console.error('Smart code build failed:', error.message)
} else {
  console.log('Smart code:', data) // 'HERA.SALON.ENTITY.PRODUCT.ITEM.v1'
}
```

**Best Practices:**

1. **Always use UPPERCASE** - The function will reject lowercase
2. **No special characters** - Only A-Z and 0-9 allowed
3. **Minimum 6 segments** - Including 'HERA' prefix
4. **Version starts at 1** - Never use 0 or negative numbers
5. **Cache results** - Function is IMMUTABLE, safe to cache

---

### `_hera_resolve_org_role`

**Purpose:** Resolve an actor's role within a specific organization

**Status:** ✅ Deployed

**Signature:**
```sql
public._hera_resolve_org_role(
  p_actor_user_id   uuid,  -- User's UUID (auth.users.id)
  p_organization_id uuid   -- Organization UUID
) RETURNS text
```

**Returns:** Role code (e.g., 'owner', 'admin', 'employee') or NULL if not a member

**Examples:**

```sql
-- ✅ Check owner role
SELECT public._hera_resolve_org_role(
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a', -- hairtalkz2022@gmail.com
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'  -- Hair Talkz org
);
-- Returns: 'owner'

-- ✅ Check non-member (returns NULL)
SELECT public._hera_resolve_org_role(
  '00000000-0000-0000-0000-000000000000', -- Non-existent user
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
);
-- Returns: NULL

-- ✅ Handle NULL inputs
SELECT public._hera_resolve_org_role(NULL, NULL);
-- Returns: NULL

-- ✅ Check multiple users at once
SELECT
  au.email,
  public._hera_resolve_org_role(
    au.id,
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  ) as role
FROM auth.users au
WHERE au.email LIKE '%hairtalkz%';
```

**Common Use Cases:**

```sql
-- 1. Authorization check in other RPCs
CREATE OR REPLACE FUNCTION example_protected_function(
  p_actor_user_id uuid,
  p_organization_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_role text;
BEGIN
  -- Check if actor is owner or admin
  v_role := public._hera_resolve_org_role(p_actor_user_id, p_organization_id);

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'User is not a member of this organization';
  END IF;

  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions. Role: %', v_role;
  END IF;

  -- Proceed with protected operation
  RETURN jsonb_build_object('success', true);
END $$;

-- 2. Check if user can perform admin actions
DO $$
DECLARE
  v_role text;
BEGIN
  v_role := public._hera_resolve_org_role(
    '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a',
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  );

  IF v_role IN ('owner', 'admin') THEN
    RAISE NOTICE 'User has admin permissions';
  ELSE
    RAISE NOTICE 'User has limited permissions: %', v_role;
  END IF;
END $$;

-- 3. List all members and their roles
SELECT
  au.email,
  au.id as user_id,
  public._hera_resolve_org_role(au.id, co.id) as role,
  co.organization_name
FROM core_organizations co
CROSS JOIN auth.users au
WHERE public._hera_resolve_org_role(au.id, co.id) IS NOT NULL
  AND co.id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
ORDER BY au.email;
```

**TypeScript Integration:**

```typescript
// Frontend usage via RPC
const { data: role, error } = await supabase.rpc('_hera_resolve_org_role', {
  p_actor_user_id: user.id,
  p_organization_id: organization.id
})

if (error) {
  console.error('Role resolution failed:', error.message)
} else if (role === null) {
  console.log('User is not a member of this organization')
} else {
  console.log('User role:', role) // 'owner', 'admin', 'employee', etc.
}

// Check if user is admin
const isAdmin = ['owner', 'admin'].includes(role)
```

**Performance Considerations:**

```sql
-- Required index for optimal performance
CREATE INDEX IF NOT EXISTS idx_relationships_org_type_from
  ON core_relationships(organization_id, relationship_type, from_entity_id)
  WHERE is_active = true;

-- Query plan should use index scan
EXPLAIN ANALYZE
SELECT public._hera_resolve_org_role(
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a',
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
);
-- Should show: Index Scan using idx_relationships_org_type_from
```

**Best Practices:**

1. **Always check NULL** - User might not be a member
2. **Cache results** - Function is STABLE, safe to cache within transaction
3. **Use in BEFORE triggers** - Validate permissions before mutations
4. **Fast owner check** - Returns immediately for owner role
5. **Works with inactive members** - Only returns active memberships

---

## App Catalog Functions

### `hera_app_catalog_register_v1`

**Purpose:** Register an application in the platform catalog with its page templates

**Status:** ✅ Deployed

**Signature:**
```sql
public.hera_app_catalog_register_v1(
  p_app_code   text,    -- App code (e.g., 'SALON', 'RESTAURANT')
  p_page_codes text[],  -- Array of page codes (without PAGE_ prefix)
  p_actor_user uuid     -- Platform admin UUID
) RETURNS jsonb
```

**Returns:**
```json
{
  "success": true,
  "app": "SALON",
  "app_id": "uuid-here",
  "pages": 3
}
```

**Rules:**
- App code will be uppercased automatically
- Page codes must NOT include `PAGE_` prefix (function adds it)
- At least one page required
- Idempotent: Safe to run multiple times
- Creates platform-scoped entities (organization_id = `00000000-0000-0000-0000-000000000000`)

**Examples:**

```sql
-- ✅ Register SALON app with 3 pages
SELECT public.hera_app_catalog_register_v1(
  'SALON',
  ARRAY['SALON_DASHBOARD', 'SALON_APPOINTMENTS', 'SALON_POS'],
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid
);
-- Returns: {"success": true, "app": "SALON", "app_id": "...", "pages": 3}

-- ✅ Register RESTAURANT app
SELECT public.hera_app_catalog_register_v1(
  'RESTAURANT',
  ARRAY['RESTAURANT_DASHBOARD', 'RESTAURANT_MENU', 'RESTAURANT_ORDERS', 'RESTAURANT_KITCHEN'],
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid
);

-- ✅ Register CRM app
SELECT public.hera_app_catalog_register_v1(
  'CRM',
  ARRAY['CRM_DASHBOARD', 'CRM_CONTACTS', 'CRM_LEADS', 'CRM_OPPORTUNITIES'],
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid
);

-- ❌ Invalid: Page code includes PREFIX (will raise exception)
SELECT public.hera_app_catalog_register_v1(
  'SALON',
  ARRAY['PAGE_SALON_DASHBOARD'],  -- ❌ Don't include PAGE_ prefix
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid
);
-- ERROR: page_code should not include PAGE_ prefix: PAGE_SALON_DASHBOARD

-- ❌ Invalid: No pages provided
SELECT public.hera_app_catalog_register_v1(
  'SALON',
  ARRAY[]::text[],  -- ❌ Empty array
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid
);
-- ERROR: at_least_one_page_required

-- ❌ Invalid: Empty page code
SELECT public.hera_app_catalog_register_v1(
  'SALON',
  ARRAY['SALON_DASHBOARD', ''],  -- ❌ Empty string
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid
);
-- ERROR: page_code cannot be empty
```

**What Gets Created:**

1. **APP Entity** (platform scope):
   - `entity_type`: 'APP'
   - `entity_code`: 'SALON' (uppercased)
   - `smart_code`: 'HERA.UNIVERSAL.CATALOG.APP.ENTRY.TEMPLATE.v1'
   - `organization_id`: `00000000-0000-0000-0000-000000000000`

2. **PAGE_PERMISSION Entities** (one per page):
   - `entity_type`: 'PAGE_PERMISSION'
   - `entity_code`: 'PAGE_SALON_DASHBOARD' (prefix added automatically)
   - `smart_code`: 'HERA.UNIVERSAL.CATALOG.PAGE.PERMISSION.TEMPLATE.v1'
   - `metadata`: `{"kind": "page_template", "app": "SALON"}`

3. **HAS_PAGE Relationships** (APP → PAGE):
   - `relationship_type`: 'HAS_PAGE'
   - `smart_code`: 'HERA.UNIVERSAL.REL.APP.HASPAGE.LINK.v1'
   - `relationship_data`: `{"source": "catalog"}`

**Verification:**

```sql
-- 1. Verify APP entity created
SELECT id, entity_code, entity_type, smart_code, status
FROM public.core_entities
WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND entity_type = 'APP'
  AND entity_code = 'SALON';

-- 2. Verify PAGE entities created
SELECT entity_code, entity_type, metadata
FROM public.core_entities
WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND entity_type = 'PAGE_PERMISSION'
  AND entity_code LIKE 'PAGE_SALON_%'
ORDER BY entity_code;

-- 3. Verify APP→PAGE relationships
SELECT
  app.entity_code AS app,
  page.entity_code AS page,
  cr.relationship_type,
  cr.relationship_data
FROM public.core_relationships cr
JOIN public.core_entities app ON app.id = cr.from_entity_id
JOIN public.core_entities page ON page.id = cr.to_entity_id
WHERE cr.organization_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND cr.relationship_type = 'HAS_PAGE'
  AND app.entity_code = 'SALON'
ORDER BY page.entity_code;
```

**TypeScript Integration:**

```typescript
// Frontend wrapper function
async function registerApp(appCode: string, pageRPC: string[], actorUserId: string) {
  const { data, error } = await supabase.rpc('hera_app_catalog_register_v1', {
    p_app_code: appCode,
    p_page_codes: pageCodes,
    p_actor_user: actorUserId
  })

  if (error) {
    throw new Error(`Failed to register app: ${error.message}`)
  }

  return {
    success: data.success,
    appId: data.app_id,
    appCode: data.app,
    pageCount: data.pages
  }
}

// Usage
const result = await registerApp(
  'SALON',
  ['SALON_DASHBOARD', 'SALON_APPOINTMENTS', 'SALON_POS'],
  user.id
)

console.log(`Registered ${result.appCode} with ${result.pageCount} pages`)
```

**Best Practices:**

1. **Namespace Page Codes:** Use `<APP>_<FEATURE>` pattern (e.g., `SALON_DASHBOARD`)
2. **Register Once:** Only platform admins should register apps
3. **Include All Pages:** Register all pages upfront for complete catalog
4. **Idempotent Safe:** Can re-run to ensure app is registered
5. **Audit Trail:** Actor user is stamped on all created entities

---

### `hera_app_catalog_update_pages_v1`

**Purpose:** Update catalog pages (add/remove/rename) with optional tenant propagation

**Status:** ✅ Deployed

**Signature:**
```sql
public.hera_app_catalog_update_pages_v1(
  p_app_code     text,
  p_actor_user   uuid,                      -- ACTOR MOVED TO 2ND PARAMETER
  p_add_pages    text[]  DEFAULT '{}',      -- Pages to add
  p_remove_pages text[]  DEFAULT '{}',      -- Pages to remove (archive)
  p_rename_map   jsonb   DEFAULT '{}'::jsonb,  -- {"old": "new"} mappings
  p_propagate    boolean DEFAULT true       -- Propagate to tenants?
) RETURNS jsonb
```

**Returns:**
```json
{
  "success": true,
  "app": "SALON",
  "added": 2,
  "removed": 1,
  "renamed": 1,
  "propagated": true,
  "tenants_affected": 15
}
```

**Rules:**
- Page codes must NOT include `PAGE_` prefix
- Cannot remove critical pages (`SALON_DASHBOARD`, `LOGIN`, `PROFILE`)
- Rename prevents conflicts (target must not exist)
- Propagation clones changes to all tenants with app installed
- All operations are idempotent

**Examples:**

```sql
-- 1. Add new pages to catalog (propagate to all tenants)
SELECT public.hera_app_catalog_update_pages_v1(
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,  -- Actor (2nd param)
  ARRAY['SALON_INVENTORY', 'SALON_REPORTS'],     -- Add these
  '{}',                                          -- Remove none
  '{}'::jsonb,                                   -- Rename none
  true                                           -- Propagate to tenants
);
-- Returns: {"success": true, "app": "SALON", "added": 2, "removed": 0, "renamed": 0, "propagated": true, "tenants_affected": 5}

-- 2. Remove deprecated pages (archive)
SELECT public.hera_app_catalog_update_pages_v1(
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,  -- Actor (2nd param)
  '{}',                                          -- Add none
  ARRAY['SALON_OLD_FEATURE'],                    -- Archive this
  '{}'::jsonb,
  true                                           -- Propagate removal
);
-- Returns: {"success": true, "app": "SALON", "added": 0, "removed": 1, "renamed": 0, "propagated": true, "tenants_affected": 5}

-- 3. Rename pages (analytics consistency)
SELECT public.hera_app_catalog_update_pages_v1(
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,  -- Actor (2nd param)
  '{}',
  '{}',
  '{"SALON_POS": "SALON_CHECKOUT", "SALON_CALENDAR": "SALON_SCHEDULER"}'::jsonb,
  true                                           -- Update all tenants
);
-- Returns: {"success": true, "app": "SALON", "added": 0, "removed": 0, "renamed": 2, "propagated": true, "tenants_affected": 10}

-- 4. Add beta features WITHOUT propagating (catalog only)
SELECT public.hera_app_catalog_update_pages_v1(
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,  -- Actor (2nd param)
  ARRAY['SALON_BETA_AI_INSIGHTS'],
  '{}',
  '{}'::jsonb,
  false                                          -- Don't propagate yet (beta)
);
-- Returns: {"success": true, "app": "SALON", "added": 1, "removed": 0, "renamed": 0, "propagated": false, "tenants_affected": 0}

-- 5. Combined operation: Add, remove, and rename in one call
SELECT public.hera_app_catalog_update_pages_v1(
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,  -- Actor (2nd param)
  ARRAY['SALON_ANALYTICS'],                      -- Add new
  ARRAY['SALON_LEGACY_REPORTS'],                 -- Remove old
  '{"SALON_SETTINGS": "SALON_PREFERENCES"}'::jsonb,  -- Rename existing
  true
);
```

**Error Scenarios:**

```sql
-- ❌ Invalid: PAGE_ prefix not allowed
SELECT public.hera_app_catalog_update_pages_v1(
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  ARRAY['PAGE_SALON_NEW'],  -- ❌ Don't include PAGE_
  '{}', '{}'::jsonb, true
);
-- ERROR: page_code should not include PAGE_ prefix: PAGE_SALON_NEW

-- ❌ Invalid: Cannot remove critical pages
SELECT public.hera_app_catalog_update_pages_v1(
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  '{}',
  ARRAY['SALON_DASHBOARD'],  -- ❌ Critical page
  '{}'::jsonb, true
);
-- ERROR: cannot_remove_critical_page: SALON_DASHBOARD

-- ❌ Invalid: Rename conflict (target exists)
SELECT public.hera_app_catalog_update_pages_v1(
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  '{}', '{}',
  '{"SALON_POS": "SALON_APPOINTMENTS"}'::jsonb,  -- ❌ TARGET already exists
  true
);
-- ERROR: rename_conflict: target already exists SALON_APPOINTMENTS

-- ⚠️ Warning: Removing non-existent page (continues with WARNING)
SELECT public.hera_app_catalog_update_pages_v1(
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  '{}',
  ARRAY['SALON_NONEXISTENT'],  -- ⚠️ Not in catalog
  '{}'::jsonb, true
);
-- WARNING: page_not_found_in_catalog: SALON_NONEXISTENT
-- Returns: {"success": true, "removed": 0, ...}
```

**Propagation Behavior:**

```sql
-- With p_propagate = true:
-- 1. Finds all tenants with USES_APP relationship to this app
-- 2. Clones new pages to each tenant's scope
-- 3. Archives removed pages in each tenant's scope
-- 4. Renames pages in each tenant's scope (keeps relationships intact)
-- 5. Returns count of tenant rows affected

-- Query to see affected tenants:
SELECT DISTINCT cr.organization_id, co.organization_name
FROM public.core_relationships cr
JOIN public.core_organizations co ON co.id = cr.organization_id
WHERE cr.to_entity_id = (
  SELECT id FROM public.core_entities
  WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid
    AND entity_type = 'APP'
    AND entity_code = 'SALON'
)
AND cr.relationship_type = 'USES_APP'
AND coalesce(cr.is_active, true);
```

**Verification:**

```sql
-- 1. Verify page added to catalog
SELECT entity_code, status, metadata
FROM public.core_entities
WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND entity_type = 'PAGE_PERMISSION'
  AND entity_code = 'PAGE_SALON_INVENTORY';

-- 2. Verify page propagated to tenant
SELECT organization_id, entity_code, status, metadata
FROM public.core_entities
WHERE entity_type = 'PAGE_PERMISSION'
  AND entity_code = 'PAGE_SALON_INVENTORY'
  AND organization_id <> '00000000-0000-0000-0000-000000000000'::uuid;

-- 3. Verify page archived (soft delete)
SELECT entity_code, status
FROM public.core_entities
WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND entity_type = 'PAGE_PERMISSION'
  AND entity_code = 'PAGE_SALON_OLD_FEATURE';
-- Should show: status = 'archived'

-- 4. Verify rename applied
SELECT entity_code
FROM public.core_entities
WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND entity_type = 'PAGE_PERMISSION'
  AND entity_code IN ('PAGE_SALON_POS', 'PAGE_SALON_CHECKOUT');
-- Should only show: PAGE_SALON_CHECKOUT
```

**TypeScript Integration:**

```typescript
interface UpdatePagesParams {
  appCode: string
  addPages?: string[]
  removePages?: string[]
  renameMap?: Record<string, string>
  propagate?: boolean
  actorUserId: string
}

async function updateAppPages(params: UpdatePagesParams) {
  const { data, error} = await supabase.rpc('hera_app_catalog_update_pages_v1', {
    p_app_code: params.appCode,
    p_actor_user: params.actorUserId,  // 2nd parameter
    p_add_pages: params.addPages || [],
    p_remove_pages: params.removePages || [],
    p_rename_map: params.renameMap || {},
    p_propagate: params.propagate ?? true
  })

  if (error) {
    throw new Error(`Failed to update pages: ${error.message}`)
  }

  return {
    success: data.success,
    app: data.app,
    stats: {
      added: data.added,
      removed: data.removed,
      renamed: data.renamed
    },
    propagation: {
      enabled: data.propagated,
      tenantsAffected: data.tenants_affected
    }
  }
}

// Usage examples:

// Add new pages
await updateAppPages({
  appCode: 'SALON',
  addPages: ['SALON_INVENTORY', 'SALON_REPORTS'],
  actorUserId: user.id
})

// Remove deprecated pages
await updateAppPages({
  appCode: 'SALON',
  removePages: ['SALON_OLD_FEATURE'],
  actorUserId: user.id
})

// Rename pages
await updateAppPages({
  appCode: 'SALON',
  renameMap: {
    'SALON_POS': 'SALON_CHECKOUT',
    'SALON_CALENDAR': 'SALON_SCHEDULER'
  },
  actorUserId: user.id
})

// Add beta feature without propagation
await updateAppPages({
  appCode: 'SALON',
  addPages: ['SALON_BETA_AI'],
  propagate: false,  // Catalog only
  actorUserId: user.id
})
```

**Best Practices:**

1. **Test Without Propagation First:** Use `p_propagate = false` to verify changes in catalog
2. **Customize Critical Pages List:** Update the protected pages array in function for your app
3. **Use Rename for Analytics:** Keeps page history intact (relationships preserved)
4. **Monitor Tenant Count:** Check `tenants_affected` to verify propagation scope
5. **Batch Operations:** Combine add/remove/rename in single call for efficiency
6. **Archive Don't Delete:** Function uses soft delete for safety

---

### `hera_app_install_for_org_v1`

**Purpose:** Install an application for a specific organization (clones pages from catalog)

**Status:** ✅ Deployed

**Signature:**
```sql
public.hera_app_install_for_org_v1(
  p_organization_id uuid,
  p_app_code        text,
  p_actor_user_id   uuid,
  p_role_grants     jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
```

**Returns:**
```json
{
  "success": true,
  "app": "SALON",
  "org_id": "org-uuid-here",
  "pages_installed": 5,
  "pages_total": 5
}
```

**What It Does:**
1. Clones all PAGE_PERMISSION templates from platform catalog to tenant scope
2. Creates USES_APP relationship (ORG → APP)
3. Optionally seeds default role→page grants
4. Validates actor membership in organization

**Rules:**
- Actor must be a member of the organization
- App must exist in platform catalog
- Idempotent: Re-running re-syncs pages (warns if already installed)
- Page codes cloned with same entity_code as catalog

**Examples:**

```sql
-- 1. Install SALON app with no default grants
SELECT public.hera_app_install_for_org_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,  -- Org ID
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,  -- Actor
  '{}'::jsonb                                     -- No role grants
);
-- Returns: {"success": true, "app": "SALON", "pages_installed": 5, "pages_total": 5}

-- 2. Install with role-based grants
SELECT public.hera_app_catalog_install_for_org_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  '{
    "ORG_EMPLOYEE": {
      "allow": ["SALON_DASHBOARD", "SALON_APPOINTMENTS"],
      "deny": ["SALON_POS", "SALON_SETTINGS"]
    },
    "ORG_MANAGER": {
      "allow": ["SALON_DASHBOARD", "SALON_APPOINTMENTS", "SALON_POS"],
      "deny": ["SALON_SETTINGS"]
    }
  }'::jsonb
);
```

**Verification:**

```sql
-- 1. Verify pages cloned to tenant
SELECT entity_code, status, metadata
FROM public.core_entities
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
  AND entity_type = 'PAGE_PERMISSION'
  AND (metadata->>'app') = 'SALON'
ORDER BY entity_code;

-- 2. Verify USES_APP relationship
SELECT r.relationship_type, org.entity_code AS org, app.entity_code AS app
FROM public.core_relationships r
JOIN public.core_entities org ON org.id = r.from_entity_id
JOIN public.core_entities app ON app.id = r.to_entity_id
WHERE r.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
  AND r.relationship_type = 'USES_APP';

-- 3. Verify role grants (if provided)
SELECT
  role.entity_code AS role,
  page.entity_code AS page,
  r.relationship_data->>'effect' AS effect
FROM public.core_relationships r
JOIN public.core_entities role ON role.id = r.from_entity_id
JOIN public.core_entities page ON page.id = r.to_entity_id
WHERE r.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
  AND r.relationship_type = 'HAS_PERMISSION'
  AND role.entity_type = 'ROLE'
  AND page.entity_type = 'PAGE_PERMISSION'
ORDER BY role.entity_code, page.entity_code;
```

**TypeScript Integration:**

```typescript
interface InstallAppParams {
  organizationId: string
  appCode: string
  actorUserId: string
  roleGrants?: {
    [roleCode: string]: {
      allow?: string[]
      deny?: string[]
    }
  }
}

async function installApp(params: InstallAppParams) {
  const { data, error } = await supabase.rpc('hera_app_install_for_org_v1', {
    p_organization_id: params.organizationId,
    p_app_code: params.appCode,
    p_actor_user_id: params.actorUserId,
    p_role_grants: params.roleGrants || {}
  })

  if (error) {
    throw new Error(`Failed to install app: ${error.message}`)
  }

  return {
    success: data.success,
    app: data.app,
    orgId: data.org_id,
    pagesInstalled: data.pages_installed,
    pagesTotal: data.pages_total
  }
}

// Usage
const result = await installApp({
  organizationId: organization.id,
  appCode: 'SALON',
  actorUserId: user.id,
  roleGrants: {
    'ORG_EMPLOYEE': {
      allow: ['SALON_DASHBOARD', 'SALON_APPOINTMENTS'],
      deny: ['SALON_POS']
    }
  }
})

console.log(`Installed ${result.app} with ${result.pagesInstalled} pages`)
```

**Best Practices:**

1. **Install During Org Creation:** Call this when creating a new organization
2. **Seed Default Grants:** Use role_grants to set up baseline permissions
3. **Re-run to Sync:** Safe to re-run if catalog pages updated
4. **Check pages_installed === pages_total:** Ensures all pages cloned
5. **Actor Must Be Member:** Ensure actor has MEMBER_OF relationship first

---

### `hera_app_uninstall_for_org_v1`

**Purpose:** Uninstall an application from an organization (archives pages, disables grants)

**Status:** ✅ Deployed

**Signature:**
```sql
public.hera_app_uninstall_for_org_v1(
  p_organization_id uuid,
  p_app_code        text,
  p_actor_user_id   uuid,
  p_archive_pages   boolean DEFAULT true,
  p_disable_links   boolean DEFAULT true
) RETURNS jsonb
```

**Returns:**
```json
{
  "success": true,
  "app": "SALON",
  "org_id": "org-uuid-here",
  "pages_archived": 5,
  "links_disabled": 12,
  "uses_app_removed": 1
}
```

**What It Does:**
1. Archives tenant PAGE_PERMISSION entities (soft delete)
2. Disables HAS_PERMISSION relationships (preserves audit trail)
3. Removes USES_APP relationship
4. Only touches tenant data (platform catalog untouched)

**Rules:**
- Actor must be ORG_OWNER or ORG_ADMIN
- All operations are audit-friendly (soft deletes, not hard deletes)
- Disabled links include 'disabled_reason' in metadata
- Completely reversible (can re-install)

**Examples:**

```sql
-- 1. Full uninstall (archive pages + disable links)
SELECT public.hera_app_uninstall_for_org_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  true,   -- Archive pages
  true    -- Disable permission links
);
-- Returns: {"success": true, "app": "SALON", "pages_archived": 5, "links_disabled": 12, "uses_app_removed": 1}

-- 2. Remove USES_APP only (keep pages for reference)
SELECT public.hera_app_uninstall_for_org_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'SALON',
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  false,  -- Keep pages active
  false   -- Keep permission links active
);
```

**Verification:**

```sql
-- 1. Verify pages archived
SELECT entity_code, status
FROM public.core_entities
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
  AND entity_type = 'PAGE_PERMISSION'
  AND (metadata->>'app') = 'SALON';
-- Should show: status = 'archived'

-- 2. Verify permission links disabled
SELECT
  r.is_active,
  r.relationship_data->>'disabled_reason' AS reason
FROM public.core_relationships r
JOIN public.core_entities page ON page.id = r.to_entity_id
WHERE r.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
  AND r.relationship_type = 'HAS_PERMISSION'
  AND (page.metadata->>'app') = 'SALON';
-- Should show: is_active = false, reason = 'app_uninstalled'

-- 3. Verify USES_APP removed
SELECT count(*)
FROM public.core_relationships
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
  AND relationship_type = 'USES_APP';
-- Should return: 0
```

**TypeScript Integration:**

```typescript
interface UninstallAppParams {
  organizationId: string
  appCode: string
  actorUserId: string
  archivePages?: boolean
  disableLinks?: boolean
}

async function uninstallApp(params: UninstallAppParams) {
  const { data, error } = await supabase.rpc('hera_app_uninstall_for_org_v1', {
    p_organization_id: params.organizationId,
    p_app_code: params.appCode,
    p_actor_user_id: params.actorUserId,
    p_archive_pages: params.archivePages ?? true,
    p_disable_links: params.disableLinks ?? true
  })

  if (error) {
    throw new Error(`Failed to uninstall app: ${error.message}`)
  }

  return {
    success: data.success,
    app: data.app,
    orgId: data.org_id,
    pagesArchived: data.pages_archived,
    linksDisabled: data.links_disabled,
    usesAppRemoved: data.uses_app_removed
  }
}

// Usage
const result = await uninstallApp({
  organizationId: organization.id,
  appCode: 'SALON',
  actorUserId: user.id
})

console.log(`Uninstalled ${result.app}: ${result.pagesArchived} pages archived, ${result.linksDisabled} links disabled`)
```

**Best Practices:**

1. **Confirm Before Uninstall:** Show user impact (pages/links affected)
2. **Default to Full Cleanup:** Use default params (archive + disable)
3. **Audit Trail Preserved:** All changes tracked with actor stamps
4. **Reversible:** Can re-install to restore functionality
5. **Admin Only:** Automatically enforces ORG_OWNER/ORG_ADMIN check

---

## Organization Management

**Status:** ✅ Partially Deployed

### `hera_organizations_crud_v1`

**Purpose:** Full CRUD operations for organizations

**Status:** ✅ Deployed (Previous version)

**Note:** Will be updated to integrate with app catalog system

**Documentation:** See existing documentation

---

## User Onboarding

**Status:** ✅ Partially Deployed

### `hera_onboard_user_v1`

**Purpose:** Onboard a user to an organization with role and page permissions

**Status:** ✅ Deployed (Previous version)

**Note:** Will be updated to integrate with page permissions system

**Documentation:** See existing documentation

---

## Permission Management

### `hera_permissions_ensure_pages_v1`

**Purpose:** Idempotently ensure PAGE_PERMISSION entities exist for a tenant

**Status:** ✅ Deployed

**Signature:**
```sql
public.hera_permissions_ensure_pages_v1(
  p_organization_id uuid,
  p_actor_user_id   uuid,
  p_page_codes      text[]
) RETURNS jsonb
```

**Returns:**
```json
{
  "success": true,
  "org_id": "org-uuid-here",
  "checked": 5,
  "created": 2
}
```

**What It Does:**
- Checks if PAGE_PERMISSION entities exist for given page codes
- Creates missing pages with proper smart codes
- Idempotent: Safe to call multiple times
- Used internally by `hera_app_install_for_org_v1` and `hera_role_set_pages_v1`

**Rules:**
- Page codes must NOT include `PAGE_` prefix (function adds it)
- Creates pages with smart code: `HERA.UNIVERSAL.PERMISSION.PAGE.TENANT.<CODE>.v1`
- Metadata includes `{"kind": "page"}`
- All pages created with status `'active'`

**Examples:**

```sql
-- 1. Ensure standard pages exist
SELECT public.hera_permissions_ensure_pages_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  ARRAY['SALON_DASHBOARD', 'SALON_APPOINTMENTS', 'SALON_POS']
);
-- Returns: {"success": true, "checked": 3, "created": 3} (first time)
-- Returns: {"success": true, "checked": 3, "created": 0} (subsequent calls)

-- 2. Ensure custom pages exist before granting
SELECT public.hera_permissions_ensure_pages_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  ARRAY['SALON_CUSTOM_REPORTS', 'SALON_CUSTOM_ANALYTICS']
);
```

**Verification:**

```sql
-- Verify pages created
SELECT entity_code, smart_code, status, metadata
FROM public.core_entities
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
  AND entity_type = 'PAGE_PERMISSION'
  AND entity_code IN ('PAGE_SALON_DASHBOARD', 'PAGE_SALON_APPOINTMENTS', 'PAGE_SALON_POS')
ORDER BY entity_code;
```

**TypeScript Integration:**

```typescript
async function ensurePages(
  organizationId: string,
  actorUserId: string,
  pageCodes: string[]
) {
  const { data, error } = await supabase.rpc('hera_permissions_ensure_pages_v1', {
    p_organization_id: organizationId,
    p_actor_user_id: actorUserId,
    p_page_codes: pageCodes
  })

  if (error) {
    throw new Error(`Failed to ensure pages: ${error.message}`)
  }

  return {
    success: data.success,
    orgId: data.org_id,
    checked: data.checked,
    created: data.created
  }
}

// Usage
const result = await ensurePages(
  organization.id,
  user.id,
  ['SALON_DASHBOARD', 'SALON_APPOINTMENTS', 'SALON_POS']
)

console.log(`Checked ${result.checked} pages, created ${result.created} new pages`)
```

**Best Practices:**

1. **Call Before Granting:** Always ensure pages exist before calling `hera_role_set_pages_v1`
2. **Idempotent Safe:** Can call repeatedly without issues
3. **Batch Create:** Pass all page codes at once for efficiency
4. **No PAGE_ Prefix:** Function handles prefixing automatically
5. **Check created Count:** Verify expected pages were created

---

### `hera_role_set_pages_v1`

**Purpose:** Grant or deny page permissions to a role (RBAC-protected)

**Status:** ✅ Deployed

**Signature:**
```sql
public.hera_role_set_pages_v1(
  p_organization_id uuid,
  p_actor_user_id   uuid,
  p_role_code       text,
  p_page_codes      text[],
  p_effect          text DEFAULT 'allow'
) RETURNS jsonb
```

**Returns:**
```json
{
  "success": true,
  "updated": 3,
  "role": "ORG_EMPLOYEE",
  "effect": "allow",
  "org_id": "org-uuid-here"
}
```

**What It Does:**
1. Validates actor is ORG_OWNER or ORG_ADMIN (RBAC enforcement)
2. Creates ROLE entity if it doesn't exist
3. Creates/updates HAS_PERMISSION relationships (ROLE → PAGE)
4. Sets effect ('allow' or 'deny') in relationship_data

**Rules:**
- **RBAC:** Only ORG_OWNER or ORG_ADMIN can call this function
- Effect must be 'allow' or 'deny'
- Page codes must NOT include `PAGE_` prefix
- Pages must exist (call `hera_permissions_ensure_pages_v1` first)
- Automatically creates ROLE entity if missing

**Examples:**

```sql
-- 1. Grant pages to employee role
SELECT public.hera_role_set_pages_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,  -- Must be owner/admin
  'ORG_EMPLOYEE',
  ARRAY['SALON_DASHBOARD', 'SALON_APPOINTMENTS'],
  'allow'
);
-- Returns: {"success": true, "updated": 2, "role": "ORG_EMPLOYEE", "effect": "allow"}

-- 2. Deny sensitive pages to employee role
SELECT public.hera_role_set_pages_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  'ORG_EMPLOYEE',
  ARRAY['SALON_POS', 'SALON_SETTINGS'],
  'deny'
);

-- 3. Grant all pages to manager role
SELECT public.hera_role_set_pages_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  'ORG_MANAGER',
  ARRAY['SALON_DASHBOARD', 'SALON_APPOINTMENTS', 'SALON_POS', 'SALON_SETTINGS'],
  'allow'
);
```

**Error Scenarios:**

```sql
-- ❌ Forbidden: Non-admin trying to set permissions
SELECT public.hera_role_set_pages_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'employee-user-uuid'::uuid,  -- ❌ Not owner/admin
  'ORG_EMPLOYEE',
  ARRAY['SALON_DASHBOARD'],
  'allow'
);
-- ERROR: forbidden: only owner/admin can set role page permissions

-- ❌ Invalid effect
SELECT public.hera_role_set_pages_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  'ORG_EMPLOYEE',
  ARRAY['SALON_DASHBOARD'],
  'maybe'  -- ❌ Must be 'allow' or 'deny'
);
-- ERROR: effect must be allow or deny

-- ❌ Page doesn't exist
SELECT public.hera_role_set_pages_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  'ORG_EMPLOYEE',
  ARRAY['SALON_NONEXISTENT'],
  'allow'
);
-- ERROR: permission PAGE_SALON_NONEXISTENT not found; call hera_permissions_ensure_pages_v1 first
```

**Verification:**

```sql
-- View role permissions
SELECT
  role.entity_code AS role,
  page.entity_code AS page,
  r.relationship_data->>'effect' AS effect,
  r.is_active
FROM public.core_relationships r
JOIN public.core_entities role ON role.id = r.from_entity_id
JOIN public.core_entities page ON page.id = r.to_entity_id
WHERE r.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
  AND r.relationship_type = 'HAS_PERMISSION'
  AND role.entity_code = 'ORG_EMPLOYEE'
ORDER BY page.entity_code;
```

**TypeScript Integration:**

```typescript
interface SetRolePermissionsParams {
  organizationId: string
  actorUserId: string
  roleCode: string
  pageCodes: string[]
  effect: 'allow' | 'deny'
}

async function setRolePermissions(params: SetRolePermissionsParams) {
  const { data, error } = await supabase.rpc('hera_role_set_pages_v1', {
    p_organization_id: params.organizationId,
    p_actor_user_id: params.actorUserId,
    p_role_code: params.roleCode,
    p_page_codes: params.pageCodes,
    p_effect: params.effect
  })

  if (error) {
    throw new Error(`Failed to set role permissions: ${error.message}`)
  }

  return {
    success: data.success,
    updated: data.updated,
    role: data.role,
    effect: data.effect,
    orgId: data.org_id
  }
}

// Usage
const result = await setRolePermissions({
  organizationId: organization.id,
  actorUserId: user.id,
  roleCode: 'ORG_EMPLOYEE',
  pageCodes: ['SALON_DASHBOARD', 'SALON_APPOINTMENTS'],
  effect: 'allow'
})

console.log(`Set ${result.effect} for ${result.updated} pages on role ${result.role}`)
```

**Best Practices:**

1. **Ensure Pages First:** Call `hera_permissions_ensure_pages_v1` before setting permissions
2. **RBAC Aware:** Only call with owner/admin actor
3. **Use Deny Sparingly:** Prefer allow lists, use deny for exceptions
4. **Batch Operations:** Set multiple pages in one call for efficiency
5. **Audit Changes:** Track who changed permissions and when (automatic via actor stamps)

---

### `hera_user_override_page_v1`

**Purpose:** Override page access for specific user

**Status:** 📋 Not Yet Implemented

**Note:** This function is planned for future implementation to allow per-user permission overrides.

---

## Login & Session

**Status:** 🚧 Coming Soon

### `hera_user_effective_pages_v1`

**Purpose:** Calculate user's effective allowed pages

**Status:** 📋 Pending Deployment

---

### `hera_login_context_v1`

**Purpose:** Get complete login context (org, role, pages)

**Status:** 📋 Pending Deployment

---

## Custom Pages

### `hera_org_custom_page_upsert_v1`

**Purpose:** Create or update custom tenant-specific pages (not in catalog)

**Status:** ✅ Deployed

**Signature:**
```sql
public.hera_org_custom_page_upsert_v1(
  p_organization_id uuid,
  p_actor_user_id   uuid,
  p_app_code        text,
  p_page_code       text,
  p_metadata        jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
```

**Returns:**
```json
{
  "success": true,
  "org_id": "org-uuid-here",
  "entity_code": "PAGE_SALON_CUSTOM_WAITLIST",
  "page_entity_id": "uuid-here",
  "smart_code": "HERA.UNIVERSAL.PERMISSION.PAGE.TENANT.CUSTOM.v1"
}
```

**What It Does:**
- Creates custom PAGE_PERMISSION entity for tenant-specific features
- Uses naming convention: `PAGE_<APP>_CUSTOM_<FEATURE>`
- Marks page with `metadata.custom = true`
- Idempotent: Updates existing custom pages
- RBAC: Only ORG_OWNER or ORG_ADMIN can create custom pages

**Rules:**
- Page code must NOT include `PAGE_` prefix
- Page code must NOT include app prefix (e.g., use 'WAITLIST' not 'SALON_WAITLIST')
- Page code must be UPPERCASE alphanumeric with underscores only
- Smart code is constant: `HERA.UNIVERSAL.PERMISSION.PAGE.TENANT.CUSTOM.v1`
- Actor must be ORG_OWNER or ORG_ADMIN

**Examples:**

```sql
-- 1. Create custom waitlist page
SELECT public.hera_org_custom_page_upsert_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  'SALON',
  'WAITLIST',
  '{"description": "Custom waitlist management feature"}'::jsonb
);
-- Returns: {"success": true, "entity_code": "PAGE_SALON_CUSTOM_WAITLIST", "page_entity_id": "..."}

-- 2. Create custom analytics page
SELECT public.hera_org_custom_page_upsert_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  'SALON',
  'ANALYTICS_PRO',
  '{"description": "Advanced analytics dashboard", "tier": "premium"}'::jsonb
);
-- Returns: {"success": true, "entity_code": "PAGE_SALON_CUSTOM_ANALYTICS_PRO", ...}

-- 3. Update existing custom page
SELECT public.hera_org_custom_page_upsert_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  'SALON',
  'WAITLIST',
  '{"description": "Updated waitlist feature", "version": "2.0"}'::jsonb
);
-- Upserts: Updates metadata if page exists
```

**Error Scenarios:**

```sql
-- ❌ Forbidden: Non-admin trying to create custom page
SELECT public.hera_org_custom_page_upsert_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'employee-user-uuid'::uuid,  -- ❌ Not owner/admin
  'SALON',
  'WAITLIST',
  '{}'::jsonb
);
-- ERROR: forbidden: only owner/admin may manage custom pages (current role: ORG_EMPLOYEE)

-- ❌ Invalid: PAGE_ prefix not allowed
SELECT public.hera_org_custom_page_upsert_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  'SALON',
  'PAGE_WAITLIST',  -- ❌ Don't include PAGE_ prefix
  '{}'::jsonb
);
-- ERROR: page_code should not include PAGE_ prefix

-- ❌ Invalid: App prefix not allowed
SELECT public.hera_org_custom_page_upsert_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  'SALON',
  'SALON_WAITLIST',  -- ❌ Don't include app prefix
  '{}'::jsonb
);
-- ERROR: page_code should not include app prefix (SALON already prepended)

-- ❌ Invalid: Lowercase or special characters
SELECT public.hera_org_custom_page_upsert_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  'SALON',
  'waitlist-2.0',  -- ❌ Must be UPPERCASE with underscores only
  '{}'::jsonb
);
-- ERROR: page_code must be UPPERCASE alphanumeric with underscores only
```

**Verification:**

```sql
-- View custom pages for organization
SELECT
  entity_code,
  smart_code,
  metadata->>'app' AS app,
  metadata->>'custom' AS is_custom,
  metadata->>'description' AS description
FROM public.core_entities
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
  AND entity_type = 'PAGE_PERMISSION'
  AND (metadata->>'custom')::boolean = true
ORDER BY entity_code;
```

**TypeScript Integration:**

```typescript
interface CreateCustomPageParams {
  organizationId: string
  actorUserId: string
  appCode: string
  pageCode: string
  metadata?: Record<string, any>
}

async function createCustomPage(params: CreateCustomPageParams) {
  const { data, error } = await supabase.rpc('hera_org_custom_page_upsert_v1', {
    p_organization_id: params.organizationId,
    p_actor_user_id: params.actorUserId,
    p_app_code: params.appCode,
    p_page_code: params.pageCode,
    p_metadata: params.metadata || {}
  })

  if (error) {
    throw new Error(`Failed to create custom page: ${error.message}`)
  }

  return {
    success: data.success,
    orgId: data.org_id,
    entityCode: data.entity_code,
    pageEntityId: data.page_entity_id,
    smartCode: data.smart_code
  }
}

// Usage
const result = await createCustomPage({
  organizationId: organization.id,
  actorUserId: user.id,
  appCode: 'SALON',
  pageCode: 'WAITLIST',
  metadata: {
    description: 'Custom waitlist management',
    icon: 'list',
    order: 10
  }
})

console.log(`Created custom page: ${result.entityCode}`)

// Then grant to roles
await setRolePermissions({
  organizationId: organization.id,
  actorUserId: user.id,
  roleCode: 'ORG_MANAGER',
  pageCodes: ['SALON_CUSTOM_WAITLIST'],  // Note: Must include full code
  effect: 'allow'
})
```

**Best Practices:**

1. **Use CUSTOM Naming:** Always use format `PAGE_<APP>_CUSTOM_<FEATURE>`
2. **Document in Metadata:** Include description, purpose, tier, etc. in metadata
3. **Admin Only:** Automatically enforced - only owners/admins can create
4. **Grant After Creating:** Use `hera_role_set_pages_v1` to grant access after creation
5. **Idempotent Updates:** Safe to call multiple times (upserts metadata)
6. **Track Customizations:** Custom flag helps differentiate from catalog pages

**Common Use Cases:**

```typescript
// 1. Premium feature page
await createCustomPage({
  organizationId: org.id,
  actorUserId: user.id,
  appCode: 'SALON',
  pageCode: 'PREMIUM_ANALYTICS',
  metadata: {
    description: 'Advanced analytics dashboard',
    tier: 'premium',
    requiredPlan: 'enterprise'
  }
})

// 2. Beta feature page
await createCustomPage({
  organizationId: org.id,
  actorUserId: user.id,
  appCode: 'SALON',
  pageCode: 'AI_INSIGHTS_BETA',
  metadata: {
    description: 'AI-powered insights (beta)',
    status: 'beta',
    rollout: '2025-Q1'
  }
})

// 3. Organization-specific workflow page
await createCustomPage({
  organizationId: org.id,
  actorUserId: user.id,
  appCode: 'SALON',
  pageCode: 'CUSTOM_WORKFLOW',
  metadata: {
    description: 'Custom booking workflow for VIP clients',
    workflow_id: 'vip-booking-v2'
  }
})
```

---

### `hera_org_page_archive_v1`

**Purpose:** Archive/soft-delete pages

**Status:** 📋 Not Yet Implemented

**Note:** This function is planned for future implementation. Currently, use uninstall or direct updates to archive pages.

---

## Required Indexes

### Performance Optimization Indexes

```sql
-- For _hera_resolve_org_role and membership queries
CREATE INDEX IF NOT EXISTS idx_relationships_org_type_from
  ON core_relationships(organization_id, relationship_type, from_entity_id)
  WHERE is_active = true;

-- For entity lookups by type and code
CREATE INDEX IF NOT EXISTS idx_entities_org_type_code
  ON core_entities(organization_id, entity_type, entity_code)
  WHERE is_active = true;

-- For relationship target lookups
CREATE INDEX IF NOT EXISTS idx_relationships_org_type_to
  ON core_relationships(organization_id, relationship_type, to_entity_id)
  WHERE is_active = true;

-- For tenant propagation in hera_app_catalog_update_pages_v1 (NEW)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_uses_app
  ON core_relationships(to_entity_id, relationship_type, organization_id)
  WHERE relationship_type = 'USES_APP' AND is_active = true;
```

**Verification:**

```sql
-- Check if indexes exist
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname IN (
  'idx_relationships_org_type_from',
  'idx_entities_org_type_code',
  'idx_relationships_org_type_to',
  'idx_relationships_uses_app'
)
ORDER BY tablename, indexname;
```

---

## Testing Utilities

### Verify RPC Deployment

```sql
-- List all HERA RPCs
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type,
  prosrc as source_code
FROM pg_proc
WHERE proname LIKE '%hera%'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;
```

### Test Smart Code Builder

```sql
-- Run comprehensive tests
DO $$
DECLARE
  v_result text;
BEGIN
  -- Test 1: Valid 6-segment code
  v_result := public._hera_sc_build(
    ARRAY['HERA', 'SALON', 'ENTITY', 'PRODUCT', 'ITEM'],
    1
  );
  ASSERT v_result = 'HERA.SALON.ENTITY.PRODUCT.ITEM.v1', 'Test 1 failed';
  RAISE NOTICE 'Test 1 passed: %', v_result;

  -- Test 2: Valid 7-segment code
  v_result := public._hera_sc_build(
    ARRAY['HERA', 'UNIVERSAL', 'PERMISSION', 'PAGE', 'TENANT', 'CLONE'],
    2
  );
  ASSERT v_result = 'HERA.UNIVERSAL.PERMISSION.PAGE.TENANT.CLONE.v2', 'Test 2 failed';
  RAISE NOTICE 'Test 2 passed: %', v_result;

  RAISE NOTICE 'All smart code tests passed!';
END $$;
```

### Test Role Resolution

```sql
-- Test role resolution for known users
DO $$
DECLARE
  v_role text;
BEGIN
  -- Test owner
  v_role := public._hera_resolve_org_role(
    '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a',
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  );
  ASSERT v_role = 'owner', 'Owner test failed';
  RAISE NOTICE 'Owner test passed: %', v_role;

  -- Test non-member
  v_role := public._hera_resolve_org_role(
    '00000000-0000-0000-0000-000000000000',
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  );
  ASSERT v_role IS NULL, 'Non-member test failed';
  RAISE NOTICE 'Non-member test passed (NULL)';

  RAISE NOTICE 'All role resolution tests passed!';
END $$;
```

---

## Troubleshooting

### Common Errors

#### Error: "function does not exist"

**Cause:** RPC not deployed or wrong schema

**Solution:**
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = '_hera_sc_build';

-- Deploy the function
-- Copy SQL from deployment file and execute
```

#### Error: "permission denied for function"

**Cause:** Missing GRANT permissions

**Solution:**
```sql
-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public._hera_sc_build(text[], int) TO authenticated;
GRANT EXECUTE ON FUNCTION public._hera_resolve_org_role(uuid, uuid) TO authenticated;
```

#### Error: "invalid segment"

**Cause:** Segment contains lowercase or special characters

**Solution:**
```sql
-- ❌ Wrong
SELECT public._hera_sc_build(ARRAY['HERA', 'salon', 'ENTITY', 'PRODUCT', 'ITEM'], 1);

-- ✅ Correct
SELECT public._hera_sc_build(ARRAY['HERA', 'SALON', 'ENTITY', 'PRODUCT', 'ITEM'], 1);
```

#### Error: "need at least 6 segments"

**Cause:** Array has fewer than 6 segments

**Solution:**
```sql
-- ❌ Wrong (only 3 segments)
SELECT public._hera_sc_build(ARRAY['HERA', 'SALON', 'ENTITY'], 1);

-- ✅ Correct (6 segments)
SELECT public._hera_sc_build(ARRAY['HERA', 'SALON', 'ENTITY', 'PRODUCT', 'ITEM'], 1);
```

---

## Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-23 | 1.0 | Initial version with utility functions | HERA Team |
| 2025-10-23 | 1.1 | Added app catalog functions (register & update) | HERA Team |
| 2025-10-23 | 1.2 | Added app lifecycle (install, uninstall) | HERA Team |
| 2025-10-23 | 1.3 | Added permission management (ensure pages, role grants) | HERA Team |
| 2025-10-23 | 1.4 | Added custom page management | HERA Team |
| TBD | 2.0 | Add login context & effective pages calculation | HERA Team |

---

## Next Steps

1. **Deploy Next RPC:** `hera_app_catalog_register_v1`
2. **Test Each Function:** Run verification queries
3. **Update This Document:** Add usage examples for new RPCs
4. **Create Frontend Wrappers:** TypeScript helper functions

---

## Support & Feedback

**Questions?** Contact the HERA development team
**Issues?** Create a ticket in the project tracker
**Improvements?** Submit a PR to update this documentation

**Status:** ✅ Active Document - Updated with each RPC deployment
**Last Updated:** 2025-10-23
**Maintained By:** HERA Architecture Team
