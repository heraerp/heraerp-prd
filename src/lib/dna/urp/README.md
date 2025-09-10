# Universal Report Pattern (URP) - HERA DNA Component

**Smart Code**: `HERA.DNA.URP.REPORT.ENGINE.v1`

## Overview

The Universal Report Pattern (URP) is a revolutionary reporting system that provides standardized, reusable patterns for querying and presenting data from HERA's universal 6-table architecture. It eliminates the need for custom SQL queries and provides consistent, performant reporting across all business domains.

## Core Principles

1. **Universal Query Patterns**: Standardize HOW to query data, not what tables exist
2. **Composable Primitives**: 6 reusable components that can be combined for any report
3. **Smart Code Intelligence**: Behavior driven by HERA smart codes
4. **Performance First**: Materialized views and intelligent caching
5. **Zero Schema Changes**: Works with existing 6-table architecture

## The 6 URP Primitives

### 1. Entity Resolver (`HERA.URP.PRIMITIVE.ENTITY.RESOLVER.v1`)
- Fetches entities with dynamic fields in one call
- Handles entity type filtering and smart code matching
- Automatic organization isolation

### 2. Hierarchy Builder (`HERA.URP.PRIMITIVE.HIERARCHY.BUILDER.v1`)
- Constructs parent-child relationships
- Supports multi-level hierarchies (accounts, BOM, org structure)
- Handles circular reference detection

### 3. Transaction Facts (`HERA.URP.PRIMITIVE.TRANSACTION.FACTS.v1`)
- Aggregates transaction data with line items
- Time-based grouping (daily, monthly, yearly)
- Smart code-based categorization

### 4. Dynamic Join (`HERA.URP.PRIMITIVE.DYNAMIC.JOIN.v1`)
- Joins data across tables based on smart codes
- Handles complex relationships without SQL
- Performance optimized with indexes

### 5. Rollup & Balance (`HERA.URP.PRIMITIVE.ROLLUP.BALANCE.v1`)
- Calculates running balances and cumulative totals
- Handles opening/closing balances
- Multi-currency support

### 6. Presentation Formatter (`HERA.URP.PRIMITIVE.PRESENTATION.FORMAT.v1`)
- Formats data for specific output (JSON, Excel, PDF)
- Applies business rules for display
- Handles localization and currency formatting

## Naming Conventions

### Smart Code Format
```
HERA.URP.{CATEGORY}.{TYPE}.{SUBTYPE}.v{VERSION}

Categories:
- PRIMITIVE: Core building blocks
- RECIPE: Complete report definitions
- VIEW: Materialized view definitions
- CACHE: Caching strategies
- FORMAT: Output formatters
```

### Recipe Naming
```
HERA.URP.RECIPE.{DOMAIN}.{REPORT}.v1

Examples:
- HERA.URP.RECIPE.FINANCE.COA.v1 (Chart of Accounts)
- HERA.URP.RECIPE.FINANCE.TRIAL.BALANCE.v1
- HERA.URP.RECIPE.SALES.CUSTOMER.AGING.v1
- HERA.URP.RECIPE.INVENTORY.STOCK.LEVELS.v1
```

### View Naming
```
urp_{domain}_{report}_v{version}

Examples:
- urp_finance_coa_v1
- urp_sales_aging_v1
- urp_inventory_levels_v1
```

## Usage Example

```typescript
import { UniversalReportEngine } from '@/lib/dna/urp/report-engine'

// Initialize with organization context
const reportEngine = new UniversalReportEngine({
  organizationId: 'org-uuid',
  smartCodePrefix: 'HERA.URP'
})

// Execute a report recipe
const chartOfAccounts = await reportEngine.executeRecipe(
  'HERA.URP.RECIPE.FINANCE.COA.v1',
  {
    fiscalYear: 2024,
    includeInactive: false,
    hierarchyDepth: 4
  }
)

// Use individual primitives
const entities = await reportEngine.entityResolver.resolve({
  entityType: 'gl_account',
  smartCodePattern: 'HERA.FIN.GL.ACC.*'
})

const hierarchy = await reportEngine.hierarchyBuilder.build({
  entities,
  relationshipType: 'parent_of'
})
```

## Performance Optimization

1. **Materialized Views**: Pre-computed for common patterns
2. **Smart Caching**: Organization-scoped with TTL
3. **Batch Processing**: Minimizes database round trips
4. **Index Strategy**: Optimized for smart code queries

## Benefits

- **90% Faster Development**: No custom SQL needed
- **Consistent Performance**: Optimized patterns
- **Universal Compatibility**: Works with all business types
- **Zero Maintenance**: Patterns evolve with HERA
- **Type Safe**: Full TypeScript support