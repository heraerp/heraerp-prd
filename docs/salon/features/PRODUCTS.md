# HERA Salon - Products Feature Guide

**Version**: 1.0
**Last Updated**: 2025-01-07
**Smart Code**: `HERA.DOCS.SALON.FEATURES.PRODUCTS.v1`

> **Complete technical reference for product catalog management, inventory tracking, and barcode scanning**

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Key Innovations](#key-innovations)
4. [Hooks Reference](#hooks-reference)
5. [Data Model](#data-model)
6. [Barcode Scanning](#barcode-scanning)
7. [Enterprise Import/Export](#enterprise-importexport)
8. [Inventory Integration](#inventory-integration)
9. [Common Tasks](#common-tasks)
10. [Known Issues](#known-issues)

---

## 🎯 Overview

### Purpose

The Products feature provides enterprise-grade product catalog management with:
- **Product CRUD Operations**: Create, read, update, delete products
- **Barcode Scanning**: Scan products using camera or external scanners
- **Enterprise Import/Export**: Reusable import/export system (280+ lines saved)
- **Category Management**: Color-coded visual organization
- **Branch Stock Management**: Track stock at specific locations via relationships
- **Transaction-Driven Inventory**: Opening stock via inventory movement modal
- **Smart Delete System**: Automatic fallback to archive when referenced

### Key Differences vs Services

| Feature | Products | Services |
|---------|----------|----------|
| **Import/Export** | Enterprise system (declarative config) | Manual implementation |
| **Barcode Support** | Full barcode scanning with camera | N/A |
| **Inventory Tracking** | Stock levels, reorder points, movements | N/A |
| **Branch Relationships** | STOCK_AT | AVAILABLE_AT |
| **Transaction Integration** | Opening stock prompt after creation | N/A |
| **KPI Calculations** | Profit margin, stock value | Revenue potential |

---

## 🏗️ Architecture

### File Structure

```
/src/app/salon/products/
├── page.tsx                           # Main products page (1,767 lines)

/src/components/salon/products/
├── ProductList.tsx                    # List/grid view component (761 lines)
├── ProductModal.tsx                   # Create/edit modal (lazy loaded)
├── ProductCategoryModal.tsx           # Category modal (lazy loaded)
├── DeleteProductDialog.tsx            # Delete confirmation (lazy loaded)

/src/components/salon/inventory/
├── InventoryMovementModal.tsx         # Opening stock modal (lazy loaded)

/src/components/salon/pos/
├── ScanToCart.tsx                     # Barcode scanner component

/src/components/shared/enterprise/
├── HeraImportExport.tsx               # Reusable import/export system

/src/hooks/
├── useHeraProducts.ts                 # Product data hook (501 lines)
├── useHeraProductCategories.ts        # Category data hook
├── useHeraImportExport.ts             # Enterprise import/export hook
├── useInventorySettings.ts            # Inventory feature toggle
└── entityPresets.ts                   # Product preset configuration
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRODUCTS PAGE                                │
│  /src/app/salon/products/page.tsx                                   │
│                                                                      │
│  1. SecuredSalonProvider → organizationId, currency, branches       │
│  2. useHeraProducts → Fetch products with filters                   │
│  3. useHeraImportExport → Enterprise import/export system           │
│  4. Barcode scanner → ScanToCart component                          │
│  5. ProductList component → Display grid/list view                  │
│  6. InventoryMovementModal → Prompt for opening stock              │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    USEHERAPRODUCTS HOOK                             │
│  /src/hooks/useHeraProducts.ts                                      │
│                                                                      │
│  - Wraps useUniversalEntityV1 with product-specific logic           │
│  - Branch filtering via STOCK_AT relationships                       │
│  - Barcode search (barcode, barcode_primary, gtin, sku)            │
│  - CRUD helpers: create, update, delete, archive, restore           │
│  - Smart delete: Auto-fallback to archive on FK constraints         │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  DATABASE (SACRED SIX)                              │
│                                                                      │
│  core_entities:                                                     │
│    - entity_type = 'PRODUCT'                                        │
│    - entity_name (product name)                                     │
│    - entity_code (product code/SKU)                                 │
│    - smart_code = 'HERA.SALON.PRODUCT.ENTITY.RETAIL.v1'           │
│    - status (active | archived | deleted)                           │
│                                                                      │
│  core_dynamic_data:                                                 │
│    - price_cost, price_market (cost/selling prices)                │
│    - stock_quantity, reorder_level (inventory)                      │
│    - barcode, barcode_primary, barcode_type, gtin, sku             │
│    - brand, size, category                                          │
│                                                                      │
│  core_relationships:                                                │
│    - HAS_CATEGORY (product → category)                              │
│    - STOCK_AT (product → branch location)                           │
└─────────────────────────────────────────────────────────────────────┘
```

**File Path**: `/src/app/salon/products/page.tsx:95`

---

## 🚀 Key Innovations

### 1. Enterprise Import/Export System

**Problem Solved**: Manual import/export code was 280+ lines per feature, duplicated across pages

**Solution**: Declarative configuration system

**Implementation**:

```tsx
// File: /src/app/salon/products/page.tsx:219
const productImportExportConfig: ImportExportConfig<Product> = useMemo(() => ({
  entityName: 'Product',
  entityNamePlural: 'Products',
  filePrefix: 'HERA_Products',
  templateSheetName: 'Products Data',

  // 💰 MULTI-CURRENCY: Organization-specific currency
  currency: currency || 'AED',
  currencySymbol: currency || 'AED',

  // Field definitions (declarative)
  fields: [
    {
      headerName: 'Product Name',
      fieldName: 'name',
      type: 'text',
      required: true,
      example: 'L\'Oreal Professional Shampoo 500ml'
    },
    {
      headerName: `Cost Price (${currency})`,
      fieldName: 'cost_price',
      type: 'number',
      required: true,
      example: 75
    },
    {
      headerName: `Selling Price (${currency})`,
      fieldName: 'selling_price',
      type: 'number',
      required: true,
      example: 150
    },
    {
      headerName: 'Barcode',
      fieldName: 'barcode',
      type: 'text',
      example: '3474636391813'
    }
    // ... more fields
  ],

  // Reference data for dropdowns
  referenceData: [
    {
      name: 'categories',
      displayName: 'Available Categories',
      items: productCategories.map(c => ({ id: c.id, name: c.entity_name }))
    }
  ],

  // CRUD operations
  onCreate: async (data) => await createProduct(data),
  exportData: products,
  exportMapper: (product) => ({
    'Product Name': product.entity_name,
    [`Cost Price (${currency})`]: product.price_cost || 0,
    // ... field mapping
  }),

  // Validation rules
  validateRow: (data, rowIndex) => {
    if (data.selling_price < data.cost_price) {
      return 'Selling price must be greater than cost price'
    }
    return null
  }
}), [productCategories, products, currency, createProduct])

// Use the enterprise hook
const {
  downloadTemplate,
  importFile,
  exportData,
  isImporting,
  importProgress,
  importResults
} = useHeraImportExport(productImportExportConfig)
```

**Benefits**:
- 280+ lines of code eliminated (replaced with 60-line config)
- Consistent UX across all import/export features
- Declarative validation rules
- Multi-currency support built-in
- Professional Excel templates with instructions

**File Path**: `/src/app/salon/products/page.tsx:219-418`

---

### 2. Barcode Scanning System

**Purpose**: Scan products using camera or external barcode scanners

**Implementation**:

```tsx
// File: /src/app/salon/products/page.tsx:1078
{showScanner && (
  <div className="mx-6 mt-4">
    <div className="p-4 rounded-xl border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scan className="w-5 h-5" style={{ color: COLORS.gold }} />
          <h3 className="text-sm font-semibold">Barcode Scanner</h3>
        </div>
        <button onClick={() => setShowScanner(false)}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <ScanToCart
        organizationId={organizationId}
        onProductFound={handleProductScanned}
        onError={(message) => showError('Scanner error', message)}
      />
    </div>
  </div>
)}

const handleProductScanned = useCallback((product: any) => {
  setShowScanner(false)
  showSuccess('Product found', `Found: ${product.entity_name}`)

  // Open product in edit modal
  setEditingProduct(product)
  setModalOpen(true)
}, [showSuccess])
```

**Features**:
- Camera-based barcode scanning
- Support for EAN13, UPC, Code128, etc.
- External scanner support (USB/Bluetooth)
- Search by: barcode, barcode_primary, gtin, sku
- Opens product in edit mode when found

**File Path**: `/src/app/salon/products/page.tsx:759-769, 1078-1110`

---

### 3. Transaction-Driven Inventory

**Purpose**: Prompt for opening stock immediately after product creation

**Implementation**:

```tsx
// File: /src/app/salon/products/page.tsx:601
const handleSave = useCallback(async (data: any) => {
  const loadingId = showLoading(/* ... */)

  try {
    let productId: string | undefined

    if (editingProduct) {
      await updateProduct(editingProduct.id, data)
      productId = editingProduct.id
    } else {
      const result = await createProduct(data)
      productId = result?.id

      // ✅ TRANSACTION-DRIVEN INVENTORY: Prompt for opening stock
      if (productId) {
        setTimeout(() => {
          setInventoryMovementProduct({
            productId,
            movementType: 'OPENING'
          })
          setInventoryMovementModalOpen(true)
        }, 500)
      }
    }

    setModalOpen(false)
    setEditingProduct(null)
  } catch (error: any) {
    // Error handling
  }
}, [/* ... */])
```

**Workflow**:
1. User creates new product
2. Product saved successfully
3. Inventory movement modal opens automatically
4. User enters opening stock transaction
5. Stock level initialized via transaction (not direct update)

**File Path**: `/src/app/salon/products/page.tsx:601-649`

---

### 4. Deduplication System

**Problem**: React duplicate key warnings when product data has duplicates

**Solution**: Automatic deduplication with logging

```tsx
// File: /src/app/salon/products/page.tsx:433
const filteredAndSortedProducts = useMemo(() => {
  // Step 1: Deduplicate products by ID
  const uniqueProductsMap = new Map()
  const duplicateCount = products.length

  products.forEach(product => {
    if (product && product.id) {
      if (uniqueProductsMap.has(product.id)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[Products] 🔄 Duplicate detected: ${product.entity_name} (${product.id})`)
        }
      } else {
        uniqueProductsMap.set(product.id, product)
      }
    }
  })

  const uniqueProducts = Array.from(uniqueProductsMap.values())

  // Log deduplication stats
  if (uniqueProducts.length < duplicateCount) {
    console.warn(`[Products] 🔄 Removed ${duplicateCount - uniqueProducts.length} duplicates`)
  }

  // Step 2: Filter products (search, category, archive status)
  // Step 3: Sort products (active first, then by user selection)
  return sorted
}, [products, searchQuery, categoryFilter, sortBy, includeArchived])
```

**File Path**: `/src/app/salon/products/page.tsx:433-545`

---

## 🎣 Hooks Reference

### useHeraProducts Hook

**File**: `/src/hooks/useHeraProducts.ts` (501 lines)

**Signature**:

```tsx
export interface UseHeraProductsOptions {
  organizationId?: string
  includeArchived?: boolean
  searchQuery?: string
  categoryFilter?: string
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    branch_id?: string
    limit?: number
    status?: string
  }
}

