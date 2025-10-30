# HERA App Management RPC Usage Guide

**Version:** 2.0
**Last Updated:** 2025-10-30
**Branch:** salon-auth-upgrade
**Purpose:** Comprehensive guide for all HERA app registration, organization, and authentication RPCs

---

## 📋 Table of Contents

1. [Global Conventions](#global-conventions)
2. [App Catalog RPCs](#app-catalog-rpcs)
3. [Tenant App Linking RPCs](#tenant-app-linking-rpcs)
4. [Organization Management RPCs](#organization-management-rpcs)
5. [Authentication & Introspection RPCs](#authentication--introspection-rpcs)
6. [Helper Functions](#helper-functions)
7. [Testing Guide](#testing-guide)
8. [Error Handling](#error-handling)

---

## 🌍 Global Conventions

### Platform Organization UUID
```
PLATFORM ORG: 00000000-0000-0000-0000-000000000000
```

### App Code Format
```
Pattern: ^[A-Z0-9]+$
Valid:   SALON, CRM, FINANCE, HR2024
Invalid: salon, Salon, SALON_APP, SALON-APP
```

### Smart Code Format
```
Pattern: ^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$
Example: HERA.PLATFORM.APP.ENTITY.SALON.v1

Rules:
- 6 segments total
- First 5 segments: UPPERCASE alphanumeric
- Last segment: lowercase 'v' + digits
- NO underscores allowed
- Segment 5 MUST match entity_code
```

### Membership Check
```sql
-- User is member if active MEMBER_OF relationship exists
-- from_entity_id = USER platform entity (auth.users.id)
-- to_entity_id = tenant ORG entity (shadow entity in core_entities)
-- organization_id = tenant org UUID
```

---

## 📦 App Catalog RPCs

### 1. `hera_apps_register_v1`

**Purpose:** Register a new global APP entity in the PLATFORM organization

**Signature:**
```sql
hera_apps_register_v1(
  p_actor_user_id uuid,
  p_payload jsonb
) RETURNS jsonb
```

**Payload Schema:**
```typescript
{
  code: string,              // REQUIRED: UPPERCASE alphanumeric (e.g., 'SALON')
  name: string,              // REQUIRED: Display name (e.g., 'HERA Salon Management')
  smart_code: string,        // REQUIRED: HERA.PLATFORM.APP.ENTITY.<CODE>.vN
  status?: string,           // OPTIONAL: 'active' | 'inactive' (default: 'active')
  business_rules?: object,   // OPTIONAL: App-specific rules
  metadata?: object          // OPTIONAL: Additional metadata
}
```

**Usage Example:**
```typescript
const result = await supabase.rpc('hera_apps_register_v1', {
  p_actor_user_id: userId,
  p_payload: {
    code: 'SALON',
    name: 'HERA Salon Management',
    smart_code: 'HERA.PLATFORM.APP.ENTITY.SALON.v1',
    status: 'active',
    metadata: {
      category: 'business',
      icon: 'scissors'
    }
  }
})
```

**Response Schema:**
```typescript
{
  action: 'REGISTER',
  app: {
    id: string,
    code: string,
    name: string,
    smart_code: string,
    status: string,
    business_rules: object,
    metadata: object,
    created_at: string,
    updated_at: string
  }
}
```

**Processing Response:**
```typescript
if (result.error) {
  console.error('Registration failed:', result.error.message)
} else {
  const app = result.data.app
  console.log(`App registered: ${app.name} (${app.code})`)
  console.log(`App ID: ${app.id}`)
}
```

---

### 2. `hera_apps_list_v1`

**Purpose:** List global APPs with optional filtering

**Signature:**
```sql
hera_apps_list_v1(
  p_actor_user_id uuid,
  p_filters jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
```

**Filters Schema:**
```typescript
{
  code?: string,              // Filter by exact code
  status?: string,            // Filter by status ('active' | 'inactive')
  q?: string,                 // ILIKE search on name/code
  smart_code_prefix?: string, // Filter by smart code prefix
  limit?: number,             // Default: 50
  offset?: number             // Default: 0
}
```

**Usage Example:**
```typescript
// List all active apps
const result = await supabase.rpc('hera_apps_list_v1', {
  p_actor_user_id: userId,
  p_filters: {
    status: 'active',
    limit: 20,
    offset: 0
  }
})

// Search by name
const searchResult = await supabase.rpc('hera_apps_list_v1', {
  p_actor_user_id: userId,
  p_filters: {
    q: 'salon',
    limit: 10
  }
})
```

**Response Schema:**
```typescript
{
  action: 'LIST',
  items: Array<{
    id: string,
    code: string,
    name: string,
    smart_code: string,
    status: string,
    business_rules: object,
    metadata: object,
    created_at: string,
    updated_at: string
  }>,
  total: number,
  limit: number,
  offset: number
}
```

**Processing Response:**
```typescript
if (result.error) {
  console.error('List failed:', result.error.message)
} else {
  const { items, total } = result.data
  console.log(`Found ${total} apps, showing ${items.length}`)
  items.forEach(app => {
    console.log(`- ${app.name} (${app.code})`)
  })
}
```

---

### 3. `hera_apps_update_v1`

**Purpose:** Update a PLATFORM APP (name, status, or rename)

**Signature:**
```sql
hera_apps_update_v1(
  p_actor_user_id uuid,
  p_payload jsonb
) RETURNS jsonb
```

**Payload Schema:**
```typescript
{
  id: string,                 // REQUIRED: APP UUID to update
  name?: string,              // OPTIONAL: New display name
  status?: string,            // OPTIONAL: New status
  business_rules?: object,    // OPTIONAL: Updated rules
  metadata?: object,          // OPTIONAL: Updated metadata
  new_code?: string,          // OPTIONAL: Rename code (triggers smart_code update)
  new_smart_code?: string     // OPTIONAL: New smart code (segment 5 must match new_code)
}
```

**Usage Example:**
```typescript
// Update app name and status
const result = await supabase.rpc('hera_apps_update_v1', {
  p_actor_user_id: userId,
  p_payload: {
    id: appId,
    name: 'HERA Premium Salon',
    status: 'active'
  }
})

// Rename app (requires new_code AND new_smart_code)
const renameResult = await supabase.rpc('hera_apps_update_v1', {
  p_actor_user_id: userId,
  p_payload: {
    id: appId,
    new_code: 'SALONPRO',
    new_smart_code: 'HERA.PLATFORM.APP.ENTITY.SALONPRO.v2'
  }
})
```

**Response Schema:**
```typescript
{
  action: 'UPDATE',
  app: {
    id: string,
    code: string,
    name: string,
    smart_code: string,
    // ... full app object
  }
}
```

---

### 4. `hera_apps_get_v1`

**Purpose:** Fetch a single PLATFORM APP by ID or code

**Signature:**
```sql
hera_apps_get_v1(
  p_actor_user_id uuid,
  p_selector jsonb
) RETURNS jsonb
```

**Selector Schema:**
```typescript
// By ID
{ id: string }

// OR by code
{ code: string }  // Must be UPPERCASE
```

**Usage Example:**
```typescript
// Get by ID
const byId = await supabase.rpc('hera_apps_get_v1', {
  p_actor_user_id: userId,
  p_selector: { id: appId }
})

// Get by code
const byCode = await supabase.rpc('hera_apps_get_v1', {
  p_actor_user_id: userId,
  p_selector: { code: 'SALON' }
})
```

**Response Schema:**
```typescript
{
  action: 'GET',
  app: {
    id: string,
    code: string,
    name: string,
    smart_code: string,
    status: string,
    business_rules: object,
    metadata: object,
    created_at: string,
    updated_at: string
  }
}
```

---

## 🔗 Tenant App Linking RPCs

### 5. `hera_org_link_app_v1`

**Purpose:** Install/link an APP to a tenant organization (ORG_HAS_APP)

**Signature:**
```sql
hera_org_link_app_v1(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_app_code text,
  p_installed_at timestamptz DEFAULT now(),
  p_subscription jsonb DEFAULT '{}'::jsonb,
  p_config jsonb DEFAULT '{}'::jsonb,
  p_is_active boolean DEFAULT true
) RETURNS jsonb
```

**Usage Example:**
```typescript
const result = await supabase.rpc('hera_org_link_app_v1', {
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_app_code: 'SALON',
  p_installed_at: new Date().toISOString(),
  p_subscription: {
    plan: 'premium',
    expires_at: '2026-01-01T00:00:00Z'
  },
  p_config: {
    enable_appointments: true,
    enable_pos: true,
    enable_inventory: false
  },
  p_is_active: true
})
```

**Response Schema:**
```typescript
{
  action: 'LINK',
  relationship_id: string,
  organization_id: string,
  is_active: boolean,
  installed_at: string,
  subscription: object,
  config: object,
  app: {
    id: string,
    code: string,
    name: string,
    smart_code: string
  }
}
```

**Processing Response:**
```typescript
if (result.error) {
  if (result.error.message.includes('already installed')) {
    console.log('App already installed, updating configuration...')
  } else {
    console.error('Installation failed:', result.error.message)
  }
} else {
  const { app, subscription } = result.data
  console.log(`Installed ${app.name}`)
  console.log(`Subscription: ${subscription.plan}`)
}
```

---

### 6. `hera_org_unlink_app_v1`

**Purpose:** Uninstall an APP from a tenant organization

**Signature:**
```sql
hera_org_unlink_app_v1(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_app_code text,
  p_uninstalled_at timestamptz DEFAULT now(),
  p_hard_delete boolean DEFAULT false
) RETURNS jsonb
```

**Usage Example:**
```typescript
// Soft uninstall (recommended - preserves audit trail)
const result = await supabase.rpc('hera_org_unlink_app_v1', {
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_app_code: 'SALON',
  p_hard_delete: false  // Default
})

// Hard delete (irreversible)
const hardDelete = await supabase.rpc('hera_org_unlink_app_v1', {
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_app_code: 'SALON',
  p_hard_delete: true
})
```

**Response Schema:**
```typescript
{
  action: 'UNLINK',
  mode: 'soft' | 'hard',
  affected: number,
  relationship_id: string,
  organization_id: string,
  uninstalled_at: string,
  app: {
    id: string,
    code: string,
    name: string,
    smart_code: string
  }
}
```

---

### 7. `hera_org_list_apps_v1`

**Purpose:** List installed apps for a tenant organization

**Signature:**
```sql
hera_org_list_apps_v1(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_filters jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
```

**Filters Schema:**
```typescript
{
  include_inactive?: boolean,  // Default: false (only active apps)
  code?: string,               // Filter by app code
  q?: string,                  // ILIKE search on name/code
  limit?: number,              // Default: 50
  offset?: number              // Default: 0
}
```

**Usage Example:**
```typescript
// List active apps
const result = await supabase.rpc('hera_org_list_apps_v1', {
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_filters: { include_inactive: false }
})

// List all apps (including inactive)
const allApps = await supabase.rpc('hera_org_list_apps_v1', {
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_filters: { include_inactive: true }
})
```

**Response Schema:**
```typescript
{
  action: 'LIST',
  items: Array<{
    relationship_id: string,
    is_active: boolean,
    installed_at: string,
    subscription: object,
    config: object,
    code: string,
    name: string,
    smart_code: string
  }>,
  total: number,
  limit: number,
  offset: number
}
```

---

### 8. `hera_org_has_app_exists_v1`

**Purpose:** Fast boolean check if organization has app linked

**Signature:**
```sql
hera_org_has_app_exists_v1(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_app_code text,
  p_include_inactive boolean DEFAULT false
) RETURNS jsonb
```

**Usage Example:**
```typescript
const result = await supabase.rpc('hera_org_has_app_exists_v1', {
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_app_code: 'SALON',
  p_include_inactive: false
})

if (result.data.exists) {
  console.log('App is installed')
  console.log('Relationship ID:', result.data.relationship_id)
} else {
  console.log('App not installed')
}
```

**Response Schema:**
```typescript
{
  action: 'EXISTS',
  exists: boolean,
  relationship_id: string | null
}
```

---

### 9. `hera_org_set_default_app_v1`

**Purpose:** Set organization's default app (stored in settings.default_app_code)

**Signature:**
```sql
hera_org_set_default_app_v1(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_app_code text
) RETURNS jsonb
```

**Usage Example:**
```typescript
const result = await supabase.rpc('hera_org_set_default_app_v1', {
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_app_code: 'SALON'
})

if (result.error) {
  if (result.error.message.includes('not installed')) {
    console.error('Cannot set default: app not installed')
  } else if (result.error.message.includes('not an active member')) {
    console.error('Cannot set default: not a member')
  }
} else {
  const { old_default_app_code, new_default_app_code } = result.data
  console.log(`Default app changed: ${old_default_app_code} → ${new_default_app_code}`)
}
```

**Response Schema:**
```typescript
{
  action: 'SET_DEFAULT_APP',
  organization_id: string,
  old_default_app_code: string | null,
  new_default_app_code: string,
  app: {
    code: string,
    name: string,
    smart_code: string
  }
}
```

---

## 🏢 Organization Management RPCs

### 10. `hera_organizations_crud_v1`

**Purpose:** Comprehensive CRUD for organizations with optional bootstrap

**Signature:**
```sql
hera_organizations_crud_v1(
  p_action text,
  p_actor_user_id uuid,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
) RETURNS jsonb
```

**Actions:** `'CREATE'`, `'UPDATE'`, `'GET'`, `'LIST'`, `'ARCHIVE'`

#### CREATE Action

**Payload Schema:**
```typescript
{
  organization_name: string,         // REQUIRED
  organization_code: string,         // REQUIRED (unique)
  organization_type?: string,        // Default: 'business_unit'
  industry_classification?: string,
  parent_organization_id?: string,
  status?: string,                   // 'active' | 'inactive' | 'archived'
  settings?: object,
  ai_insights?: object,
  ai_classification?: string,
  ai_confidence?: number,            // 0-1

  // Bootstrap options
  bootstrap?: boolean,               // Make actor owner
  owner_user_id?: string,            // Designate different owner
  members?: Array<{                  // Additional members
    user_id: string,
    role?: string                    // Default: 'member'
  }>,

  // App bootstrap (NEW in v2.0)
  apps?: Array<{
    code: string,                    // REQUIRED
    is_active?: boolean,             // Default: true
    subscription?: object,
    config?: object
  }>,
  default_app_code?: string          // Must be in apps array
}
```

**Usage Example:**
```typescript
// Create organization with full bootstrap
const result = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: userId,
  p_payload: {
    organization_name: 'Michele Luxury Salon',
    organization_code: 'MICHELE',
    organization_type: 'business_unit',
    industry_classification: 'beauty_services',
    bootstrap: true,  // Make actor owner
    apps: [
      {
        code: 'SALON',
        is_active: true,
        subscription: { plan: 'premium' },
        config: { enable_pos: true }
      }
    ],
    default_app_code: 'SALON',
    members: [
      { user_id: staffId1, role: 'admin' },
      { user_id: staffId2, role: 'employee' }
    ]
  }
})
```

#### UPDATE Action

**Payload Schema:**
```typescript
{
  id: string,                        // REQUIRED
  organization_name?: string,
  organization_code?: string,
  organization_type?: string,
  industry_classification?: string,
  parent_organization_id?: string,
  status?: string,
  settings?: object,
  ai_insights?: object,
  ai_classification?: string,
  ai_confidence?: number
}
```

**Usage Example:**
```typescript
const result = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'UPDATE',
  p_actor_user_id: userId,
  p_payload: {
    id: orgId,
    organization_name: 'Michele Premium Salon',
    settings: {
      theme: 'dark',
      language: 'en'
    }
  }
})
```

#### GET Action

**Payload Schema:**
```typescript
{
  id: string  // REQUIRED
}
```

**Usage Example:**
```typescript
const result = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'GET',
  p_actor_user_id: userId,
  p_payload: { id: orgId }
})
```

#### LIST Action

**Usage Example:**
```typescript
const result = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'LIST',
  p_actor_user_id: userId,
  p_limit: 20,
  p_offset: 0
})
```

#### ARCHIVE Action

**Payload Schema:**
```typescript
{
  id: string  // REQUIRED
}
```

**Usage Example:**
```typescript
const result = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'ARCHIVE',
  p_actor_user_id: userId,
  p_payload: { id: orgId }
})
```

**Response Schemas:** (varies by action)
```typescript
{
  action: 'CREATE' | 'UPDATE' | 'GET' | 'ARCHIVE',
  organization: {
    id: string,
    organization_name: string,
    organization_code: string,
    organization_type: string,
    status: string,
    // ... full organization object
  }
}

// LIST action
{
  action: 'LIST',
  items: Array<Organization>,
  limit: number,
  offset: number
}
```

---

## 🔐 Authentication & Introspection RPCs

### 11. `hera_auth_introspect_v1`

**Purpose:** Login snapshot with organizations, roles, and installed apps

**Signature:**
```sql
hera_auth_introspect_v1(
  p_actor_user_id uuid
) RETURNS jsonb
```

**Usage Example:**
```typescript
const result = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: userId
})

if (result.error) {
  console.error('Introspection failed:', result.error.message)
} else {
  const { default_app, default_organization_id, organizations } = result.data

  // Route user to default app
  if (default_app === 'SALON') {
    router.push('/salon/dashboard')
  } else if (default_app === 'CRM') {
    router.push('/crm/dashboard')
  } else {
    router.push('/app-selector')
  }
}
```

**Response Schema:**
```typescript
{
  user_id: string,
  introspected_at: string,
  is_platform_admin: boolean,
  organization_count: number,
  default_organization_id: string | null,
  default_app: string | null,  // NEW in v2.0
  organizations: Array<{
    id: string,
    code: string,
    name: string,
    status: string,
    joined_at: string,
    last_updated: string,
    primary_role: string,
    roles: string[],
    is_owner: boolean,
    is_admin: boolean,
    apps: Array<{                // NEW in v2.0
      code: string,
      name: string,
      installed_at: string,
      subscription: object,
      config: object
    }>
  }>
}
```

**Processing Response:**
```typescript
const introspection = result.data

// Get current organization
const currentOrg = introspection.organizations.find(
  org => org.id === introspection.default_organization_id
)

// Check permissions
if (currentOrg?.is_owner) {
  console.log('User is owner - full access')
} else if (currentOrg?.is_admin) {
  console.log('User is admin - elevated access')
}

// Display installed apps
currentOrg?.apps.forEach(app => {
  console.log(`- ${app.name} (${app.code})`)
  if (app.code === introspection.default_app) {
    console.log('  ⭐ Default app')
  }
})
```

---

## 🛠️ Helper Functions

### `_hera_role_rank(p_code text)`

**Purpose:** Returns precedence rank for role codes (lower = higher priority)

**Usage Example:**
```sql
SELECT _hera_role_rank('ORG_OWNER');    -- Returns: 1
SELECT _hera_role_rank('ORG_ADMIN');    -- Returns: 2
SELECT _hera_role_rank('MEMBER');       -- Returns: 6
SELECT _hera_role_rank('CUSTOM_ROLE');  -- Returns: 999
```

**Role Precedence:**
1. ORG_OWNER (1)
2. ORG_ADMIN (2)
3. ORG_MANAGER (3)
4. ORG_ACCOUNTANT (4)
5. ORG_EMPLOYEE (5)
6. MEMBER (6)
7. Custom roles (999)

---

### `_hera_resolve_org_role(p_actor_user_id uuid, p_organization_id uuid)`

**Purpose:** Resolves user's effective role in organization

**Priority:**
1. HAS_ROLE with is_primary=true
2. HAS_ROLE with highest precedence
3. MEMBER_OF.relationship_data.role (legacy)
4. Default 'MEMBER'

**Usage Example:**
```sql
SELECT _hera_resolve_org_role(
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid
);
-- Returns: 'ORG_OWNER' or 'ORG_ADMIN' or 'MEMBER' etc.
```

---

## 🧪 Testing Guide

### Prerequisites

1. **Environment Variables** (in `.env`)
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEFAULT_ORGANIZATION_ID=your-test-org-id
```

2. **Test User Setup**
```sql
-- Create test user entity in PLATFORM org
INSERT INTO core_entities (
  id,
  organization_id,
  entity_type,
  entity_name,
  entity_code,
  smart_code,
  created_by,
  updated_by
) VALUES (
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'USER',
  'Test User',
  'test-user',
  'HERA.CORE.PLATFORM.ENTITY.USER.v1',
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid,
  '3ced4979-4c09-4e1e-8667-6707cfe6ec77'::uuid
);
```

### Test Sequence

#### 1. App Catalog Tests
```typescript
// Register new app
await supabase.rpc('hera_apps_register_v1', {
  p_actor_user_id: userId,
  p_payload: {
    code: 'TESTAPP',
    name: 'Test Application',
    smart_code: 'HERA.PLATFORM.APP.ENTITY.TESTAPP.v1'
  }
})

// List apps
await supabase.rpc('hera_apps_list_v1', {
  p_actor_user_id: userId,
  p_filters: { status: 'active' }
})

// Get app by code
await supabase.rpc('hera_apps_get_v1', {
  p_actor_user_id: userId,
  p_selector: { code: 'TESTAPP' }
})
```

#### 2. Organization Creation Tests
```typescript
// Create org with app bootstrap
const orgResult = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: userId,
  p_payload: {
    organization_name: 'Test Organization',
    organization_code: 'TESTORG',
    bootstrap: true,
    apps: [
      { code: 'TESTAPP', is_active: true }
    ],
    default_app_code: 'TESTAPP'
  }
})

const orgId = orgResult.data.organization.id
```

#### 3. App Linking Tests
```typescript
// Verify app installed
await supabase.rpc('hera_org_has_app_exists_v1', {
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_app_code: 'TESTAPP'
})

// List installed apps
await supabase.rpc('hera_org_list_apps_v1', {
  p_actor_user_id: userId,
  p_organization_id: orgId
})

// Change default app
await supabase.rpc('hera_org_set_default_app_v1', {
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_app_code: 'TESTAPP'
})
```

#### 4. Introspection Tests
```typescript
// Get user context
const introspection = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: userId
})

// Verify results
expect(introspection.data.default_app).toBe('TESTAPP')
expect(introspection.data.organizations[0].apps).toHaveLength(1)
expect(introspection.data.organizations[0].primary_role).toBe('ORG_OWNER')
```

#### 5. Cleanup Tests
```typescript
// Uninstall app
await supabase.rpc('hera_org_unlink_app_v1', {
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_app_code: 'TESTAPP'
})

// Archive org
await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'ARCHIVE',
  p_actor_user_id: userId,
  p_payload: { id: orgId }
})
```

---

## ❌ Error Handling

### Common Error Patterns

#### Invalid App Code Format
```typescript
// Error: "Invalid p_app_code: must be UPPERCASE alphanumeric"
{
  message: 'Invalid p_app_code "salon": must be UPPERCASE alphanumeric with no underscores/spaces. Examples: SALON, CRM, FINANCE',
  code: '22023'  // PostgreSQL raise_exception
}
```

#### App Not Found
```typescript
// Error: "APP with code ... not found in PLATFORM org"
{
  message: 'APP with code "NONEXISTENT" not found in PLATFORM org. Available APPs can be queried from core_entities with entity_type=APP...',
  code: '22023'
}
```

#### Actor Not Member
```typescript
// Error: "Actor is not an active member"
{
  message: 'Actor 3ced4979-4c09-4e1e-8667-6707cfe6ec77 is not an active member of organization 378f24fb-d496-4ff7-8afa-ea34895a0eb8. Please verify actor has MEMBER_OF relationship.',
  code: '22023'
}
```

#### App Not Installed
```typescript
// Error: "Organization does not have APP installed"
{
  message: 'Organization 378f24fb-d496-4ff7-8afa-ea34895a0eb8 does not have APP "CRM" installed. Active ORG_HAS_APP relationship required. Use hera_org_link_app_v1 to install the app first.',
  code: '22023'
}
```

### Error Handling Best Practices

```typescript
try {
  const result = await supabase.rpc('hera_org_set_default_app_v1', {
    p_actor_user_id: userId,
    p_organization_id: orgId,
    p_app_code: appCode
  })

  if (result.error) {
    const { message } = result.error

    // Handle specific errors
    if (message.includes('not installed')) {
      toast.error('Please install this app first')
      router.push('/apps/install')
    } else if (message.includes('not an active member')) {
      toast.error('You need to be a member of this organization')
      router.push('/organizations')
    } else if (message.includes('Invalid p_app_code')) {
      toast.error('Invalid app code format')
    } else {
      toast.error('Failed to set default app')
      console.error('Unexpected error:', message)
    }
  } else {
    toast.success('Default app updated successfully')
  }
} catch (error) {
  console.error('Network or client error:', error)
  toast.error('Connection failed. Please try again.')
}
```

---

## 📚 Additional Resources

- **Schema Reference:** `/docs/schema/hera-sacred-six-schema.yaml`
- **RPC Source Files:** `/db/rpc/*_FINAL.sql`
- **Migration Guide:** `/docs/migrations/SALON-AUTH-UPGRADE.md`
- **Testing Scripts:** `/tests/rpc/app-management-tests.ts`

---

**Last Updated:** 2025-10-30
**Maintained By:** HERA Development Team
**Version:** 2.0 (App Management & Auth Upgrade)
