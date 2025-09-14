# HERA Procedure Tests

This directory contains test cases for all HERA procedures.

## Test File Format
Each procedure should have a corresponding test file:
```
{smart_code}.tests.json
```

## Test Structure
```json
{
  "smart_code": "HERA.{INDUSTRY}.{MODULE}.PROC.{ACTION}.v1",
  "test_cases": [
    {
      "name": "Happy path - complete flow",
      "setup": {
        "catalog_types": ["required types"],
        "existing_entities": [{...}],
        "user_permissions": ["role1", "role2"]
      },
      "input": {
        "organization_id": "550e8400-e29b-41d4-a716-446655440000",
        "field1": "value1"
      },
      "expected": {
        "success": true,
        "transaction_header": {
          "transaction_type": "expected_type",
          "smart_code": "HERA.XXX.XXX.TXN.XXX.v1",
          "total_amount": 100.00
        },
        "transaction_lines": [
          {
            "line_type": "expected_line_type",
            "line_entity_id": "entity_uuid",
            "quantity": 1,
            "line_amount": 100.00
          }
        ],
        "entities_created": 1,
        "relationships_created": 1
      }
    },
    {
      "name": "Error - missing required field",
      "input": {
        "organization_id": "550e8400-e29b-41d4-a716-446655440000"
      },
      "expected": {
        "success": false,
        "error_code": "MISSING_REQUIRED_FIELD",
        "error_message": "Required field 'field1' is missing"
      }
    },
    {
      "name": "Error - unknown catalog type",
      "input": {
        "organization_id": "550e8400-e29b-41d4-a716-446655440000",
        "entity_type": "unknown_type"
      },
      "expected": {
        "success": false,
        "error_code": "UNKNOWN_TYPE",
        "suggestions": ["valid_type1", "valid_type2"]
      }
    }
  ],
  "invariant_checks": [
    {
      "name": "All writes include organization_id",
      "query": "SELECT COUNT(*) FROM universal_transactions WHERE organization_id IS NULL",
      "expected": 0
    },
    {
      "name": "Financial transactions balance",
      "query": "SELECT transaction_id FROM universal_transaction_lines GROUP BY transaction_id HAVING SUM(debit_amount) != SUM(credit_amount)",
      "expected": []
    }
  ]
}
```

## Running Tests
Tests should verify:
1. Happy path produces expected outputs
2. All error cases handled gracefully
3. Invariants never violated
4. No schema changes attempted
5. Organization isolation maintained

## Test Coverage Requirements
- At least one happy path test
- Test each required input validation
- Test each error condition
- Test boundary conditions
- Test catalog type validation
- Test permission checks