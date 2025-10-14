/**
 * HERA Universal Entity Presets
 *
 * Centralized configuration for all entity types.
 * Each preset defines:
 * - Dynamic fields (stored in core_dynamic_data)
 * - Relationships (stored in core_relationships)
 * - Smart codes for HERA DNA integration
 */

import type { DynamicFieldDef, RelationshipDef } from './useUniversalEntity'

export type Role = 'owner' | 'manager' | 'receptionist' | 'staff'

export type FieldWidget = 'text' | 'textarea' | 'number' | 'checkbox' | 'date' | 'json' | 'select'

export interface FieldUi {
  label?: string
  placeholder?: string
  helpText?: string
  roles?: Role[] // who can see/edit
  required?: boolean
  widget?: FieldWidget
  optionsQueryKey?: string // when widget === 'select' (e.g. category list)
  decimals?: number // number fields
  min?: number
  max?: number
}

export interface DynamicFieldDefUI extends DynamicFieldDef {
  ui?: FieldUi
}

export interface RelationshipDefUI extends RelationshipDef {
  ui?: {
    label?: string
    roles?: Role[]
    widget?: 'select' | 'multiselect'
    optionsQueryKey?: string // source for options
  }
}

// Product configuration
export const PRODUCT_PRESET = {
  entity_type: 'PRODUCT',
  labels: {
    singular: 'Product',
    plural: 'Products'
  },
  permissions: {
    create: (role: Role) => ['owner', 'manager'].includes(role),
    edit: (role: Role) => ['owner', 'manager', 'receptionist'].includes(role),
    delete: (role: Role) => ['owner', 'manager'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'price_market',
      type: 'number' as const,
      smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1',
      required: true,
      ui: {
        label: 'Market Price (AED)',
        placeholder: '0.00',
        helpText: 'Selling price for customers'
      }
    },
    {
      name: 'price_cost',
      type: 'number' as const,
      smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.COST.v1',
      required: true,
      ui: {
        label: 'Cost Price (AED)',
        placeholder: '0.00',
        helpText: 'Purchase cost from supplier',
        roles: ['owner', 'manager'] // Hide from staff
      }
    },
    { name: 'sku', type: 'text' as const, smart_code: 'HERA.SALON.PRODUCT.DYN.SKU.v1' },
    {
      name: 'stock_quantity',
      type: 'number' as const,
      smart_code: 'HERA.SALON.PRODUCT.DYN.STOCK.QTY.v1',
      defaultValue: 0
    },
    {
      name: 'reorder_level',
      type: 'number' as const,
      smart_code: 'HERA.SALON.PRODUCT.DYN.REORDER.LEVEL.v1',
      defaultValue: 10
    },
    { name: 'size', type: 'text' as const, smart_code: 'HERA.SALON.PRODUCT.DYN.SIZE.v1' },
    { name: 'barcode', type: 'text' as const, smart_code: 'HERA.SALON.PRODUCT.DYN.BARCODE.v1' }
  ],
  relationships: [
    {
      type: 'HAS_CATEGORY',
      smart_code: 'HERA.SALON.PRODUCT.REL.HAS_CATEGORY.v1',
      cardinality: 'one' as const
    },
    {
      type: 'HAS_BRAND',
      smart_code: 'HERA.SALON.PRODUCT.REL.HAS_BRAND.v1',
      cardinality: 'one' as const
    },
    {
      type: 'SUPPLIED_BY',
      smart_code: 'HERA.SALON.PRODUCT.REL.SUPPLIED_BY.v1',
      cardinality: 'many' as const
    },
    {
      type: 'STOCK_AT',
      smart_code: 'HERA.SALON.PRODUCT.REL.STOCK_AT.v1',
      cardinality: 'many' as const
    }
  ]
}

// Service configuration
export const SERVICE_PRESET = {
  entity_type: 'SERVICE',
  labels: {
    singular: 'Service',
    plural: 'Services'
  },
  permissions: {
    create: (role: Role) => ['owner', 'manager'].includes(role),
    edit: (role: Role) => ['owner', 'manager', 'receptionist'].includes(role),
    delete: (role: Role) => ['owner', 'manager'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'price_market',
      type: 'number' as const,
      smart_code: 'HERA.SALON.SERVICE.DYN.PRICE.MARKET.v1',
      required: true
    },
    {
      name: 'duration_min',
      type: 'number' as const,
      smart_code: 'HERA.SALON.SERVICE.DYN.DURATION.MIN.v1',
      required: true
    },
    {
      name: 'commission_rate',
      type: 'number' as const,
      smart_code: 'HERA.SALON.SERVICE.DYN.COMMISSION.v1',
      defaultValue: 0.5
    },
    {
      name: 'description',
      type: 'text' as const,
      smart_code: 'HERA.SALON.SERVICE.DYN.DESCRIPTION.v1'
    },
    {
      name: 'active',
      type: 'boolean' as const,
      smart_code: 'HERA.SALON.SERVICE.DYN.ACTIVE.v1',
      defaultValue: true
    },
    {
      name: 'requires_booking',
      type: 'boolean' as const,
      smart_code: 'HERA.SALON.SERVICE.DYN.REQUIRES_BOOKING.v1',
      defaultValue: false
    }
  ],
  relationships: [
    {
      type: 'HAS_CATEGORY',
      smart_code: 'HERA.SALON.SERVICE.REL.HAS_CATEGORY.v1',
      cardinality: 'one' as const
    },
    {
      type: 'PERFORMED_BY_ROLE',
      smart_code: 'HERA.SALON.SERVICE.REL.PERFORMED_BY_ROLE.v1',
      cardinality: 'many' as const
    },
    {
      type: 'REQUIRES_PRODUCT',
      smart_code: 'HERA.SALON.SERVICE.REL.REQUIRES_PRODUCT.v1',
      cardinality: 'many' as const
    },
    {
      type: 'AVAILABLE_AT',
      smart_code: 'HERA.SALON.SERVICE.REL.AVAILABLE_AT.v1',
      cardinality: 'many' as const
    }
  ]
}

