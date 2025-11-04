# HERA Demo Organization Hierarchy Setup

## Overview

Successfully created a hierarchical demo organization structure for HERA with proper parent-child relationships, app installations, and user memberships.

## Organization Structure

```
HERA ERP Demo (DEMO-ERP) [Parent]
├── HERA Salon Demo (DEMO-SALON) → SALON app
└── HERA Cashew Demo (DEMO-CASHEW) → CASHEW app
```

### Organization Details

| Organization | Code | ID | Apps | Default App | Subdomain |
|---|---|---|---|---|---|
| HERA ERP Demo | DEMO-ERP | c58cdbcd-73f9-4cef-8c27-caf9f4436d05 | None | None | erp-demo |
| HERA Salon Demo | DEMO-SALON | de5f248d-7747-44f3-9d11-a279f3158fa5 | SALON | SALON | salon-demo |
| HERA Cashew Demo | DEMO-CASHEW | 699453c2-950e-4456-9fc0-c0c71efa78fb | CASHEW | CASHEW | cashew-demo |

### ~~Legacy Organization~~ (REMOVED)

~~The old HERA ERP DEMO (HERA-DEMO) organization has been removed to avoid confusion with the new hierarchical structure.~~

**Removed on**: 2025-11-03

## User Memberships

**Demo User**: demo@heraerp.com
- **Auth UID**: a55cc033-e909-4c59-b974-8ff3e098f2bf
- **PLATFORM USER Entity ID**: 4d93b3f8-dfe8-430c-83ea-3128f6a520cf

### Memberships Created

| Organization | Role | Status | Created |
|---|---|---|---|
| HERA ERP Demo | ORG_OWNER | Active | 2025-11-03 |
| HERA Salon Demo | ORG_OWNER | Active | 2025-11-03 |
| HERA Cashew Demo | ORG_OWNER | Active | 2025-11-03 |

## Introspection Results

When `hera_auth_introspect_v1` is called with the demo user's entity ID, it returns:

```json
{
  "organization_count": 3,
  "default_organization_id": "699453c2-950e-4456-9fc0-c0c71efa78fb",
  "default_app": "CASHEW",
  "organizations": [
    {
      "name": "HERA Cashew Demo",
      "code": "DEMO-CASHEW",
      "apps": ["CASHEW"],
      "primary_role": "ORG_OWNER"
    },
    {
      "name": "HERA Salon Demo",
      "code": "DEMO-SALON",
      "apps": ["SALON"],
      "primary_role": "ORG_OWNER"
    },
    {
      "name": "HERA ERP Demo",
      "code": "DEMO-ERP",
      "apps": [],
      "primary_role": "ORG_OWNER"
    }
  ]
}
```

## Setup Scripts

### Primary Setup Script
**Location**: `/scripts/setup-demo-org-hierarchy.mjs`

Creates the hierarchical organization structure:
1. Finds demo user entity ID
2. Verifies APP entities exist (SALON, CASHEW)
3. Creates parent organization (HERA ERP Demo)
4. Creates child organization (HERA Salon Demo) with SALON app
5. Creates child organization (HERA Cashew Demo) with CASHEW app
6. Sets default apps for each child organization

**Usage**:
```bash
node scripts/setup-demo-org-hierarchy.mjs
```

### Membership Fix Script
**Location**: `/scripts/fix-demo-org-memberships.mjs`

Manually onboards demo user to organizations when bootstrap mechanism fails:
1. Gets demo user's auth UID
2. Finds organizations to fix (DEMO-ERP, DEMO-SALON, DEMO-CASHEW)
3. Calls `hera_onboard_user_v1` for each organization
4. Verifies memberships were created
5. Tests introspection

**Usage**:
```bash
node scripts/fix-demo-org-memberships.mjs
```

### Verification Script
**Location**: `/scripts/check-demo-memberships.mjs`

Checks and displays:
1. Demo user auth details
2. All USER entities in the system
3. PLATFORM USER entity (id = auth.users.id)
4. All MEMBER_OF relationships for demo user
5. Introspection results

**Usage**:
```bash
node scripts/check-demo-memberships.mjs
```

### Cleanup Script
**Location**: `/scripts/cleanup-old-demo-org.mjs`

Removes the old HERA ERP DEMO (HERA-DEMO) organization to avoid confusion:
1. Deletes all relationships in the old organization
2. Deletes the organization shadow entity
3. Deletes the organization record
4. Verifies cleanup with introspection

**Usage**:
```bash
node scripts/cleanup-old-demo-org.mjs
```

**Status**: ✅ Executed on 2025-11-03 - Old HERA-DEMO organization removed successfully

## RPC Functions Used

### 1. hera_organizations_crud_v1
Creates organizations with optional bootstrap (auto-membership creation).

**Parameters**:
- `p_action`: 'CREATE'
- `p_actor_user_id`: USER entity ID
- `p_payload`: Organization data including:
  - `organization_name`
  - `organization_code`
  - `parent_organization_id` (for child orgs)
  - `bootstrap: true` (auto-creates membership)
  - `settings` (subdomain, demo_mode, etc.)

**Returns**: Organization details with created ID

### 2. hera_org_link_app_v1
Creates ORG_HAS_APP relationships to install apps in organizations.

**Parameters**:
- `p_actor_user_id`: USER entity ID
- `p_organization_id`: Organization UUID
- `p_app_code`: 'SALON' | 'CASHEW' | etc.
- `p_subscription`: Optional subscription data
- `p_config`: Optional app configuration

