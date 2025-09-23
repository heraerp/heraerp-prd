# Phase 3.5 - Final Fixes Summary

## Dynamic Data Upsert Error Fix

### Error
```
Error: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

### Root Cause
The `/api/playbook/dynamic_data/upsert` route was using `onConflict: 'organization_id,entity_id,smart_code'` but:
1. `smart_code` is not a column in `core_dynamic_data` table
2. The actual unique constraint is on `(organization_id, entity_id, field_name)`

### Fixes Applied

1. **Changed ON CONFLICT clause**:
   - From: `onConflict: 'organization_id,entity_id,smart_code'`
   - To: `onConflict: 'organization_id,entity_id,field_name'`

2. **Added Smart Code to Field Name Mapping**:
   ```typescript
   function getFieldNameFromSmartCode(smartCode: string): string {
     const mappings: Record<string, string> = {
       'HERA.SALON.SERVICE.PRICE.V1': 'service.base_price',
       'HERA.SALON.SERVICE.TAX.V1': 'service.tax',
       'HERA.SALON.SERVICE.COMMISSION.V1': 'service.commission',
       'HERA.SALON.SERVICE.DURATION.V1': 'service.duration_min',
       'HERA.SALON.SERVICE.CATEGORY.V1': 'service.category',
     }
     return mappings[smartCode] || smartCode.split('.').slice(-2)[0].toLowerCase()
   }
   ```

3. **Removed smart_code from payload** since it's not a column in core_dynamic_data

4. **Fixed SELECT statement** to return `field_name` instead of `smart_code`

## Result
Services can now be created with dynamic data (price, tax, commission) without errors. The data properly saves to `core_dynamic_data` with canonical field names.