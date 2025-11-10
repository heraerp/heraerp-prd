# HERA Enhanced Dynamic Entity Builder - Complete Guide

**Smart Code:** `HERA.PLATFORM.MICRO_APPS.DYNAMIC.ENTITY.BUILDER.GUIDE.v1`

## 🎯 Overview

The HERA Enhanced Dynamic Entity Builder provides a **declarative, type-safe approach** to defining dynamic entities and transactions within micro-apps. It automatically generates Smart Codes, field mappings, validation rules, and runtime configurations while ensuring seamless integration with HERA's Sacred Six architecture.

## 🚀 Key Benefits

### ✅ **Developer Experience Enhancement**
- **Declarative Definitions**: Define entities using TypeScript interfaces instead of manual configuration
- **Auto-Generated Smart Codes**: HERA DNA compliant Smart Codes generated automatically
- **Type Safety**: Full TypeScript support with compile-time validation
- **Guided Configuration**: Intellisense and validation prevent common mistakes

### ✅ **HERA Integration**
- **Sacred Six Compliance**: Uses existing `hera_entities_crud_v1` and `hera_txn_crud_v1` systems
- **Dynamic Data**: Business fields automatically stored in `core_dynamic_data`
- **Actor Stamping**: Complete audit trail with WHO/WHEN/WHAT tracking
- **Organization Isolation**: Multi-tenant security enforced automatically

### ✅ **Runtime Execution**
- **Seamless Execution**: Direct integration with micro-app runtime engine
- **Validation Pipeline**: Field-level and cross-field validation built-in
- **UI Configuration**: Auto-generated list views, search, and form configurations
- **Finance Integration**: Built-in GL posting rules and chart of accounts mapping

## 📋 Quick Start

### 1. Import the Builder

```typescript
import {
  createEnhancedDynamicEntityBuilder,
  type EnhancedMicroAppEntityDefinition,
  type EnhancedMicroAppTransactionDefinition
} from '@/lib/micro-apps/enhanced-dynamic-entity-builder'
```

### 2. Create Builder Instance

```typescript
const builder = createEnhancedDynamicEntityBuilder('my-app', 'v1')
```

### 3. Define Your Entity

```typescript
const customerEntity: EnhancedMicroAppEntityDefinition = {
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
      field_order: 1,
      validation: {
        regex_pattern: '^[^@]+@[^@]+\.[^@]+$'
      },
      ui_hints: {
        input_type: 'email',
        placeholder: 'customer@example.com',
        width: 'large'
      }
    },
    {
      field_name: 'credit_limit',
      display_label: 'Credit Limit',
      field_type: 'number',
      is_required: false,
      field_order: 2,
      validation: {
        min_value: 0,
        max_value: 1000000
      },
      ui_hints: {
        input_type: 'number',
        help_text: 'Maximum credit amount in USD'
      }
    }
  ]
}
```

### 4. Build Configuration

```typescript
const config = builder.buildEntityDefinition(customerEntity)

if (config.success) {
  console.log('Entity configured successfully!')
  console.log(`Smart Code: ${config.entity_definition.smart_code}`)
  console.log(`Fields: ${config.field_mappings.length}`)
}
```

### 5. Execute at Runtime

```typescript
await builder.executeEntityOperation(
  config,
  'create',
  {
    entity_name: 'ACME Corporation',
    email: 'contact@acme.com',
    credit_limit: 50000
  },
  organizationId
)
```

## 🏗️ Entity Definition Structure

### Core Definition

```typescript
interface EnhancedMicroAppEntityDefinition {
  entity_type: string                    // Unique entity identifier
  display_name: string                   // Human-readable name
  display_name_plural: string            // Plural form for UI
  smart_code_base: string               // Base for Smart Code generation
  dynamic_fields: DynamicFieldDefinition[]
  relationships?: DynamicRelationshipDefinition[]
  validation_rules?: EntityValidationRule[]
  ui_config?: EntityUIConfig
}
```

### Dynamic Field Definition

```typescript
interface DynamicFieldDefinition {
  field_name: string                    // Field identifier
  display_label: string                 // UI label
  field_type: 'text' | 'number' | 'boolean' | 'date' | 'email' | 'select' | ...
  is_required: boolean                  // Validation requirement
  is_searchable?: boolean               // Enable search capability
  is_sortable?: boolean                 // Enable sorting capability
  field_order: number                   // Display order
  default_value?: any                   // Default value
  validation?: FieldValidation          // Validation rules
  ui_hints?: FieldUIHints              // UI configuration
  smart_code_suffix?: string           // Custom Smart Code suffix
}
```

### Field Types Supported

