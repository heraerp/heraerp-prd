# HairTalkz Organization ID Guide

## Overview

The HairTalkz organization ID (`378f24fb-d496-4ff7-8afa-ea34895a0eb8`) is passed through the system using multiple mechanisms to ensure it's available wherever needed.

## Organization ID: `378f24fb-d496-4ff7-8afa-ea34895a0eb8`

This is Michele's salon organization ID used throughout the HairTalkz system.

## How It's Passed

### 1. **URL-Based Detection** (Primary Method)

The system automatically detects the organization based on the URL:

```typescript
// Production
https://hairtalkz.heraerp.com/* → HairTalkz Org ID

// Local Development  
http://hairtalkz.localhost:3000/* → HairTalkz Org ID
http://localhost:3000/~hairtalkz/* → HairTalkz Org ID
```

### 2. **Middleware Headers**

The middleware (`middleware.ts`) sets headers for downstream components:

```typescript
// Headers set by middleware
x-hera-organization: 'hairtalkz'
x-hera-org-id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
x-hera-org-mode: 'tenant'
```

### 3. **SalonProvider Context**

The `SalonProvider` makes the org ID available to all child components:

```typescript
const { organizationId } = useSalonContext()
// Returns: '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
```

### 4. **Local Storage**

The org ID is stored in localStorage for persistence:

```typescript
localStorage.setItem('organizationId', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
```

### 5. **Environment Variables** (Optional)

You can set a default org ID in your `.env.local`:

```bash
NEXT_PUBLIC_HAIRTALKZ_ORG_ID=378f24fb-d496-4ff7-8afa-ea34895a0eb8
```

## Usage in Components

### Using the Context

```typescript
import { useSalonContext } from '@/app/salon/SalonProvider'

function MyComponent() {
  const { organizationId } = useSalonContext()
  
  // Use organizationId in API calls
  const result = await fetch('/api/salon/data', {
    headers: {
      'x-organization-id': organizationId
    }
  })
}
```

### Using the Hook

```typescript
import { useSalonOrgId } from '@/hooks/useSalonOrgId'

function MyComponent() {
  const { orgId, isLoading } = useSalonOrgId()
  
  if (isLoading) return <div>Loading...</div>
  
  // Use orgId
  console.log('Organization ID:', orgId)
}
```

### Direct Import

```typescript
import { HAIRTALKZ_ORG_ID } from '@/lib/constants/salon'

// Use directly when you know it's HairTalkz
const orgId = HAIRTALKZ_ORG_ID
```

## API Usage

### In API Routes

```typescript
// src/app/api/salon/[endpoint]/route.ts
export async function GET(request: Request) {
  // Get from headers (set by middleware)
  const orgId = request.headers.get('x-hera-org-id')
  
  // Or get from request body/params
  const { organizationId } = await request.json()
  
  // Use in Supabase queries
  const { data } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
}
```

### In Server Components

```typescript
import { headers } from 'next/headers'

export default async function ServerComponent() {
  const headersList = headers()
  const orgId = headersList.get('x-hera-org-id') || HAIRTALKZ_ORG_ID
  
  // Use orgId for server-side data fetching
}
```

## Testing Different Organizations

To test with different organization IDs during development:

1. **Update localStorage**:
```javascript
localStorage.setItem('organizationId', 'your-test-org-id')
```

2. **Use query parameters** (if implemented):
```
http://localhost:3000/salon/dashboard?orgId=test-org-id
```

3. **Update environment variable**:
```bash
NEXT_PUBLIC_HAIRTALKZ_ORG_ID=test-org-id
```

## Priority Order

The system uses this priority order to determine the organization ID:

1. **localStorage** (if set)
2. **URL detection** (subdomain or path)
3. **Environment variable**
4. **Hardcoded constant** (fallback)

## Best Practices

1. **Always use the context or hook** in React components
2. **Check for org ID in API routes** before database operations
3. **Include org ID in all Supabase queries** for multi-tenancy
4. **Log org ID detection** for debugging:

```typescript
console.log('Organization ID detection:', {
  source: 'url|storage|env|default',
  value: orgId
})
```

## Troubleshooting

If the org ID is not being detected:

1. Check browser console for detection logs
2. Verify the URL matches expected patterns
3. Check localStorage: `localStorage.getItem('organizationId')`
4. Verify middleware is running (check network headers)
5. Ensure SalonProvider is wrapping your components

## Security Notes

- The org ID is not sensitive but ensures data isolation
- Always validate org ID server-side
- Use Row Level Security (RLS) in Supabase
- Never trust client-provided org IDs without verification