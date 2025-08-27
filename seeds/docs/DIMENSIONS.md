# Dimension Requirements Guide

## Overview

Dimensions provide analytical segmentation for journal entries. The posting schema enforces dimension requirements on specific accounts to ensure proper cost allocation and reporting.

## Dimension Configuration

### In Posting Schema DSL

```json
{
  "dimension_requirements": [
    {
      "account_pattern": "^4.*",  // Revenue accounts
      "required_dimensions": ["org_unit", "staff_id"],
      "enforcement": "error"
    },
    {
      "account_pattern": "^5.*",  // Expense accounts
      "required_dimensions": ["cost_center"],
      "enforcement": "warning"
    }
  ]
}
```

### Enforcement Levels

- **error** - Transaction fails if dimensions missing
- **warning** - Transaction proceeds but logs warning
- **auto_default** - Uses default values if missing

## Standard Dimensions

### Business Dimensions

1. **org_unit** - Organizational unit (branch, store, department)
   ```json
   { "org_unit": "BR-01" }  // Branch 01
   { "org_unit": "DEPT-FIN" }  // Finance Department
   ```

2. **cost_center** - Cost allocation center
   ```json
   { "cost_center": "CC-100" }  // Administration
   { "cost_center": "CC-200" }  // Operations
   ```

3. **profit_center** - Profit responsibility center
   ```json
   { "profit_center": "PC-RETAIL" }
   { "profit_center": "PC-WHOLESALE" }
   ```

### Operational Dimensions

4. **staff_id** - Employee responsible for transaction
   ```json
   { "staff_id": "EMP-001" }
   { "staff_id": "TEMP-99" }
   ```

5. **location** - Physical location
   ```json
   { "location": "LOC-MAIN" }
   { "location": "LOC-WAREHOUSE-A" }
   ```

6. **project** - Project tracking
   ```json
   { "project": "PROJ-2025-001" }
   { "project": "UPGRADE-POS" }
   ```

### Industry-Specific Dimensions

7. **table_id** - Restaurant table number
   ```json
   { "table_id": "T-15" }
   { "table_id": "BAR-03" }
   ```

8. **service_category** - Service type classification
   ```json
   { "service_category": "DINE-IN" }
   { "service_category": "TAKEAWAY" }
   { "service_category": "DELIVERY" }
   ```

9. **channel** - Sales channel
   ```json
   { "channel": "ONLINE" }
   { "channel": "STORE" }
   { "channel": "MOBILE-APP" }
   ```

10. **customer_segment** - Customer classification
    ```json
    { "customer_segment": "VIP" }
    { "customer_segment": "REGULAR" }
    { "customer_segment": "NEW" }
    ```

## Adding Dimensions to Line Data

Dimensions must be included in the `line_data` field of journal lines:

```json
{
  "lines": [
    {
      "entity_id": "revenue-account-id",
      "line_type": "credit",
      "line_amount": 100.00,
      "smart_code": "HERA.GL.LINE.REVENUE.v1",
      "line_data": {
        "dimensions": {
          "org_unit": "BR-01",
          "staff_id": "EMP-123",
          "service_category": "DINE-IN",
          "table_id": "T-15"
        },
        "notes": "Table 15 dinner service"
      }
    }
  ]
}
```

## Split Configuration

The posting schema can automatically split transactions by dimensions:

```json
{
  "splits": {
    "dimensions": ["org_unit", "staff_id"],
    "rules": [
      {
        "event_pattern": "HERA\\.POS\\..*",
        "split_by": "staff_id",
        "allocation_method": "proportional"
      }
    ]
  }
}
```

### Split Example

Input transaction with mixed staff:
```json
{
  "total_amount": 100,
  "items": [
    { "amount": 60, "staff_id": "EMP-001" },
    { "amount": 40, "staff_id": "EMP-002" }
  ]
}
```

Results in split journal lines:
```json
{
  "lines": [
    {
      "entity_id": "revenue-account",
      "line_amount": 60,
      "line_data": { "dimensions": { "staff_id": "EMP-001" } }
    },
    {
      "entity_id": "revenue-account", 
      "line_amount": 40,
      "line_data": { "dimensions": { "staff_id": "EMP-002" } }
    }
  ]
}
```

## Validation Rules

1. **Required Dimensions** - Must be present when account pattern matches
2. **Valid Values** - Dimensions should reference valid entity codes
3. **Consistency** - Same dimension values across related lines
4. **Completeness** - All configured dimensions should have values

## Best Practices

1. **Define Standard Dimensions** - Use consistent dimension names across organization
2. **Document Values** - Maintain a registry of valid dimension values
3. **Start Simple** - Begin with 2-3 key dimensions, add more as needed
4. **Use Patterns** - Account patterns should match your COA structure
5. **Test Thoroughly** - Validate dimension requirements with test transactions

## Example: Restaurant POS Transaction

```json
{
  "event_smart_code": "HERA.POS.SALE.v1",
  "business_context": {
    "org_unit": "BR-DOWNTOWN",
    "staff_id": "WAITER-007",
    "table_id": "PATIO-05",
    "service_category": "DINE-IN",
    "shift": "DINNER",
    "covers": 4
  }
}
```

This context will be used to populate dimensions on the resulting journal lines based on the posting schema configuration.