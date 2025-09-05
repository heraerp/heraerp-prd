# UCR MCP Integration Guide

## Overview

The Universal Configuration Rules (UCR) system now includes full Model Context Protocol (MCP) integration, allowing natural language orchestration of business rules without schema changes.

## Architecture

### Components

1. **MCP Server** (`/src/lib/mcp/ucr-mcp-server.ts`)
   - Implements 14 UCR orchestration tools
   - Handles rule lifecycle management
   - Integrates with HERA's universal 6-table architecture

2. **API Bridge** (`/src/app/api/v1/mcp/ucr/route.ts`)
   - REST API endpoint for MCP tool invocation
   - Organization-level security validation
   - Tool mapping and parameter validation

3. **React Hook** (`/src/lib/hooks/use-ucr-mcp.ts`)
   - Easy integration for React components
   - Type-safe tool invocation
   - Built-in error handling and loading states

4. **Admin UI** (`/src/components/admin/config/RulesListMCP.tsx`)
   - Visual rule management interface
   - Template browsing and cloning
   - Audit log viewing

## MCP Tools Available

### Rule Management
- `ucr.list_templates` - Browse industry-specific rule templates
- `ucr.clone_template` - Create new rules from templates
- `ucr.get_rule` - Retrieve rule by ID or smart code
- `ucr.validate_rule` - Validate draft rules before deployment
- `ucr.simulate_rule` - Test rules with scenarios
- `ucr.diff_rules` - Compare rule versions

### Version Control
- `ucr.bump_version` - Create new rule versions
- `ucr.deploy_rule` - Deploy rules to production
- `ucr.schedule_change` - Schedule future rule changes
- `ucr.rollback` - Rollback to previous versions

### Monitoring
- `ucr.audit_log` - View rule change history
- `ucr.search` - Search rules by various criteria

### Guardrails
- `guardrail.validate_payload` - Validate rule payloads
- `ledger.is_period_open` - Check accounting periods
- `auth.check_scope` - Verify user permissions

## Usage Examples

### React Component

```typescript
import { useUCRMCP } from '@/lib/hooks/use-ucr-mcp'

function MyComponent() {
  const { listTemplates, cloneTemplate, deployRule } = useUCRMCP()
  
  // List available templates
  const templates = await listTemplates('HOSPITALITY', 'SALON')
  
  // Clone a template
  const newRule = await cloneTemplate(
    'T_APPT_CANCEL',
    'HERA.SALON.CUSTOM.CANCEL_POLICY.v1'
  )
  
  // Deploy the rule
  const deployment = await deployRule(
    newRule.rule_id,
    { apps: ['salon'], locations: ['all'] },
    new Date().toISOString()
  )
}
```

### Direct API Call

```typescript
const response = await fetch('/api/v1/mcp/ucr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'list_templates',
    args: { industry: 'HOSPITALITY' },
    organizationId: 'your-org-id'
  })
})
const { templates } = await response.json()
```

### Natural Language (via Claude)

```
"List all salon booking rule templates"
"Clone the appointment cancellation template for my organization"
"Deploy the VIP discount rule to production with manager approval"
"Show me the audit log for pricing rules"
```

## Rule Template Structure

Templates follow this structure:

```typescript
{
  template_id: 'T_APPT_CANCEL',
  industry: 'HOSPITALITY',
  module: 'SALON',
  smart_code: 'HERA.HOSPITALITY.SALON.APPOINTMENT.CANCEL_POLICY.v1',
  title: 'Salon Appointment Cancellation Policy',
  rule_payload: {
    description: 'Standard salon cancellation policy',
    definitions: {
      grace_minutes: 15,
      no_show_fee_pct: 100,
      // ... other definitions
    },
    exceptions: [
      { if: { customer_tier: 'VIP' }, then: { ... } }
    ],
    calendar_effects: { ... },
    notifications: { ... }
  }
}
```

## Smart Code Patterns

All UCR rules follow HERA's smart code pattern:

```
HERA.{INDUSTRY}.{MODULE}.{FUNCTION}.{TYPE}.v{VERSION}

Examples:
- HERA.HOSPITALITY.SALON.APPOINTMENT.CANCEL_POLICY.v1
- HERA.HOSPITALITY.SALON.POS.DISCOUNT_CAP.v1
- HERA.HOSPITALITY.RESTAURANT.RESERVATION.BOOKING_WINDOW.v1
```

## Security & Multi-Tenancy

- All operations require valid `organization_id`
- Rules are isolated by organization
- Audit trail for all operations
- Role-based access control via `auth.check_scope`

## Testing

Run the test script to verify your integration:

```bash
node test-ucr-mcp.js
```

## Benefits

1. **Zero Schema Changes** - All rules stored in universal tables
2. **Natural Language Control** - Manage rules via conversation
3. **Industry Intelligence** - Pre-built templates for common scenarios
4. **Version Control** - Full history and rollback capabilities
5. **Real-time Updates** - Rules apply immediately without deployments
6. **Multi-Tenant Ready** - Perfect organization isolation

## Next Steps

1. Browse available templates in the admin UI
2. Clone templates for your business needs
3. Test rules with simulation scenarios
4. Deploy to production with confidence
5. Monitor performance via audit logs