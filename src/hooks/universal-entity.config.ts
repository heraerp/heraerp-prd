/**
 * Universal Entity Configuration for HERA
 * Config-driven approach to eliminate entity-specific logic
 */

export type DynamicFieldDef = {
  name: string // field_name in core_dynamic_data
  type: 'text' | 'number' | 'bool' | 'date' | 'json'
  smartCode: string // HERA.SALON.X.DYN.FIELD.Y.v1
  required?: boolean
  defaultValue?: any
}

export type EntityRelationshipDef = {
  type: string // HAS_CATEGORY, HAS_ROLE, etc.
  smartCode: string // HERA.SALON.PRODUCT.REL.HAS_CATEGORY.v1
  cardinality?: 'one' | 'many' // default many
}

export type EntityConfig = {
  entityType: string // PRODUCT, SERVICE, CUSTOMER, EMPLOYEE, etc.
  baseSmartCode: string // HERA.SALON.PRODUCT.ENTITY.ITEM.v1
  keyBy?: 'id' | 'entity_code' // default 'id'
  dynamicFields?: DynamicFieldDef[]
  relationships?: EntityRelationshipDef[]
}

/**
 * Pre-configured entity presets for immediate use
 * Each preset defines the complete schema for an entity type
 */
export const ENTITY_PRESETS = {
  PRODUCT: {
    entityType: 'PRODUCT',
    baseSmartCode: 'HERA.SALON.PRODUCT.ENTITY.ITEM.v1',
    keyBy: 'id',
    dynamicFields: [
      {
        name: 'price_market',
        type: 'number',
        smartCode: 'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1',
        defaultValue: 0,
        required: true
      },
      {
        name: 'price_cost',
        type: 'number',
        smartCode: 'HERA.SALON.PRODUCT.DYN.PRICE.COST.v1',
        defaultValue: 0
      },
      {
        name: 'uom',
        type: 'text',
        smartCode: 'HERA.SALON.PRODUCT.DYN.UOM.v1',
        defaultValue: 'pcs'
      },
      {
        name: 'sku',
        type: 'text',
        smartCode: 'HERA.SALON.PRODUCT.DYN.SKU.v1'
      },
      {
        name: 'barcode',
        type: 'text',
        smartCode: 'HERA.SALON.PRODUCT.DYN.BARCODE.v1'
      },
      {
        name: 'reorder_level',
        type: 'number',
        smartCode: 'HERA.SALON.PRODUCT.DYN.REORDER.LEVEL.v1',
        defaultValue: 10
      },
      {
        name: 'stock_quantity',
        type: 'number',
        smartCode: 'HERA.SALON.PRODUCT.DYN.STOCK.QUANTITY.v1',
        defaultValue: 0
      }
    ],
    relationships: [
      {
        type: 'HAS_CATEGORY',
        smartCode: 'HERA.SALON.PRODUCT.REL.HAS_CATEGORY.v1',
        cardinality: 'one'
      }
    ]
  },

  PRODUCT_CATEGORY: {
    entityType: 'PRODUCT_CATEGORY',
    baseSmartCode: 'HERA.SALON.PRODUCTCATEGORY.ENTITY.CATEGORY.v1',
    dynamicFields: [
      {
        name: 'description',
        type: 'text',
        smartCode: 'HERA.SALON.PRODUCTCATEGORY.DYN.DESCRIPTION.v1'
      },
      {
        name: 'sort_order',
        type: 'number',
        smartCode: 'HERA.SALON.PRODUCTCATEGORY.DYN.SORT.ORDER.v1',
        defaultValue: 0
      }
    ]
  },

  SERVICE: {
    entityType: 'SERVICE',
    baseSmartCode: 'HERA.SALON.SERVICE.ENTITY.ITEM.v1',
    dynamicFields: [
      {
        name: 'price_market',
        type: 'number',
        smartCode: 'HERA.SALON.SERVICE.DYN.PRICE.MARKET.v1',
        defaultValue: 0,
        required: true
      },
      {
        name: 'duration_min',
        type: 'number',
        smartCode: 'HERA.SALON.SERVICE.DYN.DURATION.MIN.v1',
        defaultValue: 30,
        required: true
      },
      {
        name: 'service_type',
        type: 'text',
        smartCode: 'HERA.SALON.SERVICE.DYN.TYPE.v1',
        defaultValue: 'standard'
      },
      {
        name: 'commission_rate',
        type: 'number',
        smartCode: 'HERA.SALON.SERVICE.DYN.COMMISSION.RATE.v1',
        defaultValue: 0.15
      }
    ],
    relationships: [
      {
        type: 'HAS_CATEGORY',
        smartCode: 'HERA.SALON.SERVICE.REL.HAS_CATEGORY.v1',
        cardinality: 'one'
      }
    ]
  },

  SERVICE_CATEGORY: {
    entityType: 'SERVICE_CATEGORY',
    baseSmartCode: 'HERA.SALON.SERVICECATEGORY.ENTITY.CATEGORY.v1',
    dynamicFields: [
      {
        name: 'description',
        type: 'text',
        smartCode: 'HERA.SALON.SERVICECATEGORY.DYN.DESCRIPTION.v1'
      },
      {
        name: 'sort_order',
        type: 'number',
        smartCode: 'HERA.SALON.SERVICECATEGORY.DYN.SORT.ORDER.v1',
        defaultValue: 0
      }
    ]
  },

  CUSTOMER: {
    entityType: 'CUSTOMER',
    baseSmartCode: 'HERA.SALON.CRM.ENTITY.CUSTOMER.v1',
    dynamicFields: [
      {
        name: 'phone',
        type: 'text',
        smartCode: 'HERA.SALON.CRM.DYN.PHONE.v1',
        required: true
      },
      {
        name: 'email',
        type: 'text',
        smartCode: 'HERA.SALON.CRM.DYN.EMAIL.v1'
      },
      {
        name: 'tier',
        type: 'text',
        smartCode: 'HERA.SALON.CRM.DYN.TIER.v1',
        defaultValue: 'standard'
      },
      {
        name: 'dob',
        type: 'date',
        smartCode: 'HERA.SALON.CRM.DYN.DOB.v1'
      },
      {
        name: 'notes',
        type: 'text',
        smartCode: 'HERA.SALON.CRM.DYN.NOTES.v1'
      }
    ]
  },

  EMPLOYEE: {
    entityType: 'EMPLOYEE',
    baseSmartCode: 'HERA.SALON.HCM.ENTITY.EMPLOYEE.v1',
    dynamicFields: [
      {
        name: 'rate_hour',
        type: 'number',
        smartCode: 'HERA.SALON.HCM.DYN.RATE.HOUR.v1',
        required: true
      },
      {
        name: 'role',
        type: 'text',
        smartCode: 'HERA.SALON.HCM.DYN.ROLE.v1',
        defaultValue: 'stylist',
        required: true
      },
      {
        name: 'phone',
        type: 'text',
        smartCode: 'HERA.SALON.HCM.DYN.PHONE.v1'
      },
      {
        name: 'email',
        type: 'text',
        smartCode: 'HERA.SALON.HCM.DYN.EMAIL.v1'
      },
      {
        name: 'join_date',
        type: 'date',
        smartCode: 'HERA.SALON.HCM.DYN.JOIN.DATE.v1',
        defaultValue: new Date().toISOString().split('T')[0]
      },
      {
        name: 'commission_rate',
        type: 'number',
        smartCode: 'HERA.SALON.HCM.DYN.COMMISSION.RATE.v1',
        defaultValue: 0.4
      }
    ],
    relationships: [
      {
        type: 'HAS_ROLE',
        smartCode: 'HERA.SALON.HCM.REL.HAS_ROLE.v1',
        cardinality: 'one'
      }
    ]
  },

  APPOINTMENT: {
    entityType: 'APPOINTMENT',
    baseSmartCode: 'HERA.SALON.CALENDAR.ENTITY.APPOINTMENT.v1',
    dynamicFields: [
      {
        name: 'start_time',
        type: 'date',
        smartCode: 'HERA.SALON.CALENDAR.DYN.START.TIME.v1',
        required: true
      },
      {
        name: 'end_time',
        type: 'date',
        smartCode: 'HERA.SALON.CALENDAR.DYN.END.TIME.v1',
        required: true
      },
      {
        name: 'duration_min',
        type: 'number',
        smartCode: 'HERA.SALON.CALENDAR.DYN.DURATION.MIN.v1',
        defaultValue: 60
      },
      {
        name: 'total_amount',
        type: 'number',
        smartCode: 'HERA.SALON.CALENDAR.DYN.TOTAL.AMOUNT.v1',
        defaultValue: 0
      },
      {
        name: 'status',
        type: 'text',
        smartCode: 'HERA.SALON.CALENDAR.DYN.STATUS.v1',
        defaultValue: 'scheduled'
      },
      {
        name: 'notes',
        type: 'text',
        smartCode: 'HERA.SALON.CALENDAR.DYN.NOTES.v1'
      }
    ],
    relationships: [
      {
        type: 'HAS_CUSTOMER',
        smartCode: 'HERA.SALON.CALENDAR.REL.HAS_CUSTOMER.v1',
        cardinality: 'one'
      },
      {
        type: 'HAS_EMPLOYEE',
        smartCode: 'HERA.SALON.CALENDAR.REL.HAS_EMPLOYEE.v1',
        cardinality: 'one'
      },
      {
        type: 'HAS_SERVICE',
        smartCode: 'HERA.SALON.CALENDAR.REL.HAS_SERVICE.v1',
        cardinality: 'many'
      }
    ]
  }
} satisfies Record<string, EntityConfig>

