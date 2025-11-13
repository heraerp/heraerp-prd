-- HERA v2.3 - Hard Gate Implementation
-- Smart Code: HERA.SECURITY.GATEWAY.ENFORCEMENT.v1
-- 
-- Blocks direct RPC access - all requests must route through API v2 Gateway
-- This is the critical security boundary that prevents client RPC bypass

-- =============================================================================
-- Step 1: Gateway Enforcement Function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_api_v2_gateway()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gateway_active text;
  v_function_name text;
  v_request_source text;
BEGIN
  -- Get gateway setting - API v2 gateway sets this to 'true' before calling RPCs
  v_gateway_active := current_setting('app.api_v2_gateway', true);
  
  -- Get context for better error messages
  v_function_name := COALESCE(current_setting('app.current_function', true), 'unknown_function');
  v_request_source := COALESCE(current_setting('app.request_source', true), 'direct_client');
  
  -- Block access if gateway flag is not set
  IF v_gateway_active IS DISTINCT FROM 'true' THEN
    -- Log the violation attempt for security monitoring
    RAISE NOTICE 'HERA SECURITY: Direct RPC access blocked - function: %, source: %, gateway_flag: %',
      v_function_name, v_request_source, COALESCE(v_gateway_active, 'null');
    
    -- Return user-friendly error
    RAISE EXCEPTION 'HERA Security: All operations must route through API v2 Gateway. Direct RPC access is forbidden.'
      USING 
        ERRCODE = 'P0001',
        HINT = 'Use HeraClient or /api/v2/* endpoints instead of direct supabase.rpc() calls',
        DETAIL = format('Function: %s, Source: %s', v_function_name, v_request_source);
  END IF;
  
  -- Success - request came through proper gateway
  -- Log successful gateway validation (only in debug mode)
  IF current_setting('app.debug_gateway', true) = 'true' THEN
    RAISE NOTICE 'HERA GATEWAY: Valid API v2 request - function: %', v_function_name;
  END IF;
END;
$$;

-- Grant execution to authenticated users (they still need proper JWT validation in gateway)
GRANT EXECUTE ON FUNCTION public.enforce_api_v2_gateway() TO authenticated;

