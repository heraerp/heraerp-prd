# HERA Smart Code Picker Documentation
## Intelligent Business Classification Code Selector

---

## 🎯 Overview

The **SmartCodePicker** component provides an enterprise-grade interface for selecting and managing HERA Smart Codes - the intelligent business classification system that provides context and meaning to all data within the HERA ecosystem.

### Key Features
- 🔍 **Hierarchical Navigation** - Browse codes by industry, module, and category
- 🎯 **Smart Filtering** - Industry-specific and module-specific filtering
- 📝 **Custom Codes** - Support for user-defined smart codes
- 🕐 **Recent & Popular** - Quick access to frequently used codes
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔒 **Type Safe** - Full TypeScript support with exported interfaces

---

## 🚀 Quick Start

### Basic Implementation
```typescript
import { SmartCodePicker } from '@/lib/dna/components/smart-code/SmartCodePicker'

<SmartCodePicker
  onChange={(code, smartCode) => {
    console.log('Selected:', code, smartCode)
  }}
/>
```

### With Industry Filtering
```typescript
<SmartCodePicker
  industry="restaurant"
  module="sales"
  onChange={(code, smartCode) => {
    setSelectedCode(code)
  }}
  label="Transaction Smart Code"
  required={true}
/>
```

### Inline Mode
```typescript
<SmartCodePicker
  mode="inline"
  value={currentCode}
  onChange={handleCodeChange}
  showRecent={true}
  showPopular={true}
  allowCustom={true}
/>
```

---

## 📋 Configuration

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | string | - | Currently selected smart code |
| `onChange` | (code: string, smartCode: SmartCode) => void | Required | Called when selection changes |
| `industry` | string | - | Filter codes by industry |
| `module` | string | - | Filter codes by module |
| `entityType` | string | - | Filter codes by entity type |

### Feature Flags

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `allowCustom` | boolean | false | Allow custom code entry |
| `showDescription` | boolean | true | Show code descriptions |
| `showRecent` | boolean | true | Show recently used codes |
| `showPopular` | boolean | true | Show popular codes |
| `showSearch` | boolean | true | Show search functionality |

### UI Customization

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | string | "Select smart code..." | Input placeholder text |
| `label` | string | - | Form field label |
| `required` | boolean | false | Mark field as required |
| `disabled` | boolean | false | Disable the component |
| `className` | string | - | Additional CSS classes |
| `mode` | 'inline' \| 'dialog' | 'dialog' | Display mode |
| `dialogTitle` | string | "Select Smart Code" | Dialog title text |

---

## 🔍 Smart Code Structure

### SmartCode Interface
```typescript
interface SmartCode {
  code: string                    // HERA.INDUSTRY.MODULE.FUNCTION.TYPE.VARIANT.v1
  name: string                    // Human-readable name
  description: string             // Detailed description
  category: SmartCodeCategory     // Category classification
  industry?: string               // Target industry
  module?: string                 // System module
  version: number                 // Version number
  deprecated?: boolean            // Deprecation status
  metadata?: Record<string, any>  // Additional metadata
}
```

### Category Structure
```typescript
interface SmartCodeCategory {
  id: string                                              // Unique identifier
  name: string                                            // Display name
  icon: React.ComponentType<{ className?: string }>      // Icon component
  description: string                                     // Category description
  color: string                                           // Theme color
}
```

### Example Smart Codes
```typescript
// Entity Code
{
  code: 'HERA.CRM.CUST.ENT.PROF.v1',
  name: 'Customer Profile Entity',
  description: 'Professional customer profile with full details',
  category: 'entity',
  industry: 'universal',
  module: 'crm',
  version: 1
}

// Transaction Code
{
  code: 'HERA.REST.SALE.TXN.ORDER.v1',
  name: 'Restaurant Order',
  description: 'Dine-in or takeout order',
  category: 'transaction',
  industry: 'restaurant',
  module: 'sales',
  version: 1
}
```

---

## 🏭 Industry-Specific Usage

