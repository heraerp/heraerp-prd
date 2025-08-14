# 🏗️ HERA Smart Coding Guide for Claude CLI

## 🎯 Purpose
This document defines the intelligent coding patterns and architectural principles for building HERA Universal ERP. Claude CLI should follow these patterns to maintain consistency and leverage HERA's revolutionary architecture.

## 🏛️ Core HERA Principles

### 1. Universal Architecture Pattern
```typescript
// ALWAYS use the 6-table foundation
interface HeraUniversalFoundation {
  core_organizations;      // WHO - Multi-tenant isolation
  core_entities;          // WHAT - All business objects
  core_dynamic_data;      // HOW - Unlimited custom fields
  core_relationships;     // WHY - Universal connections
  universal_transactions; // WHEN - All business events
  universal_transaction_lines; // DETAILS - Complete breakdown
}
```

### 2. Sacred Multi-Tenancy
```typescript
// EVERY query MUST include organization_id filtering
const SACRED_RULE = "organization_id filtering everywhere"

// ✅ CORRECT
const getEntities = (orgId: string) => 
  supabase.from('core_entities').select('*').eq('organization_id', orgId)

// ❌ NEVER DO THIS
const getEntities = () => 
  supabase.from('core_entities').select('*') // SECURITY VIOLATION!
```

### 3. Universal Transaction Pattern
```typescript
// ALL business activities use the same 2-table pattern
interface UniversalTransaction {
  // Header (universal_transactions)
  transaction_type: string;  // "restaurant_order" | "invoice" | "payment" | etc.
  total_amount: number;
  organization_id: string;   // SACRED
  
  // Lines (universal_transaction_lines)
  line_items: {
    entity_id: string;       // Links to core_entities
    quantity: number;
    unit_price: number;
    line_amount: number;
    organization_id: string; // SACRED in lines too!
  }[];
}
```

## 🚀 Smart Coding Patterns

### Pattern 1: Dynamic Field Management
```typescript
// Use core_dynamic_data for ALL custom fields
interface SmartFieldPattern {
  addDynamicField: (entityId: string, fieldName: string, value: any, type: FieldType) => {
    // Store in core_dynamic_data, not separate columns
    return {
      entity_id: entityId,
      field_name: fieldName,
      field_type: type,
      [`field_value_${type}`]: value,
      organization_id: currentUser.organization_id // SACRED
    }
  }
}

// This enables unlimited fields without schema changes
const productFields = {
  price: 18.50,
  allergen_info: { gluten_free: true, nuts: false },
  prep_time: 15,
  popularity_score: 0.94
}
// All stored dynamically, no table alterations needed!
```

### Pattern 2: Universal Relationships
```typescript
// Connect ANY entity to ANY other entity
interface SmartRelationshipPattern {
  createRelationship: (source: string, target: string, type: string) => {
    return {
      source_entity_id: source,
      target_entity_id: target,
      relationship_type: type,
      organization_id: currentUser.organization_id, // SACRED
      is_bidirectional: true // Creates reverse relationship automatically
    }
  }
}

// Examples:
// Customer → Order → Line Items
// Recipe → Ingredients → Suppliers  
// Patient → Treatment → Equipment
// ALL use the same relationship pattern!
```

### Pattern 3: AI-Native Intelligence
```typescript
// AI fields are built into every table, never separate
interface SmartAIPattern {
  enhanceWithAI: (data: any) => {
    return {
      ...data,
      ai_confidence: calculateConfidence(data),
      ai_classification: classifyEntity(data),
      ai_enhanced_value: improveValue(data),
      validation_status: validateData(data)
    }
  }
}

// AI intelligence is part of the core architecture, not bolted on
```

### Pattern 4: Universal Search
```typescript
// Search across ALL entity types with one query
interface SmartSearchPattern {
  universalSearch: (orgId: string, query: string) => {
    return supabase
      .from('core_entities')
      .select(`
        *,
        dynamic_data:core_dynamic_data(*),
        relationships:core_relationships(*)
      `)
      .eq('organization_id', orgId) // SACRED
      .or(`entity_name.ilike.%${query}%,entity_code.ilike.%${query}%`)
  }
}
```

## 🎨 Component Architecture Patterns

### Pattern 5: Universal UI Components
```typescript
// Components are business-agnostic and data-driven
interface SmartComponentPattern {
  // ✅ CORRECT - Universal component
  UniversalTable: ({ 
    entityType, 
    organizationId, 
    customFields 
  }: UniversalTableProps) => JSX.Element

  // ❌ WRONG - Business-specific component  
  RestaurantMenuTable: () => JSX.Element // Too specific!
}

// One table component handles:
// - Restaurant menus
// - Hospital equipment
// - Law firm clients
// - Manufacturing parts
// ALL with the same code!
```

### Pattern 6: Dynamic Form Generation
```typescript
// Forms generate automatically from dynamic field definitions
interface SmartFormPattern {
  generateForm: (entityType: string, orgId: string) => {
    const fieldDefinitions = getDynamicFields(entityType, orgId);
    return fieldDefinitions.map(field => ({
      name: field.field_name,
      type: field.field_type,
      validation: field.validation_rules,
      ai_suggestions: field.ai_enhanced_value
    }));
  }
}
```

## 🔄 Development Workflow Patterns

