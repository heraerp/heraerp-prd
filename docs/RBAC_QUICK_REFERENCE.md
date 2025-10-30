# HERA V2 RBAC Quick Reference

## 🚀 Quick Start

### 1. Protect a Page
```tsx
import { ProtectedPage } from '@/components/rbac/ProtectedPage'

<ProtectedPage requiredSpace="finance">
  <YourComponent />
</ProtectedPage>
```

### 2. Protect a Section
```tsx
import { ProtectedSection } from '@/components/rbac/ProtectedPage'

<ProtectedSection requiredPermissions={["finance.approve"]}>
  <SensitiveContent />
</ProtectedSection>
```

### 3. Check Access in Component
```tsx
import { useAccessControl } from '@/hooks/useAccessControl'

const { canAccessSpace, hasPermission, hasRole } = useAccessControl({ userId })

if (hasPermission('finance.invoices')) {
  // Show invoice management
}
```

---

## 📋 Common Patterns

### Page-Level Protection
```tsx
// Finance module access
<ProtectedPage requiredSpace="finance" requiredPermissions={["finance.invoices"]}>

// Sales module access  
<ProtectedPage requiredSpace="sales" requiredPermissions={["sales.orders"]}>

// Admin access
<ProtectedPage requiredPermissions={["system.admin"]}>

// Role-specific access
<ProtectedPage requiredRoles={["finance_manager"]}>
```

### Section-Level Protection
```tsx
// Manager-only sections
<ProtectedSection requiredRoles={["finance_manager"]}>
  <ManagerDashboard />
</ProtectedSection>

// Permission-based sections
<ProtectedSection requiredPermissions={["finance.approve"]}>
  <ApprovalQueue />
</ProtectedSection>

// Multiple requirements
<ProtectedSection 
  requiredPermissions={["finance.reports"]} 
  requiredRoles={["finance_manager"]}
>
  <ExecutiveReports />
</ProtectedSection>
```

### Conditional Rendering
```tsx
const { hasPermission, hasRole } = useAccessControl({ userId })

return (
  <div>
    {hasPermission('finance.invoices') && <InvoiceButton />}
    {hasRole('finance_manager') && <ManagerTools />}
    {hasPermission('finance.approve') && <ApprovalBadge count={12} />}
  </div>
)
```

---

## 🔑 Permission Resources

### Finance
- `finance.invoices` - Invoice management
- `finance.payments` - Payment processing
- `finance.reports` - Financial reports
- `finance.assets` - Fixed assets
- `finance.gl` - General ledger

### Sales
- `sales.orders` - Order management
- `sales.quotes` - Quotation management
- `sales.customers` - Customer management
- `sales.crm` - CRM activities
- `sales.reports` - Sales reports

### HR
- `hr.employees` - Employee management
- `hr.payroll` - Payroll processing
- `hr.benefits` - Benefits administration
- `hr.recruitment` - Recruitment process
- `hr.performance` - Performance management

### Materials
- `materials.procurement` - Procurement
- `materials.inventory` - Inventory management
- `materials.vendors` - Vendor management
- `materials.reports` - Inventory reports

### System
- `system.admin` - System administration
- `system.audit` - System audit
- `system.config` - System configuration

---

## 👥 Business Roles

### Finance
- `accounts_payable_clerk` - Process invoices and payments
- `accounts_receivable_clerk` - Manage customer payments
- `financial_analyst` - Financial analysis and reporting
- `finance_manager` - Full finance module access
- `cfo` - Executive finance access

### Sales
- `sales_rep` - Customer management and orders
- `sales_manager` - Team management and approvals
- `sales_director` - Strategic sales oversight
- `customer_service` - Customer support

### HR
- `hr_specialist` - Employee record management
- `hr_manager` - HR process management
- `payroll_admin` - Payroll processing
- `recruitment_specialist` - Hiring processes

### Materials
- `procurement_specialist` - Purchase management
- `inventory_manager` - Stock management
- `warehouse_operator` - Warehouse operations

### Admin
- `system_admin` - Full system access
- `executive` - Read access to all modules
- `auditor` - Audit and compliance access

---

## 🛠️ Module Home Page Setup

### Basic Setup
```tsx
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'

export default function FinanceHome() {
  const financeData = {
    moduleTitle: "Finance",
    breadcrumb: "Financial Accounting (FI)",
    overview: { /* KPI data */ },
    sections: [
      {
        title: "Financial Documents",
        requiredPermissions: ["finance.invoices"], // Section-level protection
        items: [
          {
            title: "Process Invoices",
            subtitle: "Accounts Payable", 
            icon: FileText,
            href: "/finance/invoices",
            requiredPermissions: ["finance.invoices"], // Tile-level protection
            badge: "24"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="finance"> {/* Page-level protection */}
      <ModuleHomePage {...financeData} />
    </ProtectedPage>
  )
}
```

