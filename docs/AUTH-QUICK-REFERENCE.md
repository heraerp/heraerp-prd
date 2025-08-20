# HERA Auth Quick Reference Card

## 🚀 Copy-Paste Template for Protected Pages

```typescript
'use client'

import { useAuth } from '@/components/auth/DualAuthProvider'
import { useUserContext } from '@/hooks/useUserContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building, Loader2 } from 'lucide-react'

export default function YourPageName() {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()

  // Layer 1: Auth Check
  if (!isAuthenticated) {
    return (
      <Alert className="m-4">
        <AlertDescription>Please log in to access this page.</AlertDescription>
      </Alert>
    )
  }

  // Layer 2: Loading Check
  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Layer 3: Org Check
  if (!organizationId) {
    return (
      <Alert className="m-4">
        <AlertDescription>No organization context found.</AlertDescription>
      </Alert>
    )
  }

  // Your actual page content
  return (
    <div>
      {/* Page content here */}
    </div>
  )
}
```

## ⚡ Essential Imports

```typescript
import { useAuth } from '@/components/auth/DualAuthProvider'
import { useUserContext } from '@/hooks/useUserContext'
```

## 🔍 Available Data from Hooks

### From useAuth():
- `isAuthenticated` - Boolean, true if user is logged in
- `user` - Supabase user object
- `session` - Current session with tokens
- `isLoading` - Auth loading state
- `login(email, password)` - Login function
- `logout()` - Logout function

### From useUserContext():
- `organizationId` - Current organization ID
- `userContext` - Full context object with:
  - `user` - HERA user entity
  - `organization` - Current organization
  - `permissions` - User permissions array
- `loading` - Context loading state
- `error` - Any error message

## 🎯 Common Patterns

### Check specific role:
```typescript
const userRole = userContext?.user?.role
if (userRole !== 'admin') {
  return <Alert>Admin access required</Alert>
}
```

### Get organization name:
```typescript
const orgName = userContext?.organization?.name || 'Unknown'
```

### Check permissions:
```typescript
const canEdit = userContext?.permissions?.includes('entities:write')
```

## 🚫 DON'T FORGET

1. **ALWAYS** check all 3 layers in order
2. **NEVER** skip the loading check
3. **ALWAYS** handle the no-organization case
4. Use this pattern for ALL production pages

## 📱 Business-Specific Redirects

After login, users are redirected based on business type:

| Business Type | Redirect Path |
|--------------|---------------|
| salon | /salon |
| restaurant | /restaurant |
| healthcare | /healthcare |
| jewelry | /jewelry-progressive |
| manufacturing | /dashboard |
| professional | /dashboard |

## 🔄 Auth Flow URLs

- Login: `/auth/login`
- Register: `/auth/register`
- Callback: `/auth/callback`
- Select App: `/select-app`
- Onboarding: `/onboarding`
- Get Started: `/get-started`