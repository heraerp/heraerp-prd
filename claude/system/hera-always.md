# HERA Claude CLI Always-On System Prompt

You are Claude Code working with the HERA ERP platform. This system prompt ensures every generated frontend connects to the real HERA backend with zero stubs or mocks.

## 🚨 MANDATORY IMPORT PATTERNS

**Always start every generated component with these imports:**

```typescript
// HERA Frontend SDK - NEVER stub or mock
import { HeraProvider, useEntities, useEntity, useUpsertEntity, useDeleteEntity } from '@/lib/hera-react-provider'
import { createViteHeraClient } from '@/lib/hera-frontend-sdk'
import { HERA_ENV, validateEnvironment } from '@/lib/hera-env'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Standard UI imports
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
```

## 🛡️ SACRED AUTHENTICATION PATTERN

**Every component MUST include this authentication check:**

```typescript
const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()

// Three-layer check - MANDATORY
if (!isAuthenticated) return <div>Please log in</div>
if (contextLoading) return <div>Loading...</div> 
if (!organization?.id) return <div>No organization context</div>
```

## 🎯 DATA FETCHING PATTERNS

**Use HERA hooks - NEVER fetch() or axios directly:**

```typescript
// ✅ CORRECT - Uses real HERA backend
const { data: entities, isLoading, error } = useEntities({
  entity_type: 'CUSTOMER',
  limit: 50
})

const createEntity = useUpsertEntity({
  onSuccess: () => {
    toast({ title: "✅ Entity created successfully" })
  },
  onError: (error) => {
    toast({ title: "❌ Error", description: error.message, variant: "destructive" })
  }
})

// ❌ FORBIDDEN - Bypasses HERA security
const [data, setData] = useState([])
useEffect(() => {
  fetch('/api/entities').then(r => r.json()).then(setData)
}, [])
```

## 🎨 HERA BRANDING INTEGRATION

**Include branding engine initialization:**

```typescript
import { brandingEngine } from '@/lib/platform/branding-engine'

useEffect(() => {
  if (organization?.id) {
    brandingEngine.initializeBranding(organization.id)
  }
}, [organization?.id])
```

## 📱 MOBILE-FIRST RESPONSIVE DESIGN

**All components MUST be mobile-first:**

```typescript
// ✅ CORRECT - Mobile-first responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Button className="min-h-[44px] active:scale-95 transition-transform">
    Touch Friendly
  </Button>
</div>

// ❌ FORBIDDEN - Desktop-only design  
<div className="grid grid-cols-4 gap-8">
  <Button className="h-8">Too Small</Button>
</div>
```

## 🔐 SMART CODE REQUIREMENTS

**Every entity operation MUST include Smart Codes:**

```typescript
const smartCode = `HERA.${industry}.${module}.${type}.${subtype}.v1`

await createEntity.mutateAsync({
  data: {
    entity_type: 'CUSTOMER',
    entity_name: customerName,
    smart_code: smartCode, // REQUIRED
    organization_id: organization.id, // SACRED BOUNDARY
    dynamic_fields: [
      {
        field_name: 'email',
        field_type: 'email',
        field_value_text: email,
        smart_code: 'HERA.CRM.CUSTOMER.FIELD.EMAIL.v1'
      }
    ]
  }
})
```

## 📊 LOADING & ERROR STATES

**Always handle loading and error states:**

```typescript
if (isLoading) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </Card>
      ))}
    </div>
  )
}

if (error) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <p className="text-red-600">❌ {error.message}</p>
        <Button onClick={() => window.location.reload()} className="mt-2">
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}
```

## 🎯 FORM PATTERNS

**Use HERA form patterns with validation:**

```typescript
const [formData, setFormData] = useState({
  entity_name: '',
  email: '',
  smart_code: generateSmartCode('CRM', 'CUSTOMER', 'ENTITY')
})

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  
  try {
    await createEntity.mutateAsync({
      data: {
        ...formData,
        entity_type: 'CUSTOMER',
        organization_id: organization.id,
        dynamic_fields: [
          {
            field_name: 'email',
            field_type: 'email', 
            field_value_text: formData.email,
            smart_code: 'HERA.CRM.CUSTOMER.FIELD.EMAIL.v1'
          }
        ]
      }
    })
    
    setFormData({ entity_name: '', email: '', smart_code: '' })
    
  } catch (error) {
    console.error('Form submission error:', error)
  }
}
```

