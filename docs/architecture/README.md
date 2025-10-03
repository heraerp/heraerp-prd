# HERA Architecture Documentation

This directory contains the core architecture documentation for the HERA ERP system.

## Contents

### Core Documentation
- [Universal Transactions](./universal-transactions.md) - The kernel transaction system
- [Universal Entities](./universal-entities.md) - The Sacred Six tables
- [Security & RBAC](./security-rbac.md) - Role-based access control

### Architecture Enforcement
The HERA codebase includes automated architecture enforcement through:

1. **GitHub Actions** - CI/CD pipeline validates all architecture rules
2. **Schema Validation** - Entity presets validated against JSON schemas
3. **RPC Contract Testing** - Automated probing of v2 contracts
4. **Documentation Sync** - Drift detection for docs and diagrams

## Key Principles

### Sacred Six Tables
1. `core_organizations` - Multi-tenant isolation
2. `core_entities` - All business objects
3. `core_dynamic_data` - Typed dynamic fields
4. `core_relationships` - Entity connections
5. `universal_transactions` - Transaction headers
6. `universal_transaction_lines` - Transaction details

### Universal Rules
- **Always use RPC v2** - Never direct table access
- **Organization isolation** - Sacred security boundary
- **Smart codes everywhere** - Business intelligence in every record
- **Roles as entities** - Not hardcoded strings
- **Balanced transactions** - Debits must equal credits

## Running Validations

```bash
# Validate all presets
npm run presets:validate

# Test RPC contracts
npm run rpc:probe

# Test financial posting
npm run posting:smoke

# Check documentation sync
npm run docs:sync

# Run all validations
npm run validate
```

## Contributing

When modifying the architecture:
1. Update the relevant documentation
2. Run validation scripts
3. Ensure CI passes
4. Update diagrams if needed

See [Coding Guardrails](/prompts/coding-guardrails.md) for development guidelines.