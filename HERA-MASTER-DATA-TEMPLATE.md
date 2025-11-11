# 🏗️ HERA Master Data Creation Template - Production Ready

## 🎯 **Overview**

The **Rebate Agreement Creation Form** at `/enterprise/procurement/purchasing-rebates/rebate-agreement/new` has been optimized and serves as the **official template** for all master data creation forms in HERA. This template demonstrates best practices for:

- ✅ **HERA API v2 Integration** with `hera_entities_crud_v1` RPC
- ✅ **Professional Validation** with real-time error handling
- ✅ **Enterprise UI/UX** following SAP Fiori design patterns
- ✅ **Type Safety** with comprehensive TypeScript interfaces
- ✅ **Workflow Integration** with relationships and approvals
- ✅ **Smart Code Compliance** with HERA DNA standards

## 🔧 **Key Optimizations Implemented**

### **1. HERA API v2 Integration**
```typescript
// Uses proper HERA React hooks instead of direct API calls
const { upsertEntity, loading: upsertLoading, error: upsertError } = useUpsertEntity()

// Standardized entity creation via hera_entities_crud_v1 RPC
const result = await upsertEntity({
  entityType: ENTITY_CONFIG.ENTITY_TYPE,
  entityData: {
    entity_name: formData.entity_name,
    entity_code: formData.entity_code,
    smart_code: `${ENTITY_CONFIG.SMART_CODE_BASE}.ENTITY.v1`,
    entity_description: formData.description
  },
  dynamicFields: buildDynamicFields(),
  relationships: [],
  organizationId: organization.id
})
```

### **2. Comprehensive Validation System**
```typescript
// Field-level validation with custom business rules
const validateField = (field: keyof FormData, value: any): string | null => {
  if (ENTITY_CONFIG.REQUIRED_FIELDS.includes(field) && (!value || value === '')) {
    return `${field.replace('_', ' ')} is required`
  }
  
  if (field === 'entity_code' && value && !/^[A-Z0-9_-]+$/.test(value)) {
    return 'Entity code must contain only uppercase letters, numbers, hyphens, and underscores'
  }
  
  // Custom business logic validation
  return null
}
```

### **3. Modern UI Components**
- **Select Dropdowns** for constrained values (agreement_type, status, etc.)
- **Date Inputs** for temporal fields
- **Number Inputs** with min/max validation
- **Real-time Validation** with error indicators
- **Auto-generation** of entity codes from names

### **4. Enterprise Configuration Pattern**
```typescript
// Standardized entity configuration
const ENTITY_CONFIG = {
  ENTITY_TYPE: 'REBATE_AGREEMENT',
  SMART_CODE_BASE: 'HERA.PURCHASE.REBATE.AGREEMENT',
  REQUIRED_FIELDS: ['entity_name', 'entity_code', 'agreement_type', /* ... */],
  FIELD_SMART_CODES: {
    agreement_name: 'HERA.PURCHASE.REBATE.AGREEMENT.FIELD.NAME.v1',
    agreement_type: 'HERA.PURCHASE.REBATE.AGREEMENT.FIELD.TYPE.v1',
    // ... all field mappings
  }
} as const
```

## 📋 **Template Usage Guide**

### **Step 1: Copy the Template**
1. Copy `/enterprise/procurement/purchasing-rebates/rebate-agreement/new/page.tsx`
2. Create new file: `/path/to/your/entity/new/page.tsx`
3. Update the configuration section

### **Step 2: Configure Entity**
```typescript
// Update these constants for your entity
const ENTITY_CONFIG = {
  ENTITY_TYPE: 'YOUR_ENTITY_TYPE',           // e.g., 'SUPPLIER', 'PRODUCT', 'CUSTOMER'
  SMART_CODE_BASE: 'HERA.MODULE.ENTITY',     // e.g., 'HERA.PROCUREMENT.SUPPLIER'
  REQUIRED_FIELDS: ['entity_name', 'entity_code', 'your_required_fields'],
  FIELD_SMART_CODES: {
    // Map each field to its smart code
    field_name: 'HERA.MODULE.ENTITY.FIELD.NAME.v1'
  }
}

// Update the TypeScript interface
interface YourEntityFormData {
  entity_name: string
  entity_code: string
  // Add your specific fields with proper types
  your_field: 'option1' | 'option2' | 'option3'
  numeric_field: number
  date_field: string
  // etc.
}
```

