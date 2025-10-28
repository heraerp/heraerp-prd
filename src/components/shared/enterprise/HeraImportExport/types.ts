/**
 * HERA Enterprise Import/Export Types
 * Smart Code: HERA.ENTERPRISE.IMPORT_EXPORT.TYPES.V1
 *
 * Reusable type definitions for import/export functionality across all HERA apps
 */

export interface ImportField {
  /** Display name in template header */
  headerName: string
  /** Internal field name for mapping */
  fieldName: string
  /** Field type for validation and parsing */
  type: 'text' | 'number' | 'boolean' | 'date' | 'enum'
  /** Is this field required? */
  required?: boolean
  /** Example value for template */
  example?: any
  /** Enum values if type is 'enum' */
  enumValues?: string[]
  /** Custom parser function */
  parser?: (value: any) => any
  /** Description for instructions sheet */
  description?: string
}

export interface ImportExportConfig<T = any> {
  /** Entity type name (e.g., 'Service', 'Product', 'Customer') */
  entityName: string
  /** Plural form (e.g., 'Services', 'Products', 'Customers') */
  entityNamePlural: string
  /** Fields configuration */
  fields: ImportField[]
  /** Available reference data (categories, branches, etc.) */
  referenceData?: {
    name: string
    displayName: string
    items: Array<{ id: string; name: string; [key: string]: any }>
  }[]
  /** Create function for import */
  onCreate: (data: Partial<T>) => Promise<void>
  /** Update function (optional, for import with updates) */
  onUpdate?: (id: string, data: Partial<T>) => Promise<void>
  /** Data for export */
  exportData?: T[]
  /** Custom row mapper for export */
  exportMapper?: (item: T) => Record<string, any>
  /** Custom validation function */
  validateRow?: (data: any, rowIndex: number) => string | null
  /** File name prefix for downloads */
  filePrefix?: string
  /** Template sheet name */
  templateSheetName?: string

  // 🎯 ENTERPRISE CUSTOMIZATION: Page-specific template instructions
  /** Custom warning message (default: "CREATE REFERENCE DATA FIRST") */
  customWarning?: string
  /** Additional page-specific instructions (added after generic instructions) */
  customInstructions?: string[]
  /** Note for example row (default: "for reference only") */
  exampleNote?: string
  /** Custom column widths for better readability (array of widths in characters) */
  columnWidths?: number[]

  // 💰 MULTI-CURRENCY SUPPORT: Organization-specific currency
  /** Currency code for price fields (e.g., 'USD', 'EUR', 'AED', 'GBP') */
  currency?: string
  /** Currency symbol for display (e.g., '$', '€', 'AED', '£') - defaults to currency code if not provided */
  currencySymbol?: string
}

export interface ImportResult {
  total: number
  success: number
  failed: number
  errors: string[]
}

export interface ImportProgress {
  current: number
  total: number
  percentage: number
  currentItem?: string
}
