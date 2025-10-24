# HERA Enterprise Import/Export System

**Smart Code:** `HERA.ENTERPRISE.IMPORT_EXPORT.V1`

## Overview

Enterprise-grade import/export functionality that can be reused across all HERA applications. Provides Excel/CSV import with validation, progress tracking, error handling, and professional export with formatting.

## Features

✅ **Universal Configuration** - Works with any entity type (Products, Services, Customers, etc.)
✅ **Field Validation** - Type checking, required fields, enum validation
✅ **Reference Data** - Auto-validates relationships (categories, branches, etc.)
✅ **Progress Tracking** - Real-time import progress with current item display
✅ **Error Handling** - Detailed error messages with row numbers
✅ **Template Generation** - Auto-generates Excel templates with instructions
✅ **Batch Operations** - Efficiently processes large datasets
✅ **Custom Parsers** - Support for complex field transformations
✅ **Export Formatting** - Professional Excel exports with column widths

## Quick Start

### 1. Import the Hook and Components

```typescript
import {
  useHeraImportExport,
  HeraImportModal,
  ImportExportConfig
} from '@/components/shared/enterprise/HeraImportExport'
```

### 2. Configure Your Entity

```typescript
const importExportConfig: ImportExportConfig<Service> = {
  entityName: 'Service',
  entityNamePlural: 'Services',
  filePrefix: 'HERA_Services',
  templateSheetName: 'Services Data',

  // Define fields
  fields: [
    {
      headerName: 'Service Name',
      fieldName: 'name',
      type: 'text',
      required: true,
      example: 'Haircut & Style',
      description: 'Name of the service'
    },
    {
      headerName: 'Price (AED)',
      fieldName: 'price_market',
      type: 'number',
      required: true,
      example: 150,
      description: 'Service price in AED'
    },
    {
      headerName: 'Duration (minutes)',
      fieldName: 'duration_min',
      type: 'number',
      required: true,
      example: 60,
      description: 'Service duration in minutes'
    },
    {
      headerName: 'Category',
      fieldName: 'category_id',
      type: 'text',
      required: false,
      example: 'Hair Services',
      description: 'Service category (must match existing category name)',
      parser: (value) => {
        // Custom parser to convert category name to ID
        const category = categories.find(
          c => c.entity_name.toLowerCase() === String(value).toLowerCase()
        )
        return category?.id
      }
    },
    {
      headerName: 'Status',
      fieldName: 'status',
      type: 'enum',
      required: false,
      example: 'active',
      enumValues: ['active', 'archived'],
      description: 'Service status'
    }
  ],

  // Reference data for validation
  referenceData: [
    {
      name: 'categories',
      displayName: 'Available Categories',
      items: serviceCategories.map(c => ({ id: c.id, name: c.entity_name }))
    },
    {
      name: 'branches',
      displayName: 'Available Branches',
      items: availableBranches.map(b => ({ id: b.id, name: b.name }))
    }
  ],

  // Create function for import
  onCreate: async (data) => {
    await createService(data)
  },

  // Export data
  exportData: services,

  // Custom export mapper (optional)
  exportMapper: (service) => ({
    'Service Name': service.entity_name,
    'Code': service.entity_code || '',
    'Category': service.category || '',
    'Price (AED)': service.price_market || 0,
    'Duration (minutes)': service.duration_min || 0,
    'Status': service.status || 'active',
    'Created': new Date(service.created_at).toLocaleDateString()
  }),

  // Custom validation (optional)
  validateRow: (data, rowIndex) => {
    // Example: Ensure price is positive
    if (data.price_market && data.price_market < 0) {
      return 'Price must be positive'
    }
    return null
  }
}
```

### 3. Use the Hook

```typescript
function MyPage() {
  const [importModalOpen, setImportModalOpen] = useState(false)

  const {
    isImporting,
    isExporting,
    importProgress,
    importResults,
    downloadTemplate,
    importFile,
    exportData,
    resetImport
  } = useHeraImportExport(importExportConfig)

  const handleDownloadTemplate = async () => {
    try {
      const { fileName } = await downloadTemplate()
      showSuccess('Template downloaded', fileName)
    } catch (error: any) {
      showError('Failed to download template', error.message)
    }
  }

  const handleImport = async (file: File) => {
    try {
      const results = await importFile(file)

      if (results.success > 0 && results.failed === 0) {
        showSuccess('Import completed', `${results.success} services imported`)
      } else if (results.success > 0) {
        showWarning('Partial import', `${results.success} succeeded, ${results.failed} failed`)
      } else {
        showError('Import failed', 'No services were imported')
      }
    } catch (error: any) {
      showError('Import failed', error.message)
    }
  }

  const handleExport = async () => {
    try {
      const { fileName } = await exportData()
      showSuccess('Export completed', `Data exported to ${fileName}`)
    } catch (error: any) {
      showError('Export failed', error.message)
    }
  }

  return (
    <>
      {/* Action Buttons */}
      <button onClick={handleDownloadTemplate}>Download Template</button>
      <button onClick={() => setImportModalOpen(true)}>Import</button>
      <button onClick={handleExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {/* Import Modal */}
      <HeraImportModal
        open={importModalOpen}
        onClose={() => {
          setImportModalOpen(false)
          resetImport()
        }}
        entityName={importExportConfig.entityName}
        entityNamePlural={importExportConfig.entityNamePlural}
        isImporting={isImporting}
        importProgress={importProgress}
        importResults={importResults}
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImport}
      />
    </>
  )
}
```

