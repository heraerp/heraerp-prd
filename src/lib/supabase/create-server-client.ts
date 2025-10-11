import type { Cookies } from 'next/dist/server/web/spec-extension/cookies';
type SupabaseClient = { auth: { getUser: () => Promise<{ data: any, error: any }> } };

export function createServerClient(_cookies?: Cookies): SupabaseClient {
  // TODO: swap in @supabase/ssr or your wrapper
  return {
    auth: { async getUser() { return { data: null, error: null }; } }
  };
}

// Back-compat alias if some code imports { createClient }
export const createClient = createServerClient;