### Pattern 7: Business Logic Configuration
```javascript
// Business logic is configured, not coded
const businessLogic = {
  restaurant: {
    entities: ['menu_item', 'customer', 'table', 'staff'],
    transactions: ['order', 'payment', 'inventory_receipt'],
    workflows: ['order_to_kitchen', 'payment_processing']
  },
  healthcare: {
    entities: ['patient', 'treatment', 'equipment', 'staff'],
    transactions: ['appointment', 'treatment_record', 'billing'],
    workflows: ['patient_admission', 'treatment_plan']
  }
  // Same architecture, different configuration!
}
```

### Pattern 8: Zero Schema Migration
```typescript
// NEVER alter database schema - use dynamic fields
interface SmartSchemaPattern {
  // ✅ CORRECT - Add field dynamically
  addField: (entityType: string, fieldName: string) => {
    // Adds to core_dynamic_data, no schema change needed
  }
  
  // ❌ NEVER DO THIS
  alterTable: () => {
    // ALTER TABLE core_entities ADD COLUMN new_field...
    // SCHEMA MIGRATIONS ARE FORBIDDEN IN HERA!
  }
}
```

## 🛡️ Security & Performance Patterns

### Pattern 9: Automatic Multi-Tenant Security
```typescript
// Security is built into every query, never optional
const createSecureQuery = (tableName: string, orgId: string) => {
  if (!orgId) throw new Error('SACRED RULE VIOLATION: organization_id required');
  
  return supabase
    .from(tableName)
    .select('*')
    .eq('organization_id', orgId); // ALWAYS enforced at query level
}
```

### Pattern 10: Universal Caching Strategy
```typescript
// Cache keys include organization_id for perfect isolation
const cacheKey = (table: string, id: string, orgId: string) => 
  `${table}:${orgId}:${id}` // Organization-isolated caching

// Mario's restaurant data never conflicts with Dr. Smith's patient data
```

## 📊 Implementation Guidelines for Claude CLI

### When Building HERA Applications:

1. **Start with Organization Setup**
   ```typescript
   // Step 1: Always create organization first
   const org = await createOrganization(businessType);
   
   // Step 2: Configure business-specific entities
   const entities = await configureBusinessEntities(businessType, org.id);
   
   // Step 3: Set up dynamic fields
   const fields = await setupDynamicFields(businessType, entities);
   ```

2. **Use Universal Patterns**
   ```typescript
   // ✅ Universal transaction creation
   const createTransaction = async (type: string, data: any) => {
     const header = await createTransactionHeader(type, data);
     const lines = await createTransactionLines(header.id, data.line_items);
     return { header, lines };
   }
   
   // Works for restaurant orders, invoices, work orders, prescriptions, etc.
   ```

3. **Leverage Dynamic Fields**
   ```typescript
   // ✅ Add unlimited business-specific fields
   await addDynamicField('menu_item', 'allergen_info', allergenData, 'json');
   await addDynamicField('patient', 'insurance_info', insuranceData, 'json');
   await addDynamicField('product', 'technical_specs', specsData, 'json');
   
   // No schema changes, unlimited customization
   ```

4. **Build Universal Components**
   ```typescript
   // ★ One component serves all business types
   <UniversalEntityManager
     entityType="customer" // or "patient" or "client"
     organizationId={currentOrg.id}
     customFields={dynamicFields}
   />
   ```

## 🎯 The HERA Promise in Code

```typescript
// This is what makes HERA revolutionary:
interface HeraPromise {
  tables: 6;                    // Fixed universal foundation
  businessComplexity: 'infinite'; // Unlimited via configuration
  schemaChanges: 0;            // Never needed
  implementationTime: 'hours'; // Not months
  architecture: 'universal';   // Works for any business
}

// One codebase. Infinite business applications. Zero technical debt.
```

## 🚀 Claude CLI Commands

When Claude CLI encounters HERA development:

```bash
# Generate HERA business application
claude generate hera-app --business-type=restaurant --features=pos,inventory,staff

# Add dynamic fields to existing HERA app  
claude add hera-fields --entity=menu_item --fields=allergens:json,prep_time:number

# Create universal transaction flow
claude create hera-transaction --type=customer_order --entities=customer,menu_items

# Deploy HERA multi-tenant instance
claude deploy hera --tenants=multiple --database=supabase --api=universal
```

## 💡 Key Insights for Claude CLI

1. **Never Create Business-Specific Tables** - Always use the 6 universal tables
2. **Always Include organization_id** - Multi-tenancy is sacred and non-negotiable  
3. **Use Dynamic Fields for Customization** - Never alter schema
4. **Think Universal, Configure Specific** - One architecture, infinite configurations
5. **AI is Native, Not Added** - Intelligence built into core tables
6. **Components are Business-Agnostic** - One UI serves all business types

## 🏆 The Meta Goal

Use HERA's own universal architecture to build HERA itself:
- **Organizations**: HERA development teams, customers, partners
- **Entities**: Features, bugs, releases, documentation  
- **Dynamic Data**: Feature specifications, requirements, configurations
- **Relationships**: Feature dependencies, team assignments, customer needs
- **Transactions**: Development tasks, releases, customer implementations
- **Lines**: Individual code changes, test cases, deployment steps

**The ultimate proof**: If HERA can build and manage itself, it can build and manage anything! 🚀

---

*This document serves as the definitive guide for maintaining HERA's architectural purity and revolutionary simplicity while building infinite business complexity.*