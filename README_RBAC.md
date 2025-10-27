# HERA V2 Role-Based Access Control (RBAC) System

## Overview

A comprehensive role-based access control system for HERA V2, implementing SAP Fiori design patterns with enterprise-grade security and intuitive user experience.

## 🏗️ Architecture

```
Business Role → Space → Page → Section → Tile
     ↓           ↓       ↓        ↓       ↓
  Executive → Finance → Invoice → Approve → Process
```

## 🚀 Quick Start

### 1. Protect a Page
```tsx
import { ProtectedPage } from '@/components/rbac/ProtectedPage'

<ProtectedPage requiredSpace="finance">
  <YourFinanceComponent />
</ProtectedPage>
```

### 2. Use Access Control Hook
```tsx
import { useAccessControl } from '@/hooks/useAccessControl'

const { hasPermission, hasRole } = useAccessControl({ userId })
```

### 3. Add Role-Based Navigation
```tsx
import { RoleBasedNavigation } from '@/components/rbac/RoleBasedNavigation'

<RoleBasedNavigation />
```

## 📁 Project Structure

```
src/
├── types/rbac.ts                    # TypeScript definitions
├── services/AccessControlService.ts # Core RBAC logic
├── hooks/useAccessControl.ts        # React integration
├── components/
│   ├── rbac/
│   │   ├── RoleBasedNavigation.tsx # Dynamic navigation
│   │   └── ProtectedPage.tsx       # Access control wrappers
│   └── modules/
│       └── ModuleHomePage.tsx      # Role-aware module pages
├── app/enterprise/
│   ├── admin/roles/               # Admin interface
│   ├── finance/home/              # Finance module
│   ├── sales/home/                # Sales module  
│   ├── hr/home/                   # HR module
│   └── materials/home/            # Materials module
└── docs/
    ├── RBAC_DOCUMENTATION.md      # Complete documentation
    └── RBAC_QUICK_REFERENCE.md    # Developer quick reference
```

## 🔑 Key Features

### ✅ Hierarchical Access Control
- **Business Roles**: Finance Manager, Sales Rep, HR Specialist
- **Spaces**: Module-level access (Finance, Sales, HR, Materials)
- **Pages**: Feature-level access (Invoices, Orders, Employees)
- **Sections**: Area-level access (Approval Queue, Reports)
- **Tiles**: Action-level access (Process, Approve, View)

### ✅ Dynamic Navigation
- Shows only accessible modules
- Role-specific quick actions
- Pending approval badges
- Contextual user information

### ✅ Granular Permissions
```typescript
// Resource-based permissions
'finance.invoices'      // Invoice management
'finance.invoices.approve' // Invoice approval
'sales.orders'          // Order management
'hr.payroll'           // Payroll access
```

### ✅ React Integration
```tsx
// Hook-based access control
const { canAccessSpace, hasPermission, hasRole } = useAccessControl({ userId })

// Component-based protection
<ProtectedSection requiredRoles={["finance_manager"]}>
  <SensitiveContent />
</ProtectedSection>
```

### ✅ Administrative Interface
- User role management at `/enterprise/admin/roles`
- Role assignment workflow
- Pending request approvals
- Permission auditing

## 👥 Supported Roles

### Finance
- **Finance Manager**: Full module access, approvals
- **AP Clerk**: Invoice processing
- **AR Clerk**: Payment management
- **Financial Analyst**: Reports and analysis

### Sales  
- **Sales Manager**: Team management, approvals
- **Sales Rep**: Customer and order management
- **Customer Service**: Support functions

### HR
- **HR Manager**: Full HR access
- **HR Specialist**: Employee management
- **Payroll Admin**: Payroll processing

### Materials
- **Procurement Specialist**: Purchase management
- **Inventory Manager**: Stock control
- **Warehouse Operator**: Operations

### Executive
- **Executive**: Read access to all modules
- **System Admin**: Full system access
- **Auditor**: Compliance and audit access

## 🛡️ Security Features

### Defense in Depth
- **Authentication**: Login required
- **Authorization**: Role-based access
- **Page Protection**: Route-level security
- **Section Protection**: Component-level security
- **API Security**: Server-side validation (recommended)

### Fail-Safe Defaults
- Default deny access
- Graceful error handling
- Clear access denial messages
- Navigation alternatives

