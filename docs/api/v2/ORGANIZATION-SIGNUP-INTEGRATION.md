# Organization Signup Integration Guide (HERA v2.3)

**Complete guide for integrating organization creation and user onboarding in your application**

## 🎯 Overview

HERA v2.3 introduces comprehensive organization management with automatic user onboarding via two new RPC functions:

1. **`hera_onboard_user_v1`** - Universal user onboarding with role/label support
2. **`hera_organizations_crud_v1`** - Full CRUD for organizations (requires `version` column)

**Current Implementation**: Direct table access + RPC onboarding (production-ready workaround until `version` column is added)

---

## 📋 Complete Signup Flow

### Architecture

```
┌─────────────┐
│ 1. Auth     │ Create Supabase auth user
│    User     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 2. Create   │ Insert into core_organizations
│    Org      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 3. Create   │ Insert into core_entities
│    Org      │ (Required for FK constraints)
│    Entity   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 4. Onboard  │ Call hera_onboard_user_v1 RPC
│    User     │ Creates user entity + membership
└─────────────┘
```

---

## 🚀 API Endpoints (v2.3)

### 1. POST /api/v2/organizations

**Create organization with automatic user onboarding**

#### Request

```typescript
POST /api/v2/organizations
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "organization_name": "My Salon",
  "organization_type": "business_unit",  // business_unit | branch | division | partner
  "industry_classification": "beauty_salon",
  "settings": {
    "currency": "USD",
    "selected_app": "salon",
    "theme": { "preset": "salon-luxe" }
  },
  "status": "active",
  "role": "owner",  // Role for creator
  "auto_onboard": true  // Automatically onboard creator
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "organization": {
      "id": "org-uuid",
      "organization_name": "My Salon",
      "organization_code": "ORG-MH0RCR8M",
      "organization_type": "business_unit",
      "industry_classification": "beauty_salon",
      "settings": { "currency": "USD", "selected_app": "salon" },
      "status": "active",
      "created_at": "2025-10-21T14:00:00Z"
    },
    "membership": {
      "success": true,
      "user_entity_id": "user-uuid",
      "membership_id": "membership-uuid",
      "role": "ORG_OWNER",
      "label": null
    },
    "onboarded": true
  },
  "message": "Organization created successfully"
}
```

---

### 2. POST /api/v2/organizations/members

**Onboard additional users to organization**

#### Request

```typescript
POST /api/v2/organizations/members
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "user_id": "user-uuid",
  "organization_id": "org-uuid",
  "role": "receptionist"  // owner | admin | manager | employee | custom label
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "success": true,
    "user_entity_id": "user-uuid",
    "membership_id": "membership-uuid",
    "role": "ORG_EMPLOYEE",
    "label": "receptionist",
    "message": "User membership + role setup complete"
  },
  "message": "User onboarded successfully"
}
```

---

### 3. GET /api/v2/organizations

**List user's organizations**

#### Request

```typescript
GET /api/v2/organizations?limit=50&offset=0&status=active
Authorization: Bearer <jwt_token>
```

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "org-uuid",
      "organization_name": "My Salon",
      "organization_code": "ORG-MH0RCR8M",
      "organization_type": "business_unit",
      "user_role": "ORG_OWNER",
      "user_label": null,
      "joined_at": "2025-10-21T14:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

---

### 4. GET /api/v2/organizations/members

**List organization members**

#### Request

```typescript
GET /api/v2/organizations/members?organization_id=org-uuid&limit=100
Authorization: Bearer <jwt_token>
```

#### Response

```json
{
  "success": true,
  "data": [
    {
      "user_id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ORG_OWNER",
      "label": null,
      "joined_at": "2025-10-21T14:00:00Z"
    },
    {
      "user_id": "staff-uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "ORG_EMPLOYEE",
      "label": "receptionist",
      "joined_at": "2025-10-21T15:00:00Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 100,
    "offset": 0
  }
}
```

---

## 📝 Utility Functions

### Client-Side Signup

```typescript
import { signupWithOrganization } from '@/lib/auth/signup-organization'

// Complete signup flow (uses API v2 endpoints)
const result = await signupWithOrganization({
  // User details
  email: 'owner@example.com',
  password: 'SecurePassword123!',
  name: 'Salon Owner',

  // Organization details
  businessName: 'Luxury Salon',
  industry: 'beauty_salon',
  currency: 'USD',
  selectedApp: 'salon',

  // Theme
  theme: { preset: 'salon-luxe' }
})

if (result.success) {
  console.log('User:', result.user)
  console.log('Organization:', result.organization)
  console.log('Membership:', result.membership)
} else {
  console.error('Signup failed:', result.error)
}
```

### Server-Side Signup

