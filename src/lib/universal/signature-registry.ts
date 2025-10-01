// src/lib/universal/signature-registry.ts
// Signature Registry with tiny TTL cache and NO new tables.
// Sources (priority):
// 1) In-memory cache (TTL)
// 2) ENV JSON (FN_SIGNATURES_JSON)
// 3) File JSON (FN_SIGNATURES_FILE)
// 4) Existing core_entities + core_dynamic_data (single JSON field)
// 5) Static fallback

import { STATIC_FN_SIGNATURES, FnSignature } from './signature-static';
import { serverSupabase } from './supabase';
import fs from 'node:fs/promises';
import path from 'node:path';

type CacheEntry<T> = { value: T; expiresAt: number };
const cache = new Map<string, CacheEntry<FnSignature[] | FnSignature | null>>();

const TTL = Number(process.env.SIGNATURE_CACHE_TTL_MS ?? 300_000);
const SOURCE = (process.env.SIGNATURE_SOURCE ?? 'env,file,dynamic,static')
  .split(',')
  .map((s) => s.trim() as 'env' | 'file' | 'dynamic' | 'static');

const ENV_JSON = process.env.FN_SIGNATURES_JSON; // JSON string mapping fn -> signature(s)
const FILE_PATH = process.env.FN_SIGNATURES_FILE; // absolute or relative path to .json

// For dynamic (existing tables): we look up a single config entity and read a JSON field
const CFG_ORG_ID = process.env.SIGNATURE_CONFIG_ORG_ID ?? ''; // required for dynamic source
const CFG_SMART_CODE = process.env.SIGNATURE_CONFIG_SMART_CODE ?? 'HERA.UNIV.CONFIG.FNSIG.V1';
const CFG_ENTITY_CODE = process.env.SIGNATURE_CONFIG_ENTITY_CODE ?? ''; // either smart code or entity code
const CFG_FIELD = process.env.SIGNATURE_CONFIG_FIELD ?? 'function_signatures'; // field_name in core_dynamic_data

async function fromEnv(fn: string): Promise<FnSignature[] | FnSignature | null> {
  if (!ENV_JSON) return null;
  try {
    const obj = JSON.parse(ENV_JSON);
    return obj?.[fn] ?? null;
  } catch {
    return null;
  }
}

async function fromFile(fn: string): Promise<FnSignature[] | FnSignature | null> {
  if (!FILE_PATH) return null;
  try {
    const fp = path.isAbsolute(FILE_PATH) ? FILE_PATH : path.join(process.cwd(), FILE_PATH);
    const raw = await fs.readFile(fp, 'utf8');
    const obj = JSON.parse(raw);
    return obj?.[fn] ?? null;
  } catch {
    return null;
  }
}

// dynamic: uses core_entities + core_dynamic_data without creating any tables
async function fromDynamic(fn: string): Promise<FnSignature[] | FnSignature | null> {
  if (!CFG_ORG_ID) return null;

  const sb = serverSupabase();

  // 1) find config entity id
  const eqs: Record<string, any> = { organization_id: CFG_ORG_ID };
  if (CFG_ENTITY_CODE) eqs['entity_code'] = CFG_ENTITY_CODE;
  if (CFG_SMART_CODE) eqs['smart_code'] = CFG_SMART_CODE;

  const ent = await sb
    .from('core_entities')
    .select('id')
    .match(eqs)
    .limit(1)
    .maybeSingle();

  if (ent.error || !ent.data) return null;

  // 2) read JSON blob from core_dynamic_data
  const dd = await sb
    .from('core_dynamic_data')
    .select('field_value_json')
    .match({
      organization_id: CFG_ORG_ID,
      entity_id: ent.data.id,
      field_name: CFG_FIELD,
    })
    .limit(1)
    .maybeSingle();

  if (dd.error || !dd.data?.field_value_json) return null;

  const map = dd.data.field_value_json as Record<string, FnSignature | FnSignature[]>;
  return map?.[fn] ?? null;
}

function fromStatic(fn: string): FnSignature[] | FnSignature | null {
  return STATIC_FN_SIGNATURES[fn] ?? null;
}

export async function getFnSignatures(
  fn: string
): Promise<FnSignature[] | FnSignature | null> {
  // 1) cache
  const now = Date.now();
  const hit = cache.get(fn);
  if (hit && hit.expiresAt > now) return hit.value;

  // 2) sources in order
  let value: FnSignature[] | FnSignature | null = null;

  for (const src of SOURCE) {
    if (src === 'env') {
      value = (await fromEnv(fn)) ?? value;
    } else if (src === 'file' && value == null) {
      value = (await fromFile(fn)) ?? value;
    } else if (src === 'dynamic' && value == null) {
      value = (await fromDynamic(fn)) ?? value;
    } else if (src === 'static' && value == null) {
      value = fromStatic(fn);
    }
    if (value) break;
  }

  // 3) cache set (even null to avoid repeated misses for TTL)
  cache.set(fn, { value, expiresAt: now + TTL });
  return value;
}

export function invalidateSignature(fn: string) {
  cache.delete(fn);
}

export function invalidateAll() {
  cache.clear();
}