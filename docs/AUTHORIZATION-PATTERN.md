# HERA Authorization Pattern - Implementation Guide

## 🔐 Overview

HERA uses a **Three-Layer Authorization Pattern** that ensures secure, consistent authentication across all pages and components. This pattern must be followed for ALL production pages (not progressive demo pages).

## 🎯 The Three-Layer Pattern

Every protected page/component MUST implement these three checks in order:

### Layer 1: Authentication Check (isAuthenticated)
```typescript
if (!isAuthenticated) {
  return <LoadingScreen /> // or redirect to login
}
```

### Layer 2: Context Loading Check (contextLoading)
```typescript
if (contextLoading) {
  return <LoadingScreen message="Loading organization context..." />
}
```

### Layer 3: Organization Check (organizationId)
```typescript
if (!organizationId) {
  return <NoOrganizationScreen /> // with setup button
}
```

## 📋 Complete Implementation Pattern

### For Page Components

```typescript
'use client'

import { useAuth } from '@/components/auth/DualAuthProvider'
import { useUserContext } from '@/hooks/useUserContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building, Loader2 } from 'lucide-react'

export default function ProductionPage() {
  // ALWAYS use both hooks
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading, error: contextError } = useUserContext()

  // Layer 1: Authentication Check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Please log in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Layer 2: Context Loading Check
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading organization context...</p>
        </div>
      </div>
    )
  }

  // Handle context error (optional but recommended)
  if (contextError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Error loading user context: {contextError}
          </AlertDescription>
          <button
            onClick={() => window.location.href = '/get-started'}
            className="mt-4 px-4 py-2 bg-primary text-white rounded"
          >
            Setup Organization
          </button>
        </Alert>
      </div>
    )
  }

  // Layer 3: Organization Check
  if (!organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <Building className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Organization Found</h2>
          <p className="text-gray-600 mb-6">
            Please complete your organization setup to access this feature.
          </p>
          <button
            onClick={() => window.location.href = '/get-started'}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Setup Organization
          </button>
        </div>
      </div>
    )
  }

  // Main content - only renders if all checks pass
  return (
    <div className="container mx-auto p-6">
      <h1>Protected Content</h1>
      <p>Organization: {userContext?.organization?.name}</p>
      <p>User: {userContext?.user?.name}</p>
      {/* Your page content here */}
    </div>
  )
}
```

### For Wrapper Pages (Minimal Pattern)

If you have a page that only wraps another component:

```typescript
'use client'

import { useAuth } from '@/components/auth/DualAuthProvider'
import { useUserContext } from '@/hooks/useUserContext'
import { Alert } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { ActualComponent } from './ActualComponent'

export default function WrapperPage() {
  const { isAuthenticated } = useAuth()
  const { organizationId, loading: contextLoading } = useUserContext()

  if (!isAuthenticated) {
    return (
      <Alert className="m-4">
        <AlertDescription>Please log in to access this page.</AlertDescription>
      </Alert>
    )
  }

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!organizationId) {
    return (
      <Alert className="m-4">
        <AlertDescription>
          No organization context found. Please complete setup.
        </AlertDescription>
      </Alert>
    )
  }

  return <ActualComponent />
}
```

## 🚫 Common Mistakes to Avoid

### ❌ DON'T: Skip the context loading check
```typescript
// WRONG - Will cause infinite loading
export default function BadPage() {
  const { isAuthenticated } = useAuth()
  const { organizationId } = useUserContext()

  if (!isAuthenticated) return <div>Please login</div>
  if (!organizationId) return <div>No org</div> // Never reached if context is loading
  
  return <div>Content</div>
}
```

### ❌ DON'T: Only check authentication
```typescript
// WRONG - No organization validation
export default function BadPage() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return <div>Please login</div>
  
  return <div>Content</div> // May not have org context!
}
```

### ❌ DON'T: Mix authentication patterns
```typescript
// WRONG - Inconsistent checks
export default function BadPage() {
  const { user } = useAuth() // Using user instead of isAuthenticated
  
  if (!user) return <div>Please login</div>
  
  // Missing context checks entirely
  return <div>Content</div>
}
```

## 🎯 When to Use This Pattern

### ✅ Use for ALL Production Pages:
- `/salon/*` - All salon management pages
- `/restaurant/*` - All restaurant pages
- `/dashboard` - Main dashboard
- `/financial/*` - Financial management
- `/healthcare/*` - Healthcare pages
- `/jewelry/*` - Jewelry management
- Any other business-specific pages

### ❌ DON'T Use for:
- `/` - Homepage (public)
- `/auth/*` - Authentication pages
- `/get-started` - Onboarding flow
- `/select-app` - App selection
- `/*-progressive` - Demo/trial pages
- Public marketing pages

## 🔄 Auth Callback Flow

The auth callback should redirect to `/select-app` NOT directly to dashboard:

```typescript
// src/app/auth/callback/page.tsx
setTimeout(() => {
  router.push('/select-app') // NOT '/dashboard'
}, 1000)
```

## 📊 Complete Flow Diagram

```
User Login
    ↓
Auth Callback (/auth/callback)
    ↓
Select App (/select-app) ← Checks for existing orgs
    ↓
If no org → Onboarding (/onboarding)
If has org → App Dashboard (/salon, /restaurant, etc.)
    ↓
Every page checks: Auth → Context → Organization
```

## 🛠️ Helper Functions

### Check Authorization Status
```typescript
export function useAuthorizationStatus() {
  const { isAuthenticated } = useAuth()
  const { organizationId, loading, error } = useUserContext()

  return {
    isFullyAuthorized: isAuthenticated && !loading && !!organizationId,
    isLoading: loading,
    needsAuth: !isAuthenticated,
    needsOrg: isAuthenticated && !loading && !organizationId,
    hasError: !!error
  }
}
```

### Authorization HOC (Higher Order Component)
```typescript
export function withAuthorization(Component: React.ComponentType) {
  return function AuthorizedComponent(props: any) {
    const { isAuthenticated } = useAuth()
    const { organizationId, loading: contextLoading } = useUserContext()

    if (!isAuthenticated) {
      return <AuthRequiredScreen />
    }

    if (contextLoading) {
      return <LoadingScreen />
    }

    if (!organizationId) {
      return <OrganizationRequiredScreen />
    }

    return <Component {...props} />
  }
}
```

## 🔍 Testing Authorization

### Manual Testing Checklist:
1. **Not logged in**: Should show login prompt
2. **Logged in, no org**: Should show organization setup
3. **Context loading**: Should show loading spinner
4. **Context error**: Should show error with recovery option
5. **Fully authorized**: Should show page content

### Test Scenarios:
```typescript
// Test 1: New user flow
1. Logout completely
2. Visit protected page → Should redirect to login
3. Login → Should go to select-app
4. No orgs → Should go to onboarding

// Test 2: Existing user flow
1. Login with org user
2. Visit protected page → Should load after context
3. Check org name displays correctly

// Test 3: Error handling
1. Simulate API failure in user-context
2. Should show error screen with setup button
```

## 📝 Summary

The Three-Layer Authorization Pattern ensures:
1. **Security**: No unauthorized access to org data
2. **UX**: Clear loading states and error messages
3. **Consistency**: Same pattern everywhere
4. **Maintainability**: Easy to update auth logic

**Remember**: ALWAYS implement all three layers for production pages!