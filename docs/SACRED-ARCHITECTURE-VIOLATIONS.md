# HERA Sacred Architecture Violations

## Issue Summary

Several tables and views exist in the database that violate HERA's sacred 6-table architecture:

### Violating Tables (Found)
- `entities` - 716 rows
- `entity_fields` - 1730 rows  
- `core_memberships` - 0 rows
- `core_clients` - 0 rows
- `gl_chart_of_accounts` - 0 rows

### Violating Views (Found)
- `entities` (view)
- `entity_fields` (view)
- `v_clients` (potentially)
- `v_gl_accounts` (potentially)

## HERA's Sacred 6-Table Architecture

The ONLY tables that should exist in the public schema are:

1. **`core_organizations`** - Multi-tenant isolation
2. **`core_entities`** - All business objects
3. **`core_dynamic_data`** - Custom fields without schema changes
4. **`core_relationships`** - Entity connections and workflows
5. **`universal_transactions`** - All business transactions
6. **`universal_transaction_lines`** - Transaction details

## Why These Tables/Views Violate HERA

1. **`entities` and `entity_fields`** - These appear to be a separate entity system that duplicates the functionality of `core_entities` and `core_dynamic_data`. This violates the universal principle.

2. **`core_memberships`** - Memberships should be modeled as relationships in `core_relationships` table with `relationship_type = 'member_of'`.

3. **`core_clients`** - Clients should be stored in `core_entities` with `entity_type = 'customer'`.

4. **`gl_chart_of_accounts`** - GL accounts should be stored in `core_entities` with `entity_type = 'account'`.

## Investigation Results

After thorough investigation of the codebase:
- These tables/views are **NOT created by HERA code**
- They are **NOT referenced anywhere in the HERA codebase**
- They appear to be created by external processes or legacy systems

## Cleanup Instructions

To remove these violations and restore HERA's sacred architecture:

### Option 1: Direct SQL Execution

Run this SQL in the Supabase SQL Editor:

```sql
-- Remove violating views first
DROP VIEW IF EXISTS entities CASCADE;
DROP VIEW IF EXISTS entity_fields CASCADE;
DROP VIEW IF EXISTS v_clients CASCADE;
DROP VIEW IF EXISTS v_gl_accounts CASCADE;

-- Remove violating tables
DROP TABLE IF EXISTS entities CASCADE;
DROP TABLE IF EXISTS entity_fields CASCADE;
DROP TABLE IF EXISTS core_memberships CASCADE;
DROP TABLE IF EXISTS core_clients CASCADE;
DROP TABLE IF EXISTS gl_chart_of_accounts CASCADE;

-- Verify only sacred tables remain
SELECT table_name, 
       CASE 
         WHEN table_name IN (
           'core_organizations',
           'core_entities', 
           'core_dynamic_data',
           'core_relationships',
           'universal_transactions',
           'universal_transaction_lines'
         ) THEN '✅ SACRED'
         ELSE '❌ VIOLATION'
       END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Option 2: Use Provided Scripts

1. **Check violations:**
   ```bash
   node scripts/check-violations.js
   ```

2. **Get cleanup SQL:**
   ```bash
   node scripts/cleanup-violations.js
   ```

## Data Migration (If Needed)

If the violating tables contain important data, migrate it to the sacred tables first:

### Example: Migrate `entities` table
```sql
-- Migrate entities to core_entities
INSERT INTO core_entities (
  organization_id,
  entity_type,
  entity_name,
  entity_code,
  smart_code,
  metadata
)
SELECT 
  'YOUR_ORG_ID',  -- Replace with actual organization_id
  'migrated_entity',
  name,
  code,
  'HERA.MIGRATION.ENTITY.v1',
  jsonb_build_object('migrated_from', 'entities', 'original_id', id)
FROM entities;
```

### Example: Migrate `entity_fields` table
```sql
-- Migrate entity_fields to core_dynamic_data
INSERT INTO core_dynamic_data (
  organization_id,
  entity_id,
  field_name,
  field_value_text,
  smart_code
)
SELECT 
  ce.organization_id,
  ce.id,
  ef.field_name,
  ef.field_value,
  'HERA.MIGRATION.FIELD.v1'
FROM entity_fields ef
JOIN core_entities ce ON ce.metadata->>'original_id' = ef.entity_id::text;
```

## Prevention

To prevent future violations:

1. **Never create new tables** - Use the sacred 6 tables only
2. **Use entity_type** - Different business objects are just different entity types
3. **Use core_dynamic_data** - For custom fields instead of new columns
4. **Use relationships** - For connections, workflows, and statuses
5. **Review all migrations** - Ensure they only modify the sacred 6 tables

## Validation

After cleanup, run:

```bash
cd mcp-server && node schema-introspection.js validate
```

This should show ONLY the 6 sacred tables with no violations.