# HERA Role-Based Access Control (RBAC)

## Overview

HERA's RBAC system provides fine-grained access control through policy-based permissions tied to smart code families, ensuring secure multi-tenant operations.

## Core Concepts

### 1. Roles
Roles are collections of permissions assigned to users:
- **ADMIN**: Full system access with restrictions on critical operations
- **FINANCE_MANAGER**: Financial operations and reporting
- **OPERATIONS_MANAGER**: Operational data and workflows
- **USER**: Basic read/write for assigned resources
- **VIEWER**: Read-only access

### 2. Permissions
Permissions control access to:
- **API Endpoints**: HTTP method + path patterns
- **Smart Code Families**: Business operation categories
- **Resource Types**: Specific data types (own, all, specific)
- **Actions**: CRUD operations + custom actions

### 3. Conditions
Dynamic permission conditions:
- **Time-Based**: Business hours, time windows
- **Location-Based**: IP ranges, geo-restrictions
- **MFA Required**: For sensitive operations
- **Custom**: Business-specific rules

## Policy Definition

### YAML Policy Structure
```yaml
role: ROLE_NAME
allow:
  - api: "METHOD /path/pattern/**"
    smart_code_family: "HERA.DOMAIN.**"
    resource_type: "own" | "all" | "specific"
    actions: ["read", "write", "delete", "approve"]
deny:
  - api: "METHOD /path/pattern/**"
    smart_code_family: "HERA.DOMAIN.**"
conditions:
  - type: "condition_type"
    config:
      key: value
```

### Example Policies

#### Finance Manager
```yaml
role: FINANCE_MANAGER
allow:
  # Fiscal operations
  - api: "POST /api/v1/fiscal/**"
    smart_code_family: "HERA.FISCAL.**"
  
  # Financial reporting
  - api: "GET /api/v1/reports/**"
    smart_code_family: "HERA.FIN.REPORT.**"
  
  # GL operations
  - smart_code_family: "HERA.FIN.GL.**"
    actions: ["read", "write", "approve"]
  
  # Budget management
  - smart_code_family: "HERA.FIN.BUDGET.**"
    actions: ["read", "write", "approve"]

deny:
  - api: "DELETE /api/v1/**"
  - smart_code_family: "HERA.SECURITY.**"

conditions:
  - type: time_based
    config:
      business_hours_only: true
      allowed_hours: [7, 19]
  - type: mfa_required
    config:
      for_sensitive_operations: true
```

#### Operations Manager
```yaml
role: OPERATIONS_MANAGER
allow:
  # Inventory management
  - smart_code_family: "HERA.INV.**"
    actions: ["read", "write", "transfer"]
  
  # Order processing
  - smart_code_family: "HERA.SALES.ORDER.**"
    actions: ["read", "write", "approve", "cancel"]
  
  # Warehouse operations
  - smart_code_family: "HERA.WMS.**"
    actions: ["read", "write", "pick", "pack", "ship"]
  
  # Reporting
  - api: "GET /api/v1/reports/operational/**"

deny:
  - smart_code_family: "HERA.FIN.**"
  - api: "POST /api/v1/fiscal/**"

conditions:
  - type: location_based
    config:
      allowed_facilities: ["warehouse_1", "warehouse_2"]
```

## Permission Evaluation

### Decision Flow
```
1. User makes request
2. Extract roles from JWT/session
3. For each role:
   a. Check DENY rules (explicit deny wins)
   b. Check ALLOW rules
   c. Evaluate conditions
4. Return decision with audit trail
```

### Smart Code Matching
Smart codes use hierarchical patterns:
- `HERA.**` - All HERA operations
- `HERA.FIN.**` - All financial operations
- `HERA.FIN.GL.**` - General ledger operations
- `HERA.FIN.GL.ACCOUNT.**` - GL account operations

### API Path Matching
Supports glob patterns:
- `GET /api/v1/**` - All GET requests
- `POST /api/v1/reports/*` - POST to any report endpoint
- `PUT /api/v1/entities/*/status` - Update status of any entity

