# Salon Luxe CRUD Pattern Guide

## Overview

The Salon Luxe CRUD pattern provides a consistent, enterprise-grade design for all salon management pages. It includes:

- **Luxe Theme**: Gold/bronze/charcoal color scheme with glassmorphism effects
- **Universal Entity Integration**: Works with HERA's 6-table architecture
- **Permission-Based Actions**: Role-based create/edit/delete controls
- **Search & Filtering**: Built-in search and status filters
- **Modal-Based Forms**: Clean create/edit experience
- **Responsive Design**: Works on all devices

## Quick Start

### 1. Simple Implementation

```typescript
import { SalonLuxeCRUDPage } from '@/lib/dna/patterns/salon-luxe-crud-pattern'
import { SalonLuxeCard } from '@/lib/dna/patterns/salon-luxe-card'
import { Package } from 'lucide-react'

export default function ProductsPage() {
  const PRODUCT_PRESET = {
    smart_code: 'HERA.SALON.PRODUCT.ENTITY.ITEM.V1',
    dynamicFields: [
      { field_name: 'name', field_type: 'text', smart_code: 'HERA.SALON.PRODUCT.DYN.NAME.V1' },
      { field_name: 'price', field_type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.V1' },
      { field_name: 'status', field_type: 'text', smart_code: 'HERA.SALON.PRODUCT.DYN.STATUS.V1' }
    ]
  }
  
  return (
    <SalonLuxeCRUDPage
      title="Products"
      entityType="PRODUCT"
      preset={PRODUCT_PRESET}
      icon={Package}
      renderCard={(product, handlers) => (
        <SalonLuxeCard
          title={product.dynamic_fields?.name?.value || product.entity_name}
          badges={[
            { label: 'Price', value: `$${product.dynamic_fields?.price?.value || 0}` }
          ]}
          status={product.dynamic_fields?.status?.value || 'active'}
          onEdit={handlers.onEdit}
          onArchive={handlers.onArchive}
          canEdit={handlers.canEdit}
          canDelete={handlers.canDelete}
        />
      )}
    />
  )
}
```

### 2. Advanced Implementation with Custom Logic

```typescript
export default function ServicesPage() {
  return (
    <SalonLuxeCRUDPage
      title="Services"
      description="Manage your salon service menu"
      entityType="SERVICE"
      preset={SERVICE_PRESET}
      icon={Scissors}
      
      // Custom permissions
      createPermissions={['salon:services:create', 'owner', 'manager']}
      editPermissions={['salon:services:edit', 'owner', 'manager']}
      deletePermissions={['owner']} // Only owners can delete
      
      // Custom handlers
      onBeforeCreate={async (data) => {
        // Validate or transform data before creation
        if (data.price < 0) {
          throw new Error('Price must be positive')
        }
        return {
          ...data,
          code: data.code || generateServiceCode(data.name)
        }
      }}
      
      onAfterCreate={(result) => {
        // Additional actions after creation
        console.log('Service created:', result)
      }}
      
      // Custom status options
      statusOptions={[
        { value: 'all', label: 'All Services' },
        { value: 'active', label: 'Active', color: LUXE_COLORS.emerald },
        { value: 'seasonal', label: 'Seasonal', color: LUXE_COLORS.sapphire },
        { value: 'discontinued', label: 'Discontinued', color: LUXE_COLORS.ruby }
      ]}
      
      // Additional filters
      additionalFilters={
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hair">Hair Services</SelectItem>
            <SelectItem value="color">Color Services</SelectItem>
            <SelectItem value="treatment">Treatments</SelectItem>
          </SelectContent>
        </Select>
      }
      
      renderCard={(service, handlers) => (
        <SalonLuxeCard
          title={service.dynamic_fields?.name?.value}
          subtitle={service.dynamic_fields?.category?.value}
          description={service.dynamic_fields?.description?.value}
          icon={Scissors}
          colorTag={getCategoryColor(service.dynamic_fields?.category?.value)}
          badges={[
            { label: 'Price', value: `$${service.dynamic_fields?.price?.value}` },
            { label: 'Duration', value: `${service.dynamic_fields?.duration_minutes?.value} min` }
          ]}
          footer={
            <ProgressBar 
              value={calculateBookingRate(service)} 
              label="Booking Rate" 
            />
          }
          {...handlers}
        />
      )}
    />
  )
}
```

## Component Props Reference

