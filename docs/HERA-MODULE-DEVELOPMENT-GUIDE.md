# 🔧 HERA Module Development Guide - Technical Reference

## Quick Start: Build Any Restaurant Module in 30 Seconds

### 1. Generate Module Foundation
```bash
# Replace [MODULE] with: inventory, staff, customers, delivery, etc.
npm run generate-module --name=[MODULE] --type=restaurant
npm run generate-smart-codes --module=[MODULE]
npm run generate-api --module=[MODULE]
npm run generate-ui --module=[MODULE]
```

### 2. Configure Entity Types
Edit `src/app/restaurant/[module]/module.config.json`:
```json
{
  "name": "inventory",
  "type": "restaurant",
  "entityTypes": [
    "inventory_item",
    "supplier", 
    "stock_location"
  ],
  "dynamicFields": [
    { "name": "quantity", "type": "number" },
    { "name": "reorder_point", "type": "number" },
    { "name": "cost_per_unit", "type": "number" },
    { "name": "expiry_date", "type": "text" },
    { "name": "storage_requirements", "type": "json" }
  ],
  "smartCodePrefix": "HERA.INVENTORY"
}
```

### 3. Customize UI Components
Update generated files in `src/app/restaurant/[module]/`:
- `dashboard/page.tsx` - Main management interface
- `form/page.tsx` - Create/edit items  
- `list/page.tsx` - Listing with search
- `reports/page.tsx` - Analytics

## 🏗️ Universal API Pattern

### Standard Endpoint Structure
```typescript
// /api/v1/[module]/entities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET - Fetch entities
export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  
  // Always include organization_id for multi-tenancy
  const organizationId = searchParams.get('organization_id') || 'demo-org'
  const entityType = searchParams.get('entity_type') || 'primary_entity'
  
  // Query universal core_entities table
  const { data: entities } = await supabaseAdmin
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', entityType)
    .eq('status', 'active')
    .order('entity_name')
    
  // Enhance with dynamic data if requested
  if (searchParams.get('include_dynamic_data') === 'true') {
    const entityIds = entities.map(e => e.id)
    const { data: dynamicData } = await supabaseAdmin
      .from('core_dynamic_data')
      .select('*')
      .in('entity_id', entityIds)
      
    // Merge dynamic fields with entities
    const enhancedEntities = entities.map(entity => ({
      ...entity,
      dynamic_fields: mergeDynamicData(entity.id, dynamicData)
    }))
    
    return NextResponse.json({
      success: true,
      data: enhancedEntities,
      module: MODULE_NAME.toUpperCase(),
      architecture: 'HERA_UNIVERSAL_6_TABLE'
    })
  }
}

// POST - Create entity  
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { organization_id, entity_type, entity_name, dynamic_fields = {} } = body
  
  // Create in core_entities
  const { data: entity } = await supabaseAdmin
    .from('core_entities')
    .insert({
      organization_id,
      entity_type,
      entity_name,
      entity_code: generateEntityCode(entity_name),
      status: 'active'
    })
    .select()
    .single()
    
  // Create dynamic fields
  await createDynamicFields(entity.id, dynamic_fields)
  
  return NextResponse.json({
    success: true,
    data: {
      ...entity,
      smart_code: `HERA.${MODULE_NAME.toUpperCase()}.${entity_type.toUpperCase()}.${entity.entity_code}.v1`
    }
  })
}
```

### Dynamic Data Helper Functions
```typescript
// Utility functions for dynamic field management
function mergeDynamicData(entityId: string, dynamicData: any[]) {
  const entityData = dynamicData.filter(d => d.entity_id === entityId)
  const fields = {}
  
  entityData.forEach(field => {
    let value = field.field_value_text
    if (field.field_type === 'number') value = field.field_value_number
    if (field.field_type === 'json') value = field.field_value_json
    
    fields[field.field_name] = {
      value,
      type: field.field_type,
      ai_enhanced: field.ai_enhanced_value
    }
  })
  
  return fields
}

function createDynamicFields(entityId: string, dynamicFields: object) {
  const fieldsData = Object.entries(dynamicFields).map(([name, value]) => ({
    entity_id: entityId,
    field_name: name,
    field_type: typeof value === 'number' ? 'number' : 
                typeof value === 'object' ? 'json' : 'text',
    field_value_text: typeof value === 'string' ? value : null,
    field_value_number: typeof value === 'number' ? value : null,
    field_value_json: typeof value === 'object' ? value : null
  }))
  
  return supabaseAdmin.from('core_dynamic_data').insert(fieldsData)
}
```

## 🎨 UI Component Patterns

