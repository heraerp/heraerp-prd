# HERA Development Standards - Enterprise Production Quality Guide

## 🎯 Core Principles (ALWAYS FOLLOW)

### 1. NO DUMMY DATA - Enterprise API-First Architecture
```typescript
// ❌ NEVER DO THIS
const dummyData = [
  { id: 1, name: 'Test Client' },
  { id: 2, name: 'Sample Customer' }
]

// ✅ ALWAYS DO THIS
const fetchClients = async () => {
  const response = await fetch(`/api/v1/salon/clients?organization_id=${organizationId}`)
  const data = await response.json()
  return data.clients
}
```

### 2. Universal 6-Table Architecture
- **ALWAYS** use `core_entities` for business objects
- **ALWAYS** use `metadata` field for custom properties
- **NEVER** create new tables without explicit requirement
- **NEVER** add status columns - use relationships

### 3. Multi-Tenant Security Pattern
```typescript
// ALWAYS include organization_id
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
```

### 4. Three-Layer Loading Pattern (MANDATORY)
```typescript
// Layer 1: Authentication Check
if (!isAuthenticated) {
  return <Alert>Please log in to access this page.</Alert>
}

// Layer 2: Context Loading Check
if (contextLoading) {
  return <LoadingSpinner />
}

// Layer 3: Organization Check
if (!organizationId) {
  return <Alert>No organization context found.</Alert>
}
```

## 📋 Standard Component Structure

### 1. Page Component Template
```typescript
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { ModuleProductionSidebar } from '@/components/module/ModuleProductionSidebar'
import { useToast } from '@/components/ui/use-toast'
import { withErrorHandler } from '@/lib/api-error-handler'

// Type definitions
interface EntityType {
  id: string
  name: string
  code: string
  metadata?: Record<string, any>
}

export default function ModulePage() {
  const router = useRouter()
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const { toast } = useToast()
  
  // Default organization for testing
  const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
  
  // State management
  const [entities, setEntities] = useState<EntityType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data fetching with error handling
  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/v1/module/entities?organization_id=${organizationId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data')
      }
      
      if (data.success) {
        setEntities(data.entities)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])
  
  // Initial load
  useEffect(() => {
    if (organizationId && !contextLoading) {
      fetchData()
    }
  }, [organizationId, contextLoading, fetchData])
  
  // Loading state
  if (contextLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex">
      <ModuleProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Content here */}
        </div>
      </div>
    </div>
  )
}
```

### 2. API Route Template
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withErrorHandler } from '@/lib/api-error-handler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// GET: Fetch data
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')
  
  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: 'Organization ID is required' },
      { status: 400 }
    )
  }
  
  try {
    // Check if data exists
    const { data: existingData, error: fetchError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'module_entity')
    
    if (fetchError) throw fetchError
    
    // Create default data if none exists
    if (!existingData || existingData.length === 0) {
      await createDefaultData(organizationId)
      // Fetch again
      const { data: newData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'module_entity')
      
      return NextResponse.json({
        success: true,
        entities: transformData(newData || [])
      })
    }
    
    return NextResponse.json({
      success: true,
      entities: transformData(existingData)
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
})

// POST: Create new entity
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { organizationId, ...entityData } = body
  
  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: 'Organization ID is required' },
      { status: 400 }
    )
  }
  
  try {
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'module_entity',
        entity_name: entityData.name,
        entity_code: `MODULE-${Date.now()}`,
        status: 'active',
        smart_code: 'HERA.MODULE.ENTITY.v1',
        metadata: entityData
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      entity: transformData([data])[0]
    })
  } catch (error) {
    console.error('Error creating entity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create entity' },
      { status: 500 }
    )
  }
})

// Helper functions
function transformData(entities: any[]): any[] {
  return entities.map(entity => ({
    id: entity.id,
    name: entity.entity_name,
    code: entity.entity_code,
    ...entity.metadata
  }))
}

async function createDefaultData(organizationId: string) {
  // Create sensible defaults based on module context
  const defaults = [
    {
      name: 'Default Entity 1',
      description: 'Automatically created default'
    }
  ]
  
  for (const defaultItem of defaults) {
    await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'module_entity',
        entity_name: defaultItem.name,
        entity_code: `DEFAULT-${Date.now()}`,
        status: 'active',
        smart_code: 'HERA.MODULE.DEFAULT.v1',
        metadata: defaultItem
      })
  }
}
```

## 🎨 UI/UX Standards

### 1. Color Schemes by Module
```typescript
// Salon Module
const salonTheme = {
  gradient: 'from-purple-50 via-pink-50 to-white',
  primary: 'purple-600',
  secondary: 'pink-600',
  sidebar: 'from-pink-50/90 to-purple-50/90'
}

