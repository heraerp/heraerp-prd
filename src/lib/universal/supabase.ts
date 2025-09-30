// src/lib/universal/supabase.ts
// HERA Supabase Client — server-side database access (RLS + Service modes)
// + org-scope guard + typed RPC map + overloaded callRPC

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/* =============================================================================
   ENV VALIDATION
============================================================================= */

function requireEnv(keys: string[]) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Add them to your server env (.env, .env.local).`
    );
  }
}

const URL_VAR = 'NEXT_PUBLIC_SUPABASE_URL';
const SERVICE_VAR = 'SUPABASE_SERVICE_ROLE_KEY';
const ANON_VAR = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';

/* =============================================================================
   SINGLETON CLIENTS (server-only)
============================================================================= */

let _service: SupabaseClient | null = null;
let _rlsBase: SupabaseClient | null = null;

/** Full-access server client (bypasses RLS). NEVER import in browser code. */
export function serverSupabase(): SupabaseClient {
  requireEnv([URL_VAR, SERVICE_VAR]);
  if (!_service) {
    _service = createClient(process.env[URL_VAR]!, process.env[SERVICE_VAR]!, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: 'public' },
    });
  }
  return _service;
}

/** Base RLS client (anon). For per-request RLS, pass a bearer token to getDb(). */
function baseRlsClient(): SupabaseClient {
  requireEnv([URL_VAR, ANON_VAR]);
  if (!_rlsBase) {
    _rlsBase = createClient(process.env[URL_VAR]!, process.env[ANON_VAR]!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _rlsBase;
}

/* =============================================================================
   DB SELECTOR (RLS or Service) WITH OPTIONAL USER TOKEN
============================================================================= */

export type DbMode = 'rls' | 'service';

/**
 * Get a Supabase client for the chosen mode.
 * - 'service'  -> bypass RLS (server role)
 * - 'rls'      -> enforce RLS; optionally pass a user's access token
 */
export function getDb(mode: DbMode = 'rls', accessToken?: string): SupabaseClient {
  if (mode === 'service') return serverSupabase();
  const base = baseRlsClient();
  if (!accessToken) return base;

  // Per-request RLS client with Authorization header
  return createClient(process.env[URL_VAR]!, process.env[ANON_VAR]!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/* =============================================================================
   DEFENSE-IN-DEPTH: ORGANIZATION SCOPE ASSERTION
============================================================================= */

/** Basic UUID (v4-compatible) check; lenient enough for most UUIDs */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Ensures every RPC payload carries a valid `p_organization_id`.
 * Throws an Error if missing/invalid.
 */
export function assertOrgScope(params: Record<string, any>): void {
  const org = params?.p_organization_id;
  if (!org || typeof org !== 'string' || !UUID_REGEX.test(org)) {
    throw new Error(
      'Guardrail violation: missing or invalid `p_organization_id` in RPC payload.'
    );
  }
}

/* =============================================================================
   TYPED RPC MAP (extend as you add server functions)
============================================================================= */

/** Canonical minimal shapes — refine to your exact RPC return types */
export type UUID = string;

export interface UpsertEntityResult {
  entity_id: UUID;
}

export interface EntityProfile {
  id: UUID;
  entity_type: string;
  entity_name: string;
  entity_code?: string | null;
  smart_code: string;
  parent_entity_id?: UUID | null;
  status?: string;
  // add more fields as needed
}

export type EntitiesQueryResult = EntityProfile[];

export interface EntityGetResult extends EntityProfile {
  dynamic_data?: Array<{
    id: UUID;
    field_name: string;
    field_type: 'text' | 'number' | 'boolean' | 'date' | 'json';
    // ...optional value fields
  }>;
}

export interface EntityDeleteResult {
  deleted: boolean;
}

export interface TransactionCreateResult {
  transaction_id: UUID;
}

export interface TransactionLineAppendResult {
  transaction_id: UUID;
  line_number: number;
}

/**
 * Map RPC names to their result types. Keep this authoritative.
 * Add entries as you implement new RPCs.
 */
export type RpcMap = {
  // Entities
  hera_entity_upsert_v1: UpsertEntityResult;
  hera_entities_query_v1: EntitiesQueryResult;
  hera_entity_get_v1: EntityGetResult;
  hera_entity_delete_v1: EntityDeleteResult;

  // Transactions
  hera_transaction_create_v1: TransactionCreateResult;
  hera_transaction_line_append_v1: TransactionLineAppendResult;

  // Add more as needed...
};

/* =============================================================================
   RPC CALLER TYPES
============================================================================= */

export interface RPCError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface RPCResult<T = unknown> {
  data: T | null;
  error: RPCError | null;
}

export interface CallOptions {
  mode?: DbMode;
  token?: string;
  /** Set to true to skip org-scope assertion (for org-agnostic bootstrap RPCs only). */
  skipOrgCheck?: boolean;
}

/* =============================================================================
   OVERLOADED callRPC — returns precise type by RPC name
============================================================================= */

// Overload: known RPC name (typed result)
export async function callRPC<K extends keyof RpcMap>(
  rpcName: K,
  params: Record<string, any>,
  options?: CallOptions
): Promise<RPCResult<RpcMap[K]>>;

// Overload: unknown RPC name (generic result)
export async function callRPC<T = unknown>(
  rpcName: string,
  params: Record<string, any>,
  options?: CallOptions
): Promise<RPCResult<T>>;

// Implementation
export async function callRPC<T = unknown>(
  rpcName: string,
  params: Record<string, any>,
  options: CallOptions = {}
): Promise<RPCResult<T>> {
  const { mode = 'rls', token, skipOrgCheck = false } = options;

  if (!skipOrgCheck) {
    // assert org scope for all org-bound calls
    assertOrgScope(params);
  }

  const db = getDb(mode, token);
  try {
    const { data, error } = await db.rpc<T>(rpcName, params);
    if (error) {
      // eslint-disable-next-line no-console
      console.error(`[RPC Error] ${rpcName}:`, error);
      return {
        data: null,
        error: {
          message: error.message,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
        },
      };
    }
    return { data: data as T, error: null };
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error(`[RPC Exception] ${rpcName}:`, e);
    return { data: null, error: { message: e.message ?? 'Unknown error' } };
  }
}

/* =============================================================================
   BATCH RPC (non-transactional)
============================================================================= */

export interface BatchRPCCall {
  name: string;
  params: Record<string, any>;
  options?: CallOptions;
}

export interface BatchRPCResult {
  success: boolean;
  results: Array<{ name: string; data: any; error: RPCError | null }>;
  failed_at?: number;
}

/**
 * Execute multiple RPCs in sequence.
 * NOTE: This does NOT create a DB transaction across calls.
 * For atomic multi-step flows, implement a server-side orchestration RPC
 * that wraps BEGIN/COMMIT/ROLLBACK.
 */
export async function callBatchRPC(
  calls: BatchRPCCall[],
  opts: { continueOnError?: boolean } = {}
): Promise<BatchRPCResult> {
  const results: BatchRPCResult['results'] = [];
  const { continueOnError = false } = opts;

  for (let i = 0; i < calls.length; i++) {
    const { name, params, options } = calls[i];
    const res = await callRPC(name as any, params, options);
    results.push({ name, data: res.data, error: res.error });
    if (res.error && !continueOnError) {
      return { success: false, results, failed_at: i };
    }
  }
  return { success: true, results };
}

/* =============================================================================
   CONNECTION HEALTH CHECK
============================================================================= */

export async function checkConnection(mode: DbMode = 'service'): Promise<boolean> {
  try {
    const db = getDb(mode);
    const { error } = await db.from('core_organizations').select('id').limit(1);
    return !error;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Supabase] Connection check failed:', e);
    return false;
  }
}

/* =============================================================================
   EXPORT (server-only surface)
============================================================================= */

const Supabase = {
  getDb,
  serverSupabase,
  assertOrgScope,
  callRPC,
  callBatchRPC,
  checkConnection,
};

export default Supabase;