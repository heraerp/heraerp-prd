# Salon Demo Users Setup Guide

**Date**: 2025-01-12
**Status**: Setup Instructions for Demo Users

---

## Current Situation

✅ **Demo users configured in code**: DemoUserSelector has all user definitions
❌ **Supabase auth users missing**: Need to create actual auth accounts

---

## Demo Users Available

The following demo users are configured in `/src/components/salon/auth/DemoUserSelector.tsx`:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Owner** | michele@hairtalkz.com | HairTalkz2024! | Full system access |
| **Manager** | manager@hairtalkz.com | Manager2024! | Operations management |
| **Receptionist** | receptionist@hairtalkz.com | Reception2024! | Front desk operations |
| **Stylist** | stylist@hairtalkz.com | Stylist2024! | Personal appointments only |
| **Accountant** | accountant@hairtalkz.com | Accounts2024! | Financial reports & compliance |
| **Admin** | admin@hairtalkz.com | Admin2024! | System administration |

---

## Option 1: Create Users via Supabase Dashboard (RECOMMENDED)

### Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Users**

### Step 2: Create Each User

Click "Add user" and create the following accounts:

#### 1. Manager Account
```
Email: manager@hairtalkz.com
Password: Manager2024!
Email Confirm: ✅ (auto-confirm)
```

#### 2. Accountant Account
```
Email: accountant@hairtalkz.com
Password: Accounts2024!
Email Confirm: ✅ (auto-confirm)
```

#### 3. Receptionist Account (Optional)
```
Email: receptionist@hairtalkz.com
Password: Reception2024!
Email Confirm: ✅ (auto-confirm)
```

#### 4. Stylist Account (Optional)
```
Email: stylist@hairtalkz.com
Password: Stylist2024!
Email Confirm: ✅ (auto-confirm)
```

#### 5. Admin Account (Optional)
```
Email: admin@hairtalkz.com
Password: Admin2024!
Email Confirm: ✅ (auto-confirm)
```

### Step 3: Verify Creation

After creating each user:
- ✅ User appears in the Authentication > Users list
- ✅ Email confirmation status shows as "Confirmed"
- ✅ User ID (UUID) is generated

---

## Option 2: Create Users via SQL (ADVANCED)

### Step 1: Access SQL Editor

1. Go to Supabase Dashboard → **SQL Editor**
2. Create a new query

### Step 2: Run User Creation Script

```sql
-- Create Manager User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'manager@hairtalkz.com',
  crypt('Manager2024!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create Accountant User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'accountant@hairtalkz.com',
  crypt('Accounts2024!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Verify users were created
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email IN ('manager@hairtalkz.com', 'accountant@hairtalkz.com')
ORDER BY email;
```

---

## Option 3: Use Demo User Selector (EASIEST)

If you're just testing, use the "Show Demo Users" button on the login page:

### Step 1: Access Login Page
```
http://localhost:3000/salon/auth
```

### Step 2: Show Demo Users
1. Click "Show Demo Users 🧪" button
2. See all available demo user cards

### Step 3: Quick Login
Click "Login as manager" or "Login as accountant" on the respective cards

**Note**: This still requires the Supabase users to exist first!

---

## Testing After User Creation

### Test Manager Login

1. Go to http://localhost:3000/salon/auth
2. Enter credentials:
   - Email: `manager@hairtalkz.com`
   - Password: `Manager2024!`
3. Click "Secure Login"

**Expected Behavior**:
- ✅ Authentication succeeds
- ✅ Toast: "Welcome to HairTalkz - Authentication successful"
- ✅ Redirects to `/salon/dashboard`
- ✅ Console log: `🔍 Determining salon role for: manager@hairtalkz.com`
- ✅ Role determined as "manager"
- ✅ Limited navigation (no Finance access)
- ✅ Operations dashboard visible

### Test Accountant Login