export function useHeraProducts(options?: UseHeraProductsOptions): {
  products: Product[]
  allProducts: Product[]
  isLoading: boolean
  error: any
  refetch: () => void
  createProduct: (data: ProductFormData) => Promise<any>
  updateProduct: (id: string, data: Partial<ProductFormData>) => Promise<any>
  archiveProduct: (id: string) => Promise<any>
  restoreProduct: (id: string) => Promise<any>
  deleteProduct: (id: string) => Promise<{ success: boolean, archived: boolean, message?: string }>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}
```

**File Path**: `/src/hooks/useHeraProducts.ts:1`

---

### Key Features

**1. Enterprise Barcode Fields**:

```tsx
// File: /src/hooks/useHeraProducts.ts:33
export interface Product {
  // Legacy barcode field
  barcode?: string

  // ✅ ENTERPRISE BARCODE FIELDS
  barcode_primary?: string     // Primary barcode identifier
  barcode_type?: string         // EAN13, UPC, Code128, etc.
  barcodes_alt?: string[]       // Alternative barcodes (array)
  gtin?: string                 // Global Trade Item Number
  sku?: string                  // Stock Keeping Unit
  size?: string                 // Product size/volume
}
```

**2. Branch Filtering via STOCK_AT**:

```tsx
// File: /src/hooks/useHeraProducts.ts:420
const filteredProducts = useMemo(() => {
  let filtered = products as Product[]

  // Filter by STOCK_AT branch relationship
  if (options?.filters?.branch_id && options.filters.branch_id !== 'all') {
    filtered = filtered.filter(p => {
      const stockAtRelationships = p.relationships?.STOCK_AT
      if (!stockAtRelationships) return false

      // Handle array and single relationship formats
      if (Array.isArray(stockAtRelationships)) {
        return stockAtRelationships.some(
          rel => rel.to_entity?.id === options.filters?.branch_id ||
                 rel.to_entity_id === options.filters?.branch_id
        )
      } else {
        return stockAtRelationships.to_entity?.id === options.filters?.branch_id ||
               stockAtRelationships.to_entity_id === options.filters?.branch_id
      }
    })
  }

  // Search by name, code, barcode, gtin, sku, brand
  if (options?.searchQuery) {
    const query = options.searchQuery.toLowerCase()
    filtered = filtered.filter(product =>
      product.entity_name?.toLowerCase().includes(query) ||
      product.barcode?.toLowerCase().includes(query) ||
      product.barcode_primary?.toLowerCase().includes(query) ||
      product.gtin?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query)
    )
  }

  return filtered
}, [products, options?.filters?.branch_id, options?.searchQuery])
```

**File Path**: `/src/hooks/useHeraProducts.ts:420-483`

---

## 💾 Data Model

### Product Interface

```tsx
export interface Product {
  // Core entity fields
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  status: 'active' | 'archived' | 'deleted'
  entity_description?: string

