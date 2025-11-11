/**
 * HERA Enhanced Dynamic Entity Builder - Practical Example
 * Smart Code: HERA.EXAMPLE.MICRO_APPS.ENHANCED.DYNAMIC.ENTITY.v1
 * 
 * Demonstrates how to use the Enhanced Dynamic Entity Builder for:
 * ✅ Declarative entity and transaction definitions
 * ✅ Auto-generated Smart Codes and field mappings
 * ✅ Type-safe validation and UI configuration
 * ✅ Runtime execution with HERA integration
 */

import {
  createEnhancedDynamicEntityBuilder,
  type EnhancedMicroAppEntityDefinition,
  type EnhancedMicroAppTransactionDefinition,
  type DynamicFieldDefinition,
  type EntityUIConfig,
  type FinanceIntegrationConfig
} from '@/lib/micro-apps/enhanced-dynamic-entity-builder'

// ==================== EXAMPLE 1: CUSTOMER ENTITY ====================

/**
 * Define a Customer entity with enhanced dynamic fields
 */
const customerEntityDefinition: EnhancedMicroAppEntityDefinition = {
  entity_type: 'CUSTOMER',
  display_name: 'Customer',
  display_name_plural: 'Customers',
  smart_code_base: 'HERA.CRM.CUSTOMER',
  
  dynamic_fields: [
    {
      field_name: 'email',
      display_label: 'Email Address',
      field_type: 'email',
      is_required: true,
      is_searchable: true,
      is_sortable: true,
      field_order: 1,
      validation: {
        regex_pattern: '^[^@]+@[^@]+\.[^@]+$'
      },
      ui_hints: {
        input_type: 'email',
        placeholder: 'customer@example.com',
        help_text: 'Primary email for communications',
        width: 'large'
      },
      smart_code_suffix: 'CONTACT'
    },
    {
      field_name: 'phone',
      display_label: 'Phone Number',
      field_type: 'phone',
      is_required: false,
      is_searchable: true,
      field_order: 2,
      validation: {
        regex_pattern: '^\\+?[1-9]\\d{1,14}$'
      },
      ui_hints: {
        input_type: 'tel',
        placeholder: '+1-555-123-4567',
        help_text: 'International format preferred'
      }
    },
    {
      field_name: 'credit_limit',
      display_label: 'Credit Limit',
      field_type: 'number',
      is_required: false,
      is_sortable: true,
      field_order: 3,
      default_value: 0,
      validation: {
        min_value: 0,
        max_value: 1000000
      },
      ui_hints: {
        input_type: 'number',
        help_text: 'Maximum credit amount in USD',
        width: 'medium'
      }
    },
    {
      field_name: 'customer_type',
      display_label: 'Customer Type',
      field_type: 'select',
      is_required: true,
      is_searchable: true,
      field_order: 4,
      validation: {
        allowed_values: ['individual', 'corporate', 'government', 'non_profit']
      },
      ui_hints: {
        input_type: 'select',
        help_text: 'Classification for pricing and terms'
      }
    },
    {
      field_name: 'is_active',
      display_label: 'Active Status',
      field_type: 'boolean',
      is_required: true,
      field_order: 5,
      default_value: true,
      ui_hints: {
        input_type: 'checkbox',
        help_text: 'Customer can place new orders when active'
      }
    },
    {
      field_name: 'registration_date',
      display_label: 'Registration Date',
      field_type: 'date',
      is_required: true,
      is_sortable: true,
      field_order: 6,
      default_value: 'today',
      ui_hints: {
        input_type: 'date',
        help_text: 'Date customer first registered'
      }
    },
    {
      field_name: 'notes',
      display_label: 'Customer Notes',
      field_type: 'text',
      is_required: false,
      field_order: 10,
      validation: {
        max_length: 1000
      },
      ui_hints: {
        input_type: 'textarea',
        placeholder: 'Internal notes about this customer...',
        help_text: 'Private notes for internal use only',
        width: 'full'
      }
    }
  ],
  
  relationships: [
    {
      relationship_type: 'ASSIGNED_TO',
      to_entity_type: 'USER',
      display_name: 'Account Manager',
      is_required: false,
      cardinality: 'one_to_one'
    },
    {
      relationship_type: 'BELONGS_TO',
      to_entity_type: 'CUSTOMER_SEGMENT',
      display_name: 'Customer Segment',
      is_required: false,
      cardinality: 'one_to_one'
    }
  ],
  
  validation_rules: [
    {
      rule_id: 'unique_email',
      rule_type: 'unique',
      field_names: ['email'],
      validation_config: {
        scope: 'organization'
      },
      error_message: 'Email address must be unique within organization'
    },
    {
      rule_id: 'phone_or_email',
      rule_type: 'cross_field',
      field_names: ['email', 'phone'],
      validation_config: {
        rule: 'at_least_one_required'
      },
      error_message: 'Either email or phone number must be provided'
    }
  ],
  
  ui_config: {
    layout: 'tabs',
    groups: [
      {
        group_id: 'contact_info',
        title: 'Contact Information',
        description: 'Primary contact details',
        fields: ['email', 'phone'],
        default_expanded: true
      },
      {
        group_id: 'business_info',
        title: 'Business Information',
        description: 'Credit and classification details',
        fields: ['customer_type', 'credit_limit', 'registration_date'],
        default_expanded: true
      },
      {
        group_id: 'additional',
        title: 'Additional Information',
        description: 'Status and notes',
        fields: ['is_active', 'notes'],
        collapsible: true,
        default_expanded: false
      }
    ],
    list_view: {
      default_columns: ['entity_name', 'email', 'customer_type', 'credit_limit', 'is_active'],
      sortable_columns: ['entity_name', 'email', 'credit_limit', 'registration_date'],
      filterable_columns: ['customer_type', 'is_active'],
      searchable_columns: ['entity_name', 'email', 'phone'],
      row_actions: [
        {
          action_id: 'edit',
          label: 'Edit',
          icon: 'Edit',
          condition: 'always'
        },
        {
          action_id: 'deactivate',
          label: 'Deactivate',
          icon: 'UserX',
          condition: 'is_active === true',
          confirmation_required: true
        },
        {
          action_id: 'view_orders',
          label: 'View Orders',
          icon: 'ShoppingBag',
          condition: 'always'
        }
      ]
    },
    search_config: {
      quick_search_fields: ['entity_name', 'email'],
      advanced_search_fields: ['entity_name', 'email', 'phone', 'customer_type', 'credit_limit'],
      search_operators: [
        { field_type: 'text', operators: ['contains', 'equals', 'starts_with'] },
        { field_type: 'number', operators: ['equals', 'greater_than', 'less_than', 'between'] },
        { field_type: 'select', operators: ['equals', 'in'] }
      ]
    }
  }
}

