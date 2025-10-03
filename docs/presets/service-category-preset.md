# Service Category Preset

## Overview

The Service Category preset provides a standardized way to categorize salon services for better organization, discovery, pricing, and reporting. It follows HERA's universal entity architecture using the Sacred 6 tables.

## Entity Configuration

- **Entity Type**: `CATEGORY`
- **Smart Code**: `HERA.SALON.CATEGORY.ENTITY.ITEM.V1`
- **Description**: Categorizes salon services for discovery, pricing and reporting

## Dynamic Fields

| Field Name | Type | Required | Smart Code | Description |
|------------|------|----------|------------|-------------|
| `kind` | text | ✓ | `HERA.SALON.CATEGORY.DYN.KIND.V1` | Category type (SERVICE/PRODUCT/BUNDLE) |
| `name` | text | ✓ | `HERA.SALON.CATEGORY.DYN.NAME.V1` | Display name of the category |
| `code` | text | ✗ | `HERA.SALON.CATEGORY.DYN.CODE.V1` | Short code for the category |
| `description` | text | ✗ | `HERA.SALON.CATEGORY.DYN.DESCRIPTION.V1` | Detailed description |
| `display_order` | number | ✗ | `HERA.SALON.CATEGORY.DYN.DISPLAY_ORDER.V1` | Sort order for display |
| `status` | text | ✓ | `HERA.SALON.CATEGORY.DYN.STATUS.V1` | Active status (active/inactive/archived) |
| `color_tag` | text | ✗ | `HERA.SALON.CATEGORY.DYN.COLOR_TAG.V1` | Visual color identifier |

## Permissions

### Role-Based Access Control

| Role | Create | Edit | Delete | View |
|------|--------|------|--------|------|
| Owner | ✓ | ✓ | ✓ | ✓ |
| Manager | ✓ | ✓ | ✓ | ✓ |
| Receptionist | ✗ | ✗ | ✗ | ✓ |
| Stylist | ✗ | ✗ | ✗ | ✓ |
| Accountant | ✗ | ✗ | ✗ | ✓ |

## UI Configuration

### Table View

- **Columns**: name, code, display_order, status (with badge formatting)
- **Default Sort**: display_order ascending
- **Search Fields**: name, code, description
- **Filters**: 
  - Kind (locked to SERVICE for service categories)
  - Status (active/inactive/archived)

### Form Fields

- **Category Name**: Required, 2-60 characters, placeholder "Hair, Nails, Spa…"
- **Code**: Optional, placeholder "SRV-HAIR"
- **Description**: Optional, textarea widget
- **Display Order**: Number widget, minimum 0
- **Status**: Select widget with predefined options
- **Color Tag**: Color picker widget

## Relationships

Service categories primarily serve as targets for relationships initiated from services:

- **SERVICE_HAS_CATEGORY**: Services link to categories via this relationship type
- No outbound relationships defined at the category level

## Validation Rules

### Required Fields
- `name`: Must be 2-60 characters
- `kind`: Automatically set to 'SERVICE' for service categories
- `status`: Must be one of 'active', 'inactive', 'archived'

### Business Rules
- `display_order`: Must be >= 0
- Category names should be unique within an organization
- Archived categories can't be assigned to new services

## Usage Examples

### Create a Service Category

```typescript
import { useUniversalEntity } from '@/hooks/useUniversalEntity'

const { create } = useUniversalEntity({ entity_type: 'CATEGORY' })

await create({
  entity_type: 'CATEGORY',
  entity_name: 'Hair Services',
  smart_code: 'HERA.SALON.CATEGORY.ENTITY.ITEM.V1',
  dynamic_fields: {
    kind: { value: 'SERVICE', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.KIND.V1' },
    name: { value: 'Hair Services', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.NAME.V1' },
    code: { value: 'SRV-HAIR', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.CODE.V1' },
    description: { value: 'All hair-related services', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.DESCRIPTION.V1' },
    display_order: { value: 1, type: 'number', smart_code: 'HERA.SALON.CATEGORY.DYN.DISPLAY_ORDER.V1' },
    status: { value: 'active', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.STATUS.V1' },
    color_tag: { value: '#8B4513', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.COLOR_TAG.V1' }
  }
})
```

### Query Service Categories

```typescript
const { entities: categories } = useUniversalEntity({
  entity_type: 'CATEGORY',
  filters: { 
    include_dynamic: true,
    where: {
      'dynamic_fields.kind.value': 'SERVICE',
      'dynamic_fields.status.value': 'active'
    }
  }
})
```

## Seeding

Use the provided seed script to populate common service categories:

```bash
SEED_ORG_ID=your-org-uuid npm run seed:salon-service-categories
```

### Default Categories

The seed script creates these standard categories:

1. **Hair** (SRV-HAIR) - Hair cutting, washing, and basic styling
2. **Color** (SRV-COLOR) - Hair coloring and chemical treatments  
3. **Styling** (SRV-STYLE) - Special occasion styling and updos
4. **Nails** (SRV-NAILS) - Manicure, pedicure, and nail art
5. **Spa** (SRV-SPA) - Relaxation and wellness treatments
6. **Massage** (SRV-MASSAGE) - Therapeutic massage services
7. **Facial** (SRV-FACIAL) - Skincare and facial treatments
8. **Brows & Lashes** (SRV-BROWS) - Eyebrow and eyelash services

## Navigation

- **Path**: `/salon/service-categories`
- **Sidebar**: Under Services group
- **Icon**: FolderOpen (collection tag)
- **Access**: All authenticated users can view, owner/manager can manage

## Integration

### With Services

Services link to categories via relationships:

```typescript
// When creating a service
{
  relationships: {
    HAS_CATEGORY: [{ to_entity_id: categoryId }]
  }
}
```

### With Reports

Categories enable service-based reporting:
- Revenue by category
- Popular service categories
- Category performance metrics

## Architecture Notes

### HERA DNA Compliance

- ✅ Uses only Sacred 6 tables (no custom tables)
- ✅ All fields stored in `core_dynamic_data`
- ✅ Smart codes follow 6+ segment pattern with .V1 suffix
- ✅ Universal entity architecture maintained
- ✅ Multi-tenant organization isolation

### Performance Considerations

- Categories are cached with 200 item limit
- Sorted by display_order for consistent ordering
- Filtered client-side for responsive UI
- Pagination ready for large datasets

### Security Features

- Row-level security enforced
- Organization-scoped queries
- Role-based permission checking
- Audit trail via universal transactions

## Testing

Run the test suite:

```bash
npm run test src/app/salon/service-categories/__tests__/
```

Test coverage includes:
- CRUD operations
- Permission enforcement
- Search and filtering
- Form validation
- Loading and error states

## Troubleshooting

### Common Issues

1. **Categories not showing**: Check organization context and filters
2. **Permission denied**: Verify user role and permissions
3. **Form validation errors**: Ensure required fields are populated
4. **Seed script fails**: Verify SEED_ORG_ID is valid UUID

### Debug Tips

- Check browser console for [ServiceCategoriesPage] logs
- Verify organization_id in all API calls
- Use React DevTools to inspect component state
- Check database for proper field placement in core_dynamic_data

## Migration Notes

If upgrading from custom category tables:

1. Export existing category data
2. Transform to universal entity format
3. Run migration script to populate core_entities and core_dynamic_data
4. Update relationship references
5. Test thoroughly before going live

## Related Documentation

- [Universal Entity Architecture](../architecture/universal-entities.md)
- [HERA Smart Codes](../architecture/smart-codes.md)
- [Salon Security Framework](../security/salon-security.md)
- [Service Management](./service-preset.md)