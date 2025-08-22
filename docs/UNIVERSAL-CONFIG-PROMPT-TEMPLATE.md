# Universal Configuration System - Prompt Template

## 🚀 Quick Feature Generation Prompt

Use this template to rapidly generate enterprise-grade features using HERA's Universal Configuration System.

### Basic Template:
```
Create a [FEATURE_NAME] management system using the Universal Configuration Factory pattern with these requirements:

1. Entity Type: [entity_type_name]
2. Smart Code Prefix: HERA.[MODULE].[ENTITY]
3. Core Fields:
   - [field1]: [type] - [description]
   - [field2]: [type] - [description]
   - [field3]: [type] - [description]

4. Business Logic:
   - [Requirement 1]
   - [Requirement 2]
   - [Requirement 3]

5. UI Requirements:
   - [Custom column 1]
   - [Custom column 2]
   - Analytics: [metric1], [metric2]

6. Relationships:
   - Related to: [other_entity]
   - Relationship type: [one-to-many/many-to-many]

Generate complete implementation with API routes and UI pages.
```

## 📋 Detailed Examples

### Example 1: Inventory Management
```
Create an Inventory Management system using the Universal Configuration Factory pattern with these requirements:

1. Core Entities:
   - product_item (entity_type)
   - stock_location (entity_type)
   - stock_movement (transaction_type)
   - supplier (entity_type)

2. Product Item Fields:
   - sku: text - Stock keeping unit
   - barcode: text - Product barcode
   - category: select - Product category
   - cost_price: currency - Purchase cost
   - retail_price: currency - Selling price
   - min_stock: number - Minimum stock level
   - max_stock: number - Maximum stock level
   - reorder_point: number - Reorder trigger
   - unit_of_measure: select - pcs/kg/ltr/etc
   - is_consumable: checkbox - Professional use only
   - is_retail: checkbox - Available for retail sale

3. Stock Location Fields:
   - location_type: select - Storage/Display/Treatment Room
   - capacity: number - Maximum items
   - temperature_controlled: checkbox
   - restricted_access: checkbox

4. Business Requirements:
   - Track stock levels across multiple locations
   - Automatic low stock alerts
   - Stock movement history with reasons
   - Supplier management with reorder tracking
   - Expiry date tracking for products
   - Stock valuation reports

5. UI Requirements:
   - Show current stock levels with color coding
   - Quick stock adjustment buttons
   - Barcode scanning support
   - Stock movement timeline
   - Analytics: Total value, Low stock items, Expired items

Generate complete implementation.
```

### Example 2: Appointment Scheduling
```
Create an Appointment Scheduling system using the Universal Configuration Factory pattern with these requirements:

1. Core Entities:
   - appointment_slot (entity_type)
   - booking_rule (entity_type)
   - schedule_template (entity_type)

2. Appointment Slot Fields:
   - slot_date: date - Appointment date
   - start_time: time - Start time
   - duration_minutes: number - Duration
   - staff_id: select - Assigned staff
   - service_ids: multiselect - Services
   - status: select - Available/Booked/Blocked
   - buffer_time: number - Cleanup time

3. Business Requirements:
   - Prevent double booking
   - Service duration calculation
   - Staff availability checking
   - Client notification system
   - Recurring appointments
   - Cancellation policies

4. UI Requirements:
   - Calendar view with drag-drop
   - Staff schedule grid
   - Quick booking modal
   - Color coding by service type
   - Analytics: Utilization rate, No-shows, Revenue

Generate complete implementation.
```

## 🛠️ Advanced Pattern Templates

### Multi-Entity System Template
```
Create a [SYSTEM_NAME] with multiple related entities:

Primary Entity: [main_entity]
- Fields: [list fields]
- Smart Code: HERA.[MODULE].[ENTITY]

Secondary Entity: [related_entity]
- Fields: [list fields]
- Relationship: [relationship_type] to [main_entity]

Transaction Entity: [transaction_type]
- Links: [main_entity] and [related_entity]
- Fields: [transaction fields]

Generate with proper relationships and UI navigation.
```

### Workflow-Based System Template
```
Create a [WORKFLOW_NAME] system with status tracking:

Entity: [entity_type]
Workflow States: [state1] → [state2] → [state3]

State Transitions:
- [state1] to [state2]: Requires [permission/condition]
- [state2] to [state3]: Requires [permission/condition]

Actions per State:
- [state1]: [allowed actions]
- [state2]: [allowed actions]

Generate with state management and permissions.
```

