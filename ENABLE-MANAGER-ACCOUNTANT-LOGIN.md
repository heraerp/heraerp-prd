# Enable Manager & Accountant Login - Quick Guide

**Status**: ✅ **READY TO USE**
**Time Required**: 2 minutes

---

## Current Situation

✅ **Michele's Account Works**: michele@hairtalk.ae has full owner access
❌ **Manager/Accountant Missing**: Need to create Supabase auth users

---

## Solution: Run SQL Script

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar

### Step 2: Copy & Run Script

Copy the entire contents of:
```
/database/demo-data/create-salon-demo-users.sql
```

Or copy this quick version:

```sql
-- Enable password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create Manager
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'manager@hairtalkz.ae',
  crypt('Manager2024!', gen_salt('bf')),
  NOW(), NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create Accountant
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'accountant@hairtalkz.ae',
  crypt('Accounts2024!', gen_salt('bf')),
  NOW(), NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;

-- Verify creation
SELECT email, email_confirmed_at, created_at
FROM auth.users
WHERE email IN ('manager@hairtalkz.ae', 'accountant@hairtalkz.ae')
ORDER BY email;
```

### Step 3: Click "Run" Button

The script will:
- ✅ Create manager@hairtalkz.ae account
- ✅ Create accountant@hairtalkz.ae account
- ✅ Set passwords
- ✅ Auto-confirm emails
- ✅ Show verification results

---

## Login Credentials

### Manager Account
```
Email: manager@hairtalkz.ae
Password: Manager2024!
Role: Manager (Operations)
```

**Access**:
- ✅ Appointments, POS, Services, Products, Inventory
- ✅ Staff scheduling, Customer management
- ✅ Operations dashboard
- ⚠️ Limited financial access

### Accountant Account
```
Email: accountant@hairtalkz.ae
Password: Accounts2024!
Role: Accountant (Finance)
```

**Access**:
- ✅ Full financial reports, P&L, Balance Sheet
- ✅ VAT reports, Tax compliance
- ✅ Export financial data
- ✅ Transaction history
- ❌ No POS or appointment access

---

## How Role Detection Works

The system automatically detects roles based on email patterns:

```typescript
// From SecuredSalonProvider.tsx (lines 554-615)

if (user.email.includes('manager')) {
  return 'manager'  // ✅ Works for manager@hairtalkz.ae
}

if (user.email.includes('accountant')) {
  return 'accountant'  // ✅ Works for accountant@hairtalkz.ae
}
```

**Important**: The domain (`.ae` or `.com`) doesn't matter - the system checks for the role keyword in the email.

---

## Testing

### Test Manager Login

1. Go to http://localhost:3000/salon/auth
2. Enter:
   - Email: `manager@hairtalkz.ae`
   - Password: `Manager2024!`
3. Click "Secure Login"

**Expected Result**:
- ✅ Login successful
- ✅ Console shows: `🔍 Determining salon role for: manager@hairtalkz.ae`
- ✅ Role determined as "manager"
- ✅ Operations-focused navigation visible
- ✅ Can access Appointments, POS, Staff, Customers, Branches
- ✅ Limited financial access

### Test Accountant Login

1. Go to http://localhost:3000/salon/auth
2. Enter:
   - Email: `accountant@hairtalkz.ae`
   - Password: `Accounts2024!`
3. Click "Secure Login"

**Expected Result**:
- ✅ Login successful
- ✅ Console shows: `🔍 Determining salon role for: accountant@hairtalkz.ae`
- ✅ Role determined as "accountant"
- ✅ Finance-focused navigation visible
- ✅ Can access Finance, Reports sections
- ✅ No POS or appointment access

---

## Verification Checklist

After running the SQL script:

- [ ] Manager user appears in Supabase → Authentication → Users
- [ ] Accountant user appears in Supabase → Authentication → Users
- [ ] Both users show "Confirmed" email status
- [ ] Can login with manager@hairtalkz.ae + Manager2024!
- [ ] Can login with accountant@hairtalkz.ae + Accounts2024!
- [ ] Manager sees operations navigation (no Finance)
- [ ] Accountant sees finance navigation (no POS)
- [ ] Console logs show correct role detection

---

## Alternative: Use Different Domain

If you want to use `@hairtalkz.com` instead of `@hairtalkz.ae`:

Just change the emails in the SQL script:
```sql
email = 'manager@hairtalkz.com'  -- Instead of .ae
email = 'accountant@hairtalkz.com'  -- Instead of .ae
```

**Both domains work** - the system only checks for the role keyword!

---

## Troubleshooting

### Issue: "Invalid credentials"
**Solution**: Run the SQL script - users don't exist yet

### Issue: "User created but can't login"
**Solution**:
1. Check Supabase → Authentication → Users
2. Verify email is exactly: `manager@hairtalkz.ae` or `accountant@hairtalkz.ae`
3. Try password: `Manager2024!` or `Accounts2024!` (case-sensitive)

### Issue: "User logs in as 'owner' instead of manager"
**Solution**:
1. Check console log: Should say "manager@hairtalkz.ae"
2. Email must contain the word "manager" or "accountant"
3. Role detection is case-insensitive for keywords

### Issue: "Cannot access certain features"
**Solution**: This is correct! Each role has specific permissions:
- Manager → No finance access by design
- Accountant → No POS access by design
- Use michele@hairtalk.ae for owner (full access)

---

## Permission Summary

| Feature | Michele (Owner) | Manager | Accountant |
|---------|----------------|---------|------------|
| Dashboard | ✅ Full | ✅ Operations | ✅ Finance |
| Appointments | ✅ All | ✅ All | ❌ No |
| POS | ✅ Full | ✅ Full | ❌ No |
| Services | ✅ Manage | ✅ Manage | ❌ No |
| Products | ✅ Manage | ✅ Manage | ❌ No |
| Inventory | ✅ Full | ✅ Manage | ❌ No |
| Staff | ✅ Manage | ✅ Schedule | ❌ No |
| Customers | ✅ All | ✅ All | ❌ No |
| Branches | ✅ All | ✅ All | ❌ View |
| Finance | ✅ Full | ⚠️ Limited | ✅ Full |
| Reports | ✅ All | ✅ Operations | ✅ Financial |
| Settings | ✅ All | ❌ No | ❌ No |

---

## Summary

**To enable manager and accountant login:**

1. **Run SQL Script** (2 minutes)
   - Open Supabase SQL Editor
   - Copy & run `/database/demo-data/create-salon-demo-users.sql`

2. **Test Logins** (2 minutes)
   - Login with `manager@hairtalkz.ae` / `Manager2024!`
   - Login with `accountant@hairtalkz.ae` / `Accounts2024!`

3. **Verify Permissions** (2 minutes)
   - Manager sees operations features
   - Accountant sees finance features
   - Both have appropriate access restrictions

**Total Time: 6 minutes** ⏱️

---

**Generated**: 2025-01-12
**Status**: Ready to implement
**Files**:
- SQL Script: `/database/demo-data/create-salon-demo-users.sql`
- Full Guide: `/SALON-DEMO-USERS-SETUP.md`
