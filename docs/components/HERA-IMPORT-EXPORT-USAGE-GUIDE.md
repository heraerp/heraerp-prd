# HERA Enterprise Import/Export System - Usage Guide

**Smart Code:** `HERA.ENTERPRISE.IMPORT_EXPORT.DOCUMENTATION.v1`

## 📋 Overview

The HERA Enterprise Import/Export System is a universal, reusable hook that provides enterprise-grade Excel/CSV import and export functionality across all HERA applications. It handles validation, progress tracking, error handling, batch operations, and generates professional templates with instructions.

**Key Features:**
- ✅ Universal configuration-based setup
- ✅ Enterprise-grade Excel template generation with instructions
- ✅ Page-specific customization (instructions, warnings, examples, column widths)
- ✅ Smart column auto-sizing based on field types
- ✅ Real-time import progress tracking
- ✅ Comprehensive error handling with row-level errors
- ✅ Custom validation and parsing support
- ✅ Reference data inclusion (categories, branches, etc.)
- ✅ Export with custom mapping
- ✅ SSR-safe browser-only operations

---

## 🚀 Quick Start

### 1. Import the Hook and Types

```typescript
import { useHeraImportExport } from '@/components/shared/enterprise/HeraImportExport/useHeraImportExport'
import type { ImportExportConfig } from '@/components/shared/enterprise/HeraImportExport/types'
```

### 2. Define Your Configuration

```typescript
const myImportConfig: ImportExportConfig<MyEntityType> = {
  // Basic entity info
  entityName: 'Product',
  entityNamePlural: 'Products',
  filePrefix: 'HERA_Products',
  templateSheetName: 'Products Data',

  // Field definitions
  fields: [
    {
      headerName: 'Product Name',
      fieldName: 'product_name',
      type: 'text',
      required: true,
      example: 'Professional Shampoo 500ml'
    },
    {
      headerName: 'Price',
      fieldName: 'price',
      type: 'number',
      required: true,
      example: 150.00
    }
    // ... more fields
  ],

  // CRUD operations
  onCreate: async (data) => {
    await createEntity(data)
  },

  // Optional: Reference data
  referenceData: [
    {
      name: 'categories',
      displayName: 'Product Categories',
      items: categories.map(c => ({ id: c.id, name: c.name }))
    }
  ],

  // Optional: Export data
  exportData: products,

  // 🎯 CUSTOMIZATION: Page-specific instructions
  customWarning: '⚠️ IMPORTANT: CREATE CATEGORIES FIRST',
  customInstructions: [
    'Category must match existing category names exactly',
    'Selling Price must be greater than Cost Price',
    'Stock quantities cannot be negative'
  ],
  exampleNote: 'Professional salon product example',
  columnWidths: [25, 12, 15, 12, 12, 15, 15, 20]
}
```

### 3. Use the Hook

```typescript
const {
  // State
  isImporting,
  isExporting,
  importProgress,
  importResults,

  // Actions
  downloadTemplate,
  importFile,
  exportData,
  resetImport
} = useHeraImportExport(myImportConfig)
```

### 4. Implement UI Controls

```typescript
// Download template button
<button onClick={downloadTemplate}>
  Download Template
</button>

// Import file button
<input
  type="file"
  accept=".xlsx,.csv"
  onChange={(e) => {
    const file = e.target.files?.[0]
    if (file) importFile(file)
  }}
/>

// Export data button
<button onClick={exportData}>
  Export to Excel
</button>

// Show progress
{isImporting && importProgress && (
  <div>
    Importing: {importProgress.current} / {importProgress.total}
    ({importProgress.percentage}%)
  </div>
)}

// Show results
{importResults && (
  <div>
    Total: {importResults.total}
    Success: {importResults.success}
    Failed: {importResults.failed}
    {importResults.errors.map(err => <div key={err}>{err}</div>)}
  </div>
)}
```

---

## 📖 Configuration Reference

### ImportExportConfig<T>

#### Core Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `entityName` | `string` | ✅ | Singular entity name (e.g., 'Product', 'Customer') |
| `entityNamePlural` | `string` | ✅ | Plural form (e.g., 'Products', 'Customers') |
| `fields` | `ImportField[]` | ✅ | Field definitions (see below) |
| `onCreate` | `(data: Partial<T>) => Promise<void>` | ✅ | Function to create entity |