## 💡 Best Practices

### 1. Entity Naming
- Use snake_case for entity_type
- Be specific: `salon_product` not just `product`
- Include module prefix for clarity

### 2. Smart Code Structure
```
HERA.[INDUSTRY].[MODULE].[TYPE].[SUBTYPE].v1

Examples:
HERA.SALON.INV.PRODUCT.v1
HERA.SALON.SCHED.APPOINTMENT.v1
HERA.RETAIL.POS.TRANSACTION.v1
```

### 3. Field Types Available
- `text` - Single line text
- `textarea` - Multi-line text
- `number` - Numeric input
- `currency` - Money input with formatting
- `select` - Dropdown single selection
- `multiselect` - Multiple selection
- `checkbox` - Boolean toggle
- `date` - Date picker
- `time` - Time picker
- `color` - Color picker
- `email` - Email validation
- `phone` - Phone formatting
- `url` - URL validation

### 4. Custom Column Patterns
```javascript
customColumns={[
  {
    key: 'status',
    header: 'Status',
    render: (item) => <Badge>{item.status}</Badge>
  },
  {
    key: 'value',
    header: 'Value',
    render: (item) => <CurrencyDisplay value={item.price} />
  }
]}
```

### 5. Analytics Configuration
```javascript
analyticsConfig={{
  title: 'Dashboard',
  metrics: [
    {
      label: 'Total Items',
      value: (items) => items.length
    },
    {
      label: 'Total Value',
      value: (items) => {
        const sum = items.reduce((acc, item) => acc + item.value, 0)
        return <CurrencyDisplay value={sum} />
      }
    }
  ]
}}
```

## 🚀 Rapid Generation Commands

### Step 1: Create API Route
```bash
# Create new file: /src/app/api/v1/[module]/[entity]/route.ts
```

### Step 2: Create UI Page
```bash
# Create new file: /src/app/[module]/[entity]/page.tsx
```

### Step 3: Add to Navigation
```typescript
// Add to navigation configuration
{
  label: 'Entity Management',
  href: '/module/entity',
  icon: IconName
}
```

## 📝 Complete Example Generation

### Input Prompt:
```
Create a Product Inventory system for salon with barcode scanning, 
stock tracking, low stock alerts, and supplier management.
```

### Generated Output Structure:
```
/src/app/api/v1/salon/
  ├── products/route.ts
  ├── stock-locations/route.ts
  ├── suppliers/route.ts
  └── stock-movements/route.ts

/src/app/salon/
  ├── products/page.tsx
  ├── stock-locations/page.tsx
  ├── suppliers/page.tsx
  └── inventory-dashboard/page.tsx
```

## 🎯 Success Metrics

A well-structured prompt should result in:
1. ✅ Complete CRUD operations
2. ✅ Type-safe API and UI
3. ✅ Multi-tenant isolation
4. ✅ Smart Code integration
5. ✅ Enterprise UI patterns
6. ✅ Analytics and reporting
7. ✅ Mobile responsive
8. ✅ Production ready

## 🔧 Customization Points

### Add Business Logic
```typescript
// In CONFIG_TYPES definition
customAnalytics: (items, relatedItems) => ({
  low_stock_count: items.filter(i => i.current_stock < i.min_stock).length,
  total_value: items.reduce((sum, i) => sum + (i.current_stock * i.cost_price), 0)
})
```

### Add Validation
```typescript
// In form submission
if (formData.min_stock >= formData.max_stock) {
  toast({ title: 'Error', description: 'Min stock must be less than max stock' })
  return
}
```

### Add Computed Fields
```typescript
// In enrichItems
const margin = ((item.retail_price - item.cost_price) / item.retail_price) * 100
return { ...item, profit_margin: margin }
```

## 🏆 Pro Tips

1. **Start Simple**: Basic CRUD first, then add complexity
2. **Use Existing Patterns**: Copy from staff-roles or service-categories
3. **Leverage CONFIG_TYPES**: Extend existing configurations
4. **Test Multi-tenant**: Always include organization_id
5. **Think Universal**: Will this work for other industries?

---

**Remember**: The Universal Configuration System handles 80% of typical business requirements. Only build custom when you need the remaining 20% of specialized functionality.