1. Go to http://localhost:3000/salon/auth
2. Enter credentials:
   - Email: `accountant@hairtalkz.com`
   - Password: `Accounts2024!`
3. Click "Secure Login"

**Expected Behavior**:
- ✅ Authentication succeeds
- ✅ Redirects to `/salon/dashboard`
- ✅ Console log: `🔍 Determining salon role for: accountant@hairtalkz.com`
- ✅ Role determined as "accountant"
- ✅ Finance-focused navigation visible
- ✅ Financial reports accessible
- ✅ No POS access
- ✅ VAT and compliance features visible

---

## Role Detection Verification

The system automatically detects roles based on email patterns in `SecuredSalonProvider.tsx` (lines 554-615):

```typescript
// ✅ ENTERPRISE: System determines role from email
if (user.email.includes('michele')) {
  return 'owner'  // michele@hairtalkz.com → Owner
}

if (user.email.includes('manager')) {
  return 'manager'  // manager@hairtalkz.com → Manager
}

if (user.email.includes('receptionist') || user.email.includes('front')) {
  return 'receptionist'  // receptionist@hairtalkz.com → Receptionist
}

if (user.email.includes('stylist') || user.email.includes('hair')) {
  return 'stylist'  // stylist@hairtalkz.com → Stylist
}

if (user.email.includes('accountant') || user.email.includes('finance')) {
  return 'accountant'  // accountant@hairtalkz.com → Accountant
}

// Default to owner for salon demo
return 'owner'
```

---

## Troubleshooting

### Issue: "Login Failed - Invalid credentials"

**Cause**: User doesn't exist in Supabase auth

**Solution**:
1. Verify user exists: Supabase Dashboard → Authentication → Users
2. Check email spelling matches exactly
3. Create user if missing (see Option 1 above)

---

### Issue: "User logs in but has wrong role"

**Cause**: Email pattern doesn't match expected format

**Solution**:
1. Check console logs: Look for "🔍 Determining salon role for: [email]"
2. Verify email includes role keyword (manager, accountant, etc.)
3. Email must be exactly: `manager@hairtalkz.com` or `accountant@hairtalkz.com`

---

### Issue: "User logs in as 'owner' instead of intended role"

**Cause**: Email pattern not detected, falling back to default

**Solution**:
1. Verify email is exactly: `manager@hairtalkz.com` (not manager@hairtalk.ae)
2. Check for typos in email
3. Console should show: "🔍 Determining salon role for: manager@hairtalkz.com"
4. If email is correct, verify SecuredSalonProvider is loaded

---

### Issue: "Only michele@hairtalk.ae has permission"

**Cause**: Other users don't exist in Supabase

**Solution**: Create users using Option 1 above

**Note**: The email in your message says `hairtalk.ae` but the system expects `hairtalkz.com`

---

## Email Domain Note

⚠️ **IMPORTANT**: The demo users are configured for `@hairtalkz.com` domain:

- ✅ Correct: `manager@hairtalkz.com`
- ❌ Wrong: `manager@hairtalk.ae`

If you need to use `@hairtalk.ae` domain:

1. Create users with `@hairtalk.ae` emails in Supabase
2. Role detection will still work (checks for "manager", "accountant" keywords)

**Example**:
- `manager@hairtalk.ae` → Will be detected as "manager" role ✅
- `accountant@hairtalk.ae` → Will be detected as "accountant" role ✅

---

## Quick Setup Script (Copy-Paste Ready)

For fastest setup, run this in Supabase SQL Editor:

```sql
-- Quick Demo Users Creation Script
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Create Manager
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'manager@hairtalkz.com',
  crypt('Manager2024!', gen_salt('bf')),
  NOW(), NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;

-- 2. Create Accountant
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'accountant@hairtalkz.com',
  crypt('Accounts2024!', gen_salt('bf')),
  NOW(), NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;

-- 3. Verify Creation
SELECT
  email,
  email_confirmed_at,
  created_at,
  'User created successfully' as status
FROM auth.users
WHERE email IN ('manager@hairtalkz.com', 'accountant@hairtalkz.com')
ORDER BY email;
```

