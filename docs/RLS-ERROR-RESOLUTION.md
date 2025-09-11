# Resolving RLS (Row Level Security) Errors in HERA

## Error: "new row violates row-level security policy for table 'core_entities'"

This error occurs when Row Level Security policies block database operations. Here's how to resolve it:

### Common Causes

1. **Missing Authentication**: User is not authenticated
2. **Missing Organization ID**: Required organization_id not provided
3. **Incorrect User Context**: User doesn't belong to the organization
4. **Missing Permissions**: User lacks required permissions

### Solution 1: Use Service Role (Server-Side)

For server-side operations (API routes, scripts), use the service role key:

```typescript
// In API routes or server components
import { createServiceClient } from '@/lib/supabase/service-client'

export async function POST(request: Request) {
  const supabase = createServiceClient() // Bypasses RLS
  
  const { data, error } = await supabase
    .from('core_entities')
    .insert({
      entity_type: 'customer',
      entity_name: 'Test Customer',
      organization_id: 'your-org-id',
      smart_code: 'HERA.CRM.CUSTOMER.v1'
    })
    .select()
}
```

### Solution 2: Ensure Authentication (Client-Side)

For client-side operations, ensure user is authenticated:

```typescript
// Check authentication first
const { data: { session }, error } = await supabase.auth.getSession()

if (!session) {
  // Redirect to login or handle unauthenticated state
  router.push('/auth/login')
  return
}

// Now operations will include auth context
const { data, error } = await supabase
  .from('core_entities')
  .insert({
    entity_type: 'customer',
    entity_name: 'Test Customer',
    organization_id: session.user.user_metadata.organization_id,
    smart_code: 'HERA.CRM.CUSTOMER.v1'
  })
```

### Solution 3: Use Universal API (Recommended)

The Universal API handles authentication and organization context automatically:

```typescript
import { universalApi } from '@/lib/universal-api'

// Set organization context once
universalApi.setOrganizationId('your-org-id')

// Create entity with proper context
const entity = await universalApi.createEntity({
  entity_type: 'customer',
  entity_name: 'Test Customer',
  smart_code: 'HERA.CRM.CUSTOMER.v1'
  // organization_id is added automatically
})
```

### Solution 4: Development/Testing Scripts

For development scripts, use environment variables:

```javascript
// In your script (e.g., demo-tender-crud.js)
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for scripts
)

// Now you can bypass RLS
const { data, error } = await supabase
  .from('core_entities')
  .insert({ ... })
```

### Solution 5: Check RLS Policies

View current RLS policies:

```sql
-- Check policies on core_entities
SELECT * FROM pg_policies WHERE tablename = 'core_entities';

-- Common HERA RLS policy pattern
CREATE POLICY "Users can access their organization's entities" ON core_entities
  FOR ALL 
  USING (organization_id = auth.jwt() ->> 'organization_id');
```

### Solution 6: Temporary Disable RLS (Development Only)

**⚠️ WARNING: Only for development/debugging**

```sql
-- Disable RLS temporarily
ALTER TABLE core_entities DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS (IMPORTANT!)
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
```

### Best Practices

1. **Always use organization_id**: Every insert must include organization_id
2. **Use Universal API**: It handles auth context automatically
3. **Server-side scripts**: Use service role key
4. **Client-side**: Ensure user is authenticated
5. **Test with correct context**: Use the same auth context as production

### Quick Debugging Checklist

- [ ] Is the user authenticated?
- [ ] Is organization_id included in the insert?
- [ ] Does the user belong to that organization?
- [ ] Are you using the correct Supabase client (anon vs service)?
- [ ] Is the Universal API configured with the right organization?

### Example: Complete Working Insert

```typescript
// Client-side with proper auth
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

function MyComponent() {
  const { currentOrganization, isAuthenticated } = useMultiOrgAuth()
  const supabase = createClientComponentClient()

  const createEntity = async () => {
    if (!isAuthenticated || !currentOrganization) {
      console.error('Not authenticated or no organization')
      return
    }

    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'customer',
        entity_name: 'Test Customer',
        organization_id: currentOrganization.id, // Critical!
        smart_code: 'HERA.CRM.CUSTOMER.v1',
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (error) {
      console.error('RLS Error:', error)
      // Handle error appropriately
    }
  }
}