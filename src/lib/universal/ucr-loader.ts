// src/lib/universal/ucr-loader.ts
// UCR Bundle Loader - Loads and caches UCR bundles from core_dynamic_data

import { serverSupabase } from './supabase';
import { UCRBundle } from './ucr-types';
import { guardSmartCode, guardOrganization } from './guardrails';

// Cache for loaded bundles (org-scoped)
const bundleCache = new Map<string, { bundle: UCRBundle; loadedAt: Date }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key with org isolation
 */
function getCacheKey(smartCode: string, organizationId: string | null): string {
  return `${smartCode}:${organizationId || 'global'}`;
}

/**
 * Load UCR bundle for a Smart Code
 * @param smartCode - The Smart Code to load bundle for
 * @param organizationId - Organization ID for scoped bundles (null for global)
 * @param forceRefresh - Force reload from database
 */
export async function loadUCRBundle(
  smartCode: string,
  organizationId: string | null = null,
  forceRefresh = false
): Promise<UCRBundle | null> {
  // Validate inputs
  guardSmartCode(smartCode);
  if (organizationId) {
    guardOrganization(organizationId);
  }

  // Check cache
  const cacheKey = getCacheKey(smartCode, organizationId);
  if (!forceRefresh && bundleCache.has(cacheKey)) {
    const cached = bundleCache.get(cacheKey)!;
    const age = Date.now() - cached.loadedAt.getTime();
    if (age < CACHE_TTL) {
      return cached.bundle;
    }
  }

  const supabase = serverSupabase();

  // Try org-specific bundle first, then global
  const orgIds = organizationId ? [organizationId, null] : [null];
  
  for (const orgId of orgIds) {
    const query = supabase
      .from('core_dynamic_data')
      .select('field_value_json')
      .eq('field_name', 'ucr_rule')
      .eq('smart_code', smartCode)
      .eq('validation_status', 'valid')
      .single();

    if (orgId) {
      query.eq('organization_id', orgId);
    } else {
      query.is('organization_id', null);
    }

    const { data, error } = await query;

    if (!error && data?.field_value_json) {
      const bundle = data.field_value_json as UCRBundle;
      
      // Cache it
      bundleCache.set(cacheKey, {
        bundle,
        loadedAt: new Date()
      });

      return bundle;
    }
  }

  return null;
}

/**
 * Save UCR bundle to database
 * @param bundle - The UCR bundle to save
 * @param organizationId - Organization ID for scoped bundle (null for global)
 */
export async function saveUCRBundle(
  bundle: UCRBundle,
  organizationId: string | null = null
): Promise<{ success: boolean; error?: string }> {
  // Validate
  guardSmartCode(bundle.code);
  if (organizationId) {
    guardOrganization(organizationId);
  }

  const supabase = serverSupabase();

  // Generate unique entity ID for the dynamic data record
  const entityId = organizationId || 'global-ucr-registry';

  const { error } = await supabase.from('core_dynamic_data').upsert({
    organization_id: organizationId,
    entity_id: entityId,
    field_name: 'ucr_rule',
    field_type: 'json',
    smart_code: bundle.code,
    field_value_json: bundle,
    validation_status: 'valid',
    ai_enhanced_value: `${bundle.metadata.title} (${bundle.version})`
  });

  if (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }

  // Clear cache for this bundle
  const cacheKey = getCacheKey(bundle.code, organizationId);
  bundleCache.delete(cacheKey);

  return { success: true };
}

/**
 * List all available UCR bundles for an organization
 * @param organizationId - Organization ID (null for global bundles)
 */
export async function listUCRBundles(
  organizationId: string | null = null
): Promise<Array<{ smartCode: string; title: string; version: string }>> {
  const supabase = serverSupabase();

  const query = supabase
    .from('core_dynamic_data')
    .select('smart_code, field_value_json')
    .eq('field_name', 'ucr_rule')
    .eq('validation_status', 'valid');

  if (organizationId) {
    // Get both org-specific and global bundles
    query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
  } else {
    query.is('organization_id', null);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data
    .filter(row => row.field_value_json && row.smart_code)
    .map(row => {
      const bundle = row.field_value_json as UCRBundle;
      return {
        smartCode: row.smart_code!,
        title: bundle.metadata?.title || 'Untitled',
        version: bundle.version || 'v1'
      };
    });
}

/**
 * Clear bundle cache
 * @param smartCode - Optional Smart Code to clear specific bundle
 * @param organizationId - Optional org ID for specific cache entry
 */
export function clearBundleCache(
  smartCode?: string,
  organizationId?: string | null
): void {
  if (smartCode && organizationId !== undefined) {
    const cacheKey = getCacheKey(smartCode, organizationId);
    bundleCache.delete(cacheKey);
  } else if (smartCode) {
    // Clear all entries for this Smart Code
    const keysToDelete: string[] = [];
    for (const key of bundleCache.keys()) {
      if (key.startsWith(smartCode + ':')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => bundleCache.delete(key));
  } else {
    // Clear entire cache
    bundleCache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ key: string; age: number }>;
} {
  const entries: Array<{ key: string; age: number }> = [];
  const now = Date.now();

  for (const [key, value] of bundleCache.entries()) {
    entries.push({
      key,
      age: now - value.loadedAt.getTime()
    });
  }

  return {
    size: bundleCache.size,
    entries
  };
}