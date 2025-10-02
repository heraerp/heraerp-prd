/**
 * HERA Universal Entity Presets with UI Metadata
 *
 * Centralized configuration for all entity types.
 * Each preset defines:
 * - Dynamic fields (stored in core_dynamic_data)
 * - Relationships (stored in core_relationships)
 * - Smart codes for HERA DNA integration
 * - UI metadata for forms and display
 */

import type { DynamicFieldDef, RelationshipDef } from '@/hooks/useUniversalEntity'

// Extended types for UI metadata
export interface UIFieldMetadata {
  label: string
  placeholder?: string
  helpText?: string
  group?: string
  order?: number
  visible?: boolean | ((userRole: string) => boolean)
  readonly?: boolean | ((userRole: string) => boolean)
  validation?: {
    required?: boolean
    min?: number
    max?: number
    pattern?: string
    custom?: (value: any) => string | null
  }
  displayOptions?: {
    prefix?: string
    suffix?: string
    format?: 'currency' | 'percentage' | 'decimal'
    step?: number
  }
}

export interface UIRelationshipMetadata {
  label: string
  description?: string
  entityType: string
  displayField?: string
  searchFields?: string[]
  visible?: boolean | ((userRole: string) => boolean)
  multiple?: boolean
}

export interface EnhancedDynamicFieldDef extends DynamicFieldDef {
  ui: UIFieldMetadata
}

export interface EnhancedRelationshipDef extends RelationshipDef {
  ui: UIRelationshipMetadata
}

export interface EntityPresetWithUI {
  entity_type: string
  dynamicFields: EnhancedDynamicFieldDef[]
  relationships: EnhancedRelationshipDef[]
  ui: {
    displayName: string
    pluralName: string
    icon?: string
    description?: string
    defaultSort?: string
    searchFields?: string[]
    listFields?: string[]
    formGroups?: {
      name: string
      title: string
      description?: string
      fields: string[]
      order?: number
    }[]
  }
}

