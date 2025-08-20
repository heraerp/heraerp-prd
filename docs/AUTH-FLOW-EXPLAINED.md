# HERA User Authentication Flow Explained

## 🔐 Overview

HERA uses a **dual authentication system** that combines:
1. **Supabase Auth** - For user authentication and session management
2. **HERA Context** - For organization and business-specific data

## 📊 Authentication Flow Diagram

```
┌─────────────────┐
│   User Login    │
│ (email/password)│
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  1. SUPABASE AUTH       │
├─────────────────────────┤
│ • Validates credentials │
│ • Creates JWT token     │
│ • Returns session       │
│ • Basic user metadata   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  2. HERA CONTEXT LOAD   │
├─────────────────────────┤
│ • Fetches user entity   │
│ • Gets organization     │
│ • Loads permissions     │
│ • Gets dynamic fields   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  3. APP AUTHENTICATION  │
├─────────────────────────┤
│ • Checks organization   │
│ • Validates roles       │
│ • Routes to app/onboard │
│ • Shows loading state   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  4. AUTHORIZED ACCESS   │
├─────────────────────────┤
│ • Salon Dashboard       │
│ • Restaurant POS        │
│ • Healthcare Records    │
│ • Jewelry Inventory     │
└─────────────────────────┘
```

## 🚀 Step-by-Step Flow

### Step 1: Supabase Authentication
```typescript
// User enters credentials
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Returns:
{
  session: {
    access_token: "eyJhbGc...",  // JWT token
    user: {
      id: "uuid-123",
      email: "user@example.com",
      user_metadata: { name: "John Doe" }
    }
  }
}
```

### Step 2: HERA Context Loading
```typescript
// Automatically called after Supabase login
const response = await fetch('/api/v1/auth/user-context', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})

// Returns enhanced context:
{
  user: {
    id: "entity-uuid",           // HERA entity ID
    email: "user@example.com",
    name: "John Doe",
    role: "manager",             // From dynamic fields
    department: "Sales",
    phone: "+1234567890"
  },
  organization: {
    id: "org-uuid",
    name: "ABC Salon"
  },
  permissions: ["entities:read", "entities:write", ...]
}
```

### Step 3: App-Level Authentication
```typescript
// UniversalAuthenticatedLayout checks:
if (!isAuthenticated) {
  // Redirect to login
  router.push('/auth/login')
} else if (!organization?.id) {
  // Redirect to onboarding
  router.push('/onboarding')
} else if (requiredRole && !roles.includes(userRole)) {
  // Redirect to dashboard with error
  router.push('/dashboard')
}
```

### Step 4: Authorized App Access
```typescript
// User now has access to specific app
<SalonAuthLayout>
  <SalonDashboard />  // Full access with org context
</SalonAuthLayout>
```

## 🔍 Key Components

### DualAuthProvider
- Manages both Supabase and HERA authentication state
- Listens for auth changes (login, logout, token refresh)
- Provides unified auth context to entire app

### UniversalAuthenticatedLayout
- Enforces authentication requirements
- Checks organization membership
- Validates role-based access
- Shows appropriate loading states

### App-Specific Auth Layouts
- Branded loading screens (Salon, Restaurant, etc.)
- App-specific role requirements
- Custom redirect paths

## 🛡️ Security Features

1. **Multi-Tenant Isolation**
   - Every request filtered by organization_id
   - Users can only access their organization's data

2. **Role-Based Access Control**
   - Dynamic roles stored in HERA entities
   - Flexible permission system

3. **Token Management**
   - Supabase handles JWT creation/refresh
   - Tokens include user context
   - Automatic token refresh

4. **Progressive Enhancement**
   - Works offline with cached data
   - Graceful degradation without org context

## 📱 User Experience

### First-Time User
1. Register → Creates Supabase account
2. Email verification (if enabled)
3. Login → Redirected to onboarding
4. Create/join organization
5. Access granted to apps

### Returning User
1. Login with email/password
2. Automatic context loading
3. Direct access to last used app
4. Organization already set

### Multi-Organization User
1. Login loads primary organization
2. Can switch organizations (if implemented)
3. Permissions update per organization

## 🔧 Implementation Details

### Login Flow
```typescript
// src/app/auth/login/page.tsx
const handleLogin = async () => {
  await login(email, password)  // DualAuthProvider method
  // Automatically loads HERA context
  // Redirects based on organization status
}
```

### Protected Routes
```typescript
// Any protected page/layout
export default function ProtectedPage() {
  return (
    <SalonAuthLayout requiredRole="admin">
      {/* Page content */}
    </SalonAuthLayout>
  )
}
```

### Manual Context Refresh
```typescript
const { refreshContext } = useAuth()
// Call when organization changes
await refreshContext()
```

## 🎯 Benefits

1. **Separation of Concerns**
   - Supabase handles authentication
   - HERA handles business context

2. **Flexibility**
   - Easy to add new auth providers
   - Organization switching support

3. **Performance**
   - Context cached in memory
   - Only loads when needed

4. **Security**
   - Industry-standard JWT tokens
   - Row-level security in database

This dual authentication system ensures secure, scalable, and user-friendly access to all HERA applications!