-- =============================================================================
-- Step 2: Gateway Flag Setting Function (for API v2 Gateway use)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_gateway_context(
  p_function_name text DEFAULT NULL,
  p_request_source text DEFAULT 'api_v2_gateway'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set the gateway active flag
  PERFORM set_config('app.api_v2_gateway', 'true', true);
  
  -- Set context information for debugging
  IF p_function_name IS NOT NULL THEN
    PERFORM set_config('app.current_function', p_function_name, true);
  END IF;
  
  PERFORM set_config('app.request_source', p_request_source, true);
END;
$$;

-- Grant execution to service role only (used by API v2 Gateway)
GRANT EXECUTE ON FUNCTION public.set_gateway_context(text, text) TO service_role;

-- =============================================================================
-- Step 3: Emergency Override Function (for admin emergencies only)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.emergency_override_gateway(
  p_admin_key text,
  p_reason text,
  p_duration_seconds integer DEFAULT 300
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expected_key text;
  v_override_until timestamptz;
BEGIN
  -- Simple admin key check (in production, use proper admin verification)
  v_expected_key := current_setting('app.admin_emergency_key', true);
  
  IF v_expected_key IS NULL OR p_admin_key != v_expected_key THEN
    RAISE EXCEPTION 'Invalid admin key for emergency override';
  END IF;
  
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Emergency override requires detailed reason (minimum 10 characters)';
  END IF;
  
  -- Set temporary override
  v_override_until := NOW() + (p_duration_seconds * interval '1 second');
  
  PERFORM set_config('app.gateway_override_until', v_override_until::text, true);
  PERFORM set_config('app.gateway_override_reason', p_reason, true);
  
  -- Log the emergency override
  RAISE NOTICE 'HERA EMERGENCY: Gateway override activated until % - Reason: %',
    v_override_until, p_reason;
END;
$$;

-- Grant to superuser only (for true emergencies)
-- GRANT EXECUTE ON FUNCTION public.emergency_override_gateway(text, text, integer) TO postgres;

-- =============================================================================
-- Step 4: Enhanced Gateway Enforcement with Emergency Override Support
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_api_v2_gateway()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gateway_active text;
  v_function_name text;
  v_request_source text;
  v_override_until timestamptz;
  v_override_reason text;
BEGIN
  -- Check for emergency override first
  v_override_until := COALESCE(current_setting('app.gateway_override_until', true), '')::timestamptz;
  v_override_reason := current_setting('app.gateway_override_reason', true);
  
  IF v_override_until IS NOT NULL AND v_override_until > NOW() THEN
    RAISE NOTICE 'HERA EMERGENCY: Gateway enforcement bypassed due to active override - Reason: %', v_override_reason;
    RETURN;
  END IF;
  
  -- Normal gateway enforcement
  v_gateway_active := current_setting('app.api_v2_gateway', true);
  v_function_name := COALESCE(current_setting('app.current_function', true), 'unknown_function');
  v_request_source := COALESCE(current_setting('app.request_source', true), 'direct_client');
  
  -- Block access if gateway flag is not set
  IF v_gateway_active IS DISTINCT FROM 'true' THEN
    -- Log the violation attempt for security monitoring
    RAISE NOTICE 'HERA SECURITY: Direct RPC access blocked - function: %, source: %, gateway_flag: %',
      v_function_name, v_request_source, COALESCE(v_gateway_active, 'null');
    
    -- Return user-friendly error with guidance
    RAISE EXCEPTION 'HERA Security: All operations must route through API v2 Gateway. Direct RPC access is forbidden.'
      USING 
        ERRCODE = 'P0001',
        HINT = 'Use HeraClient SDK or /api/v2/* endpoints instead of direct supabase.rpc() calls',
        DETAIL = format('Function: %s, Source: %s, Time: %s', v_function_name, v_request_source, NOW());
  END IF;
  
  -- Success - request came through proper gateway
  IF current_setting('app.debug_gateway', true) = 'true' THEN
    RAISE NOTICE 'HERA GATEWAY: Valid API v2 request - function: %, source: %', v_function_name, v_request_source;
  END IF;
END;
$$;

-- =============================================================================
-- Step 5: Test Functions for Validation
-- =============================================================================

-- Test function to verify gateway enforcement works
CREATE OR REPLACE FUNCTION public.test_gateway_enforcement()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_error_caught boolean DEFAULT false;
BEGIN
  -- Test 1: Direct call should fail
  BEGIN
    PERFORM enforce_api_v2_gateway();
  EXCEPTION
    WHEN OTHERS THEN
      v_error_caught := true;
  END;
  
  v_result := jsonb_build_object(
    'test_1_direct_call_blocked', v_error_caught,
    'test_timestamp', NOW()
  );
  
  -- Test 2: Call with gateway flag should succeed
  PERFORM set_gateway_context('test_function', 'test_source');
  
  BEGIN
    PERFORM enforce_api_v2_gateway();
    v_result := v_result || jsonb_build_object('test_2_gateway_call_allowed', true);
  EXCEPTION
    WHEN OTHERS THEN
      v_result := v_result || jsonb_build_object('test_2_gateway_call_allowed', false, 'error', SQLERRM);
  END;
  
  -- Reset gateway flag
  PERFORM set_config('app.api_v2_gateway', '', true);
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_gateway_enforcement() TO authenticated;

-- =============================================================================
-- Step 6: Add Comments and Documentation
-- =============================================================================

COMMENT ON FUNCTION public.enforce_api_v2_gateway() IS 
'HERA v2.3 Security: Enforces that all RPC calls route through API v2 Gateway. 
Prevents direct client access to RPC functions, ensuring proper authentication, 
authorization, and guardrails validation.';

COMMENT ON FUNCTION public.set_gateway_context(text, text) IS 
'HERA v2.3 Security: Sets gateway context flags for proper RPC access. 
Should only be called by the API v2 Gateway service before invoking RPC functions.';

COMMENT ON FUNCTION public.emergency_override_gateway(text, text, integer) IS 
'HERA v2.3 Emergency: Allows temporary bypass of gateway enforcement for critical situations. 
Requires admin key and detailed reason. Should only be used in true emergencies.';

COMMENT ON FUNCTION public.test_gateway_enforcement() IS 
'HERA v2.3 Testing: Validates that gateway enforcement is working correctly. 
Returns test results for monitoring and validation purposes.';

-- Log successful migration
SELECT 'HERA v2.3 Hard Gate: Gateway enforcement functions created successfully' as result;