#### Optional Properties

| Property | Type | Description |
|----------|------|-------------|
| `onUpdate` | `(id: string, data: Partial<T>) => Promise<void>` | Function to update entity |
| `referenceData` | `ReferenceData[]` | Reference data to include in template |
| `exportData` | `T[]` | Data array for export |
| `exportMapper` | `(item: T) => Record<string, any>` | Custom export row mapper |
| `validateRow` | `(data: any, rowIndex: number) => string \| null` | Custom validation function |
| `filePrefix` | `string` | File name prefix (defaults to entityNamePlural) |
| `templateSheetName` | `string` | Template sheet name (defaults to 'Data') |

#### 🎯 Customization Properties (Enterprise Features)

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `customWarning` | `string` | Custom warning message at top of instructions | "⚠️ IMPORTANT: CREATE REFERENCE DATA FIRST" |
| `customInstructions` | `string[]` | Page-specific instructions (added after generic instructions) | `[]` |
| `exampleNote` | `string` | Note for example row | "for reference only" |
| `columnWidths` | `number[]` | Custom column widths in characters (must match number of fields) | Auto-calculated |

#### 💰 Multi-Currency Support

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `currency` | `string` | Currency code for price fields (e.g., 'USD', 'EUR', 'AED', 'GBP') | `undefined` |
| `currencySymbol` | `string` | Currency symbol for display (e.g., '$', '€', 'AED', '£') | Falls back to `currency` if not provided |

---

## 📝 Field Configuration (ImportField)

### Basic Structure

```typescript
{
  headerName: string,      // Display name in Excel header
  fieldName: string,       // Internal database field name
  type: 'text' | 'number' | 'boolean' | 'date' | 'enum',
  required?: boolean,      // Is this field required?
  example?: any,          // Example value for template
  enumValues?: string[],  // Allowed values if type is 'enum'
  parser?: (value: any) => any,  // Custom parser function
  description?: string    // Field description for docs
}
```

### Field Types

#### Text Field
```typescript
{
  headerName: 'Product Name',
  fieldName: 'product_name',
  type: 'text',
  required: true,
  example: 'Professional Shampoo 500ml',
  description: 'Name of the product'
}
```

#### Number Field
```typescript
{
  headerName: 'Price',
  fieldName: 'price',
  type: 'number',
  required: true,
  example: 150.00,
  description: 'Product price in AED'
}
```

#### Boolean Field
```typescript
{
  headerName: 'Active',
  fieldName: 'is_active',
  type: 'boolean',
  required: false,
  example: 'Yes',
  description: 'Enter Yes or No'
}
```

#### Date Field
```typescript
{
  headerName: 'Launch Date',
  fieldName: 'launch_date',
  type: 'date',
  required: false,
  example: '2024-01-15',
  description: 'Product launch date (YYYY-MM-DD)'
}
```

#### Enum Field
```typescript
{
  headerName: 'Status',
  fieldName: 'status',
  type: 'enum',
  required: false,
  example: 'active',
  enumValues: ['active', 'inactive', 'archived'],
  description: 'Product status'
}
```

#### Custom Parser Field
```typescript
{
  headerName: 'Category',
  fieldName: 'category_id',
  type: 'text',
  required: true,
  example: 'Hair Care',
  parser: (value) => {
    // Custom logic to convert category name to ID
    const category = categories.find(c =>
      c.name.toLowerCase() === String(value).toLowerCase()
    )
    if (!category) throw new Error(`Category "${value}" not found`)
    return category.id
  },
  description: 'Must match existing category'
}
```

---

## 🎨 Column Width Customization

### Auto-Sizing (Default)

If you don't provide `columnWidths`, the system automatically calculates widths based on:
- Header name length
- Field type (descriptions get 40 chars, numbers get 15, dates get 20)
- Min width: 15 characters
- Max width: 50 characters

### Custom Widths

For precise control, provide an array of widths (in characters) matching your field count:

```typescript
const config: ImportExportConfig = {
  // ... other config
  fields: [
    { headerName: 'Product Name', ... },      // 25 chars wide
    { headerName: 'SKU', ... },              // 12 chars wide
    { headerName: 'Category', ... },         // 15 chars wide
    { headerName: 'Price', ... },            // 12 chars wide
    { headerName: 'Description', ... }       // 40 chars wide
  ],
  columnWidths: [25, 12, 15, 12, 40]
}
```

