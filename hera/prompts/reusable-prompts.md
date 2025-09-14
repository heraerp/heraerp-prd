# HERA Reusable Prompts

## 1. Bootstrap a New Procedure
```
Use TEVL. Create a HERA Procedure Card for
HERA.{INDUSTRY}.{MODULE}.{PROC}.v1 covering intent, preconditions, invariants,
inputs/outputs, steps, errors, checks. Include minimal SQL/TS to write
universal_transactions + universal_transaction_lines. No schema changes.
```

## 2. Extend with Rule-Pack & Tests
```
Attach a rule-pack (smart code) that enforces lifecycles and pricing. Produce
3 test cases with inputs and the exact headers/lines expected. Return as
/procedures/{smart_code}.yml and /tests/procedures/{smart_code}.cases.json.
```

## 3. Recall Anchor at Session Start
```
Recall in 5 bullets: Sacred Six, Smart Codes, Universal Transaction pattern,
catalog enforcement, and TEVL loop. Then continue.
```

## 4. Validate Against Guardrails
```
Check this procedure against HERA guardrails: organization isolation,
catalog types exist, transactions balance, smart codes valid format,
no schema changes. List any violations.
```

## 5. Generate TypeScript Client
```
Generate a TypeScript function for this HERA procedure that:
- Validates inputs against catalog
- Applies smart code rules
- Emits transactions with proper lines
- Returns typed response
Use only Sacred Six tables.
```

## 6. Create Test Vectors
```
For HERA.{INDUSTRY}.{MODULE}.{PROC}.v1, create 5 test cases:
1. Happy path with all features
2. Minimal valid input
3. Error: missing required field
4. Error: invalid catalog type
5. Error: business rule violation
Show exact expected outputs.
```

## 7. Extract Reusable Pattern
```
Identify the reusable pattern in this procedure. Create a SQL snippet
and TypeScript helper that can be adapted for similar use cases.
Save to /snippets/ with descriptive names.
```

## 8. Document Integration Points
```
For this procedure, document:
- Which entity types it reads/writes
- Which transaction types it emits
- Which relationships it creates/checks
- Which dynamic data it uses
- Which other procedures it calls/triggers
```

## 9. Performance Optimization
```
Review this procedure for performance. Suggest:
- Index recommendations (on Sacred Six only)
- Query optimizations
- Batch processing opportunities
- Caching strategies
No schema changes allowed.
```

## 10. Generate Catalog Entries
```
Based on this procedure, generate the required catalog entries:
- ENTITY_TYPE definitions
- TXN_TYPE definitions  
- LINE_TYPE definitions
- REL_TYPE definitions
Format as JSON for /catalog/{org_id}/catalog.json
```