  // Pricing (flattened from dynamic_fields)
  price_cost?: number          // Cost price
  price_market?: number         // Selling price
  cost_price?: number           // Alias for price_cost
  selling_price?: number        // Alias for price_market

  // Inventory (flattened from dynamic_fields)
  stock_quantity?: number       // Current stock
  stock_level?: number          // Alias for stock_quantity
  reorder_level?: number        // Reorder point

  // Product details
  brand?: string
  size?: string
  category?: string             // Enriched from HAS_CATEGORY relationship

  // Barcode fields
  barcode?: string              // Legacy barcode
  barcode_primary?: string      // Primary barcode
  barcode_type?: string         // EAN13, UPC, Code128, etc.
  barcodes_alt?: string[]       // Alternative barcodes
  gtin?: string                 // Global Trade Item Number
  sku?: string                  // Stock Keeping Unit

  // Relationships
  relationships?: {
    HAS_CATEGORY?: { to_entity_id: string }
    STOCK_AT?: Array<{ to_entity_id: string, to_entity?: any }>
  }

  // Audit fields
  created_at: string
  updated_at: string
}
```

**File Path**: `/src/hooks/useHeraProducts.ts:14-46`

---

### Sacred Six Storage

**Table: `core_entities`**

```sql
INSERT INTO core_entities (
  entity_type,
  entity_name,
  entity_code,
  smart_code,
  entity_description,
  status,
  organization_id
) VALUES (
  'PRODUCT',
  'L\'Oreal Professional Shampoo 500ml',
  'LOREAL-SHP-500',
  'HERA.SALON.PRODUCT.ENTITY.RETAIL.v1',
  'Professional salon shampoo for color-treated hair',
  'active',
  'org-uuid'
)
```

**Table: `core_dynamic_data`**

```sql
-- Pricing fields
INSERT INTO core_dynamic_data (
  entity_id, field_name, field_value_number, field_type, smart_code, organization_id
) VALUES
  ('product-uuid', 'price_cost', 75.00, 'number', 'HERA.SALON.PRODUCT.DYN.PRICE.COST.V1', 'org-uuid'),
  ('product-uuid', 'price_market', 150.00, 'number', 'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.V1', 'org-uuid'),
  ('product-uuid', 'stock_quantity', 25, 'number', 'HERA.SALON.PRODUCT.DYN.STOCK.QTY.V1', 'org-uuid'),
  ('product-uuid', 'reorder_level', 10, 'number', 'HERA.SALON.PRODUCT.DYN.REORDER.LEVEL.V1', 'org-uuid');