---

## Permission Matrix

After setup, users will have these permissions:

| Feature | Owner | Manager | Accountant | Receptionist | Stylist | Admin |
|---------|-------|---------|------------|--------------|---------|-------|
| Dashboard | ✅ All | ✅ Operations | ✅ Finance | ✅ Front Desk | ✅ Personal | ✅ System |
| Appointments | ✅ All | ✅ All | ❌ No | ✅ Manage | ✅ Own Only | ❌ No |
| POS | ✅ Full | ✅ Full | ❌ No | ✅ Basic | ❌ No | ❌ No |
| Services | ✅ Manage | ✅ Manage | ❌ No | ✅ View | ✅ Own | ❌ No |
| Products | ✅ Manage | ✅ Manage | ❌ No | ❌ No | ❌ No | ❌ No |
| Inventory | ✅ Full | ✅ Manage | ❌ No | ❌ No | ❌ No | ❌ No |
| Staff | ✅ Manage | ✅ Schedule | ❌ No | ❌ No | ❌ No | ❌ No |
| Customers | ✅ All | ✅ All | ❌ No | ✅ Manage | ✅ Assigned | ❌ No |
| Branches | ✅ All | ✅ All | ❌ No | ✅ View | ❌ No | ❌ No |
| Finance | ✅ Full | ✅ View | ✅ Full | ❌ No | ❌ No | ❌ No |
| Reports | ✅ All | ✅ Operations | ✅ Financial | ❌ No | ❌ No | ✅ System |
| Settings | ✅ All | ❌ No | ❌ No | ❌ No | ❌ No | ✅ System |

---

## Testing Checklist

After creating users, test each one:

### Manager Account Testing:
- [ ] Login succeeds with manager@hairtalkz.com
- [ ] Role detected as "manager" in console
- [ ] Dashboard shows operations metrics
- [ ] Can access Appointments
- [ ] Can access POS
- [ ] Can access Services
- [ ] Can access Staff scheduling
- [ ] Can access Customers
- [ ] Can access Branches
- [ ] Finance menu shows "View Only" badge (if implemented)
- [ ] Cannot access Settings

### Accountant Account Testing:
- [ ] Login succeeds with accountant@hairtalkz.com
- [ ] Role detected as "accountant" in console
- [ ] Dashboard shows financial widgets
- [ ] Can access Finance section
- [ ] Can view P&L reports
- [ ] Can access VAT reports
- [ ] Can export financial data
- [ ] Cannot access POS
- [ ] Cannot access Appointments
- [ ] Cannot access Staff management
- [ ] Finance-focused sidebar visible

---

## Next Steps After Setup

1. **Create Users in Supabase** (5 minutes)
   - Use Option 1 (Dashboard) for easiest setup
   - Or use Quick Setup Script above

2. **Test Login** (2 minutes each)
   - Login with manager@hairtalkz.com
   - Login with accountant@hairtalkz.com
   - Verify role detection in console

3. **Test Permissions** (5 minutes each)
   - Navigate to different sections
   - Verify access restrictions work
   - Check sidebar navigation items

4. **Use Demo User Selector** (Optional)
   - Click "Show Demo Users 🧪"
   - Quick-test all roles
   - Verify role-based UI changes

---

## Support

If you encounter issues:

1. Check browser console for logs:
   - `🔍 Determining salon role for: [email]`
   - `✅ Salon security context initialized successfully`

2. Check Supabase Dashboard:
   - Authentication → Users → Verify user exists
   - Logs → Check for auth errors

3. Verify organization ID:
   - Console should show: `organizationId: "378f24fb-d496-4ff7-8afa-ea34895a0eb8"`

---

**Generated**: 2025-01-12
**Purpose**: Setup instructions for salon demo users
**Status**: Ready for implementation