### Advanced Section Configuration
```tsx
const sections = [
  {
    title: "Financial Documents",
    requiredPermissions: ["finance.invoices"],
    items: [
      {
        title: "Process Invoices",
        requiredRoles: ["accounts_payable_clerk"],
        href: "/finance/ap/invoices",
        badge: "24"
      },
      {
        title: "Approve Payments", 
        requiredRoles: ["finance_manager"],
        href: "/finance/ap/approve",
        badge: "7"
      }
    ]
  },
  {
    title: "Management Reports",
    requiredRoles: ["finance_manager", "cfo"],
    items: [
      {
        title: "Executive Dashboard",
        requiredRoles: ["cfo"],
        href: "/finance/executive"
      }
    ]
  }
]
```

---

## 🎯 Access Control Hooks

### useAccessControl Hook
```tsx
const {
  userRoles,          // BusinessRole[] - User's roles
  accessibleSpaces,   // Space[] - Accessible modules
  canAccessSpace,     // (spaceId: string) => boolean
  canAccessPage,      // (pageId: string) => boolean  
  hasPermission,      // (resource: string, action?: string) => boolean
  hasRole,           // (roleId: string) => boolean
  isLoading,         // boolean - Loading state
  refreshAccess      // () => void - Refresh permissions
} = useAccessControl({ userId })
```

### Custom Finance Hook Example
```tsx
function useFinanceAccess(userId: string) {
  const { hasPermission, hasRole } = useAccessControl({ userId })
  
  return {
    canViewInvoices: hasPermission('finance.invoices'),
    canApproveInvoices: hasPermission('finance.invoices') && hasRole('finance_manager'),
    canAccessReports: hasPermission('finance.reports'),
    isManager: hasRole('finance_manager')
  }
}
```

---

## 🚨 Error Handling

### Access Denied States
```tsx
// Automatic error pages
<ProtectedPage requiredSpace="finance">
  {/* Shows access denied if user lacks finance access */}
</ProtectedPage>

// Custom error handling
<ProtectedPage 
  requiredSpace="finance"
  fallbackComponent={<CustomAccessDenied />}
>

// Silent failure (hide component)
<ProtectedSection 
  requiredPermissions={["finance.approve"]}
  showPlaceholder={false}
>
```

---

## ⚡ Performance Tips

### Caching
```tsx
// Access checks are cached automatically
// Clear cache when roles change
const { refreshAccess } = useAccessControl({ userId })

// After role assignment
refreshAccess()
```

### Batch Checks
```tsx
// Check multiple permissions efficiently
const permissions = ['finance.read', 'finance.write', 'finance.approve']
const hasAllPermissions = permissions.every(p => hasPermission(p))
```

### Lazy Loading
```tsx
// Only load content user can access
const { accessibleSpaces } = useAccessControl({ userId })
const financeSpace = accessibleSpaces.find(s => s.id === 'finance')

if (financeSpace) {
  // Load finance components
}
```

---

## 🧪 Testing

### Test Role-Based Components
```tsx
import { render } from '@testing-library/react'
import { AccessControlProvider } from '@/contexts/AccessControlContext'

const renderWithRoles = (component, roles = []) => {
  return render(
    <AccessControlProvider userRoles={roles}>
      {component}
    </AccessControlProvider>
  )
}

// Test access scenarios
test('finance manager sees approval section', () => {
  renderWithRoles(<FinancePage />, ['finance_manager'])
  expect(screen.getByText('Approval Queue')).toBeInTheDocument()
})

test('sales rep cannot see finance content', () => {
  renderWithRoles(<FinancePage />, ['sales_rep'])
  expect(screen.getByText('Access Denied')).toBeInTheDocument()
})
```

---

## 🔧 Admin Operations

### Role Assignment
```tsx
// Access admin interface at /enterprise/admin/roles
// Features:
// - User role management
// - Pending approval requests  
// - Role definition management
// - Permission auditing
```

### Bulk Operations
```tsx
// Assign role to multiple users
users.forEach(user => {
  accessService.assignRole(user.id, 'finance_manager')
})

// Remove role from users
accessService.removeRole(userId, 'old_role')
```

---

## 📱 Navigation Integration

### Replace Standard Navigation
```tsx
// Old
<StandardNavigation />

// New - shows only accessible modules
<RoleBasedNavigation />
```

### Custom Navigation
```tsx
const { accessibleSpaces } = useAccessControl({ userId })

return (
  <nav>
    {accessibleSpaces.map(space => (
      <NavItem key={space.id} href={space.href}>
        {space.name}
      </NavItem>
    ))}
  </nav>
)
```

---

## 📞 Support

**Documentation**: `/docs/RBAC_DOCUMENTATION.md`  
**Source Code**: `/src/components/rbac/`  
**Admin Interface**: `/enterprise/admin/roles`  
**Team Contact**: HERA Development Team

---

**Quick Links**:
- [Full Documentation](./RBAC_DOCUMENTATION.md)
- [Type Definitions](../src/types/rbac.ts)
- [Access Control Service](../src/services/AccessControlService.ts)
- [React Hooks](../src/hooks/useAccessControl.ts)