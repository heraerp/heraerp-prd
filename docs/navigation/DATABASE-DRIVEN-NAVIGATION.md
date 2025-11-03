# HERA Database-Driven Navigation System

**Smart Code**: `HERA.PLATFORM.NAV.DATABASE.SYSTEM.v1`

## Overview

HERA's navigation system has been upgraded from JSON-based configuration to a fully database-driven system using the Sacred Six architecture. Navigation structure is now stored as entities in the Platform Organization with proper hierarchical relationships.

## Architecture

### Entity Types

| Entity Type | Description | Smart Code Pattern |
|------------|-------------|-------------------|
| `navigation_module` | Base or industry modules | `HERA.PLATFORM.NAV.MODULE.{CODE}.v1` |
| `navigation_area` | Areas within modules | `HERA.PLATFORM.NAV.AREA.{MODULE}.{CODE}.v1` |
| `navigation_operation` | Operations within areas | `HERA.PLATFORM.NAV.OPERATION.{MODULE}.{AREA}.{CODE}.v1` |
| `navigation_industry` | Industry definitions | `HERA.PLATFORM.NAV.INDUSTRY.{CODE}.v1` |
| `navigation_config` | System configuration | `HERA.PLATFORM.NAV.CONFIG.v1` |

### Hierarchical Structure

```
Platform Organization (00000000-0000-0000-0000-000000000000)
├── Navigation Config Entity
├── Base Modules (FIN, PROC, SALES)
│   ├── Areas (GL, AP, AR, PO, REQ, etc.)
│   │   └── Operations (CREATE, LIST, APPROVE, etc.)
├── Industry Entities (JEWELRY, WASTE_MGMT)
│   └── Specialized Modules
│       ├── Areas
│       │   └── Operations
```

### Relationships

| Relationship Type | Description |
|------------------|-------------|
| `CONTAINS_MODULE` | Industry → Module |
| `CONTAINS_AREA` | Module → Area |
| `CONTAINS_OPERATION` | Area → Operation |

## Migration Process

### 1. Migration Script

Run the migration to move JSON configuration to database:

```bash
# Migrate navigation configuration to database
npm run migrate:navigation

# Verify migration with database queries
npm run migrate:navigation:verify
```

### 2. Data Storage

**Core Entity Data:**
- `entity_type`: Navigation entity type
- `entity_name`: Human-readable name
- `entity_code`: Unique code (FIN, PROC, GL, etc.)
- `smart_code`: HERA DNA smart code
- `organization_id`: Platform Organization ID

**Dynamic Data Fields:**
- `route`: URL route path
- `icon`: Lucide icon name
- `color`: CSS color class
- `permissions`: Array of required permissions
- `module_type`: 'base' or 'industry_specialized'
- `theme`: Industry theme configuration (JSON)

### 3. Database Schema

```sql
-- Navigation entities are stored in Sacred Six tables
SELECT 
  ce.entity_name,
  ce.entity_code,
  ce.entity_type,
  ce.smart_code,
  cdd.field_name,
  cdd.field_value_text,
  cdd.field_value_json
FROM core_entities ce
LEFT JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id
WHERE ce.entity_type LIKE 'navigation_%'
  AND ce.organization_id = '00000000-0000-0000-0000-000000000000'
ORDER BY ce.entity_type, ce.entity_code;

-- Hierarchical relationships
SELECT 
  src.entity_name AS parent,
  cr.relationship_type,
  tgt.entity_name AS child
FROM core_relationships cr
JOIN core_entities src ON cr.source_entity_id = src.id
JOIN core_entities tgt ON cr.target_entity_id = tgt.id
WHERE cr.relationship_type IN ('CONTAINS_MODULE', 'CONTAINS_AREA', 'CONTAINS_OPERATION')
  AND cr.organization_id = '00000000-0000-0000-0000-000000000000'
ORDER BY src.entity_name, cr.relationship_type;
```

## Service Layer

### NavigationService.ts

**Primary Functions:**
- `loadNavigationConfig()`: Load complete configuration from database
- `getModuleConfig(moduleCode)`: Get specific module configuration
- `getIndustryConfig(industryCode)`: Get industry configuration
- `getCachedNavigationConfig()`: Cached configuration with 5-minute TTL

**Caching Strategy:**
- 5-minute TTL for navigation configuration
- Automatic fallback to JSON file if database is unavailable
- Cache clearing via `clearNavigationCache()`

### Updated Hooks

**useModuleConfig Hook:**
- Now loads from database via NavigationService
- Maintains same API for backward compatibility
- Added `isLoading` and `error` states
- Automatic fallback handling

## API Integration

### API Endpoint: `/api/navigation-config`

```typescript
// GET /api/navigation-config
// Returns navigation configuration with caching headers
Cache-Control: public, s-maxage=300, stale-while-revalidate=3600
```

