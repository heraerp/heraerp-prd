// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function (Deno) — API v2 Gateway
// Flow: JWT → resolve_user_identity_v1 → org context → membership → guardrails → RPC → DB
// HERA invariants: No client-side RPC; actor stamped in RPC; org RLS; guardrails enforced.

import { serve } from "https://deno.land/std@0.202.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Optional Upstash/Redis – wire later in Phase 2
const SMARTCODE_REGEX =
  /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;

type GuardrailCtx = {
  orgId: string;
  actorUserEntityId: string;
  smartCode?: string;
};

// ---------- Utilities ----------
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getBearer(req: Request) {
  const raw = req.headers.get("Authorization") || "";
  return raw.startsWith("Bearer ") ? raw.slice(7) : "";
}

function requestId() {
  // very light RID for tracing; wire to OTEL in Phase 5
  return crypto.randomUUID();
}

// ---------- Org & Actor resolution ----------
async function resolveActorAndOrg(
  supabaseAdmin: ReturnType<typeof createClient>,
  req: Request,
) {
  const rid = requestId();

  // 1) JWT validation (Supabase)
  const token = getBearer(req);
  if (!token) return { error: json(401, { error: "invalid_token", rid }) };

  // Use supabase-js with service role to verify + access
  const { data: user, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user?.user) return { error: json(401, { error: "invalid_token", rid }) };

  // 2) Resolve identity → USER entity id via server-side function
  //    (server function maps auth UID → USER entity, memberships, etc.)
  //    Contract documented in Authorization flow.
  const { data: identity, error: idErr } = await supabaseAdmin
    .rpc("resolve_user_identity_v1", { p_auth_uid: user.user.id });
  if (idErr || !identity?.user_entity_id) {
    return { error: json(401, { error: "identity_not_resolved", rid }) };
  }

  // 3) Resolve org context (Header > JWT custom claim > default membership)
  const headerOrg = req.headers.get("X-Organization-Id");
  const claimOrg = (user.user.app_metadata as any)?.org_id as string | undefined;
  const membershipDefault = identity?.memberships?.[0]?.organization_id as string | undefined;

  const orgId = headerOrg || claimOrg || membershipDefault;
  if (!orgId) return { error: json(400, { error: "no_organization_context", rid }) };

  // 4) Membership check (defense-in-depth also happens in RPC).
  const isMember = identity.memberships?.some((m: any) =>
    m.organization_id === orgId && (m.is_active ?? true)
  );
  if (!isMember) return { error: json(403, { error: "actor_not_member", rid }) };

  return {
    ok: {
      rid,
      orgId,
      actorUserEntityId: identity.user_entity_id as string,
      user,
    },
  };
}

// ---------- Guardrails (v2.0 minimal runtime for Phase 1) ----------
function validateSmartCodePresenceAndPattern(smartCode?: string) {
  if (!smartCode) return { ok: false, reason: "SMARTCODE_MISSING" };
  if (!SMARTCODE_REGEX.test(smartCode)) {
    return { ok: false, reason: "SMARTCODE_REGEX_FAIL" };
  }
  return { ok: true };
}

function ensureOrgInPayload(payload: any, orgId: string) {
  // Ensure organization_id is present and matches resolved orgId.
  if (!payload?.organization_id) return { ok: false, reason: "ORG_FILTER_MISSING" };
  if (payload.organization_id !== orgId) return { ok: false, reason: "ORG_FILTER_MISMATCH" };
  return { ok: true };
}

function isGLSmartCode(code: string) {
  return code.includes(".GL.");
}

function validateGLBalance(lines: Array<any>) {
  // Per-currency balance rule is enforced at DB, but we preflight here too.
  const totals = new Map<string, { dr: number; cr: number }>();
  for (const line of lines ?? []) {
    const sc = line.smart_code as string;
    if (!sc || !isGLSmartCode(sc)) continue;
    const side = line?.line_data?.side;
    const amt = Number(line?.line_amount ?? 0);
    const currency = (line?.transaction_currency_code ||
      line?.currency ||
      "DOC") as string;

    if (!["DR", "CR"].includes(side)) {
      return { ok: false, reason: "GL_SIDE_REQUIRED" };
    }
    if (amt < 0) return { ok: false, reason: "NEGATIVE_GL_AMOUNT" };

    const t = totals.get(currency) ?? { dr: 0, cr: 0 };
    if (side === "DR") t.dr += amt;
    else t.cr += amt;
    totals.set(currency, t);
  }
  for (const [, t] of totals) {
    const diff = Math.abs((t.dr ?? 0) - (t.cr ?? 0));
    if (diff > 0.01) return { ok: false, reason: "GL_NOT_BALANCED" };
  }
  return { ok: true };
}

