# Security & RBAC

## Overview
HERA implements a comprehensive Role-Based Access Control (RBAC) system built on the universal entity architecture.

## Authentication
- **Primary**: Supabase JWT authentication
- **Optional**: External identity providers (SAML, OIDC)
- **Multi-Factor**: Supported through Supabase Auth
- **Session Management**: JWT refresh tokens with configurable expiry

## Multi-Tenant Isolation
- **Organization-Bound RLS**: Row Level Security on all core tables
- **Automatic Filtering**: Every query filtered by `organization_id`
- **Cross-Tenant Protection**: Complete isolation between organizations
- **Audit Trail**: All access attempts logged

## Role Architecture
Roles are implemented as first-class entities, not hardcoded strings:

### Role as Entity
- **Entity Type**: `ROLE` in `core_entities` table
- **Smart Code**: `HERA.{DOMAIN}.ROLE.ENTITY.ITEM.V1`
- **Dynamic Fields**:
  - `permissions` (JSON) - Array of permission strings
  - `description` (text) - Role purpose
  - `priority` (number) - For conflict resolution

### Staff-Role Assignment
- **Relationship Type**: `STAFF_HAS_ROLE`
- **Table**: `core_relationships`
- **Cardinality**: Many-to-many (staff can have multiple roles)
- **Smart Code**: `HERA.{DOMAIN}.STAFF.REL.ROLE.V1`

### Permission Structure
Permissions stored in role's dynamic data as JSON array:
```json
{
  "permissions": [
    "entities:read",
    "entities:write",
    "transactions:create",
    "reports:financial:view"
  ]
}
```

## Frontend Integration
### useHERAAuth() Hook
```typescript
const { 
  user,           // Current user
  organization,   // Current organization
  roles,          // User's roles
  permissions,    // Flattened permissions
  hasPermission,  // Check single permission
  hasAnyPermission, // Check multiple permissions
  hasAllPermissions // Require all permissions
} = useHERAAuth()
```

### Permission Guards
```typescript
// Component-level guard
<PermissionGuard require="transactions:create">
  <CreateTransactionButton />
</PermissionGuard>

// Hook-based guard
if (hasPermission('reports:financial:view')) {
  showFinancialReport()
}
```

## RPC Security
All RPC functions enforce security:
1. **Authentication Check**: Valid JWT required
2. **Organization Resolution**: Extract org from JWT
3. **Role Loading**: Fetch user's roles via relationships
4. **Permission Aggregation**: Combine all role permissions
5. **Action Authorization**: Verify required permissions
6. **Audit Logging**: Record access attempt

## Permission Naming Convention
Format: `resource:action:scope`
- `resource`: Entity or feature (e.g., `entities`, `transactions`)
- `action`: Operation (e.g., `read`, `write`, `delete`)
- `scope`: Optional specificity (e.g., `own`, `all`, `financial`)

Examples:
- `entities:read:all` - Read all entities
- `transactions:create` - Create transactions
- `reports:financial:view` - View financial reports
- `users:manage:own` - Manage own profile

## Security Best Practices
1. **Never hardcode permissions** - Always read from role entities
2. **Principle of least privilege** - Grant minimum required permissions
3. **Regular audits** - Review role assignments periodically
4. **Separation of duties** - Critical actions require multiple roles
5. **Immutable audit trail** - All security events logged
6. **Token rotation** - Regular JWT refresh
7. **Secure defaults** - Deny by default, explicitly allow