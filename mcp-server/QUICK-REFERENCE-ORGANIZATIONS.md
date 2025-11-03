# Quick Reference: HERA Organizations CRUD

## ✅ HERA ERP DEMO Organization

**🎯 Organization ID:** `9a9cc652-5c64-4917-a990-3d0fb6398543`
**📝 Organization Code:** `HERA-DEMO`
**💼 Organization Name:** `HERA ERP DEMO`

---

## 🚀 Quick Commands

### List All Organizations
```bash
node -e "
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'LIST',
  p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
  p_limit: 100,
  p_offset: 0,
  p_payload: {}
});

console.log(JSON.stringify(data, null, 2));
"
```

### Get HERA ERP DEMO Details
```bash
node -e "
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase
  .from('core_organizations')
  .select('*')
  .eq('id', '9a9cc652-5c64-4917-a990-3d0fb6398543')
  .single();

console.log(JSON.stringify(data, null, 2));
"
```

### Create New Organization (Template)
```javascript
const { data } = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
  p_limit: null,
  p_offset: null,
  p_payload: {
    organization_name: 'New Organization Name',
    organization_code: 'NEW-ORG',
    organization_type: 'business_unit',
    industry_classification: 'INDUSTRY_TYPE',
    status: 'active',
    settings: {
      locale: 'en-US',
      currency: 'USD',
      timezone: 'UTC'
    }
  }
});
```

---

## 📊 Available Organization IDs

| Name | Code | ID | Use Case |
|------|------|----|----------|
| HERA ERP DEMO | HERA-DEMO | 9a9cc652-5c64-4917-a990-3d0fb6398543 | Demo/Testing |
| Hairtalkz | HAIRTALKZ | 378f24fb-d496-4ff7-8afa-ea34895a0eb8 | Production Salon |
| HERA Platform | HERA | 30c9841b-0472-4dc3-82af-6290192255ba | Platform Admin |
| HERA PLATFORM | HERA_PLATFORM | 00000000-0000-0000-0000-000000000000 | System/Platform |

---

## 🔑 Common User IDs

| Name | ID | Description |
|------|----|-------------|
| michele | 09b0b92a-d797-489e-bc03-5ca0a6272674 | Admin User |
| manager | 4e37e841-f125-4241-9760-a6bda7f68eaf | Manager User |
| HERA_SERVICE_ACTOR | 9f20b415-a16e-4a57-a310-9333a6be1828 | System Actor |
| live | 7c00b456-9cf7-495c-9f02-e4fb349b80c9 | Live User |
| demo | 36973f7e-b538-4b6e-91bb-380c3da5bf3a | Demo User |

---

## 🛠️ RPC Function Signature

```typescript
function hera_organizations_crud_v1(
  p_action: 'CREATE' | 'LIST' | 'UPDATE' | 'DELETE',
  p_actor_user_id: UUID,
  p_limit: INTEGER | null,
  p_offset: INTEGER | null,
  p_payload: JSONB
): {
  action: string,
  organization?: Organization,
  items?: Organization[],
  limit?: number,
  offset?: number
}
```

---

## 🎯 Environment Variables

Add to `.env` file:
```bash
# HERA ERP DEMO Organization
DEMO_ORGANIZATION_ID=9a9cc652-5c64-4917-a990-3d0fb6398543
DEMO_ORGANIZATION_CODE=HERA-DEMO

# Default Actor for Testing
DEFAULT_USER_ENTITY_ID=09b0b92a-d797-489e-bc03-5ca0a6272674
```

---

## 📚 Related Files

- **Test Script:** `mcp-server/test-create-demo-org.mjs`
- **Summary:** `mcp-server/HERA-DEMO-ORG-CREATION-SUMMARY.md`
- **Entity CRUD Test:** `mcp-server/test-hera-entities-crud-v2-final.mjs`

---

**Last Updated:** 2025-11-03
