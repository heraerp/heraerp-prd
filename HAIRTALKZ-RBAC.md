# HairTalkz RBAC (Role-Based Access Control) System

## Overview
HairTalkz implements a comprehensive RBAC system with JWT token-based authentication, role selection during login, and permission-based route protection.

## Authentication Flow

### 1. Login with Role Selection
Users can log in at `/salon/auth` and select their role:
- **Owner**: Full system access
- **Receptionist**: Front desk operations
- **Accountant**: Financial management
- **Admin**: System administration

### 2. JWT Token Assignment
Upon successful login, the system:
1. Updates user metadata with organization ID, role, and permissions
2. Stores role information in JWT token's `user_metadata`
3. Refreshes the session to ensure JWT contains updated metadata
4. Stores role and permissions in localStorage for quick access

### 3. Permission-Based Routing
Each role is automatically redirected to their default dashboard:
- **Owner** → `/salon/dashboard`
- **Receptionist** → `/salon/pos`
- **Accountant** → `/salon/finance`
- **Admin** → `/salon/settings`

## Role Permissions

### Owner Permissions
```javascript
[
  'view_dashboard',
  'view_financial_reports',
  'manage_appointments',
  'manage_customers',
  'manage_staff',
  'manage_inventory',
  'manage_services',
  'manage_settings',
  'export_data',
  'view_analytics',
  'manage_organization'
]
```

### Receptionist Permissions
```javascript
[
  'view_appointments',
  'create_appointments',
  'update_appointments',
  'cancel_appointments',
  'view_customers',
  'create_customers',
  'update_customers',
  'process_payments',
  'view_services',
  'view_staff_availability'
]
```

### Accountant Permissions
```javascript
[
  'view_financial_reports',
  'export_financial_data',
  'view_transactions',
  'manage_invoices',
  'view_expenses',
  'manage_expenses',
  'view_payroll',
  'generate_reports',
  'view_tax_reports',
  'manage_reconciliation'
]
```

### Admin Permissions
```javascript
[
  'manage_users',
  'manage_roles',
  'manage_permissions',
  'view_system_logs',
  'manage_integrations',
  'manage_backups',
  'manage_security',
  'view_audit_logs',
  'manage_organization_settings',
  'manage_api_keys'
]
```

## Using RBAC in Components

### 1. Permission Guard Component
Protect routes with required permissions:
```tsx
import { PermissionGuard } from '@/components/salon/auth/PermissionGuard'

<PermissionGuard requiredPermissions={['view_dashboard', 'manage_organization']}>
  <YourProtectedContent />
</PermissionGuard>
```

### 2. useHairTalkzRBAC Hook
Check permissions programmatically:
```tsx
import { useHairTalkzRBAC } from '@/hooks/useHairTalkzRBAC'

const { role, permissions, hasPermission, hasAnyPermission, hasAllPermissions } = useHairTalkzRBAC()

// Check single permission
if (hasPermission('manage_users')) {
  // Show admin features
}

// Check any of multiple permissions
if (hasAnyPermission(['view_financial_reports', 'export_data'])) {
  // Show financial features
}

// Check all permissions
if (hasAllPermissions(['manage_users', 'manage_roles'])) {
  // Show advanced admin features
}
```

### 3. Conditional Rendering
Show/hide UI elements based on permissions:
```tsx
{hasPermission('export_data') && (
  <Button onClick={exportData}>Export Report</Button>
)}
```

## JWT Token Structure

The JWT token includes:
```json
{
  "sub": "user-uuid",
  "email": "user@hairtalkz.ae",
  "user_metadata": {
    "organization_id": "378f24fb-d496-4ff7-8afa-ea34895a0eb8",
    "role": "owner",
    "roles": ["owner"],
    "permissions": ["view_dashboard", "manage_organization", ...],
    "full_name": "Michele Rodriguez"
  }
}
```

## Testing RBAC

### 1. Test JWT Assignment
```bash
cd scripts
node test-hairtalkz-jwt.js
```

### 2. Debug Authentication
Visit `/salon/debug` to see:
- Current session status
- JWT token contents
- LocalStorage values
- User metadata

### 3. Test Different Roles
Use the test accounts:
- **Owner**: owner@hairtalkz.ae / HairTalkz@2025
- **Receptionist**: receptionist@hairtalkz.ae / Reception@2025
- **Accountant**: accountant@hairtalkz.ae / Finance@2025
- **Admin**: admin@hairtalkz.ae / Admin@2025

## Security Best Practices

1. **Always verify permissions server-side** - Client-side checks are for UX only
2. **Use PermissionGuard** for route protection
3. **Check specific permissions** rather than just roles
4. **Log permission denials** for security auditing
5. **Refresh tokens regularly** to ensure updated permissions

## Troubleshooting

### Permission Not Working
1. Check JWT token in browser DevTools (Application > Storage > Local Storage)
2. Verify permissions are in user_metadata
3. Ensure PermissionGuard has correct permission names
4. Check console for permission denial logs

### Role Not Redirecting
1. Clear localStorage and re-login
2. Check role name matches exactly (case-sensitive)
3. Verify redirect paths in USER_ROLES configuration

### JWT Not Updated
1. Force refresh session after login
2. Clear all sessions and re-authenticate
3. Check Supabase logs for updateUser errors