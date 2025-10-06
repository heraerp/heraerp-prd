# HERA Authorization Architecture - Complete Reference

**Smart Code:** `HERA.DNA.SECURITY.AUTH.ARCHITECTURE.V1`
**Last Updated:** October 2025
**Status:** Production - Canonical Reference

---

## 🏗️ Architecture Overview

HERA uses a **three-tier authorization system** based on Universal DNA architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 1: Supabase Auth                         │
│                  (Identity & Session Management)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              TIER 2: HERA Entity Architecture                    │
│        (USER Entity + USER_MEMBER_OF_ORG Relationship)          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           TIER 3: Dynamic Data & Permissions                     │
│             (Roles, Permissions, Business Logic)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Model

### **1. User Creation Flow**

```sql
-- When user signs up via Supabase Auth:
-- Step 1: Supabase creates auth.users record
INSERT INTO auth.users (id, email, ...)
VALUES ('62dd0fbe-adec-4dc4-9a67-7fa3fbb2158c', 'owner@hairtalkz.ae', ...)

-- Step 2: USER entity created in PLATFORM org (00000000...)
INSERT INTO core_entities (id, organization_id, entity_type, entity_name, ...)
VALUES (
  '62dd0fbe-adec-4dc4-9a67-7fa3fbb2158c',  -- Same ID as auth user
  '00000000-0000-0000-0000-000000000000',  -- Platform org (ALWAYS)
  'USER',                                   -- Entity type (uppercase)
  'owner',                                  -- Display name
  ...
)

-- Step 3: Membership relationship to tenant org
INSERT INTO core_relationships (
  from_entity_id,
  to_entity_id,
  relationship_type,
  organization_id
) VALUES (
  '62dd0fbe-adec-4dc4-9a67-7fa3fbb2158c',  -- User entity
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8',  -- Tenant org
  'USER_MEMBER_OF_ORG',                     -- Relationship type
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'   -- Tenant org
)

-- Step 4: Role and permissions in dynamic data (TENANT org)
INSERT INTO core_dynamic_data (
  entity_id,
  organization_id,
  field_name,
  field_value_text,
  ...
) VALUES (
  '62dd0fbe-adec-4dc4-9a67-7fa3fbb2158c',  -- User entity
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8',  -- Tenant org
  'salon_role',
  'owner',
  ...
)
```

### **2. Key Tables**

| Table | Purpose | Organization Context |
|-------|---------|---------------------|
| `auth.users` | Supabase authentication | N/A (Supabase managed) |
| `core_entities` (USER) | User entity record | Platform org (`00000000...`) |
| `core_relationships` | User → Org membership | Tenant org |
| `core_dynamic_data` | Roles, permissions, profile | Tenant org |

---

## 🔐 Authentication Flow

### **Login → API Request Flow**

```
1. User Login (Browser)
   ↓
   await supabase.auth.signInWithPassword({ email, password })
   ↓
   Supabase returns: { session: { access_token, user: {...} } }

2. Token Storage
   ↓
   Session stored in browser (localStorage/cookies)

3. API Request (Browser)
   ↓
   fetchV2() automatically adds:
   - Header: Authorization: Bearer <access_token>
   - Header: x-hera-api-version: v2

4. Server: verifyAuth() (src/lib/auth/verify-auth.ts)
   ↓
   a) Extract token from Authorization header
   b) Validate with Supabase: supabase.auth.getUser(token)
   c) Get organization_id:
      - First: user.user_metadata.organization_id
      - Fallback: Query USER_MEMBER_OF_ORG relationship
   d) Return: { id, email, organizationId, roles, permissions }

5. API Route: Organization Check
   ↓
   if (requestOrgId !== authResult.organizationId) {
     return 403 Forbidden
   }

6. Database Query
   ↓
   All queries MUST filter by organization_id
   (RLS policies enforce this at database level)
```

---

## 🧩 Key Components

### **1. JWT Service** (`src/lib/auth/jwt-service.ts`)

**Purpose:** Validate JWT tokens and extract organization context

**Flow:**
```typescript
// Primary: Get org from user metadata
organizationId = user.user_metadata?.organization_id

// Fallback: Follow USER_MEMBER_OF_ORG relationship
if (!organizationId) {
  const { data: relationship } = await supabase
    .from('core_relationships')
    .select('to_entity_id, organization_id')
    .eq('from_entity_id', user.id)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .maybeSingle()

  organizationId = relationship?.organization_id
}
```

**Returns:** `JWTPayload` with `organization_id`, `role`, `permissions`

---

### **2. Auth Verification** (`src/lib/auth/verify-auth.ts`)

**Purpose:** Middleware for API routes to verify authentication

**Usage:**
```typescript
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request)

  if (!authResult || !authResult.organizationId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // authResult contains: { id, email, organizationId, roles, permissions }
}
```

---

### **3. User Entity Resolver** (`src/lib/security/user-entity-resolver.ts`)

**Purpose:** Resolve user's organization and business data from HERA entities

