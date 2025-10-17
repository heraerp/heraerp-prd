// Minimal RPC client for HERA v2.2 unified write paths & reads
// Server-only usage inside route handlers

type RpcOk<T> = { ok: true; data: T };
type RpcErr = { ok: false; error: { code: string; message: string; details?: unknown } };
export type RpcResult<T> = RpcOk<T> | RpcErr;

type RpcCall = {
  // e.g. "hera_entities_crud_v2" | "hera_transactions_post_v2" | "barcode_search_v1"
  procedure: string;
  // payload is the DB function/handler input (must include organization_id on multi-tenant data)
  payload: Record<string, unknown>;
  // pass explicit org if you don't rely on resolver
  organizationId?: string;
  // optional idempotency for writes
  idemKey?: string;
};

export async function rpc<T = unknown>({ procedure, payload, organizationId, idemKey }: RpcCall): Promise<RpcResult<T>> {
  const url = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v2/command`
    : `/api/v2/command`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(organizationId ? { "x-organization-id": organizationId } : {}),
      ...(idemKey ? { "x-idempotency-key": idemKey } : {})
    },
    body: JSON.stringify({
      procedure,
      payload
    }),
    // Important for server runtime
    cache: "no-store"
  });

  if (!res.ok) {
    let msg = `RPC ${procedure} failed with ${res.status}`;
    try {
      const err = await res.json();
      msg = err?.error?.message ?? msg;
      return { ok: false, error: { code: String(res.status), message: msg, details: err } };
    } catch {
      return { ok: false, error: { code: String(res.status), message: msg } };
    }
  }

  const data = (await res.json()) as T;
  return { ok: true, data };
}

/**
 * Simplified callRPC function compatible with existing HERA code
 * Wraps the RPC response in a consistent format
 */
export async function callRPC(
  functionName: string,
  params: Record<string, any> = {}
): Promise<{ data?: any; error?: string; success: boolean }> {
  try {
    // Use direct Supabase RPC call for compatibility with existing patterns
    const { getSupabase } = await import('@/lib/supabase');
    const supabase = getSupabase();

    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
      console.error(`RPC call failed for ${functionName}:`, error);
      return {
        success: false,
        error: error.message || 'RPC call failed'
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error(`RPC client error for ${functionName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown RPC error'
    };
  }
}