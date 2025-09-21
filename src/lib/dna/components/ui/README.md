# HERA DNA UI Component Library

Enterprise-grade UI component library with modern glassmorphism design, dark mode support, and seamless integration with HERA DNA hooks.

## 🎨 Design Philosophy

HERA DNA UI components follow these core principles:

- **Glassmorphism First**: Modern transparent design with backdrop blur effects
- **Dark Mode Native**: Every component works perfectly in both light and dark themes
- **Hook Integration**: Components are designed to work seamlessly with HERA DNA hooks
- **Smart Code Driven**: Every component has a unique smart code for tracking and reusability
- **Enterprise Ready**: Production-tested with accessibility and performance optimizations

## 🚀 Quick Start

```typescript
import {
  CardDNA,
  PrimaryButtonDNA,
  FormFieldDNA,
  EntityCardGlass,
  HERA_GLASS_THEME
} from '@/src/lib/dna/components/ui/hera-dna-ui-registry'

import {
  useCreateEntity,
  useReadEntities
} from '@/src/lib/dna/hooks/hera-dna-hook-registry'

// Use components with hooks
function MyComponent() {
  const createEntity = useCreateEntity()
  const readEntities = useReadEntities()

  return (
    <CardDNA title="Customers" variant="primary">
      {/* Component content */}
    </CardDNA>
  )
}
```

## 📦 Component Categories

### Layout Components

#### PageHeaderDNA

**Smart Code**: `HERA.DNA.UI.HEADER.GLASS.v1`  
**Linked Hook**: `useHERAAuth`

Page headers with gradient backgrounds, back navigation, and action buttons.

```typescript
<PageHeaderDNA
  title="Customer Management"
  subtitle="Manage your customer database"
  icon={Users}
  actions={
    <PrimaryButtonDNA icon={Plus}>Add Customer</PrimaryButtonDNA>
  }
/>
```

#### HERAGradientBackground

**Smart Code**: `HERA.DNA.UI.BACKGROUND.GRADIENT.v1`

Animated gradient backgrounds for visual appeal.

```typescript
<HERAGradientBackground>
  <YourContent />
</HERAGradientBackground>
```

### Card Components

#### CardDNA (Base Card)

**Smart Code**: `HERA.DNA.UI.CARD.GLASS.v1`  
**Linked Hook**: `useReadEntities`

Enhanced cards with glassmorphism effects, hover states, and icons.

```typescript
<CardDNA
  title="Sales Overview"
  icon={DollarSign}
  variant="default" // default | info | success | warning | danger
>
  <p>Card content goes here</p>
</CardDNA>
```

#### EntityCardGlass

**Smart Code**: `HERA.DNA.UI.ENTITY.CARD.GLASS.v1`  
**Linked Hooks**: `useReadEntities` + `useGetDynamicFields`

Specialized glassmorphism card for displaying entities with dynamic fields.

```typescript
const entity = {
  id: '123',
  entity_type: 'customer',
  entity_name: 'Acme Corp',
  entity_code: 'CUST-001',
  smart_code: 'HERA.CRM.CUST.ENT.PROF.v1'
}

const dynamicFields = {
  email: 'contact@acme.com',
  phone: '+1234567890',
  credit_limit: '$50,000'
}

<EntityCardGlass
  entity={entity}
  dynamicFields={dynamicFields}
  icon={User}
  variant="primary"
  onClick={() => router.push(`/customers/${entity.id}`)}
  actions={
    <>
      <GhostButtonDNA icon={Edit} size="sm" />
      <GhostButtonDNA icon={Phone} size="sm" />
    </>
  }
/>
```

### Form Components

#### FormFieldDNA

**Smart Code**: `HERA.DNA.UI.FORM.FIELD.v1`  
**Linked Hooks**: `useCreateEntity`, `useUpdateEntity`

Complete form field with label, icon, helper text, and error states.

```typescript
// Text input
<FormFieldDNA
  type="text"
  label="Customer Name"
  value={name}
  onChange={setName}
  placeholder="Enter customer name"
  icon={User}
  helper="Full legal name required"
/>

// Select dropdown
<FormFieldDNA
  type="select"
  label="Status"
  value={status}
  onChange={setStatus}
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]}
/>

// Textarea
<FormFieldDNA
  type="textarea"
  label="Notes"
  value={notes}
  onChange={setNotes}
  rows={4}
  placeholder="Add any additional notes..."
/>
```

### PageHeaderDNA

Consistent page headers with gradient backgrounds, back navigation, and action buttons.

