# Import/Export Quick Start - Copy & Paste Template

## 1. Import Dependencies

```typescript
import { useState, useCallback } from 'react'
import { Upload, Download } from 'lucide-react'
import {
  useHeraImportExport,
  HeraImportModal,
  ImportExportConfig
} from '@/components/shared/enterprise/HeraImportExport'
```

## 2. Add State Variables

```typescript
const [importModalOpen, setImportModalOpen] = useState(false)
```

## 3. Configure Your Entity

```typescript
// Replace YourEntity with your actual type (Service, Product, Customer, etc.)
const importExportConfig: ImportExportConfig<YourEntity> = {
  entityName: 'YourEntity',              // Singular
  entityNamePlural: 'YourEntities',      // Plural
  filePrefix: 'HERA_YourEntities',       // For downloaded files

  // Define your fields
  fields: [
    {
      headerName: 'Field Name',           // Excel column header
      fieldName: 'field_name',            // Property in your entity
      type: 'text',                       // text | number | boolean | date | enum
      required: true,                     // Is this field required?
      example: 'Example Value',           // Shows in template
      description: 'Field description'    // Shows in instructions
    },
    // Add more fields...
  ],

  // Optional: Reference data for validation
  referenceData: [
    {
      name: 'categories',
      displayName: 'Available Categories',
      items: categories.map(c => ({ id: c.id, name: c.name }))
    }
  ],

  // Create function
  onCreate: async (data) => {
    await createYourEntity(data)
  },

  // Export data
  exportData: yourEntities,

  // Optional: Custom export mapper
  exportMapper: (item) => ({
    'Column 1': item.field1,
    'Column 2': item.field2
  })
}
```

## 4. Use the Hook

```typescript
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
```

## 5. Add Action Handlers

```typescript
const handleDownloadTemplate = useCallback(async () => {
  try {
    const { fileName } = await downloadTemplate()
    showSuccess('Template downloaded', fileName)
  } catch (error: any) {
    showError('Failed to download template', error.message)
  }
}, [downloadTemplate, showSuccess, showError])

const handleImport = useCallback(async (file: File) => {
  try {
    const results = await importFile(file)

    if (results.success > 0 && results.failed === 0) {
      showSuccess('Import successful', `Imported ${results.success} items`)
    } else if (results.success > 0) {
      showSuccess('Partial import', `${results.success} succeeded, ${results.failed} failed`)
    } else {
      showError('Import failed', 'No items were imported')
    }
  } catch (error: any) {
    showError('Import failed', error.message)
  }
}, [importFile, showSuccess, showError])

const handleExport = useCallback(async () => {
  if (!yourEntities || yourEntities.length === 0) {
    showError('No data', 'Nothing to export')
    return
  }

  try {
    const { fileName } = await exportData()
    showSuccess('Export successful', `Exported to ${fileName}`)
  } catch (error: any) {
    showError('Export failed', error.message)
  }
}, [exportData, yourEntities, showSuccess, showError])
```

## 6. Add UI Buttons

```typescript
{/* Import Button */}
<button
  onClick={() => setImportModalOpen(true)}
  className="flex items-center gap-2 px-4 py-2 rounded-lg"
>
  <Upload className="w-4 h-4" />
  Import
</button>

{/* Export Button */}
<button
  onClick={handleExport}
  disabled={isExporting}
  className="flex items-center gap-2 px-4 py-2 rounded-lg"
>
  <Download className="w-4 h-4" />
  {isExporting ? 'Exporting...' : 'Export'}
</button>
```

## 7. Add Import Modal

```typescript
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
```

## Field Type Examples

### Text Field
```typescript
{
  headerName: 'Name',
  fieldName: 'name',
  type: 'text',
  required: true,
  example: 'John Doe'
}
```

### Number Field
```typescript
{
  headerName: 'Price',
  fieldName: 'price',
  type: 'number',
  required: true,
  example: 99.99
}
```

### Boolean Field
```typescript
{
  headerName: 'Active',
  fieldName: 'is_active',
  type: 'boolean',
  required: false,
  example: 'Yes'  // User enters "Yes/No" or "True/False"
}
```

### Enum Field
```typescript
{
  headerName: 'Status',
  fieldName: 'status',
  type: 'enum',
  required: false,
  example: 'active',
  enumValues: ['active', 'pending', 'archived']
}
```

### Custom Parser (ID Lookup)
```typescript
{
  headerName: 'Category',
  fieldName: 'category_id',
  type: 'text',
  example: 'Hair Services',
  parser: (value) => {
    const category = categories.find(
      c => c.name.toLowerCase() === String(value).toLowerCase()
    )
    return category?.id
  }
}
```

### Multi-Select (Semicolon Separated)
```typescript
{
  headerName: 'Branches',
  fieldName: 'branch_ids',
  type: 'text',
  example: 'Main Branch; Downtown; Mall',
  parser: (value) => {
    return String(value)
      .split(';')
      .map(name => {
        const branch = branches.find(
          b => b.name.toLowerCase() === name.trim().toLowerCase()
        )
        return branch?.id
      })
      .filter(Boolean)
  }
}
```

## Custom Validation Example

```typescript
validateRow: (data, rowIndex) => {
  // Validate email format
  if (data.email && !data.email.includes('@')) {
    return 'Invalid email format'
  }

  // Validate price range
  if (data.price && (data.price < 0 || data.price > 10000)) {
    return 'Price must be between 0 and 10000'
  }

  // Validate date
  if (data.date && new Date(data.date) < new Date()) {
    return 'Date cannot be in the past'
  }

  return null // No errors
}
```

## That's It! 🎉

Copy this template, replace the placeholders with your entity details, and you have a fully functional import/export system!

---

**Need more help?** Check `/docs/enterprise/HERA-IMPORT-EXPORT-SYSTEM.md` for complete documentation.
