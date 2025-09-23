# Salon Service Dynamic Data Fix

## Issue
When creating new services in the salon module, the dynamic data fields (price, duration, category) were not being saved because the smart codes used were violating the database constraint.

## Root Cause
The HERA smart code validation requires 6-10 segments, but the dynamic data was initially using 5-segment smart codes:
- ❌ `HERA.SALON.SERVICE.PRICE.V1` (5 segments - invalid)

## Solution
Updated all dynamic data smart codes to match what the RPC function `fn_services_with_dd` expects. The RPC function is hardcoded to look for specific smart codes that are already 6 segments:

### Smart Codes Used:
- `HERA.SALON.SERVICE.CATALOG.PRICE.v1` - For service pricing data
- `HERA.SALON.SERVICE.CATALOG.DURATION.v1` - For service duration
- `HERA.SALON.SERVICE.CATALOG.CATEGORY.v1` - For service category
- `HERA.SALON.SERVICE.CATALOG.TAX.v1` - For tax configuration
- `HERA.SALON.SERVICE.CATALOG.COMMISSION.v1` - For commission settings

These smart codes:
- ✅ Have 6 segments (valid format)
- ✅ Match what the RPC function expects
- ✅ Match existing data in the database

### Files Modified:
1. `/src/hooks/useServicesPlaybook.ts` - Updated create and update functions to use the CATALOG smart codes
2. `/src/app/api/playbook/dynamic_data/upsert/route.ts` - Updated mappings to support both CATALOG and DYN versions

## Result
New services will now properly save their dynamic data fields (price, duration, category) and the RPC function `fn_services_with_dd` will correctly return the data.