```typescript
<PageHeaderDNA
  title="Appointment Details"
  subtitle="#APT-123456"
  icon={Calendar}
  backUrl="/appointments"
  actions={
    <>
      <ButtonDNA icon={Edit}>Edit</ButtonDNA>
      <ButtonDNA icon={Trash2} variant="danger">Delete</ButtonDNA>
    </>
  }
/>
```

### CardDNA

Enhanced cards with hover effects, icons, and proper dark mode borders.

```typescript
<CardDNA
  title="Customer Details"
  icon={User}
  iconColor="text-violet-600 dark:text-violet-400"
  iconBgColor="bg-violet-100 dark:bg-violet-900"
>
  <p>Card content goes here...</p>
</CardDNA>

// Preset variants
<InfoCardDNA title="Information">...</InfoCardDNA>
<SuccessCardDNA title="Success">...</SuccessCardDNA>
<WarningCardDNA title="Warning">...</WarningCardDNA>
<DangerCardDNA title="Error">...</DangerCardDNA>
```

### ButtonDNA

Buttons with loading states, icons, and consistent styling.

```typescript
<ButtonDNA
  icon={Save}
  loading={saving}
  loadingText="Saving..."
  onClick={handleSave}
>
  Save Changes
</ButtonDNA>

// Preset variants
<PrimaryButtonDNA icon={Plus}>Create New</PrimaryButtonDNA>
<SecondaryButtonDNA icon={ArrowLeft}>Back</SecondaryButtonDNA>
<DangerButtonDNA icon={Trash2}>Delete</DangerButtonDNA>
<GhostButtonDNA icon={MoreVertical} />
```

### BadgeDNA

Enhanced badges with proper contrast in dark mode.

```typescript
<BadgeDNA variant="success" icon={CheckCircle}>
  Completed
</BadgeDNA>

// Preset variants
<SuccessBadgeDNA>Active</SuccessBadgeDNA>
<WarningBadgeDNA>Pending</WarningBadgeDNA>
<DangerBadgeDNA>Overdue</DangerBadgeDNA>
<InfoBadgeDNA>Draft</InfoBadgeDNA>
```

### ScrollAreaDNA

Scroll areas with enhanced visible scrollbars in both light and dark modes.

```typescript
<ScrollAreaDNA height="h-96">
  {/* Long content */}
</ScrollAreaDNA>

// With custom dimensions
<ScrollAreaDNA height={400} width={300}>
  {/* Content */}
</ScrollAreaDNA>
```

## 🎨 Design Principles

1. **Dark Mode First**: Every component has proper dark mode support built-in
2. **Accessible Contrast**: Text and background colors meet WCAG AA standards
3. **Consistent Styling**: Use HERA brand colors (violet/pink gradients)
4. **Enhanced Visibility**: Scrollbars, icons, and disabled states are always visible
5. **Zero Configuration**: Components work perfectly out of the box

## 🔧 Common Patterns

### Form Page

```typescript
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <PageHeaderDNA
    title="Edit Customer"
    icon={User}
    backUrl="/customers"
  />

  <div className="container mx-auto px-6 py-6">
    <CardDNA>
      <div className="space-y-4">
        <FormFieldDNA
          type="text"
          label="Name"
          value={name}
          onChange={setName}
          icon={User}
        />

        <FormFieldDNA
          type="email"
          label="Email"
          value={email}
          onChange={setEmail}
          icon={Mail}
        />

        <ButtonDNA icon={Save} loading={saving}>
          Save Changes
        </ButtonDNA>
      </div>
    </CardDNA>
  </div>
</div>
```

### List Page with Filters

```typescript
<div className="space-y-4">
  <CardDNA title="Filters" icon={Filter}>
    <div className="grid grid-cols-3 gap-4">
      <FormFieldDNA
        type="text"
        label="Search"
        value={search}
        onChange={setSearch}
        icon={Search}
      />

      <FormFieldDNA
        type="select"
        label="Status"
        value={status}
        onChange={setStatus}
        options={statusOptions}
      />

      <FormFieldDNA
        type="date"
        label="Date"
        value={date}
        onChange={setDate}
      />
    </div>
  </CardDNA>

  <ScrollAreaDNA height="h-[600px]">
    {items.map(item => (
      <CardDNA key={item.id} hoverable onClick={() => handleClick(item)}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {item.description}
            </p>
          </div>
          <BadgeDNA variant={item.status}>
            {item.statusLabel}
          </BadgeDNA>
        </div>
      </CardDNA>
    ))}
  </ScrollAreaDNA>
</div>
```

## 🚨 Important Notes

