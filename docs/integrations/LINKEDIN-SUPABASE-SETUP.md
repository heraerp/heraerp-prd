# LinkedIn Integration - Supabase Setup Required

## Current Issue

The LinkedIn integration is failing because Supabase is not configured. The error occurs when trying to insert data into the database tables.

## Quick Fix - Mock Mode

I've created a mock endpoint that works without Supabase:
- Endpoint: `/api/integrations/linkedin/auth/callback-mock`
- Returns a mock connector ID
- Shows success in the UI
- No database required

## Proper Setup - Configure Supabase

To make the integration work with real data storage, you need to:

### 1. Set Environment Variables

Create or update `.env.local`:
```bash
# Required Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Ensure HERA Tables Exist

Your Supabase project needs the 6 sacred HERA tables:
- `core_organizations`
- `core_entities`
- `core_relationships`
- `core_dynamic_data`
- `universal_transactions`
- `universal_transaction_lines`

Run the HERA schema migration in your Supabase SQL editor.

### 4. Check RLS Policies

Make sure Row Level Security (RLS) is either:
- Disabled for testing, OR
- Configured to allow the service role to insert data

## Testing Your Setup

### 1. Test Basic Connection
```bash
curl http://localhost:3000/api/integrations/test-basic
```

Should show your environment variables are set.

### 2. Test Supabase Connection
```bash
curl http://localhost:3000/api/integrations/test-supabase
```

Should show all tests passing.

### 3. Test LinkedIn Integration
Once Supabase is configured, update the hook to use the real endpoint:
```javascript
// In use-integrations.ts, change:
const endpoint = vendor === 'linkedin' 
  ? `/api/integrations/${vendor}/auth/callback-simple`  // Use this
  : `/api/integrations/${vendor}/auth/callback`
```

## Current Workaround

The mock endpoint allows you to test the UI flow without Supabase:
1. Click "Connect" on LinkedIn card
2. See success message
3. UI shows "Connected" state
4. No data is actually stored

## Next Steps

1. **For Development**: Use the mock endpoint to test UI/UX
2. **For Production**: Configure Supabase with proper credentials
3. **For Demo**: The mock mode is sufficient for demonstrations

The integration is designed to work with or without a real database, allowing you to develop and test the UI while setting up the backend.