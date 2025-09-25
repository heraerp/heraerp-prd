# Template: Universal Event Payload
Use this to emit any business event via the Universal API.

```json
{
  "organization_id": "<uuid>",
  "smart_code": "HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v1",
  "transaction_type": "<type>",
  "transaction_date": "<ISO8601>",
  "source_entity_id": "<uuid-or-null>",
  "target_entity_id": "<uuid-or-null>",
  "business_context": { },
  "lines": [
    { "line_type": "service", "entity_id": "<uuid>", "quantity": 1, "unit_amount": 0 }
  ]
}
```