// ==================== EXAMPLE 2: SALES ORDER TRANSACTION ====================

/**
 * Define a Sales Order transaction with finance integration
 */
const salesOrderTransactionDefinition: EnhancedMicroAppTransactionDefinition = {
  transaction_type: 'SALES_ORDER',
  display_name: 'Sales Order',
  display_name_plural: 'Sales Orders',
  smart_code_base: 'HERA.SALES.ORDER',
  
  header_fields: [
    {
      field_name: 'order_number',
      display_label: 'Order Number',
      field_type: 'text',
      is_required: true,
      is_searchable: true,
      is_sortable: true,
      field_order: 1,
      ui_hints: {
        input_type: 'text',
        placeholder: 'AUTO-GENERATED',
        help_text: 'Unique order identifier'
      }
    },
    {
      field_name: 'customer_po',
      display_label: 'Customer PO Number',
      field_type: 'text',
      is_required: false,
      is_searchable: true,
      field_order: 2,
      validation: {
        max_length: 50
      },
      ui_hints: {
        input_type: 'text',
        placeholder: 'Customer purchase order number',
        help_text: 'Reference from customer system'
      }
    },
    {
      field_name: 'order_date',
      display_label: 'Order Date',
      field_type: 'date',
      is_required: true,
      is_sortable: true,
      field_order: 3,
      default_value: 'today',
      ui_hints: {
        input_type: 'date',
        help_text: 'Date order was placed'
      }
    },
    {
      field_name: 'requested_delivery_date',
      display_label: 'Requested Delivery Date',
      field_type: 'date',
      is_required: false,
      is_sortable: true,
      field_order: 4,
      ui_hints: {
        input_type: 'date',
        help_text: 'Customer requested delivery date'
      }
    },
    {
      field_name: 'priority',
      display_label: 'Order Priority',
      field_type: 'select',
      is_required: true,
      field_order: 5,
      default_value: 'normal',
      validation: {
        allowed_values: ['low', 'normal', 'high', 'urgent']
      },
      ui_hints: {
        input_type: 'select',
        help_text: 'Processing priority level'
      }
    },
    {
      field_name: 'shipping_method',
      display_label: 'Shipping Method',
      field_type: 'select',
      is_required: true,
      field_order: 6,
      validation: {
        allowed_values: ['standard', 'express', 'overnight', 'pickup']
      },
      ui_hints: {
        input_type: 'select',
        help_text: 'How the order will be delivered'
      }
    },
    {
      field_name: 'tax_exempt',
      display_label: 'Tax Exempt',
      field_type: 'boolean',
      is_required: false,
      field_order: 7,
      default_value: false,
      ui_hints: {
        input_type: 'checkbox',
        help_text: 'Check if customer is tax exempt'
      }
    }
  ],
  
  line_fields: [
    {
      field_name: 'product_code',
      display_label: 'Product Code',
      field_type: 'entity_ref',
      is_required: true,
      field_order: 1,
      ui_hints: {
        input_type: 'select',
        help_text: 'Select product from catalog'
      }
    },
    {
      field_name: 'quantity',
      display_label: 'Quantity',
      field_type: 'number',
      is_required: true,
      field_order: 2,
      validation: {
        min_value: 1
      },
      ui_hints: {
        input_type: 'number',
        help_text: 'Number of units ordered'
      }
    },
    {
      field_name: 'unit_price',
      display_label: 'Unit Price',
      field_type: 'number',
      is_required: true,
      field_order: 3,
      validation: {
        min_value: 0
      },
      ui_hints: {
        input_type: 'number',
        help_text: 'Price per unit'
      }
    },
    {
      field_name: 'discount_percent',
      display_label: 'Discount %',
      field_type: 'number',
      is_required: false,
      field_order: 4,
      default_value: 0,
      validation: {
        min_value: 0,
        max_value: 100
      },
      ui_hints: {
        input_type: 'number',
        help_text: 'Percentage discount applied'
      }
    }
  ],
  
  validation_rules: [
    {
      rule_id: 'delivery_date_validation',
      rule_type: 'cross_field',
      scope: 'header',
      validation_config: {
        rule: 'requested_delivery_date >= order_date'
      },
      error_message: 'Delivery date cannot be before order date'
    },
    {
      rule_id: 'line_amounts_balance',
      rule_type: 'line_validation',
      scope: 'lines',
      validation_config: {
        rule: 'sum(line_amount) = total_amount'
      },
      error_message: 'Line amounts must equal order total'
    }
  ],
  
  finance_integration: {
    chart_of_accounts_mapping: [
      {
        transaction_type: 'SALES_ORDER',
        debit_account: '1200', // Accounts Receivable
        credit_account: '4000', // Sales Revenue
        description_template: 'Sales Order #{order_number} - {customer_name}'
      }
    ],
    posting_rules: [
      {
        condition: 'status === "shipped"',
        action: 'post',
        configuration: {
          auto_post: true,
          posting_date: 'ship_date'
        }
      }
    ],
    currency_handling: {
      default_currency: 'USD',
      multi_currency_support: true,
      exchange_rate_source: 'system_rates'
    },
    revenue_recognition: {
      recognition_method: 'immediate',
      configuration: {
        recognize_on: 'shipment'
      }
    }
  },
  
  ui_config: {
    layout: 'tabs',
    header_groups: [
      {
        group_id: 'order_details',
        title: 'Order Details',
        fields: ['order_number', 'customer_po', 'order_date'],
        default_expanded: true
      },
      {
        group_id: 'delivery_info',
        title: 'Delivery Information',
        fields: ['requested_delivery_date', 'shipping_method', 'priority'],
        default_expanded: true
      },
      {
        group_id: 'tax_options',
        title: 'Tax & Options',
        fields: ['tax_exempt'],
        collapsible: true,
        default_expanded: false
      }
    ],
    line_config: {
      required_fields: ['product_code', 'quantity', 'unit_price'],
      calculated_fields: [
        {
          field_name: 'line_amount',
          calculation_type: 'multiply',
          source_fields: ['quantity', 'unit_price'],
          formula: 'quantity * unit_price * (1 - discount_percent / 100)'
        }
      ],
      validation_rules: ['positive_quantity', 'valid_product']
    },
    workflow_config: {
      approval_steps: [
        {
          step_id: 'credit_check',
          title: 'Credit Approval',
          assignee_field: 'credit_manager',
          condition: 'total_amount > customer.credit_limit'
        },
        {
          step_id: 'manager_approval',
          title: 'Manager Approval',
          assignee_field: 'sales_manager',
          condition: 'discount_percent > 10'
        }
      ],
      status_indicators: [
        {
          status_value: 'draft',
          color: 'gray',
          icon: 'FileText',
          description: 'Order being prepared'
        },
        {
          status_value: 'pending_approval',
          color: 'yellow',
          icon: 'Clock',
          description: 'Waiting for approval'
        },
        {
          status_value: 'approved',
          color: 'green',
          icon: 'CheckCircle',
          description: 'Ready for fulfillment'
        },
        {
          status_value: 'shipped',
          color: 'blue',
          icon: 'Truck',
          description: 'Order shipped to customer'
        }
      ]
    }
  }
}

