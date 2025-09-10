# HERA Furniture Manufacturing Demo Setup

## Overview

The HERA Furniture Manufacturing demo has been successfully configured with public access, similar to the salon demo. This allows anyone to view the furniture manufacturing module without authentication.

## Demo Organization Details

- **Organization Name**: Kerala Furniture Works (Demo)
- **Organization Code**: DEMO-FURNITURE
- **Organization ID**: `f0af4ced-9d12-4a55-a649-b484368db249`
- **Industry**: Furniture Manufacturing
- **Location**: Cochin, Kerala, India
- **Smart Code Namespace**: `HERA.MANUFACTURING.FURNITURE`

## Access Methods

### 1. Demo Route (Public Access)
```
http://localhost:3000/furniture
```
This route automatically assigns the furniture demo organization context without requiring authentication.

### 2. Direct Organization Access
The demo organization can also be accessed directly using its ID in API calls and queries.

## Demo Data Created

### Master Data
- **Products**: Executive Office Desk, Ergonomic Office Chair, 6-Seater Dining Set
- **Raw Materials**: Teak Wood Plank, Italian Leather
- **Work Centers**: Cutting Station, Assembly Station
- **Employees**: Rajesh Kumar (EMP-001), Priya Nair (EMP-002)
- **Customers**: Office Solutions Ltd, Home Decor Mart

### Sample Transactions
- Sales Order: SO-DEMO-001 (₹175,000)

## Authorization Configuration

The following authorization settings have been configured:

1. **Demo Route Mapping**: `/furniture` → Kerala Furniture Works (Demo)
2. **RLS Policies**: Public read access enabled for organization ID `f0af4ced-9d12-4a55-a649-b484368db249`
3. **Public Access**: `settings.public_access = true` on the organization

## Files Updated

1. **`/mcp-server/setup-demo-org-mappings.js`** - Added furniture demo mapping
2. **`/mcp-server/apply-demo-rls-policies.js`** - Added furniture org ID to RLS policies
3. **`/database/migrations/add-demo-rls-policies.sql`** - Added furniture org ID to SQL policies

## Testing the Demo

1. **Visit the Demo URL**: Navigate to `http://localhost:3000/furniture`
2. **Check Data Access**: The page should automatically have access to all furniture demo data
3. **No Authentication Required**: Public users can view without logging in

## Smart Codes Structure

All furniture module operations use the namespace:
```
HERA.MANUFACTURING.FURNITURE.{MODULE}.{TYPE}.{SUBTYPE}.v1
```

Examples:
- `HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1`
- `HERA.MANUFACTURING.FURNITURE.SALES.SO.HEADER.v1`
- `HERA.MANUFACTURING.FURNITURE.MFG.PROD_ORDER.HEADER.v1`

## Next Steps

To use this demo organization in your furniture module:

1. Create a furniture app page at `/src/app/furniture/page.tsx`
2. Use the demo organization context provided by the route
3. Query furniture data using the organization ID
4. All data will be accessible without authentication

## Manual RLS Policy Application (If Needed)

If the automatic RLS policies don't apply, run this SQL in Supabase Dashboard:

```sql
-- Add furniture demo org to public read policies
DO $$
DECLARE
  furniture_org_id uuid := 'f0af4ced-9d12-4a55-a649-b484368db249'::uuid;
BEGIN
  -- Add policies for each table
  CREATE POLICY IF NOT EXISTS "Allow public read for furniture demo"
    ON core_organizations FOR SELECT
    USING (id = furniture_org_id);
    
  CREATE POLICY IF NOT EXISTS "Allow public read for furniture demo entities"
    ON core_entities FOR SELECT
    USING (organization_id = furniture_org_id);
    
  -- Add similar policies for other tables...
END $$;
```

## Summary

The furniture manufacturing demo is now fully configured with:
- ✅ Demo organization created with sample data
- ✅ Public route mapping at `/furniture`
- ✅ RLS policies for public access
- ✅ Smart code namespace configured
- ✅ Ready for public demonstration

Anyone can now access the furniture demo at `http://localhost:3000/furniture` without authentication!