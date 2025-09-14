# The Sacred Six Tables

HERA operates on exactly 6 tables. No schema changes. Ever.

## 1. core_organizations (WHO)
- Multi-tenant isolation boundary
- `organization_id` is sacred on every operation
- Perfect data security between organizations

## 2. core_entities (WHAT)
- All business objects: customers, products, employees, GL accounts, etc.
- `entity_type` must exist in catalog
- `entity_code` uses lowercase_snake_case
- `smart_code` drives behavior

## 3. core_dynamic_data (HOW)
- Unlimited custom fields without schema changes
- Key-value pairs linked to entities
- Field definitions from catalog
- No new columns ever needed

## 4. core_relationships (WHY)
- Connections between entities
- Hierarchies, workflows, associations
- `relationship_type` from catalog
- Status management (never status columns)

## 5. universal_transactions (WHEN - Header)
- All business transaction headers
- `transaction_type` from catalog
- Must include `organization_id`
- Smart codes determine posting rules

## 6. universal_transaction_lines (DETAILS)
- Transaction line items
- Links to entities via `line_entity_id`
- Quantities, amounts, metadata
- Complete transaction breakdown

## Immutable Rules
1. NEVER create new tables
2. NEVER add columns to existing tables
3. NEVER modify schema
4. ALWAYS use catalog types
5. ALWAYS include organization_id on writes