### Restaurant Industry
```typescript
<SmartCodePicker
  industry="restaurant"
  placeholder="Select restaurant operation..."
  onChange={(code, smartCode) => {
    // Handle restaurant-specific codes
    // HERA.REST.SALE.TXN.ORDER.v1
    // HERA.REST.INV.ENT.INGR.v1
  }}
/>
```

### Salon & Spa Industry
```typescript
<SmartCodePicker
  industry="salon"
  module="service"
  placeholder="Select salon service..."
  onChange={(code, smartCode) => {
    // Handle salon-specific codes
    // HERA.SALON.SVC.TXN.APPT.v1
    // HERA.SALON.HR.ENT.STYL.v1
  }}
/>
```

### Universal Codes
```typescript
<SmartCodePicker
  industry="universal"
  placeholder="Select universal operation..."
  onChange={(code, smartCode) => {
    // Handle universal codes
    // HERA.FIN.SALE.TXN.INV.v1
    // HERA.CRM.CUST.ENT.PROF.v1
  }}
/>
```

---

## 🎨 Visual Categories

The component organizes smart codes into visual categories:

### Entity Codes (Database icon)
- Customer profiles
- Vendor profiles  
- Product catalogs
- Employee records
- GL accounts

### Transaction Codes (CreditCard icon)
- Sales orders
- Purchase orders
- Payments
- Journal entries
- Appointments

### Finance Codes (DollarSign icon)
- GL postings
- Tax calculations
- Currency conversions
- Financial reports

### CRM Codes (Users icon)
- Lead management
- Contact management
- Opportunity tracking
- Campaign management

### Inventory Codes (Package icon)
- Stock movements
- Product management
- Warehouse operations
- Cost tracking

---

## 🔧 Advanced Features

### Custom Code Entry
```typescript
<SmartCodePicker
  allowCustom={true}
  onChange={(code, smartCode) => {
    if (smartCode.name === 'Custom Code') {
      // Handle custom user-defined code
      console.log('Custom code entered:', code)
    }
  }}
/>
```

### Recent Codes Tracking
The component automatically tracks recently used codes:
```typescript
// Codes are marked with lastUsed timestamp
{
  code: 'HERA.CRM.CUST.ENT.PROF.v1',
  metadata: {
    lastUsed: '2024-01-15T10:30:00Z'
  }
}
```

### Popular Codes Analytics
Popular codes are identified by usage count:
```typescript
// Codes are marked with usage statistics
{
  code: 'HERA.FIN.SALE.TXN.INV.v1',
  metadata: {
    usageCount: 1250
  }
}
```

### Code Parsing Utility
```typescript
const parseSmartCode = (code: string) => {
  const parts = code.split('.')
  return {
    system: parts[0],    // HERA
    industry: parts[1],  // REST, SALON, CRM, etc.
    module: parts[2],    // CRM, FIN, INV, etc.
    function: parts[3],  // CUST, VEND, SALE, etc.
    type: parts[4],      // ENT, TXN, RPT, etc.
    variant: parts[5]    // PROF, STD, etc. + version
  }
}

// Usage
const parsed = parseSmartCode('HERA.REST.SALE.TXN.ORDER.v1')
console.log(parsed.industry) // 'REST'
console.log(parsed.type)     // 'TXN'
```

---

## 📱 Mobile Optimization

### Touch-Friendly Interface
- Large touch targets (44px minimum)
- Swipe-friendly category navigation
- Modal dialog for small screens
- Optimized keyboard on mobile

### Responsive Behavior
- Compact layout on small screens
- Stacked filters on mobile
- Full-screen dialog mode
- Touch-optimized scrolling

---

## 🔌 Integration Examples

### Form Integration
```typescript
import { useForm } from 'react-hook-form'

const MyForm = () => {
  const { setValue, watch } = useForm()
  const smartCode = watch('smartCode')
  
  return (
    <form>
      <SmartCodePicker
        value={smartCode}
        onChange={(code) => setValue('smartCode', code)}
        label="Business Classification"
        required={true}
      />
    </form>
  )
}
```

