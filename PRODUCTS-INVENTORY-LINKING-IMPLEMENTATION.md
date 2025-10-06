# HERA Enterprise Products ↔ Inventory Deep Linking Implementation

## Overview
Enterprise-grade bidirectional linking between Products and Inventory pages with shared branch context, deep linking, and real-time stock visibility.

## Architecture

### Core Principles
- ✅ Six-table architecture (no schema changes)
- ✅ No direct DB/Supabase from components
- ✅ Universal API v2 only
- ✅ Semantic tokens (no hardcoded colors)
- ✅ WCAG AA accessibility
- ✅ Shared branch context via `useBranchFilter`

### Smart Codes
```typescript
HERA.UI.PRODUCTS.INVENTORY.LINK.V1    // Products → Inventory link
HERA.UI.INVENTORY.PRODUCT.LINK.V1     // Inventory → Product link
HERA.HOOKS.INVENTORY.LEVELS.V1        // Inventory levels hook
HERA.UI.INVENTORY.CHIP.V1             // Stock level chip component
```

## Implementation Plan

### Phase 1: Foundation (Completed ✅)

1. **Enhanced `useBranchFilter` Hook**
   - Added `selectedBranchId` alias for consistency
   - Added `setSelectedBranchId` alias
   - Maintains backward compatibility

2. **Created `useInventoryLevels` Hook**
   - Location: `/src/hooks/useInventoryLevels.ts`
   - Features:
     - Real-time stock levels per product per branch
     - Automatic branch context from `useBranchFilter`
     - Intelligent fallback (analytics → RPC)
     - React Query caching (30s stale time)
     - Helper functions for mapping and status

3. **Created `InventoryChip` Component**
   - Location: `/src/components/salon/products/InventoryChip.tsx`
   - Features:
     - Read-only stock display
     - Semantic color variants
     - Loading/error states
     - Compact variant for tables
     - No hardcoded colors

### Phase 2: Products Page Enhancement

#### 2.1 Update ProductList Component

**File**: `/src/components/salon/products/ProductList.tsx`

**Changes Required**:

1. Add imports:
```typescript
import Link from 'next/link'
import { InventoryChip } from './InventoryChip'
import { ExternalLink } from 'lucide-react'
import { useBranchFilter } from '@/hooks/useBranchFilter'
```

2. Add organizationId prop:
```typescript
interface ProductListProps {
  products: Product[]
  organizationId: string  // NEW
  loading?: boolean
  viewMode?: 'grid' | 'list'
  currency?: string
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onArchive: (product: Product) => void
  onRestore: (product: Product) => void
}
```

3. Get branch context:
```typescript
export function ProductList({ products, organizationId, ...props }) {
  const { selectedBranchId } = useBranchFilter()

  // ... rest of component
}
```

4. Update Table Header (add Inventory column):
```typescript
<TableHead className="!text-[#F5E6C8]">Stock</TableHead>
<TableHead className="!text-[#F5E6C8]">Inventory</TableHead>  // NEW
<TableHead className="!text-[#F5E6C8]">Value</TableHead>
```

5. Update Table Row (add inventory cell):
```typescript
<TableCell>
  {stockQty} units
</TableCell>

{/* NEW CELL */}
<TableCell>
  <div className="flex items-center gap-2">
    <InventoryChip
      productId={product.id}
      organizationId={organizationId}
    />
    <Link
      href={`/salon/inventory?productId=${product.id}${selectedBranchId ? `&branchId=${selectedBranchId}` : ''}`}
      className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
      aria-label={`View inventory for ${product.entity_name}`}
    >
      <span className="text-xs underline-offset-4 hover:underline">View</span>
      <ExternalLink className="w-3 h-3" />
    </Link>
  </div>
</TableCell>
```

