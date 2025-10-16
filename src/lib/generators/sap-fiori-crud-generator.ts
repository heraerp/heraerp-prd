/**
 * SAP Fiori CRUD Page Generator
 * Standardized system for creating production-quality entity/transaction pages
 * with TypeScript safety and HERA compliance
 */

import { z } from 'zod'

// TypeScript-safe configuration schemas
export const DynamicFieldSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'number', 'date', 'boolean', 'email', 'phone', 'url', 'textarea']),
  label: z.string(),
  required: z.boolean().default(false),
  smart_code: z.string(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional()
  }).optional()
})

export const EntityConfigSchema = z.object({
  // Core entity configuration
  entityType: z.string(),
  entityName: z.string(),
  entityNamePlural: z.string(),
  
  // Smart codes
  entitySmartCode: z.string(),
  fieldSmartCodes: z.record(z.string()),
  
  // Dynamic fields
  dynamicFields: z.array(DynamicFieldSchema),
  
  // UI configuration
  ui: z.object({
    icon: z.string(),
    primaryColor: z.string().default('#0078d4'),
    accentColor: z.string().default('#005a9e'),
    showKPIs: z.boolean().default(true),
    showFilters: z.boolean().default(true),
    showBulkActions: z.boolean().default(true),
    mobileCardFields: z.array(z.string()).default([]),
    tableColumns: z.array(z.string()).default([])
  }),
  
  // Features
  features: z.object({
    create: z.boolean().default(true),
    read: z.boolean().default(true),
    update: z.boolean().default(true),
    delete: z.boolean().default(true),
    export: z.boolean().default(true),
    import: z.boolean().default(false),
    archive: z.boolean().default(true)
  }).default({}),
  
  // Business rules
  businessRules: z.object({
    duplicateDetection: z.boolean().default(true),
    requiresApproval: z.boolean().default(false),
    auditTrail: z.boolean().default(true),
    statusWorkflow: z.boolean().default(false)
  }).default({})
})

export const TransactionConfigSchema = z.object({
  // Core transaction configuration
  transactionType: z.string(),
  transactionName: z.string(),
  transactionNamePlural: z.string(),
  
  // Smart codes
  transactionSmartCode: z.string(),
  lineSmartCode: z.string(),
  fieldSmartCodes: z.record(z.string()),
  
  // Transaction structure
  hasLines: z.boolean().default(true),
  headerFields: z.array(DynamicFieldSchema),
  lineFields: z.array(DynamicFieldSchema),
  
  // Relationships
  relationships: z.object({
    source: z.object({
      entityType: z.string(),
      label: z.string(),
      required: z.boolean().default(true)
    }).optional(),
    target: z.object({
      entityType: z.string(),
      label: z.string(),
      required: z.boolean().default(false)
    }).optional()
  }).default({}),
  
  // UI configuration (extends entity UI)
  ui: EntityConfigSchema.shape.ui.extend({
    showTotals: z.boolean().default(true),
    showLineItems: z.boolean().default(true),
    lineItemLayout: z.enum(['table', 'cards', 'both']).default('both')
  }),
  
  // Transaction-specific features
  features: EntityConfigSchema.shape.features.extend({
    approve: z.boolean().default(false),
    reverse: z.boolean().default(false),
    copy: z.boolean().default(true),
    post: z.boolean().default(false)
  }),
  
  // Calculation rules
  calculations: z.object({
    autoCalculateTotals: z.boolean().default(true),
    taxCalculation: z.boolean().default(false),
    discountCalculation: z.boolean().default(false),
    currencyConversion: z.boolean().default(false)
  }).default({})
})

export type EntityConfig = z.infer<typeof EntityConfigSchema>
export type TransactionConfig = z.infer<typeof TransactionConfigSchema>
export type DynamicField = z.infer<typeof DynamicFieldSchema>