**Best Practices:**
- Product/Customer names: 20-30 chars
- SKU/Code fields: 12-15 chars
- Categories/Types: 15-20 chars
- Numbers (price, qty): 12-15 chars
- Descriptions: 35-45 chars
- Status/Boolean: 10-12 chars
- Dates: 18-20 chars

---

## 🔧 Advanced Features

### Reference Data

Include reference data (categories, branches, locations, etc.) in the template:

```typescript
const config: ImportExportConfig = {
  // ... other config
  referenceData: [
    {
      name: 'categories',
      displayName: 'Product Categories',
      items: categories.map(c => ({
        id: c.id,
        name: c.name,
        // Optional: additional fields
        code: c.code,
        active: c.is_active
      }))
    },
    {
      name: 'branches',
      displayName: 'Branch Locations',
      items: branches.map(b => ({
        id: b.id,
        name: b.name
      }))
    }
  ]
}
```

**Template Output:**
```
AVAILABLE PRODUCT CATEGORIES:
Hair Care
Skin Care
Nail Care

AVAILABLE BRANCH LOCATIONS:
Downtown Branch
Mall Branch
Airport Branch
```

### Custom Validation

Add business logic validation during import:

```typescript
const config: ImportExportConfig = {
  // ... other config
  validateRow: (data, rowIndex) => {
    // Price validation
    if (data.selling_price <= data.cost_price) {
      return 'Selling price must be greater than cost price'
    }

    // Stock validation
    if (data.stock_quantity < 0) {
      return 'Stock quantity cannot be negative'
    }

    // Cross-field validation
    if (data.is_featured && !data.image_url) {
      return 'Featured products must have an image'
    }

    return null // No errors
  }
}
```

### Custom Export Mapping

Transform data for export with custom logic:

```typescript
const config: ImportExportConfig<Product> = {
  // ... other config
  exportData: products,
  exportMapper: (product) => ({
    'Product Name': product.entity_name,
    'SKU': product.sku,
    'Category': product.category?.name || 'Uncategorized',
    'Price': `AED ${product.price.toFixed(2)}`,
    'Stock': `${product.stock_quantity} units`,
    'Status': product.is_active ? 'Active' : 'Inactive',
    'Last Updated': new Date(product.updated_at).toLocaleDateString()
  })
}
```

### Progress Tracking UI

Build a comprehensive progress indicator:

```typescript
{isImporting && importProgress && (
  <div className="space-y-2">
    {/* Progress bar */}
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-gold h-2 rounded-full transition-all"
        style={{ width: `${importProgress.percentage}%` }}
      />
    </div>

    {/* Progress text */}
    <p className="text-sm text-bronze">
      Importing: {importProgress.current} / {importProgress.total}
      ({importProgress.percentage}%)
    </p>

    {/* Current item */}
    {importProgress.currentItem && (
      <p className="text-xs text-champagne">
        Processing: {importProgress.currentItem}
      </p>
    )}
  </div>
)}
```

### Error Handling UI

Display comprehensive error results:

```typescript
{importResults && (
  <div className="space-y-4">
    {/* Summary */}
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-champagne/10 p-4 rounded-lg">
        <p className="text-2xl font-bold text-gold">{importResults.total}</p>
        <p className="text-sm text-bronze">Total Rows</p>
      </div>
      <div className="bg-green-500/10 p-4 rounded-lg">
        <p className="text-2xl font-bold text-green-400">{importResults.success}</p>
        <p className="text-sm text-bronze">Successful</p>
      </div>
      <div className="bg-rose/10 p-4 rounded-lg">
        <p className="text-2xl font-bold text-rose">{importResults.failed}</p>
        <p className="text-sm text-bronze">Failed</p>
      </div>
    </div>

    {/* Errors list */}
    {importResults.errors.length > 0 && (
      <div className="bg-rose/10 border border-rose/20 rounded-lg p-4">
        <h3 className="font-bold text-rose mb-2">Import Errors:</h3>
        <ul className="space-y-1 text-sm text-bronze">
          {importResults.errors.map((error, index) => (
            <li key={index} className="font-mono">{error}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}
```