// Customer configuration
export const CUSTOMER_PRESET = {
  entity_type: 'CUSTOMER',
  labels: {
    singular: 'Customer',
    plural: 'Customers'
  },
  permissions: {
    create: () => true,
    edit: (role: Role) => ['owner', 'manager', 'receptionist'].includes(role),
    delete: (role: Role) => ['owner', 'manager'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'phone',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.PHONE.v1',
      required: true
    },
    { name: 'email', type: 'text' as const, smart_code: 'HERA.SALON.CUSTOMER.DYN.EMAIL.v1' },
    {
      name: 'vip',
      type: 'boolean' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.VIP.v1',
      defaultValue: false
    },
    { name: 'notes', type: 'text' as const, smart_code: 'HERA.SALON.CUSTOMER.DYN.NOTES.v1' },
    { name: 'birthday', type: 'date' as const, smart_code: 'HERA.SALON.CUSTOMER.DYN.BIRTHDAY.v1' },
    {
      name: 'loyalty_points',
      type: 'number' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.LOYALTY.POINTS.v1',
      defaultValue: 0
    },
    {
      name: 'lifetime_value',
      type: 'number' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.LIFETIME.VALUE.v1',
      defaultValue: 0
    }
  ],
  relationships: [
    {
      type: 'REFERRED_BY',
      smart_code: 'HERA.SALON.CUSTOMER.REL.REFERRED_BY.v1',
      cardinality: 'one' as const
    },
    {
      type: 'PREFERRED_STYLIST',
      smart_code: 'HERA.SALON.CUSTOMER.REL.PREFERRED_STYLIST.v1',
      cardinality: 'one' as const
    }
  ]
}

// Employee configuration
export const EMPLOYEE_PRESET = {
  entity_type: 'EMPLOYEE',
  labels: {
    singular: 'Employee',
    plural: 'Employees'
  },
  permissions: {
    create: (role: Role) => ['owner', 'manager'].includes(role),
    edit: (role: Role) => ['owner', 'manager'].includes(role),
    delete: (role: Role) => ['owner'].includes(role),
    view: (role: Role) => ['owner', 'manager', 'receptionist'].includes(role)
  },
  dynamicFields: [
    {
      name: 'phone',
      type: 'text' as const,
      smart_code: 'HERA.SALON.EMPLOYEE.DYN.PHONE.v1',
      required: true
    },
    {
      name: 'email',
      type: 'text' as const,
      smart_code: 'HERA.SALON.EMPLOYEE.DYN.EMAIL.v1',
      required: true
    },
    {
      name: 'hour_rate',
      type: 'number' as const,
      smart_code: 'HERA.SALON.EMPLOYEE.DYN.RATE.HOUR.v1',
      defaultValue: 0
    },
    {
      name: 'commission_rate',
      type: 'number' as const,
      smart_code: 'HERA.SALON.EMPLOYEE.DYN.COMMISSION.v1',
      defaultValue: 0.5
    },
    {
      name: 'active',
      type: 'boolean' as const,
      smart_code: 'HERA.SALON.EMPLOYEE.DYN.ACTIVE.v1',
      defaultValue: true
    },
    { name: 'hire_date', type: 'date' as const, smart_code: 'HERA.SALON.EMPLOYEE.DYN.HIRE_DATE.v1' }
  ],
  relationships: [
    {
      type: 'HAS_ROLE',
      smart_code: 'HERA.HCM.EMPLOYMENT.REL.HAS_ROLE.v1',
      cardinality: 'many' as const
    },
    {
      type: 'REPORTS_TO',
      smart_code: 'HERA.HCM.EMPLOYMENT.REL.REPORTS_TO.v1',
      cardinality: 'one' as const
    },
    {
      type: 'CAN_PERFORM',
      smart_code: 'HERA.SALON.EMPLOYEE.REL.CAN_PERFORM.v1',
      cardinality: 'many' as const
    }
  ]
}