### Dashboard Pattern
```typescript
// src/app/restaurant/[module]/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard, GlowButton } from '@/components/restaurant/JobsStyleMicroInteractions'

export default function ModuleDashboardPage() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({
    totalItems: 0,
    activeItems: 0,
    monthlyValue: 0
  })
  
  // Load data using universal API
  const loadData = async () => {
    const response = await fetch(`/api/v1/${MODULE_NAME}/entities?organization_id=${orgId}&include_dynamic_data=true`)
    const result = await response.json()
    setItems(result.data || [])
    
    // Calculate stats
    setStats({
      totalItems: result.data.length,
      activeItems: result.data.filter(item => item.status === 'active').length,
      monthlyValue: calculateMonthlyValue(result.data)
    })
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
            🎯 {MODULE_NAME} Management
          </h1>
          <p className="text-gray-600 mt-2">
            Universal Restaurant Management • HERA 6-Table Architecture
          </p>
        </div>
        
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Total Items"
            value={stats.totalItems}
            trend="up"
            change={12.5}
            icon={<Package className="w-5 h-5 text-white" />}
            color="from-orange-500 to-red-600"
          />
          {/* Add more metric cards */}
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Form Pattern
```typescript
// src/app/restaurant/[module]/form/page.tsx
export default function ModuleFormPage() {
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    description: '',
    // Add module-specific fields
  })
  
  const [aiSuggestions, setAiSuggestions] = useState({})
  
  // AI Enhancement
  const analyzeItem = async () => {
    // Module-specific AI analysis
    const suggestions = await analyzeWithAI(formData)
    setAiSuggestions(suggestions)
  }
  
  const createItem = async () => {
    const response = await fetch(`/api/v1/${MODULE_NAME}/entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: orgId,
        entity_type: 'primary_entity',
        entity_name: formData.entity_name,
        dynamic_fields: extractDynamicFields(formData)
      })
    })
    
    if (response.ok) {
      router.push(`/restaurant/${MODULE_NAME}/dashboard`)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Form implementation with AI suggestions */}
    </div>
  )
}
```

## 🔗 Smart Code Integration

### Smart Code Generation Pattern
```typescript
// Generate context-aware smart codes
function generateSmartCode(module: string, entityType: string, code: string): string {
  return `HERA.${module.toUpperCase()}.${entityType.toUpperCase()}.${code}.v1`
}

// Examples by module:
const smartCodes = {
  menu: 'HERA.MENU.ITEM.PIZZA-MARGHERITA-001.v1',
  inventory: 'HERA.INVENTORY.ITEM.TOMATOES-001.v1', 
  staff: 'HERA.STAFF.EMPLOYEE.JOHN-DOE-001.v1',
  customers: 'HERA.CUSTOMER.PROFILE.SMITH-FAMILY-001.v1',
  delivery: 'HERA.DELIVERY.ORDER.UBER-EATS-001.v1'
}
```

### GL Posting Integration
```typescript
// Smart codes automatically generate GL entries
const createGLEntry = (smartCode: string, amount: number) => {
  const [system, module, type, code] = smartCode.split('.')
  
  return {
    transaction_type: 'gl_posting',
    smart_code: smartCode,
    amount,
    auto_generated: true,
    posting_rules: getPostingRules(module, type)
  }
}
```

## 📊 Module-Specific Customizations

### Inventory Module
```typescript
// Entity types: inventory_item, supplier, stock_location
const inventoryConfig = {
  entityTypes: ['inventory_item', 'supplier', 'stock_location'],
  dynamicFields: {
    quantity: { type: 'number', required: true },
    reorder_point: { type: 'number', default: 10 },
    cost_per_unit: { type: 'number', required: true },
    expiry_date: { type: 'text' },
    storage_requirements: { type: 'json' }
  },
  aiFeatures: {
    demandForecasting: true,
    reorderSuggestions: true,
    priceOptimization: true
  }
}
```

### Staff Module  
```typescript
// Entity types: employee, shift, position
const staffConfig = {
  entityTypes: ['employee', 'shift', 'position'],
  dynamicFields: {
    hourly_rate: { type: 'number', required: true },
    schedule: { type: 'json' },
    permissions: { type: 'json' },
    start_date: { type: 'text' },
    emergency_contact: { type: 'json' }
  },
  aiFeatures: {
    scheduleOptimization: true,
    performanceAnalysis: true,
    payrollForecasting: true
  }
}
```

### Customer Module
```typescript
// Entity types: customer, loyalty_program, reservation
const customerConfig = {
  entityTypes: ['customer', 'loyalty_program', 'reservation'],
  dynamicFields: {
    preferences: { type: 'json' },
    allergies: { type: 'json' },
    visit_history: { type: 'json' },
    loyalty_points: { type: 'number', default: 0 },
    contact_info: { type: 'json' }
  },
  aiFeatures: {
    personalizedRecommendations: true,
    churnPrediction: true,
    lifetimeValueAnalysis: true
  }
}
```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Generate module using HERA DNA
- [ ] Configure entity types and dynamic fields
- [ ] Implement universal API endpoints
- [ ] Build UI components following Steve Jobs patterns
- [ ] Add Smart Code integration
- [ ] Test with demo data

### Post-Deployment
- [ ] Verify all routes work (`/restaurant/[module]/dashboard`)
- [ ] Test multi-tenant functionality
- [ ] Validate Smart Code GL posting
- [ ] Check responsive design
- [ ] Test AI enhancements

### Production Readiness
- [ ] Performance testing with large datasets
- [ ] Security audit (RLS, organization isolation)
- [ ] API rate limiting and caching
- [ ] Error handling and logging
- [ ] Monitoring and alerts

## 🎯 Module Development Workflow

### 1. Planning (5 minutes)
- Define entity types and relationships
- Identify dynamic fields needed
- Plan AI enhancement features

### 2. Generation (30 seconds)
```bash
npm run generate-module --name=[MODULE] --type=restaurant
```

### 3. Customization (2-4 hours)
- Update module.config.json
- Customize UI components
- Add module-specific business logic
- Implement AI features

### 4. Integration (1 hour)
- Add to restaurant navigation
- Connect with existing demo data
- Test Smart Code integration

### 5. Polish (1-2 hours)
- Apply HERA design system
- Add micro-interactions
- Optimize performance
- Write documentation

**Total Time: 4-8 hours vs 26-52 weeks traditional development**

## 📚 Code Examples Repository

All patterns documented here are implemented in the menu management system:
- `/src/app/restaurant/menu/` - Complete implementation
- `/src/app/api/v1/menu/` - Universal API patterns
- `/docs/HERA-MENU-MANAGEMENT-BLUEPRINT.md` - Architecture details

Use these as reference implementations for building new modules.

---

**Next Steps**: Follow this guide to build inventory, staff, customer, or delivery modules using the same proven patterns that created the menu management system in 30 seconds.