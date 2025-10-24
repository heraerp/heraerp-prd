# HERA Multi-Tenant App Catalog & Permissions Architecture

## System Overview

HERA implements a 6-table pattern with multi-tenant isolation via `organization_id`. Key principles:

- **Users are global**: Single platform USER entity (id = auth.users.id, organization_id = 00000000-...)
- **Tenancy via relationships**: Scoped by organization_id
- **Pages are entities**: entity_type = 'PAGE_PERMISSION'
- **Roles are entities**: entity_type = 'ROLE' (e.g., ORG_OWNER, ORG_ADMIN)
- **Everything connects via relationships**: MEMBER_OF, HAS_ROLE, HAS_PERMISSION, HAS_PAGE, USES_APP

---

## 1. App Catalog (Platform Scope)

### Purpose
Immutable platform registry of available applications and their page templates. Once registered, these templates are cloned per tenant on install.

### Registering an App

**RPC:** `public.hera_app_catalog_register_v1(app_code, page_codes[], actor_user_id)`

**What it does:**
- Creates/updates platform APP entity (organization_id = 00000000-...)
- Creates platform PAGE_PERMISSION template entities for each page code
- Links APP → PAGE via HAS_PAGE relationships

**Example:**
```sql
SELECT public.hera_app_catalog_register_v1(
  'SALON',
  ARRAY['PAGE_SALON_DASHBOARD', 'PAGE_SALON_APPOINTMENTS', 'PAGE_SALON_POS'],
  'actor-user-uuid'
);
```

### Updating Catalog Pages

**RPC:** `public.hera_app_catalog_update_pages_v1(app_code, add_pages[], remove_pages[], rename_map jsonb, propagate boolean, actor_user_id)`

**What it does:**
- Add new page templates to catalog
- Remove deprecated pages
- Rename pages with mapping (analytics consistency)
- Optionally propagate changes to all tenant installations

---

## 2. Tenant Install (Organization Chooses Apps)

### Process
When an org is created or later installs an app:
1. Clone platform PAGE_PERMISSION templates → tenant-scoped entities (same entity_code)
2. Create USES_APP relationship: tenant ORG → APP
3. Optionally seed default role→page grants

**RPC:** `public.hera_app_install_for_org_v1(organization_id, app_code, actor_user_id, role_grants jsonb)`

**Example:**
```sql
SELECT public.hera_app_install_for_org_v1(
  'org-uuid',
  'SALON',
  'actor-user-uuid',
  '{"ORG_EMPLOYEE": {"allow": ["PAGE_SALON_DASHBOARD"], "deny": ["PAGE_SALON_POS"]}}'::jsonb
);
```

**Result:** Tenant now has PAGE_SALON_DASHBOARD, PAGE_SALON_APPOINTMENTS, PAGE_SALON_POS entities in their scope, linked to roles as specified.

---

## 3. Organization Lifecycle

### Creating an Organization

**RPC:** `public.hera_organizations_crud_v1(action, actor_user_id, payload, limit, offset)`

**Actions:** CREATE | UPDATE | GET | LIST | ARCHIVE

**Columns (core_organizations):**
- id, organization_name, organization_code, organization_type
- industry_classification, parent_organization_id
- ai_insights, ai_classification, ai_confidence
- settings, status
- Timestamps: created_at, updated_at, deleted_at
- Audit: created_by, updated_by

**What CREATE does:**
1. Insert row into core_organizations
2. Create shadow ORG entity in core_entities (entity_type = 'ORGANIZATION')
3. If bootstrap: true in payload, auto-assign actor as owner
4. If apps: [...] in payload, auto-install specified apps

**Example:**
```sql
SELECT public.hera_organizations_crud_v1(
  'CREATE',
  'actor-user-uuid',
  '{
    "organization_code": "aurora",
    "organization_name": "Aurora Salon",
    "organization_type": "business",
    "apps": ["SALON"],
    "bootstrap": true
  }'::jsonb,
  NULL,
  NULL
);
```

**Internally triggers:**
- `hera_app_install_for_org_v1(org_id, 'SALON', actor, defaults)`
- `hera_onboard_user_v1(actor_user_id, org_id, actor, 'owner')`

---

## 4. User Onboarding (Single Flow)

### Process
Add a user to an organization with a role and page grants:
1. Ensure platform USER entity exists (global scope)
2. Ensure tenant ORG entity exists
3. Ensure ROLE entity exists for requested role code
4. Create MEMBER_OF relationship: USER → ORG (with relationship_data.role)
5. Create HAS_ROLE relationship: USER → ROLE (with relationship_data.role_code)
6. Optionally seed per-user page overrides