### Performance Optimization
- Map-based caching
- Lazy loading of accessible content
- Batch permission checks
- Optimized re-renders

## 📖 Documentation

### For Developers
- **[Quick Reference](docs/RBAC_QUICK_REFERENCE.md)** - Common patterns and examples
- **[Full Documentation](docs/RBAC_DOCUMENTATION.md)** - Complete implementation guide

### For Administrators
- **Admin Interface**: Navigate to `/enterprise/admin/roles`
- **Role Management**: Assign/remove user roles
- **Approval Workflow**: Handle access requests

## 🎯 Usage Examples

### Module Home Page
```tsx
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'

export default function FinanceHome() {
  const data = {
    moduleTitle: "Finance",
    breadcrumb: "Financial Accounting (FI)",
    sections: [
      {
        title: "Financial Documents",
        requiredPermissions: ["finance.invoices"],
        items: [
          {
            title: "Process Invoices",
            requiredRoles: ["accounts_payable_clerk"],
            href: "/finance/invoices",
            badge: "24"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="finance">
      <ModuleHomePage {...data} />
    </ProtectedPage>
  )
}
```

### Custom Access Control
```tsx
function InvoiceManagement() {
  const { hasPermission, hasRole } = useAccessControl({ userId })
  
  return (
    <div>
      {hasPermission('finance.invoices') && (
        <InvoiceList />
      )}
      
      {hasRole('finance_manager') && (
        <ApprovalQueue />
      )}
      
      {hasPermission('finance.invoices.approve') && (
        <BulkApprovalTools />
      )}
    </div>
  )
}
```

### Navigation Integration
```tsx
// Replace standard navigation
import { RoleBasedNavigation } from '@/components/rbac/RoleBasedNavigation'

export default function Layout({ children }) {
  return (
    <div>
      <RoleBasedNavigation />
      <main>{children}</main>
    </div>
  )
}
```

## 🧪 Testing

```tsx
import { render } from '@testing-library/react'

// Test role-based access
test('finance manager sees approval section', () => {
  const { getByText } = renderWithRoles(<FinancePage />, ['finance_manager'])
  expect(getByText('Approval Queue')).toBeInTheDocument()
})

test('sales rep gets access denied for finance', () => {
  const { getByText } = renderWithRoles(<FinancePage />, ['sales_rep'])
  expect(getByText('Access Denied')).toBeInTheDocument()
})
```

## 🚀 Deployment

### Environment Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Access admin interface
http://localhost:3000/enterprise/admin/roles
```

### Production Considerations
- Implement server-side permission validation
- Set up role synchronization with identity provider
- Configure audit logging
- Implement session management
- Set up monitoring and alerts

## 🔧 Configuration

### Role Definitions
Edit `src/services/AccessControlService.ts` to:
- Add new business roles
- Define permissions
- Configure module access
- Set up approval workflows

### Custom Permissions
Add to `src/types/rbac.ts`:
```typescript
const PERMISSION_RESOURCES = {
  'your_module.your_resource': 'Description',
  // ...
}
```

### Module Integration
1. Create module home page with `ModuleHomePage`
2. Add role-based sections and tiles
3. Wrap with `ProtectedPage`
4. Update navigation links

## 📞 Support

- **Issues**: Create GitHub issue
- **Documentation**: See `/docs` folder
- **Admin Access**: `/enterprise/admin/roles`
- **Contact**: HERA Development Team

## 🎉 Benefits

### For Users
- **Intuitive**: Only see what you can access
- **Fast**: Optimized performance with caching
- **Secure**: Enterprise-grade access control
- **Clear**: Helpful error messages and guidance

### For Developers  
- **Easy**: Simple React hooks and components
- **Typed**: Full TypeScript support
- **Flexible**: Granular permission control
- **Testable**: Built-in testing patterns

### For Administrators
- **Powerful**: Complete role management interface
- **Efficient**: Bulk operations and workflows
- **Auditable**: Full access tracking
- **Scalable**: Handles large user bases

---

**Get Started**: Check out the [Quick Reference](docs/RBAC_QUICK_REFERENCE.md) for common patterns and examples.

**Need Help?**: See the [Full Documentation](docs/RBAC_DOCUMENTATION.md) for detailed implementation guidance.