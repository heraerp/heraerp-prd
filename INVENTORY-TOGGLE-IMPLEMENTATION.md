# Enterprise-Grade Inventory Management Toggle

## 🎯 Overview

Three-tier hierarchical control system for inventory management:

1. **Organization Level** - Master on/off switch
2. **Product Level** - Per-product tracking flag
3. **Module Level** - SaaS tier / feature activation

## 🏗️ Architecture

### Level 1: Organization Settings (Master Control)

**Storage**: `core_dynamic_data` on organization entity

```typescript
{
  entity_id: organizationId,
  field_name: 'inventory_management_enabled',
  field_type: 'boolean',
  field_value_boolean: true,
  smart_code: 'HERA.ORG.SETTINGS.INVENTORY.ENABLED.V1'
}
```

**Impact**: When disabled:
- Hides "Inventory" from sidebar
- Hides InventoryChip from product cards
- Hides "Manage" button on products
- Inventory page shows "Module Disabled" message

### Level 2: Product-Level Flag (Granular Control)

**Storage**: `core_dynamic_data` on product entity

```typescript
{
  entity_id: productId,
  field_name: 'requires_inventory',
  field_type: 'boolean',
  field_value_boolean: true,
  smart_code: 'HERA.PRODUCT.INVENTORY.REQUIRED.V1'
}
```

**Impact**: Per-product control
- Services typically don't require inventory (`false`)
- Physical products require inventory (`true`)
- Only tracked products show inventory chips

### Level 3: Module Activation (SaaS Tiers)

**Storage**: `core_organizations.metadata.active_modules`

```typescript
{
  active_modules: ['pos', 'inventory', 'appointments', 'customers']
}
```

**Impact**: Feature availability by subscription tier
- Starter: No inventory module
- Professional: Basic inventory
- Enterprise: Advanced inventory with multi-location

## 📋 Components Created

### 1. Hook: `useInventorySettings`
**File**: `/src/hooks/useInventorySettings.ts`

```typescript
const { settings, isLoading, updateSettings } = useInventorySettings(organizationId)

// Check if inventory should be shown
const showInventory = shouldShowInventory(settings, product.requires_inventory)
```

**Features**:
- Fetches organization inventory settings
- Provides mutation for updating settings
- Helper functions for permission checks
- React Query caching (1min stale, 5min gc)

### 2. Settings UI: `InventorySettingsCard`
**File**: `/src/components/salon/settings/InventorySettingsCard.tsx`

**Features**:
- Master on/off toggle
- Default tracking for new products
- Branch-specific tracking toggle
- Allow negative stock toggle
- Auto-reorder alerts toggle
- Visual status badges
- Clear info banners

## 🔧 Implementation Steps

### Step 1: Add Settings Page

Create `/src/app/salon/settings/inventory/page.tsx`:

```typescript
'use client'

import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { InventorySettingsCard } from '@/components/salon/settings/InventorySettingsCard'
import { PageHeader } from '@/components/universal/PageHeader'

export default function InventorySettingsPage() {
  const { organizationId } = useSecuredSalonContext()

  return (
    <div className="min-h-screen p-6">
      <PageHeader
        title="Inventory Settings"
        description="Configure how inventory tracking works"
      />

      <div className="max-w-4xl mx-auto mt-6">
        <InventorySettingsCard
          organizationId={organizationId}
          onSettingsChange={() => {
            console.log('Settings updated')
          }}
        />
      </div>
    </div>
  )
}
```

### Step 2: Update ProductList to Respect Settings

```typescript
import { useInventorySettings, shouldDisplayInventoryChip } from '@/hooks/useInventorySettings'

function ProductList({ products, organizationId, ... }) {
  const { settings } = useInventorySettings(organizationId)

  return (
    <div className="grid grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          organizationId={organizationId}
          showInventoryChip={shouldDisplayInventoryChip(settings, product)}
        />
      ))}
    </div>
  )
}
```

### Step 3: Update ProductCard

```typescript
function ProductCard({ product, organizationId, showInventoryChip }) {
  return (
    <div className="product-card">
      {/* ... other content ... */}

      {/* Inventory Section - Only show if enabled */}
      {showInventoryChip && (
        <div className="flex items-center gap-2">
          <InventoryChip
            productId={product.id}
            organizationId={organizationId}
          />
          <Link href={`/salon/inventory?productId=${product.id}`}>
            Manage
          </Link>
        </div>
      )}
    </div>
  )
}
```

### Step 4: Update Sidebar Navigation

```typescript
import { useInventorySettings } from '@/hooks/useInventorySettings'

function SalonSidebar() {
  const { organizationId } = useSecuredSalonContext()
  const { settings } = useInventorySettings(organizationId)

  const navItems = [
    { title: 'Dashboard', href: '/salon/dashboard' },
    { title: 'POS', href: '/salon/pos' },
    { title: 'Products', href: '/salon/products' },
    // Only show if inventory is enabled
    ...(settings?.inventoryEnabled ? [
      { title: 'Inventory', href: '/salon/inventory' }
    ] : []),
    { title: 'Customers', href: '/salon/customers' }
  ]

  return <Sidebar items={navItems} />
}
```

### Step 5: Add Settings Link to Navigation