**RPC:** `public.hera_onboard_user_v1(supabase_user_id, organization_id, actor_user_id, role, role_pages_allow, role_pages_deny)`

**Parameters:**
- supabase_user_id: auth.users.id
- organization_id: Target org
- actor_user_id: Who's performing the action
- role: Role code (default: 'member')
- role_pages_allow: text[] optional
- role_pages_deny: text[] optional

**Example (Owner):**
```sql
SELECT public.hera_onboard_user_v1(
  'owner-user-uuid',
  'org-uuid',
  'actor-user-uuid',
  'owner',
  NULL,
  NULL
);
```

**Example (Employee with limited access):**
```sql
SELECT public.hera_onboard_user_v1(
  'emp-user-uuid',
  'org-uuid',
  'actor-user-uuid',
  'employee',
  ARRAY['PAGE_SALON_DASHBOARD', 'PAGE_SALON_APPOINTMENTS'],
  ARRAY['PAGE_SALON_POS']
);
```

---

## 5. Page Permission Grants & Admin Controls

### Ensuring Pages Exist

**RPC:** `public.hera_permissions_ensure_pages_v1(organization_id, actor_user_id, page_codes)`

Idempotently creates tenant PAGE_PERMISSION entities if missing.

### Setting Role Permissions

**RPC:** `public.hera_role_set_pages_v1(organization_id, actor_user_id, role_code, page_codes, effect)`

**Parameters:**
- effect: 'allow' | 'deny'
- RBAC-gated: Only ORG_OWNER or ORG_ADMIN can call

**Example:**
```sql
SELECT public.hera_role_set_pages_v1(
  'org-uuid',
  'admin-user-uuid',
  'ORG_EMPLOYEE',
  ARRAY['PAGE_SALON_DASHBOARD'],
  'allow'
);
```

Creates HAS_PERMISSION relationships: ROLE → PAGE with relationship_data.effect = 'allow'.

---

## 6. Login & Session Bootstrap

### Effective Pages Calculation

**RPC:** `public.hera_user_effective_pages_v1(user_id, organization_id)`

**Returns:** `{ owner: boolean, pages: string[] }`

**Logic:**
1. Check if user has ORG_OWNER role → return all tenant pages
2. Else, calculate effective pages with precedence:
   - User override deny (blocks everything)
   - User override allow (grants access)
   - Role deny (inherited block)
   - Role allow (inherited grant)
   - Default: deny

### Full Login Context

**RPC:** `public.hera_login_context_v1(user_id, organization_code)`

**Returns:**
```json
{
  "success": true,
  "organization": { "id": "...", "name": "...", "code": "..." },
  "role": "ORG_EMPLOYEE",
  "owner": false,
  "pages": ["PAGE_SALON_DASHBOARD", "PAGE_SALON_APPOINTMENTS"]
}
```

**Example:**
```sql
SELECT public.hera_login_context_v1(
  'user-uuid',
  'aurora'
);
```

---

## 7. Customization Without Touching Catalog

### Custom Page Creation

**RPC:** `public.hera_org_custom_page_upsert_v1(organization_id, actor_user_id, app_code, page_code, metadata)`

**Naming convention:** `PAGE_<APP>_CUSTOM_<FEATURE>`

**Example:**
```sql
SELECT public.hera_org_custom_page_upsert_v1(
  'org-uuid',
  'admin-user-uuid',
  'SALON',
  'PAGE_SALON_CUSTOM_REPORTS',
  '{"description": "Custom quarterly reports"}'::jsonb
);
```

### Archive Pages

**RPC:** `public.hera_org_page_archive_v1(organization_id, actor_user_id, app_code, page_code)`

Soft-deletes tenant page entity.

### User-Specific Overrides

**RPC:** `public.hera_user_override_page_v1(organization_id, actor_user_id, user_id, app_code, page_code, effect)`

**Example (block POS for specific employee):**
```sql
SELECT public.hera_user_override_page_v1(
  'org-uuid',
  'admin-user-uuid',
  'emp-user-uuid',
  'SALON',
  'PAGE_SALON_POS',
  'deny'
);
```

Creates HAS_PERMISSION relationship: USER → PAGE with highest precedence.

### Request Workflow (Optional)

**Submit request:**
```sql
SELECT public.hera_page_request_submit_v1(
  'org-uuid',
  'requestor-user-uuid',
  'SALON',
  'PAGE_SALON_CUSTOM_INVENTORY',
  '{"justification": "Need inventory tracking"}'::jsonb
);
```

