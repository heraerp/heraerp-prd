# HERA API v2 Contract Specification

## Base URL & Authentication

```
Base URL: {supabase_url}/functions/v1/api-v2
```

### Required Headers
```http
Authorization: Bearer <jwt_token>
X-Organization-Id: <organization_uuid>
Content-Type: application/json
```

## Command Interface

### POST /api-v2/command

Universal command interface for all operations.

#### Entity Operations

**Create/Update Entity**
```typescript
POST /api-v2/command
{
  "op": "entities",
  "p_operation": "CREATE" | "UPDATE" | "DELETE",
  "p_data": {
    "entity_type": "CUSTOMER",
    "entity_name": "Jane Doe",
    "smart_code": "HERA.RETAIL.CUSTOMER.v1",
    "metadata": {
      "source": "ui",
      "import_batch_id": null
    },
    "dynamic_fields": [
      {
        "field_name": "loyalty_tier",
        "field_type": "text",
        "field_value_text": "VIP",
        "validation_rules": {
          "enum": ["VIP", "REGULAR", "NEW"],
          "required": true
        },
        "smart_code": "HERA.RETAIL.CUSTOMER.DYN.LOYALTY_TIER.v1",
        "field_order": 2,
        "is_required": true
      },
      {
        "field_name": "email",
        "field_type": "email", 
        "field_value_text": "jane@example.com",
        "validation_rules": {
          "regex": "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
          "required": true
        },
        "smart_code": "HERA.RETAIL.CUSTOMER.DYN.EMAIL.v1",
        "field_order": 1,
        "is_required": true
      }
    ]
  }
}
```

**Response**
```typescript
{
  "rid": "req_1234567890",
  "data": {
    "entity_id": "ent_abcd1234",
    "entity_name": "Jane Doe", 
    "entity_type": "CUSTOMER",
    "smart_code": "HERA.RETAIL.CUSTOMER.v1",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  },
  "actor": "usr_actor123",
  "org": "org_tenant456"
}
```

#### Transaction Operations

**Create Financial Transaction**
```typescript
POST /api-v2/command
{
  "op": "transactions",
  "p_operation": "CREATE",
  "p_data": {
    "transaction_type": "SALE",
    "smart_code": "HERA.RETAIL.TXN.SALE.v1",
    "transaction_data": {
      "customer_id": "ent_abcd1234",
      "total_amount": 150.00,
      "currency": "USD",
      "description": "Retail sale transaction"
    },
    "lines": [
      {
        "line_number": 1,
        "line_type": "GL",
        "smart_code": "HERA.FINANCE.GL.ASSET.CASH.v1",
        "line_amount": 150.00,
        "transaction_currency_code": "USD",
        "line_data": {
          "side": "DR",
          "account_code": "1100", 
          "account_name": "Cash"
        }
      },
      {
        "line_number": 2,
        "line_type": "GL", 
        "smart_code": "HERA.FINANCE.GL.REVENUE.SALES.v1",
        "line_amount": 150.00,
        "transaction_currency_code": "USD",
        "line_data": {
          "side": "CR",
          "account_code": "4100",
          "account_name": "Sales Revenue" 
        }
      }
    ]
  }
}
```

## Read Operations

### GET /api-v2/customers

List customers with org-aware filtering.

**Query Parameters**
```
?search=          # Optional: Search term for name/email
&limit=50         # Optional: Results per page (default 50, max 100)
&offset=0         # Optional: Pagination offset
&sort=name        # Optional: Sort field (name, created_at, updated_at)
&order=asc        # Optional: Sort order (asc, desc)
```

**Response**
```typescript
{
  "rid": "req_1234567891",
  "data": {
    "customers": [
      {
        "entity_id": "ent_abcd1234",
        "entity_name": "Jane Doe",
        "entity_type": "CUSTOMER", 
        "smart_code": "HERA.RETAIL.CUSTOMER.v1",
        "created_at": "2025-01-15T10:30:00Z",
        "updated_at": "2025-01-15T10:30:00Z",
        "created_by": "usr_actor123",
        "dynamic_fields": {
          "loyalty_tier": {
            "field_value_text": "VIP",
            "smart_code": "HERA.RETAIL.CUSTOMER.DYN.LOYALTY_TIER.v1"
          },
          "email": {
            "field_value_text": "jane@example.com", 
            "smart_code": "HERA.RETAIL.CUSTOMER.DYN.EMAIL.v1"
          }
        }
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 1,
      "has_more": false
    }
  },
  "actor": "usr_actor123",
  "org": "org_tenant456"
}
```