## Advanced Features

### Custom Field Parsers

Handle complex field transformations:

```typescript
{
  headerName: 'Branches',
  fieldName: 'branch_ids',
  type: 'text',
  example: 'Main Branch; Downtown',
  parser: (value) => {
    // Parse semicolon-separated branch names to IDs
    const branchNames = String(value).split(';').map(b => b.trim())
    return branchNames
      .map(name =>
        branches.find(b => b.name.toLowerCase() === name.toLowerCase())?.id
      )
      .filter(Boolean)
  }
}
```

### Multi-Select Relationships

```typescript
{
  headerName: 'Required Products',
  fieldName: 'required_product_ids',
  type: 'text',
  example: 'Shampoo; Conditioner',
  parser: (value) => {
    const productNames = String(value).split(';').map(p => p.trim())
    return productNames
      .map(name => products.find(p => p.name.toLowerCase() === name.toLowerCase())?.id)
      .filter(Boolean)
  }
}
```

### Custom Row Validation

```typescript
validateRow: (data, rowIndex) => {
  // Business logic validation
  if (data.duration_min > 480) {
    return 'Duration cannot exceed 8 hours (480 minutes)'
  }

  if (data.price_market && data.commission_rate) {
    const commission = data.price_market * data.commission_rate
    if (commission > data.price_market) {
      return 'Commission rate cannot exceed 100%'
    }
  }

  return null // No errors
}
```

## Usage Examples

### Services Page

See `/src/app/salon/services/page.tsx` for complete implementation with:
- Category and branch relationship handling
- Multi-branch assignment
- Status enum validation
- Custom export formatting

### Products Page

```typescript
const productConfig: ImportExportConfig<Product> = {
  entityName: 'Product',
  entityNamePlural: 'Products',
  fields: [
    { headerName: 'Product Name', fieldName: 'name', type: 'text', required: true },
    { headerName: 'SKU', fieldName: 'sku', type: 'text', required: false },
    { headerName: 'Cost Price', fieldName: 'cost_price', type: 'number', required: true },
    { headerName: 'Selling Price', fieldName: 'selling_price', type: 'number', required: true },
    { headerName: 'Stock Level', fieldName: 'stock_level', type: 'number', required: true },
    { headerName: 'Reorder Level', fieldName: 'reorder_level', type: 'number', required: false }
  ],
  onCreate: createProduct,
  exportData: products
}
```

### Customers Page

```typescript
const customerConfig: ImportExportConfig<Customer> = {
  entityName: 'Customer',
  entityNamePlural: 'Customers',
  fields: [
    { headerName: 'Full Name', fieldName: 'full_name', type: 'text', required: true },
    { headerName: 'Email', fieldName: 'email', type: 'text', required: true },
    { headerName: 'Phone', fieldName: 'phone', type: 'text', required: true },
    { headerName: 'Birthday', fieldName: 'birthday', type: 'date', required: false },
    { headerName: 'VIP', fieldName: 'is_vip', type: 'boolean', required: false }
  ],
  onCreate: createCustomer,
  exportData: customers,
  validateRow: (data) => {
    // Validate email format
    if (data.email && !data.email.includes('@')) {
      return 'Invalid email format'
    }
    return null
  }
}
```

## Performance Considerations

- **Batch Size**: System processes rows individually but efficiently (typically 100-500 rows/second)
- **Memory**: Excel files up to 10,000 rows are handled efficiently in browser
- **Progress Updates**: Real-time progress prevents UI blocking
- **Error Handling**: Continues processing even if some rows fail

## Best Practices

1. **Always provide examples** in field configuration for template clarity
2. **Use custom parsers** for complex field transformations
3. **Validate reference data** before import to provide clear error messages
4. **Test templates** with sample data before distributing to users
5. **Monitor error patterns** to improve template instructions

## Troubleshooting

### Import fails with "Field not found"
- Check that field headerName matches exactly (case-insensitive)
- Ensure required fields are present in the template

### Reference data not matching
- Verify reference data is loaded before opening import modal
- Check parser functions handle case-insensitively
- Use trim() to handle extra whitespace

### Large files timeout
- Consider splitting into smaller batches (< 5000 rows per file)
- Optimize onCreate function performance
- Use batch RPC operations if available

## Migration from Legacy Code

Replace manual XLSX handling with the enterprise system:

**Before:**
```typescript
// 200+ lines of manual Excel parsing, validation, error handling
const handleImport = async (file: File) => {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(...)
  // ... complex parsing logic
  // ... manual validation
  // ... error handling
}
```

**After:**
```typescript
// 50 lines of declarative configuration
const config: ImportExportConfig = { /* ... */ }
const { importFile } = useHeraImportExport(config)
```

## API Reference

See type definitions in `/src/components/shared/enterprise/HeraImportExport/types.ts`

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** 2025-01-24