**Flow:**
```typescript
1. Find USER entity where id = authUserId (in platform org)
2. Follow USER_MEMBER_OF_ORG relationship to find tenant org
3. Fetch dynamic data (role, permissions) from tenant org
4. Return: { userId, organizationId, salonRole, permissions, ... }
```

---

### **4. Secured Salon Provider** (`src/app/salon/SecuredSalonProvider.tsx`)

**Purpose:** React context provider for salon security

**Responsibilities:**
- Initialize security context from auth session
- Resolve organization via `createSecurityContextFromAuth()`
- Load branches for selected organization
- Provide: `{ user, organization, selectedBranch, salonRole, permissions }`

---

### **5. fetchV2 Client** (`src/lib/client/fetchV2.ts`)

**Purpose:** Universal API client with automatic auth headers

**Features:**
```typescript
// Automatically adds:
- Authorization: Bearer <token>  (from Supabase session)
- x-hera-api-version: v2
- Content-Type: application/json

// Uses relative URLs (dynamic port support)
// Server-side: absolute URLs with NEXT_PUBLIC_APP_URL
```

---

## 🔑 Organization Resolution Priority

**Priority Order (Highest to Lowest):**

1. **User Metadata** (Primary)
   - `user.user_metadata.organization_id`
   - Set during registration
   - Fastest lookup

2. **USER_MEMBER_OF_ORG Relationship** (Fallback)
   - Query `core_relationships`
   - `from_entity_id = userId`
   - `relationship_type = 'USER_MEMBER_OF_ORG'`
   - Returns `organization_id` from relationship

3. **Error** (No Organization)
   - User not properly provisioned
   - Return 401 Unauthorized

---

## 🚨 Critical Rules (NEVER VIOLATE)

### **1. USER Entity ALWAYS in Platform Org**
```typescript
✅ CORRECT:
USER entity organization_id = '00000000-0000-0000-0000-000000000000'

❌ WRONG:
USER entity organization_id = '<tenant-org-id>'
```

### **2. Organization Context via Relationship**
```typescript
✅ CORRECT:
// Find org via USER_MEMBER_OF_ORG relationship
SELECT organization_id
FROM core_relationships
WHERE from_entity_id = '<user-id>'
  AND relationship_type = 'USER_MEMBER_OF_ORG'

❌ WRONG:
// Using USER entity's organization_id for tenant context
SELECT organization_id
FROM core_entities
WHERE id = '<user-id>' AND entity_type = 'USER'
```

### **3. All API Requests MUST Match JWT Org**
```typescript
✅ CORRECT:
const requestOrgId = searchParams.get('organization_id')
if (requestOrgId !== authResult.organizationId) {
  return 403 Forbidden
}

❌ WRONG:
// Trusting client-provided org without validation
const orgId = searchParams.get('organization_id')
// Query database with orgId (security breach!)
```