// Product configuration with UI metadata
export const PRODUCT_PRESET: EntityPresetWithUI = {
  entity_type: 'PRODUCT',
  dynamicFields: [
    {
      name: 'price_market',
      type: 'number' as const,
      smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1',
      required: true,
      ui: {
        label: 'Market Price',
        placeholder: 'Enter selling price',
        helpText: 'The price customers pay for this product',
        group: 'pricing',
        order: 1,
        validation: {
          required: true,
          min: 0
        },
        displayOptions: {
          format: 'currency',
          prefix: '$'
        }
      }
    },
    {
      name: 'price_cost',
      type: 'number' as const,
      smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.COST.v1',
      required: true,
      ui: {
        label: 'Cost Price',
        placeholder: 'Enter cost price',
        helpText: 'What you pay to acquire this product',
        group: 'pricing',
        order: 2,
        visible: role => ['owner', 'admin', 'manager'].includes(role),
        validation: {
          required: true,
          min: 0
        },
        displayOptions: {
          format: 'currency',
          prefix: '$'
        }
      }
    },
    {
      name: 'sku',
      type: 'text' as const,
      smart_code: 'HERA.SALON.PRODUCT.DYN.SKU.v1',
      ui: {
        label: 'SKU',
        placeholder: 'Enter product SKU',
        helpText: 'Stock Keeping Unit - unique identifier',
        group: 'details',
        order: 1
      }
    },
    {
      name: 'stock_quantity',
      type: 'number' as const,
      smart_code: 'HERA.SALON.PRODUCT.DYN.STOCK.QTY.v1',
      defaultValue: 0,
      ui: {
        label: 'Stock Quantity',
        placeholder: 'Current stock level',
        helpText: 'Number of units currently in stock',
        group: 'inventory',
        order: 1,
        validation: {
          min: 0
        }
      }
    },
    {
      name: 'reorder_level',
      type: 'number' as const,
      smart_code: 'HERA.SALON.PRODUCT.DYN.REORDER.LEVEL.v1',
      defaultValue: 10,
      ui: {
        label: 'Reorder Level',
        placeholder: 'Minimum stock level',
        helpText: 'Reorder when stock falls below this level',
        group: 'inventory',
        order: 2,
        validation: {
          min: 0
        }
      }
    },
    {
      name: 'size',
      type: 'text' as const,
      smart_code: 'HERA.SALON.PRODUCT.DYN.SIZE.v1',
      ui: {
        label: 'Size',
        placeholder: 'e.g., 250ml, Large, XL',
        helpText: 'Product size or variant',
        group: 'details',
        order: 2
      }
    },
    {
      name: 'barcode',
      type: 'text' as const,
      smart_code: 'HERA.SALON.PRODUCT.DYN.BARCODE.v1',
      ui: {
        label: 'Barcode',
        placeholder: 'Scan or enter barcode',
        helpText: 'Product barcode for scanning',
        group: 'details',
        order: 3
      }
    }
  ],
  relationships: [
    {
      type: 'HAS_CATEGORY',
      smart_code: 'HERA.SALON.PRODUCT.REL.HAS_CATEGORY.v1',
      cardinality: 'one' as const,
      ui: {
        label: 'Category',
        description: 'Product category for organization',
        entityType: 'CATEGORY',
        displayField: 'entity_name',
        searchFields: ['entity_name']
      }
    },
    {
      type: 'HAS_BRAND',
      smart_code: 'HERA.SALON.PRODUCT.REL.HAS_BRAND.v1',
      cardinality: 'one' as const,
      ui: {
        label: 'Brand',
        description: 'Product brand or manufacturer',
        entityType: 'BRAND',
        displayField: 'entity_name',
        searchFields: ['entity_name']
      }
    },
    {
      type: 'SUPPLIED_BY',
      smart_code: 'HERA.SALON.PRODUCT.REL.SUPPLIED_BY.v1',
      cardinality: 'many' as const,
      ui: {
        label: 'Suppliers',
        description: 'Vendors that supply this product',
        entityType: 'VENDOR',
        displayField: 'entity_name',
        searchFields: ['entity_name'],
        multiple: true
      }
    }
  ],
  ui: {
    displayName: 'Product',
    pluralName: 'Products',
    icon: 'Package',
    description: 'Manage salon products and inventory',
    defaultSort: 'entity_name',
    searchFields: ['entity_name', 'sku', 'barcode'],
    listFields: ['entity_name', 'sku', 'price_market', 'stock_quantity'],
    formGroups: [
      {
        name: 'basic',
        title: 'Basic Information',
        description: 'Essential product details',
        fields: ['entity_name'],
        order: 1
      },
      {
        name: 'details',
        title: 'Product Details',
        description: 'Additional product specifications',
        fields: ['sku', 'size', 'barcode'],
        order: 2
      },
      {
        name: 'pricing',
        title: 'Pricing Information',
        description: 'Cost and selling prices',
        fields: ['price_market', 'price_cost'],
        order: 3
      },
      {
        name: 'inventory',
        title: 'Inventory Management',
        description: 'Stock levels and reorder points',
        fields: ['stock_quantity', 'reorder_level'],
        order: 4
      }
    ]
  }
}