### GET /api-v2/customers/{id}

Get specific customer by ID.

**Response**
```typescript
{
  "rid": "req_1234567892", 
  "data": {
    "entity_id": "ent_abcd1234",
    "entity_name": "Jane Doe",
    "entity_type": "CUSTOMER",
    "smart_code": "HERA.RETAIL.CUSTOMER.v1", 
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "created_by": "usr_actor123",
    "updated_by": "usr_actor123",
    "dynamic_fields": {
      "loyalty_tier": {
        "field_value_text": "VIP",
        "validation_rules": {"enum": ["VIP", "REGULAR", "NEW"]},
        "smart_code": "HERA.RETAIL.CUSTOMER.DYN.LOYALTY_TIER.v1"
      },
      "email": {
        "field_value_text": "jane@example.com",
        "validation_rules": {"regex": "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"},
        "smart_code": "HERA.RETAIL.CUSTOMER.DYN.EMAIL.v1"
      }
    },
    "relationships": [
      {
        "relationship_type": "ASSIGNED_TO_TERRITORY",
        "target_entity_id": "ent_territory_west",
        "target_entity_name": "West Coast Territory"
      }
    ]
  },
  "actor": "usr_actor123", 
  "org": "org_tenant456"
}
```

## Error Responses

### Standard Error Format
```typescript
{
  "error": "string",
  "error_code": "string",
  "rid": "string",
  "details": object | null,
  "timestamp": "ISO8601"
}
```

### Common Errors

**400 Bad Request - Missing Organization Filter**
```json
{
  "error": "Organization filter required",
  "error_code": "ORG_FILTER_MISSING", 
  "rid": "req_1234567893",
  "details": {
    "required_header": "X-Organization-Id",
    "payload_field": "organization_id"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**400 Bad Request - Invalid Smart Code**
```json
{
  "error": "Smart Code format invalid",
  "error_code": "SMARTCODE_INVALID_FORMAT",
  "rid": "req_1234567894", 
  "details": {
    "provided": "invalid.format",
    "expected_pattern": "HERA.{MODULE}.{TYPE}.{SUBTYPE}.v{VERSION}",
    "examples": ["HERA.RETAIL.CUSTOMER.v1", "HERA.RETAIL.CUSTOMER.DYN.LOYALTY_TIER.v1"]
  },
  "timestamp": "2025-01-15T10:31:00Z"
}
```

**403 Forbidden - Actor Not Member**
```json
{
  "error": "Actor not member of organization", 
  "error_code": "ACTOR_NOT_MEMBER",
  "rid": "req_1234567895",
  "details": {
    "actor_id": "usr_actor123",
    "organization_id": "org_tenant789"
  },
  "timestamp": "2025-01-15T10:32:00Z"
}
```

## Field Types & Validation

### Supported Field Types
- `text` - String values
- `email` - Email addresses with validation
- `phone` - Phone numbers
- `number` - Numeric values  
- `boolean` - True/false values
- `date` - ISO date strings
- `datetime` - ISO datetime strings
- `select` - Enumerated values
- `multiselect` - Multiple enumerated values
- `json` - JSON objects
- `file_url` - File URLs

### Validation Rules
```typescript
{
  "required": boolean,
  "min": number,           // For numbers/strings
  "max": number,           // For numbers/strings  
  "minLength": number,     // For strings
  "maxLength": number,     // For strings
  "regex": "string",       // RegExp pattern
  "enum": string[],        // Allowed values
  "message": "string"      // Custom error message
}
```

## Performance & Caching

### Response Times
- Entity operations: < 200ms p95
- List operations: < 300ms p95  
- Validation: < 50ms p95

### Caching Strategy
- Org context: 5 minute TTL
- Field configurations: 5 minute TTL, invalidated on org settings change
- Actor membership: 5 minute TTL

### Rate Limits
- Per actor: 1000 requests/minute
- Per organization: 10000 requests/minute
- Burst allowance: 50 requests/10 seconds

This contract ensures consistent, secure, and performant access to HERA's multi-tenant customer management system.