| Type | Description | Storage | Example |
|------|-------------|---------|---------|
| `text` | Text strings | `field_value_text` | "Customer Name" |
| `number` | Numeric values | `field_value_number` | 1250.50 |
| `boolean` | True/false | `field_value_boolean` | true |
| `date` | Date values | `field_value_date` | "2024-01-15" |
| `email` | Email addresses | `field_value_text` | "user@example.com" |
| `phone` | Phone numbers | `field_value_text` | "+1-555-123-4567" |
| `select` | Selection from options | `field_value_text` | "option1" |
| `entity_ref` | Reference to other entity | `field_value_text` | entity_id |
| `json` | Complex objects | `field_value_json` | {"key": "value"} |

## 💼 Transaction Definition Structure

### Core Transaction Definition

```typescript
interface EnhancedMicroAppTransactionDefinition {
  transaction_type: string              // Unique transaction type
  display_name: string                  // Human-readable name
  display_name_plural: string           // Plural form
  smart_code_base: string              // Base for Smart Code generation
  header_fields: DynamicFieldDefinition[]
  line_fields?: DynamicFieldDefinition[]
  validation_rules?: TransactionValidationRule[]
  finance_integration?: FinanceIntegrationConfig
  ui_config?: TransactionUIConfig
}
```

### Finance Integration

```typescript
interface FinanceIntegrationConfig {
  chart_of_accounts_mapping: ChartMapping[]
  posting_rules: PostingRule[]
  currency_handling: CurrencyConfig
  revenue_recognition?: RevenueRecognitionConfig
}

interface ChartMapping {
  transaction_type: string
  debit_account: string                 // GL account code
  credit_account: string                // GL account code
  description_template: string          // Template for GL descriptions
}
```

### Example Transaction with Finance Integration

```typescript
const salesOrder: EnhancedMicroAppTransactionDefinition = {
  transaction_type: 'SALES_ORDER',
  display_name: 'Sales Order',
  display_name_plural: 'Sales Orders',
  smart_code_base: 'HERA.SALES.ORDER',
  
  header_fields: [
    {
      field_name: 'order_date',
      display_label: 'Order Date',
      field_type: 'date',
      is_required: true,
      field_order: 1
    },
    {
      field_name: 'total_amount',
      display_label: 'Total Amount',
      field_type: 'number',
      is_required: true,
      field_order: 2,
      validation: { min_value: 0 }
    }
  ],
  
  line_fields: [
    {
      field_name: 'product_code',
      display_label: 'Product',
      field_type: 'entity_ref',
      is_required: true,
      field_order: 1
    },
    {
      field_name: 'quantity',
      display_label: 'Quantity',
      field_type: 'number',
      is_required: true,
      field_order: 2
    }
  ],
  
  finance_integration: {
    chart_of_accounts_mapping: [
      {
        transaction_type: 'SALES_ORDER',
        debit_account: '1200',           // Accounts Receivable
        credit_account: '4000',          // Sales Revenue
        description_template: 'Sales Order #{order_number}'
      }
    ],
    currency_handling: {
      default_currency: 'USD',
      multi_currency_support: true
    }
  }
}
```

## 🎨 UI Configuration

### Entity List View Configuration

```typescript
interface EntityListViewConfig {
  default_columns: string[]             // Default columns to show
  sortable_columns: string[]            // Columns that can be sorted
  filterable_columns: string[]          // Columns that can be filtered
  searchable_columns: string[]          // Columns included in search
  row_actions: ListRowAction[]          // Actions available per row
}
```

### Field Grouping

```typescript
interface UIFieldGroup {
  group_id: string                      // Unique group identifier
  title: string                         // Group display title
  description?: string                  // Group description
  fields: string[]                      // Field names in this group
  collapsible?: boolean                 // Can be collapsed
  default_expanded?: boolean            // Default expansion state
}
```

### Example UI Configuration

```typescript
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
      fields: ['customer_type', 'credit_limit'],
      default_expanded: true
    }
  ],
  list_view: {
    default_columns: ['entity_name', 'email', 'customer_type'],
    sortable_columns: ['entity_name', 'email'],
    filterable_columns: ['customer_type'],
    searchable_columns: ['entity_name', 'email'],
    row_actions: [
      {
        action_id: 'edit',
        label: 'Edit',
        icon: 'Edit',
        condition: 'always'
      }
    ]
  }
}
```

## 🔍 Validation System

### Field-Level Validation