// ==================== PRACTICAL USAGE EXAMPLE ====================

/**
 * Example: Using the Enhanced Dynamic Entity Builder
 */
export async function demonstrateEnhancedDynamicEntityBuilder() {
  console.log('🚀 HERA Enhanced Dynamic Entity Builder - Demonstration')
  console.log('======================================================')
  
  // 1. Create the builder instance
  const builder = createEnhancedDynamicEntityBuilder('crm-sales-demo', 'v1')
  
  try {
    // 2. Build Customer entity configuration
    console.log('\\n📋 Building Customer Entity Configuration...')
    const customerConfig = builder.buildEntityDefinition(customerEntityDefinition)
    
    if (customerConfig.success) {
      console.log('✅ Customer entity configuration built successfully')
      console.log(`   Entity Type: ${customerConfig.entity_definition.entity_type}`)
      console.log(`   Smart Code: ${customerConfig.entity_definition.smart_code}`)
      console.log(`   Dynamic Fields: ${customerConfig.field_mappings.length}`)
      console.log(`   Smart Codes Generated: ${customerConfig.smart_codes.length}`)
      console.log(`   Validation Rules: ${customerConfig.validation_config.field_validators.length}`)
      
      // Display generated Smart Codes
      console.log('\\n📝 Generated Smart Codes:')
      customerConfig.smart_codes.forEach(sc => {
        console.log(`   ${sc.context}: ${sc.smart_code}`)
      })
      
      // Display field mappings
      console.log('\\n🗺️ Field Mappings:')
      customerConfig.field_mappings.forEach(fm => {
        console.log(`   ${fm.field_name} (${fm.field_type}) → ${fm.storage_location}`)
        console.log(`     Smart Code: ${fm.smart_code}`)
      })
      
    } else {
      console.error('❌ Customer entity configuration failed:', customerConfig.error)
      return
    }
    
    // 3. Build Sales Order transaction configuration
    console.log('\\n📋 Building Sales Order Transaction Configuration...')
    const salesOrderConfig = builder.buildTransactionDefinition(salesOrderTransactionDefinition)
    
    if (salesOrderConfig.success) {
      console.log('✅ Sales Order transaction configuration built successfully')
      console.log(`   Transaction Type: ${salesOrderConfig.entity_definition.entity_type}`)
      console.log(`   Smart Code: ${salesOrderConfig.entity_definition.smart_code}`)
      console.log(`   Header Fields: ${salesOrderConfig.field_mappings.filter(f => f.smart_code.includes('HEADER')).length}`)
      console.log(`   Line Fields: ${salesOrderConfig.field_mappings.filter(f => f.smart_code.includes('LINE')).length}`)
      
    } else {
      console.error('❌ Sales Order transaction configuration failed:', salesOrderConfig.error)
      return
    }
    
    // 4. Demonstrate runtime execution (simulated)
    console.log('\\n⚡ Demonstrating Runtime Execution...')
    
    // Example customer data
    const customerData = {
      entity_name: 'ACME Corporation',
      email: 'contact@acme.com',
      phone: '+1-555-123-4567',
      customer_type: 'corporate',
      credit_limit: 50000,
      is_active: true,
      registration_date: '2024-01-15',
      notes: 'Large corporate client with good payment history'
    }
    
    // Example sales order data
    const salesOrderData = {
      order_number: 'SO-2024-001234',
      customer_po: 'PO-ACME-567890',
      order_date: '2024-11-10',
      requested_delivery_date: '2024-11-20',
      priority: 'normal',
      shipping_method: 'standard',
      tax_exempt: false,
      lines: [
        {
          product_code: 'PROD-001',
          quantity: 10,
          unit_price: 99.99,
          discount_percent: 5
        },
        {
          product_code: 'PROD-002', 
          quantity: 5,
          unit_price: 49.99,
          discount_percent: 0
        }
      ]
    }
    
    console.log('📊 Sample Customer Data:')
    console.log(JSON.stringify(customerData, null, 2))
    
    console.log('\\n📊 Sample Sales Order Data:')
    console.log(JSON.stringify(salesOrderData, null, 2))
    
    // Show how the data would be transformed for HERA
    console.log('\\n🔄 Data Transformation Preview:')
    console.log('Customer entity would be created with:')
    console.log('  - Core entity fields: entity_type, entity_name, smart_code')
    console.log('  - Dynamic data fields: email, phone, customer_type, credit_limit, etc.')
    console.log('  - Validation: email format, unique email, credit limit range')
    console.log('  - Smart Codes: Auto-generated for entity and each field')
    
    console.log('\\nSales Order transaction would be created with:')
    console.log('  - Transaction header with order details and delivery info')
    console.log('  - Transaction lines with product details and pricing')
    console.log('  - Finance integration with GL posting rules')
    console.log('  - Workflow integration for approvals if needed')
    
    // 5. Show configuration export capability
    console.log('\\n💾 Configuration Export:')
    const configExport = {
      customer_entity: customerConfig.entity_definition,
      sales_order_transaction: salesOrderConfig.entity_definition,
      smart_codes: [
        ...customerConfig.smart_codes,
        ...salesOrderConfig.smart_codes
      ],
      field_mappings: {
        customer: customerConfig.field_mappings,
        sales_order: salesOrderConfig.field_mappings
      }
    }
    
    console.log('Configuration can be exported as JSON for deployment:')
    console.log(`Export size: ${JSON.stringify(configExport).length} characters`)
    console.log('Contains complete entity definitions, Smart Codes, and field mappings')
    
    console.log('\\n🎉 DEMONSTRATION COMPLETED SUCCESSFULLY!')
    console.log('\\n🔑 Key Benefits Demonstrated:')
    console.log('✅ Declarative entity and transaction definitions')
    console.log('✅ Automatic Smart Code generation with HERA DNA compliance')
    console.log('✅ Type-safe field validation and UI configuration')
    console.log('✅ Seamless integration with existing HERA runtime systems')
    console.log('✅ Enhanced developer experience with guided configuration')
    console.log('✅ Complete traceability and audit trail support')
    
    return {
      customerConfig,
      salesOrderConfig,
      configExport
    }
    
  } catch (error) {
    console.error('❌ Demonstration failed:', error)
    throw error
  }
}