// Service configuration with UI metadata
export const SERVICE_PRESET: EntityPresetWithUI = {
  entity_type: 'SERVICE',
  dynamicFields: [
    {
      name: 'price_market',
      type: 'number' as const,
      smart_code: 'HERA.SALON.SERVICE.DYN.PRICE.MARKET.v1',
      required: true,
      ui: {
        label: 'Service Price',
        placeholder: 'Enter service price',
        helpText: 'The price charged for this service',
        group: 'pricing',
        order: 1,
        validation: {
          required: true,
          min: 0
        },
        displayOptions: {
          format: 'currency',
          prefix: '$'
        }
      }
    },
    {
      name: 'duration_min',
      type: 'number' as const,
      smart_code: 'HERA.SALON.SERVICE.DYN.DURATION.MIN.v1',
      required: true,
      ui: {
        label: 'Duration (minutes)',
        placeholder: 'Service duration in minutes',
        helpText: 'How long this service typically takes',
        group: 'details',
        order: 1,
        validation: {
          required: true,
          min: 1,
          max: 480
        },
        displayOptions: {
          suffix: ' min'
        }
      }
    },
    {
      name: 'commission_rate',
      type: 'number' as const,
      smart_code: 'HERA.SALON.SERVICE.DYN.COMMISSION.v1',
      defaultValue: 0.5,
      ui: {
        label: 'Commission Rate',
        placeholder: 'Staff commission rate',
        helpText: 'Percentage of service price paid as commission',
        group: 'pricing',
        order: 2,
        visible: role => ['owner', 'admin', 'manager'].includes(role),
        validation: {
          min: 0,
          max: 1
        },
        displayOptions: {
          format: 'percentage'
        }
      }
    },
    {
      name: 'description',
      type: 'text' as const,
      smart_code: 'HERA.SALON.SERVICE.DYN.DESCRIPTION.v1',
      ui: {
        label: 'Description',
        placeholder: 'Describe the service',
        helpText: 'Detailed description of what this service includes',
        group: 'details',
        order: 2
      }
    },
    {
      name: 'active',
      type: 'boolean' as const,
      smart_code: 'HERA.SALON.SERVICE.DYN.ACTIVE.v1',
      defaultValue: true,
      ui: {
        label: 'Active',
        helpText: 'Whether this service is currently offered',
        group: 'settings',
        order: 1
      }
    }
  ],
  relationships: [
    {
      type: 'HAS_CATEGORY',
      smart_code: 'HERA.SALON.SERVICE.REL.HAS_CATEGORY.v1',
      cardinality: 'one' as const,
      ui: {
        label: 'Service Category',
        description: 'Category for organizing services',
        entityType: 'CATEGORY',
        displayField: 'entity_name',
        searchFields: ['entity_name']
      }
    },
    {
      type: 'PERFORMED_BY_ROLE',
      smart_code: 'HERA.SALON.SERVICE.REL.PERFORMED_BY_ROLE.v1',
      cardinality: 'many' as const,
      ui: {
        label: 'Staff Roles',
        description: 'Which staff roles can perform this service',
        entityType: 'ROLE',
        displayField: 'entity_name',
        searchFields: ['entity_name'],
        multiple: true
      }
    },
    {
      type: 'REQUIRES_PRODUCT',
      smart_code: 'HERA.SALON.SERVICE.REL.REQUIRES_PRODUCT.v1',
      cardinality: 'many' as const,
      ui: {
        label: 'Required Products',
        description: 'Products used during this service',
        entityType: 'PRODUCT',
        displayField: 'entity_name',
        searchFields: ['entity_name', 'sku'],
        multiple: true
      }
    }
  ],
  ui: {
    displayName: 'Service',
    pluralName: 'Services',
    icon: 'Scissors',
    description: 'Manage salon services and treatments',
    defaultSort: 'entity_name',
    searchFields: ['entity_name', 'description'],
    listFields: ['entity_name', 'duration_min', 'price_market', 'active'],
    formGroups: [
      {
        name: 'basic',
        title: 'Basic Information',
        description: 'Essential service details',
        fields: ['entity_name'],
        order: 1
      },
      {
        name: 'details',
        title: 'Service Details',
        description: 'Duration and description',
        fields: ['duration_min', 'description'],
        order: 2
      },
      {
        name: 'pricing',
        title: 'Pricing & Commission',
        description: 'Service pricing and staff commission',
        fields: ['price_market', 'commission_rate'],
        order: 3
      },
      {
        name: 'settings',
        title: 'Settings',
        description: 'Service availability and status',
        fields: ['active'],
        order: 4
      }
    ]
  }
}