```typescript
interface FieldValidation {
  min_length?: number                   // Minimum string length
  max_length?: number                   // Maximum string length
  min_value?: number                    // Minimum numeric value
  max_value?: number                    // Maximum numeric value
  regex_pattern?: string                // Regular expression pattern
  allowed_values?: string[]             // List of allowed values
  custom_validator?: string             // Custom validation function
}
```

### Entity-Level Validation

```typescript
interface EntityValidationRule {
  rule_id: string                       // Unique rule identifier
  rule_type: 'required' | 'unique' | 'format' | 'cross_field' | 'custom'
  field_names: string[]                 // Fields involved in validation
  validation_config: any               // Rule-specific configuration
  error_message: string                 // Error message to display
}
```

### Example Validation Rules

```typescript
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
]
```

## ⚡ Runtime Execution

### Entity Operations

```typescript
// Create entity
await builder.executeEntityOperation(
  entityConfig,
  'create',
  {
    entity_name: 'ACME Corp',
    email: 'contact@acme.com',
    credit_limit: 50000
  },
  organizationId,
  {
    validate_before_save: true,
    auto_generate_codes: true,
    trigger_workflows: true
  }
)

// Update entity
await builder.executeEntityOperation(
  entityConfig,
  'update',
  {
    id: 'entity-id',
    credit_limit: 75000
  },
  organizationId
)

// Search entities
await builder.executeEntityOperation(
  entityConfig,
  'read',
  {
    filters: {
      customer_type: 'corporate'
    },
    search: 'ACME'
  },
  organizationId
)
```

### Transaction Operations

```typescript
// Create transaction
await builder.executeTransactionOperation(
  transactionConfig,
  'create',
  {
    order_date: '2024-11-10',
    total_amount: 1500.00,
    lines: [
      {
        product_code: 'PROD-001',
        quantity: 2,
        unit_price: 750.00
      }
    ]
  },
  organizationId,
  undefined,
  {
    validate_before_save: true,
    auto_post_to_gl: true,
    trigger_workflows: true
  }
)
```

## 🧬 Smart Code Generation

### Automatic Smart Code Patterns

The Enhanced Dynamic Entity Builder automatically generates HERA DNA compliant Smart Codes:

| Context | Pattern | Example |
|---------|---------|---------|
| Entity | `{base}.ENTITY.{version}` | `HERA.CRM.CUSTOMER.ENTITY.v1` |
| Field | `{base}.FIELD.{field}.{version}` | `HERA.CRM.CUSTOMER.FIELD.EMAIL.v1` |
| Transaction | `{base}.TXN.{version}` | `HERA.SALES.ORDER.TXN.v1` |
| Header Field | `{base}.HEADER.FIELD.{field}.{version}` | `HERA.SALES.ORDER.HEADER.FIELD.TOTAL.v1` |
| Line Field | `{base}.LINE.FIELD.{field}.{version}` | `HERA.SALES.ORDER.LINE.FIELD.QUANTITY.v1` |
| Relationship | `{base}.REL.{type}.{target}.{version}` | `HERA.CRM.CUSTOMER.REL.ASSIGNED_TO.USER.v1` |

### Custom Smart Code Suffixes

```typescript
{
  field_name: 'special_field',
  smart_code_suffix: 'CUSTOM_TYPE',  // Custom suffix
  // Generates: HERA.CRM.CUSTOMER.CUSTOM_TYPE.SPECIAL_FIELD.v1
}
```

## 🔄 Data Transformation

### Input to HERA Format

The builder automatically transforms input data to HERA's Sacred Six format:

```typescript
// Input Data
const inputData = {
  entity_name: 'ACME Corp',
  email: 'contact@acme.com',
  credit_limit: 50000
}

// Transformed to HERA Format
{
  entity_data: {
    entity_type: 'CUSTOMER',
    entity_name: 'ACME Corp',
    smart_code: 'HERA.CRM.CUSTOMER.ENTITY.v1'
  },
  dynamic_fields: {
    email: {
      field_type: 'email',
      field_value_text: 'contact@acme.com',
      smart_code: 'HERA.CRM.CUSTOMER.FIELD.EMAIL.v1'
    },
    credit_limit: {
      field_type: 'number',
      field_value_number: 50000,
      smart_code: 'HERA.CRM.CUSTOMER.FIELD.CREDIT_LIMIT.v1'
    }
  },
  relationships: []
}
```

## 📊 Configuration Export/Import

### Export Configuration

```typescript
const config = builder.buildEntityDefinition(entityDefinition)
const exportData = {
  entity_definition: config.entity_definition,
  field_mappings: config.field_mappings,
  smart_codes: config.smart_codes,
  validation_config: config.validation_config,
  runtime_config: config.runtime_config
}

// Save to file or database
const configJson = JSON.stringify(exportData, null, 2)
```

