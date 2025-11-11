// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function (Deno) — API v2 Gateway
// Flow: JWT → resolve_user_identity_v1 → org context → membership → guardrails → RPC → DB
// HERA invariants: No client-side RPC; actor stamped in RPC; org RLS; guardrails enforced.

import { serve } from "https://deno.land/std@0.202.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRedisClient } from './redis-client.ts';
import { getRateLimiter } from './rate-limiter.ts';
import { getIdempotencyHandler } from './idempotency.ts';
import { HERAEnhancedLogger, createHERALogger, withHERALogging } from './enhanced-logger.ts';
import { heraMetrics, apiMetrics, getMetricsHealthCheck } from './otel-metrics.ts';

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

// ---------- Org & Actor resolution with Redis caching ----------
async function resolveActorAndOrg(
  supabaseAdmin: ReturnType<typeof createClient>,
  req: Request,
  logger: HERAEnhancedLogger,
) {
  const rid = requestId();
  const redis = getRedisClient();
  
  logger.actorTrace('actor_resolution_started');
  const resolutionStartTime = Date.now();

  // 1) JWT validation (Supabase)
  const token = getBearer(req);
  if (!token) {
    heraMetrics.recordAuthFailure('missing_token');
    return { error: json(401, { error: "invalid_token", rid }) };
  }

  // Use supabase-js with service role to verify + access
  const { data: user, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user?.user) {
    heraMetrics.recordAuthFailure('invalid_jwt');
    return { error: json(401, { error: "invalid_token", rid }) };
  }

  // 2) Resolve identity with Redis caching
  let identity: any = null;
  
  // Try Redis cache first
  if (redis) {
    try {
      identity = await redis.getActorIdentity(user.user.id);
      if (identity) {
        logger.cacheEvent('hit', `actor_identity:${user.user.id.slice(0, 8)}`);
        logger.actorTrace('identity_cache_hit', identity.user_entity_id);
        heraMetrics.recordCacheEvent('hit', `actor_identity:${user.user.id.slice(0, 8)}`);
      }
    } catch (error) {
      logger.cacheEvent('miss', `actor_identity:${user.user.id.slice(0, 8)}`);
      logger.warn('Redis cache lookup failed', { error: error.message });
      heraMetrics.recordCacheEvent('miss', `actor_identity:${user.user.id.slice(0, 8)}`);
    }
  }

  // Cache miss - resolve from database
  if (!identity) {
    logger.actorTrace('identity_database_lookup', undefined, { authUid: user.user.id.slice(0, 8) });
    const startTime = Date.now();
    
    const { data: dbIdentity, error: idErr } = await supabaseAdmin
      .rpc("resolve_user_identity_v1", { p_auth_uid: user.user.id });
    
    const duration = Date.now() - startTime;
    logger.performance({
      operation: 'resolve_user_identity_v1',
      duration,
      requestId: rid,
      status: idErr ? 'error' : 'success'
    });
    
    heraMetrics.recordDbQuery('resolve_user_identity_v1', duration, !idErr);
    
    if (idErr || !dbIdentity?.user_entity_id) {
      logger.error('Actor identity resolution failed', idErr as Error, { 
        authUid: user.user.id.slice(0, 8) 
      });
      heraMetrics.recordAuthFailure('identity_not_resolved');
      return { error: json(401, { error: "identity_not_resolved", rid }) };
    }
    
    identity = dbIdentity;
    logger.actorTrace('identity_resolved', identity.user_entity_id);
    
    // Cache the result for future requests
    if (redis) {
      try {
        await redis.cacheActorIdentity(user.user.id, identity, { ttl: 300, prefix: 'actor_identity' });
        logger.cacheEvent('set', `actor_identity:${user.user.id.slice(0, 8)}`, 300);
        heraMetrics.recordCacheEvent('set', `actor_identity:${user.user.id.slice(0, 8)}`);
      } catch (error) {
        logger.warn('Failed to cache actor identity', { error: error.message });
      }
    }
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
  
  logger.actorTrace('membership_validation', identity.user_entity_id, {
    orgId,
    isMember,
    memberships: identity.memberships?.length || 0
  });
  
  if (!isMember) {
    logger.audit({
      eventType: 'security_violation',
      actorId: identity.user_entity_id,
      organizationId: orgId,
      metadata: {
        violationType: 'membership_denied',
        availableMemberships: identity.memberships?.map((m: any) => m.organization_id) || []
      },
      severity: 'warn'
    });
    heraMetrics.recordSecurityViolation('membership_denied', 'warn', identity.user_entity_id);
    return { error: json(403, { error: "actor_not_member", rid }) };
  }

  const resolutionDuration = Date.now() - resolutionStartTime;
  heraMetrics.recordActorResolution(resolutionDuration, !!identity.cache_hit, identity.user_entity_id);
  
  logger.actorTrace('actor_resolution_complete', identity.user_entity_id, { orgId });
  
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
function validateSmartCodePresenceAndPattern(smartCode?: string, logger?: HERAEnhancedLogger) {
  const isValid = !!(smartCode && SMARTCODE_REGEX.test(smartCode));
  
  if (logger) {
    logger.smartCodeValidation(
      smartCode || 'undefined', 
      isValid, 
      SMARTCODE_REGEX.toString()
    );
  }
  
  if (smartCode) {
    heraMetrics.recordSmartCodeValidation(smartCode, isValid);
  }
  
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

function validateGLBalance(lines: Array<any>, logger?: HERAEnhancedLogger, transactionId?: string) {
  // Per-currency balance rule is enforced at DB, but we preflight here too.
  const totals = new Map<string, { dr: number; cr: number }>();
  const glEntries: any[] = [];
  
  for (const line of lines ?? []) {
    const sc = line.smart_code as string;
    if (!sc || !isGLSmartCode(sc)) continue;
    
    const side = line?.line_data?.side;
    const amt = Number(line?.line_amount ?? 0);
    const currency = (line?.transaction_currency_code ||
      line?.currency ||
      "DOC") as string;

    glEntries.push({ smartCode: sc, side, amount: amt, currency });

    if (!["DR", "CR"].includes(side)) {
      return { ok: false, reason: "GL_SIDE_REQUIRED" };
    }
    if (amt < 0) return { ok: false, reason: "NEGATIVE_GL_AMOUNT" };

    const t = totals.get(currency) ?? { dr: 0, cr: 0 };
    if (side === "DR") t.dr += amt;
    else t.cr += amt;
    totals.set(currency, t);
  }
  
  // Check balance per currency
  let isBalanced = true;
  for (const [currency, t] of totals) {
    const diff = Math.abs((t.dr ?? 0) - (t.cr ?? 0));
    if (diff > 0.01) {
      isBalanced = false;
      
      // Log GL audit trail for unbalanced entries
      if (logger && transactionId) {
        logger.glAudit(transactionId, {
          currency,
          debitTotal: t.dr,
          creditTotal: t.cr,
          isBalanced: false,
          entries: glEntries.filter(e => e.currency === currency)
        });
      }
      
      heraMetrics.recordGLValidation(currency, false, glEntries.filter(e => e.currency === currency).length);
      return { ok: false, reason: "GL_NOT_BALANCED" };
    }
  }
  
  // Log successful GL validation
  if (logger && transactionId && isBalanced && glEntries.length > 0) {
    for (const [currency, t] of totals) {
      logger.glAudit(transactionId, {
        currency,
        debitTotal: t.dr,
        creditTotal: t.cr,
        isBalanced: true,
        entries: glEntries.filter(e => e.currency === currency)
      });
      
      heraMetrics.recordGLValidation(currency, true, glEntries.filter(e => e.currency === currency).length);
    }
  }
  
  return { ok: true };
}

function validatePayloadAgainstGuardrails(
  ctx: GuardrailCtx,
  body: any,
  logger?: HERAEnhancedLogger,
  transactionId?: string,
) {
  // Header-style payloads (universal_transactions) or entity payloads
  // Smart Code rule applies broadly across entities/UT/UTL.
  if (body?.smart_code) {
    const sc = validateSmartCodePresenceAndPattern(body.smart_code, logger);
    if (!sc.ok) return sc;
  }
  
  // Org filter
  const org = ensureOrgInPayload(body, ctx.orgId);
  if (!org.ok) {
    if (logger) {
      logger.audit({
        eventType: 'security_violation',
        actorId: ctx.actorUserEntityId,
        organizationId: ctx.orgId,
        metadata: {
          violationType: 'organization_filter_violation',
          expectedOrg: ctx.orgId,
          providedOrg: body?.organization_id,
          reason: org.reason
        },
        severity: 'critical'
      });
    }
    return org;
  }
  
  // GL balance (if UT lines present)
  if (Array.isArray(body?.lines)) {
    const gl = validateGLBalance(body.lines, logger, transactionId);
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

// ---------- Micro-Apps RPC dispatch ----------
async function callMicroAppCatalog(
  supabaseAdmin: ReturnType<typeof createClient>,
  ctx: GuardrailCtx,
  body: any,
) {
  // hera_microapp_catalog_v2: catalog management (platform org only)
  return await supabaseAdmin.rpc("hera_microapp_catalog_v2", {
    p_actor_user_id: ctx.actorUserEntityId,
    p_organization_id: ctx.orgId,
    p_operation: body.operation || 'LIST',
    p_app_definition: body.app_definition || null,
    p_filters: body.filters || null,
    p_options: body.options || {}
  });
}

async function callMicroAppInstall(
  supabaseAdmin: ReturnType<typeof createClient>,
  ctx: GuardrailCtx,
  body: any,
) {
  // hera_microapp_install_v2: installation management
  return await supabaseAdmin.rpc("hera_microapp_install_v2", {
    p_actor_user_id: ctx.actorUserEntityId,
    p_organization_id: ctx.orgId,
    p_operation: body.operation || 'LIST',
    p_app_code: body.app_code || null,
    p_app_version: body.app_version || null,
    p_installation_config: body.installation_config || {},
    p_filters: body.filters || null,
    p_options: body.options || {}
  });
}

async function callMicroAppDependencies(
  supabaseAdmin: ReturnType<typeof createClient>,
  ctx: GuardrailCtx,
  body: any,
) {
  // hera_microapp_dependencies_v2: dependency resolution and validation
  return await supabaseAdmin.rpc("hera_microapp_dependencies_v2", {
    p_actor_user_id: ctx.actorUserEntityId,
    p_organization_id: ctx.orgId,
    p_app_code: body.app_code,
    p_version: body.app_version,
    p_operation: body.operation || 'VALIDATE'
  });
}

async function callMicroAppRuntime(
  supabaseAdmin: ReturnType<typeof createClient>,
  ctx: GuardrailCtx,
  body: any,
) {
  // hera_microapp_runtime_v2: runtime execution engine
  return await supabaseAdmin.rpc("hera_microapp_runtime_v2", {
    p_actor_user_id: ctx.actorUserEntityId,
    p_organization_id: ctx.orgId,
    p_operation: body.operation || 'EXECUTE',
    p_app_code: body.app_code || null,
    p_runtime_context: body.runtime_context || {},
    p_execution_payload: body.execution_payload || {},
    p_options: body.options || {}
  });
}

async function callMicroAppWorkflow(
  supabaseAdmin: ReturnType<typeof createClient>,
  ctx: GuardrailCtx,
  body: any,
) {
  // hera_microapp_workflow_v2: workflow execution engine
  return await supabaseAdmin.rpc("hera_microapp_workflow_v2", {
    p_actor_user_id: ctx.actorUserEntityId,
    p_organization_id: ctx.orgId,
    p_operation: body.operation || 'EXECUTE',
    p_app_code: body.app_code || null,
    p_workflow_id: body.workflow_id || null,
    p_workflow_payload: body.workflow_payload || {},
    p_options: body.options || {}
  });
}

// ---------- Router ----------
async function handle(req: Request) {
  return withHERALogging(async (logger: HERAEnhancedLogger) => {
    const url = new URL(req.url);
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    logger.info('API v2 request started', {
      method: req.method,
      pathname: url.pathname,
      userAgent: req.headers.get('user-agent')
    });

  // Health check endpoint (no auth required)
  if (url.pathname.endsWith("/api/v2/health")) {
    const rid = requestId();
    
    // Check all performance infrastructure components
    const redis = getRedisClient();
    const rateLimiter = getRateLimiter();
    const idempotencyHandler = getIdempotencyHandler();
    
    const [redisHealth, rateLimitHealth, idempotencyHealth] = await Promise.all([
      redis ? redis.healthCheck() : Promise.resolve({ status: 'unhealthy', error: 'Redis not configured' }),
      rateLimiter.healthCheck(),
      idempotencyHandler.healthCheck()
    ]);

    const overallStatus = 
      redisHealth.status === 'healthy' && 
      rateLimitHealth.status === 'healthy' && 
      idempotencyHealth.status === 'healthy' ? 'healthy' : 
      redisHealth.status === 'unhealthy' || 
      rateLimitHealth.status === 'unhealthy' || 
      idempotencyHealth.status === 'unhealthy' ? 'degraded' : 'unhealthy';

    return json(200, {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: "2.3.0", // Week 2 version
      components: {
        api_gateway: "healthy",
        redis: redisHealth.status,
        rate_limiter: rateLimitHealth.status,
        idempotency: idempotencyHealth.status,
        guardrails: "healthy"
      },
      performance: {
        redis_latency_ms: redisHealth.latency,
        caching_enabled: redis !== null,
        rate_limiting_enabled: true,
        idempotency_enabled: true
      },
      redis_details: redisHealth,
      rate_limit_details: rateLimitHealth,
      idempotency_details: idempotencyHealth,
      rid
    });
  }

  // Metrics endpoint (no auth required for monitoring)
  if (url.pathname.endsWith("/api/v2/metrics")) {
    const rid = requestId();
    const metricsHealth = getMetricsHealthCheck();
    
    return json(200, {
      ...metricsHealth,
      rid,
      timestamp: new Date().toISOString()
    });
  }

  const method = req.method.toUpperCase();
  if (!["POST", "GET"].includes(method)) {
    return json(405, { error: "method_not_allowed" });
  }

  // Auth / Identity / Org
  const res = await resolveActorAndOrg(supabaseAdmin, req, logger);
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

  // Rate Limiting (Week 2)
  const rateLimiter = getRateLimiter();
  const endpoint = url.pathname.split('/').pop() || 'unknown';
  const rateLimitCheck = await rateLimiter.createMiddleware()(
    req,
    ok.actorUserEntityId,
    ok.orgId,
    undefined, // userRole - could extract from identity
    endpoint
  );

  if (!rateLimitCheck.allowed) {
    console.log(`🚫 Rate limit exceeded for actor ${ok.actorUserEntityId.slice(0, 8)} on ${endpoint}`);
    return rateLimitCheck.response!;
  }

  // Idempotency Check (Week 2)
  const idempotencyHandler = getIdempotencyHandler();
  const idempotencyCheck = await idempotencyHandler.createMiddleware()(
    req,
    ok.actorUserEntityId,
    ok.orgId,
    body
  );

  if (idempotencyCheck.isDuplicate) {
    console.log(`🔄 Returning cached response for duplicate request`);
    return idempotencyCheck.response!;
  }

  // Helper function to add headers and store idempotency response
  const addHeadersAndStore = (response: Response, responseBody: any) => {
    // Add rate limit headers
    Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Store for idempotency if successful
    if (response.status >= 200 && response.status < 300 && idempotencyCheck.storeResponse) {
      idempotencyCheck.storeResponse({
        status: response.status,
        body: responseBody,
        headers: Object.fromEntries(response.headers.entries())
      }).catch(error => {
        console.warn('⚠️ Failed to store idempotency response:', error);
      });
    }

    return response;
  };

  // Route
  try {
    if (url.pathname.endsWith("/api/v2/entities")) {
      const { data, error } = await callEntitiesCRUD(supabaseAdmin, baseCtx, body);
      if (error) return json(400, { error: error.message, rid });
      const responseBody = { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId };
      return addHeadersAndStore(json(200, responseBody), responseBody);
    }

    if (url.pathname.endsWith("/api/v2/transactions")) {
      const { data, error } = await callTransactionsPost(supabaseAdmin, baseCtx, body);
      if (error) return json(400, { error: error.message, rid });
      const responseBody = { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId };
      return addHeadersAndStore(json(200, responseBody), responseBody);
    }

    // Micro-Apps Catalog endpoint (platform org only)
    if (url.pathname.endsWith("/api/v2/micro-apps/catalog")) {
      const { data, error } = await callMicroAppCatalog(supabaseAdmin, baseCtx, body);
      if (error) return json(400, { error: error.message, rid });
      return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
    }

    // Micro-Apps Installation endpoint
    if (url.pathname.endsWith("/api/v2/micro-apps/install")) {
      const { data, error } = await callMicroAppInstall(supabaseAdmin, baseCtx, body);
      if (error) return json(400, { error: error.message, rid });
      return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
    }

    // Micro-Apps Dependencies endpoint
    if (url.pathname.endsWith("/api/v2/micro-apps/dependencies")) {
      const { data, error } = await callMicroAppDependencies(supabaseAdmin, baseCtx, body);
      if (error) return json(400, { error: error.message, rid });
      return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
    }

    // Micro-Apps Runtime endpoint
    if (url.pathname.endsWith("/api/v2/micro-apps/runtime")) {
      const { data, error } = await callMicroAppRuntime(supabaseAdmin, baseCtx, body);
      if (error) return json(400, { error: error.message, rid });
      return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
    }

    // Micro-Apps Workflow endpoint
    if (url.pathname.endsWith("/api/v2/micro-apps/workflow")) {
      const { data, error } = await callMicroAppWorkflow(supabaseAdmin, baseCtx, body);
      if (error) return json(400, { error: error.message, rid });
      return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
    }

    // Optional generic route if you want a single command endpoint
    if (url.pathname.endsWith("/api/v2/command")) {
      const op = body?.op as "entities" | "transactions" | "micro-apps";
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
      if (op === "micro-apps") {
        const subOp = body?.sub_op as "catalog" | "install" | "dependencies" | "runtime" | "workflow";
        if (subOp === "catalog") {
          const { data, error } = await callMicroAppCatalog(supabaseAdmin, baseCtx, body);
          if (error) return json(400, { error: error.message, rid });
          return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
        }
        if (subOp === "install") {
          const { data, error } = await callMicroAppInstall(supabaseAdmin, baseCtx, body);
          if (error) return json(400, { error: error.message, rid });
          return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
        }
        if (subOp === "dependencies") {
          const { data, error } = await callMicroAppDependencies(supabaseAdmin, baseCtx, body);
          if (error) return json(400, { error: error.message, rid });
          return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
        }
        if (subOp === "runtime") {
          const { data, error } = await callMicroAppRuntime(supabaseAdmin, baseCtx, body);
          if (error) return json(400, { error: error.message, rid });
          return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
        }
        if (subOp === "workflow") {
          const { data, error } = await callMicroAppWorkflow(supabaseAdmin, baseCtx, body);
          if (error) return json(400, { error: error.message, rid });
          return json(200, { rid, data, actor: baseCtx.actorUserEntityId, org: baseCtx.orgId });
        }
        return json(400, { error: "unknown_micro_app_command", rid });
      }
      return json(400, { error: "unknown_command", rid });
    }

    return json(404, { error: "not_found", rid });
  } catch (e) {
    logger.error('API v2 request failed', e as Error, { 
      url: req.url, 
      method: req.method 
    });
    return json(500, { error: "internal_error", rid, detail: String(e) });
  }
  })(req);
}

serve(handle);