/**
 * Universal Configuration Types
 * Client-safe configuration definitions
 */

// Configuration Type Definition
export interface ConfigType {
  entityType: string
  smartCodePrefix: string
  displayName: string
  pluralName: string
  relatedEntityType?: string
  relatedFieldName?: string
  defaultFields?: string[]
  customAnalytics?: (items: any[], relatedItems?: any[]) => any
}

// Common Configuration Types
export const CONFIG_TYPES = {
  SERVICE_CATEGORY: {
    entityType: 'salon_service_category',
    smartCodePrefix: 'HERA.SALON.CATEGORY',
    displayName: 'Service Category',
    pluralName: 'Service Categories',
    relatedEntityType: 'salon_service',
    relatedFieldName: 'category',
    defaultFields: ['color', 'icon', 'description', 'is_active', 'sort_order']
  },
  PRODUCT_CATEGORY: {
    entityType: 'product_category',
    smartCodePrefix: 'HERA.INV.CATEGORY',
    displayName: 'Product Category',
    pluralName: 'Product Categories',
    relatedEntityType: 'product',
    relatedFieldName: 'category',
    defaultFields: ['color', 'icon', 'description', 'is_active', 'sort_order', 'parent_category']
  },
  CUSTOMER_TYPE: {
    entityType: 'customer_type',
    smartCodePrefix: 'HERA.CRM.CUSTTYPE',
    displayName: 'Customer Type',
    pluralName: 'Customer Types',
    relatedEntityType: 'customer',
    relatedFieldName: 'customer_type',
    defaultFields: ['description', 'discount_percentage', 'credit_limit', 'payment_terms']
  },
  PAYMENT_METHOD: {
    entityType: 'payment_method',
    smartCodePrefix: 'HERA.FIN.PAYMETHOD',
    displayName: 'Payment Method',
    pluralName: 'Payment Methods',
    defaultFields: ['is_active', 'processing_fee', 'account_id', 'requires_reference']
  },
  TAX_TYPE: {
    entityType: 'tax_type',
    smartCodePrefix: 'HERA.FIN.TAX',
    displayName: 'Tax Type',
    pluralName: 'Tax Types',
    defaultFields: ['tax_rate', 'is_active', 'gl_account_id', 'applicable_to']
  },
  LOCATION: {
    entityType: 'business_location',
    smartCodePrefix: 'HERA.ORG.LOCATION',
    displayName: 'Location',
    pluralName: 'Locations',
    defaultFields: ['address', 'phone', 'email', 'manager_id', 'is_active', 'timezone']
  },
  DEPARTMENT: {
    entityType: 'department',
    smartCodePrefix: 'HERA.ORG.DEPT',
    displayName: 'Department',
    pluralName: 'Departments',
    relatedEntityType: 'employee',
    relatedFieldName: 'department',
    defaultFields: ['manager_id', 'cost_center', 'is_active', 'parent_department']
  },
  EXPENSE_CATEGORY: {
    entityType: 'expense_category',
    smartCodePrefix: 'HERA.FIN.EXPENSE',
    displayName: 'Expense Category',
    pluralName: 'Expense Categories',
    defaultFields: ['gl_account_id', 'is_active', 'requires_approval', 'approval_limit']
  },
  // Salon-specific configurations
  STAFF_ROLE: {
    entityType: 'staff_role',
    smartCodePrefix: 'HERA.SALON.ROLE',
    displayName: 'Staff Role',
    pluralName: 'Staff Roles',
    relatedEntityType: 'staff',
    relatedFieldName: 'role',
    defaultFields: ['description', 'permissions', 'commission_rate', 'is_active', 'hierarchy_level']
  },
  STAFF_SKILL: {
    entityType: 'staff_skill',
    smartCodePrefix: 'HERA.SALON.SKILL',
    displayName: 'Staff Skill',
    pluralName: 'Staff Skills',
    defaultFields: ['description', 'certification_required', 'service_category', 'proficiency_levels']
  },
  PRODUCT_TYPE: {
    entityType: 'salon_product_type',
    smartCodePrefix: 'HERA.SALON.PRODTYPE',
    displayName: 'Product Type',
    pluralName: 'Product Types',
    defaultFields: ['description', 'for_retail', 'for_professional', 'unit_of_measure']
  },
  SUPPLIER: {
    entityType: 'supplier',
    smartCodePrefix: 'HERA.SALON.SUPPLIER',
    displayName: 'Supplier',
    pluralName: 'Suppliers',
    defaultFields: ['contact_name', 'phone', 'email', 'address', 'payment_terms', 'is_active']
  },
  STOCK_LOCATION: {
    entityType: 'stock_location',
    smartCodePrefix: 'HERA.SALON.STOCKLOC',
    displayName: 'Stock Location',
    pluralName: 'Stock Locations',
    defaultFields: ['description', 'location_type', 'manager_id', 'is_active']
  },
  COMMISSION_RULE: {
    entityType: 'commission_rule',
    smartCodePrefix: 'HERA.SALON.COMMISSION',
    displayName: 'Commission Rule',
    pluralName: 'Commission Rules',
    defaultFields: ['rule_type', 'base_rate', 'tier_rates', 'applies_to', 'is_active']
  },
  BOOKING_RULE: {
    entityType: 'booking_rule',
    smartCodePrefix: 'HERA.SALON.BOOKING',
    displayName: 'Booking Rule',
    pluralName: 'Booking Rules',
    defaultFields: ['rule_type', 'advance_days', 'cancellation_hours', 'deposit_required', 'is_active']
  },
  LOYALTY_TIER: {
    entityType: 'loyalty_tier',
    smartCodePrefix: 'HERA.SALON.LOYALTY',
    displayName: 'Loyalty Tier',
    pluralName: 'Loyalty Tiers',
    defaultFields: ['points_required', 'benefits', 'discount_percentage', 'tier_color', 'is_active']
  },
  PACKAGE_TYPE: {
    entityType: 'package_type',
    smartCodePrefix: 'HERA.SALON.PACKAGE',
    displayName: 'Package Type',
    pluralName: 'Package Types',
    defaultFields: ['description', 'validity_days', 'services_included', 'discount_percentage', 'is_active']
  }
} as const