### Import and Use Configuration

```typescript
const importedConfig = JSON.parse(configJson)

// Use imported configuration for runtime operations
await builder.executeEntityOperation(
  importedConfig,
  'create',
  entityData,
  organizationId
)
```

## 🧪 Testing Framework

### Test Your Entity Definitions

```typescript
import { demonstrateEnhancedDynamicEntityBuilder } from '@/examples/micro-apps/enhanced-dynamic-entity-example'

// Run demonstration
const result = await demonstrateEnhancedDynamicEntityBuilder()
console.log('Demo completed:', result.customerConfig.success)
```

### Run Built-in Tests

```bash
# Test the Enhanced Dynamic Entity Builder
node scripts/test-enhanced-dynamic-entity-builder.mjs
```

## 🔧 Advanced Features

### Custom Storage Configuration

```typescript
{
  field_name: 'sensitive_data',
  storage_config: {
    encrypt_at_rest: true,
    audit_changes: true,
    compression: false
  }
}
```

### Conditional Display Rules

```typescript
ui_hints: {
  conditional_display: [
    {
      field_name: 'customer_type',
      operator: 'equals',
      value: 'corporate',
      // Show only when customer_type is 'corporate'
    }
  ]
}
```

### Calculated Fields

```typescript
line_config: {
  calculated_fields: [
    {
      field_name: 'line_total',
      calculation_type: 'multiply',
      source_fields: ['quantity', 'unit_price'],
      formula: 'quantity * unit_price * (1 - discount_percent / 100)'
    }
  ]
}
```

## 🚨 Error Handling

### Build-Time Validation

```typescript
const config = builder.buildEntityDefinition(entityDefinition)

if (!config.success) {
  console.error('Configuration error:', config.error)
  // Handle validation errors
}
```

### Runtime Error Handling

```typescript
try {
  const result = await builder.executeEntityOperation(
    config,
    'create',
    entityData,
    organizationId
  )
  
  if (result.success) {
    console.log('Entity created:', result.execution_result)
  } else {
    console.error('Creation failed:', result.error)
  }
} catch (error) {
  console.error('Runtime error:', error.message)
}
```

## 📈 Performance Considerations

### Best Practices

1. **Field Count**: Limit to 20-30 fields per entity for optimal performance
2. **Validation Rules**: Keep validation rules simple and fast
3. **UI Configuration**: Use field grouping to improve form rendering
4. **Search Fields**: Limit searchable fields to essential ones
5. **Relationships**: Use sparingly and with proper indexing

### Caching

```typescript
// The builder caches compiled configurations
const config = builder.buildEntityDefinition(entityDefinition)
// Subsequent calls with same definition use cached result
```

## 🔗 Integration Examples

### With Micro-App Client

```typescript
import { microAppClient } from '@/lib/micro-apps/micro-app-client'

// Use with micro-app runtime
const result = await microAppClient.executeEntityOperation(
  'my-app',
  'create',
  'CUSTOMER',
  transformedData.entity_data,
  organizationId,
  transformedData.dynamic_fields
)
```

### With Universal App Builder

```typescript
import { universalAppBuilder } from '@/lib/universal/universal-app-builder'

// Convert to micro-app definition
const microAppDef = universalAppBuilder.convertToMicroAppDefinition(appConfig)

// Use enhanced builder with micro-app
const enhancedConfig = builder.buildEntityDefinition(enhancedEntityDef)
```

## 📚 Additional Resources

- **Live Example**: `/examples/micro-apps/enhanced-dynamic-entity-example.ts`
- **Test Suite**: `/scripts/test-enhanced-dynamic-entity-builder.mjs`
- **Source Code**: `/src/lib/micro-apps/enhanced-dynamic-entity-builder.ts`
- **Phase 2 Guide**: `HERA-MICRO-APPS-PHASE-2-IMPLEMENTATION.md`
- **HERA DNA Guide**: `SMART_CODE_GUIDE.md`

## 🏆 Summary

The HERA Enhanced Dynamic Entity Builder provides:

- **✅ Declarative entity and transaction definitions**
- **✅ Automatic Smart Code generation with HERA DNA compliance**
- **✅ Type-safe field validation and transformation**
- **✅ Runtime configuration generation for UI components**
- **✅ Complete integration with existing HERA Sacred Six architecture**
- **✅ Enhanced developer experience with guided configuration**
- **✅ Finance integration with automated GL posting**
- **✅ Workflow integration for approval processes**

This completes the enhanced developer experience for dynamic entities and transactions, making HERA micro-app development more intuitive and productive while maintaining enterprise-grade standards.