function validatePayloadAgainstGuardrails(
  ctx: GuardrailCtx,
  body: any,
) {
  // Header-style payloads (universal_transactions) or entity payloads
  // Smart Code rule applies broadly across entities/UT/UTL.
  if (body?.smart_code) {
    const sc = validateSmartCodePresenceAndPattern(body.smart_code);
    if (!sc.ok) return sc;
  }
  // Org filter
  const org = ensureOrgInPayload(body, ctx.orgId);
  if (!org.ok) return org;
  // GL balance (if UT lines present)
  if (Array.isArray(body?.lines)) {
    const gl = validateGLBalance(body.lines);
    if (!gl.ok) return gl;
  }
  return { ok: true };
}

// ---------- RPC dispatch ----------
async function callEntitiesCRUD(
  supabaseAdmin: ReturnType<typeof createClient>,
  ctx: GuardrailCtx,
  body: any,
) {
  // hera_entities_crud_v1 enforces actor stamping, org RLS & guardrails at DB.
  return await supabaseAdmin.rpc("hera_entities_crud_v1", {
    p_action: body.operation || 'CREATE',
    p_actor_user_id: ctx.actorUserEntityId,
    p_organization_id: ctx.orgId,
    p_entity: body.entity_data || {},
    p_dynamic: body.dynamic_fields || {},
    p_relationships: body.relationships || [],
    p_options: body.options || {}
  });
}

async function callTransactionsPost(
  supabaseAdmin: ReturnType<typeof createClient>,
  ctx: GuardrailCtx,
  body: any,
) {
  // hera_txn_crud_v1: unified finance write path.
  return await supabaseAdmin.rpc("hera_txn_crud_v1", {
    p_action: body.operation || 'CREATE',
    p_actor_user_id: ctx.actorUserEntityId,
    p_organization_id: ctx.orgId,
    p_transaction: body.transaction_data || {},
    p_lines: body.lines || [],
    p_options: body.options || {}
  });
}

// ---------- Router ----------
async function handle(req: Request) {
  const url = new URL(req.url);
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  const method = req.method.toUpperCase();
  if (!["POST"].includes(method)) {
    return json(405, { error: "method_not_allowed" });
  }

  // Auth / Identity / Org
  const res = await resolveActorAndOrg(supabaseAdmin, req);
  if ("error" in res) return res.error;
  const { ok } = res;
  const rid = ok.rid;

  // Parse body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json", rid });
  }

  // Guardrails (preflight)
  const baseCtx: GuardrailCtx = {
    orgId: ok.orgId,
    actorUserEntityId: ok.actorUserEntityId,
    smartCode: body?.smart_code,
  };
  const gr = validatePayloadAgainstGuardrails(baseCtx, body);
  if (!gr.ok) return json(400, { error: `guardrail_violation:${gr.reason}`, rid });

  // Idempotency / Rate limiting hooks will be added in Phase 2
  // Route
  try {
    if (url.pathname.endsWith("/api/v2/entities")) {
      const { data, error } = await callEntitiesCRUD(supabaseAdmin, baseCtx, body);
      if (error) return json(400, { error: error.message, rid });
      return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
    }

    if (url.pathname.endsWith("/api/v2/transactions")) {
      const { data, error } = await callTransactionsPost(supabaseAdmin, baseCtx, body);
      if (error) return json(400, { error: error.message, rid });
      return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
    }

    // Optional generic route if you want a single command endpoint
    if (url.pathname.endsWith("/api/v2/command")) {
      const op = body?.op as "entities" | "transactions";
      if (op === "entities") {
        const { data, error } = await callEntitiesCRUD(supabaseAdmin, baseCtx, body);
        if (error) return json(400, { error: error.message, rid });
        return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
      }
      if (op === "transactions") {
        const { data, error } = await callTransactionsPost(supabaseAdmin, baseCtx, body);
        if (error) return json(400, { error: error.message, rid });
        return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
      }
      return json(400, { error: "unknown_command", rid });
    }

    return json(404, { error: "not_found", rid });
  } catch (e) {
    return json(500, { error: "internal_error", rid, detail: String(e) });
  }
}

serve(handle);