# HERA Coding Guardrails (Use in PR + AI prompts)

## 🚨 Critical Rules - Always Follow

### 1. Multi-Tenant Isolation
- **Always include `p_organization_id`** in all RPC calls
- **Never bypass organization filtering** - It's a sacred security boundary
- **Test with multiple orgs** to ensure proper isolation

### 2. Data Access Patterns  
- **Use RPC v2 client only** - Never call Supabase REST tables directly from UI
- **Sacred RPCs**: `hera_entity_read_v2`, `hera_entity_upsert_v2`, `hera_txn_post_v2`
- **All CRUD through RPC** - This ensures RLS, validation, and audit trails

### 3. Naming Conventions
- **Entity types**: Must be `UPPER_SNAKE_CASE` (e.g., `CUSTOMER`, `GL_ACCOUNT`)
- **Smart codes**: End with `.V{n}` (e.g., `.V1`, `.V2`), minimum 6 segments
- **Field names**: Use `snake_case` for dynamic fields
- **Transaction types**: Limited to kernel set (JOURNAL, SALES_INVOICE, etc.)

### 4. Role-Based Security
- **Roles are entities**: Type `ROLE` in `core_entities`, not hardcoded strings
- **Staff assignments**: Via `STAFF_HAS_ROLE` relationships in `core_relationships`
- **Permissions**: Stored in role's dynamic data as JSON array
- **Never hardcode permissions** - Always read from role entities

### 5. Financial Flows
- **Map entity types**: Application `entity_type` → kernel `transaction_type`
- **Use posting RPC**: Always use `hera_txn_post_v2` for financial entries
- **Balance requirement**: Total debits must equal total credits
- **Smart codes required**: Every transaction and line needs valid smart codes

### 6. Development Workflow
- **Update presets first**: Changes to entity structure go in presets
- **Run validation**: `npm run presets:validate` before committing
- **Update docs**: Run `npm run docs:sync` when presets change
- **Test with RPC**: Use `npm run rpc:probe` to verify contracts

## 📋 PR Checklist
- [ ] All RPC calls include `p_organization_id`
- [ ] Entity types are UPPER_SNAKE_CASE
- [ ] Smart codes follow format and end with .Vn
- [ ] Roles implemented as entities, not strings
- [ ] Permissions read from role dynamic data
- [ ] Transaction types mapped correctly
- [ ] Financial entries balance (debits = credits)
- [ ] Presets validated with schema
- [ ] Documentation updated if needed
- [ ] RPC contracts tested

## 🎯 Quick Reference

### Valid Transaction Types (Kernel)
```
JOURNAL, SALES_INVOICE, SALES_RECEIPT, 
PURCHASE_BILL, PAYMENT, ADJUSTMENT
```

### Smart Code Pattern
```
HERA.{DOMAIN}.{MODULE}.{KIND}.{SUBKIND}.V{n}
     ^2-15ch  ^1-30ch  ^1-30ch         ^version

Examples:
HERA.SALON.CUSTOMER.ENTITY.ITEM.V1
HERA.FIN.GL.ACCOUNT.ASSET.CASH.V1
```

### RPC v2 Pattern
```typescript
// Read entities
await supa.rpc('hera_entity_read_v2', {
  p_organization_id: orgId,
  p_entity_type: 'CUSTOMER',
  p_include_dynamic_data: true,
  // ...
})

// Create/update entities
await supa.rpc('hera_entity_upsert_v2', {
  p_organization_id: orgId,
  p_payload: { /* entity data */ }
})

// Post transactions
await supa.rpc('hera_txn_post_v2', {
  p_organization_id: orgId,
  p_payload: { /* transaction data */ }
})
```

## 🚫 Common Mistakes to Avoid
1. **Direct table access**: `supabase.from('core_entities')` ❌
2. **Hardcoded roles**: `if (role === 'admin')` ❌
3. **Missing org ID**: `rpc('hera_entity_read_v2', {})` ❌
4. **Wrong case**: `entity_type: 'customer'` ❌ (must be `CUSTOMER`)
5. **Bad smart codes**: `HERA.SALON.V1` ❌ (too few segments)
6. **Unbalanced transactions**: Debits ≠ Credits ❌

## 🔧 Testing Commands
```bash
# Validate presets against schema
npm run presets:validate

# Test RPC contracts
npm run rpc:probe

# Test financial posting
npm run posting:smoke

# Check documentation sync
npm run docs:sync

# Run all architecture guards
npm run validate
```