// Customer configuration with UI metadata
export const CUSTOMER_PRESET: EntityPresetWithUI = {
  entity_type: 'CUSTOMER',
  dynamicFields: [
    {
      name: 'phone',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.PHONE.v1',
      required: true,
      ui: {
        label: 'Phone Number',
        placeholder: 'Enter phone number',
        helpText: 'Primary contact number',
        group: 'contact',
        order: 1,
        validation: {
          required: true,
          pattern: '^[+]?[1-9][0-9]{7,14}$'
        }
      }
    },
    {
      name: 'email',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.EMAIL.v1',
      ui: {
        label: 'Email Address',
        placeholder: 'Enter email address',
        helpText: 'Email for communications and receipts',
        group: 'contact',
        order: 2,
        validation: {
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
        }
      }
    },
    {
      name: 'vip',
      type: 'boolean' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.VIP.v1',
      defaultValue: false,
      ui: {
        label: 'VIP Customer',
        helpText: 'Mark as VIP for special treatment',
        group: 'preferences',
        order: 1
      }
    },
    {
      name: 'notes',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.NOTES.v1',
      ui: {
        label: 'Notes',
        placeholder: 'Customer preferences, allergies, etc.',
        helpText: 'Important notes about this customer',
        group: 'preferences',
        order: 2
      }
    },
    {
      name: 'birthday',
      type: 'date' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.BIRTHDAY.v1',
      ui: {
        label: 'Birthday',
        placeholder: 'Select birthday',
        helpText: 'For birthday promotions and reminders',
        group: 'personal',
        order: 1
      }
    },
    {
      name: 'loyalty_points',
      type: 'number' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.LOYALTY.POINTS.v1',
      defaultValue: 0,
      ui: {
        label: 'Loyalty Points',
        helpText: 'Current loyalty program points',
        group: 'loyalty',
        order: 1,
        readonly: true,
        validation: {
          min: 0
        }
      }
    },
    {
      name: 'lifetime_value',
      type: 'number' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.LIFETIME.VALUE.v1',
      defaultValue: 0,
      ui: {
        label: 'Lifetime Value',
        helpText: 'Total amount spent by this customer',
        group: 'loyalty',
        order: 2,
        readonly: true,
        visible: role => ['owner', 'admin', 'manager'].includes(role),
        displayOptions: {
          format: 'currency',
          prefix: '$'
        }
      }
    }
  ],
  relationships: [
    {
      type: 'REFERRED_BY',
      smart_code: 'HERA.SALON.CUSTOMER.REL.REFERRED_BY.v1',
      cardinality: 'one' as const,
      ui: {
        label: 'Referred By',
        description: 'Customer who referred this person',
        entityType: 'CUSTOMER',
        displayField: 'entity_name',
        searchFields: ['entity_name', 'phone']
      }
    },
    {
      type: 'PREFERRED_STYLIST',
      smart_code: 'HERA.SALON.CUSTOMER.REL.PREFERRED_STYLIST.v1',
      cardinality: 'one' as const,
      ui: {
        label: 'Preferred Stylist',
        description: "Customer's preferred stylist",
        entityType: 'EMPLOYEE',
        displayField: 'entity_name',
        searchFields: ['entity_name']
      }
    }
  ],
  ui: {
    displayName: 'Customer',
    pluralName: 'Customers',
    icon: 'Users',
    description: 'Manage customer information and preferences',
    defaultSort: 'entity_name',
    searchFields: ['entity_name', 'phone', 'email'],
    listFields: ['entity_name', 'phone', 'email', 'vip'],
    formGroups: [
      {
        name: 'basic',
        title: 'Basic Information',
        description: 'Customer name and identification',
        fields: ['entity_name'],
        order: 1
      },
      {
        name: 'contact',
        title: 'Contact Information',
        description: 'Phone and email details',
        fields: ['phone', 'email'],
        order: 2
      },
      {
        name: 'personal',
        title: 'Personal Details',
        description: 'Birthday and personal information',
        fields: ['birthday'],
        order: 3
      },
      {
        name: 'preferences',
        title: 'Preferences & Notes',
        description: 'Customer preferences and special notes',
        fields: ['vip', 'notes'],
        order: 4
      },
      {
        name: 'loyalty',
        title: 'Loyalty Information',
        description: 'Points and customer value',
        fields: ['loyalty_points', 'lifetime_value'],
        order: 5
      }
    ]
  }
}

