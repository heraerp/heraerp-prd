# HERA DNA EntityQuickView Component

The EntityQuickView component provides instant, contextual previews of entity information through hover or long-press interactions, enhancing user productivity by eliminating the need for constant page navigation.

## Overview

EntityQuickView is an enterprise-grade component that displays entity details in a floating preview window. It supports all HERA entity types (customer, vendor, product, GL account, etc.) and provides smart positioning, lazy loading, and comprehensive keyboard/touch support.

## Features

### Core Capabilities
- **Universal Entity Support**: Works with any entity type in the HERA system
- **Smart Positioning**: Automatically positions to avoid viewport edges
- **Lazy Data Loading**: Fetches entity data only when needed
- **Rich Information Display**: Shows key fields, recent transactions, and related entities
- **Keyboard Navigation**: Full accessibility with Enter/Space/Escape keys
- **Mobile Touch Support**: Long-press activation for touch devices
- **Portal Rendering**: Ensures proper z-index layering

### Visual Design
- **HERA DNA Glassmorphism**: Consistent with HERA's premium design language
- **Smooth Animations**: Fade-in effects with position-aware origin
- **Loading States**: Skeleton screens during data fetching
- **Entity Type Indicators**: Color-coded icons for quick recognition
- **Smart Code Display**: Shows entity classification codes
- **Dark Mode Support**: Seamless theme switching

## Usage

### Basic Example

```tsx
import { EntityQuickView } from '@/lib/dna/components/entity/EntityQuickView'

function CustomerList() {
  return (
    <div className="space-y-2">
      {customers.map((customer) => (
        <EntityQuickView
          key={customer.id}
          entity={customer}
          onAction={(action, entity) => {
            if (action === 'view') {
              router.push(`/customers/${entity.id}`)
            }
          }}
        >
          <div className="p-4 cursor-pointer hover:bg-gray-50">
            {customer.entity_name}
          </div>
        </EntityQuickView>
      ))}
    </div>
  )
}
```

### With Entity ID

```tsx
// Pass just the entity ID - component will fetch data
<EntityQuickView entity="entity-uuid-here">
  <button>Hover to preview</button>
</EntityQuickView>
```

### Custom Content Renderer

```tsx
<EntityQuickView
  entity={product}
  renderContent={(entity) => (
    <>
      <EntityQuickViewHeader>
        <h3>{entity.entity_name}</h3>
        <p>SKU: {entity.dynamic_fields?.sku}</p>
      </EntityQuickViewHeader>
      
      <EntityQuickViewBody>
        <div>Price: {formatCurrency(entity.dynamic_fields?.price)}</div>
        <div>Stock: {entity.dynamic_fields?.stock_quantity} units</div>
      </EntityQuickViewBody>
      
      <EntityQuickViewFooter>
        <button onClick={() => addToCart(entity.id)}>
          Add to Cart
        </button>
      </EntityQuickViewFooter>
    </>
  )}
>
  <ProductCard product={product} />
</EntityQuickView>
```

### With Configuration Options

```tsx
<EntityQuickView
  entity={vendor}
  delay={300}                    // Show after 300ms hover
  position="right"               // Force right positioning
  maxWidth={500}                 // Wider preview window
  showTransactions={true}        // Include recent transactions
  showRelated={true}             // Include related entities
  showActions={true}             // Show quick action buttons
  onShow={() => trackEvent('vendor_preview')}
  onHide={() => console.log('Preview closed')}
  onAction={(action, entity) => {
    if (action === 'edit') {
      openEditModal(entity)
    }
  }}
>
  <VendorRow vendor={vendor} />
</EntityQuickView>
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entity` | `string \| Partial<EntityData>` | Required | Entity ID or entity object |
| `children` | `React.ReactElement` | Required | Trigger element |
| `delay` | `number` | `500` | Milliseconds before showing preview |
| `renderContent` | `(entity: EntityData) => ReactNode` | - | Custom content renderer |
| `position` | `'auto' \| 'top' \| 'bottom' \| 'left' \| 'right'` | `'auto'` | Positioning strategy |
| `onShow` | `() => void` | - | Callback when preview appears |
| `onHide` | `() => void` | - | Callback when preview disappears |
| `onAction` | `(action: string, entity: EntityData) => void` | - | Action button callback |
| `className` | `string` | - | Additional CSS classes |
| `maxWidth` | `number` | `400` | Maximum preview width in pixels |
| `showTransactions` | `boolean` | `true` | Show recent transactions |
| `showRelated` | `boolean` | `true` | Show related entities |
| `showActions` | `boolean` | `true` | Show action buttons |