-- Product details
INSERT INTO core_dynamic_data (
  entity_id, field_name, field_value_text, field_type, smart_code, organization_id
) VALUES
  ('product-uuid', 'brand', 'L\'Oreal Professional', 'text', 'HERA.SALON.PRODUCT.DYN.BRAND.V1', 'org-uuid'),
  ('product-uuid', 'size', '500ml', 'text', 'HERA.SALON.PRODUCT.DYN.SIZE.V1', 'org-uuid'),
  ('product-uuid', 'barcode_primary', '3474636391813', 'text', 'HERA.SALON.PRODUCT.DYN.BARCODE.PRIMARY.V1', 'org-uuid'),
  ('product-uuid', 'barcode_type', 'EAN13', 'text', 'HERA.SALON.PRODUCT.DYN.BARCODE.TYPE.V1', 'org-uuid'),
  ('product-uuid', 'gtin', '03474636391813', 'text', 'HERA.SALON.PRODUCT.DYN.BARCODE.GTIN.V1', 'org-uuid'),
  ('product-uuid', 'sku', 'LOREAL-PRO-SHP-500', 'text', 'HERA.SALON.PRODUCT.DYN.SKU.V1', 'org-uuid');
```

**Table: `core_relationships`**

```sql
-- Category relationship
INSERT INTO core_relationships (
  source_entity_id, target_entity_id, relationship_type, organization_id
) VALUES (
  'product-uuid', 'category-uuid', 'HAS_CATEGORY', 'org-uuid'
);

