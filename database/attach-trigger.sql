-- Attach the HERA user creation trigger to auth.users table
-- Run this in Supabase SQL Editor

-- First, ensure the trigger function exists (it should already be there)
-- If not, you can copy the function from the previous query result

-- Drop any existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on the auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  trigger_schema,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test notification
DO $$
BEGIN
    RAISE NOTICE '✅ HERA user creation trigger attached successfully!';
    RAISE NOTICE '🔄 New users will automatically get HERA entities created';
    RAISE NOTICE '📋 Trigger: on_auth_user_created → public.handle_new_user()';
END $$;