// Financial Module
const financialTheme = {
  gradient: 'from-blue-50 via-cyan-50 to-white',
  primary: 'blue-600',
  secondary: 'cyan-600',
  sidebar: 'from-blue-50/90 to-cyan-50/90'
}

// Healthcare Module
const healthcareTheme = {
  gradient: 'from-green-50 via-emerald-50 to-white',
  primary: 'green-600',
  secondary: 'emerald-600',
  sidebar: 'from-green-50/90 to-emerald-50/90'
}
```

### 2. Standard Components Usage
```typescript
// Cards with hover effect
<Card className="hover:shadow-lg transition-all duration-200 border-purple-100">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>

// Buttons with gradient
<Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
  Action
</Button>

// Loading states
<Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />

// Empty states
<div className="text-center py-12">
  <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
  <h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
  <p className="text-gray-600 mb-4">Get started by adding your first item</p>
  <Button>Add First Item</Button>
</div>
```

## 📊 Data Patterns

### 1. Entity Storage Pattern
```typescript
// Store in core_entities
{
  organization_id: organizationId,
  entity_type: 'module_specific_type', // e.g., 'salon_client', 'healthcare_patient'
  entity_name: displayName,
  entity_code: uniqueCode,
  status: 'active',
  smart_code: 'HERA.MODULE.TYPE.v1',
  metadata: {
    // All custom fields go here
    phone: '+971501234567',
    email: 'client@example.com',
    preferences: {},
    customField: 'value'
  }
}
```

### 2. Transaction Storage Pattern
```typescript
// Store in universal_transactions
{
  organization_id: organizationId,
  transaction_type: 'module_transaction',
  transaction_code: `TXN-${Date.now()}`,
  transaction_date: new Date().toISOString(),
  total_amount: 1000.00,
  from_entity_id: sourceEntityId,
  to_entity_id: targetEntityId,
  smart_code: 'HERA.MODULE.TXN.v1',
  metadata: {
    // Transaction details
    items: [],
    notes: '',
    payment_method: 'card'
  }
}
```

### 3. Settings Storage Pattern
```typescript
// Module settings as special entity
{
  organization_id: organizationId,
  entity_type: 'module_settings',
  entity_name: 'Module Configuration',
  entity_code: `SETTINGS-${organizationId}`,
  status: 'active',
  smart_code: 'HERA.MODULE.SETTINGS.v1',
  metadata: {
    business_info: {},
    preferences: {},
    features: {},
    localization: {
      currency: 'AED',
      timezone: 'Asia/Dubai',
      date_format: 'DD/MM/YYYY'
    }
  }
}
```

## 🔧 Development Workflow

### 1. New Feature Checklist
- [ ] Create API route with proper error handling
- [ ] Implement GET with auto-creation of defaults
- [ ] Implement POST/PUT/DELETE as needed
- [ ] Create TypeScript interfaces
- [ ] Build UI component with loading states
- [ ] Add error handling and user feedback
- [ ] Include search/filter functionality
- [ ] Add export capability if listing data
- [ ] Test with multiple organizations
- [ ] Ensure proper data cleanup

### 2. Testing Checklist
- [ ] Works without authentication (DEFAULT_ORG_ID)
- [ ] No dummy data remains
- [ ] All API calls have error handling
- [ ] Loading states work correctly
- [ ] Empty states are user-friendly
- [ ] Multi-tenant isolation verified
- [ ] No console errors in browser
- [ ] Build passes without errors

### 3. Common Patterns to Include
```typescript
// Search with debouncing
const [searchTerm, setSearchTerm] = useState('')
const [debouncedSearch, setDebouncedSearch] = useState('')

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchTerm)
  }, 300)
  return () => clearTimeout(timer)
}, [searchTerm])

// Pagination
const [page, setPage] = useState(1)
const [pageSize] = useState(10)
const paginatedData = data.slice((page - 1) * pageSize, page * pageSize)

// Sorting
const [sortField, setSortField] = useState<string>('created_at')
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

// Filtering
const [filters, setFilters] = useState({
  status: 'all',
  dateRange: 'all',
  category: 'all'
})
```

## 🚀 Performance Standards

### 1. Optimize Renders
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>
})

// Use useCallback for stable functions
const handleUpdate = useCallback(async (id: string) => {
  // Update logic
}, [dependencies])

// Use useMemo for expensive calculations
const statistics = useMemo(() => {
  return calculateStats(data)
}, [data])
```