**Returns**: Relationship details

### 3. hera_org_set_default_app_v1
Sets the default app for an organization in `settings.default_app_code`.

**Parameters**:
- `p_actor_user_id`: USER entity ID
- `p_organization_id`: Organization UUID
- `p_app_code`: 'SALON' | 'CASHEW' | etc.

**Returns**: Old and new default app codes

### 4. hera_onboard_user_v1
Creates MEMBER_OF and HAS_ROLE relationships for a user in an organization.

**Parameters**:
- `p_supabase_user_id`: Auth user ID (creates PLATFORM USER entity with this ID)
- `p_organization_id`: Organization UUID
- `p_actor_user_id`: USER entity ID (WHO is making the change)
- `p_role`: 'owner' | 'admin' | 'manager' | 'member'

**Returns**: Membership details including user_entity_id

**Important**: This function creates/updates a PLATFORM USER entity with `id = p_supabase_user_id`, so pass the auth UID for new users or existing PLATFORM USER entity ID.

### 5. hera_auth_introspect_v1
Returns user's organizations with apps, roles, and defaults.

**Parameters**:
- `p_actor_user_id`: USER entity ID (PLATFORM USER entity)

**Returns**: Organization count, default org, default app, and organizations array

## Key Learnings

### User Identity Architecture
- **Auth UID**: Supabase auth.users.id (e.g., `a55cc033-e909-4c59-b974-8ff3e098f2bf`)
- **PLATFORM USER Entity**: Created in PLATFORM org with `id = auth.users.id`
- **MEMBER_OF Relationships**: Use PLATFORM USER entity ID as `from_entity_id`
- **Shadow Entities**: ORG and ROLE entities created in each tenant organization

### Organization Hierarchy
- Parent-child relationships via `parent_organization_id` in `core_organizations`
- Parent organization (DEMO-ERP) has no apps installed
- Child organizations (DEMO-SALON, DEMO-CASHEW) each have one app
- Each organization can have its own `default_app_code` in settings

### App Installation Timing
- **Issue**: Setting default app before membership exists fails with "Actor is not an active member"
- **Solution**: Use `bootstrap: true` to create membership first, then install apps separately
- **Order**: 1) Create org with bootstrap, 2) Install apps, 3) Set default app

### RPC Function Parameter Confusion
- `hera_onboard_user_v1` parameter is named `p_supabase_user_id` but it expects the PLATFORM USER entity ID
- For existing users, pass the existing PLATFORM USER entity ID (e.g., `4d93b3f8-dfe8-430c-83ea-3128f6a520cf`)
- For new users, pass the auth UID and the function will create the PLATFORM USER entity
- The function returns `user_entity_id` which is the PLATFORM USER entity ID used for relationships

## Migration Considerations

### Old Organization (HERA-DEMO)
- Currently has both CASHEW and SALON apps installed
- Demo user has OWNER access
- Recommended: Keep for backward compatibility
- Future: Deprecate after migration complete

### Login Flow Updates Needed
1. Update organization selector to show hierarchical structure
2. Add parent organization indicator in UI
3. Update default organization logic to prefer new child orgs
4. Update app switcher to only show apps for current organization

### URL Structure
Consider updating URLs to match hierarchy:
- `/salon` → Points to DEMO-SALON org
- `/cashew` → Points to DEMO-CASHEW org
- `/erp` → Points to DEMO-ERP parent org (no apps)

## Testing Checklist

- [x] Organizations created with correct parent-child relationships
- [x] SALON app installed only in DEMO-SALON
- [x] CASHEW app installed only in DEMO-CASHEW
- [x] Demo user has OWNER access to all organizations
- [x] Introspection returns all 4 organizations
- [x] Default apps set correctly for child organizations
- [ ] Login flow works with new organization structure
- [ ] Organization switcher shows hierarchy
- [ ] App URLs route to correct organizations

## Next Steps

1. **Update Login Flow**: Modify authentication to use new organization structure
2. **Update Organization Selector**: Show parent-child relationships in UI
3. **Test User Experience**: Verify smooth switching between organizations
4. **Update Documentation**: Document new organization structure for users
5. **Plan Legacy Migration**: Create plan to deprecate HERA-DEMO organization
6. **Update Public Demo Links**: Update website links to use new org structure

## Maintenance

### Adding New Demo Organizations
Use the same pattern:
1. Create organization with `parent_organization_id` pointing to DEMO-ERP
2. Install specific app(s) via `hera_org_link_app_v1`
3. Set default app via `hera_org_set_default_app_v1`
4. Onboard users via `hera_onboard_user_v1`

### Debugging Membership Issues
1. Check USER entities: `SELECT * FROM core_entities WHERE entity_type = 'USER'`
2. Check MEMBER_OF relationships: `SELECT * FROM core_relationships WHERE relationship_type = 'MEMBER_OF'`
3. Verify PLATFORM USER entity exists with `id = auth.users.id`
4. Test introspection: `SELECT hera_auth_introspect_v1('user-entity-id')`

## References

- **HERA Sacred Six Schema**: `/docs/schema/hera-sacred-six-schema.yaml`
- **RPC Function Definitions**: `/db/rpc/`
- **MCP Setup Guide**: `/mcp-server/HERA-DEMO-COMPLETE-SETUP.md`
- **Authentication Architecture**: `/docs/HERA-AUTHORIZATION-ARCHITECTURE.md`