// Example of integration with micro-app client
export async function createCRMSalesApp() {
  const builder = createEnhancedDynamicEntityBuilder('crm-sales', 'v1')
  
  // Build configurations
  const customerConfig = builder.buildEntityDefinition(customerEntityDefinition)
  const salesOrderConfig = builder.buildTransactionDefinition(salesOrderTransactionDefinition)
  
  // Create micro-app definition
  const microAppDefinition = {
    code: 'crm-sales',
    display_name: 'CRM Sales Management',
    version: 'v1.0',
    category: 'sales',
    description: 'Complete customer and sales order management with finance integration',
    entities: [
      {
        entity_type: customerConfig.entity_definition.entity_type,
        display_name: customerEntityDefinition.display_name,
        display_name_plural: customerEntityDefinition.display_name_plural,
        fields: customerConfig.field_mappings.map(fm => ({
          field_name: fm.field_name,
          display_label: fm.field_name, // Would need to map back to original definition
          field_type: fm.field_type,
          is_required: false, // Would need to extract from validation
          is_searchable: false, // Would need to extract from original definition
          field_order: 0 // Would need to map back
        }))
      }
    ],
    transactions: [
      {
        transaction_type: salesOrderConfig.entity_definition.entity_type,
        display_name: salesOrderTransactionDefinition.display_name,
        display_name_plural: salesOrderTransactionDefinition.display_name_plural,
        header_fields: salesOrderConfig.field_mappings.filter(fm => fm.smart_code.includes('HEADER')).map(fm => ({
          field_name: fm.field_name,
          display_label: fm.field_name,
          field_type: fm.field_type,
          is_required: false,
          is_searchable: false,
          field_order: 0
        })),
        line_fields: salesOrderConfig.field_mappings.filter(fm => fm.smart_code.includes('LINE')).map(fm => ({
          field_name: fm.field_name,
          display_label: fm.field_name,
          field_type: fm.field_type,
          is_required: false,
          is_searchable: false,
          field_order: 0
        }))
      }
    ]
  }
  
  return {
    microAppDefinition,
    customerConfig,
    salesOrderConfig
  }
}

// Export the demonstration function for testing
export default demonstrateEnhancedDynamicEntityBuilder