### **Step 3: Update Form Sections**
```typescript
// Modify the sections array
const sections: CreatePageSection[] = [
  {
    id: 'basics',
    title: 'Basic Information',
    icon: FileText,
    isRequired: true,
    isComplete: !!(formData.entity_name && formData.entity_code)
  },
  {
    id: 'details',
    title: 'Your Entity Details',  // Update title
    icon: Settings,
    isRequired: true,
    isComplete: /* your completion logic */
  },
  // Add more sections as needed
]
```

### **Step 4: Build Form Fields**
```tsx
// In the details section, add your specific fields
<div className="space-y-2">
  <Label htmlFor="your_field">
    Your Field Name *
  </Label>
  <Select
    value={formData.your_field}
    onValueChange={(value) => handleFieldChange('your_field', value)}
  >
    <SelectTrigger className={validationErrors.your_field ? 'border-red-500' : ''}>
      <SelectValue placeholder="Select option" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="option1">Option 1</SelectItem>
      <SelectItem value="option2">Option 2</SelectItem>
      <SelectItem value="option3">Option 3</SelectItem>
    </SelectContent>
  </Select>
  {validationErrors.your_field && (
    <p className="text-sm text-red-600 flex items-center gap-1">
      <AlertCircle className="w-4 h-4" />
      {validationErrors.your_field}
    </p>
  )}
</div>
```

### **Step 5: Add Custom Validation**
```typescript
// Add entity-specific validation rules
const validateField = (field: keyof YourEntityFormData, value: any): string | null => {
  // Standard required field validation
  if (ENTITY_CONFIG.REQUIRED_FIELDS.includes(field) && (!value || value === '')) {
    return `${field.replace('_', ' ')} is required`
  }
  
  // Add your custom business rules
  if (field === 'numeric_field' && value < 0) {
    return 'Value must be positive'
  }
  
  // Add cross-field validation
  if (field === 'start_date' && field === 'end_date') {
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      return 'Start date must be before end date'
    }
  }
  
  return null
}
```

## 🎨 **UI/UX Standards**

### **Form Layout Pattern**
- **Grid Layout**: `grid grid-cols-1 md:grid-cols-2 gap-6`
- **Field Spacing**: `space-y-2` for field groups
- **Validation**: Red borders + error messages with AlertCircle icon
- **Auto-generation**: Entity codes auto-generated from names
- **Loading States**: Proper loading indicators and disabled states

### **Field Types**
```tsx
// Text Input
<Input
  id="field_name"
  value={formData.field_name}
  onChange={(e) => handleFieldChange('field_name', e.target.value)}
  placeholder="Enter value"
  className={validationErrors.field_name ? 'border-red-500' : ''}
  required
/>

// Select Dropdown
<Select
  value={formData.field_name}
  onValueChange={(value) => handleFieldChange('field_name', value)}
>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>

// Date Input
<Input
  type="date"
  value={formData.date_field}
  onChange={(e) => handleFieldChange('date_field', e.target.value)}
  required
/>

// Number Input
<Input
  type="number"
  step="0.01"
  min="0"
  value={formData.numeric_field}
  onChange={(e) => handleFieldChange('numeric_field', parseFloat(e.target.value) || 0)}
  required
/>

// Textarea
<Textarea
  value={formData.description}
  onChange={(e) => handleFieldChange('description', e.target.value)}
  rows={3}
/>
```

## 🔗 **Relationships & Workflows**

The template includes a **Relationships & Workflows** section that demonstrates how to:

- **Link to other entities** (suppliers, products, customers)
- **Configure approval workflows** 
- **Set up performance tracking**
- **Define automated processes**

This section is designed to be enhanced after the basic entity is created, following HERA's relationship patterns.

## 📊 **Benefits of This Template**

### **For Developers**
- ✅ **Consistent patterns** across all master data forms
- ✅ **Type safety** and validation built-in
- ✅ **HERA compliance** automatically enforced
- ✅ **Professional UI/UX** with minimal effort
- ✅ **Error handling** and loading states included