```typescript
import { signupWithOrganizationServer } from '@/lib/auth/signup-organization'

// Server-side signup (uses service role key)
const result = await signupWithOrganizationServer({
  email: 'owner@example.com',
  password: 'SecurePassword123!',
  name: 'Salon Owner',
  businessName: 'Luxury Salon',
  industry: 'beauty_salon',
  currency: 'USD',
  selectedApp: 'salon'
})
```

---

## 🎭 Role Mapping Reference

| Input Role | Canonical Role | Custom Label | Use Case |
|------------|----------------|--------------|----------|
| `owner` | `ORG_OWNER` | `null` | Organization owner (full control) |
| `admin` | `ORG_ADMIN` | `null` | Administrator |
| `manager` | `ORG_MANAGER` | `null` | Manager |
| `employee` | `ORG_EMPLOYEE` | `null` | Employee/Staff |
| `staff` | `ORG_EMPLOYEE` | `null` | Staff (alias for employee) |
| `member` | `MEMBER` | `null` | Basic member |
| `receptionist` | `ORG_EMPLOYEE` | `receptionist` | Receptionist with custom label |
| `accountant` | `ORG_EMPLOYEE` | `accountant` | Accountant with custom label |
| `nurse` | `ORG_EMPLOYEE` | `nurse` | Healthcare: Nurse |
| Any custom | `ORG_EMPLOYEE` | `<custom>` | Industry-specific role |

---

## 🔒 Permission Matrix

| Action | ORG_OWNER | ORG_ADMIN | ORG_MANAGER | ORG_EMPLOYEE | MEMBER |
|--------|-----------|-----------|-------------|--------------|--------|
| Create Organization | ✅ (Self) | ❌ | ❌ | ❌ | ❌ |
| Update Organization | ✅ | ✅ | ❌ | ❌ | ❌ |
| Archive Organization | ✅ | ✅ | ❌ | ❌ | ❌ |
| Onboard Members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remove Members | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Members | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Organization | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🧪 Testing

### Test Script

```bash
cd mcp-server
node test-signup-api-flow.mjs
```

### Expected Output

```
✅ VERIFICATION COMPLETE
   ┌─────────────────────────────────────────────
   │ Auth User
   │   ID: user-uuid
   │   Email: test@example.com
   │
   │ Organization
   │   ID: org-uuid
   │   Name: Test Business
   │   Code: ORG-MH0RCR8M
   │
   │ Organization Entity
   │   Type: ORG
   │   Smart Code: HERA.SALON.ENTITY.ORG.TESTBUSINESS.v1
   │
   │ User Entity
   │   Name: Test User
   │   Type: USER
   │   Smart Code: HERA.PLATFORM.ENTITY.USER.ACCOUNT.v1
   │
   │ Membership
   │   Role: ORG_OWNER
   │   Label: null
   │   Smart Code: HERA.PLATFORM.REL.MEMBER_OF.USER.v1
   │   Active: true
   └─────────────────────────────────────────────
```

---

## 📚 Database Schema

### What Gets Created

1. **auth.users** - Supabase authentication user
2. **core_organizations** - Organization record
3. **core_entities** (ORG) - Organization entity (FK requirement)
4. **core_entities** (USER) - User entity (via RPC)
5. **core_relationships** - Membership relationship (via RPC)

### Smart Codes

- Organization Entity: `HERA.SALON.ENTITY.ORG.<NORMALIZED_NAME>.v1`
- User Entity: `HERA.PLATFORM.ENTITY.USER.ACCOUNT.v1`
- Membership: `HERA.PLATFORM.REL.MEMBER_OF.USER.v1`

---

## ⚠️ Known Limitations

1. **`version` Column Missing**: `hera_organizations_crud_v1` RPC requires `version` column in `core_organizations` table
   - **Workaround**: Use direct table insert for organization creation (current implementation)
   - **Future**: After migration adds `version` column, switch to full RPC usage

2. **Organization Code Generation**: Currently uses timestamp-based codes
   - Format: `ORG-<BASE36_TIMESTAMP>`
   - Consider implementing custom code generation logic if needed

---

## 🔄 Migration Path

### Current (v2.3 - Production Ready)

```typescript
// Direct table insert + RPC onboarding
1. Create org record → core_organizations.insert()
2. Create org entity → core_entities.insert()
3. Onboard user → hera_onboard_user_v1 RPC
```

### Future (After version column migration)

```typescript
// Full RPC usage
1. Create org + onboard → hera_organizations_crud_v1 RPC with bootstrap=true
```

---

## 📖 Related Documentation

- [RPC Functions Guide](/docs/api/v2/RPC_FUNCTIONS_GUIDE.md)
- [HERA Authorization Architecture](/docs/HERA-AUTHORIZATION-ARCHITECTURE.md)
- [MCP Testing Guide](/mcp-server/test-complete-signup-flow.mjs)

---

**Last Updated**: October 21, 2025
**Version**: 2.3.0
**Status**: ✅ Production Ready