**Response Format:**
```json
{
  "schema_version": "2.0",
  "title": "HERA Enterprise Navigation - Database-Driven System",
  "base_modules": {
    "FIN": { /* module config */ },
    "PROC": { /* module config */ },
    "SALES": { /* module config */ }
  },
  "industries": {
    "JEWELRY": { /* industry config */ },
    "WASTE_MGMT": { /* industry config */ }
  },
  "security": { /* permission sets */ }
}
```

## Benefits

### 1. Dynamic Configuration
- **Real-time Updates**: Navigation changes without code deployment
- **Runtime Customization**: Organization-specific navigation structures
- **A/B Testing**: Different navigation layouts for user groups

### 2. Sacred Six Compliance
- **Actor Stamping**: All navigation changes tracked with WHO/WHEN
- **Organization Isolation**: Navigation respects multi-tenant boundaries
- **Smart Code DNA**: Every navigation element has HERA DNA patterns
- **Audit Trail**: Complete history of navigation changes

### 3. Scalability
- **Unlimited Modules**: Add new modules without code changes
- **Industry Flexibility**: Custom industry navigation structures
- **Permission Integration**: Navigation respects RBAC system
- **Performance**: Cached configuration with intelligent fallbacks

### 4. Developer Experience
- **Type Safety**: Full TypeScript support maintained
- **Backward Compatibility**: Existing components work unchanged
- **Error Handling**: Graceful fallbacks to JSON configuration
- **Testing**: Database-driven navigation can be tested in isolation

## Migration Verification

### 1. Entity Count Verification
```sql
-- Verify entities were created
SELECT 
  entity_type,
  COUNT(*) as count
FROM core_entities 
WHERE entity_type LIKE 'navigation_%'
  AND organization_id = '00000000-0000-0000-0000-000000000000'
GROUP BY entity_type;

-- Expected results:
-- navigation_config: 1
-- navigation_module: 8+ (base + industry modules)
-- navigation_area: 20+ areas
-- navigation_operation: 50+ operations
-- navigation_industry: 2 (JEWELRY, WASTE_MGMT)
```

### 2. Relationship Verification
```sql
-- Verify hierarchical relationships
SELECT 
  relationship_type,
  COUNT(*) as count
FROM core_relationships
WHERE relationship_type IN ('CONTAINS_MODULE', 'CONTAINS_AREA', 'CONTAINS_OPERATION')
  AND organization_id = '00000000-0000-0000-0000-000000000000'
GROUP BY relationship_type;
```

### 3. Dynamic Data Verification
```sql
-- Verify dynamic fields are populated
SELECT 
  ce.entity_type,
  cdd.field_name,
  COUNT(*) as field_count
FROM core_entities ce
JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id
WHERE ce.entity_type LIKE 'navigation_%'
  AND ce.organization_id = '00000000-0000-0000-0000-000000000000'
GROUP BY ce.entity_type, cdd.field_name
ORDER BY ce.entity_type, cdd.field_name;
```

## Troubleshooting

### Common Issues

**1. Migration Fails**
```bash
# Check Supabase connection
psql "$DATABASE_URL" -c "SELECT version();"

# Verify platform organization exists
psql "$DATABASE_URL" -c "SELECT id, organization_name FROM core_entities WHERE id = '00000000-0000-0000-0000-000000000000';"
```

**2. Navigation Not Loading**
```bash
# Check API endpoint
curl http://localhost:3000/api/navigation-config

# Check logs for database errors
tail -f .next/server.log | grep navigation
```

**3. Fallback to JSON**
- NavigationService automatically falls back to JSON if database fails
- Check console logs for "Falling back to JSON configuration"
- Verify environment variables are set correctly

### Performance Monitoring

```sql
-- Monitor navigation queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements 
WHERE query ILIKE '%navigation_%'
ORDER BY total_time DESC;
```

## Future Enhancements

### Phase 2: Organization-Specific Navigation
- Allow organizations to customize navigation structure
- Store organization-specific modules and areas
- Implement navigation inheritance from platform defaults

### Phase 3: Permission-Based Navigation
- Hide/show navigation items based on user permissions
- Dynamic menu generation based on role assignments
- Contextual navigation based on business process

### Phase 4: Analytics & Optimization
- Track navigation usage patterns
- A/B test different navigation structures
- Optimize navigation based on user behavior

## Conclusion

The database-driven navigation system provides HERA with unprecedented flexibility and scalability while maintaining full Sacred Six compliance. Navigation structure is now a first-class citizen in the HERA data model, enabling dynamic customization, proper audit trails, and organization-specific configurations.

**Key Achievement**: Navigation configuration moved from static JSON to dynamic database entities without breaking existing functionality, providing foundation for future customization and optimization capabilities.