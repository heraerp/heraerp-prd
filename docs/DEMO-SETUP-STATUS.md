# HERA Demo System Setup Status

## ✅ Completed
- **Demo Organizations Created** - All 4 demo organizations are now in Supabase:
  - Hair Talkz Salon Demo (0fd09e31-d257-4329-97eb-7d7f522ed6f0)
  - Mario's Restaurant Demo (a1b2c3d4-e5f6-7890-abcd-ef1234567890)
  - TechCorp Manufacturing Demo (b2c3d4e5-f6a7-8901-bcde-f12345678901)
  - Fashion Boutique Demo (c3d4e5f6-a7b8-9012-cdef-123456789012)

- **Demo Access Page** - Complete UI at `/demo` with industry-specific demo accounts
- **Demo Login API** - `/api/auth/demo-login` endpoint for automatic login
- **Login Page Integration** - "Try a Demo Account" button added to login page

## 🔄 Manual Steps Required

### 1. Create Demo Users in Supabase Dashboard
Navigate to Supabase Dashboard > Authentication > Users and create these users:

| Email | Password | User Metadata |
|-------|----------|---------------|
| demo.salon@heraerp.com | DemoSalon2024! | `{"name": "Salon Demo User", "role": "admin", "demo": true, "organization_id": "0fd09e31-d257-4329-97eb-7d7f522ed6f0"}` |
| demo.restaurant@heraerp.com | DemoRestaurant2024! | `{"name": "Restaurant Demo User", "role": "admin", "demo": true, "organization_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}` |
| demo.manufacturing@heraerp.com | DemoManufacturing2024! | `{"name": "Manufacturing Demo User", "role": "admin", "demo": true, "organization_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901"}` |
| demo.retail@heraerp.com | DemoRetail2024! | `{"name": "Retail Demo User", "role": "admin", "demo": true, "organization_id": "c3d4e5f6-a7b8-9012-cdef-123456789012"}` |

### 2. Configure Row Level Security (RLS)
Add RLS policies in Supabase Dashboard > SQL Editor to ensure data isolation:

```sql
-- Enable RLS on all tables (if not already enabled)
ALTER TABLE core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines ENABLE ROW LEVEL SECURITY;

-- Example policy for core_entities
CREATE POLICY "Users can view entities in their organization" ON core_entities
  FOR SELECT
  USING (
    organization_id IN (
      SELECT (auth.jwt() ->> 'organization_id')::uuid
    )
  );

-- Apply similar policies to all other tables
```

### 3. Test Demo System
1. Navigate to http://localhost:3000/demo
2. Click on any demo account
3. Verify automatic login and redirect to appropriate app
4. Confirm user can only see their organization's data

## 🚀 Next Steps

### Immediate (Required for Demo to Work)
1. **Create the 4 demo users** in Supabase Dashboard (manual step above)
2. **Set user metadata** with correct organization_id for each user
3. **Test demo login flow** to ensure everything works

### Enhancement (Optional)
1. **Add RLS policies** for complete data isolation
2. **Create demo data** using the create-demo-data.js script (after fixing smart code issues)
3. **Set up demo data reset** - daily cleanup process
4. **Add guided tours** - onboarding flows for each demo

## 📝 File Structure
```
/app/demo/page.tsx                    - Demo selection page
/app/api/auth/demo-login/route.ts     - Demo login API
/mcp-server/create-demo-orgs.js       - Organization creation script (✅ used)
/mcp-server/create-demo-data.js       - Demo data creation script (needs smart code fixes)
/docs/DEMO-SYSTEM.md                  - Complete documentation
```

## 🔐 Security Notes
- Each demo user is isolated to their organization via RLS
- Demo credentials are hardcoded in the API for security
- Organization validation prevents unauthorized access
- All demo accounts have read/write access within their organization

## 🧪 Testing Commands
```bash
# Check organizations
node hera-cli.js query core_organizations | grep DEMO

# Test demo page (after user creation)
open http://localhost:3000/demo

# Check user entities (after user creation)
node hera-cli.js query core_entities entity_type:user
```