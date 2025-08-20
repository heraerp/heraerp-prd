# 🔥 HERA Production Testing Quick Reference

## 🎯 Purpose

This guide helps you create **REAL DATA** in your Supabase database using HERA's testing framework. Perfect for:
- Validating business workflows
- Creating demo data
- Testing integrations
- Training users with real scenarios

## ⚡ Quick Start (5 Minutes)

### 1. Setup Environment
```bash
# In project root, create/edit .env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key-here
DEFAULT_ORGANIZATION_ID=your-org-uuid  # Optional
```

### 2. Find Your Organization ID
```bash
cd mcp-server
node hera-cli.js query core_organizations
# Copy the UUID for your organization
```

### 3. Run Production Test
```bash
cd packages/hera-testing
node bin/direct-production-test.js salon --org-id "your-org-uuid" --debug
```

## 📊 What Gets Created

### Salon Example Creates:
- **4 Entities**: Customer, Employee (Stylist), Service, Product
- **18 Dynamic Fields**: Contact info, prices, commission rates, etc.
- **1 Transaction**: Appointment booking with metadata
- **2 Relationships**: Customer preferences, status workflows
- **1 Status Entity**: Workflow status tracking

**Total: ~26 database records** with complete business context!

## 🏗️ Test Structure

### Basic Pattern
```yaml
# 1. Setup - Create base entities
setup:
  - action_type: create_entity
    data:
      entity_type: customer
      entity_name: "Test Customer"
    store_as: customer

# 2. Steps - Business workflow
steps:
  - id: create_order
    actions:
      - action_type: create_transaction
        data:
          source_entity_id: "{{customer.id}}"
```

### Key Action Types

#### Create Entity
```yaml
action_type: create_entity
data:
  entity_type: customer|product|service|employee
  entity_name: "Name"
  entity_code: "CODE-001"  # Optional
  smart_code: "HERA.INDUSTRY.TYPE.v1"
  dynamic_fields:  # Goes to core_dynamic_data
    email: "test@example.com"
    phone: "+1-555-1234"
store_as: variable_name
```

#### Create Transaction
```yaml
action_type: create_transaction
data:
  transaction_type: sale|appointment|payment
  transaction_code: "TXN-{{timestamp}}"
  smart_code: "HERA.INDUSTRY.TXN.TYPE.v1"
  source_entity_id: "{{customer.id}}"  # NOT reference_entity_id!
  metadata:
    custom_field: "value"
store_as: transaction
```

#### Create Relationship (Entity to Entity ONLY!)
```yaml
action_type: create_relationship
data:
  from_entity_id: "{{entity1.id}}"  # Must be entity!
  to_entity_id: "{{entity2.id}}"     # Must be entity!
  relationship_type: "has_status|favorite_service|manages"
  smart_code: "HERA.REL.TYPE.v1"
  relationship_data:
    notes: "Additional context"
```

## ⚠️ Common Gotchas

### 1. **Schema Differences**
```yaml
# Documentation says → Use in production
reference_entity_id → source_entity_id
parent_entity_id → from_entity_id
child_entity_id → to_entity_id
transaction_number → transaction_code
```

### 2. **Relationships MUST Connect Entities**
```yaml
# ❌ WRONG - Transaction to Entity
from_entity_id: "{{order_transaction.id}}"  # NO!

# ✅ RIGHT - Entity to Entity
from_entity_id: "{{order_entity.id}}"       # YES!
```

### 3. **Dynamic Fields Are Automatic**
```yaml
# Just include in data - framework handles storage
dynamic_fields:
  custom_field: "value"  # Stored in core_dynamic_data
```

## 🛠️ Debugging Tips

### Enable Debug Mode
```bash
node bin/direct-production-test.js salon --org-id "uuid" --debug
# Shows all data being created
```

### Check Created Data
```bash
# Verify entities
node hera-cli.js query core_entities organization_id:"your-org-id"

# Check relationships
node hera-cli.js query core_relationships organization_id:"your-org-id"

# View transactions
node hera-cli.js query universal_transactions organization_id:"your-org-id"
```

### Keep Test Data
```bash
# Skip cleanup to preserve data
node bin/direct-production-test.js salon --org-id "uuid" --keep-data
```

## 📝 Creating Your Own Tests

### 1. Copy Template
```bash
cp examples/salon-appointment-booking.yaml examples/my-test.yaml
```

### 2. Edit for Your Business
```yaml
id: my-business-test
title: My Business Workflow
industry: your-industry

setup:
  # Create your entities

steps:
  # Define your workflow
```

### 3. Run Your Test
```bash
node bin/direct-production-test.js my-test examples/my-test.yaml --org-id "uuid"
```

## 🚀 Advanced Usage

### Multiple Organizations
```bash
# Test multi-tenant isolation
node bin/direct-production-test.js salon --org-id "org1-uuid"
node bin/direct-production-test.js salon --org-id "org2-uuid"
# Verify no data leakage
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
- name: Run Production Tests
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_KEY }}
  run: |
    node bin/direct-production-test.js salon \
      --org-id ${{ secrets.TEST_ORG_ID }}
```

### Batch Testing
```bash
# Run multiple tests
for test in examples/*.yaml; do
  node bin/direct-production-test.js custom "$test" --org-id "uuid"
done
```

## 💡 Pro Tips

1. **Start Small**: Test with one entity and transaction first
2. **Use Debug Mode**: See exactly what's being created
3. **Check Schema**: Run `node check-schema.js` to see actual columns
4. **Save Working Tests**: Keep successful tests as templates
5. **Document Smart Codes**: Track your business intelligence patterns

## 🎉 Success Metrics

Your production test is successful when:
- ✅ All entities created with correct types
- ✅ Dynamic fields stored properly
- ✅ Transactions reference correct entities
- ✅ Relationships connect entities (not transactions)
- ✅ Multi-tenant isolation verified
- ✅ Business workflow validated end-to-end

## 🆘 Need Help?

1. Check error messages carefully - they usually indicate the exact issue
2. Verify column names match production schema
3. Ensure all template variables resolve
4. Confirm organization ID is valid
5. Use debug mode to trace execution

**Remember**: This creates REAL DATA in your database. Use test organizations!