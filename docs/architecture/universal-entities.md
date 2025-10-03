# HERA Universal Entities (Sacred 6)

## Core Tables
The Sacred Six tables form the foundation of HERA's universal architecture:

1. **`core_entities`** - Central entity registry
2. **`core_dynamic_data`** - Typed dynamic fields for entities
3. **`core_relationships`** - Entity-to-entity relationships (edges)
4. **`core_organizations`** - Multi-tenant isolation
5. **`universal_transactions`** - Transaction headers
6. **`universal_transaction_lines`** - Transaction details

Additional support tables as configured for audit trails and metadata.

## Entity Rules
- **Entity Type Format**: Always `UPPER_SNAKE_CASE` (e.g., `CUSTOMER`, `PRODUCT`, `GL_ACCOUNT`)
- **Smart Codes**: Follow pattern `HERA.{DOMAIN}.{MODULE}.{KIND}...V{n}`
  - Minimum 6 segments
  - End with version (`.V1`, `.V2`, etc.)
  - All uppercase except version suffix
- **Dynamic Fields**: 
  - Field names in `snake_case`
  - Strongly typed (`text`, `number`, `boolean`, `date`, `json`)
  - Validated on insert/update
- **Relationships**:
  - Typed with smart codes
  - Cardinality defined in preset (`ONE_TO_ONE`, `ONE_TO_MANY`, `MANY_TO_MANY`)
  - Bidirectional navigation supported

## Data Access Pattern
All entity operations MUST go through RPC v2 functions:
- `hera_entity_read_v2` - Read entities with filters
- `hera_entity_upsert_v2` - Create or update entities
- `hera_entity_delete_v2` - Soft delete entities
- Never use raw Supabase table access from application code

## Entity Presets
Presets serve as the source of truth for each entity family:
- **Structure**: Fields, types, validation rules
- **Relationships**: Allowed connections to other entities
- **UI Hints**: Display preferences, form layouts
- **Permissions**: Role-based access rules
- **Versioning**: Presets are versioned for evolution
- **Documentation**: Auto-generated from preset definitions

## Example Entity Definition
```typescript
{
  entity_type: "CUSTOMER",
  smart_code: "HERA.CRM.CUSTOMER.ENTITY.ITEM.V1",
  dynamicFields: [
    {
      name: "email",
      type: "text",
      smart_code: "HERA.CRM.CUSTOMER.FIELD.EMAIL.V1",
      required: true
    },
    {
      name: "credit_limit",
      type: "number", 
      smart_code: "HERA.CRM.CUSTOMER.FIELD.CREDIT_LIMIT.V1",
      default: 0
    }
  ],
  relationships: [
    {
      type: "HAS_ORDERS",
      smart_code: "HERA.CRM.CUSTOMER.REL.ORDERS.V1",
      cardinality: "ONE_TO_MANY",
      target_entity_type: "SALE_ORDER"
    }
  ]
}
```

## Best Practices
1. **Always use presets** - Don't create ad-hoc entity structures
2. **Version smart codes** - Never reuse codes for different purposes
3. **Validate early** - Use preset validation before deployment
4. **Document relationships** - Clear naming and purpose
5. **Test with RPC** - Verify all CRUD operations work correctly