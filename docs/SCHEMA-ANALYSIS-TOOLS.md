# HERA Schema Analysis Tools

## Overview

The HERA Schema Analysis Tools provide comprehensive insights into your database structure, helping you understand exactly how data is organized and stored in the HERA universal 6-table architecture. This is essential for writing production-ready queries and understanding the exact implementation details of features like branches, dynamic fields, and relationships.

## Available Tools

### 1. Schema Insights (`/admin/schema-insights`)

A simplified analysis tool that provides:
- **Table Overview**: Row counts, column counts, and data status for all core tables
- **Entity Analysis**: Distribution of entity types, most common entities
- **Transaction Analysis**: Transaction types, currencies, and patterns
- **Dynamic Data Analysis**: Field usage, data types, and branch field detection
- **Branch Implementation**: Automatic detection of how branches are stored
- **Sample Data**: Real examples from each table

**Access**: Navigate to `/admin/schema-insights` in your HERA instance

### 2. Advanced Schema Analysis (`/admin/schema-analysis`)

A comprehensive tool that provides:
- **Complete Column Definitions**: Data types, constraints, defaults, nullability
- **Foreign Key Relationships**: All table relationships with update/delete rules
- **Indexes**: Performance optimization insights
- **Data Profiling**: Null counts, distinct values, min/max analysis
- **Dynamic Field Type Analysis**: How each field uses the different value columns

**Access**: Navigate to `/admin/schema-analysis` in your HERA instance

## API Endpoints

### Simple Analysis API
```bash
GET /api/admin/schema-analysis-simple
Headers:
  x-admin-api-key: your_admin_api_key
```

Returns simplified analysis focused on practical insights and data patterns.

### Advanced Analysis API
```bash
GET /api/admin/schema-analysis
Headers:
  x-admin-api-key: your_admin_api_key
```

Returns comprehensive schema details including all column definitions, constraints, and relationships.

## Key Insights Provided

### 1. Branch Implementation Detection
The tools automatically detect how branches are implemented in your system:
- **As Entities**: Checks for `entity_type = 'branch'` in `core_entities`
- **As Dynamic Fields**: Looks for `branch_id`, `branch_code`, `branch_name` in `core_dynamic_data`
- **As Relationships**: Identifies branch-related relationship types

### 2. Dynamic Field Analysis
Understanding how dynamic fields are used:
- **Field Name Patterns**: Most common field names and their usage counts
- **Data Type Usage**: Which value column (text, number, boolean, date, json) is used for each field
- **Type Consistency**: Identifies fields that use multiple data types

### 3. Smart Code Patterns
Analyzes smart codes to understand:
- **Industry Patterns**: `HERA.{INDUSTRY}.{MODULE}` usage
- **Module Distribution**: Which modules are most active
- **Version Tracking**: Smart code version patterns

### 4. Multi-Tenant Analysis
- **Organization Distribution**: How data is spread across organizations
- **Cross-Organization Patterns**: Shared entity types or configurations

## Using the Analysis for Production Queries

### Example: Finding Branch Data

After running the analysis, you might discover branches are stored as:

```sql
-- If branches are entities
SELECT * FROM core_entities 
WHERE entity_type = 'branch' 
AND organization_id = 'your-org-id';

-- If branches are in dynamic data
SELECT 
  e.entity_name,
  dd_branch.field_value_text as branch_id,
  dd_branch_name.field_value_text as branch_name
FROM core_entities e
LEFT JOIN core_dynamic_data dd_branch 
  ON e.id = dd_branch.entity_id 
  AND dd_branch.field_name = 'branch_id'
LEFT JOIN core_dynamic_data dd_branch_name
  ON e.id = dd_branch_name.entity_id
  AND dd_branch_name.field_name = 'branch_name'
WHERE e.organization_id = 'your-org-id';
```

### Example: Understanding Transaction Patterns

The analysis reveals transaction types and their usage:

```sql
-- Get transactions by type (based on analysis findings)
SELECT 
  transaction_type,
  COUNT(*) as count,
  SUM(total_amount) as total_value
FROM universal_transactions
WHERE organization_id = 'your-org-id'
GROUP BY transaction_type
ORDER BY count DESC;
```

## Security

Both tools require admin authentication via the `x-admin-api-key` header. Set your `ADMIN_API_KEY` in your environment variables:

```bash
# .env
ADMIN_API_KEY=your_secure_admin_api_key
```

For development, you can use `test-key` as the API key.

## Best Practices

1. **Run Analysis First**: Before writing complex queries, always check the schema analysis to understand the exact structure
2. **Check Sample Data**: The sample data reveals actual usage patterns and data formats
3. **Verify Assumptions**: Don't assume column names or relationships - verify with the analysis
4. **Monitor Growth**: Regularly check the analysis to understand data growth patterns
5. **Document Findings**: Keep notes on how specific features (like branches) are implemented in your instance

## Troubleshooting

### No Data Showing
- Ensure your Supabase service role key is configured
- Check that tables exist and have data
- Verify API key authentication

### Missing Relationships
- Some relationships might be implemented via dynamic data rather than foreign keys
- Check the dynamic field analysis for relationship patterns

### Performance Issues
- For large databases, the analysis might take time
- Consider using the simple analysis endpoint for faster results
- Cache analysis results and refresh periodically

## Implementation Details

The schema analysis tools are built on the HERA universal architecture principles:
- Zero custom tables - all analysis metadata could be stored in the 6 core tables
- Smart code tracking for all analysis operations
- Multi-tenant aware with organization isolation
- Universal patterns that work across all HERA implementations