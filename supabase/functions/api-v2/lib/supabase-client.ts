// HERA v2.3 API Gateway - Supabase Client Factory
// Smart Code: HERA.API.V2.SUPABASE.CLIENT.v1

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required Supabase environment variables");
}

/**
 * Create Supabase client with service role key (for RPC calls)
 */
export function createServiceRoleClient() {
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Create Supabase client with user JWT (for auth validation)
 */
export function createUserClient(jwt?: string) {
  const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // If JWT provided, set it for this client
  if (jwt) {
    client.auth.setSession({
      access_token: jwt,
      refresh_token: '', // Not needed for validation
      expires_in: 3600,
      token_type: 'bearer',
      user: null as any // Will be populated by getUser()
    });
  }

  return client;
}

/**
 * Validate JWT and get user info
 */
export async function validateJWT(jwt: string) {
  const client = createUserClient(jwt);
  
  try {
    const { data: { user }, error } = await client.auth.getUser();
    
    if (error) {
      throw new Error(`JWT validation failed: ${error.message}`);
    }
    
    if (!user) {
      throw new Error('JWT validation failed: No user found');
    }

    return {
      user,
      valid: true
    };
  } catch (error) {
    return {
      user: null,
      valid: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Set gateway context for RPC calls
 */
export async function setGatewayContext(
  client: ReturnType<typeof createServiceRoleClient>,
  functionName: string,
  requestSource: string = 'api_v2_gateway'
) {
  try {
    await client.rpc('set_gateway_context', {
      p_function_name: functionName,
      p_request_source: requestSource
    });
  } catch (error) {
    console.error('Failed to set gateway context:', error);
    // Don't throw - this is a warning, not a blocking error
  }
}