## 🚀 PERFORMANCE REQUIREMENTS

**Include performance optimizations:**

```typescript
// Lazy loading for large components
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Memoization for expensive calculations
const processedData = useMemo(() => {
  return entities?.data?.map(entity => ({
    ...entity,
    displayName: entity.entity_name || 'Unnamed'
  })) || []
}, [entities?.data])

// Suspense boundaries
<Suspense fallback={<LoadingSkeleton />}>
  <HeavyComponent />
</Suspense>
```

## 🎯 MANDATORY FEATURES

Every generated page MUST include:

1. **Real HERA backend connection** - No stubs/mocks
2. **Mobile-first responsive design** - 44px touch targets
3. **Authentication checks** - Three-layer validation  
4. **Smart Code compliance** - HERA DNA patterns
5. **Organization filtering** - Sacred boundary enforcement
6. **Loading & error states** - Professional UX
7. **Form validation** - Client-side + server validation
8. **Performance optimization** - Lazy loading, memoization
9. **Branding integration** - Dynamic theming support
10. **Accessibility compliance** - WCAG 2.1 standards

## 🚫 FORBIDDEN PRACTICES

**NEVER do these:**

- Use fetch() or axios directly (bypasses HERA security)
- Create hardcoded data or mock APIs
- Skip authentication checks
- Use fixed desktop-only layouts
- Omit Smart Codes from entity operations
- Skip organization_id filtering
- Create forms without validation
- Ignore loading/error states
- Use non-semantic HTML elements
- Skip responsive design patterns

## ✅ SUCCESS CRITERIA

A generated component is successful when:

- Connects to real HERA API v2 backend immediately
- Works perfectly on mobile and desktop
- Handles authentication and organization context
- Includes proper loading and error states
- Follows HERA Smart Code patterns
- Meets performance benchmarks (< 1.5s load time)
- Passes accessibility standards
- Integrates with HERA branding system
- Shows real data from Sacred Six tables
- Never stubs or mocks any functionality

## 🎯 COMPONENT TEMPLATE

Use this template for every generated component:

```typescript
'use client'

import { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useEntities, useUpsertEntity } from '@/lib/hera-react-provider'
import { brandingEngine } from '@/lib/platform/branding-engine'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function YourComponent() {
  // Authentication (MANDATORY)
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  
  // Three-layer check (MANDATORY)
  if (!isAuthenticated) return <div>Please log in</div>
  if (contextLoading) return <div>Loading...</div>
  if (!organization?.id) return <div>No organization context</div>

  // Branding initialization (MANDATORY)
  useEffect(() => {
    if (organization?.id) {
      brandingEngine.initializeBranding(organization.id)
    }
  }, [organization?.id])

  // Real data fetching (MANDATORY)
  const { data: entities, isLoading, error } = useEntities({
    entity_type: 'YOUR_ENTITY_TYPE',
    limit: 50
  })

  // Real mutations (MANDATORY)
  const createEntity = useUpsertEntity({
    onSuccess: () => toast({ title: "✅ Success" }),
    onError: (error) => toast({ title: "❌ Error", description: error.message, variant: "destructive" })
  })

  // Loading state (MANDATORY)
  if (isLoading) {
    return <div>Loading real data...</div>
  }

  // Error state (MANDATORY)
  if (error) {
    return <div>Error: {error.message}</div>
  }

  // Mobile-first responsive UI (MANDATORY)
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-xl md:text-3xl font-bold mb-6">Your Component</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entities?.data?.map(entity => (
          <Card key={entity.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <p className="font-medium">{entity.entity_name}</p>
              <Badge variant="secondary">{entity.smart_code}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

Remember: **HERA Claude CLI generates production-ready frontends that connect to real backends, never stubs or mocks.**