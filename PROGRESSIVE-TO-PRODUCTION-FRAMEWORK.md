# Progressive to Production Conversion Framework

## 🎯 Overview
This framework provides a systematic, foolproof approach to convert progressive pages to production with minimal errors.

## 📋 Pre-Conversion Checklist

Before starting any conversion:
- [ ] MCP server is running (`cd mcp-server && npm start`)
- [ ] Test data exists (run `node setup-salon-test-data.js`)
- [ ] Demo user exists (run `node create-demo-user.js`)
- [ ] Development server is running on correct port

## 🔄 Conversion Pattern

### Step 1: Create Conversion Components

#### 1.1 Data Hook Pattern
Create a hook for each entity type following this pattern:

```typescript
// src/hooks/use[EntityName].ts
import { useState, useEffect } from 'react'
import { universalApi } from '@/lib/universal-api'

export function use[EntityName](organizationId?: string) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) return
    
    async function fetchData() {
      try {
        // 1. Get entities
        const entitiesRes = await universalApi.getEntities('[entity_type]', organizationId)
        
        // 2. Get dynamic fields
        const entityIds = entitiesRes.data?.map(e => e.id) || []
        const fieldsRes = await universalApi.getDynamicFields(entityIds, organizationId)
        
        // 3. Get relationships if needed
        const relRes = await universalApi.getRelationships(entityIds, organizationId)
        
        // 4. Transform and set data
        const transformed = transform[EntityName]Data(entitiesRes.data, fieldsRes.data, relRes.data)
        setItems(transformed)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [organizationId])

  return { items, loading, error, refetch: fetchData }
}
```

#### 1.2 Data Transformer Pattern
Create transformers to map universal data to UI format:

```typescript
// src/lib/transformers/[entity]-transformer.ts
export function transformToUI[Entity](
  entity: any,
  dynamicFields: any[],
  relationships: any[]
) {
  const fields = dynamicFields.filter(f => f.entity_id === entity.id)
  
  return {
    id: entity.id,
    name: entity.entity_name,
    // Map dynamic fields
    email: fields.find(f => f.field_name === 'email')?.field_value_text,
    phone: fields.find(f => f.field_name === 'phone')?.field_value_text,
    // Map relationships
    status: relationships.find(r => r.relationship_type === 'has_status')?.to_entity_name,
    // Calculate derived fields
    createdAt: new Date(entity.created_at).toLocaleDateString()
  }
}
```

### Step 2: Page Conversion Template

Use this template for each page conversion:

```typescript
'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useUserContext } from '@/hooks/useUserContext'
import { use[EntityName] } from '@/hooks/use[EntityName]'
// Import all UI components from progressive version
import { Card, Button, Input, etc } from '@/components/ui/*'

export default function [PageName]Production() {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  const { items, loading, error, refetch } = use[EntityName](organizationId)
  
  // Copy state management from progressive version
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Auth check
  if (!isAuthenticated) {
    return <AuthRequiredMessage />
  }
  
  // Context loading
  if (contextLoading) {
    return <LoadingProfile />
  }
  
  // Organization check
  if (!organizationId) {
    return <OrganizationError />
  }
  
  // Main render - copy from progressive version
  // Replace data source with 'items' from hook
  return (
    <div>
      {/* Copy entire JSX structure from progressive version */}
      {/* Replace progressive data with production data */}
    </div>
  )
}
```

### Step 3: Entity Mapping Guide

| Progressive Data | Universal Entity Type | Dynamic Fields | Relationships |
|-----------------|----------------------|----------------|---------------|
| appointments | appointment | date, time, duration, notes | customer, staff, service |
| staff | employee | email, phone, role, specialties | has_status, works_at |
| services | service | price, duration, category | requires_product |
| products/inventory | product | sku, price, stock_level | in_category, from_supplier |
| loyalty programs | loyalty_program | points_ratio, tier_benefits | has_members |
| payments | transaction (type: payment) | payment_method, amount | from_customer, for_appointment |

### Step 4: Conversion Script Template

Create a script for each entity type:

```javascript
// mcp-server/setup-[entity]-data.js
async function setup[Entity]Data() {
  console.log('🎯 Setting up [Entity] Test Data...\n');
  
  const items = [
    // Copy sample data from progressive version
  ];
  
  for (const item of items) {
    // 1. Create entity
    const entity = await supabase.from('core_entities').insert({
      organization_id: organizationId,
      entity_type: '[entity_type]',
      entity_name: item.name,
      entity_code: `[PREFIX]-${Date.now()}`,
      smart_code: 'HERA.SALON.[ENTITY].v1',
      status: 'active'
    });
    
    // 2. Add dynamic fields
    for (const [fieldName, fieldValue] of Object.entries(item)) {
      await universalApi.setDynamicField(entity.id, fieldName, fieldValue);
    }
    
    // 3. Create relationships
    // Add any necessary relationships
  }
}
```

