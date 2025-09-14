# HERA Quick Reference Card

## Session Start
```
Recall in 5 bullets: Sacred Six, Smart Codes, Universal Transaction pattern,
catalog enforcement, and TEVL loop. Then continue.
```

## New Procedure
```
Use TEVL. Create a HERA Procedure Card for
HERA.{INDUSTRY}.{MODULE}.{PROC}.v1 covering intent, preconditions, invariants,
inputs/outputs, steps, errors, checks. Include minimal SQL/TS to write
universal_transactions + universal_transaction_lines. No schema changes.
```

## Add Tests
```
Attach a rule-pack (smart code) that enforces lifecycles and pricing. Produce
3 test cases with inputs and the exact headers/lines expected. Return as
/procedures/{smart_code}.yml and /tests/procedures/{smart_code}.cases.json.
```

## Validate
```
Check this procedure against HERA guardrails: organization isolation,
catalog types exist, transactions balance, smart codes valid format,
no schema changes. List any violations.
```

## Quick Patterns

### Status Check
```sql
-- Status via relationships (never columns)
SELECT e.*, s.entity_code as status
FROM core_entities e
JOIN core_relationships r ON e.id = r.from_entity_id
JOIN core_entities s ON r.to_entity_id = s.id
WHERE r.relationship_type = 'has_status'
  AND e.organization_id = $1
```

### Dynamic Data
```sql
-- Custom fields without schema changes
INSERT INTO core_dynamic_data (
  organization_id, entity_id, field_name, 
  field_value_text, smart_code
) VALUES ($1, $2, $3, $4, $5)
```

### Transaction Pattern
```sql
-- Header + Lines
INSERT INTO universal_transactions (...) 
VALUES (...) RETURNING id;

INSERT INTO universal_transaction_lines (
  transaction_id, line_number, line_type, ...
) VALUES ($1, $2, $3, ...)
```

## Smart Code Format
```
HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{N}

Types: ENT, TXN, REL, DYN, PROC, LINE
```

## TEVL Loop
1. **T**each: Recall 5 HERA rules
2. **E**xecute: Create Procedure Card + code
3. **V**erify: Checklist + test vectors
4. **L**og: Save to /procedures/ and /tests/