### **For Business Users**
- ✅ **Intuitive forms** following enterprise standards
- ✅ **Real-time validation** with helpful error messages
- ✅ **Auto-generation** of codes and related fields
- ✅ **Progress tracking** with completion percentages
- ✅ **AI insights** and suggestions

### **For Platform**
- ✅ **HERA DNA compliance** with proper smart codes
- ✅ **Organization isolation** and security
- ✅ **Actor stamping** and audit trails
- ✅ **Sacred Six integration** via dynamic fields
- ✅ **Scalable patterns** for complex workflows

## 🚀 **Implementation Examples**

### **Customer Master Data**
```typescript
const CUSTOMER_CONFIG = {
  ENTITY_TYPE: 'CUSTOMER',
  SMART_CODE_BASE: 'HERA.CRM.CUSTOMER',
  REQUIRED_FIELDS: ['entity_name', 'entity_code', 'customer_type', 'contact_email'],
  FIELD_SMART_CODES: {
    customer_type: 'HERA.CRM.CUSTOMER.FIELD.TYPE.v1',
    contact_email: 'HERA.CRM.CUSTOMER.FIELD.EMAIL.v1',
    phone_number: 'HERA.CRM.CUSTOMER.FIELD.PHONE.v1',
    credit_limit: 'HERA.CRM.CUSTOMER.FIELD.CREDIT_LIMIT.v1'
  }
}
```

### **Product Master Data**
```typescript
const PRODUCT_CONFIG = {
  ENTITY_TYPE: 'PRODUCT',
  SMART_CODE_BASE: 'HERA.INVENTORY.PRODUCT',
  REQUIRED_FIELDS: ['entity_name', 'entity_code', 'product_category', 'unit_price'],
  FIELD_SMART_CODES: {
    product_category: 'HERA.INVENTORY.PRODUCT.FIELD.CATEGORY.v1',
    unit_price: 'HERA.INVENTORY.PRODUCT.FIELD.PRICE.v1',
    unit_of_measure: 'HERA.INVENTORY.PRODUCT.FIELD.UOM.v1',
    supplier_code: 'HERA.INVENTORY.PRODUCT.FIELD.SUPPLIER_CODE.v1'
  }
}
```

### **Supplier Master Data**
```typescript
const SUPPLIER_CONFIG = {
  ENTITY_TYPE: 'SUPPLIER',
  SMART_CODE_BASE: 'HERA.PROCUREMENT.SUPPLIER',
  REQUIRED_FIELDS: ['entity_name', 'entity_code', 'supplier_type', 'payment_terms'],
  FIELD_SMART_CODES: {
    supplier_type: 'HERA.PROCUREMENT.SUPPLIER.FIELD.TYPE.v1',
    payment_terms: 'HERA.PROCUREMENT.SUPPLIER.FIELD.PAYMENT_TERMS.v1',
    credit_rating: 'HERA.PROCUREMENT.SUPPLIER.FIELD.CREDIT_RATING.v1',
    tax_id: 'HERA.PROCUREMENT.SUPPLIER.FIELD.TAX_ID.v1'
  }
}
```

## 🎯 **Next Steps**

1. **Test the optimized form** at `http://localhost:3000/enterprise/procurement/purchasing-rebates/rebate-agreement/new`
2. **Use this template** for creating new master data forms
3. **Extend relationships** section with actual workflow integrations
4. **Add entity-specific business rules** and validations
5. **Create list/edit pages** following similar patterns

## 🏆 **Template Features Summary**

- 🎨 **Enterprise UI/UX**: SAP Fiori design patterns
- 🔧 **HERA Integration**: API v2 with hera_entities_crud_v1 RPC
- ✅ **Validation**: Real-time field and form validation
- 🎯 **Type Safety**: Full TypeScript support
- 🔄 **Auto-generation**: Smart entity code generation
- 📱 **Responsive**: Mobile-first design
- 🔒 **Security**: Organization isolation and actor stamping
- 🚀 **Performance**: Optimized loading and error states
- 🎭 **Accessibility**: Screen reader friendly
- 📊 **Analytics**: Built-in completion tracking

**This template represents the gold standard for HERA master data creation forms and should be used as the foundation for all future entity creation interfaces.**