-- Stock at multiple branches
INSERT INTO core_relationships (
  source_entity_id, target_entity_id, relationship_type, organization_id
) VALUES
  ('product-uuid', 'branch-1-uuid', 'STOCK_AT', 'org-uuid'),
  ('product-uuid', 'branch-2-uuid', 'STOCK_AT', 'org-uuid');
```

---

## 🔍 Barcode Scanning

### Scanner Integration

**Component**: `ScanToCart` (`/src/components/salon/pos/ScanToCart.tsx`)

**Usage**:

```tsx
<ScanToCart
  organizationId={organizationId}
  onProductFound={handleProductScanned}
  onError={(message) => showError('Scanner error', message)}
/>
```

**Features**:
- Camera-based scanning (uses device camera)
- External scanner support (USB/Bluetooth)
- Supported formats: EAN13, UPC, Code128, QR Code
- Auto-focus and beep on successful scan
- Search across multiple barcode fields

**Search Priority**:
1. `barcode_primary` (primary identifier)
2. `barcode` (legacy field)
3. `gtin` (Global Trade Item Number)
4. `sku` (Stock Keeping Unit)
5. `barcodes_alt` (alternative barcodes array)

**File Path**: `/src/app/salon/products/page.tsx:1103-1107`

---

## 📊 Enterprise Import/Export

### Template Download

**Simplified Implementation**:

```tsx
const handleDownloadTemplate = useCallback(async () => {
  try {
    const { fileName } = await downloadTemplate()
    showSuccess('Template downloaded', 'Fill in the Excel template and import it back')
  } catch (error: any) {
    showError('Failed to download template', error.message)
  }
}, [downloadTemplate, showSuccess, showError])
```

**Template Features**:
- Two-sheet workbook (Instructions + Products Data)
- Dynamic currency in headers (`Cost Price (AED)`)
- Available categories listed in instructions
- Example row with proper formatting
- Column widths optimized for readability

**File Path**: `/src/app/salon/products/page.tsx:838-848`

---

### Import Process

**Simplified Implementation**:

```tsx
const handleImport = useCallback(async (file: File) => {
  try {
    const results = await importFile(file)

    if (results.success > 0 && results.failed === 0) {
      showSuccess('Import successful', `Imported ${results.success} products`)
    } else if (results.success > 0 && results.failed > 0) {
      showSuccess('Partial import', `${results.success} succeeded, ${results.failed} failed`)
    } else {
      showError('Import failed', results.errors[0] || 'No products imported')
    }
  } catch (error: any) {
    showError('Failed to import products', error.message)
  }
}, [importFile, showSuccess, showError])
```

**Features**:
- Automatic field mapping
- Row-by-row validation
- Detailed error reporting
- Progress indicator
- Empty template detection

**File Path**: `/src/app/salon/products/page.tsx:851-872`

---

## 🔗 Inventory Integration

### Inventory Chip

**Purpose**: Show real-time stock levels for each product

**Implementation**:

```tsx
// In ProductList component
<InventoryChip
  productId={product.id}
  organizationId={organizationId}
/>

<Link href={`/salon/inventory?productId=${product.id}&branchId=${selectedBranchId}`}>
  <span className="text-xs underline">View</span>
  <ExternalLink className="w-3 h-3" />
