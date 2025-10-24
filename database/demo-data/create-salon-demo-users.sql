-- =================================================================
-- SALON DEMO USERS CREATION SCRIPT
-- =================================================================
-- Purpose: Create demo users for HairTalkz salon application
-- Run this in: Supabase Dashboard → SQL Editor
-- Estimated time: 30 seconds
-- =================================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =================================================================
-- 1. CREATE MANAGER USER
-- =================================================================
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
  'manager@hairtalkz.ae',  -- ✅ Using .ae domain as requested
  crypt('Manager2024!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- =================================================================
-- 2. CREATE ACCOUNTANT USER
-- =================================================================
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
  'accountant@hairtalkz.ae',  -- ✅ Using .ae domain as requested
  crypt('Accounts2024!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- =================================================================
-- 3. CREATE ADDITIONAL DEMO USERS (OPTIONAL)
-- =================================================================

-- Receptionist
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
  'receptionist@hairtalkz.ae',
  crypt('Reception2024!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Stylist
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
  'stylist@hairtalkz.ae',
  crypt('Stylist2024!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Admin
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
  'admin@hairtalkz.ae',
  crypt('Admin2024!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- =================================================================
-- 4. VERIFY USERS WERE CREATED
-- =================================================================
SELECT
  email,
  CASE
    WHEN email LIKE '%manager%' THEN '👔 Manager'
    WHEN email LIKE '%accountant%' THEN '📊 Accountant'
    WHEN email LIKE '%receptionist%' THEN '👋 Receptionist'
    WHEN email LIKE '%stylist%' THEN '✂️ Stylist'
    WHEN email LIKE '%admin%' THEN '🔐 Admin'
    ELSE '❓ Unknown'
  END as detected_role,
  email_confirmed_at as confirmed,
  created_at as created,
  '✅ User created successfully' as status
FROM auth.users
WHERE email LIKE '%@hairtalkz.ae'
ORDER BY
  CASE
    WHEN email LIKE '%manager%' THEN 1
    WHEN email LIKE '%accountant%' THEN 2
    WHEN email LIKE '%receptionist%' THEN 3
    WHEN email LIKE '%stylist%' THEN 4
    WHEN email LIKE '%admin%' THEN 5
    ELSE 6
  END;

-- =================================================================
-- 5. USER CREDENTIALS REFERENCE
-- =================================================================
-- Copy these credentials for testing:
--
-- MANAGER:
-- Email: manager@hairtalkz.ae
-- Password: Manager2024!
-- Expected Role: Manager (Operations)
--
-- ACCOUNTANT:
-- Email: accountant@hairtalkz.ae
-- Password: Accounts2024!
-- Expected Role: Accountant (Finance)
--
-- RECEPTIONIST:
-- Email: receptionist@hairtalkz.ae
-- Password: Reception2024!
-- Expected Role: Receptionist (Front Desk)
--
-- STYLIST:
-- Email: stylist@hairtalkz.ae
-- Password: Stylist2024!
-- Expected Role: Stylist (Personal Schedule)
--
-- ADMIN:
-- Email: admin@hairtalkz.ae
-- Password: Admin2024!
-- Expected Role: Admin (System Management)
-- =================================================================

-- =================================================================
-- TESTING INSTRUCTIONS:
-- =================================================================
-- 1. Run this script in Supabase Dashboard → SQL Editor
-- 2. Check the verification query results (should show all users)
-- 3. Go to http://localhost:3000/salon/auth
-- 4. Login with any of the credentials above
-- 5. Check console logs for role detection
-- 6. Verify appropriate dashboard and navigation appears
-- =================================================================
