-- Link Mario's Supabase auth user to HERA profile
-- This script should be run after Mario has registered in Supabase Auth

-- First, get the Supabase user ID for mario@restaurant.com
-- You'll need to replace 'YOUR_MARIO_AUTH_USER_ID' with the actual Supabase user ID

-- Option 1: If you know the auth user ID
UPDATE core_entities 
SET auth_user_id = 'YOUR_MARIO_AUTH_USER_ID'
WHERE id = 'user_mario_rossi' 
  AND entity_type = 'user_profile';

-- Option 2: If you want to link by email (requires joining with auth.users)
-- Note: This requires access to the auth schema which may not be available in all environments
/*
UPDATE core_entities e
SET auth_user_id = u.id
FROM auth.users u
WHERE e.id = 'user_mario_rossi' 
  AND e.entity_type = 'user_profile'
  AND u.email = 'mario@restaurant.com';
*/

-- Verify the link was created
SELECT 
  e.id,
  e.entity_name,
  e.auth_user_id,
  dd.field_value as email
FROM core_entities e
LEFT JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'email'
WHERE e.id = 'user_mario_rossi';