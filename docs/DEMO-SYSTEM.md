# HERA Demo System Documentation

## Overview

The HERA demo system provides instant access to fully-functional demo accounts for different industries, each with complete data isolation through Row Level Security (RLS).

## Demo Accounts

| Industry | Email | Organization ID | Features |
|----------|-------|----------------|----------|
| Salon | demo.salon@heraerp.com | 0fd09e31-d257-4329-97eb-7d7f522ed6f0 | Appointment booking, staff management, inventory, POS |
| Restaurant | demo.restaurant@heraerp.com | a1b2c3d4-e5f6-7890-abcd-ef1234567890 | Table management, kitchen display, menu, billing |
| Manufacturing | demo.manufacturing@heraerp.com | b2c3d4e5-f6a7-8901-bcde-f12345678901 | Production orders, BOM, quality control, supply chain |
| Retail | demo.retail@heraerp.com | c3d4e5f6-a7b8-9012-cdef-123456789012 | Inventory management, POS, customer loyalty, analytics |

## Setup Instructions

### 1. Create Demo Users

```bash
# Run the setup script to create demo users and organizations
node scripts/setup-demo-users.js
```

This script will:
- Create demo organizations in `core_organizations` table
- Create demo users in Supabase Auth
- Create user entities in `core_entities` table
- Set proper metadata for demo accounts

### 2. Configure Row Level Security (RLS)

Add these RLS policies in Supabase Dashboard:

```sql
-- Enable RLS on all tables
ALTER TABLE core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines ENABLE ROW LEVEL SECURITY;

-- Policy for core_organizations
CREATE POLICY "Users can view their organizations" ON core_organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM core_entities 
      WHERE entity_type = 'user' 
      AND metadata->>'user_id' = auth.uid()::text
    )
  );

-- Policy for core_entities
CREATE POLICY "Users can view entities in their organization" ON core_entities
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM core_entities 
      WHERE entity_type = 'user' 
      AND metadata->>'user_id' = auth.uid()::text
    )
  );

-- Similar policies for other tables...
```

### 3. Demo Account Features

Each demo account has:
- **Read-only access**: Demo users can view but not modify critical data
- **Pre-populated data**: Sample customers, products, transactions
- **Daily reset**: Demo data resets to original state every 24 hours
- **Complete isolation**: Each demo can only see their organization's data

## How Demo Login Works

### 1. User Flow
```
/demo page → Select demo account → Auto-login → Redirect to app
```

### 2. Technical Flow

1. **Demo Selection**: User clicks on a demo account card
2. **API Call**: Frontend calls `/api/auth/demo-login` with credentials
3. **Authentication**: 
   - Validates demo credentials against hardcoded list
   - Signs in user with Supabase Auth
   - Verifies organization access with RLS
4. **Session Creation**:
   - Sets authentication cookies (access/refresh tokens)
   - Sets organization context cookie
5. **Redirect**: User redirected to appropriate app (e.g., `/salon`)

### 3. Security Measures

- **Hardcoded Credentials**: Demo passwords only work for specific emails
- **Organization Validation**: API verifies user has access to organization
- **RLS Enforcement**: Database queries automatically filtered by organization
- **Cookie Security**: HttpOnly cookies for tokens, secure in production
- **Automatic Logout**: If organization access fails, user is signed out

## Testing Demo System

### 1. Manual Testing

```bash
# 1. Start the development server
npm run dev

# 2. Navigate to demo page
open http://localhost:3000/demo

# 3. Click on any demo account
# 4. Verify redirect to appropriate app
# 5. Verify can only see demo organization data
```

### 2. Verify RLS

```sql
-- Connect to Supabase SQL Editor as demo user
-- Should only see one organization
SELECT * FROM core_organizations;

-- Should only see entities from demo organization
SELECT COUNT(*) FROM core_entities;
```

## Troubleshooting

### Demo Login Fails

1. **Check user exists**: 
   ```bash
   # In Supabase Dashboard > Authentication > Users
   # Look for demo.salon@heraerp.com etc.
   ```

2. **Verify organization exists**:
   ```sql
   SELECT * FROM core_organizations 
   WHERE id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
   ```

3. **Check RLS policies**:
   ```sql
   -- Should return policies for each table
   SELECT * FROM pg_policies;
   ```

### Organization Not Accessible

1. **Verify user entity**:
   ```sql
   SELECT * FROM core_entities 
   WHERE entity_type = 'user' 
   AND metadata->>'email' = 'demo.salon@heraerp.com';
   ```

2. **Check organization_id matches**:
   - User entity must have correct organization_id
   - Must match the demo account configuration

## Best Practices

1. **Never share service role key**: Use it only in server-side code
2. **Keep demo data realistic**: But avoid sensitive information
3. **Monitor usage**: Track demo account access for insights
4. **Regular cleanup**: Implement daily reset for consistency
5. **Clear messaging**: Inform users this is demo data

## Future Enhancements

1. **Demo data generator**: Script to create realistic demo data
2. **Usage analytics**: Track which demos are most popular
3. **Guided tours**: Interactive tutorials for each demo
4. **Custom demos**: Allow users to request industry-specific demos
5. **Demo expiration**: Auto-disable demos after period of inactivity