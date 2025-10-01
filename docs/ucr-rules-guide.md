# UCR Rules Template & Examples

Universal Configuration Registry (UCR) bundles are the DNA-bound blueprints the platform loads at runtime. Each bundle is keyed by a Smart Code and tells the system how to validate, transform, and persist requests across the Sacred Six Tables — without schema changes.

## Smart Code Format
```
HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.{VERSION}
```

One bundle per Smart Code version. New behavior ships via a new version (e.g., `...v2`).

## Storage

Stored as JSON in `core_dynamic_data` table:
- `organization_id` (UUID | null for global)
- `field_name` = 'ucr_rule'
- `field_type` = 'json'
- `smart_code` = The Smart Code this bundle applies to
- `field_value_json` = The UCR bundle content

## Bundle Structure

### Top-Level Schema (TypeScript)

```typescript
export type UCRBundle = {
  code: string;           // Smart Code
  kind: 'entity' | 'transaction' | 'relationship' | 'playbook';
  version: string;        // e.g., 'v1'
  
  metadata: {
    title: string;
    description?: string;
    author?: string;
    tags?: string[];
  };
  
  // Validation & transformation rules
  rules?: {
    fields: Record<string, FieldRule>;
    line_fields?: Record<string, FieldRule>;  // For transactions
    
    // Conditional requirements
    requires?: Array<{
      when: string;    // Predicate expression
      then: string;    // What becomes required
    }>;
    
    // Data transformations
    transforms?: Array<TransformRule>;
    
    // Domain enumeration sources
    lookups?: Record<string, StaticLookup | QueryLookup>;
    
    // Finance DNA & posting logic (transactions only)
    posting?: PostingRules;
  };
  
  // Procedures - atomic unit of work
  procedures?: Array<ProcedureStep>;
  
  // Playbook - multi-step orchestration
  playbook?: {
    steps: Array<ProcedureStep | ConditionalStep>;
    idempotency_key?: string;  // Expression
  };
};

export type FieldRule = {
  type: 'text' | 'number' | 'boolean' | 'date' | 'json';
  required?: boolean | string;  // Boolean or predicate
  min?: number; 
  max?: number;
  length?: { min?: number; max?: number };
  regex?: string;
  enum?: string[];
  default?: unknown | { expr: string };
  derive?: { expr: string; overwrite?: boolean };
  unique?: boolean;
  lookup?: string;
  format?: 'email' | 'uuid' | 'phone' | 'iso-date' | 'iso-datetime' | 'currency-3';
  description?: string;
};

export type TransformRule =
  | { op: 'trim'; fields: string[] }
  | { op: 'uppercase'; fields: string[] }
  | { op: 'lowercase'; fields: string[] }
  | { op: 'compute'; out: string; expr: string }
  | { op: 'rename'; from: string; to: string };

export type StaticLookup = { 
  kind: 'static'; 
  values: Array<{ value: string; label?: string }> 
};

export type QueryLookup = { 
  kind: 'query'; 
  rpc: string; 
  params?: Record<string, unknown> 
};

export type PostingRules = {
  currency: {
    require_base?: boolean;
    allow_exchange_rate?: boolean;
  };
  lines: Array<{
    match: { line_type: string };
    derive: {
      line_amount?: string;
      account_id?: string;
      polarity?: 'debit' | 'credit' | { expr: string };
    };
    validate?: string[];
  }>;
  require_balanced?: boolean;
};

export type ProcedureStep = {
  name: string;
  fn: string;  // RPC function name
  params: 'payload' | Record<string, unknown> | { expr: string };
  on_error?: 'stop' | 'continue' | { goto: string };
};

export type ConditionalStep = {
  if: string;
  then: Array<ProcedureStep>;
  else?: Array<ProcedureStep>;
};
```

## Minimal JSON Template

```json
{
  "code": "HERA.IND.MOD.ENT.XYZ.v1",
  "kind": "entity",
  "version": "v1",
  "metadata": {
    "title": "<Human Title>",
    "description": "<What this entity/txn does>"
  },
  "rules": {
    "fields": {
      "p_organization_id": { "type": "text", "format": "uuid", "required": true },
      "p_smart_code": { "type": "text", "required": true },
      "p_entity_name": { "type": "text", "required": true, "length": { "max": 500 } }
    },
    "transforms": [
      { "op": "trim", "fields": ["p_entity_name"] }
    ]
  },
  "procedures": [
    { "name": "Upsert Entity", "fn": "hera_entity_upsert_v1", "params": "payload" }
  ]
}
```

## SALON Industry Examples

### Salon Customer Entity

**Smart Code**: `HERA.SALON.CRM.ENT.CUST.v1`