6. Update Grid View (ProductCard):
```typescript
function ProductCard({ product, organizationId, ... }) {
  const { selectedBranchId } = useBranchFilter()

  return (
    <div>
      {/* ... existing card content ... */}

      {/* Add inventory section */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <InventoryChip
            productId={product.id}
            organizationId={organizationId}
            showStatus
          />
          <Link
            href={`/salon/inventory?productId=${product.id}${selectedBranchId ? `&branchId=${selectedBranchId}` : ''}`}
            className="text-xs text-primary hover:text-primary/80 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          >
            Manage Inventory →
          </Link>
        </div>
      </div>
    </div>
  )
}
```

#### 2.2 Update Products Page

**File**: `/src/app/salon/products/page.tsx`

**Changes Required**:

1. Add URL parameter handling:
```typescript
'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

function SalonProductsPageContent() {
  const searchParams = useSearchParams()
  const highlightedProductId = searchParams.get('productId')
  const productRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Scroll to highlighted product
  useEffect(() => {
    if (highlightedProductId && productRefs.current[highlightedProductId]) {
      setTimeout(() => {
        productRefs.current[highlightedProductId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 100)
    }
  }, [highlightedProductId, products])

  // ... rest of component
}
```

2. Pass organizationId to ProductList:
```typescript
<ProductList
  products={filteredProducts}
  organizationId={organizationId}  // NEW
  loading={isLoading}
  viewMode={viewMode}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onArchive={handleArchive}
  onRestore={handleRestore}
/>
```

3. Add highlight banner when coming from inventory:
```typescript
{highlightedProductId && (
  <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-primary" />
        <span className="text-sm text-foreground">
          Showing product from inventory
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/salon/products')}
        className="text-muted-foreground hover:text-foreground"
      >
        Clear filter
      </Button>
    </div>
  </div>
)}
```

### Phase 3: Inventory Page Enhancement

**File**: `/src/app/salon/inventory/page.tsx`

**Changes Required**:

1. Add URL parameter handling:
```typescript
'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export default function SalonInventoryPage() {
  const searchParams = useSearchParams()
  const deepProductId = searchParams.get('productId')
  const deepBranchId = searchParams.get('branchId')

  const { selectedBranchId, setSelectedBranchId } = useBranchFilter()

  // Apply deep link branch filter
  useEffect(() => {
    if (deepBranchId && deepBranchId !== selectedBranchId) {
      console.log('[Inventory] Setting branch from deep link:', deepBranchId)
      setSelectedBranchId(deepBranchId)
    }
  }, [deepBranchId, selectedBranchId, setSelectedBranchId])

  // ... rest of component
}
```

2. Add focused product banner:
```typescript
{deepProductId && (
  <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Package className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Focused on Product
          </p>
          <code className="text-xs text-muted-foreground font-mono">
            {items.find(i => i.id === deepProductId)?.entity_name || deepProductId}
          </code>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/salon/products?productId=${deepProductId}`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm px-3 py-1.5"
        >
          <ExternalLink className="w-4 h-4" />
          Edit Product
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/salon/inventory')}
        >
          Clear
        </Button>
      </div>
    </div>
  </div>
)}
```

3. Filter items when productId is present:
```typescript
const displayItems = useMemo(() => {
  let filtered = items

  // Filter by deep link product ID
  if (deepProductId) {
    filtered = filtered.filter(item => item.id === deepProductId)
  }

  // ... other filters

  return filtered
}, [items, deepProductId, searchQuery, categoryFilter])
```

4. Add "Edit Product" link to each inventory row:
```typescript
// In the item rendering section
<div className="flex items-center gap-2">
  <Button
    size="sm"
    onClick={() => handleManageStock(item)}
    style={{ backgroundColor: COLORS.gold, color: COLORS.charcoalDark }}
  >
    <Edit className="w-4 h-4 mr-2" />
    Manage Stock
  </Button>

  {/* NEW */}
  <Link
    href={`/salon/products?productId=${item.id}`}
    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm px-3 py-1.5"
  >
    <ExternalLink className="w-3 h-3" />
    Edit Product
  </Link>