// Predefined entity configurations
export const PREDEFINED_ENTITIES: Record<string, EntityConfig> = {
  CONTACT: {
    entityType: 'CONTACT',
    entityName: 'Contact',
    entityNamePlural: 'Contacts',
    entitySmartCode: 'HERA.CRM.CONTACT.ENTITY.PERSON.V1',
    fieldSmartCodes: {
      email: 'HERA.CRM.CONTACT.DYN.EMAIL.V1',
      phone: 'HERA.CRM.CONTACT.DYN.PHONE.V1',
      title: 'HERA.CRM.CONTACT.DYN.TITLE.V1',
      account: 'HERA.CRM.CONTACT.DYN.ACCOUNT.V1',
      department: 'HERA.CRM.CONTACT.DYN.DEPARTMENT.V1',
      owner: 'HERA.CRM.CONTACT.DYN.OWNER.V1'
    },
    dynamicFields: [
      { name: 'email', type: 'email', label: 'Email', required: true, smart_code: 'HERA.CRM.CONTACT.DYN.EMAIL.V1' },
      { name: 'phone', type: 'phone', label: 'Phone', required: true, smart_code: 'HERA.CRM.CONTACT.DYN.PHONE.V1' },
      { name: 'title', type: 'text', label: 'Title', required: true, smart_code: 'HERA.CRM.CONTACT.DYN.TITLE.V1' },
      { name: 'account', type: 'text', label: 'Account', required: true, smart_code: 'HERA.CRM.CONTACT.DYN.ACCOUNT.V1' },
      { name: 'department', type: 'text', label: 'Department', required: false, smart_code: 'HERA.CRM.CONTACT.DYN.DEPARTMENT.V1' },
      { name: 'owner', type: 'text', label: 'Owner', required: false, smart_code: 'HERA.CRM.CONTACT.DYN.OWNER.V1' }
    ],
    ui: {
      icon: 'Users',
      primaryColor: '#0078d4',
      accentColor: '#005a9e',
      showKPIs: true,
      showFilters: true,
      showBulkActions: true,
      mobileCardFields: ['email', 'phone', 'title', 'account'],
      tableColumns: ['entity_name', 'email', 'phone', 'title', 'account', 'owner']
    },
    features: {},
    businessRules: {}
  },
  
  ACCOUNT: {
    entityType: 'ACCOUNT',
    entityName: 'Account',
    entityNamePlural: 'Accounts',
    entitySmartCode: 'HERA.CRM.ACCOUNT.ENTITY.COMPANY.V1',
    fieldSmartCodes: {
      industry: 'HERA.CRM.ACCOUNT.DYN.INDUSTRY.V1',
      website: 'HERA.CRM.ACCOUNT.DYN.WEBSITE.V1',
      employees: 'HERA.CRM.ACCOUNT.DYN.EMPLOYEES.V1',
      revenue: 'HERA.CRM.ACCOUNT.DYN.REVENUE.V1',
      owner: 'HERA.CRM.ACCOUNT.DYN.OWNER.V1'
    },
    dynamicFields: [
      { name: 'industry', type: 'text', label: 'Industry', required: true, smart_code: 'HERA.CRM.ACCOUNT.DYN.INDUSTRY.V1' },
      { name: 'website', type: 'url', label: 'Website', required: false, smart_code: 'HERA.CRM.ACCOUNT.DYN.WEBSITE.V1' },
      { name: 'employees', type: 'number', label: 'Employees', required: false, smart_code: 'HERA.CRM.ACCOUNT.DYN.EMPLOYEES.V1' },
      { name: 'revenue', type: 'number', label: 'Annual Revenue', required: false, smart_code: 'HERA.CRM.ACCOUNT.DYN.REVENUE.V1' },
      { name: 'owner', type: 'text', label: 'Account Owner', required: true, smart_code: 'HERA.CRM.ACCOUNT.DYN.OWNER.V1' }
    ],
    ui: {
      icon: 'Building2',
      primaryColor: '#107c10',
      accentColor: '#0b5a0b',
      showKPIs: true,
      showFilters: true,
      showBulkActions: true,
      mobileCardFields: ['industry', 'website', 'employees', 'owner'],
      tableColumns: ['entity_name', 'industry', 'website', 'employees', 'revenue', 'owner']
    },
    features: {},
    businessRules: {}
  },
  
  LEAD: {
    entityType: 'LEAD',
    entityName: 'Lead',
    entityNamePlural: 'Leads',
    entitySmartCode: 'HERA.CRM.LEAD.ENTITY.PROSPECT.V1',
    fieldSmartCodes: {
      email: 'HERA.CRM.LEAD.DYN.EMAIL.V1',
      phone: 'HERA.CRM.LEAD.DYN.PHONE.V1',
      company: 'HERA.CRM.LEAD.DYN.COMPANY.V1',
      source: 'HERA.CRM.LEAD.DYN.SOURCE.V1',
      score: 'HERA.CRM.LEAD.DYN.SCORE.V1',
      owner: 'HERA.CRM.LEAD.DYN.OWNER.V1'
    },
    dynamicFields: [
      { name: 'email', type: 'email', label: 'Email', required: true, smart_code: 'HERA.CRM.LEAD.DYN.EMAIL.V1' },
      { name: 'phone', type: 'phone', label: 'Phone', required: false, smart_code: 'HERA.CRM.LEAD.DYN.PHONE.V1' },
      { name: 'company', type: 'text', label: 'Company', required: true, smart_code: 'HERA.CRM.LEAD.DYN.COMPANY.V1' },
      { name: 'source', type: 'text', label: 'Lead Source', required: true, smart_code: 'HERA.CRM.LEAD.DYN.SOURCE.V1' },
      { name: 'score', type: 'number', label: 'Lead Score', required: false, smart_code: 'HERA.CRM.LEAD.DYN.SCORE.V1' },
      { name: 'owner', type: 'text', label: 'Owner', required: true, smart_code: 'HERA.CRM.LEAD.DYN.OWNER.V1' }
    ],
    ui: {
      icon: 'Target',
      primaryColor: '#d83b01',
      accentColor: '#a62d01',
      showKPIs: true,
      showFilters: true,
      showBulkActions: true,
      mobileCardFields: ['email', 'company', 'source', 'score'],
      tableColumns: ['entity_name', 'email', 'company', 'source', 'score', 'owner']
    },
    features: {},
    businessRules: { statusWorkflow: true }
  },
  
  PRODUCT: {
    entityType: 'PRODUCT',
    entityName: 'Product',
    entityNamePlural: 'Products',
    entitySmartCode: 'HERA.INV.PRODUCT.ENTITY.ITEM.V1',
    fieldSmartCodes: {
      sku: 'HERA.INV.PRODUCT.DYN.SKU.V1',
      price: 'HERA.INV.PRODUCT.DYN.PRICE.V1',
      cost: 'HERA.INV.PRODUCT.DYN.COST.V1',
      category: 'HERA.INV.PRODUCT.DYN.CATEGORY.V1',
      supplier: 'HERA.INV.PRODUCT.DYN.SUPPLIER.V1',
      stock: 'HERA.INV.PRODUCT.DYN.STOCK.V1'
    },
    dynamicFields: [
      { name: 'sku', type: 'text', label: 'SKU', required: true, smart_code: 'HERA.INV.PRODUCT.DYN.SKU.V1' },
      { name: 'price', type: 'number', label: 'Price', required: true, smart_code: 'HERA.INV.PRODUCT.DYN.PRICE.V1' },
      { name: 'cost', type: 'number', label: 'Cost', required: false, smart_code: 'HERA.INV.PRODUCT.DYN.COST.V1' },
      { name: 'category', type: 'text', label: 'Category', required: true, smart_code: 'HERA.INV.PRODUCT.DYN.CATEGORY.V1' },
      { name: 'supplier', type: 'text', label: 'Supplier', required: false, smart_code: 'HERA.INV.PRODUCT.DYN.SUPPLIER.V1' },
      { name: 'stock', type: 'number', label: 'Stock Quantity', required: false, smart_code: 'HERA.INV.PRODUCT.DYN.STOCK.V1' }
    ],
    ui: {
      icon: 'Package',
      primaryColor: '#6264a7',
      accentColor: '#464775',
      showKPIs: true,
      showFilters: true,
      showBulkActions: true,
      mobileCardFields: ['sku', 'price', 'category', 'stock'],
      tableColumns: ['entity_name', 'sku', 'price', 'category', 'supplier', 'stock']
    },
    features: {},
    businessRules: { duplicateDetection: true }
  }
}