---

## 💰 Multi-Currency Configuration

The HERA Import/Export system supports **multi-currency** for global deployments. Currency is sourced from your organization's settings and applied dynamically to all price fields.

### Using Dynamic Currency

```typescript
import { useSecuredSalonContext } from '../SecuredSalonProvider'

export default function ProductsPage() {
  // Get currency from organization context
  const { currency, organization } = useSecuredSalonContext()

  // Build configuration with dynamic currency
  const productConfig: ImportExportConfig<Product> = useMemo(() => ({
    entityName: 'Product',
    entityNamePlural: 'Products',

    // 💰 MULTI-CURRENCY: Organization-specific currency
    currency: currency || 'USD',        // Fallback to USD
    currencySymbol: currency || 'USD',  // Use same as code

    fields: [
      {
        headerName: `Cost Price (${currency || 'USD'})`,  // ✅ Dynamic header
        fieldName: 'cost_price',
        type: 'number',
        required: true,
        example: 75,
        description: `Product cost price in ${currency || 'USD'}`  // ✅ Dynamic description
      },
      {
        headerName: `Selling Price (${currency || 'USD'})`,  // ✅ Dynamic header
        fieldName: 'selling_price',
        type: 'number',
        required: true,
        example: 150,
        description: `Product selling price in ${currency || 'USD'}`  // ✅ Dynamic description
      }
    ],

    // ✅ Dynamic currency in export mapper
    exportMapper: (product) => ({
      'Product Name': product.name,
      [`Cost Price (${currency || 'USD'})`]: product.cost_price,  // ✅ Dynamic column name
      [`Selling Price (${currency || 'USD'})`]: product.selling_price
    })
  }), [currency, products])  // ✅ Include currency in dependencies

  return (
    <div>
      {/* Display prices with dynamic currency */}
      <h3>Average Price: {currency || 'USD'} {avgPrice.toFixed(2)}</h3>
    </div>
  )
}
```

### Supported Currency Codes

The system works with **any currency code** from your organization settings:

| Currency | Code | Symbol | Example |
|----------|------|--------|---------|
| US Dollar | `USD` | `$` | `$150.00` |
| Euro | `EUR` | `€` | `€150.00` |
| British Pound | `GBP` | `£` | `£150.00` |
| UAE Dirham | `AED` | `AED` | `AED 150.00` |
| Indian Rupee | `INR` | `₹` | `₹150.00` |
| Japanese Yen | `JPY` | `¥` | `¥150` |
| Canadian Dollar | `CAD` | `C$` | `C$150.00` |
| Australian Dollar | `AUD` | `A$` | `A$150.00` |
| Swiss Franc | `CHF` | `CHF` | `CHF 150.00` |

**Template Adaptation:**
- When a US organization downloads the template, headers show: `Cost Price (USD)`, `Selling Price (USD)`
- When a UAE organization downloads the template, headers show: `Cost Price (AED)`, `Selling Price (AED)`
- When a UK organization downloads the template, headers show: `Cost Price (GBP)`, `Selling Price (GBP)`

This ensures **international compliance** and eliminates confusion for multi-national deployments.

---

## 💡 Complete Example: Salon Products Import/Export

This is a real-world implementation from `/app/salon/products/page.tsx`:

```typescript
import { useHeraImportExport } from '@/components/shared/enterprise/HeraImportExport/useHeraImportExport'
import type { ImportExportConfig } from '@/components/shared/enterprise/HeraImportExport/types'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'

// Type definition
interface Product {
  id: string
  entity_name: string
  sku: string
  barcode?: string
  category_id?: string
  category?: { id: string; name: string }
  cost_price: number
  selling_price: number
  stock_quantity: number
  reorder_level: number
  supplier_name?: string
  brand?: string
  description?: string
  status: 'active' | 'inactive' | 'archived'
}

export default function ProductsPage() {
  const { organization } = useHERAAuth()
  const { products, categories, loading, createProduct, updateProduct } = useProducts()

  // Build import/export configuration
  const productImportExportConfig: ImportExportConfig<Product> = useMemo(() => ({
    entityName: 'Product',
    entityNamePlural: 'Products',
    filePrefix: 'HERA_Products',
    templateSheetName: 'Products Data',

    // 🎯 ENTERPRISE CUSTOMIZATION: Page-specific instructions
    customWarning: '⚠️ IMPORTANT: CREATE CATEGORIES FIRST',
    customInstructions: [
      'Category must match existing category names exactly (case-insensitive)',
      'Selling Price must be greater than Cost Price',
      'Stock quantities cannot be negative',
      'Status: Enter "active", "inactive", or "archived" (defaults to active)',
      'EAN13 Barcode must be 13 digits if provided'
    ],
    exampleNote: 'Professional salon product example',
    columnWidths: [25, 12, 15, 12, 12, 15, 15, 20, 18, 15, 12, 40, 10],

    // Field definitions
    fields: [
      {
        headerName: 'Product Name',
        fieldName: 'entity_name',
        type: 'text',
        required: true,
        example: "L'Oreal Professional Shampoo 500ml"
      },
      {
        headerName: 'SKU',
        fieldName: 'sku',
        type: 'text',
        required: true,
        example: 'LOR-SHP-500'
      },
      {
        headerName: 'Category',
        fieldName: 'category_id',
        type: 'text',
        required: true,
        example: 'Hair Care',
        parser: (value) => {
          const categoryName = String(value).trim()
          const category = categories.find(c =>
            c.name.toLowerCase() === categoryName.toLowerCase()
          )
          if (!category) {
            throw new Error(`Category "${categoryName}" not found. Please create it first.`)
          }
          return category.id
        }
      },
      {
        headerName: 'Cost Price',
        fieldName: 'cost_price',
        type: 'number',
        required: true,
        example: 75.00
      },
      {
        headerName: 'Selling Price',
        fieldName: 'selling_price',
        type: 'number',
        required: true,
        example: 150.00
      },
      {
        headerName: 'Stock Quantity',
        fieldName: 'stock_quantity',
        type: 'number',
        required: true,
        example: 50
      },
      {
        headerName: 'Reorder Level',
        fieldName: 'reorder_level',
        type: 'number',
        required: false,
        example: 10
      },
      {
        headerName: 'Supplier',
        fieldName: 'supplier_name',
        type: 'text',
        required: false,
        example: 'Beauty Supplies DMCC'
      },
      {
        headerName: 'Brand',
        fieldName: 'brand',
        type: 'text',
        required: false,
        example: "L'Oreal Professional"
      },
      {
        headerName: 'EAN13 Barcode',
        fieldName: 'barcode',
        type: 'text',
        required: false,
        example: '3474636391813',
        parser: (value) => {
          if (!value) return undefined
          const barcode = String(value).trim()
          if (barcode.length !== 13 || !/^\d+$/.test(barcode)) {
            throw new Error('Barcode must be exactly 13 digits')
          }
          return barcode
        }
      },
      {
        headerName: 'Status',
        fieldName: 'status',
        type: 'enum',
        required: false,
        example: 'active',
        enumValues: ['active', 'inactive', 'archived']
      },
      {
        headerName: 'Description',
        fieldName: 'description',
        type: 'text',
        required: false,
        example: 'Professional salon shampoo for color-treated hair. Sulfate-free formula with UV protection.'
      }
    ],

    // Reference data
    referenceData: [
      {
        name: 'categories',
        displayName: 'Product Categories',
        items: categories.map(c => ({ id: c.id, name: c.name }))
      }
    ],

    // Create function
    onCreate: async (data) => {
      await createProduct({
        ...data,
        organization_id: organization?.id,
        entity_type: 'product',
        smart_code: 'HERA.SALON.PRODUCT.ENTITY.INVENTORY.v1'
      })
    },

    // Custom validation
    validateRow: (data, rowIndex) => {
      if (data.selling_price <= data.cost_price) {
        return 'Selling price must be greater than cost price'
      }
      if (data.stock_quantity < 0) {
        return 'Stock quantity cannot be negative'
      }
      if (data.reorder_level && data.reorder_level < 0) {
        return 'Reorder level cannot be negative'
      }
      return null
    },

    // Export configuration
    exportData: products,
    exportMapper: (product) => ({
      'Product Name': product.entity_name,
      'SKU': product.sku,
      'Category': product.category?.name || '',
      'Cost Price': product.cost_price,
      'Selling Price': product.selling_price,
      'Stock Quantity': product.stock_quantity,
      'Reorder Level': product.reorder_level || '',
      'Supplier': product.supplier_name || '',
      'Brand': product.brand || '',
      'EAN13 Barcode': product.barcode || '',
      'Status': product.status,
      'Description': product.description || ''
    })
  }), [categories, products, organization, createProduct])

  // Initialize hook
  const {
    isImporting,
    isExporting,
    importProgress,
    importResults,
    downloadTemplate,
    importFile,
    exportData,
    resetImport
  } = useHeraImportExport(productImportExportConfig)

  // Handle template download
  const handleDownloadTemplate = async () => {
    try {
      const result = await downloadTemplate()
      toast.success(`Template downloaded: ${result.fileName}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to download template')
    }
  }

  // Handle file import
  const handleFileImport = async (file: File) => {
    try {
      resetImport()
      const result = await importFile(file)

      if (result.success > 0) {
        toast.success(`Imported ${result.success} products successfully`)
      }
      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} products`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Import failed')
    }
  }

  // Handle data export
  const handleExport = async () => {
    try {
      const result = await exportData()
      toast.success(`Exported ${products.length} products to ${result.fileName}`)
    } catch (error: any) {
      toast.error(error.message || 'Export failed')
    }
  }

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-gold text-black rounded-lg"
        >
          Download Template
        </button>

        <label className="px-4 py-2 bg-champagne/20 text-champagne rounded-lg cursor-pointer">
          Import Products
          <input
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileImport(file)
            }}
          />
        </label>

        <button
          onClick={handleExport}
          disabled={products.length === 0}
          className="px-4 py-2 bg-bronze text-black rounded-lg disabled:opacity-50"
        >
          Export Products
        </button>
      </div>

      {/* Import progress */}
      {isImporting && importProgress && (
        <div className="bg-charcoal rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-bronze">Importing products...</span>
            <span className="text-champagne">
              {importProgress.current} / {importProgress.total}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gold h-2 rounded-full transition-all duration-300"
              style={{ width: `${importProgress.percentage}%` }}
            />
          </div>
          {importProgress.currentItem && (
            <p className="text-xs text-bronze">Processing: {importProgress.currentItem}</p>
          )}
        </div>
      )}

      {/* Import results */}
      {importResults && (
        <div className="bg-charcoal rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-champagne/10 p-3 rounded-lg">
              <p className="text-2xl font-bold text-gold">{importResults.total}</p>
              <p className="text-xs text-bronze">Total</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-lg">
              <p className="text-2xl font-bold text-green-400">{importResults.success}</p>
              <p className="text-xs text-bronze">Success</p>
            </div>
            <div className="bg-rose/10 p-3 rounded-lg">
              <p className="text-2xl font-bold text-rose">{importResults.failed}</p>
              <p className="text-xs text-bronze">Failed</p>
            </div>
          </div>

          {importResults.errors.length > 0 && (
            <div className="bg-rose/10 border border-rose/20 rounded-lg p-3">
              <h4 className="font-bold text-rose mb-2 text-sm">Errors:</h4>
              <ul className="space-y-1 text-xs text-bronze max-h-40 overflow-y-auto">
                {importResults.errors.map((error, index) => (
                  <li key={index} className="font-mono">{error}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={resetImport}
            className="w-full px-4 py-2 bg-champagne/20 text-champagne rounded-lg text-sm"
          >
            Close
          </button>
        </div>
      )}

      {/* Product list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
```

---

## 🛡️ Best Practices

### 1. Use Dynamic Currency for International Deployments
Always source currency from your organization's settings for true multi-tenant support:

```typescript
const { currency } = useSecuredSalonContext()

const config = useMemo(() => ({
  currency: currency || 'USD',
  fields: [
    {
      headerName: `Price (${currency || 'USD'})`,  // ✅ Dynamic
      // NOT: headerName: 'Price (USD)',           // ❌ Hardcoded
    }
  ]
}), [currency])  // ✅ Include in dependencies
```

### 2. Always Provide Reference Data
If your entities reference other entities (categories, branches, etc.), include them in `referenceData` so users can see available options.

### 3. Use Custom Parsers for Entity References
When a field references another entity, use a custom parser to convert names to IDs:

```typescript
{
  headerName: 'Category',
  fieldName: 'category_id',
  parser: (value) => {
    const category = categories.find(c =>
      c.name.toLowerCase() === String(value).toLowerCase()
    )
    if (!category) throw new Error(`Category "${value}" not found`)
    return category.id
  }
}
```

### 4. Add Business Validation
Use `validateRow` for business logic that spans multiple fields:

```typescript
validateRow: (data, rowIndex) => {
  if (data.selling_price <= data.cost_price) {
    return 'Selling price must be greater than cost price'
  }
  return null
}
```

### 5. Provide Realistic Examples
Use real-world examples in your field configurations:

```typescript
example: "L'Oreal Professional Shampoo 500ml"  // ✅ Realistic
example: "Product Name"                        // ❌ Generic
```

### 6. Customize Column Widths
Provide column widths for better readability, especially for long text fields:

```typescript
columnWidths: [25, 12, 15, 12, 40]  // Name, SKU, Category, Price, Description
```

### 7. Add Page-Specific Instructions
Use `customInstructions` to provide context-specific guidance:

```typescript
customInstructions: [
  'Category must match existing category names exactly',
  'Selling Price must be greater than Cost Price',
  'Stock quantities cannot be negative'
]
```

### 8. Handle Errors Gracefully
Always wrap import/export operations in try-catch blocks and show user-friendly messages:

```typescript
try {
  await importFile(file)
  toast.success('Import successful')
} catch (error: any) {
  toast.error(error.message || 'Import failed')
}
```

### 9. Reset State Between Operations
Call `resetImport()` before starting a new import to clear previous results.

### 10. Validate File Structure Early
The hook automatically validates that:
- File is not empty
- Required headers are present
- Data rows exist

### 11. Use useMemo for Configuration
Wrap configuration in `useMemo` to prevent unnecessary recalculations, especially when using dynamic currency:

```typescript
const config = useMemo(() => ({
  currency: currency || 'USD',  // ✅ Dynamic currency
  fields: [/* ... */]
}), [currency, products, categories])  // ✅ Include all dependencies
```

---

## 🐛 Troubleshooting

### Issue: "Field not found in file"
**Cause:** Header name in Excel doesn't match `headerName` in configuration
**Solution:** Ensure exact match (case-insensitive comparison is automatic)

### Issue: "Category not found" errors
**Cause:** Reference data wasn't created before import
**Solution:**
1. Add prominent warning in `customWarning`
2. Include reference data in template via `referenceData`
3. Users must create reference data BEFORE importing

### Issue: Import succeeds but data looks wrong
**Cause:** Parser function returning incorrect values
**Solution:** Add console.log in parser to debug transformations

### Issue: Column widths don't match expectations
**Cause:** `columnWidths` array length doesn't match `fields` array length
**Solution:** Ensure `columnWidths.length === fields.length`

### Issue: Template download works but import fails
**Cause:** Custom validation in `validateRow` is too strict
**Solution:** Test validation logic separately, ensure example data passes validation

### Issue: "Cannot read property 'map' of undefined"
**Cause:** Reference data array is undefined
**Solution:** Ensure reference data is loaded before calling `downloadTemplate`

---

## 📚 Related Documentation

- **HERA Sacred Six Schema**: `/docs/schema/hera-sacred-six-schema.yaml`
- **Universal API V2**: `/docs/dna/UNIVERSAL-API-V2-RPC-PATTERNS.md`
- **Smart Code Guide**: `/docs/playbooks/_shared/SMART_CODE_GUIDE.md`
- **HERA Authorization**: `/docs/HERA-AUTHORIZATION-ARCHITECTURE.md`

---

## 🎯 Summary

The HERA Enterprise Import/Export System provides:

✅ **Universal Configuration** - One hook works for all entity types
✅ **Enterprise Templates** - Professional Excel templates with instructions
✅ **Multi-Currency Support** - Dynamic currency from organization settings
✅ **Custom Validation** - Business logic validation per entity
✅ **Reference Data** - Include lookup data in templates
✅ **Progress Tracking** - Real-time import progress
✅ **Error Handling** - Row-level error reporting
✅ **Customization** - Page-specific instructions and formatting
✅ **Export Support** - Custom mapping for data export
✅ **International Ready** - Supports any currency for global deployments

**Start using it today by following the Quick Start guide above!**