### **4. Dynamic Data in Tenant Org**
```typescript
✅ CORRECT:
INSERT INTO core_dynamic_data (
  entity_id,
  organization_id,  -- TENANT org
  field_name,
  field_value_text
) VALUES (
  '<user-id>',
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8',  -- Tenant org
  'salon_role',
  'owner'
)

❌ WRONG:
organization_id = '00000000-0000-0000-0000-000000000000'  -- Platform org
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: 403 Forbidden - Organization Mismatch**

**Symptoms:**
```
GET /api/v2/transactions?p_organization_id=378f24fb... → 403
Error: organization_id mismatch
```

**Diagnosis:**
```javascript
// Browser console:
const session = await supabase.auth.getSession()
console.log('JWT org:', session.data.session?.user?.user_metadata?.organization_id)
console.log('Request org:', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
```

**Solutions:**
1. **Logout and login again** to get fresh JWT
2. **Check USER_MEMBER_OF_ORG relationship exists**
3. **Update user_metadata.organization_id** if missing

---

### **Issue 2: 401 Unauthorized**

**Symptoms:**
```
GET /api/v2/dynamic-data?p_entity_id=... → 401
Error: unauthorized
```

**Diagnosis:**
```javascript
// Check if session exists
const session = await supabase.auth.getSession()
console.log('Has session:', !!session.data.session)
console.log('Has token:', !!session.data.session?.access_token)
```

**Solutions:**
1. **Login required** - User not authenticated
2. **Session expired** - Refresh or re-login
3. **Token not sent** - Check fetchV2 auth headers

---

### **Issue 3: Wrong Organization Returned**

**Symptoms:**
- Logged in as `owner@hairtalkz.ae`
- System returns HERA System Org (`f1ae3ae4...`)

**Root Cause:**
- USER_MEMBER_OF_ORG relationship missing
- System falling back to default org

**Solution:**
```sql
-- Check relationship exists
SELECT * FROM core_relationships
WHERE from_entity_id = '<user-id>'
  AND relationship_type = 'USER_MEMBER_OF_ORG';

-- Create if missing
INSERT INTO core_relationships (
  from_entity_id,
  to_entity_id,
  relationship_type,
  organization_id
) VALUES (
  '<user-id>',
  '<tenant-org-id>',
  'USER_MEMBER_OF_ORG',
  '<tenant-org-id>'
);
```

---

## 🔧 Debug Checklist

When debugging auth issues, check in this order:

### **1. Supabase Auth Session**
```javascript
const session = await supabase.auth.getSession()
console.log('Session:', session.data.session)
console.log('User:', session.data.session?.user?.email)
console.log('Metadata org:', session.data.session?.user?.user_metadata?.organization_id)
```

### **2. USER Entity Exists**
```sql
SELECT * FROM core_entities
WHERE id = '<auth-user-id>'
  AND entity_type IN ('USER', 'user');
```

### **3. USER_MEMBER_OF_ORG Relationship**
```sql
SELECT * FROM core_relationships
WHERE from_entity_id = '<auth-user-id>'
  AND relationship_type = 'USER_MEMBER_OF_ORG';
```

### **4. Dynamic Data (Role/Permissions)**
```sql
SELECT * FROM core_dynamic_data
WHERE entity_id = '<auth-user-id>'
  AND organization_id = '<tenant-org-id>';
```

### **5. API Request Headers**
```javascript
// Check what's being sent
const session = await supabase.auth.getSession()
const response = await fetch('/api/v2/debug/auth', {
  headers: {
    'Authorization': `Bearer ${session.data.session?.access_token}`
  }
})
console.log(await response.json())
```

---

## 📝 Organization IDs Reference

### **Special Organizations**

| ID | Name | Purpose |
|----|------|---------|
| `00000000-0000-0000-0000-000000000000` | Platform Org | All USER entities |
| `f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944` | HERA System Org | Templates, master data |

### **Hairtalkz Organizations**

| ID | Name | Users |
|----|------|-------|
| `378f24fb-d496-4ff7-8afa-ea34895a0eb8` | Hairtalkz | admin@hairtalkz.com, owner@hairtalkz.ae, etc. |
| `0fd09e31-d257-4329-97eb-7d7f522ed6f0` | Hair Talkz Salon - DNA Testing | michele@hairtalkz.com |

---

## 🎯 Best Practices

### **1. Always Use fetchV2 for API Calls**
```typescript
✅ CORRECT:
import { apiV2 } from '@/lib/client/fetchV2'
const { data } = await apiV2.get('entities', { organization_id: orgId })

❌ WRONG:
fetch('/api/entities', { ... })  // Missing auth headers
```

### **2. Use SecuredSalonProvider for Salon Pages**
```typescript
✅ CORRECT:
<SecuredSalonProvider>
  <YourSalonPage />
</SecuredSalonProvider>

❌ WRONG:
// Accessing salon data without security context
```

### **3. Validate Organization on Every API Route**
```typescript
✅ CORRECT:
const authResult = await verifyAuth(request)
const requestOrgId = searchParams.get('organization_id')

if (!requestOrgId || requestOrgId !== authResult.organizationId) {
  return NextResponse.json({ error: 'forbidden' }, { status: 403 })
}

❌ WRONG:
// Trusting client org without validation
const orgId = searchParams.get('organization_id')
// Use orgId directly (SECURITY BREACH!)
```

### **4. Handle Auth Errors Gracefully**
```typescript
✅ CORRECT:
const { data, error } = await apiV2.get('entities', { ... })

if (error) {
  if (error.error === 'unauthorized') {
    router.push('/auth/login')
  } else if (error.error === 'forbidden') {
    toast.error('Access denied to this organization')
  }
  return
}

❌ WRONG:
// Ignoring errors
const { data } = await apiV2.get('entities', { ... })
// Use data (might be undefined!)
```

---

## 🔄 Token Refresh Pattern

```typescript
// Auto-refresh on 401
try {
  const response = await fetchV2('/api/v2/entities', { ... })

  if (response.status === 401) {
    // Try to refresh session
    const { data, error } = await supabase.auth.refreshSession()

    if (data.session) {
      // Retry request with new token
      return fetchV2('/api/v2/entities', { ... })
    } else {
      // Redirect to login
      router.push('/auth/login')
    }
  }
} catch (error) {
  // Handle error
}
```

---

## 📚 Related Documentation

- `/docs/HERA-DNA-SECURITY.md` - Security DNA patterns
- `/docs/AUTHORIZATION-PATTERN.md` - Three-layer auth pattern
- `/src/lib/auth/verify-auth.ts` - Auth verification implementation
- `/src/lib/auth/jwt-service.ts` - JWT validation and org resolution
- `/src/lib/security/user-entity-resolver.ts` - User entity resolution

---

## ✅ Quick Reference

### **Auth Flow Summary**
```
Login → JWT Token → API Request → verifyAuth()
  → Check org match → Query with org filter → Success
```

### **Organization Resolution**
```
1. user_metadata.organization_id (fastest)
2. USER_MEMBER_OF_ORG relationship (fallback)
3. Error if neither exists
```

### **Key Files**
- `src/lib/auth/jwt-service.ts` - Token validation
- `src/lib/auth/verify-auth.ts` - API auth middleware
- `src/lib/client/fetchV2.ts` - Auto-auth client
- `src/app/salon/SecuredSalonProvider.tsx` - React context

---

**End of HERA Authorization Architecture Reference**
