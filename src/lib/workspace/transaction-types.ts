/**
 * Workspace Transaction Type Registry
 * Smart Code: HERA.WORKSPACE.TRANSACTION_REGISTRY.v1
 * 
 * Dynamic transaction type system that automatically configures transaction types,
 * fields, and validation rules based on workspace domain/section context.
 * 
 * Features:
 * - Domain-specific transaction types (Sales, Purchase, Inventory, Finance)
 * - Auto-configured line item fields and validation
 * - Workspace-aware smart codes and templates
 * - Dynamic field mappings and business rules
 * - Context-sensitive quick actions and workflows
 */

export interface WorkspaceContext {
  domain: string
  section: string
  workspace?: string
  organization_id: string
}

export interface TransactionTypeConfig {
  id: string
  name: string
  description: string
  smart_code: string
  icon: string
  color: string
  category: 'sales' | 'purchase' | 'inventory' | 'finance' | 'operations'
  
  // Field configuration
  header_fields: TransactionField[]
  line_item_fields: TransactionField[]
  
  // Business rules
  validation_rules: ValidationRule[]
  calculation_rules: CalculationRule[]
  workflow_templates: string[]
  
  // UI configuration
  quick_actions: QuickAction[]
  default_status: string
  allowed_statuses: string[]
  
  // Integration settings
  requires_approval?: boolean
  auto_post?: boolean
  generates_receipt?: boolean
  requires_signature?: boolean
}

export interface TransactionField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'entity_ref' | 'boolean' | 'currency'
  required: boolean
  placeholder?: string
  options?: string[]
  validation?: string // regex or validation rule
  smart_code?: string
  depends_on?: string // field dependency
  calculation?: string // calculation formula
}

export interface ValidationRule {
  field: string
  rule: 'required' | 'min' | 'max' | 'regex' | 'custom'
  value?: any
  message: string
  condition?: string // when this rule applies
}

export interface CalculationRule {
  target_field: string
  formula: string
  depends_on: string[]
  trigger: 'change' | 'blur' | 'save'
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  action: 'create' | 'duplicate' | 'template' | 'import' | 'export'
  template_data?: Record<string, any>
  requires_permission?: string
}

// ===============================================================================
// DOMAIN-SPECIFIC TRANSACTION TYPE CONFIGURATIONS
// ===============================================================================

