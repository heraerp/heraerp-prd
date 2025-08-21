# 🏢 HERA Multi-Tenant SaaS Authentication Guide

**CRITICAL**: This is the ONLY authentication system to use in HERA. All old auth components have been deprecated.

## 🚨 ALWAYS USE THESE COMPONENTS

### 1. **MultiOrgAuthProvider** (REQUIRED)
**Location**: `src/components/auth/MultiOrgAuthProvider.tsx`
**Usage**: Wrap your entire app with this provider

```typescript
// app/layout.tsx or _app.tsx
import { MultiOrgAuthProvider } from '@/components/auth/MultiOrgAuthProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <MultiOrgAuthProvider>
          {children}
        </MultiOrgAuthProvider>
      </body>
    </html>
  )
}
```

### 2. **useMultiOrgAuth Hook** (REQUIRED)
**Usage**: Access authentication state in any component

```typescript
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

function MyComponent() {
  const { 
    user,                    // Current authenticated user
    organizations,           // All user's organizations
    currentOrganization,     // Currently selected organization
    isAuthenticated,         // Boolean auth status
    isLoading,              // Loading state
    switchOrganization,      // Switch between orgs
    createOrganization,      // Create new org
    signOut                 // Sign out user
  } = useMultiOrgAuth()

  // ALWAYS check authentication
  if (!isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  // ALWAYS check organization context  
  if (!currentOrganization) {
    router.push('/auth/organizations')
    return null
  }

  // Your component logic here
}
```

## 🌐 SaaS Authentication Flow

### Production URLs
- **Auth Hub**: `app.heraerp.com` - Central authentication
- **Organizations**: `{subdomain}.heraerp.com` - Organization-specific access

### Development URLs  
- **Auth Hub**: `localhost:3000/auth/*` - Authentication pages
- **Organizations**: `localhost:3000/~{subdomain}/*` - Organization access

### Complete User Journey
1. **Landing** → `app.heraerp.com` or `/auth/landing`
2. **Signup** → `/auth/signup` (3-step process)
3. **Login** → `/auth/login` 
4. **Org Selection** → `/auth/organizations` (if multiple orgs)
5. **Create Org** → `/auth/organizations/new`
6. **App Selection** → `/auth/organizations/{id}/apps`
7. **Dashboard** → `{subdomain}.heraerp.com` or `/~{subdomain}`

## 🏗️ Implementation Patterns

### Page-Level Authentication
```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

export default function MyPage() {
  const router = useRouter()
  const { user, currentOrganization, isAuthenticated, isLoading } = useMultiOrgAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login')
        return
      }
      
      if (!currentOrganization) {
        router.push('/auth/organizations')
        return
      }
    }
  }, [isAuthenticated, currentOrganization, isLoading, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated || !currentOrganization) {
    return null
  }

  return (
    <div>
      <h1>Welcome to {currentOrganization.name}</h1>
      {/* Your page content */}
    </div>
  )
}
```

### API Calls with Organization Context
```typescript
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { universalApi } from '@/lib/universal-api'

function useCustomerData() {
  const { currentOrganization } = useMultiOrgAuth()

  const createCustomer = async (customerData) => {
    // ALWAYS include organization_id
    return await universalApi.createEntity({
      ...customerData,
      entity_type: 'customer',
      organization_id: currentOrganization.id  // CRITICAL
    })
  }

  const getCustomers = async () => {
    // Organization filtering is automatic in API
    return await universalApi.getEntities({
      entity_type: 'customer'
      // organization_id automatically added by API
    })
  }

  return { createCustomer, getCustomers }
}
```

## 🎨 UI Pages Reference

### Available Pages
All pages use modern SaaS design with gradient backgrounds and card layouts:

- **`/auth/landing`** - Marketing page with hero section
- **`/auth/signup`** - 3-step signup (account → profile → organization)  
- **`/auth/login`** - Simple login form
- **`/auth/organizations`** - Organization selector with beautiful cards
- **`/auth/organizations/new`** - Create organization with subdomain checking
- **`/auth/organizations/[id]/apps`** - App selection for new organizations
- **`/org`** - Organization dashboard (post-subdomain routing)