### Entity Configuration

The component automatically configures display based on entity type:

```typescript
const ENTITY_CONFIG = {
  customer: {
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    fields: ['email', 'phone', 'credit_limit', 'payment_terms'],
    label: 'Customer'
  },
  vendor: {
    icon: Building2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    fields: ['email', 'phone', 'payment_terms', 'tax_id'],
    label: 'Vendor'
  },
  product: {
    icon: Package,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    fields: ['sku', 'price', 'cost', 'stock_quantity'],
    label: 'Product'
  },
  gl_account: {
    icon: FileText,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    fields: ['account_number', 'account_type', 'balance', 'currency'],
    label: 'GL Account'
  }
}
```

## Keyboard Support

| Key | Action |
|-----|--------|
| `Enter` or `Space` | Toggle preview visibility |
| `Escape` | Close preview if open |
| `Tab` | Navigate to/from trigger element |

## Touch Support

- **Long Press**: Press and hold for 500ms to show preview
- **Tap Away**: Tap anywhere outside to close preview

## Performance Considerations

1. **Lazy Loading**: Entity data is only fetched when preview is triggered
2. **Data Caching**: Consider implementing caching for frequently viewed entities
3. **Debounced Positioning**: Position updates are optimized during scroll/resize
4. **Portal Rendering**: Prevents unnecessary re-renders of parent components

## Accessibility

- Full keyboard navigation support
- ARIA labels and descriptions
- Focus management
- Screen reader announcements
- Reduced motion support

## Customization

### Custom Entity Types

Add support for custom entity types by extending the configuration:

```tsx
// In your app
const CUSTOM_ENTITY_CONFIG = {
  ...ENTITY_CONFIG,
  employee: {
    icon: UserCheck,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    fields: ['department', 'position', 'hire_date', 'manager'],
    label: 'Employee'
  }
}
```

### Styling

The component uses Tailwind classes and can be customized via:
- The `className` prop for the container
- CSS variables for theme customization
- Custom content renderer for complete control

## Best Practices

1. **Use Entity Objects When Available**: Pass the full entity object to avoid extra API calls
2. **Implement Action Handlers**: Provide meaningful actions for view/edit buttons
3. **Configure Appropriate Delays**: Shorter delays for critical UIs, longer for casual browsing
4. **Optimize Data Fetching**: Consider implementing caching for frequently accessed entities
5. **Provide Loading States**: Ensure users see loading feedback during data fetch

## Integration Examples

### In Data Tables

```tsx
<Table>
  <TableBody>
    {entities.map((entity) => (
      <TableRow key={entity.id}>
        <TableCell>
          <EntityQuickView entity={entity}>
            <span className="cursor-help underline-dotted">
              {entity.entity_name}
            </span>
          </EntityQuickView>
        </TableCell>
        <TableCell>{entity.entity_type}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### In Cards

```tsx
<EntityQuickView 
  entity={customer}
  position="auto"
  showActions={false}
>
  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
    <CardContent>
      <h3>{customer.entity_name}</h3>
      <p>Click for details</p>
    </CardContent>
  </Card>
</EntityQuickView>
```

### In Navigation

```tsx
<nav>
  {recentEntities.map((entity) => (
    <EntityQuickView
      key={entity.id}
      entity={entity}
      delay={200}
      position="right"
    >
      <NavLink href={`/entities/${entity.id}`}>
        {entity.entity_name}
      </NavLink>
    </EntityQuickView>
  ))}
</nav>
```

## Migration Guide

If migrating from tooltip-based previews:

```tsx
// Before
<Tooltip content={<CustomerInfo customer={customer} />}>
  <span>{customer.name}</span>
</Tooltip>

// After
<EntityQuickView entity={customer}>
  <span>{customer.entity_name}</span>
</EntityQuickView>
```

## Troubleshooting

### Preview not showing
- Check that the trigger element can receive events
- Ensure `entity` prop is valid (ID string or entity object)
- Verify no parent elements are preventing events

### Position issues
- Component automatically handles viewport constraints
- For fixed positioning needs, use the `position` prop
- Check z-index conflicts with other floating elements

### Performance issues
- Implement caching for frequently viewed entities
- Use `showTransactions={false}` and `showRelated={false}` for better performance
- Consider increasing the `delay` prop value