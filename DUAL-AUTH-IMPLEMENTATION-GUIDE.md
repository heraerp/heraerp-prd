# HERA Dual Authentication Implementation Guide

## Overview

HERA uses a **Dual Authentication Architecture** that combines:
1. **Supabase Authentication** - Handles user credentials, sessions, and JWT tokens
2. **HERA Universal Authorization** - Stores user profiles as entities with organization context

## Current Status

### Working Implementation
- Basic `AuthProvider` at `/src/contexts/auth-context.tsx` provides Supabase authentication
- Production customer page adapted to work with basic auth + hardcoded organization ID
- Test data successfully created and accessible

### Dual Auth Components (Ready but not integrated)
- `DualAuthProvider` at `/src/components/auth/DualAuthProvider.tsx` 
- HERA context API endpoint at `/api/v1/auth/hera-context`
- User entity creation and organization linking logic

## Implementation Steps

### 1. Replace Basic Auth with Dual Auth

Update `/src/app/layout.tsx`:
```typescript
// Replace this:
import { AuthProvider } from "@/contexts/auth-context";

// With this:
import { DualAuthProvider } from "@/components/auth/DualAuthProvider";

// In the component tree, replace:
<AuthProvider>
  <ProgressiveLayout>
    {children}
  </ProgressiveLayout>
</AuthProvider>

// With:
<DualAuthProvider>
  <ProgressiveLayout>
    {children}
  </ProgressiveLayout>
</DualAuthProvider>
```

### 2. Create HERA Context API Endpoint

Create `/src/app/api/v1/auth/hera-context/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { universalApi } from '@/lib/universal-api'

export async function GET(request: NextRequest) {
  try {
    // 1. Validate JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // 2. Verify token with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 3. Get or create user entity
    const userEntities = await universalApi.getEntities('user')
    let userEntity = userEntities.data?.find(e => 
      e.metadata?.supabase_id === user.id || 
      e.entity_code === `USER-${user.email}`
    )

    if (!userEntity) {
      // Create user entity
      const createResult = await universalApi.createEntity({
        entity_type: 'user',
        entity_name: user.user_metadata?.full_name || user.email,
        entity_code: `USER-${user.email}`,
        smart_code: 'HERA.AUTH.USER.PROFILE.v1',
        metadata: {
          supabase_id: user.id,
          email: user.email,
          created_at: new Date().toISOString()
        }
      })
      userEntity = createResult.data
    }

    // 4. Get organization (simplified - in production, get from relationships)
    const organization = {
      id: process.env.DEFAULT_ORGANIZATION_ID || '44d2d8f8-167d-46a7-a704-c0e5435863d6',
      organization_name: 'Default Organization',
      organization_type: 'business',
      subscription_plan: 'professional'
    }

    // 5. Return HERA context
    return NextResponse.json({
      user_entity: userEntity,
      organization: organization,
      permissions: ['entities:read', 'entities:write', 'transactions:read', 'transactions:write']
    })

  } catch (error) {
    console.error('HERA context error:', error)
    return NextResponse.json(
      { error: 'Failed to load HERA context' }, 
      { status: 500 }
    )
  }
}
```

### 3. Update Components to Use Dual Auth

After implementing dual auth, components can access both Supabase and HERA data:

```typescript
import { useAuth } from '@/components/auth/DualAuthProvider'

function MyComponent() {
  const { 
    user,          // Enhanced user with HERA data
    organization,  // Current organization
    session,       // Supabase session
    isAuthenticated,
    isHeraLoading
  } = useAuth()

  // Use organization ID for Universal API calls
  const orgId = organization?.id
  
  // Access user profile data
  const userRole = user?.role
  const userName = user?.name
}
```

## Key Architecture Points

### User as Entity
```typescript
// Users are stored in core_entities
{
  entity_type: 'user',
  entity_name: 'John Doe',
  entity_code: 'USER-john@example.com',
  smart_code: 'HERA.AUTH.USER.PROFILE.v1',
  metadata: {
    supabase_id: 'uuid-from-supabase',
    email: 'john@example.com'
  }
}
```

### Organization Membership
```typescript
// User-to-organization relationship
{
  from_entity_id: 'user-entity-id',
  to_entity_id: 'org-entity-id',
  relationship_type: 'belongs_to',
  smart_code: 'HERA.AUTH.REL.USER_ORG.v1',
  relationship_data: {
    role: 'admin',
    joined_at: '2024-01-01'
  }
}
```

### Dynamic User Fields
```typescript
// Additional profile data in core_dynamic_data
{
  entity_id: 'user-entity-id',
  field_name: 'department',
  field_value_text: 'Sales',
  smart_code: 'HERA.AUTH.USER.FIELD.DEPT.v1'
}
```

## Benefits

1. **Separation of Concerns**: Authentication (credentials) vs Authorization (permissions)
2. **Universal Architecture**: Users are entities like any other business object
3. **Flexible Profiles**: Unlimited custom fields via dynamic data
4. **Multi-Organization**: Users can belong to multiple organizations
5. **Audit Trail**: All user actions tracked in universal transactions
6. **Role-Based Access**: Permissions stored as relationships

## Testing

1. **Start MCP server**: `cd mcp-server && npm start`
2. **Run test script**: `node test-production-page.js`
3. **Access production page**: http://localhost:3007/salon/customers
4. **Verify data**: All 8 test customers with fields and relationships should display

## Next Steps

1. Implement the HERA context API endpoint
2. Switch from basic to dual auth provider
3. Update all components to use organization context
4. Add user profile management UI
5. Implement role-based access control