</div>
```

### Phase 4: API Endpoint Creation

**File**: `/src/app/api/v2/analytics/inventory/levels/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productIds = searchParams.get('product_ids')?.split(',')
    const branchId = searchParams.get('branch_id')
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Query dynamic data for stock quantities
    let query = supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_number')
      .eq('organization_id', organizationId)
      .like('field_name', 'stock_qty_%')

    if (productIds && productIds.length > 0) {
      query = query.in('entity_id', productIds)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform to inventory levels format
    const levels = data.map(row => {
      const branchIdFromField = row.field_name.replace('stock_qty_', '')
      return {
        product_id: row.entity_id,
        branch_id: branchIdFromField,
        on_hand: row.field_value_number || 0,
        reserved: 0, // TODO: Calculate from reservations
        available: row.field_value_number || 0,
        last_updated: new Date().toISOString()
      }
    })

    // Filter by branch if specified
    const filteredLevels = branchId
      ? levels.filter(l => l.branch_id === branchId)
      : levels

    return NextResponse.json({
      items: filteredLevels,
      total_count: filteredLevels.length,
      cached_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Analytics Inventory Levels] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory levels' },
      { status: 500 }
    )
  }
}
```

## Testing Checklist

### Products → Inventory Flow
- [ ] Click "View inventory" on a product
- [ ] Inventory page opens with that product focused
- [ ] Branch filter is preserved from products page
- [ ] Banner shows "Focused on Product" with product name
- [ ] "Edit Product" link navigates back correctly
- [ ] Stock levels display correctly for selected branch

### Inventory → Products Flow
- [ ] Click "Edit Product" from inventory row
- [ ] Products page opens and scrolls to that product
- [ ] Product is highlighted/expanded
- [ ] Can edit product immediately
- [ ] Returning to inventory maintains filters

### Branch Context Sync
- [ ] Select branch on Products page
- [ ] Stock chips update to show branch-specific levels
- [ ] Navigate to Inventory via deep link
- [ ] Same branch is selected on Inventory page
- [ ] Change branch on Inventory
- [ ] Return to Products - branch filter is synced

### Accessibility
- [ ] All links have proper focus rings
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Screen reader announces links correctly
- [ ] ARIA labels present on icon-only buttons
- [ ] Color contrast meets WCAG AA

### Performance
- [ ] Inventory levels fetch only for visible products
- [ ] React Query caches results (check DevTools)
- [ ] No unnecessary re-renders
- [ ] Deep links don't cause layout shift
- [ ] Branch changes debounced appropriately

## Benefits

### User Experience
- Seamless navigation between Products and Inventory
- Context preservation (branch, filters, scroll position)
- Real-time stock visibility on products list
- One-click access to detailed inventory management
- Clear visual feedback for focused products

### Developer Experience
- Type-safe hooks and components
- Reusable inventory chip component
- Consistent URL patterns
- Automatic branch context sync
- No prop drilling needed

### Business Value
- Faster inventory operations (fewer clicks)
- Better stock visibility for sales team
- Reduced navigation cognitive load
- Consistent UX across modules
- Foundation for future enhancements

## Future Enhancements

1. **Smart Suggestions**
   - Show "Low stock" products on products page
   - Suggest reordering based on sales velocity

2. **Bulk Operations**
   - Select multiple products on Products page
   - Navigate to Inventory with multi-select

3. **Analytics Integration**
   - Stock turn ratio on product cards
   - Trend indicators (↑↓) for stock movement

4. **Mobile Optimization**
   - Swipe gestures for quick navigation
   - Bottom sheet for inventory details

## Maintenance Notes

- Update `useInventoryLevels` if stock calculation logic changes
- Ensure deep link params are validated and sanitized
- Monitor analytics endpoint performance
- Cache invalidation strategy for stock updates
- Document any new URL parameters added
