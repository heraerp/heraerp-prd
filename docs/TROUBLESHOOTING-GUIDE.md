# 🐛 HERA Troubleshooting Guide

**Common issues and solutions when working with HERA's universal architecture**

## 📋 Table of Contents
- [Schema Column Errors](#schema-column-errors)
- [Organization ID Issues](#organization-id-issues)
- [Status Workflow Problems](#status-workflow-problems)
- [Memory and Performance](#memory-and-performance)
- [CLI Tool Issues](#cli-tool-issues)
- [API Errors](#api-errors)
- [Database Connection](#database-connection)

## Schema Column Errors

### ❌ Error: `column "transaction_number" does not exist`
**Problem**: Using outdated column name from documentation  
**Solution**: Use `transaction_code` instead
```javascript
// ❌ WRONG
const transaction = {
  transaction_number: 'TXN-001'
}

// ✅ CORRECT
const transaction = {
  transaction_code: 'TXN-001'
}
```

### ❌ Error: `column "parent_entity_id" does not exist`
**Problem**: Using old relationship column names  
**Solution**: Use `from_entity_id` and `to_entity_id`
```javascript
// ❌ WRONG
const relationship = {
  parent_entity_id: parentId,
  child_entity_id: childId
}

// ✅ CORRECT
const relationship = {
  from_entity_id: parentId,
  to_entity_id: childId
}
```

### ❌ Error: `column "status" does not exist`
**Problem**: Trying to add status as a column  
**Solution**: Use relationships pattern for all status workflows
```bash
# Learn the correct pattern:
node status-workflow-example.js

# Never add status columns!
# Status is always a relationship to a status entity
```

### 🔍 How to Check Actual Schema
```bash
# View all table schemas
node check-schema.js

# Check specific table
node hera-cli.js show-schema core_entities
node hera-cli.js show-schema universal_transactions
```

## Organization ID Issues

### ❌ Error: `DEFAULT_ORGANIZATION_ID not set`
**Problem**: Environment variable not configured  
**Solution**: Find and set your organization ID
```bash
# 1. Find your organization
node hera-cli.js query core_organizations

# 2. Copy the UUID (looks like: 123e4567-e89b-12d3-a456-426614174000)

# 3. Update .env file
DEFAULT_ORGANIZATION_ID=123e4567-e89b-12d3-a456-426614174000
```

### ❌ Error: `organization_id cannot be null`
**Problem**: Forgot to include organization_id in query  
**Solution**: Always include organization_id
```javascript
// ❌ WRONG
await supabase.from('core_entities').select('*')

// ✅ CORRECT
await supabase.from('core_entities')
  .select('*')
  .eq('organization_id', organizationId)
```

## Status Workflow Problems

### ❌ Error: Trying to UPDATE status field
**Problem**: Attempting to use status as a column  
**Solution**: Status is ALWAYS a relationship

```javascript
// ❌ WRONG - Never do this!
UPDATE core_entities SET status = 'active' WHERE id = ?

// ✅ CORRECT - Use relationships
// 1. Create status entities (one-time)
const activeStatus = await createEntity({
  entity_type: 'workflow_status',
  entity_name: 'Active Status',
  entity_code: 'STATUS-ACTIVE'
})

// 2. Create relationship
await createRelationship({
  from_entity_id: entityId,
  to_entity_id: activeStatus.id,
  relationship_type: 'has_status'
})

// 3. Query with status
SELECT e.*, s.entity_name as status
FROM core_entities e
LEFT JOIN core_relationships r ON e.id = r.from_entity_id
LEFT JOIN core_entities s ON r.to_entity_id = s.id
WHERE r.relationship_type = 'has_status'
```

### 📚 Learn Status Patterns
```bash
# Run the comprehensive example
node status-workflow-example.js

# This shows:
# - How to create status entities
# - How to assign status via relationships
# - How to query entities with their status
# - How to change status over time
```

## Memory and Performance

### ❌ Error: JavaScript heap out of memory
**Problem**: Querying too much data at once  
**Solution**: Use CLI tools with built-in pagination
```bash
# ❌ WRONG - Loading all entities
SELECT * FROM core_entities

# ✅ CORRECT - Use CLI tools
node hera-query.js entities --limit 100
node hera-cli.js query core_entities --page 1 --limit 50
```

### ❌ Error: Query timeout
**Problem**: Missing indexes or inefficient queries  
**Solution**: Always filter by organization_id first
```javascript
// ✅ Organization filter uses index
.eq('organization_id', orgId)
.eq('entity_type', 'customer')

// Add limit for large datasets
.limit(100)
.range(0, 99)
```

## CLI Tool Issues

### ❌ Error: `Cannot find module`
**Problem**: Not in correct directory or missing dependencies  
**Solution**: Ensure proper setup
```bash
# 1. Navigate to mcp-server directory
cd mcp-server

# 2. Install dependencies
npm install

# 3. Check files exist
ls *.js

# Should see:
# - hera-cli.js
# - hera-query.js
# - check-schema.js
# - status-workflow-example.js
```

### ❌ Error: `ECONNREFUSED` when running CLI tools
**Problem**: Missing database configuration  
**Solution**: Configure .env file
```bash
# 1. Copy example file
cp .env.example .env

# 2. Edit .env with your credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEFAULT_ORGANIZATION_ID=your-org-uuid
```

## API Errors

### ❌ Error: 400 Bad Request
**Problem**: Invalid data format  
**Solution**: Check required fields
```javascript
// All entities need these fields:
{
  entity_type: 'customer',      // Required
  entity_name: 'Customer Name',  // Required
  organization_id: orgId,        // Required
  smart_code: 'HERA.CRM...'     // Recommended
}

// All transactions need:
{
  transaction_type: 'sale',      // Required
  transaction_code: 'TXN-001',   // Auto-generated if not provided
  organization_id: orgId,        // Required
  total_amount: 100.00          // Required for financial transactions
}
```

### ❌ Error: 403 Forbidden
**Problem**: Missing authentication or wrong organization  
**Solution**: Check auth headers and organization context
```javascript
// Ensure auth token is set
universalApi.setAuthToken(token)

// Ensure organization context
universalApi.setOrganizationId(orgId)
```

## Database Connection

### ❌ Error: `password authentication failed`
**Problem**: Invalid Supabase credentials  
**Solution**: Verify service role key
```bash
# 1. Get from Supabase dashboard:
# Settings > API > Service Role Key

# 2. Must be service role, not anon key
# Service role bypasses RLS for admin operations
```

### ❌ Error: `relation "core_entities" does not exist`
**Problem**: Wrong database or schema not created  
**Solution**: Verify database and run migrations
```bash
# 1. Check you're connected to right database
# 2. Ensure migrations have been run
# 3. Tables should be in public schema
```

## 🛠️ General Debugging Tips

### 1. Always Start With Summary
```bash
node hera-query.js summary
# Shows all tables and record counts
# Confirms database connection
# Verifies organization context
```

### 2. Check Schema When In Doubt
```bash
node check-schema.js
# Shows actual column names
# Prevents column name errors
# Verifies table structure
```

### 3. Use Example Scripts
```bash
node status-workflow-example.js  # Status patterns
node hera-cli.js --help         # CLI usage
```

### 4. Enable Debug Logging
```bash
# Set in .env
DEBUG=true
LOG_LEVEL=debug

# Or run with debug
DEBUG=* node hera-cli.js query core_entities
```

### 5. Test With Simple Queries First
```bash
# Test connection
node hera-cli.js query core_organizations

# Test entity creation
node hera-cli.js create-entity test "Test Entity"

# Test querying
node hera-cli.js query core_entities entity_type:test
```

## 📞 Getting More Help

### Documentation Resources
- Main documentation: `/docs/README.md`
- API reference: `/docs/UNIVERSAL-API.md`
- Quick reference: `/docs/HERA-QUICK-REFERENCE.md`
- Schema details: Run `node check-schema.js`

### Common Patterns
- Status workflows: `node status-workflow-example.js`
- Entity creation: `node hera-cli.js create-entity --help`
- Transactions: `node hera-cli.js create-transaction --help`

### Best Practices
1. **Always use CLI tools** for development
2. **Never modify schema** - use dynamic fields
3. **Always include organization_id** in queries
4. **Use relationships** for status and workflows
5. **Check actual schema** when column errors occur

---

Remember: If you're getting errors about columns not existing, always run `node check-schema.js` first!