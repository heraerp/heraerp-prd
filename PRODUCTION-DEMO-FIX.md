# Production Demo Routes Fix

## Issue
The ice cream dashboard at https://heraerp.com/icecream shows no data despite having the correct organization and data in the database.

## Root Cause
**Row Level Security (RLS) policies** in Supabase are blocking anonymous/public access to demo organization data.

## Solution
Add RLS policies that allow public read access to specific demo organizations.

## Quick Fix

### Option 1: Run the Fix Script (Requires Service Key)
```bash
cd mcp-server
node fix-production-demo-access.js
```

### Option 2: Apply via Supabase Dashboard
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the SQL from `database/migrations/add-demo-rls-policies.sql`
5. Click **Run**

## What This Fixes
- ✅ https://heraerp.com/icecream - Ice Cream Manufacturing Dashboard
- ✅ https://heraerp.com/restaurant - Restaurant Management
- ✅ https://heraerp.com/salon - Salon Management
- ✅ https://heraerp.com/healthcare - Healthcare Practice
- ✅ All other demo routes

## Technical Details
The fix creates SELECT policies for all 6 universal tables allowing public read access for these demo organizations:
- Kochi Ice Cream Manufacturing
- Mario's Authentic Italian Restaurant
- Dr. Smith's Family Medicine
- Glow & Grace Beauty Salon
- Strategic Business Partners
- Elite Fashion Boutique
- ABC Manufacturing Inc

## Verification
After applying the policies, visit https://heraerp.com/icecream and you should see:
- Production metrics (batches, units produced)
- Inventory levels (raw materials, finished goods)
- Sales data (revenue, orders)
- Quality metrics

## Security Note
These policies only grant **read access** to demo organizations. They don't affect:
- Real customer organizations (protected by RLS)
- Write operations (still require authentication)
- Admin functions (require service key)