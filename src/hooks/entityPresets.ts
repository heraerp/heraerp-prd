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
export const APPOINTMENT_PRESET: EntityPreset = {
  entity_type: 'APPOINTMENT',
  labels: {
    singular: 'Appointment',
    plural: 'Appointments'
  },
  permissions: {
    create: (role: Role) => ['owner', 'manager', 'receptionist'].includes(role),
    edit: (role: Role) => ['owner', 'manager', 'receptionist', 'staff'].includes(role),
    delete: (role: Role) => ['owner', 'manager'].includes(role),
    view: () => true
  },
  smart_code: 'HERA.SALON.APPOINTMENT.ENTITY.BOOKING.V1',
  dynamicFields: [
    {
      name: 'status',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.STATUS.V1',
      required: true,
      defaultValue: 'scheduled',
      ui: {
        label: 'Status',
        widget: 'select',
        optionsQueryKey: 'appointment_status_options',
        helpText: 'Current status of the appointment'
      }
    },
    {
      name: 'start_time',
      type: 'date' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.START_TIME.V1',
      required: true,
      ui: {
        label: 'Start Time',
        widget: 'date',
        placeholder: 'Select start date and time'
      }
    },
    {
      name: 'end_time',
      type: 'date' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.END_TIME.V1',
      required: true,
      ui: {
        label: 'End Time',
        widget: 'date',
        placeholder: 'Select end date and time'
      }
    },
    {
      name: 'duration_minutes',
      type: 'number' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.DURATION_MIN.V1',
      defaultValue: 60,
      ui: {
        label: 'Duration (minutes)',
        min: 15,
        placeholder: '60',
        helpText: 'Automatically calculated from start and end time'
      }
    },
    {
      name: 'price_total',
      type: 'number' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.PRICE_TOTAL.V1',
      ui: {
        label: 'Total Price',
        placeholder: '0.00',
        decimals: 2,
        roles: ['owner', 'manager', 'accountant']
      }
    },
    {
      name: 'discount',
      type: 'number' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.DISCOUNT.V1',
      defaultValue: 0,
      ui: {
        label: 'Discount',
        placeholder: '0.00',
        decimals: 2,
        min: 0,
        roles: ['owner', 'manager', 'accountant']
      }
    },
    {
      name: 'tax',
      type: 'number' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.TAX.V1',
      defaultValue: 0,
      ui: {
        label: 'Tax',
        placeholder: '0.00',
        decimals: 2,
        min: 0,
        roles: ['owner', 'manager', 'accountant']
      }
    },
    {
      name: 'payment_status',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.PAYMENT_STATUS.V1',
      defaultValue: 'unpaid',
      ui: {
        label: 'Payment Status',
        widget: 'select',
        optionsQueryKey: 'payment_status_options',
        roles: ['owner', 'manager', 'accountant']
      }
    },
    {
      name: 'source',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.SOURCE.V1',
      defaultValue: 'walk_in',
      ui: {
        label: 'Booking Source',
        widget: 'select',
        optionsQueryKey: 'booking_source_options'
      }
    },
    {
      name: 'notes',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.NOTES.V1',
      ui: {
        label: 'Notes',
        widget: 'textarea',
        placeholder: 'Special requests or notes...'
      }
    },
    {
      name: 'room',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.ROOM.V1',
      ui: {
        label: 'Room',
        placeholder: 'Room number or name'
      }
    },
    {
      name: 'chair',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.CHAIR.V1',
      ui: {
        label: 'Chair/Station',
        placeholder: 'Chair or station number'
      }
    },
    {
      name: 'checkin_time',
      type: 'date' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.CHECKIN_TIME.V1',
      ui: {
        label: 'Check-in Time',
        widget: 'date'
      }
    },
    {
      name: 'checkout_time',
      type: 'date' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.CHECKOUT_TIME.V1',
      ui: {
        label: 'Check-out Time',
        widget: 'date'
      }
    },
    {
      name: 'series_id',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.SERIES_ID.V1',
      ui: {
        label: 'Recurring Series ID',
        helpText: 'ID for recurring appointment series'
      }
    },
    {
      name: 'recurrence_rule',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.RECURRENCE_RULE.V1',
      ui: {
        label: 'Recurrence Rule',
        placeholder: 'RRULE:FREQ=WEEKLY;BYDAY=MO',
        helpText: 'iCal format recurrence rule'
      }
    },
    {
      name: 'reminders_sent',
      type: 'json' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.REMINDERS_SENT.V1',
      ui: {
        label: 'Reminders Sent',
        widget: 'json'
      }
    },
    {
      name: 'cancellation_reason',
      type: 'text' as const,
      smart_code: 'HERA.SALON.APPOINTMENT.DYN.CANCELLATION_REASON.V1',
      ui: {
        label: 'Cancellation Reason',
        widget: 'textarea',
        placeholder: 'Reason for cancellation...'
      }
    }
  ],
  relationships: [
    {
      type: 'APPT_FOR_CUSTOMER',
      smart_code: 'HERA.SALON.APPOINTMENT.REL.FOR_CUSTOMER.V1',
      cardinality: 'one' as const,
      required: true,
      ui: {
        label: 'Customer',
        optionsQueryKey: 'customers',
        helpText: 'Select the customer for this appointment'
      }
    },
    {
      type: 'APPT_WITH_STAFF',
      smart_code: 'HERA.SALON.APPOINTMENT.REL.WITH_STAFF.V1',
      cardinality: 'one' as const,
      required: true,
      ui: {
        label: 'Staff Member',
        optionsQueryKey: 'staff',
        helpText: 'Select the staff member providing the service'
      }
    },
    {
      type: 'APPT_OF_SERVICE',
      smart_code: 'HERA.SALON.APPOINTMENT.REL.OF_SERVICE.V1',
      cardinality: 'one' as const,
      required: true,
      ui: {
        label: 'Service',
        optionsQueryKey: 'services',
        helpText: 'Select the service being booked'
      }
    },
    {
      type: 'APPT_AT_LOCATION',
      smart_code: 'HERA.SALON.APPOINTMENT.REL.AT_LOCATION.V1',
      cardinality: 'one' as const,
      required: false,
      ui: {
        label: 'Location',
        optionsQueryKey: 'locations',
        helpText: 'Select the salon location (if multiple)'
      }
    },
    {
      type: 'APPT_LINKED_INVOICE',
      smart_code: 'HERA.SALON.APPOINTMENT.REL.LINKED_INVOICE.V1',
      cardinality: 'one' as const,
      required: false,
      ui: {
        label: 'Linked Invoice',
        optionsQueryKey: 'invoices',
        helpText: 'Invoice linked to this appointment'
      }
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

// Service Category configuration (salon-specific)
export const SERVICE_CATEGORY_PRESET = {
  entityType: 'CATEGORY',                   // canonical type
  label: 'Service Category',
  smartCode: 'HERA.SALON.CATEGORY.ENTITY.ITEM.V1',
  description: 'Categorizes salon services for discovery, pricing and reporting.',
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
      name: 'kind',          
      type: 'text' as const,   
      required: true,
      smart_code: 'HERA.SALON.CATEGORY.DYN.KIND.V1',
      ui: { 
        label: 'Category Kind', 
        widget: 'select' as const, 
        options: ['SERVICE','PRODUCT','BUNDLE'], 
        defaultValue: 'SERVICE' 
      } 
    },
    { 
      name: 'name',          
      type: 'text' as const,   
      required: true,
      smart_code: 'HERA.SALON.CATEGORY.DYN.NAME.V1',
      ui: { 
        label: 'Category Name', 
        placeholder: 'Hair, Nails, Spa…', 
        width: '2/3' 
      } 
    },
    { 
      name: 'code',          
      type: 'text' as const,   
      required: false,
      smart_code: 'HERA.SALON.CATEGORY.DYN.CODE.V1',
      ui: { 
        label: 'Code', 
        placeholder: 'SRV-HAIR', 
        width: '1/3' 
      } 
    },
    { 
      name: 'description',   
      type: 'text' as const,   
      required: false,
      smart_code: 'HERA.SALON.CATEGORY.DYN.DESCRIPTION.V1',
      ui: { 
        label: 'Description', 
        widget: 'textarea' as const 
      } 
    },
    { 
      name: 'display_order', 
      type: 'number' as const, 
      required: false,
      smart_code: 'HERA.SALON.CATEGORY.DYN.DISPLAY_ORDER.V1',
      ui: { 
        label: 'Display Order', 
        widget: 'number' as const 
      } 
    },
    { 
      name: 'status',        
      type: 'text' as const,   
      required: true,
      smart_code: 'HERA.SALON.CATEGORY.DYN.STATUS.V1',
      ui: { 
        label: 'Status', 
        widget: 'select' as const, 
        options: ['active','inactive','archived'], 
        defaultValue: 'active' 
      } 
    },
    { 
      name: 'color_tag',     
      type: 'text' as const,   
      required: false,
      smart_code: 'HERA.SALON.CATEGORY.DYN.COLOR_TAG.V1',
      ui: { 
        label: 'Color Tag', 
        widget: 'color' as const 
      } 
    }
  ],
  relationships: [
    // reverse of SERVICE_HAS_CATEGORY (services page will link to CATEGORY)
    // left blank here; relationship is primarily initiated from SERVICE
  ],
  ui: {
    tableColumns: [
      { key: 'name' },
      { key: 'code' },
      { key: 'display_order' },
      { key: 'status', format: 'badge' }
    ],
    defaultSort: { key: 'display_order', dir: 'asc' },
    searchKeys: ['name','code','description'],
    filters: [
      { key: 'kind', type: 'select', options: ['SERVICE','PRODUCT','BUNDLE'], defaultValue: 'SERVICE' },
      { key: 'status', type: 'select', options: ['active','inactive','archived'] }
    ]
  }
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
    create: (role: Role) => ['owner', 'manager'].includes(role),
    edit: (role: Role) => ['owner', 'manager'].includes(role),
    delete: (role: Role) => ['owner', 'manager'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'title',
      type: 'text' as const,
      smart_code: 'HERA.SALON.ROLE.DYN.TITLE.V1',
      required: true,
      ui: {
        label: 'Role Title',
        placeholder: 'e.g., Senior Stylist',
        helpText: 'Official role title'
      }
    },
    {
      name: 'description',
      type: 'text' as const,
      smart_code: 'HERA.SALON.ROLE.DYN.DESCRIPTION.V1',
      ui: {
        label: 'Description',
        widget: 'textarea',
        placeholder: 'Role responsibilities and details...'
      }
    },
    {
      name: 'permissions',
      type: 'json' as const,
      smart_code: 'HERA.SALON.ROLE.DYN.PERMISSIONS.V1',
      defaultValue: [],
      ui: {
        label: 'Permissions',
        widget: 'json',
        roles: ['owner', 'manager']
      }
    },
    {
      name: 'rank',
      type: 'number' as const,
      smart_code: 'HERA.SALON.ROLE.DYN.RANK.V1',
      defaultValue: 0,
      ui: {
        label: 'Rank',
        helpText: 'Higher rank = more seniority'
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

// Staff configuration
export const STAFF_PRESET = {
  entity_type: 'STAFF',
  labels: {
    singular: 'Staff Member',
    plural: 'Staff Members'
  },
  permissions: {
    create: (role: Role) => ['owner', 'manager'].includes(role),
    edit: (role: Role) => ['owner', 'manager', 'receptionist'].includes(role),
    delete: (role: Role) => ['owner', 'manager'].includes(role),
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
        placeholder: 'John',
        helpText: 'Staff member first name'
      }
    },
    {
      name: 'last_name',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.LAST_NAME.V1',
      required: true,
      ui: {
        label: 'Last Name',
        placeholder: 'Doe',
        helpText: 'Staff member last name'
      }
    },
    {
      name: 'email',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.EMAIL.V1',
      required: true,
      ui: {
        label: 'Email',
        placeholder: 'john.doe@salon.com',
        helpText: 'Staff member email address'
      }
    },
    {
      name: 'phone',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.PHONE.V1',
      ui: {
        label: 'Phone',
        placeholder: '+1 (555) 123-4567',
        helpText: 'Contact phone number'
      }
    },
    {
      name: 'role_title',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.ROLE_TITLE.V1',
      ui: {
        label: 'Role Title (Denormalized)',
        placeholder: 'Senior Stylist',
        helpText: 'Cached role title for display'
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
        optionsQueryKey: 'staff_status_options'
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
      smart_code: 'HERA.SALON.STAFF.DYN.HOURLY_COST.V1',
      ui: {
        label: 'Hourly Cost',
        placeholder: '25.00',
        helpText: 'Internal cost per hour',
        roles: ['owner', 'manager'],
        decimals: 2
      }
    },
    {
      name: 'display_rate',
      type: 'number' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.DISPLAY_RATE.V1',
      ui: {
        label: 'Display Rate',
        placeholder: '150.00',
        helpText: 'Customer-facing hourly rate',
        decimals: 2
      }
    },
    {
      name: 'skills',
      type: 'json' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.SKILLS.V1',
      defaultValue: [],
      ui: {
        label: 'Skills',
        widget: 'json',
        helpText: 'List of skills and certifications'
      }
    },
    {
      name: 'bio',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.BIO.V1',
      ui: {
        label: 'Bio',
        widget: 'textarea',
        placeholder: 'Professional biography...'
      }
    },
    {
      name: 'avatar_url',
      type: 'text' as const,
      smart_code: 'HERA.SALON.STAFF.DYN.AVATAR_URL.V1',
      ui: {
        label: 'Avatar URL',
        placeholder: 'https://...',
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
        optionsQueryKey: 'roles',
        helpText: 'Staff member role'
      }
    },
    {
      type: 'STAFF_CAN_SERVICE',
      smart_code: 'HERA.SALON.STAFF.REL.CAN_SERVICE.V1',
      cardinality: 'many' as const,
      ui: {
        label: 'Services',
        widget: 'multiselect',
        optionsQueryKey: 'services',
        helpText: 'Services this staff member can perform'
      }
    },
    {
      type: 'STAFF_MEMBER_OF',
      smart_code: 'HERA.SALON.STAFF.REL.MEMBER_OF.V1',
      cardinality: 'one' as const,
      ui: {
        label: 'Location',
        widget: 'select',
        optionsQueryKey: 'locations',
        helpText: 'Salon location assignment'
      }
    },
    {
      type: 'STAFF_REPORTS_TO',
      smart_code: 'HERA.SALON.STAFF.REL.REPORTS_TO.V1',
      cardinality: 'one' as const,
      required: false,
      ui: {
        label: 'Reports To',
        widget: 'select',
        optionsQueryKey: 'staff',
        helpText: 'Direct supervisor'
      }
    }
  ]
}

// Preset registry for easy access
export const ENTITY_PRESETS = {
  PRODUCT: PRODUCT_PRESET,
  SERVICE: SERVICE_PRESET,
  CUSTOMER: CUSTOMER_PRESET,
  EMPLOYEE: EMPLOYEE_PRESET,
  APPOINTMENT: APPOINTMENT_PRESET,
  VENDOR: VENDOR_PRESET,
  CATEGORY: CATEGORY_PRESET,
  BRAND: BRAND_PRESET,
  ROLE: ROLE_PRESET,
  STAFF: STAFF_PRESET
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
  SERVICE_CATEGORY: SERVICE_CATEGORY_PRESET,
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