</Link>
```

**Features**:
- Real-time stock level display
- Color-coded status (low stock = red, adequate = green)
- Deep link to inventory page with filters
- Branch-aware navigation

**File Path**: `/src/components/salon/products/ProductList.tsx:353-362`

---

## 🔧 Common Tasks

### Task 1: Create Product with Barcode

```tsx
const { createProduct } = useHeraProducts({ organizationId })

await createProduct({
  name: 'L\'Oreal Professional Shampoo 500ml',
  code: 'LOREAL-SHP-500',
  description: 'Professional salon shampoo',
  cost_price: 75.00,
  selling_price: 150.00,
  stock_level: 25,
  reorder_level: 10,
  brand: 'L\'Oreal Professional',
  barcode_primary: '3474636391813',
  barcode_type: 'EAN13',
  gtin: '03474636391813',
  sku: 'LOREAL-PRO-SHP-500',
  size: '500ml',
  category_id: 'category-uuid',
  branch_ids: ['branch-1-uuid', 'branch-2-uuid']
})
```

**Result**: Product created with barcode fields and STOCK_AT relationships. Inventory movement modal opens for opening stock.

---

### Task 2: Search Product by Barcode

**Using Scanner**:
1. Click "Scan Barcode" button
2. Scanner opens with camera view
3. Point camera at barcode
4. Product found, opens in edit modal

**Using Search**:
```tsx
const { products } = useHeraProducts({
  organizationId,
  searchQuery: '3474636391813' // Searches barcode, gtin, sku
})
```

---

### Task 3: Import Products from Excel

**Steps**:
1. Click "Import Products"
2. Download template
3. Fill in product data:
   ```
   Name*,Code,Category,Cost Price (AED),Selling Price (AED),Barcode,SKU
   L'Oreal Shampoo,LOREAL-001,Hair Care,75,150,3474636391813,LOREAL-PRO-SHP-500
   ```
4. Upload file
5. Review import results

---

## ⚠️ Known Issues

### Issue 1: Duplicate Products in List

**Problem**: React duplicate key warnings when product data has duplicates

**Solution**: Automatic deduplication (implemented)

```tsx
// File: /src/app/salon/products/page.tsx:433
const uniqueProductsMap = new Map()
products.forEach(product => {
  if (!uniqueProductsMap.has(product.id)) {
    uniqueProductsMap.set(product.id, product)
  }
})
const uniqueProducts = Array.from(uniqueProductsMap.values())
```

**Status**: ✅ Fixed

---

### Issue 2: Category Delete Not Refreshing UI

**Problem**: Deleted category still shows in category list until page refresh

**Solution**: Manual refetch after delete

```tsx
// File: /src/app/salon/products/page.tsx:808
const handleDeleteCategory = async () => {
  await deleteCategory(categoryToDelete.id)

  // ✅ CRITICAL FIX: Manually refetch categories
  await refetchCategories()

  showSuccess('Category deleted')
}
```

**Status**: ✅ Fixed

---

## 📖 Related Documentation

### Feature Documentation
- [SERVICES.md](./SERVICES.md) - Service catalog (similar architecture)
- [INVENTORY.md](./INVENTORY.md) - Inventory tracking and movements
- [POINT-OF-SALE.md](./POINT-OF-SALE.md) - POS system with product selection

### Technical Reference
- [HOOKS.md](./HOOKS.md) - Custom hooks reference
- [DATA-MODELS.md](./DATA-MODELS.md) - Sacred Six schema

---

## 🎯 Success Metrics

A product catalog feature is production-ready when:

- ✅ **All CRUD operations work**: Create, read, update, delete with error handling
- ✅ **Barcode scanning functional**: Camera and external scanners work
- ✅ **Import/export robust**: Template generation, bulk import, validation
- ✅ **Inventory integration complete**: Stock levels, movements, deep links
- ✅ **Smart delete safe**: Automatic archive fallback prevents data loss
- ✅ **Mobile responsive**: Grid/list views work on 375px+ screens
- ✅ **Multi-currency support**: Prices display in organization currency

---

<div align="center">

**Built with HERA DNA** | **Products Module v1.0** | **Enterprise Ready**

[← Back to Developer Guide](../DEVELOPER-GUIDE.md) | [Services →](./SERVICES.md) | [Inventory →](./INVENTORY.md)

</div>