// Appointment configuration
export const APPOINTMENT_PRESET = {
  entity_type: 'APPOINTMENT',
  labels: {
    singular: 'Appointment',
    plural: 'Appointments'
  },
  permissions: {
    create: (role: Role) => ['owner', 'manager', 'receptionist'].includes(role),
    edit: (role: Role) => ['owner', 'manager', 'receptionist'].includes(role),
    delete: (role: Role) => ['owner', 'manager'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'customer_id',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPT.FIELD.CUSTOMER_ID.V1',
      required: true,
      ui: {
        label: 'Customer ID',
        required: true
      }
    },
    {
      name: 'customer_name',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPT.FIELD.CUSTOMER_NAME.V1',
      ui: {
        label: 'Customer Name',
        placeholder: 'Customer name'
      }
    },
    {
      name: 'stylist_id',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPT.FIELD.STYLIST_ID.V1',
      ui: {
        label: 'Stylist ID'
      }
    },
    {
      name: 'stylist_name',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPT.FIELD.STYLIST_NAME.V1',
      ui: {
        label: 'Stylist Name',
        placeholder: 'Stylist name'
      }
    },
    {
      name: 'service_ids',
      type: 'json' as const,
      smart_code: 'HERA.SALON.APPT.FIELD.SERVICE_IDS.V1',
      defaultValue: [],
      ui: {
        label: 'Services',
        widget: 'json',
        helpText: 'Array of service IDs'
      }
    },
    {
      name: 'start_time',
      type: 'datetime' as const,
      smart_code: 'HERA.SALON.APPT.FIELD.START_TIME.V1',
      required: true,
      ui: {
        label: 'Start Time',
        widget: 'date',
        required: true
      }
    },
    {
      name: 'end_time',
      type: 'datetime' as const,
      smart_code: 'HERA.SALON.APPT.FIELD.END_TIME.V1',
      ui: {
        label: 'End Time',
        widget: 'date'
      }
    },
    {
      name: 'duration_minutes',
      type: 'number' as const,
      smart_code: 'HERA.SALON.APPT.FIELD.DURATION.V1',
      defaultValue: 60,
      ui: {
        label: 'Duration (minutes)',
        placeholder: '60',
        min: 15,
        max: 480
      }
    },
    {
      name: 'price',
      type: 'number' as const,
      smart_code: 'HERA.SALON.APPT.FIELD.PRICE.V1',
      defaultValue: 0,
      ui: {
        label: 'Price (AED)',
        placeholder: '0.00',
        decimals: 2,
        min: 0
      }
    },
    {
      name: 'currency_code',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPT.FIELD.CURRENCY.V1',
      defaultValue: 'AED',
      ui: {
        label: 'Currency',
        placeholder: 'AED'
      }
    },
    {
      name: 'notes',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPT.FIELD.NOTES.V1',
      ui: {
        label: 'Notes',
        placeholder: 'Special requests or notes',
        widget: 'textarea'
      }
    },
    {
      name: 'branch_id',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPT.FIELD.BRANCH_ID.V1',
      ui: {
        label: 'Branch ID'
      }
    },
    {
      name: 'status',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPT.DYN.STATUS.v1',
      defaultValue: 'booked',
      ui: {
        label: 'Status',
        widget: 'select'
      }
    },
    {
      name: 'reminder_sent',
      type: 'boolean' as const,
      smart_code: 'HERA.SALON.APPT.DYN.REMINDER.v1',
      defaultValue: false
    }
  ],
  relationships: [
    {
      type: 'FOR_CUSTOMER',
      smart_code: 'HERA.SALON.APPT.REL.FOR_CUSTOMER.v1',
      cardinality: 'one' as const
    },
    {
      type: 'WITH_EMPLOYEE',
      smart_code: 'HERA.SALON.APPT.REL.WITH_EMPLOYEE.v1',
      cardinality: 'one' as const
    },
    {
      type: 'INCLUDES_SERVICE',
      smart_code: 'HERA.SALON.APPT.REL.INCLUDES_SERVICE.v1',
      cardinality: 'many' as const
    }
  ]
}

// Vendor/Supplier configuration
export const VENDOR_PRESET = {
  entity_type: 'VENDOR',
  dynamicFields: [
    {
      name: 'phone',
      type: 'text' as const,
      smart_code: 'HERA.SALON.VENDOR.DYN.PHONE.v1',
      required: true
    },
    { name: 'email', type: 'text' as const, smart_code: 'HERA.SALON.VENDOR.DYN.EMAIL.v1' },
    { name: 'website', type: 'text' as const, smart_code: 'HERA.SALON.VENDOR.DYN.WEBSITE.v1' },
    {
      name: 'payment_terms',
      type: 'text' as const,
      smart_code: 'HERA.SALON.VENDOR.DYN.PAYMENT_TERMS.v1',
      defaultValue: 'NET30'
    },
    {
      name: 'credit_limit',
      type: 'number' as const,
      smart_code: 'HERA.SALON.VENDOR.DYN.CREDIT_LIMIT.v1',
      defaultValue: 0
    },
    {
      name: 'active',
      type: 'boolean' as const,
      smart_code: 'HERA.SALON.VENDOR.DYN.ACTIVE.v1',
      defaultValue: true
    }
  ],
  relationships: [
    {
      type: 'SUPPLIES_CATEGORY',
      smart_code: 'HERA.SALON.VENDOR.REL.SUPPLIES_CATEGORY.v1',
      cardinality: 'many' as const
    }
  ]
}

