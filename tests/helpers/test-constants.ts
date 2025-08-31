// Test organization IDs
export const ICE_CREAM_ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'
export const SALON_ORG_ID = 'aa9d8a6f-cf21-4fa3-8b81-06e13e0873fe'

// API endpoints
export const API_ENDPOINTS = {
  UNIVERSAL: '/api/v1/universal',
  ENTITIES: '/api/v1/universal?action=read&table=core_entities',
  TRANSACTIONS: '/api/v1/universal?action=read&table=universal_transactions',
  DYNAMIC_DATA: '/api/v1/universal?action=read&table=core_dynamic_data',
  RELATIONSHIPS: '/api/v1/universal?action=read&table=core_relationships',
} as const

// Entity types
export const ENTITY_TYPES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  PRODUCT: 'product',
  RECIPE: 'recipe',
  GL_ACCOUNT: 'gl_account',
  EMPLOYEE: 'employee',
} as const

// Transaction types
export const TRANSACTION_TYPES = {
  SALE: 'sale',
  PURCHASE: 'purchase',
  PAYMENT: 'payment',
  INVOICE: 'invoice',
  PURCHASE_INVOICE: 'purchase_invoice',
  PRODUCTION_BATCH: 'production_batch',
  POS_SALE: 'pos_sale',
  EXPENSE: 'expense',
  INVENTORY_ADJUSTMENT: 'inventory_adjustment',
} as const

// Smart codes for ice cream business
export const SMART_CODES = {
  // Entities
  CUSTOMER_RETAIL: 'HERA.CRM.CUSTOMER.ENT.RETAIL.v1',
  VENDOR_DAIRY: 'HERA.SCM.VENDOR.ENT.DAIRY.v1',
  PRODUCT_ICECREAM: 'HERA.INV.PRODUCT.ENT.ICECREAM.v1',
  RECIPE_VANILLA: 'HERA.MFG.RECIPE.ENT.VANILLA.v1',
  
  // Transactions
  SALE_POS: 'HERA.RETAIL.POS.TXN.SALE.v1',
  PURCHASE_INVOICE: 'HERA.FIN.AP.TXN.INVOICE.v1',
  PRODUCTION_BATCH: 'HERA.MFG.PROD.TXN.BATCH.v1',
  COLD_CHAIN_EXPENSE: 'HERA.FIN.EXP.TXN.COLDCHAIN.v1',
  TEMPERATURE_VARIANCE: 'HERA.INV.ADJ.TXN.TEMPERATURE.v1',
} as const

// Test data templates
export const TEST_DATA = {
  customer: {
    entity_type: ENTITY_TYPES.CUSTOMER,
    entity_name: 'Test Ice Cream Shop',
    metadata: {
      customer_type: 'wholesale',
      credit_limit: 50000,
      payment_terms: 'NET15',
    },
  },
  
  vendor: {
    entity_type: ENTITY_TYPES.VENDOR,
    entity_name: 'Test Dairy Supplier',
    metadata: {
      supplier_type: 'dairy',
      payment_terms: 'NET30',
      contact_email: 'test@dairy.com',
    },
  },
  
  product: {
    entity_type: ENTITY_TYPES.PRODUCT,
    entity_name: 'Test Vanilla Ice Cream 1L',
    metadata: {
      sku: 'ICE-VAN-1L',
      unit_price: 100,
      unit_cost: 60,
      temperature_required: -18,
      shelf_life_days: 180,
    },
  },
  
  recipe: {
    entity_type: ENTITY_TYPES.RECIPE,
    entity_name: 'Test Vanilla Recipe',
    metadata: {
      batch_size_liters: 200,
      ingredients: [
        { name: 'Milk', quantity: 120, unit: 'liters' },
        { name: 'Cream', quantity: 40, unit: 'liters' },
        { name: 'Sugar', quantity: 30, unit: 'kg' },
        { name: 'Vanilla', quantity: 2, unit: 'liters' },
      ],
      yield_percentage: 97.5,
    },
  },
}