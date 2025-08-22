# HERA Schema-First Development Guide 🏗️

## Overview

HERA uses a **Schema-First Development** approach to prevent database schema mismatches and ensure type safety across the entire application. This guide outlines the mandatory process for all HERA development.

## 🚨 Critical Rules

1. **NEVER** assume column names or table structures
2. **ALWAYS** check the actual database schema before writing any code
3. **NEVER** use hardcoded column names like `is_deleted`, `parent_entity_id`, etc.
4. **ALWAYS** use the schema validation tools before deployment

## 📋 Development Workflow

### 1. Before Starting Any Feature

```bash
# Check the current schema
cd mcp-server
node check-schema.js

# Generate TypeScript types
npm run schema:types

# Validate schema assumptions
npm run schema:validate
```

### 2. Common Schema Pitfalls to Avoid

| ❌ WRONG Assumption | ✅ CORRECT Column |
|---------------------|-------------------|
| `is_deleted` | `status = 'deleted'` |
| `parent_entity_id` | `from_entity_id` |
| `child_entity_id` | `to_entity_id` |
| `transaction_number` | `transaction_code` |
| `is_active` | `status != 'deleted'` |

### 3. Using the Schema Tools

#### Quick Schema Check
```bash
# Check specific table
node mcp-server/check-schema.js core_entities

# Check all tables
node mcp-server/check-schema.js
```

#### Generate TypeScript Types
```bash
# Generate types from actual database
npm run schema:types

# This creates: src/types/hera-database.types.ts
```

#### Validate Schema Before Build
```bash
# Automatic validation before build
npm run build

# Manual validation
npm run schema:validate
```

## 🛠️ Available Tools

### 1. Schema Introspection (`mcp-server/schema-introspection.js`)

**Features:**
- Validates actual database schema against expected HERA schema
- Generates TypeScript interfaces from real database
- Detects deprecated columns still in use
- Creates detailed validation reports

**Usage:**
```bash
# Full validation and type generation
node mcp-server/schema-introspection.js

# Validation only
node mcp-server/schema-introspection.js validate

# Type generation only
node mcp-server/schema-introspection.js types
```

### 2. Schema Check (`mcp-server/check-schema.js`)

**Features:**
- Quick schema inspection
- Shows all columns for any table
- Lightweight and fast

**Usage:**
```bash
# Check all tables
node mcp-server/check-schema.js

# Check specific table
node mcp-server/check-schema.js core_entities
```

### 3. HERA CLI Tools

**Always use CLI tools for development:**
```bash
# Query with actual columns
node hera-cli.js query core_entities

# See table structure
node hera-cli.js show-schema core_entities

# Test queries before coding
node hera-cli.js query core_entities "status != 'deleted'"
```

## 📊 HERA Universal Schema Reference

### Core Organizations
```typescript
{
  id: string
  organization_name: string
  organization_code: string
  status: string  // NOT is_deleted
  metadata?: any
  created_at: string
  updated_at: string
}
```

### Core Entities
```typescript
{
  id: string
  organization_id: string
  entity_type: string
  entity_name: string
  entity_code?: string
  status: string  // NOT is_deleted
  smart_code?: string
  metadata?: any
  created_at: string
  updated_at: string
}
```

### Core Relationships
```typescript
{
  id: string
  organization_id: string
  from_entity_id: string  // NOT parent_entity_id
  to_entity_id: string    // NOT child_entity_id
  relationship_type: string
  is_active?: boolean
  metadata?: any
  created_at: string
  updated_at: string
}
```

### Universal Transactions
```typescript
{
  id: string
  organization_id: string
  transaction_type: string
  transaction_code: string  // NOT transaction_number
  transaction_date: string
  total_amount: number
  status?: string
  metadata?: any
  created_at: string
  updated_at: string
}
```

## 🔍 Schema Validation in CI/CD

The build process automatically validates schema:

1. **Pre-build Hook**: Runs `schema:validate` before every build
2. **Type Generation**: Updates TypeScript types on `npm run dev`
3. **Build Failure**: Build fails if schema validation finds critical issues

## 💡 Best Practices

### 1. Always Start with Schema Check
```bash
# Before writing any API endpoint
node mcp-server/check-schema.js [table_name]
```

### 2. Use Generated Types
```typescript
// Import generated types
import { CoreEntities, CoreRelationships } from '@/types/hera-database.types'

// Use type guards
import { isDeleted, isActive } from '@/types/hera-database.types'

if (!isDeleted(entity)) {
  // Process active entity
}
```

### 3. Test Queries First
```bash
# Test your query in CLI before coding
node hera-cli.js query core_entities "entity_type = 'salon_service' AND status != 'deleted'"
```

### 4. Handle Schema Gracefully
```typescript
// Good: Check for column existence
const status = entity.status || 'active'

// Bad: Assume column exists
const isDeleted = entity.is_deleted  // WRONG!
```

### 5. Use Status Patterns Correctly
```typescript
// Checking if deleted
const isDeleted = entity.status === 'deleted'

// Checking if active
const isActive = entity.status !== 'deleted' && entity.status !== 'inactive'

// In Supabase queries
.neq('status', 'deleted')  // NOT .eq('is_deleted', false)
```

## 🚀 Quick Reference

### Run Before Every Feature
```bash
npm run schema:check       # Quick schema view
npm run schema:types       # Generate types
npm run schema:validate    # Full validation
```

### Common Queries
```sql
-- Active records
WHERE status != 'deleted'

-- Soft delete
UPDATE table SET status = 'deleted' WHERE id = ?

-- Relationships
FROM core_relationships 
WHERE from_entity_id = ? AND to_entity_id = ?
```

## 📈 Schema Evolution

When schema changes are needed:

1. **Document the Change**: Update this guide
2. **Update Validation**: Modify `schema-introspection.js`
3. **Regenerate Types**: Run `npm run schema:types`
4. **Test Everything**: Validate all affected code
5. **Communicate**: Notify team of schema changes

## 🎯 Summary

**Schema-First Development** ensures:
- ✅ No runtime errors from missing columns
- ✅ Type safety across the application
- ✅ Consistent database queries
- ✅ Faster development with fewer bugs
- ✅ Automatic validation in CI/CD

**Remember**: When in doubt, check the schema!