// Service Category configuration
export const SERVICE_CATEGORY_PRESET = {
  entity_type: 'SERVICE_CATEGORY',
  labels: {
    singular: 'Service Category',
    plural: 'Service Categories'
  },
  permissions: {
    create: (role: Role) => ['owner', 'manager'].includes(role),
    edit: (role: Role) => ['owner', 'manager'].includes(role),
    delete: (role: Role) => ['owner', 'manager'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'description',
      type: 'text' as const,
      smart_code: 'HERA.SALON.SVC.CATEGORY.DYN.DESCRIPTION.v1',
      ui: {
        label: 'Description',
        placeholder: 'Category description',
        helpText: 'Brief description of this service category',
        widget: 'textarea'
      }
    },
    {
      name: 'color',
      type: 'text' as const,
      smart_code: 'HERA.SALON.SVC.CATEGORY.DYN.COLOR.v1',
      defaultValue: '#D4AF37',
      ui: {
        label: 'Color',
        placeholder: '#D4AF37',
        helpText: 'Hex color for category display'
      }
    },
    {
      name: 'icon',
      type: 'text' as const,
      smart_code: 'HERA.SALON.SVC.CATEGORY.DYN.ICON.v1',
      defaultValue: 'Sparkles',
      ui: {
        label: 'Icon',
        placeholder: 'Sparkles',
        helpText: 'Lucide icon name'
      }
    },
    {
      name: 'display_order',
      type: 'number' as const,
      smart_code: 'HERA.SALON.SVC.CATEGORY.DYN.ORDER.v1',
      defaultValue: 0,
      ui: {
        label: 'Display Order',
        placeholder: '0',
        helpText: 'Sort order for display'
      }
    },
    {
      name: 'service_count',
      type: 'number' as const,
      smart_code: 'HERA.SALON.SVC.CATEGORY.DYN.SERVICE_COUNT.v1',
      defaultValue: 0,
      ui: {
        label: 'Service Count',
        helpText: 'Number of services in this category',
        roles: ['owner', 'manager'] // Read-only computed field
      }
    },
    {
      name: 'active',
      type: 'boolean' as const,
      smart_code: 'HERA.SALON.SVC.CATEGORY.DYN.ACTIVE.v1',
      defaultValue: true,
      ui: {
        label: 'Active',
        widget: 'checkbox'
      }
    }
  ],
  relationships: [
    {
      type: 'PARENT_CATEGORY',
      smart_code: 'HERA.SALON.SVC.CATEGORY.REL.PARENT.v1',
      cardinality: 'one' as const,
      ui: {
        label: 'Parent Category',
        widget: 'select',
        optionsQueryKey: 'service-categories'
      }
    }
  ]
}

// Category configuration (for products/services)
export const CATEGORY_PRESET = {
  entity_type: 'CATEGORY',
  labels: {
    singular: 'Category',
    plural: 'Categories'
  },
  permissions: {
    create: (role: Role) => ['owner', 'manager'].includes(role),
    edit: (role: Role) => ['owner', 'manager'].includes(role),
    delete: (role: Role) => ['owner', 'manager'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'display_order',
      type: 'number' as const,
      smart_code: 'HERA.SALON.CATEGORY.DYN.ORDER.v1',
      defaultValue: 0
    },
    { name: 'icon', type: 'text' as const, smart_code: 'HERA.SALON.CATEGORY.DYN.ICON.v1' },
    { name: 'color', type: 'text' as const, smart_code: 'HERA.SALON.CATEGORY.DYN.COLOR.v1' },
    {
      name: 'active',
      type: 'boolean' as const,
      smart_code: 'HERA.SALON.CATEGORY.DYN.ACTIVE.v1',
      defaultValue: true
    }
  ],
  relationships: [
    {
      type: 'PARENT_CATEGORY',
      smart_code: 'HERA.SALON.CATEGORY.REL.PARENT.v1',
      cardinality: 'one' as const
    }
  ]
}

// Brand configuration
export const BRAND_PRESET = {
  entity_type: 'BRAND',
  dynamicFields: [
    { name: 'website', type: 'text' as const, smart_code: 'HERA.SALON.BRAND.DYN.WEBSITE.v1' },
    { name: 'logo_url', type: 'text' as const, smart_code: 'HERA.SALON.BRAND.DYN.LOGO.v1' },
    {
      name: 'active',
      type: 'boolean' as const,
      smart_code: 'HERA.SALON.BRAND.DYN.ACTIVE.v1',
      defaultValue: true
    }
  ],
  relationships: [
    {
      type: 'OWNED_BY_VENDOR',
      smart_code: 'HERA.SALON.BRAND.REL.OWNED_BY.v1',
      cardinality: 'one' as const
    }
  ]
}

// Jewelry: Grading Job
export const GRADING_JOB_PRESET = {
  entity_type: 'GRADING_JOB',
  labels: {
    singular: 'Grading Job',
    plural: 'Grading Jobs'
  },
  dynamicFields: [
    {
      name: 'status',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.GRADING.DYN.STATUS.v1',
      ui: { label: 'Status', widget: 'select', optionsQueryKey: 'GRADING_STATUS' }
    },
    {
      name: 'priority',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.GRADING.DYN.PRIORITY.v1',
      ui: { widget: 'select', optionsQueryKey: 'PRIORITY_SIMPLE' }
    },
    { name: 'carat', type: 'number' as const, smart_code: 'HERA.JEWELRY.GRADING.DYN.CARAT.v1' },
    {
      name: 'cut',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.GRADING.DYN.CUT.v1',
      ui: { widget: 'select', optionsQueryKey: 'CUT_BANDS' }
    },
    {
      name: 'color',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.GRADING.DYN.COLOR.v1',
      ui: { widget: 'select', optionsQueryKey: 'COLOR_BANDS' }
    },
    {
      name: 'clarity',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.GRADING.DYN.CLARITY.v1',
      ui: { widget: 'select', optionsQueryKey: 'CLARITY_BANDS' }
    },
    {
      name: 'measurements',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.GRADING.DYN.MEASUREMENTS.v1'
    },
    {
      name: 'certificate_number',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.GRADING.DYN.CERT_NO.v1'
    },
    { name: 'pass', type: 'boolean' as const, smart_code: 'HERA.JEWELRY.GRADING.DYN.PASS.v1' }
  ],
  relationships: [
    {
      type: 'OF_ITEM',
      smart_code: 'HERA.JEWELRY.GRADING.REL.OF_ITEM.v1',
      cardinality: 'one' as const
    },
    {
      type: 'ASSIGNED_TO',
      smart_code: 'HERA.JEWELRY.GRADING.REL.ASSIGNED_TO.v1',
      cardinality: 'one' as const
    },
    {
      type: 'ISSUES_CERT',
      smart_code: 'HERA.JEWELRY.GRADING.REL.ISSUES_CERT.v1',
      cardinality: 'one' as const
    }
  ]
}