```json
{
  "code": "HERA.SALON.CRM.ENT.CUST.v1",
  "kind": "entity",
  "version": "v1",
  "metadata": { 
    "title": "Salon Customer",
    "description": "Customer profile for salon services with loyalty tracking"
  },
  "rules": {
    "fields": {
      "p_organization_id": { "type": "text", "format": "uuid", "required": true },
      "p_smart_code": { "type": "text", "required": true },
      "p_entity_type": { "type": "text", "default": "customer" },
      "p_entity_name": { "type": "text", "required": true, "length": { "max": 500 } },
      "email": { "type": "text", "format": "email", "required": true, "unique": true },
      "phone": { "type": "text", "regex": "^\\+?[0-9]{7,15}$" },
      "loyalty_tier": { "type": "text", "lookup": "tier_levels", "default": "bronze" },
      "preferred_stylist": { "type": "text", "format": "uuid" },
      "birthday": { "type": "date" },
      "allergies": { "type": "text", "length": { "max": 1000 } }
    },
    "lookups": {
      "tier_levels": { 
        "kind": "static", 
        "values": [
          { "value": "bronze", "label": "Bronze Member" },
          { "value": "silver", "label": "Silver Member" },
          { "value": "gold", "label": "Gold Member" },
          { "value": "platinum", "label": "Platinum Member" }
        ]
      }
    },
    "transforms": [
      { "op": "lowercase", "fields": ["email"] },
      { "op": "trim", "fields": ["p_entity_name", "phone", "allergies"] }
    ]
  },
  "procedures": [
    { "name": "Upsert Customer", "fn": "hera_entity_upsert_v1", "params": "payload" }
  ]
}
```

### Salon Service Entity

**Smart Code**: `HERA.SALON.SVC.ENT.SERVICE.v1`

```json
{
  "code": "HERA.SALON.SVC.ENT.SERVICE.v1",
  "kind": "entity",
  "version": "v1",
  "metadata": {
    "title": "Salon Service",
    "description": "Service catalog for salon treatments"
  },
  "rules": {
    "fields": {
      "p_organization_id": { "type": "text", "format": "uuid", "required": true },
      "p_smart_code": { "type": "text", "required": true },
      "p_entity_type": { "type": "text", "default": "service" },
      "p_entity_name": { "type": "text", "required": true },
      "p_entity_code": { "type": "text", "required": true, "unique": true },
      "category": { "type": "text", "enum": ["hair", "nails", "facial", "massage", "other"] },
      "duration_minutes": { "type": "number", "required": true, "min": 15, "max": 480 },
      "base_price": { "type": "number", "required": true, "min": 0 },
      "requires_patch_test": { "type": "boolean", "default": false }
    },
    "transforms": [
      { "op": "uppercase", "fields": ["p_entity_code"] },
      { "op": "trim", "fields": ["p_entity_name"] }
    ]
  },
  "procedures": [
    { "name": "Upsert Service", "fn": "hera_entity_upsert_v1", "params": "payload" }
  ]
}
```

### Salon Appointment Transaction

**Smart Code**: `HERA.SALON.APPT.TXN.BOOKING.v1`

```json
{
  "code": "HERA.SALON.APPT.TXN.BOOKING.v1",
  "kind": "transaction",
  "version": "v1",
  "metadata": {
    "title": "Salon Appointment Booking",
    "description": "Customer appointment with services and products"
  },
  "rules": {
    "fields": {
      "p_organization_id": { "type": "text", "format": "uuid", "required": true },
      "p_smart_code": { "type": "text", "required": true },
      "p_transaction_type": { "type": "text", "default": "appointment" },
      "p_transaction_date": { "type": "date", "required": true },
      "p_total_amount": { "type": "number", "required": true, "min": 0 },
      "p_source_entity_id": { "type": "text", "format": "uuid", "required": true },
      "p_target_entity_id": { "type": "text", "format": "uuid", "required": true },
      "p_transaction_currency_code": { "type": "text", "format": "currency-3", "required": true },
      "appointment_time": { "type": "text", "required": true, "regex": "^([01]?[0-9]|2[0-3]):[0-5][0-9]$" },
      "status": { "type": "text", "enum": ["booked", "confirmed", "arrived", "in_progress", "completed", "cancelled", "no_show"] }
    },
    "line_fields": {
      "line_number": { "type": "number", "required": true, "min": 1 },
      "line_type": { "type": "text", "required": true, "enum": ["SERVICE", "PRODUCT", "TAX", "DISCOUNT", "TIP"] },
      "entity_id": { "type": "text", "format": "uuid" },
      "description": { "type": "text", "required": true },
      "quantity": { "type": "number", "required": true, "min": 0 },
      "unit_amount": { "type": "number", "required": true, "min": 0 },
      "line_amount": { "type": "number", "required": true },
      "smart_code": { "type": "text", "required": true },
      "stylist_id": { "type": "text", "format": "uuid" }
    },
    "posting": {
      "currency": { "require_base": false, "allow_exchange_rate": false },
      "lines": [
        {
          "match": { "line_type": "SERVICE" },
          "derive": {
            "line_amount": "quantity * unit_amount",
            "polarity": "debit"
          }
        },
        {
          "match": { "line_type": "PRODUCT" },
          "derive": {
            "line_amount": "quantity * unit_amount",
            "polarity": "debit"
          }
        },
        {
          "match": { "line_type": "TAX" },
          "derive": { "polarity": "debit" }
        },
        {
          "match": { "line_type": "DISCOUNT" },
          "derive": { 
            "line_amount": "-1 * abs(line_amount)", 
            "polarity": "credit" 
          }
        },
        {
          "match": { "line_type": "TIP" },
          "derive": { "polarity": "debit" }
        }
      ],
      "require_balanced": false
    }
  },
  "procedures": [
    { "name": "Create Appointment", "fn": "hera_transaction_create_v1", "params": "payload" }
  ]
}
```

