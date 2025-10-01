# HERA UI Library

A comprehensive React component library for building HERA Universal API applications with dynamic theming, form generation, and data visualization.

## Quick Start

```tsx
import { HeraProvider, HeraThemeProvider, useEntities, DataTable } from '@/ui';

function App() {
  const orgId = 'your-org-id';
  
  return (
    <HeraProvider orgId={orgId}>
      <HeraThemeProvider orgId={orgId}>
        <YourApp />
      </HeraThemeProvider>
    </HeraProvider>
  );
}

function YourApp() {
  const { data: customers } = useEntities({ entity_type: 'customer' });
  
  return (
    <DataTable
      data={customers || []}
      columns={[
        { key: 'entity_code', label: 'Code' },
        { key: 'entity_name', label: 'Name' },
      ]}
    />
  );
}
```

## Core Components

### Providers

- **HeraProvider** - Main context provider for organization ID and API base URL
- **HeraThemeProvider** - Dynamic theming with automatic CSS variable application

### Data Hooks

```tsx
// Query entities
const { data, isLoading } = useEntities({ entity_type: 'customer' });

// Query transactions
const { data } = useTransactions({ transaction_type: 'sale' });

// Create transaction
const createTxn = useCreateTransaction();
await createTxn.mutateAsync({ 
  transactionType: 'sale',
  header: { total_amount: 100 },
  lines: [{ line_amount: 100 }]
});

// Dynamic fields
const { data } = useDynamicFields(entityId);
const setField = useSetDynamicField();
```

### UI Components

#### DataTable
```tsx
<DataTable
  data={items}
  columns={[
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name', 
      render: (val, row) => <strong>{val}</strong> },
  ]}
  onRowClick={(row) => console.log(row)}
  actions={[
    { label: 'Edit', onClick: (row) => editItem(row) },
    { label: 'Delete', onClick: (row) => deleteItem(row), variant: 'danger' },
  ]}
/>
```

#### FilterBar
```tsx
<FilterBar
  filters={[
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by name...',
    },
  ]}
  value={filters}
  onChange={setFilters}
/>
```

#### ObjectHeader
```tsx
<ObjectHeader
  title="Customer Details"
  subtitle="CUST-001 • Active"
  breadcrumbs={[
    { label: 'Customers', href: '/customers' },
    { label: 'CUST-001' },
  ]}
  actions={[
    { label: 'Edit', onClick: () => {} },
    { label: 'Delete', onClick: () => {}, variant: 'danger' },
  ]}
/>
```

#### CardKpi
```tsx
<CardKpi
  label="Total Revenue"
  value="$125,432"
  trend="+12.5%"
  icon={HiCurrencyDollar}
/>
```

### Form Components

#### WizardForm
```tsx
// Automatically generates forms from smart codes
<WizardForm 
  smartCode="HERA.SALON.SVC.TXN.SERVICE.V1"
  transactionType="service"
/>
```

#### LinesEditor
```tsx
// For editing transaction lines
<LinesEditor
  lines={lines}
  onChange={setLines}
  columns={[
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'quantity', label: 'Qty', type: 'number' },
    { key: 'unit_price', label: 'Price', type: 'number' },
  ]}
/>
```

### Theme System

#### ThemePicker
```tsx
// Complete theme customization UI
<ThemePicker />
```

#### CSS Variables
The theme system sets these CSS variables that can be used in Tailwind:

```css
--hera-primary: RGB values for primary color
--hera-bg: Background color
--hera-surface: Surface/card color
--hera-text: Primary text color
--hera-muted: Muted text color
--hera-success: Success color
--hera-warning: Warning color
--hera-danger: Danger color
--hera-radius: Border radius in px
--hera-font-sans: Sans-serif font stack
--hera-font-mono: Monospace font stack
```

Use in Tailwind like:
```tsx
<div className="bg-[color:rgb(var(--hera-primary)/1)] text-black">
  Primary background
</div>

<div className="bg-[color:rgb(var(--hera-surface)/1)] rounded-[var(--hera-radius)]">
  Surface card with theme radius
</div>
```

## Architecture

- **React Query** for server state management
- **CSS Variables** for runtime theme switching
- **UCR Integration** for dynamic form generation
- **TypeScript** for full type safety
- **Tailwind CSS** for utility-first styling

## Examples

See the `/src/_examples/` directory for complete examples:
- `theme-demo/` - Full theme system showcase
- `dashboard/` - Dashboard with all components
- `wizard-form/` - Dynamic form generation
- `settings/theme/` - Theme customization page