// Jewelry: Certificate
export const CERTIFICATE_PRESET = {
  entity_type: 'CERTIFICATE',
  labels: {
    singular: 'Certificate',
    plural: 'Certificates'
  },
  dynamicFields: [
    { name: 'cert_number', type: 'text' as const, smart_code: 'HERA.JEWELRY.CERT.DYN.NUMBER.v1' },
    { name: 'issuer', type: 'text' as const, smart_code: 'HERA.JEWELRY.CERT.DYN.ISSUER.v1' },
    {
      name: 'issue_date',
      type: 'date' as const,
      smart_code: 'HERA.JEWELRY.CERT.DYN.ISSUE_DATE.v1'
    },
    { name: 'pdf_url', type: 'text' as const, smart_code: 'HERA.JEWELRY.CERT.DYN.PDF_URL.v1' }
  ],
  relationships: [
    { type: 'FOR_JOB', smart_code: 'HERA.JEWELRY.CERT.REL.FOR_JOB.v1', cardinality: 'one' as const }
  ]
}

// Role configuration
export const ROLE_PRESET = {
  entity_type: 'ROLE',
  labels: {
    singular: 'Role',
    plural: 'Roles'
  },
  permissions: {
    create: (role: Role) => ['owner'].includes(role),
    edit: (role: Role) => ['owner', 'manager'].includes(role),
    delete: (role: Role) => ['owner'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'title',
      type: 'text' as const,
      smart_code: 'HERA.SALON.ROLE.DYN.TITLE.V1',
      required: true,
      ui: {
        label: 'Title',
        placeholder: 'Enter role title',
        required: true
      }
    },
    {
      name: 'description',
      type: 'text' as const,
      smart_code: 'HERA.SALON.ROLE.DYN.DESCRIPTION.V1',
      ui: {
        label: 'Description',
        placeholder: 'Role description',
        widget: 'textarea'
      }
    },
    {
      name: 'permissions',
      type: 'json' as const,
      smart_code: 'HERA.SALON.ROLE.DYN.PERMISSIONS.V1',
      defaultValue: [],
      ui: {
        label: 'Permissions',
        helpText: 'Array of permission strings',
        widget: 'json',
        roles: ['owner', 'manager'] // 🔒 Role-gated field
      }
    },
    {
      name: 'status',
      type: 'text' as const,
      smart_code: 'HERA.SALON.ROLE.DYN.STATUS.V1',
      defaultValue: 'active',
      ui: {
        label: 'Status',
        widget: 'select',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      }
    },
    {
      name: 'rank',
      type: 'number' as const,
      smart_code: 'HERA.SALON.ROLE.DYN.RANK.V1',
      ui: {
        label: 'Rank',
        placeholder: 'Role hierarchy rank (higher = more senior)',
        min: 1,
        max: 10
      }
    },
    {
      name: 'active',
      type: 'boolean' as const,
      smart_code: 'HERA.SALON.ROLE.DYN.ACTIVE.V1',
      defaultValue: true,
      ui: {
        label: 'Active',
        widget: 'checkbox'
      }
    }
  ],
  relationships: []
}