// Predefined transaction configurations
export const PREDEFINED_TRANSACTIONS: Record<string, TransactionConfig> = {
  SALE: {
    transactionType: 'SALE',
    transactionName: 'Sale',
    transactionNamePlural: 'Sales',
    transactionSmartCode: 'HERA.POS.SALE.TRANSACTION.ORDER.V1',
    lineSmartCode: 'HERA.POS.SALE.LINE.ITEM.V1',
    fieldSmartCodes: {
      customer: 'HERA.POS.SALE.DYN.CUSTOMER.V1',
      total: 'HERA.POS.SALE.DYN.TOTAL.V1',
      tax: 'HERA.POS.SALE.DYN.TAX.V1',
      discount: 'HERA.POS.SALE.DYN.DISCOUNT.V1'
    },
    hasLines: true,
    headerFields: [
      { name: 'customer', type: 'text', label: 'Customer', required: true, smart_code: 'HERA.POS.SALE.DYN.CUSTOMER.V1' },
      { name: 'total', type: 'number', label: 'Total Amount', required: true, smart_code: 'HERA.POS.SALE.DYN.TOTAL.V1' },
      { name: 'tax', type: 'number', label: 'Tax Amount', required: false, smart_code: 'HERA.POS.SALE.DYN.TAX.V1' },
      { name: 'discount', type: 'number', label: 'Discount', required: false, smart_code: 'HERA.POS.SALE.DYN.DISCOUNT.V1' }
    ],
    lineFields: [
      { name: 'product', type: 'text', label: 'Product', required: true, smart_code: 'HERA.POS.SALE.LINE.DYN.PRODUCT.V1' },
      { name: 'quantity', type: 'number', label: 'Quantity', required: true, smart_code: 'HERA.POS.SALE.LINE.DYN.QUANTITY.V1' },
      { name: 'price', type: 'number', label: 'Unit Price', required: true, smart_code: 'HERA.POS.SALE.LINE.DYN.PRICE.V1' },
      { name: 'total', type: 'number', label: 'Line Total', required: true, smart_code: 'HERA.POS.SALE.LINE.DYN.TOTAL.V1' }
    ],
    relationships: {
      source: { entityType: 'CUSTOMER', label: 'Customer', required: true },
      target: { entityType: 'STORE', label: 'Store', required: false }
    },
    ui: {
      icon: 'ShoppingCart',
      primaryColor: '#0078d4',
      accentColor: '#005a9e',
      showKPIs: true,
      showFilters: true,
      showBulkActions: true,
      showTotals: true,
      showLineItems: true,
      lineItemLayout: 'both',
      mobileCardFields: ['customer', 'total', 'tax'],
      tableColumns: ['transaction_number', 'customer', 'total', 'tax', 'created_at']
    },
    features: { post: true, copy: true },
    calculations: { autoCalculateTotals: true, taxCalculation: true }
  }
}

// Generator utility functions
export function generateSmartCode(
  industry: string,
  module: string,
  type: string,
  subtype: string,
  variant?: string
): string {
  const parts = ['HERA', industry.toUpperCase(), module.toUpperCase(), type.toUpperCase(), subtype.toUpperCase()]
  if (variant) parts.push(variant.toUpperCase())
  parts.push('V1')
  return parts.join('.')
}

export function validateEntityConfig(config: any): EntityConfig {
  return EntityConfigSchema.parse(config)
}

export function validateTransactionConfig(config: any): TransactionConfig {
  return TransactionConfigSchema.parse(config)
}

// Template path generator
export function getEntityPagePath(entityType: string): string {
  return `/Users/san/Documents/PRD/heraerp-prd/src/app/${entityType.toLowerCase()}s/page.tsx`
}

export function getTransactionPagePath(transactionType: string): string {
  return `/Users/san/Documents/PRD/heraerp-prd/src/app/${transactionType.toLowerCase()}s/page.tsx`
}