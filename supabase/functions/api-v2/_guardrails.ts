// deno-lint-ignore-file no-explicit-any
// Guardrails v2.0 - Modular validation functions for HERA API v2
// Smart Code validation, org filtering, GL balance enforcement

export const SMARTCODE_REGEX =
  /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;

export function validateSmartCodePresenceAndPattern(smartCode?: string) {
  if (!smartCode) return { ok: false, reason: "SMARTCODE_MISSING" };
  if (!SMARTCODE_REGEX.test(smartCode)) {
    return { ok: false, reason: "SMARTCODE_REGEX_FAIL" };
  }
  return { ok: true };
}

export function ensureOrgInPayload(payload: any, orgId: string) {
  // Ensure organization_id is present and matches resolved orgId
  if (!payload?.organization_id) return { ok: false, reason: "ORG_FILTER_MISSING" };
  if (payload.organization_id !== orgId) return { ok: false, reason: "ORG_FILTER_MISMATCH" };
  return { ok: true };
}

export function isGLSmartCode(code: string) {
  return code.includes(".GL.");
}

export function validateGLBalance(lines: Array<any>) {
  // Per-currency balance rule - enforce DR = CR for each currency
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
  
  // Check balance for each currency
  for (const [currency, t] of totals) {
    const diff = Math.abs((t.dr ?? 0) - (t.cr ?? 0));
    if (diff > 0.01) {
      return { 
        ok: false, 
        reason: "GL_NOT_BALANCED",
        details: { currency, dr: t.dr, cr: t.cr, diff }
      };
    }
  }
  
  return { ok: true };
}

export type GuardrailCtx = {
  orgId: string;
  actorUserEntityId: string;
  smartCode?: string;
};

export function validatePayloadAgainstGuardrails(
  ctx: GuardrailCtx,
  body: any,
) {
  // Smart Code validation
  if (body?.smart_code) {
    const sc = validateSmartCodePresenceAndPattern(body.smart_code);
    if (!sc.ok) return sc;
  }
  
  // Organization filter
  const org = ensureOrgInPayload(body, ctx.orgId);
  if (!org.ok) return org;
  
  // GL balance validation (if transaction lines present)
  if (Array.isArray(body?.lines)) {
    const gl = validateGLBalance(body.lines);
    if (!gl.ok) return gl;
  }
  
  return { ok: true };
}