// Staff configuration (Salon-specific with complete field set)
export const STAFF_PRESET = {
  entity_type: 'STAFF',
  labels: {
    singular: 'Staff Member',
    plural: 'Staff'
  },
  permissions: {
    create: (role: Role) => ['owner', 'manager'].includes(role),
    edit: (role: Role) => ['owner', 'manager'].includes(role),
    delete: (role: Role) => ['owner'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'first_name',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.FIRST_NAME.V1',
      required: true,
      ui: {
        label: 'First Name',
        placeholder: 'Enter first name',
        required: true
      }
    },
    {
      name: 'last_name',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.LAST_NAME.V1',
      required: true,
      ui: {
        label: 'Last Name',
        placeholder: 'Enter last name',
        required: true
      }
    },
    {
      name: 'email',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.EMAIL.V1',
      required: true,
      ui: {
        label: 'Email',
        placeholder: 'staff@salon.com',
        required: true,
        helpText: 'Valid email address required'
      }
    },
    {
      name: 'phone',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.PHONE.V1',
      ui: {
        label: 'Phone Number',
        placeholder: '+971 50 123 4567'
      }
    },
    {
      name: 'role_title',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.ROLE_TITLE.V1',
      ui: {
        label: 'Role Title',
        placeholder: 'e.g., Senior Stylist, Receptionist',
        helpText: 'Job title or designation'
      }
    },
    {
      name: 'status',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.STATUS.V1',
      defaultValue: 'active',
      ui: {
        label: 'Status',
        widget: 'select',
        helpText: 'Current employment status'
      }
    },
    {
      name: 'hire_date',
      type: 'date' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.HIRE_DATE.V1',
      ui: {
        label: 'Hire Date',
        widget: 'date'
      }
    },
    {
      name: 'hourly_cost',
      type: 'number' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.PRICE.COST.V1',
      defaultValue: 0,
      ui: {
        label: 'Hourly Cost (AED)',
        placeholder: '0.00',
        helpText: 'Internal cost per hour (visible to managers only)',
        roles: ['owner', 'manager'], // 🔒 Role-gated field
        decimals: 2,
        min: 0
      }
    },
    {
      name: 'display_rate',
      type: 'number' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.RATE.DISPLAY.V1',
      defaultValue: 0,
      ui: {
        label: 'Display Rate (AED)',
        placeholder: '0.00',
        helpText: 'Customer-facing hourly rate',
        decimals: 2,
        min: 0
      }
    },
    {
      name: 'skills',
      type: 'json' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.SKILLS.V1',
      defaultValue: [],
      ui: {
        label: 'Skills',
        helpText: 'Array of skill tags (e.g., ["color", "keratin", "extensions"])',
        widget: 'json'
      }
    },
    {
      name: 'bio',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.BIO.V1',
      ui: {
        label: 'Biography',
        placeholder: 'Professional bio for client-facing profiles',
        widget: 'textarea'
      }
    },
    {
      name: 'avatar_url',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.AVATAR_URL.V1',
      ui: {
        label: 'Avatar URL',
        placeholder: 'https://example.com/avatar.jpg',
        helpText: 'Profile picture URL'
      }
    }
  ],
  relationships: [
    {
      type: 'STAFF_HAS_ROLE',
      smart_code: 'HERA.SALON.STAFF.REL.HAS_ROLE.V1',
      cardinality: 'one' as const,
      ui: {
        label: 'Role',
        widget: 'select',
        optionsQueryKey: 'roles'
      }
    },
    {
      type: 'STAFF_CAN_SERVICE',
      smart_code: 'HERA.SALON.STAFF.REL.CAN_SERVICE.V1',
      cardinality: 'many' as const,
      ui: {
        label: 'Can Perform Services',
        widget: 'multiselect',
        optionsQueryKey: 'services',
        helpText: 'Services this staff member is qualified to perform'
      }
    },
    {
      type: 'STAFF_MEMBER_OF',
      smart_code: 'HERA.SALON.STAFF.REL.MEMBER_OF.V1',
      cardinality: 'one' as const,
      ui: {
        label: 'Salon Location',
        widget: 'select',
        optionsQueryKey: 'locations'
      }
    },
    {
      type: 'STAFF_REPORTS_TO',
      smart_code: 'HERA.SALON.STAFF.REL.REPORTS_TO.V1',
      cardinality: 'one' as const,
      ui: {
        label: 'Reports To',
        widget: 'select',
        optionsQueryKey: 'staff',
        helpText: 'Direct manager (optional)'
      }
    }
  ]
}

// Branch/Location preset for multi-location support
export const BRANCH_PRESET = {
  entity_type: 'BRANCH' as const,
  labels: {
    singular: 'Branch',
    plural: 'Branches'
  },
  permissions: {
    create: ['owner', 'manager'] as Role[],
    update: ['owner', 'manager'] as Role[],
    delete: ['owner'] as Role[],
    view: ['owner', 'manager', 'receptionist', 'staff'] as Role[]
  },
  smart_code: 'HERA.SALON.LOCATION.ENTITY.BRANCH.V1',
  dynamicFields: [
    {
      name: 'code',
      type: 'text' as const,
      required: true,
      smart_code: 'HERA.SALON.LOCATION.DYN.CODE.V1',
      ui: {
        label: 'Branch Code',
        placeholder: 'BR-001',
        helpText: 'Unique identifier for this branch'
      }
    },
    {
      name: 'address',
      type: 'text' as const,
      smart_code: 'HERA.SALON.LOCATION.DYN.ADDRESS.V1',
      ui: {
        label: 'Address',
        placeholder: '123 Main St, City, State ZIP',
        widget: 'textarea' as const
      }
    },
    {
      name: 'phone',
      type: 'text' as const,
      smart_code: 'HERA.SALON.LOCATION.DYN.PHONE.V1',
      ui: {
        label: 'Phone',
        placeholder: '+1 (555) 123-4567'
      }
    },
    {
      name: 'timezone',
      type: 'text' as const,
      smart_code: 'HERA.SALON.LOCATION.DYN.TIMEZONE.V1',
      defaultValue: 'America/New_York',
      ui: {
        label: 'Timezone',
        placeholder: 'America/New_York',
        helpText: 'Timezone for scheduling and reporting'
      }
    },
    {
      name: 'status',
      type: 'text' as const,
      smart_code: 'HERA.SALON.LOCATION.DYN.STATUS.V1',
      defaultValue: 'active',
      ui: {
        label: 'Status',
        widget: 'select' as const,
        helpText: 'Active branches can receive bookings',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      }
    }
  ] as DynamicFieldDefUI[],
  relationships: [
    {
      type: 'STAFF_MEMBER_OF',
      smart_code: 'HERA.SALON.STAFF.REL.MEMBER_OF.V1',
      from: 'STAFF',
      to: 'BRANCH',
      cardinality: '1:1',
      ui: {
        label: 'Staff Members',
        widget: 'multiselect' as const,
        optionsQueryKey: 'staff'
      }
    },
    {
      type: 'SERVICE_AVAILABLE_AT',
      smart_code: 'HERA.SALON.SERVICE.REL.AVAILABLE_AT.V1',
      from: 'SERVICE',
      to: 'BRANCH',
      cardinality: 'M:N',
      ui: {
        label: 'Available Services',
        widget: 'multiselect' as const,
        optionsQueryKey: 'services'
      }
    }
  ] as RelationshipDefUI[],
  formGroups: [
    {
      name: 'basic',
      title: 'Basic Information',
      fields: ['entity_name', 'code', 'status']
    },
    {
      name: 'location',
      title: 'Location Details',
      fields: ['address', 'phone', 'timezone']
    }
  ],
  ui: {
    displayName: 'Branch',
    pluralName: 'Branches',
    icon: 'Building2',
    description: 'Manage your salon locations and branches',
    searchFields: ['entity_name', 'code', 'address'],
    listFields: ['entity_name', 'code', 'address', 'phone', 'status']
  }
}