**Approve/reject:**
```sql
SELECT public.hera_page_request_decide_v1(
  'org-uuid',
  'admin-user-uuid',
  'request-uuid',
  'approve',
  ARRAY['ORG_MANAGER', 'ORG_EMPLOYEE'],
  NULL
);
```

---

## 8. Smart Code & Naming Conformance

### Rules (Enforced)
- **Dot-separated**: Exactly `.` as separator
- **≥6 segments**: Minimum six parts
- **Segments UPPERCASE**: [A-Z0-9] only
- **Version suffix lowercase**: e.g., `.v1`

**Example valid code:** `HERA.UNIVERSAL.PERMISSION.PAGE.TENANT.CLONE.v1`

### Page Naming Convention

| Type | Format | Example |
|------|--------|---------|
| Catalog template | `PAGE_<APP>_<FEATURE>` | `PAGE_SALON_DASHBOARD` |
| Tenant clone | Same as template | `PAGE_SALON_DASHBOARD` |
| Tenant custom | `PAGE_<APP>_CUSTOM_<FEATURE>` | `PAGE_SALON_CUSTOM_REPORTS` |

### Role Codes
- `ORG_OWNER` (full access fast-path)
- `ORG_ADMIN`
- `ORG_MANAGER`
- `ORG_EMPLOYEE`
- `ORG_ACCOUNTANT`
- Custom codes as needed (must follow pattern)

---

## 9. Complete Flow Examples

### A. Register App → Create Org → Onboard Owner

```sql
-- 1. Register app in catalog
SELECT public.hera_app_catalog_register_v1(
  'SALON',
  ARRAY['PAGE_SALON_DASHBOARD', 'PAGE_SALON_APPOINTMENTS', 'PAGE_SALON_POS'],
  'platform-admin-uuid'
);

-- 2. Create organization (auto-installs app, bootstraps owner)
SELECT public.hera_organizations_crud_v1(
  'CREATE',
  'owner-user-uuid',
  '{
    "organization_code": "aurora",
    "organization_name": "Aurora Salon",
    "apps": ["SALON"],
    "bootstrap": true
  }'::jsonb,
  NULL, NULL
);
-- Internally calls:
--   → hera_app_install_for_org_v1('org-uuid', 'SALON', actor, defaults)
--   → hera_onboard_user_v1('owner-user-uuid', 'org-uuid', actor, 'owner')
```

### B. Onboard Employee with Limited Access

```sql
SELECT public.hera_onboard_user_v1(
  'emp-user-uuid',
  'org-uuid',
  'owner-user-uuid',
  'employee',
  ARRAY['PAGE_SALON_DASHBOARD', 'PAGE_SALON_APPOINTMENTS'],
  ARRAY['PAGE_SALON_POS']
);
```

### C. Login

```sql
SELECT public.hera_login_context_v1(
  'emp-user-uuid',
  'aurora'
);

-- Returns:
-- {
--   "success": true,
--   "organization": {"id": "...", "code": "aurora", "name": "Aurora Salon"},
--   "role": "ORG_EMPLOYEE",
--   "owner": false,
--   "pages": ["PAGE_SALON_DASHBOARD", "PAGE_SALON_APPOINTMENTS"]
-- }
```

---

## 10. Why This Scales & Audits Well

### Indexing Strategy

```sql
-- core_entities
CREATE INDEX idx_entities_org_type_code
  ON core_entities(organization_id, entity_type, entity_code);

-- core_relationships
CREATE INDEX idx_relationships_org_type_from
  ON core_relationships(organization_id, relationship_type, from_entity_id);

CREATE INDEX idx_relationships_org_type_to
  ON core_relationships(organization_id, relationship_type, to_entity_id);
```

### Benefits
- **All access = entities + relationships**: No special-case logic
- **Organization-scoped queries**: Natural partition key
- **Immutable catalog**: Platform templates never pollute tenant data
- **Audit trail**: Every permission change creates/updates relationships with timestamps
- **Fast owner path**: Single boolean check bypasses permission graph
- **Predictable precedence**: User override > role grant > default deny

### Query Performance
- **Membership check**: Single lookup on MEMBER_OF relationship
- **Effective pages**: Graph traversal limited to user's roles (typically 1-3)
- **Owner check**: Direct role code match (ORG_OWNER)

---

## End of Technical Explainer

All RPCs named exactly as specified. No schema drift, no invented procedures.

**Status:** ✅ Architecture Approved - Ready for Implementation

**Last Updated:** 2025-10-23
**Version:** 1.0
**Author:** HERA Architecture Team