### Customer-Appointment Relationship

**Smart Code**: `HERA.SALON.CRM.REL.CUST_APPT.v1`

```json
{
  "code": "HERA.SALON.CRM.REL.CUST_APPT.v1",
  "kind": "relationship",
  "version": "v1",
  "metadata": { 
    "title": "Customer → Appointment",
    "description": "Links customer to their appointments"
  },
  "rules": {
    "fields": {
      "p_organization_id": { "type": "text", "format": "uuid", "required": true },
      "p_smart_code": { "type": "text", "required": true },
      "p_from_entity_id": { "type": "text", "format": "uuid", "required": true },
      "p_to_entity_id": { "type": "text", "format": "uuid", "required": true },
      "p_relationship_type": { "type": "text", "default": "has_appointment" },
      "p_relationship_strength": { "type": "number", "min": 0, "max": 1, "default": 1 }
    }
  },
  "procedures": [
    { "name": "Link Customer to Appointment", "fn": "hera_relationship_upsert_v1", "params": "payload" }
  ]
}
```

### Salon Monthly Close Playbook

**Smart Code**: `HERA.SALON.FIN.PLB.MONTH_CLOSE.v1`

```json
{
  "code": "HERA.SALON.FIN.PLB.MONTH_CLOSE.v1",
  "kind": "playbook",
  "version": "v1",
  "metadata": {
    "title": "Salon Monthly Close",
    "description": "Month-end procedures for salon operations"
  },
  "playbook": {
    "idempotency_key": "${p_organization_id}-${p_year}-${p_month}",
    "steps": [
      { 
        "name": "Calculate Commission", 
        "fn": "salon_calculate_commission_v1", 
        "params": { 
          "p_organization_id": "${p_organization_id}",
          "p_year": "${p_year}",
          "p_month": "${p_month}"
        }
      },
      {
        "name": "Post Inventory Adjustments",
        "fn": "salon_post_inventory_v1",
        "params": "payload"
      },
      {
        "name": "Update Loyalty Points",
        "fn": "salon_update_loyalty_v1",
        "params": "payload"
      },
      {
        "name": "Generate Monthly Reports",
        "fn": "salon_generate_reports_v1",
        "params": "payload"
      }
    ]
  }
}
```

## Authoring Guidelines

1. **One Smart Code = One Bundle** (immutable version)
2. **Keep required guardrail fields present**: `p_organization_id`, `p_smart_code`
3. **For transactions**: Include Finance DNA fields
4. **Reserve `debit_credit`** for derived posting rules — never as user input
5. **Use standard line fields**: `line_number`, `line_type`, `smart_code`, `description`, `unit_amount`, `line_amount`
6. **Prefer static enums** for short lists; use query lookups for dynamic lists
7. **Use transforms** to normalize input before procedures
8. **Keep procedures idempotent**; make playbooks idempotent with stable keys

## Loading & Using in Code

```typescript
// Load Smart Code bundle
const engine = await SmartCodeEngine.loadSmartCode(smartCode, orgId);

// Build dynamic schema
const schema = await EntityBuilder.buildSchema(smartCode, orgId);

// In API route:
// 1. Validate with base schemas
// 2. Apply guardrails
// 3. Validate with dynamic schema
// 4. Execute procedures via callRPC
```

## Testing Checklist

- [ ] Smart Code follows HERA pattern
- [ ] All required fields present
- [ ] Field types match database schema
- [ ] Transforms apply correctly
- [ ] Procedures reference valid RPC functions
- [ ] Lookups resolve correctly
- [ ] Posting rules balance (for transactions)
- [ ] Playbook steps execute in order
- [ ] Error handling works as expected