// Preset registry for easy access
export const ENTITY_PRESETS = {
  PRODUCT: PRODUCT_PRESET,
  SERVICE: SERVICE_PRESET,
  SERVICE_CATEGORY: SERVICE_CATEGORY_PRESET,
  CUSTOMER: CUSTOMER_PRESET,
  EMPLOYEE: EMPLOYEE_PRESET,
  STAFF: STAFF_PRESET,
  APPOINTMENT: APPOINTMENT_PRESET,
  VENDOR: VENDOR_PRESET,
  CATEGORY: CATEGORY_PRESET,
  BRAND: BRAND_PRESET,
  ROLE: ROLE_PRESET,
  BRANCH: BRANCH_PRESET
} as const

// Jewelry-specific entity presets
export const JEWELRY_ITEM_PRESET = {
  entity_type: 'JEWELRY_ITEM',
  labels: {
    singular: 'Jewelry Item',
    plural: 'Jewelry Items'
  },
  permissions: {
    create: (role: Role) => ['owner', 'manager'].includes(role),
    edit: (role: Role) => ['owner', 'manager', 'receptionist'].includes(role),
    delete: (role: Role) => ['owner', 'manager'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'sku',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.ITEM.DYN.SKU.v1',
      required: true,
      ui: {
        label: 'SKU',
        placeholder: 'e.g., DSR-001',
        helpText: 'Unique stock keeping unit identifier'
      }
    },
    {
      name: 'purity',
      type: 'number' as const,
      smart_code: 'HERA.JEWELRY.ITEM.DYN.PURITY.v1',
      required: true,
      ui: {
        label: 'Purity (Karat)',
        placeholder: '18',
        helpText: 'Gold purity in karats (10, 14, 18, 22, 24)',
        min: 10,
        max: 24
      }
    },
    {
      name: 'gross_weight',
      type: 'number' as const,
      smart_code: 'HERA.JEWELRY.ITEM.DYN.GROSS_WEIGHT.v1',
      required: true,
      ui: {
        label: 'Gross Weight (g)',
        placeholder: '5.2',
        helpText: 'Total weight including stones',
        decimals: 3
      }
    },
    {
      name: 'net_weight',
      type: 'number' as const,
      smart_code: 'HERA.JEWELRY.ITEM.DYN.NET_WEIGHT.v1',
      required: true,
      ui: {
        label: 'Net Weight (g)',
        placeholder: '4.8',
        helpText: 'Metal weight only (gross - stone)',
        decimals: 3
      }
    },
    {
      name: 'stone_weight',
      type: 'number' as const,
      smart_code: 'HERA.JEWELRY.ITEM.DYN.STONE_WEIGHT.v1',
      defaultValue: 0,
      ui: {
        label: 'Stone Weight (g)',
        placeholder: '0.4',
        helpText: 'Weight of stones only',
        decimals: 3
      }
    },
    {
      name: 'quantity',
      type: 'number' as const,
      smart_code: 'HERA.JEWELRY.ITEM.DYN.QUANTITY.v1',
      required: true,
      defaultValue: 1,
      ui: {
        label: 'Quantity',
        placeholder: '1',
        helpText: 'Items in stock',
        min: 0
      }
    },
    {
      name: 'unit_price',
      type: 'number' as const,
      smart_code: 'HERA.JEWELRY.ITEM.DYN.UNIT_PRICE.v1',
      required: true,
      ui: {
        label: 'Unit Price ($)',
        placeholder: '12500',
        helpText: 'Selling price per item',
        decimals: 2
      }
    },
    {
      name: 'location',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.ITEM.DYN.LOCATION.v1',
      ui: {
        label: 'Location',
        placeholder: 'Vault A-1',
        helpText: 'Storage location in store'
      }
    },
    {
      name: 'status',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.ITEM.DYN.STATUS.v1',
      defaultValue: 'in_stock',
      ui: {
        label: 'Status',
        widget: 'select' as const,
        optionsQueryKey: 'jewelry-status-options'
      }
    },
    {
      name: 'description',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.ITEM.DYN.DESCRIPTION.v1',
      ui: {
        label: 'Description',
        widget: 'textarea' as const,
        placeholder: 'Detailed item description...'
      }
    }
  ],
  relationships: [
    {
      type: 'HAS_CATEGORY',
      smart_code: 'HERA.JEWELRY.ITEM.REL.HAS_CATEGORY.v1',
      cardinality: 'one' as const,
      ui: {
        label: 'Category',
        widget: 'select' as const,
        optionsQueryKey: 'jewelry-categories'
      }
    },
    {
      type: 'SUPPLIED_BY',
      smart_code: 'HERA.JEWELRY.ITEM.REL.SUPPLIED_BY.v1',
      cardinality: 'one' as const,
      ui: {
        label: 'Supplier',
        widget: 'select' as const,
        optionsQueryKey: 'jewelry-suppliers'
      }
    }
  ]
}