### Design System
- **Colors**: Blue/purple/slate gradient theme
- **Layout**: Card-based with hover effects
- **Responsive**: Mobile-first design
- **Loading States**: Branded loading animations
- **Error Handling**: User-friendly error messages

## 🔧 API Endpoints

### Organization Management
- **GET** `/api/v1/organizations` - List user's organizations
- **POST** `/api/v1/organizations` - Create new organization
- **GET** `/api/v1/organizations/check-subdomain?subdomain=...` - Check availability
- **GET** `/api/v1/organizations/[id]/apps` - Get installed apps
- **POST** `/api/v1/organizations/[id]/apps` - Install apps

### Database Functions
Located in `database/functions/organizations/`:
- `create_organization_with_owner()` - Creates org with owner membership
- `get_user_organizations()` - Lists all user organizations with roles
- `check_subdomain_availability()` - Validates subdomain uniqueness

## 🛡️ Security Features

### Multi-Tenant Isolation
- **Organization-based RLS** - Database-level data isolation
- **Subdomain routing** - URL-based organization detection  
- **JWT organization context** - Tokens include organization_id
- **Perfect separation** - Zero data leakage between organizations

### Permission System
- **Role-based access** - Owner, Admin, User roles per organization
- **Dynamic permissions** - Stored as relationships in universal tables
- **Inheritance** - Permissions can be inherited from organization roles

## 🚫 DEPRECATED - DO NOT USE

### Old Components (DELETED)
- ❌ `DualAuthProvider` - Replaced by MultiOrgAuthProvider
- ❌ `AuthGuard` - Built into pages now
- ❌ `ProtectedRoute` - Use page-level auth checks
- ❌ Any component in `src/components/auth/` except MultiOrgAuthProvider

### Old Patterns (FORBIDDEN)
- ❌ Single-tenant authentication
- ❌ Hardcoded organization IDs
- ❌ Bypassing organization_id filtering
- ❌ Manual auth state management
- ❌ Direct Supabase auth usage (use through MultiOrgAuthProvider)

## 🔄 Migration Guide

### From Old Auth System
1. **Replace DualAuthProvider** → MultiOrgAuthProvider
2. **Update all auth hooks** → useMultiOrgAuth  
3. **Add organization checks** → Check currentOrganization
4. **Update API calls** → Include organization_id
5. **Test isolation** → Verify no data leakage between orgs

### Testing Multi-Tenancy
1. Create multiple organizations
2. Switch between them
3. Verify complete data isolation
4. Test subdomain routing (if using production)
5. Confirm no data leakage

## 📚 Examples

### Complete Component
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { universalApi } from '@/lib/universal-api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CustomersPage() {
  const { currentOrganization, isAuthenticated } = useMultiOrgAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentOrganization) {
      loadCustomers()
    }
  }, [currentOrganization])

  const loadCustomers = async () => {
    try {
      const data = await universalApi.getEntities({
        entity_type: 'customer'
        // organization_id automatically filtered
      })
      setCustomers(data)
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCustomer = async () => {
    const newCustomer = await universalApi.createEntity({
      entity_type: 'customer',
      entity_name: 'New Customer',
      organization_id: currentOrganization.id // REQUIRED
    })
    setCustomers([...customers, newCustomer])
  }

  if (!isAuthenticated || !currentOrganization) {
    return <div>Please authenticate and select organization</div>
  }

  return (
    <div className="p-6">
      <h1>Customers for {currentOrganization.name}</h1>
      <Button onClick={createCustomer}>Add Customer</Button>
      
      <div className="grid gap-4 mt-6">
        {customers.map(customer => (
          <Card key={customer.id} className="p-4">
            <h3>{customer.entity_name}</h3>
            <p>Organization: {customer.organization_id}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

---

## 🎯 Summary

**ALWAYS USE**: MultiOrgAuthProvider + useMultiOrgAuth hook  
**ALWAYS INCLUDE**: organization_id in all API calls  
**ALWAYS CHECK**: isAuthenticated + currentOrganization  
**NEVER USE**: Old auth components or single-tenant patterns  

This multi-tenant SaaS architecture ensures perfect data isolation, scalable organization management, and modern user experience across all business types.