1. **Always import from the DNA components** - Don't use raw shadcn components
2. **Use preset variants** when available (InfoCardDNA, SuccessBadgeDNA, etc.)
3. **ScrollAreaDNA styles** are included in globals.css automatically
4. **Select dropdowns** automatically get the `hera-select-content` class
5. **Form validation** - Pass `error` prop to FormFieldDNA for error states

### Stat Card Components

#### StatCardDNA

**Smart Code**: `HERA.DNA.UI.STAT.CARD.v1`  
**Linked Hook**: `useReadEntities`

Statistics display cards with trend indicators.

```typescript
import { StatCardDNA, StatCardGrid } from '@/src/lib/dna/components/ui/hera-dna-ui-registry'

<StatCardGrid>
  <StatCardDNA
    title="Total Revenue"
    value="$125,000"
    icon={DollarSign}
    trend="+12.5%"
    trendUp
  />
  <StatCardDNA
    title="Customers"
    value="1,234"
    icon={Users}
    trend="+5.2%"
    trendUp
  />
</StatCardGrid>
```

#### MiniStatCardDNA

**Smart Code**: `HERA.DNA.UI.STAT.MINI.v1`

Compact statistics cards for dashboards.

```typescript
<MiniStatCardDNA
  label="Active Users"
  value="2,345"
  icon={<Users className="h-4 w-4" />}
  trend={{ value: '+12%', isPositive: true }}
/>
```

### Mobile Components

#### BottomSheet

**Smart Code**: `HERA.DNA.UI.MOBILE.SHEET.v1`

Mobile-optimized bottom sheet for filters and actions.

```typescript
<BottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Filter Options"
>
  {/* Sheet content */}
</BottomSheet>
```

## 🎨 Glassmorphism Utilities

### Glass Card Classes

**Smart Code**: `HERA.DNA.UI.UTIL.GLASS.v1`

```typescript
import { glassCardClasses } from '@/src/lib/dna/components/ui/hera-dna-ui-registry'

const cardClass = glassCardClasses('primary')
// Returns: "rounded-lg transition-all duration-200 bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-xl border-violet-500/20 shadow-md shadow-black/10"

// Variants: default | primary | success | warning | danger | info
```

### Theme Constants

```typescript
import { HERA_GLASS_THEME } from '@/src/lib/dna/components/ui/hera-dna-ui-registry'

// Glass backgrounds
HERA_GLASS_THEME.glass.primary // "bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-xl"
HERA_GLASS_THEME.glass.success // "bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-xl"

// Borders
HERA_GLASS_THEME.border.primary // "border border-violet-500/20"

// Shadows
HERA_GLASS_THEME.shadow.lg // "shadow-lg shadow-black/15"
```

## 🔗 Hook Integration Patterns

### Entity List Pattern

**Smart Code**: `HERA.DNA.UI.PATTERN.ENTITY.LIST.v1`

```typescript
import {
  CardDNA,
  ScrollAreaDNA,
  EntityCardGlass,
  BadgeDNA
} from '@/src/lib/dna/components/ui/hera-dna-ui-registry'
import {
  useReadEntities,
  useGetDynamicFields
} from '@/src/lib/dna/hooks/hera-dna-hook-registry'

function CustomerList() {
  const readEntities = useReadEntities()
  const getDynamicFields = useGetDynamicFields()
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    const loadData = async () => {
      const result = await readEntities({ entity_type: 'customer' })
      if (result.data) setCustomers(result.data)
    }
    loadData()
  }, [])

  return (
    <CardDNA title="Customers" icon={Users}>
      <ScrollAreaDNA height="h-96">
        {customers.map(customer => (
          <EntityCardGlass
            key={customer.id}
            entity={customer}
            icon={User}
            variant="primary"
            onClick={() => handleCustomerClick(customer.id)}
          />
        ))}
      </ScrollAreaDNA>
    </CardDNA>
  )
}
```

### Entity Form Pattern

**Smart Code**: `HERA.DNA.UI.PATTERN.ENTITY.FORM.v1`

```typescript
function CustomerForm() {
  const createEntity = useCreateEntity()
  const setDynamicField = useSetDynamicField()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  const handleSubmit = async () => {
    const result = await createEntity({
      entity_type: 'customer',
      entity_name: formData.name,
      smart_code: 'HERA.CRM.CUST.ENT.PROF.v1'
    })

    if (result.data) {
      await setDynamicField(result.data.id, 'email', formData.email)
      await setDynamicField(result.data.id, 'phone', formData.phone)
    }
  }

  return (
    <CardDNA title="New Customer" icon={UserPlus}>
      <div className="space-y-4">
        <FormFieldDNA
          type="text"
          label="Name"
          value={formData.name}
          onChange={(value) => setFormData({...formData, name: value})}
          icon={User}
        />
        <FormFieldDNA
          type="email"
          label="Email"
          value={formData.email}
          onChange={(value) => setFormData({...formData, email: value})}
          icon={Mail}
        />
        <PrimaryButtonDNA onClick={handleSubmit} icon={Save}>
          Create Customer
        </PrimaryButtonDNA>
      </div>
    </CardDNA>
  )
}
```