export const JEWELRY_CATEGORY_PRESET = {
  entity_type: 'JEWELRY_CATEGORY',
  labels: {
    singular: 'Category',
    plural: 'Categories'
  },
  permissions: {
    create: (role: Role) => ['owner', 'manager'].includes(role),
    edit: (role: Role) => ['owner', 'manager'].includes(role),
    delete: (role: Role) => ['owner', 'manager'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'display_order',
      type: 'number' as const,
      smart_code: 'HERA.JEWELRY.CATEGORY.DYN.ORDER.v1',
      defaultValue: 0,
      ui: {
        label: 'Display Order',
        placeholder: '1',
        helpText: 'Sort order for display'
      }
    },
    {
      name: 'active',
      type: 'boolean' as const,
      smart_code: 'HERA.JEWELRY.CATEGORY.DYN.ACTIVE.v1',
      defaultValue: true,
      ui: {
        label: 'Active',
        widget: 'checkbox' as const
      }
    }
  ],
  relationships: []
}

export const JEWELRY_SUPPLIER_PRESET = {
  entity_type: 'JEWELRY_SUPPLIER',
  labels: {
    singular: 'Supplier',
    plural: 'Suppliers'
  },
  permissions: {
    create: (role: Role) => ['owner', 'manager'].includes(role),
    edit: (role: Role) => ['owner', 'manager'].includes(role),
    delete: (role: Role) => ['owner', 'manager'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'phone',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.SUPPLIER.DYN.PHONE.v1',
      required: true,
      ui: {
        label: 'Phone',
        placeholder: '+1-555-0123',
        helpText: 'Primary contact number'
      }
    },
    {
      name: 'email',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.SUPPLIER.DYN.EMAIL.v1',
      ui: {
        label: 'Email',
        placeholder: 'supplier@example.com'
      }
    },
    {
      name: 'payment_terms',
      type: 'text' as const,
      smart_code: 'HERA.JEWELRY.SUPPLIER.DYN.PAYMENT_TERMS.v1',
      defaultValue: 'NET30',
      ui: {
        label: 'Payment Terms',
        placeholder: 'NET30'
      }
    },
    {
      name: 'active',
      type: 'boolean' as const,
      smart_code: 'HERA.JEWELRY.SUPPLIER.DYN.ACTIVE.v1',
      defaultValue: true,
      ui: {
        label: 'Active',
        widget: 'checkbox' as const
      }
    }
  ],
  relationships: []
}

// Export as entityPresets for the explorer
export const entityPresets = {
  ...ENTITY_PRESETS,
  JEWELRY_ITEM: JEWELRY_ITEM_PRESET,
  JEWELRY_CATEGORY: JEWELRY_CATEGORY_PRESET,
  JEWELRY_SUPPLIER: JEWELRY_SUPPLIER_PRESET,
  GRADING_JOB: GRADING_JOB_PRESET,
  CERTIFICATE: CERTIFICATE_PRESET
}

// Type helper to get preset by entity type
export type EntityPreset = (typeof entityPresets)[keyof typeof entityPresets]

// Helper function to get preset by entity type string
export function getEntityPreset(entityType: string) {
  return ENTITY_PRESETS[entityType as keyof typeof ENTITY_PRESETS]
}

// Validation helpers
export function validateDynamicFields(
  preset: EntityPreset,
  values: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required fields
  for (const field of preset.dynamicFields || []) {
    if (field.required && (values[field.name] === undefined || values[field.name] === null)) {
      errors.push(`${field.name} is required`)
    }

    // Type validation
    if (values[field.name] !== undefined && values[field.name] !== null) {
      const value = values[field.name]
      switch (field.type) {
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push(`${field.name} must be a number`)
          }
          break
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${field.name} must be a boolean`)
          }
          break
        case 'date':
          if (!(value instanceof Date) && isNaN(Date.parse(value))) {
            errors.push(`${field.name} must be a valid date`)
          }
          break
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

// Helper to apply default values
export function applyDefaults(
  preset: EntityPreset,
  values: Record<string, any>
): Record<string, any> {
  const result = { ...values }

  for (const field of preset.dynamicFields || []) {
    if (field.defaultValue !== undefined && values[field.name] === undefined) {
      result[field.name] = field.defaultValue
    }
  }

  return result
}