### 2. API Optimization
```typescript
// Batch requests when possible
const fetchAllData = async () => {
  const [clients, services, appointments] = await Promise.all([
    fetch(`/api/v1/salon/clients?organization_id=${organizationId}`),
    fetch(`/api/v1/salon/services?organization_id=${organizationId}`),
    fetch(`/api/v1/salon/appointments?organization_id=${organizationId}`)
  ])
  
  // Process responses
}

// Use proper caching headers
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
  }
})
```

## 📱 Responsive Design

### 1. Mobile-First Grid Patterns
```typescript
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

// Responsive flex
<div className="flex flex-col sm:flex-row gap-4">

// Responsive text
<h1 className="text-2xl sm:text-3xl lg:text-4xl">

// Responsive spacing
<div className="p-4 sm:p-6 lg:p-8">
```

### 2. Sidebar Behavior
```typescript
// Collapsible sidebar for mobile
const [sidebarOpen, setSidebarOpen] = useState(false)

// Desktop: hover to expand
// Mobile: click to toggle
// Tablet: fixed expanded
```

## 🔒 Security Standards

### 1. Always Validate Input
```typescript
// API validation
if (!organizationId || !entityData.name) {
  return NextResponse.json(
    { success: false, error: 'Missing required fields' },
    { status: 400 }
  )
}

// Sanitize user input
const sanitizedInput = input.trim().slice(0, 255)

// Validate email/phone formats
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[\d\s\-\+\(\)]+$/
```

### 2. Handle Errors Gracefully
```typescript
try {
  // Risky operation
} catch (error) {
  console.error('Descriptive error context:', error)
  
  // User-friendly message
  toast({
    title: 'Error',
    description: 'Something went wrong. Please try again.',
    variant: 'destructive'
  })
  
  // Don't expose internal errors
  return NextResponse.json(
    { success: false, error: 'Operation failed' },
    { status: 500 }
  )
}
```

## 📝 Documentation Standards

### 1. Component Documentation
```typescript
/**
 * ClientManagementPage - Enterprise-grade client management for salon module
 * 
 * Features:
 * - Full CRUD operations with API integration
 * - Advanced search and filtering
 * - Loyalty points tracking
 * - Export functionality
 * 
 * @requires organizationId - From MultiOrgAuth context or DEFAULT_ORG_ID
 */
```

### 2. API Documentation
```typescript
/**
 * GET /api/v1/module/entities
 * 
 * Fetch all entities for an organization
 * 
 * Query params:
 * - organization_id (required): Organization UUID
 * - status (optional): Filter by status (active|inactive)
 * - search (optional): Search term for name/code
 * 
 * Returns:
 * - success: boolean
 * - entities: Array of transformed entities
 * - error?: Error message if failed
 */
```

## 🎯 Quality Checklist for Every Feature

Before considering any feature complete:

1. **Data Architecture**
   - [ ] Uses universal 6-table schema
   - [ ] No hardcoded/dummy data
   - [ ] Proper metadata structure
   - [ ] Smart codes implemented

2. **API Quality**
   - [ ] Error handling with withErrorHandler
   - [ ] Auto-creates sensible defaults
   - [ ] Validates all inputs
   - [ ] Returns consistent response format

3. **UI/UX Quality**
   - [ ] Loading states implemented
   - [ ] Error states handled
   - [ ] Empty states designed
   - [ ] Responsive on all devices
   - [ ] Animations smooth

4. **Performance**
   - [ ] Uses React.memo where needed
   - [ ] Implements pagination for lists
   - [ ] Debounces search inputs
   - [ ] Optimizes re-renders

5. **Security**
   - [ ] Organization isolation enforced
   - [ ] Input validation complete
   - [ ] No sensitive data exposed
   - [ ] Error messages sanitized

6. **User Experience**
   - [ ] Toast notifications for feedback
   - [ ] Confirmation dialogs for destructive actions
   - [ ] Keyboard shortcuts where applicable
   - [ ] Accessibility standards met

## 🚨 Common Pitfalls to Avoid

1. **Never use old auth components** - Always MultiOrgAuthProvider
2. **Never skip contextLoading check** - Causes infinite loops
3. **Never hardcode organization IDs** - Use DEFAULT_ORG_ID pattern
4. **Never create status columns** - Use relationships
5. **Never expose internal errors** - Sanitize for users
6. **Never skip error boundaries** - Wrap components
7. **Never ignore TypeScript errors** - Fix them properly
8. **Never use inline styles** - Use Tailwind classes

## 🎉 Success Metrics

Your implementation is production-ready when:
- Zero dummy data remains
- All CRUD operations work via API
- Multi-tenant isolation is perfect
- Loading/error states handle all cases
- Build completes without warnings
- UI is responsive and polished
- Performance is optimized
- Code follows all standards above

---

Remember: **This document is your source of truth**. When in doubt, refer back to these standards to ensure consistent, enterprise-grade quality across all HERA modules.