## Implementation

### 1. Check Permission
```typescript
const decision = await rbacPolicy.checkPermission({
  organizationId: 'org-123',
  userId: 'user-456',
  roles: ['FINANCE_MANAGER'],
  action: 'POST /api/v1/fiscal/closing-step',
  smartCode: 'HERA.FISCAL.CLOSE.STEP.v1',
  context: {
    mfa_verified: true,
    ip: '10.0.0.1'
  }
})

if (!decision.allowed) {
  throw new ForbiddenError(decision.reason)
}
```

### 2. Middleware Integration
```typescript
app.use(async (req, res, next) => {
  const decision = await rbacPolicy.checkPermission({
    organizationId: req.organization_id,
    userId: req.user_id,
    roles: req.user_roles,
    action: `${req.method} ${req.path}`,
    smartCode: extractSmartCode(req),
    context: {
      ip: req.ip,
      mfa_verified: req.session.mfa_verified
    }
  })

  if (!decision.allowed) {
    return res.status(403).json({
      type: 'https://hera.app/errors/forbidden',
      title: 'Access Denied',
      detail: decision.reason,
      audit_id: decision.audit_id
    })
  }

  next()
})
```

### 3. Policy Management
```typescript
// Create/update policy
await rbacPolicy.upsertPolicy(
  organizationId,
  'policy-finance-manager',
  policyYaml
)

// Load policies for organization
await rbacPolicy.loadPolicies(organizationId)
```

## Conditional Access

### Time-Based Conditions
```yaml
conditions:
  - type: time_based
    config:
      business_hours_only: true
      allowed_hours: [8, 18]        # 8 AM to 6 PM
      allowed_days: [1, 2, 3, 4, 5] # Monday to Friday
      timezone: "America/New_York"
```

### IP-Based Conditions
```yaml
conditions:
  - type: ip_range
    config:
      allowed_ranges:
        - "10.0.0.0/8"      # Internal network
        - "192.168.0.0/16"  # VPN range
      blocked_ranges:
        - "0.0.0.0/8"       # Invalid IPs
```

### MFA Requirements
```yaml
conditions:
  - type: mfa_required
    config:
      always: true                    # Always require MFA
      for_sensitive_operations: true  # Only for sensitive ops
      grace_period_minutes: 15        # Re-verify after 15 min
```

### Custom Conditions
```yaml
conditions:
  - type: custom
    config:
      requires_training: true
      training_modules: ["security_awareness", "data_handling"]
      certification_valid_days: 365
```

## Best Practices

### 1. Principle of Least Privilege
- Grant minimum permissions required
- Use specific smart code families
- Prefer allow over deny patterns
- Regular permission audits

### 2. Separation of Duties
- Financial approval separate from creation
- System admin separate from business ops
- Audit review independent roles

### 3. Defense in Depth
- Combine API and smart code permissions
- Layer conditions for sensitive operations
- Time-based access for temporary needs

### 4. Regular Reviews
- Monthly permission audits
- Quarterly role reviews
- Annual policy updates
- Continuous monitoring

## Audit Trail

All permission checks are logged:
```json
{
  "transaction_type": "policy_check",
  "smart_code": "HERA.SECURITY.RBAC.DECISION.v1",
  "metadata": {
    "user_id": "user-123",
    "roles": ["FINANCE_MANAGER"],
    "action": "POST /api/v1/fiscal/closing-step",
    "decision": "ALLOW",
    "applied_rules": [
      "FINANCE_MANAGER:ALLOW:api=POST /api/v1/fiscal/**"
    ],
    "conditions_evaluated": 2,
    "duration_ms": 12
  }
}
```

## Troubleshooting

### Common Issues

1. **Access Denied Despite Valid Role**
   - Check conditions (time, MFA, IP)
   - Verify smart code matches policy
   - Look for explicit deny rules

2. **Policy Not Applied**
   - Ensure policy is active
   - Check organization context
   - Verify policy syntax

3. **Performance Issues**
   - Review complex patterns
   - Optimize condition checks
   - Consider policy caching