/**
 * Universal dynamic field bundles for common use cases
 */
export const FIELD_BUNDLES = {
  MONEY: [
    {
      name: 'price_market',
      type: 'number' as const,
      smartCode: 'HERA.UNIVERSAL.DYN.PRICE.MARKET.v1'
    },
    { name: 'price_cost', type: 'number' as const, smartCode: 'HERA.UNIVERSAL.DYN.PRICE.COST.v1' },
    {
      name: 'currency',
      type: 'text' as const,
      smartCode: 'HERA.UNIVERSAL.DYN.CURRENCY.v1',
      defaultValue: 'AED'
    }
  ],

  INVENTORY: [
    { name: 'uom', type: 'text' as const, smartCode: 'HERA.UNIVERSAL.DYN.UOM.v1' },
    { name: 'sku', type: 'text' as const, smartCode: 'HERA.UNIVERSAL.DYN.SKU.v1' },
    { name: 'barcode', type: 'text' as const, smartCode: 'HERA.UNIVERSAL.DYN.BARCODE.v1' },
    {
      name: 'reorder_level',
      type: 'number' as const,
      smartCode: 'HERA.UNIVERSAL.DYN.REORDER.LEVEL.v1'
    }
  ],

  CRM: [
    { name: 'phone', type: 'text' as const, smartCode: 'HERA.UNIVERSAL.DYN.PHONE.v1' },
    { name: 'email', type: 'text' as const, smartCode: 'HERA.UNIVERSAL.DYN.EMAIL.v1' },
    { name: 'tier', type: 'text' as const, smartCode: 'HERA.UNIVERSAL.DYN.TIER.v1' },
    { name: 'dob', type: 'date' as const, smartCode: 'HERA.UNIVERSAL.DYN.DOB.v1' }
  ],

  HCM: [
    { name: 'rate_hour', type: 'number' as const, smartCode: 'HERA.UNIVERSAL.DYN.RATE.HOUR.v1' },
    { name: 'role', type: 'text' as const, smartCode: 'HERA.UNIVERSAL.DYN.ROLE.v1' },
    { name: 'join_date', type: 'date' as const, smartCode: 'HERA.UNIVERSAL.DYN.JOIN.DATE.v1' }
  ]
}