// Preset registry for easy access
export const ENTITY_PRESETS_WITH_UI = {
  PRODUCT: PRODUCT_PRESET,
  SERVICE: SERVICE_PRESET,
  CUSTOMER: CUSTOMER_PRESET
} as const

// Type helper to get preset by entity type
export type EntityPresetWithUIType =
  (typeof ENTITY_PRESETS_WITH_UI)[keyof typeof ENTITY_PRESETS_WITH_UI]

// Helper function to get preset by entity type string
export function getEntityPresetWithUI(entityType: string): EntityPresetWithUIType | undefined {
  return ENTITY_PRESETS_WITH_UI[entityType as keyof typeof ENTITY_PRESETS_WITH_UI]
}

// Helper function to check field visibility based on user role
export function isFieldVisible(field: EnhancedDynamicFieldDef, userRole: string): boolean {
  if (typeof field.ui.visible === 'function') {
    return field.ui.visible(userRole)
  }
  return field.ui.visible !== false
}

// Helper function to check field read-only status based on user role
export function isFieldReadonly(field: EnhancedDynamicFieldDef, userRole: string): boolean {
  if (typeof field.ui.readonly === 'function') {
    return field.ui.readonly(userRole)
  }
  return field.ui.readonly === true
}

// Helper function to check relationship visibility based on user role
export function isRelationshipVisible(rel: EnhancedRelationshipDef, userRole: string): boolean {
  if (typeof rel.ui.visible === 'function') {
    return rel.ui.visible(userRole)
  }
  return rel.ui.visible !== false
}

// Validation helpers
export function validateDynamicFieldsWithUI(
  preset: EntityPresetWithUIType,
  values: Record<string, any>,
  userRole: string = 'user'
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Check required fields that are visible to the user
  for (const field of preset.dynamicFields || []) {
    if (!isFieldVisible(field, userRole)) continue

    const value = values[field.name]

    // Required field validation
    if (field.ui.validation?.required && (value === undefined || value === null || value === '')) {
      errors[field.name] = `${field.ui.label} is required`
      continue
    }

    // Skip other validations if field is empty and not required
    if (value === undefined || value === null || value === '') continue

    // Type validation
    switch (field.type) {
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          errors[field.name] = `${field.ui.label} must be a valid number`
          continue
        }
        const numValue = Number(value)
        if (field.ui.validation?.min !== undefined && numValue < field.ui.validation.min) {
          errors[field.name] = `${field.ui.label} must be at least ${field.ui.validation.min}`
        }
        if (field.ui.validation?.max !== undefined && numValue > field.ui.validation.max) {
          errors[field.name] = `${field.ui.label} must be no more than ${field.ui.validation.max}`
        }
        break

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors[field.name] = `${field.ui.label} must be true or false`
        }
        break

      case 'date':
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          errors[field.name] = `${field.ui.label} must be a valid date`
        }
        break

      case 'text':
        if (typeof value !== 'string') {
          errors[field.name] = `${field.ui.label} must be text`
          continue
        }
        if (field.ui.validation?.pattern) {
          const regex = new RegExp(field.ui.validation.pattern)
          if (!regex.test(value)) {
            errors[field.name] = `${field.ui.label} format is invalid`
          }
        }
        break
    }

    // Custom validation
    if (field.ui.validation?.custom) {
      const customError = field.ui.validation.custom(value)
      if (customError) {
        errors[field.name] = customError
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

// Helper to apply default values with UI context
export function applyDefaultsWithUI(
  preset: EntityPresetWithUIType,
  values: Record<string, any>,
  userRole: string = 'user'
): Record<string, any> {
  const result = { ...values }

  for (const field of preset.dynamicFields || []) {
    if (!isFieldVisible(field, userRole)) continue

    if (field.defaultValue !== undefined && values[field.name] === undefined) {
      result[field.name] = field.defaultValue
    }
  }

  return result
}
