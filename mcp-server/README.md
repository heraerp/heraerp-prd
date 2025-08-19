# HERA MCP Server & CLI Tools

Direct terminal access to HERA's universal 6-table architecture. No memory issues, consistent patterns, perfect for development.

## 🚀 Quick Start

```bash
# One-time setup
npm install
cp .env.example .env  # Edit with your Supabase credentials

# Find your organization ID
node hera-cli.js query core_organizations
# Update .env: DEFAULT_ORGANIZATION_ID=your-org-uuid

# Optional: Create HERA System Organization (master templates)
node setup-hera-system-org.js
```

## 📋 Essential CLI Tools

### Query Tools
```bash
node hera-query.js summary          # Database overview
node hera-query.js entities         # List all entities
node hera-query.js transactions     # List all transactions
node hera-query.js relationships    # Show relationships
node hera-query.js dynamic          # Show dynamic fields
```

### Entity Management
```bash
# Create entities
node hera-cli.js create-entity customer "Acme Corp"
node hera-cli.js create-entity product "Widget Pro"
node hera-cli.js create-entity employee "John Doe"

# Query entities
node hera-cli.js query core_entities
node hera-cli.js query core_entities entity_type:customer

# Set dynamic fields (no schema changes!)
node hera-cli.js set-field <entity-id> email "contact@acme.com"
node hera-cli.js set-field <entity-id> phone "+1-555-0123"
node hera-cli.js set-field <entity-id> credit_limit "50000"
```

### Transaction Management
```bash
# Create transactions
node hera-cli.js create-transaction sale 5000
node hera-cli.js create-transaction purchase 3000
node hera-cli.js create-transaction payment 5000

# Query transactions
node hera-cli.js query universal_transactions
```

### Schema Inspection
```bash
node check-schema.js                # View actual table structures
node hera-cli.js show-schema        # Show all table schemas
node hera-cli.js count core_entities # Count records
```

## 🏛️ HERA System Organization

The System Organization contains master templates for all universal patterns:

```bash
# Setup System Organization (one-time)
node setup-hera-system-org.js

# Explore available templates
node explore-system-org.js summary       # Overview of all templates
node explore-system-org.js entity-types  # Entity type catalog
node explore-system-org.js fields        # Standard field definitions
node explore-system-org.js statuses      # Workflow status templates
node explore-system-org.js relationships # Relationship types
node explore-system-org.js transactions  # Transaction templates

# Use templates in your organization
node use-system-templates.js create-customer              # Create using template
node use-system-templates.js assign-status <id> PENDING   # Workflow management
node use-system-templates.js add-standard-fields <id>     # Add template fields
node use-system-templates.js demo-complete-flow           # See it all in action

# Copy all templates to another organization
node explore-system-org.js copy-to <organization-id>
```

## 🔄 Status Workflows (CRITICAL)

**NEVER add status columns!** Use relationships instead:

```bash
# Run the example to understand the pattern
node status-workflow-example.js

# Use system templates for standard statuses
node use-system-templates.js assign-status <entity-id> PENDING

# Key concept: Status is a relationship, not a field
# entity --[has_status]--> status_entity
```

## 🛡️ SACRED Rules

1. **NO STATUS COLUMNS** - Always use relationships for workflows
2. **NO SCHEMA CHANGES** - Use core_dynamic_data for custom fields
3. **ORGANIZATION_ID ALWAYS** - Multi-tenant isolation is sacred
4. **USE CLI TOOLS** - Direct queries can violate patterns
5. **SMART CODES REQUIRED** - Every operation needs context

## 📊 Universal Tables

| Table | Purpose | Key Rule |
|-------|---------|----------|
| core_organizations | WHO - Business isolation | Root of multi-tenancy |
| core_entities | WHAT - All business objects | Never create custom tables |
| core_dynamic_data | HOW - Custom fields | Never alter schema |
| core_relationships | WHY - All connections | Status, hierarchy, workflows |
| universal_transactions | WHEN - Business events | All activities here |
| universal_transaction_lines | DETAILS - Line items | Transaction breakdown |

## 🔧 MCP Server (Optional)

For Claude Desktop integration:
```bash
npm start  # Starts MCP server v2
```

Configure Claude Desktop:
```json
{
  "mcpServers": {
    "hera-universal": {
      "command": "node",
      "args": ["/path/to/mcp-server/hera-mcp-server-v2.js"],
      "env": {
        "SUPABASE_URL": "your-url",
        "SUPABASE_SERVICE_ROLE_KEY": "your-key",
        "DEFAULT_ORGANIZATION_ID": "your-org-uuid"
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Organization ID Error
```bash
# Find your organization
node hera-cli.js query core_organizations
# Copy the UUID and update .env
```

### Column Not Found
The actual schema uses different column names:
- `transaction_code` not `transaction_number`
- `from_entity_id/to_entity_id` not `parent/child`
- Check with: `node check-schema.js`

### Status Workflow Questions
Always run: `node status-workflow-example.js`

## 💡 Best Practices

1. **Start every session** with `node hera-query.js summary`
2. **Use relationships** for status, approval chains, hierarchies
3. **Dynamic fields** for all custom properties
4. **Smart codes** on every operation
5. **CLI tools** prevent architecture violations

Remember: If you're adding columns or tables, you're doing it wrong!