## 🚀 Quick Conversion Process

### For Each Page:

1. **Run Conversion Command** (create this helper):
```bash
npm run convert-progressive -- --page=appointments --entity=appointment
```

2. **The command will**:
   - Copy progressive page to production location
   - Create data hook using template
   - Create transformer using template
   - Update imports and auth
   - Generate test data script

3. **Manual Steps**:
   - Review and adjust field mappings
   - Test with MCP data
   - Add any custom business logic

## 📁 File Structure After Conversion

```
src/
  app/
    salon/
      [page-name]/
        page.tsx          # Production version
  hooks/
    use[EntityName].ts    # Data fetching hook
  lib/
    transformers/
      [entity]-transformer.ts  # Data transformation
mcp-server/
  setup-[entity]-data.js  # Test data creation
```

## 🔧 Automated Conversion Helper

Create this helper script:

```typescript
// scripts/convert-progressive-page.ts
import fs from 'fs'
import path from 'path'

const TEMPLATES = {
  hook: `// Hook template...`,
  transformer: `// Transformer template...`,
  page: `// Page template...`,
  testData: `// Test data template...`
}

function convertPage(pageName: string, entityType: string) {
  // 1. Read progressive page
  const progressivePath = `src/app/salon-progressive/${pageName}/page.tsx`
  const progressiveContent = fs.readFileSync(progressivePath, 'utf8')
  
  // 2. Extract data structure
  const dataStructure = extractDataStructure(progressiveContent)
  
  // 3. Generate files
  generateHook(entityType, dataStructure)
  generateTransformer(entityType, dataStructure)
  generateProductionPage(pageName, entityType, progressiveContent)
  generateTestDataScript(entityType, dataStructure)
  
  console.log(`✅ Converted ${pageName} to production!`)
}
```

## 🎯 Conversion Order (Recommended)

1. **Core Entities First**:
   - Staff (employees)
   - Services
   - Products/Inventory

2. **Transactional Pages**:
   - Appointments
   - Payments
   - POS

3. **Analytics/Reports**:
   - Reports
   - Loyalty
   - Marketing

4. **Configuration**:
   - Settings
   - Finance/COA

## ⚡ Common Gotchas & Solutions

| Issue | Solution |
|-------|----------|
| Missing organization ID | Always use `useUserContext()` hook |
| Status columns | Use relationships with `has_status` type |
| Hardcoded data | Extract to test data scripts |
| Date handling | Store as ISO strings, format in UI |
| Progressive auth | Replace with `useAuth()` from context |
| Local state | Keep UI state local, fetch data from API |

## 🧪 Testing Each Conversion

1. **Unit Test Hook**:
```typescript
// __tests__/hooks/use[Entity].test.ts
describe('use[Entity]', () => {
  it('fetches and transforms data correctly', async () => {
    // Test with mock universal API
  })
})
```

2. **Integration Test**:
```bash
# Run after each conversion
node mcp-server/test-[entity]-page.js
```

3. **Manual Test**:
- Login as demo user
- Navigate to converted page
- Verify all CRUD operations
- Check data filtering by organization

## 📊 Conversion Tracking

Track your progress:

- [x] Customers (completed as example)
- [ ] Staff
- [ ] Services  
- [ ] Appointments
- [ ] Inventory
- [ ] POS
- [ ] Payments
- [ ] Reports
- [ ] Loyalty
- [ ] Marketing
- [ ] Settings
- [ ] Finance/COA

## 🔄 Reusable Components

Create these once, use everywhere:

1. **LoadingStates.tsx** - Consistent loading UI
2. **ErrorStates.tsx** - Consistent error handling
3. **AuthStates.tsx** - Auth required messages
4. **EmptyStates.tsx** - No data messages

## 🎉 Benefits of This Framework

1. **Consistent Pattern** - Every page follows same structure
2. **Reusable Code** - Hooks and transformers can be shared
3. **Type Safety** - TypeScript throughout
4. **Testing Built-in** - Test data scripts for each entity
5. **Minimal Manual Work** - Templates handle 80% of conversion
6. **Error Prevention** - Checklist catches common issues