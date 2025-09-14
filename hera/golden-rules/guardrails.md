# HERA Guardrails

Core validation rules that must never be violated.

## 1. Catalog Type Enforcement
- Only create entities with `entity_type` existing in catalog
- Only create transactions with `transaction_type` in catalog  
- Only create relationships with `relationship_type` in catalog
- Reject unknown types with helpful suggestions

## 2. Organization Isolation
- Every INSERT must include `organization_id`
- Every UPDATE/DELETE filtered by `organization_id`
- Never query across organizations without explicit intent
- RLS policies enforce at database level

## 3. Code Format Rules
- All codes use `lowercase_snake_case`
- No spaces, only underscores
- Examples: `customer_vip`, `gl_revenue`, `sales_order`
- Smart codes follow exact format

## 4. Transaction Integrity
- Every business activity = header + lines
- Financial transactions must balance per currency
- Lines must reference valid transaction_id
- No orphaned lines allowed

## 5. Lifecycle Management
- Status via relationships to status entities
- Never add status columns
- Valid transitions defined in catalog
- History preserved (soft deletes only)

## 6. Required Fields
- `organization_id` on every table
- `smart_code` on entities and transactions
- `created_at`, `updated_at` timestamps
- `metadata` JSONB for extensibility

## 7. Financial Rules
- Journal entries: sum(debits) = sum(credits)
- All amounts include currency
- Running balances via dynamic data
- Complete audit trail required