## 🌓 Dark Mode Support

All components automatically support dark mode through Tailwind's dark mode classes:

```typescript
import { ThemeProviderDNA } from '@/src/lib/dna/components/ui/hera-dna-ui-registry'

// Wrap your app
<ThemeProviderDNA>
  <App />
</ThemeProviderDNA>
```

## 📱 Responsive Design

All components are mobile-first and responsive:

- Cards stack on mobile, grid on desktop
- Forms adapt to screen size
- Modals become full-screen on mobile
- Bottom sheets for mobile interactions

## 🎯 Best Practices

1. **Always use smart codes** for tracking and analytics
2. **Pair UI components with appropriate hooks** for data operations
3. **Use variant props** for consistent styling across the app
4. **Apply glassmorphism utilities** for custom components
5. **Test in both light and dark modes**
6. **Ensure accessibility** with proper ARIA labels and keyboard navigation

## 🚀 Performance Tips

1. **Lazy load** heavy components
2. **Use ScrollAreaDNA** for long lists to improve performance
3. **Implement virtualization** for very large datasets
4. **Memoize** expensive computations in stat cards
5. **Use loading states** to improve perceived performance

## 📚 Complete Example: Customer Management Page

```typescript
import { useState, useEffect } from 'react'
import {
  PageHeaderDNA,
  CardDNA,
  EntityCardGlass,
  FormFieldDNA,
  PrimaryButtonDNA,
  ScrollAreaDNA,
  StatCardGrid,
  StatCardDNA
} from '@/src/lib/dna/components/ui/hera-dna-ui-registry'
import {
  useReadEntities,
  useCreateEntity,
  useEntityStats
} from '@/src/lib/dna/hooks/hera-dna-hook-registry'
import { Users, UserPlus, Search, DollarSign } from 'lucide-react'

export default function CustomerManagementPage() {
  const readEntities = useReadEntities()
  const createEntity = useCreateEntity()
  const getStats = useEntityStats()

  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeaderDNA
        title="Customer Management"
        subtitle="Manage your customer relationships"
        icon={Users}
        actions={
          <PrimaryButtonDNA
            icon={UserPlus}
            onClick={() => setShowAddForm(true)}
          >
            Add Customer
          </PrimaryButtonDNA>
        }
      />

      <StatCardGrid>
        <StatCardDNA
          title="Total Customers"
          value="1,234"
          icon={Users}
          trend="+5.2%"
          trendUp
        />
        <StatCardDNA
          title="Revenue"
          value="$125,000"
          icon={DollarSign}
          trend="+12.5%"
          trendUp
        />
      </StatCardGrid>

      <CardDNA title="Customer List" icon={Users}>
        <FormFieldDNA
          type="text"
          label="Search"
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search customers..."
          icon={Search}
          className="mb-4"
        />

        <ScrollAreaDNA height="h-96">
          {customers
            .filter(c => c.entity_name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(customer => (
              <EntityCardGlass
                key={customer.id}
                entity={customer}
                icon={User}
                variant="primary"
                className="mb-3"
              />
            ))}
        </ScrollAreaDNA>
      </CardDNA>
    </div>
  )
}
```

## 📖 Additional Resources

- [HERA DNA Hooks Documentation](../hooks/README.md)
- [Theme System Guide](../../../docs/HERA-THEME-SYSTEM.md)
- [HERA Universal Architecture](../../../docs/UNIVERSAL-ARCHITECTURE.md)
- [Smart Code Reference](../../../docs/SMART-CODES.md)

## 🔄 Migration Guide

Replace existing components for glassmorphism upgrade:

- `Input` → `FormFieldDNA` with glassmorphism
- `Select` → `FormFieldDNA with type="select"`
- `Card` → `CardDNA` with glass effects
- `Badge` → `BadgeDNA` with enhanced contrast
- `Button` → `ButtonDNA` variants with gradients
- `ScrollArea` → `ScrollAreaDNA` with visible scrollbars
- Standard cards → `EntityCardGlass` for entity display

This ensures consistent glassmorphism styling and dark mode support across your entire application.