### SalonLuxeCRUDPage Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `title` | `string` | Page title (e.g., "Products") | Required |
| `description` | `string` | Page subtitle | Optional |
| `entityType` | `string` | Universal entity type | Required |
| `preset` | `object` | Entity preset configuration | Required |
| `icon` | `LucideIcon` | Icon for the page | Required |
| `searchPlaceholder` | `string` | Search input placeholder | "Search by name..." |
| `statusOptions` | `array` | Status filter options | Default 4 statuses |
| `additionalFilters` | `ReactNode` | Extra filter components | Optional |
| `createPermissions` | `string[]` | Roles/permissions for create | ['owner', 'manager'] |
| `editPermissions` | `string[]` | Roles/permissions for edit | ['owner', 'manager'] |
| `deletePermissions` | `string[]` | Roles/permissions for delete | ['owner'] |
| `onBeforeCreate` | `function` | Transform data before create | Optional |
| `onBeforeUpdate` | `function` | Transform data before update | Optional |
| `onAfterCreate` | `function` | Action after successful create | Optional |
| `onAfterUpdate` | `function` | Action after successful update | Optional |
| `onAfterDelete` | `function` | Action after successful delete | Optional |
| `renderCard` | `function` | Render function for items | Required |
| `renderEmptyState` | `function` | Custom empty state component | Optional |

### SalonLuxeCard Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Card title |
| `subtitle` | `string` | Card subtitle |
| `description` | `string` | Card description |
| `code` | `string` | Item code/SKU |
| `icon` | `LucideIcon` | Card icon |
| `colorTag` | `string` | Color for icon background |
| `status` | `string` | Item status |
| `badges` | `array` | Array of badge objects |
| `footer` | `ReactNode` | Footer content |
| `createdAt` | `Date/string` | Creation date |
| `updatedAt` | `Date/string` | Last update date |
| `onEdit` | `function` | Edit handler |
| `onArchive` | `function` | Archive handler |
| `onDelete` | `function` | Delete handler |
| `canEdit` | `boolean` | Show edit option |
| `canDelete` | `boolean` | Show delete options |

## Entity Preset Structure

```typescript
const ENTITY_PRESET = {
  smart_code: 'HERA.SALON.ENTITY.TYPE.V1',
  dynamicFields: [
    {
      field_name: 'name',
      field_type: 'text', // text, number, date, boolean
      smart_code: 'HERA.SALON.ENTITY.DYN.NAME.V1',
      required: true,
      label: 'Name',
      placeholder: 'Enter name...'
    },
    // ... more fields
  ]
}
```

## Common Patterns

### 1. Products Page
```typescript
import { SalonProductsPage } from '@/lib/dna/patterns/salon-page-examples'
```

### 2. Services Page
```typescript
import { SalonServicesPage } from '@/lib/dna/patterns/salon-page-examples'
```

### 3. Staff Page
```typescript
import { SalonStaffPage } from '@/lib/dna/patterns/salon-page-examples'
```

### 4. Gift Cards Page
```typescript
import { SalonGiftCardsPage } from '@/lib/dna/patterns/salon-page-examples'
```

### 5. Packages Page
```typescript
import { SalonPackagesPage } from '@/lib/dna/patterns/salon-page-examples'
```

## Styling Guide

### Colors (LUXE_COLORS)
- `black`: '#0B0B0B'
- `charcoal`: '#1A1A1A'
- `charcoalLight`: '#232323'
- `gold`: '#D4AF37'
- `goldDark`: '#B8860B'
- `champagne`: '#F5E6C8'
- `bronze`: '#8C7853'
- `lightText`: '#E0E0E0'
- `emerald`: '#0F6F5C'
- `ruby`: '#DC2626'
- `sapphire`: '#2563EB'
- `orange`: '#F97316'

### Common CSS Classes
- `luxe-input`: Styled input with bronze placeholder
- `luxe-select-content`: Styled select dropdown
- `luxe-select-item`: Styled select item
- `luxe-scrollbar`: Custom scrollbar styling

## Best Practices

1. **Always use entity presets** - Define all dynamic fields with smart codes
2. **Implement proper permissions** - Use role-based access control
3. **Add validation in onBeforeCreate/Update** - Validate business rules
4. **Use consistent naming** - Follow HERA smart code conventions
5. **Provide meaningful empty states** - Help users get started
6. **Add loading states** - Show progress during operations
7. **Handle errors gracefully** - Use toast notifications
8. **Keep cards scannable** - Show key info in badges
9. **Use color meaningfully** - Status colors should be consistent
10. **Test on mobile** - Ensure responsive design works

## Migration from Existing Pages

To migrate an existing page to use this pattern:

1. Identify the entity type and create a preset
2. Map existing fields to dynamic fields
3. Replace the page component with SalonLuxeCRUDPage
4. Implement the renderCard function
5. Add any custom logic via handlers
6. Test create, read, update, and archive operations

## Troubleshooting

**Q: Items not showing up?**
A: Check that your entity_type matches and dynamic fields are loaded

**Q: Permissions not working?**
A: Verify the useSecuredSalonContext is providing correct role/permissions

**Q: Styling looks off?**
A: Ensure you've imported '@/styles/salon-luxe.css'

**Q: Modal not closing after save?**
A: Check for errors in onBeforeCreate/Update handlers