Add to "More" menu or Settings section:
```typescript
{
  title: 'Inventory Settings',
  href: '/salon/settings/inventory',
  icon: Package
}
```

## 🎨 UI/UX Features

### Visual Feedback

1. **Enabled State**:
   - ✅ Green "Active" badge
   - Gold accent colors
   - "Inventory management is active" info banner

2. **Disabled State**:
   - ❌ Gray "Disabled" badge
   - Muted colors
   - "Inventory tracking is disabled" warning banner

### User Journey

1. **First Time Setup**:
   ```
   1. Owner goes to Settings → Inventory
   2. Sees inventory is disabled by default
   3. Toggles "Enable Inventory Tracking"
   4. Configures sub-settings (branch tracking, etc.)
   5. "Inventory" appears in sidebar
   6. Product cards now show inventory chips
   ```

2. **Per-Product Control**:
   ```
   1. Create/Edit Product
   2. See "Track Inventory" toggle
   3. Enable for physical products
   4. Disable for services
   5. Only tracked products show inventory data
   ```

3. **Disabling Inventory**:
   ```
   1. Owner goes to Settings → Inventory
   2. Toggles off "Enable Inventory Tracking"
   3. Confirms action (warning: data not deleted)
   4. Inventory features hidden organization-wide
   5. Can re-enable anytime (data preserved)
   ```

## 🔒 Enterprise Features

### Audit Trail

All setting changes create audit records:

```typescript
{
  transaction_type: 'system_config_change',
  smart_code: 'HERA.AUDIT.SETTINGS.INVENTORY.CHANGE.V1',
  metadata: {
    setting: 'inventory_management_enabled',
    old_value: false,
    new_value: true,
    changed_by: userId,
    changed_at: timestamp
  }
}
```

### Permission Control

```typescript
// Only owners/admins can change inventory settings
const canChangeSettings = hasPermission('salon:settings:inventory')
```

### Data Preservation

- Disabling inventory **hides** features but **keeps** data
- Re-enabling shows all historical data
- No data loss on toggle

### SaaS Integration

```typescript
// Check module activation (for pricing tiers)
const hasInventoryModule = organization.metadata.active_modules?.includes('inventory')

if (!hasInventoryModule) {
  return <UpgradePlanPrompt requiredPlan="Professional" />
}
```

## 📊 Default Settings

### New Organizations

```typescript
{
  inventoryEnabled: false, // Disabled by default (opt-in)
  defaultRequiresInventory: false, // Don't track new products by default
  trackByBranch: true, // Multi-location support ready
  allowNegativeStock: false, // Safety first
  autoReorderEnabled: true // Helpful alerts on
}
```

### Recommended for Different Business Types

**Retail/E-commerce**:
```typescript
{
  inventoryEnabled: true,
  defaultRequiresInventory: true, // All products tracked
  trackByBranch: true,
  allowNegativeStock: false,
  autoReorderEnabled: true
}
```

**Service Businesses (Salons)**:
```typescript
{
  inventoryEnabled: true,
  defaultRequiresInventory: false, // Mostly services
  trackByBranch: true,
  allowNegativeStock: true, // Can sell supplies on-demand
  autoReorderEnabled: true
}
```

**Professional Services (Consulting)**:
```typescript
{
  inventoryEnabled: false, // No physical products
  defaultRequiresInventory: false,
  trackByBranch: false,
  allowNegativeStock: false,
  autoReorderEnabled: false
}
```

## 🚀 Migration Plan

### For Existing Organizations

```sql
-- Set default for all existing organizations
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_boolean, smart_code)
SELECT
  id as entity_id,
  'inventory_management_enabled' as field_name,
  'boolean' as field_type,
  true as field_value_boolean, -- Enable for all existing orgs
  'HERA.ORG.SETTINGS.INVENTORY.ENABLED.V1' as smart_code
FROM core_organizations
WHERE NOT EXISTS (
  SELECT 1 FROM core_dynamic_data
  WHERE entity_id = core_organizations.id
  AND field_name = 'inventory_management_enabled'
);
```

## 📚 Related Files

- `/src/hooks/useInventorySettings.ts` - Settings hook
- `/src/components/salon/settings/InventorySettingsCard.tsx` - Settings UI
- `/src/hooks/useInventoryLevels.ts` - Inventory data hook
- `/src/components/salon/products/InventoryChip.tsx` - Stock display chip
- `/src/components/salon/products/ProductList.tsx` - Product grid/list
- `/src/app/salon/inventory/page.tsx` - Inventory management page

## 🎯 Benefits

1. **Flexibility**: Organizations choose their level of complexity
2. **Performance**: No inventory queries if disabled
3. **UX**: Cleaner UI for businesses that don't need inventory
4. **SaaS Ready**: Supports tiered pricing models
5. **Enterprise**: Audit trails and permission controls
6. **HERA Native**: Uses universal 6-table architecture

## ✅ Testing Checklist

- [ ] Toggle inventory on/off at organization level
- [ ] Verify sidebar shows/hides Inventory link
- [ ] Check product cards show/hide inventory chips
- [ ] Test per-product tracking toggle
- [ ] Verify settings persist after refresh
- [ ] Test with multiple branches
- [ ] Check permissions (only owners can change)
- [ ] Verify audit trail creation
- [ ] Test data preservation on disable/enable
- [ ] Check mobile responsive design
