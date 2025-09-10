# 🪑 Furniture Module Multi-Tenant Setup Guide

## Overview
Transform the existing furniture demo module into a full multi-tenant SaaS application where users can create their own furniture manufacturing business.

## Current State
- ✅ Furniture module exists at `/furniture` (demo mode)
- ✅ Complete UI and business logic implemented
- ❌ Not available in organization creation flow
- ❌ No module definition for provisioning
- ❌ No multi-tenant routing setup

## Required Changes

### 1. Add Furniture to Business Types
**File**: `/src/app/auth/organizations/new/page.tsx`
```typescript
const BUSINESS_TYPES = [
  { value: 'salon', label: 'Salon & Beauty', icon: Heart },
  { value: 'icecream', label: 'Ice Cream Manufacturing', icon: Factory },
  { value: 'restaurant', label: 'Restaurant & Food Service', icon: Store },
  { value: 'healthcare', label: 'Healthcare & Medical', icon: Heart },
  { value: 'furniture', label: 'Furniture Manufacturing', icon: Hammer }, // ADD THIS
  { value: 'general', label: 'Other / General Business', icon: Building2 }
]
```

### 2. Create Furniture Module Definitions
**File**: `/src/modules/furniture/module-registry.json`
```json
{
  "modules": [
    {
      "id": "HERA.FURNITURE.CORE.MODULE.v1",
      "name": "Furniture Manufacturing Core",
      "description": "Core furniture manufacturing with products, BOM, production",
      "category": "industry",
      "features": [
        "Product catalog management",
        "Bill of Materials (BOM)",
        "Production orders",
        "Inventory tracking"
      ]
    },
    {
      "id": "HERA.FURNITURE.FINANCE.MODULE.v1", 
      "name": "Furniture Finance & GST",
      "description": "India-specific financial management with GST compliance",
      "category": "addon",
      "dependencies": ["HERA.FURNITURE.CORE.MODULE.v1"],
      "features": [
        "GST-compliant invoicing",
        "CGST/SGST split posting",
        "India COA template",
        "Auto-journal entries"
      ]
    },
    {
      "id": "HERA.FURNITURE.HR.MODULE.v1",
      "name": "HR & Payroll (PF/ESI)",
      "description": "Indian payroll with statutory compliance",
      "category": "addon",
      "features": [
        "PF/ESI calculations",
        "Monthly payroll runs",
        "Compliance reports",
        "Bank disbursement"
      ]
    }
  ]
}
```

### 3. Update Organization Layout Router
**File**: `/src/app/org/layout.tsx`

Add furniture to the module routing logic:
```typescript
const moduleRoutes: Record<string, string> = {
  'salon': '/salon',
  'icecream': '/icecream',
  'restaurant': '/restaurant',
  'healthcare': '/healthcare',
  'furniture': '/furniture', // ADD THIS
  'general': '/dashboard'
}
```

### 4. Create Furniture Organization Context
**File**: `/src/components/furniture/FurnitureOrgContext.tsx`

Create a context provider similar to SalonOrgContext that:
- Checks organization type is 'furniture_manufacturer'
- Loads furniture-specific settings
- Provides organization context to all furniture pages

### 5. Update Furniture Layout
**File**: `/src/app/furniture/layout.tsx`

Current layout needs to:
- Import and use `FurnitureOrgContext`
- Check multi-tenant authentication
- Verify organization has furniture modules

### 6. Module Installation UI
**File**: `/src/app/auth/organizations/[id]/apps/page.tsx`

Add furniture modules to the selection UI when organization type is 'furniture'.

### 7. Provisioning Service Updates
**File**: `/src/lib/services/provisioning.ts`

Add furniture-specific provisioning:
```typescript
case 'furniture':
  // Create furniture-specific masters
  await this.createFurnitureMasters(organizationId)
  // Setup India COA with GST accounts
  await this.setupIndiaCOA(organizationId)
  // Create sample products and BOM
  await this.createFurnitureDemoData(organizationId)
  break
```

### 8. Demo Data Creation
**File**: `/src/lib/demo-data/furniture-demo.ts`

Create demo data generator:
```typescript
export async function createFurnitureDemoData(organizationId: string) {
  // Products
  await createProduct({
    name: 'Standard Classroom Desk',
    code: 'DESK-STD-001',
    type: 'FINISHED_GOOD',
    hsn_code: '9403',
    gst_rate: 0.18
  })
  
  // Raw Materials
  await createProduct({
    name: 'Teak Wood Plank',
    code: 'RM-WOOD-001',
    type: 'RAW_MATERIAL',
    hsn_code: '4407',
    gst_rate: 0.12
  })
  
  // Create BOM relationships
  // Create sample work centers
  // Create employee records with PF/ESI
}
```

### 9. Subdomain Routing Test
Test the complete flow:
1. Create new organization with type 'furniture'
2. Select subdomain 'kerala-furniture'
3. Install furniture modules
4. Access via:
   - Production: `kerala-furniture.heraerp.com`
   - Local: `localhost:3000/~kerala-furniture`

### 10. Remove Demo Route
Once multi-tenant is working, remove furniture from DEMO_ROUTES in middleware.ts

## Testing Checklist

- [ ] User can select "Furniture Manufacturing" in organization creation
- [ ] Furniture modules appear in app selection
- [ ] Subdomain provisioning creates furniture organization
- [ ] `subdomain.heraerp.com` routes to furniture app
- [ ] Furniture context loads correctly
- [ ] Demo data includes Indian compliance fields
- [ ] GST calculations work correctly
- [ ] PF/ESI payroll calculations are accurate

## Benefits

1. **For Furniture Manufacturers**:
   - Professional URL: `mybusiness.heraerp.com`
   - India-specific compliance built-in
   - Complete manufacturing workflow
   - Zero implementation time

2. **For HERA**:
   - Another vertical market captured
   - Reusable patterns for manufacturing
   - Proven multi-tenant architecture
   - Single codebase maintained