### Table Column Integration
```typescript
<Table>
  <TableRow>
    <TableCell>
      <SmartCodePicker
        value={row.smartCode}
        onChange={(code) => updateRow(row.id, { smartCode: code })}
        mode="inline"
        showSearch={false}
        className="w-full"
      />
    </TableCell>
  </TableRow>
</Table>
```

### Dynamic Module Filtering
```typescript
const [selectedModule, setSelectedModule] = useState('')

<SmartCodePicker
  module={selectedModule}
  onChange={(code, smartCode) => {
    // Update both the selected code and module filter
    setSelectedCode(code)
    setSelectedModule(smartCode.module)
  }}
/>
```

---

## 🧪 Testing

### Unit Testing
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react'
import { SmartCodePicker } from '@/lib/dna/components/smart-code'

test('selects smart code and calls onChange', async () => {
  const onChange = jest.fn()
  
  const { getByText, getByPlaceholderText } = render(
    <SmartCodePicker onChange={onChange} />
  )
  
  // Open picker
  fireEvent.click(getByPlaceholderText('Select smart code...'))
  
  // Select a code
  fireEvent.click(getByText('Customer Profile Entity'))
  
  expect(onChange).toHaveBeenCalledWith(
    'HERA.CRM.CUST.ENT.PROF.v1',
    expect.objectContaining({
      name: 'Customer Profile Entity'
    })
  )
})
```

### Integration Testing
```typescript
test('filters codes by industry', async () => {
  const { getByText, queryByText } = render(
    <SmartCodePicker
      industry="restaurant"
      onChange={jest.fn()}
    />
  )
  
  // Should show restaurant codes
  expect(getByText('Restaurant Order')).toBeInTheDocument()
  
  // Should not show non-restaurant codes
  expect(queryByText('Salon Appointment')).not.toBeInTheDocument()
})
```

---

## 🚀 Performance

### Optimization Features
- Virtualized scrolling for large code lists
- Memoized filtering and grouping
- Debounced search input
- Lazy loading of code categories

### Code Registry Caching
```typescript
// In production, implement code registry caching
const useSmartCodes = (industry?: string) => {
  return useQuery({
    queryKey: ['smart-codes', industry],
    queryFn: () => fetchSmartCodes(industry),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000  // 30 minutes
  })
}
```

---

## 🔍 Troubleshooting

### Common Issues

1. **No codes displayed**
   - Check industry/module filters
   - Verify smart code data source
   - Check console for loading errors

2. **Custom codes not working**
   - Ensure `allowCustom={true}`
   - Validate custom code format
   - Check onChange handler

3. **Search not working**
   - Verify `showSearch={true}`
   - Check search term length
   - Validate filtering logic

### Debug Mode
```typescript
<SmartCodePicker
  onChange={(code, smartCode) => {
    console.log('Selection:', { code, smartCode })
    // Your handler
  }}
  // Add debug logging
  onSearch={(searchTerm) => {
    console.log('Search:', searchTerm)
  }}
/>
```

---

## 🎯 Best Practices

1. **Always Provide Context**
   ```typescript
   // Good: Industry-specific filtering
   <SmartCodePicker industry="restaurant" module="sales" />
   
   // Avoid: Too broad without context
   <SmartCodePicker />
   ```

2. **Use Descriptive Labels**
   ```typescript
   <SmartCodePicker
     label="Transaction Classification"
     placeholder="Select how this transaction should be classified..."
   />
   ```

3. **Handle Selection Changes**
   ```typescript
   <SmartCodePicker
     onChange={(code, smartCode) => {
       // Always handle both code string and object
       setFormData({
         ...formData,
         smartCode: code,
         smartCodeName: smartCode.name
       })
     }}
   />
   ```

4. **Provide Feedback**
   ```typescript
   <SmartCodePicker
     onChange={(code, smartCode) => {
       toast({
         title: 'Smart Code Selected',
         description: `${smartCode.name} (${code})`
       })
     }}
   />
   ```

---

This SmartCodePicker component provides a comprehensive solution for managing HERA's intelligent business classification system, enabling precise categorization and context for all business operations while maintaining excellent user experience across all device types.