// SALES DOMAIN TRANSACTION TYPES
const SALES_TRANSACTION_TYPES: TransactionTypeConfig[] = [
  {
    id: 'SALE',
    name: 'Sales Transaction',
    description: 'Record customer sales and revenue',
    smart_code: 'HERA.SALES.TXN.SALE.v1',
    icon: 'DollarSign',
    color: 'text-green-600 bg-green-50',
    category: 'sales',
    
    header_fields: [
      {
        name: 'customer_id',
        label: 'Customer',
        type: 'entity_ref',
        required: true,
        smart_code: 'HERA.SALES.FIELD.CUSTOMER.v1'
      },
      {
        name: 'sale_date',
        label: 'Sale Date',
        type: 'date',
        required: true,
        smart_code: 'HERA.SALES.FIELD.DATE.v1'
      },
      {
        name: 'payment_method',
        label: 'Payment Method',
        type: 'select',
        required: true,
        options: ['Cash', 'Card', 'Bank Transfer', 'Credit'],
        smart_code: 'HERA.SALES.FIELD.PAYMENT_METHOD.v1'
      },
      {
        name: 'sales_rep_id',
        label: 'Sales Representative',
        type: 'entity_ref',
        required: false,
        smart_code: 'HERA.SALES.FIELD.SALES_REP.v1'
      }
    ],
    
    line_item_fields: [
      {
        name: 'product_id',
        label: 'Product/Service',
        type: 'entity_ref',
        required: true,
        smart_code: 'HERA.SALES.LINE.PRODUCT.v1'
      },
      {
        name: 'quantity',
        label: 'Quantity',
        type: 'number',
        required: true,
        smart_code: 'HERA.SALES.LINE.QUANTITY.v1'
      },
      {
        name: 'unit_price',
        label: 'Unit Price',
        type: 'currency',
        required: true,
        smart_code: 'HERA.SALES.LINE.UNIT_PRICE.v1'
      },
      {
        name: 'discount_percent',
        label: 'Discount %',
        type: 'number',
        required: false,
        smart_code: 'HERA.SALES.LINE.DISCOUNT.v1'
      }
    ],
    
    validation_rules: [
      {
        field: 'total_amount',
        rule: 'min',
        value: 0,
        message: 'Sale amount must be positive'
      }
    ],
    
    calculation_rules: [
      {
        target_field: 'line_amount',
        formula: 'quantity * unit_price * (1 - discount_percent / 100)',
        depends_on: ['quantity', 'unit_price', 'discount_percent'],
        trigger: 'change'
      }
    ],
    
    workflow_templates: ['simple_approval', 'pos_checkout'],
    
    quick_actions: [
      {
        id: 'new_sale',
        label: 'New Sale',
        icon: 'Plus',
        action: 'create'
      },
      {
        id: 'duplicate_last',
        label: 'Repeat Last Sale',
        icon: 'Copy',
        action: 'duplicate'
      },
      {
        id: 'quote_template',
        label: 'From Quote',
        icon: 'FileText',
        action: 'template'
      }
    ],
    
    default_status: 'draft',
    allowed_statuses: ['draft', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled'],
    
    requires_approval: false,
    auto_post: true,
    generates_receipt: true
  },
  
  {
    id: 'QUOTE',
    name: 'Sales Quote',
    description: 'Create customer quotes and estimates',
    smart_code: 'HERA.SALES.TXN.QUOTE.v1',
    icon: 'FileText',
    color: 'text-blue-600 bg-blue-50',
    category: 'sales',
    
    header_fields: [
      {
        name: 'customer_id',
        label: 'Customer',
        type: 'entity_ref',
        required: true
      },
      {
        name: 'quote_date',
        label: 'Quote Date',
        type: 'date',
        required: true
      },
      {
        name: 'valid_until',
        label: 'Valid Until',
        type: 'date',
        required: true
      },
      {
        name: 'terms_conditions',
        label: 'Terms & Conditions',
        type: 'text',
        required: false
      }
    ],
    
    line_item_fields: [
      {
        name: 'product_id',
        label: 'Product/Service',
        type: 'entity_ref',
        required: true
      },
      {
        name: 'quantity',
        label: 'Quantity',
        type: 'number',
        required: true
      },
      {
        name: 'unit_price',
        label: 'Unit Price',
        type: 'currency',
        required: true
      },
      {
        name: 'discount_percent',
        label: 'Discount %',
        type: 'number',
        required: false
      }
    ],
    
    validation_rules: [
      {
        field: 'valid_until',
        rule: 'custom',
        message: 'Valid until date must be in the future',
        condition: 'valid_until > quote_date'
      }
    ],
    
    calculation_rules: [
      {
        target_field: 'line_amount',
        formula: 'quantity * unit_price * (1 - discount_percent / 100)',
        depends_on: ['quantity', 'unit_price', 'discount_percent'],
        trigger: 'change'
      }
    ],
    
    workflow_templates: ['quote_approval', 'quote_to_sale'],
    
    quick_actions: [
      {
        id: 'new_quote',
        label: 'New Quote',
        icon: 'Plus',
        action: 'create'
      },
      {
        id: 'convert_to_sale',
        label: 'Convert to Sale',
        icon: 'ArrowRight',
        action: 'template',
        template_data: { transaction_type: 'SALE' }
      }
    ],
    
    default_status: 'draft',
    allowed_statuses: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
    
    requires_approval: true,
    auto_post: false,
    generates_receipt: false
  }
]

// PURCHASE DOMAIN TRANSACTION TYPES
const PURCHASE_TRANSACTION_TYPES: TransactionTypeConfig[] = [
  {
    id: 'PURCHASE_ORDER',
    name: 'Purchase Order',
    description: 'Create purchase orders for vendors',
    smart_code: 'HERA.PURCHASE.TXN.PO.v1',
    icon: 'ShoppingCart',
    color: 'text-purple-600 bg-purple-50',
    category: 'purchase',
    
    header_fields: [
      {
        name: 'vendor_id',
        label: 'Vendor',
        type: 'entity_ref',
        required: true
      },
      {
        name: 'order_date',
        label: 'Order Date',
        type: 'date',
        required: true
      },
      {
        name: 'expected_delivery',
        label: 'Expected Delivery',
        type: 'date',
        required: false
      },
      {
        name: 'delivery_address',
        label: 'Delivery Address',
        type: 'text',
        required: true
      }
    ],
    
    line_item_fields: [
      {
        name: 'product_id',
        label: 'Product',
        type: 'entity_ref',
        required: true
      },
      {
        name: 'quantity',
        label: 'Quantity',
        type: 'number',
        required: true
      },
      {
        name: 'unit_cost',
        label: 'Unit Cost',
        type: 'currency',
        required: true
      }
    ],
    
    validation_rules: [],
    calculation_rules: [
      {
        target_field: 'line_amount',
        formula: 'quantity * unit_cost',
        depends_on: ['quantity', 'unit_cost'],
        trigger: 'change'
      }
    ],
    
    workflow_templates: ['po_approval', 'three_way_match'],
    
    quick_actions: [
      {
        id: 'new_po',
        label: 'New PO',
        icon: 'Plus',
        action: 'create'
      },
      {
        id: 'reorder',
        label: 'Reorder',
        icon: 'RefreshCw',
        action: 'duplicate'
      }
    ],
    
    default_status: 'draft',
    allowed_statuses: ['draft', 'approved', 'sent', 'acknowledged', 'delivered', 'completed'],
    
    requires_approval: true,
    auto_post: false
  }
]

// INVENTORY DOMAIN TRANSACTION TYPES
const INVENTORY_TRANSACTION_TYPES: TransactionTypeConfig[] = [
  {
    id: 'STOCK_ADJUSTMENT',
    name: 'Stock Adjustment',
    description: 'Adjust inventory stock levels',
    smart_code: 'HERA.INVENTORY.TXN.ADJUSTMENT.v1',
    icon: 'Package',
    color: 'text-amber-600 bg-amber-50',
    category: 'inventory',
    
    header_fields: [
      {
        name: 'adjustment_date',
        label: 'Adjustment Date',
        type: 'date',
        required: true
      },
      {
        name: 'reason',
        label: 'Reason',
        type: 'select',
        required: true,
        options: ['Count Variance', 'Damage', 'Theft', 'Expiry', 'Other']
      },
      {
        name: 'location_id',
        label: 'Location',
        type: 'entity_ref',
        required: true
      }
    ],
    
    line_item_fields: [
      {
        name: 'product_id',
        label: 'Product',
        type: 'entity_ref',
        required: true
      },
      {
        name: 'current_quantity',
        label: 'Current Qty',
        type: 'number',
        required: true
      },
      {
        name: 'adjusted_quantity',
        label: 'Adjusted Qty',
        type: 'number',
        required: true
      },
      {
        name: 'variance_reason',
        label: 'Variance Reason',
        type: 'text',
        required: false
      }
    ],
    
    validation_rules: [],
    calculation_rules: [
      {
        target_field: 'variance',
        formula: 'adjusted_quantity - current_quantity',
        depends_on: ['adjusted_quantity', 'current_quantity'],
        trigger: 'change'
      }
    ],
    
    workflow_templates: ['adjustment_approval'],
    
    quick_actions: [
      {
        id: 'cycle_count',
        label: 'Cycle Count',
        icon: 'CheckSquare',
        action: 'template'
      }
    ],
    
    default_status: 'draft',
    allowed_statuses: ['draft', 'approved', 'posted'],
    
    requires_approval: true
  }
]

// FINANCE DOMAIN TRANSACTION TYPES
const FINANCE_TRANSACTION_TYPES: TransactionTypeConfig[] = [
  {
    id: 'JOURNAL_ENTRY',
    name: 'Journal Entry',
    description: 'Manual accounting journal entries',
    smart_code: 'HERA.FINANCE.TXN.JOURNAL.v1',
    icon: 'BookOpen',
    color: 'text-indigo-600 bg-indigo-50',
    category: 'finance',
    
    header_fields: [
      {
        name: 'entry_date',
        label: 'Entry Date',
        type: 'date',
        required: true
      },
      {
        name: 'reference',
        label: 'Reference',
        type: 'text',
        required: true
      },
      {
        name: 'description',
        label: 'Description',
        type: 'text',
        required: true
      }
    ],
    
    line_item_fields: [
      {
        name: 'account_id',
        label: 'Account',
        type: 'entity_ref',
        required: true
      },
      {
        name: 'debit_amount',
        label: 'Debit',
        type: 'currency',
        required: false
      },
      {
        name: 'credit_amount',
        label: 'Credit',
        type: 'currency',
        required: false
      },
      {
        name: 'description',
        label: 'Line Description',
        type: 'text',
        required: false
      }
    ],
    
    validation_rules: [
      {
        field: 'balance',
        rule: 'custom',
        message: 'Journal entry must be balanced (debits = credits)',
        condition: 'sum(debit_amount) = sum(credit_amount)'
      }
    ],
    
    calculation_rules: [],
    
    workflow_templates: ['journal_approval'],
    
    quick_actions: [
      {
        id: 'accrual',
        label: 'Accrual Entry',
        icon: 'Calendar',
        action: 'template'
      },
      {
        id: 'adjustment',
        label: 'Adjustment Entry',
        icon: 'Edit',
        action: 'template'
      }
    ],
    
    default_status: 'draft',
    allowed_statuses: ['draft', 'approved', 'posted'],
    
    requires_approval: true,
    auto_post: false
  }
]

// ===============================================================================
// TRANSACTION TYPE REGISTRY
// ===============================================================================

export class WorkspaceTransactionTypeRegistry {
  private static instance: WorkspaceTransactionTypeRegistry
  private transactionTypes: Map<string, TransactionTypeConfig[]> = new Map()
  
  constructor() {
    this.initializeTransactionTypes()
  }
  
  static getInstance(): WorkspaceTransactionTypeRegistry {
    if (!WorkspaceTransactionTypeRegistry.instance) {
      WorkspaceTransactionTypeRegistry.instance = new WorkspaceTransactionTypeRegistry()
    }
    return WorkspaceTransactionTypeRegistry.instance
  }
  
  private initializeTransactionTypes() {
    // Register domain-specific transaction types
    this.transactionTypes.set('sales', SALES_TRANSACTION_TYPES)
    this.transactionTypes.set('purchase', PURCHASE_TRANSACTION_TYPES)
    this.transactionTypes.set('inventory', INVENTORY_TRANSACTION_TYPES)
    this.transactionTypes.set('finance', FINANCE_TRANSACTION_TYPES)
    
    // Analytics and reporting typically use existing transaction types
    this.transactionTypes.set('analytics', [
      ...SALES_TRANSACTION_TYPES,
      ...PURCHASE_TRANSACTION_TYPES,
      ...FINANCE_TRANSACTION_TYPES
    ])
  }
  
  getTransactionTypesForWorkspace(context: WorkspaceContext): TransactionTypeConfig[] {
    const { domain, section } = context
    
    // Primary lookup by domain
    let types = this.transactionTypes.get(domain) || []
    
    // Section-specific overrides or filters
    if (section === 'pos' && domain === 'sales') {
      // POS only needs sales transactions
      types = types.filter(t => t.id === 'SALE')
    }
    
    if (section === 'fin' || section === 'finance') {
      // Finance section shows all financial transaction types
      types = this.transactionTypes.get('finance') || []
    }
    
    return types
  }
  
  getTransactionTypeConfig(transactionTypeId: string, context: WorkspaceContext): TransactionTypeConfig | null {
    const types = this.getTransactionTypesForWorkspace(context)
    return types.find(t => t.id === transactionTypeId) || null
  }
  
  getQuickActionsForWorkspace(context: WorkspaceContext): QuickAction[] {
    const types = this.getTransactionTypesForWorkspace(context)
    const actions: QuickAction[] = []
    
    types.forEach(type => {
      actions.push(...type.quick_actions.map(action => ({
        ...action,
        transaction_type: type.id
      })))
    })
    
    return actions
  }
  
  validateTransactionData(data: any, typeConfig: TransactionTypeConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Validate required fields
    typeConfig.header_fields.forEach(field => {
      if (field.required && !data[field.name]) {
        errors.push(`${field.label} is required`)
      }
    })
    
    // Validate business rules
    typeConfig.validation_rules.forEach(rule => {
      // Implementation would depend on specific rule type
      // This is a simplified version
      if (rule.rule === 'min' && data[rule.field] < rule.value) {
        errors.push(rule.message)
      }
    })
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export const transactionTypeRegistry = WorkspaceTransactionTypeRegistry.getInstance()

// Utility functions
export function getWorkspaceContextFromUrl(domain: string, section: string, organizationId: string): WorkspaceContext {
  return {
    domain,
    section,
    organization_id: organizationId
  }
}

export function generateSmartCodeForContext(baseCode: string, context: WorkspaceContext): string {
  return `HERA.${context.domain.toUpperCase()}.${context.section.toUpperCase()}.${baseCode}.v1`
}