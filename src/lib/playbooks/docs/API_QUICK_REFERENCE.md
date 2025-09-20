# Playbooks API Quick Reference Card

## Essential Endpoints

### Orchestration
```bash
# Execute a playbook
POST /api/v1/playbooks/execute
{ "playbook_id": "uuid", "context": {} }

# Check orchestration status
GET /api/v1/playbooks/orchestration/:id
```

### Workers
```bash
# Create worker
POST /api/v1/playbooks/workers
{ "worker_type": "entity|transaction|universal", "configuration": {} }

# Execute worker
POST /api/v1/playbooks/workers/:id/execute
{ "context": {} }
```

### Signals
```bash
# Emit signal
POST /api/v1/playbooks/signals
{ "signal_type": "entity_created|transaction_completed", "payload": {} }

# Subscribe to signal
POST /api/v1/playbooks/signals/subscribe
{ "signal_type": "...", "callback_url": "..." }
```

### Context
```bash
# Get context
GET /api/v1/playbooks/context/:orchestration_id

# Update context
PATCH /api/v1/playbooks/context/:orchestration_id
{ "updates": {} }
```

## Smart Code Patterns

| Type | Pattern | Example |
|------|---------|---------|
| **Playbook** | `HERA.PLY.{INDUSTRY}.{NAME}.v1` | `HERA.PLY.SALON.APPOINTMENT.v1` |
| **Worker** | `HERA.WKR.{TYPE}.{NAME}.v1` | `HERA.WKR.ENTITY.CREATE.v1` |
| **Signal** | `HERA.SIG.{TYPE}.{EVENT}.v1` | `HERA.SIG.ENTITY.CREATED.v1` |
| **Context** | `HERA.CTX.{SCOPE}.{TYPE}.v1` | `HERA.CTX.GLOBAL.STATE.v1` |

## Required Fields Checklist

### All Requests
- [x] `organization_id` - Always required for multi-tenant isolation
- [x] `smart_code` - Business context identifier
- [x] `created_by` - User/system identifier

### Entity Creation
- [x] `entity_type` - customer, product, service, etc.
- [x] `entity_name` - Human-readable name
- [x] `entity_code` - Unique identifier (optional, auto-generated)

### Transaction Creation
- [x] `transaction_type` - sale, appointment, payment, etc.
- [x] `transaction_date` - ISO 8601 format
- [x] `total_amount` - Decimal with 2 places

## Common HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| **200** | Success | Process response |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Check required fields |
| **401** | Unauthorized | Check auth token |
| **403** | Forbidden | Check organization context |
| **404** | Not Found | Verify resource ID |
| **422** | Validation Error | Check field formats |
| **500** | Server Error | Retry with backoff |

## Field Types Reference

### Worker Types
- `entity` - CRUD operations on core_entities
- `transaction` - Handle universal_transactions
- `relationship` - Manage core_relationships
- `dynamic_data` - Custom fields
- `universal` - Complex operations

### Orchestration Status
- `pending` - Not started
- `running` - In progress
- `completed` - Success
- `failed` - Error occurred
- `cancelled` - User cancelled

### Signal Types
- `entity_created` - New entity
- `entity_updated` - Entity modified
- `transaction_completed` - Transaction finished
- `workflow_stage_changed` - Status update
- `validation_failed` - Business rule violation

## Organization Context

### Set Default Organization
```javascript
// In headers
headers: {
  'X-Organization-ID': 'org-uuid',
  'Authorization': 'Bearer token'
}

// In request body
body: {
  organization_id: 'org-uuid',
  // ... other fields
}
```

### Multi-Org Patterns
```javascript
// Switch organization
POST /api/v1/organizations/switch
{ "organization_id": "new-org-uuid" }

// Get current context
GET /api/v1/organizations/current
```

---
**Pro Tips:**
- Always include `organization_id` in every request
- Use smart codes for automatic behavior
- Check worker status before dependent operations
- Batch operations when possible for performance