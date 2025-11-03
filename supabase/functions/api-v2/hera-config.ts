/**
 * HERA Config for Edge Function
 * Re-exports the main HERA configuration for Deno environment
 */

// Note: In Deno Edge Functions, we can't directly import from /lib
// So we'll replicate the essential config here for now
// Future: This could be replaced with a proper import once Deno supports it

export const HERA_CONFIG = {
  // Runtime Version Control (v1 production, v2 future)
  RPC_VERSION: 'v1' as const,
  ENTITIES_RPC: 'hera_entities_crud_v1' as const,
  TRANSACTIONS_RPC: 'hera_txn_crud_v1' as const,
  
  // Guardrails Configuration
  GUARDRAILS: {
    VERSION: '2.0.0',
    MODE: 'warn' as const // 'warn' | 'enforce'
  },
  
  // API Configuration
  API_VERSION: 'v2' as const,
  
  // Cache and Performance
  IDEMPOTENCY_TTL_SEC: 24 * 60 * 60, // 24 hours
  ACTOR_CACHE_TTL_SEC: 5 * 60,       // 5 minutes
  
  // Environment Detection
  ENVIRONMENT: {
    DEVELOPMENT: 'qqagokigwuujyeyrgdkq',  // HERA-DEV Supabase project
    PRODUCTION: 'awfcrncxngqwbhqapffb'    // HERA production Supabase project
  },
  
  // Security Settings
  SECURITY: {
    PLATFORM_ORG_ID: '00000000-0000-0000-0000-000000000000',
    JWT_VERIFICATION: true,
    RATE_LIMITING: {
      READ: 300,   // per minute
      WRITE: 60,   // per minute  
      FINANCE: 30  // per minute
    }
  },
  
  // Smart Code Configuration
  SMART_CODE: {
    REGEX: /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/,
    REQUIRED: true,
    VALIDATION_LEVEL: 'strict' as const // 'strict' | 'lenient'
  },
  
  // Logging and Observability
  LOGGING: {
    STRUCTURED: true,
    REQUEST_ID_HEADER: 'X-Request-ID',
    PERFORMANCE_TRACKING: true
  }
} as const;

// Type definitions
export type HeraConfig = typeof HERA_CONFIG;

/**
 * RPC Function Getters - Abstracts v1/v2 switching
 */
export const getEntityRpc = (): string => HERA_CONFIG.ENTITIES_RPC;
export const getTxnRpc = (): string => HERA_CONFIG.TRANSACTIONS_RPC;

/**
 * Runtime Mode Checkers
 */
export const isGuardrailsEnforced = (): boolean => 
  HERA_CONFIG.GUARDRAILS.MODE === 'enforce';

export const isV1Runtime = (): boolean => 
  HERA_CONFIG.RPC_VERSION === 'v1';

export const isV2Runtime = (): boolean => 
  HERA_CONFIG.RPC_VERSION === 'v2';

export const isProductionEnvironment = (): boolean => {
  const projectRef = Deno?.env?.get('SUPABASE_PROJECT_REF');
  return projectRef === HERA_CONFIG.ENVIRONMENT.PRODUCTION;
};

/**
 * Security Configuration Getters
 */
export const getPlatformOrgId = (): string => 
  HERA_CONFIG.SECURITY.PLATFORM_ORG_ID;

export const getSmartCodeRegex = (): RegExp => 
  HERA_CONFIG.SMART_CODE.REGEX;

export const getRateLimits = () => HERA_CONFIG.SECURITY.RATE_LIMITING;

/**
 * Cache TTL Getters
 */
export const getIdempotencyTTL = (): number => 
  HERA_CONFIG.IDEMPOTENCY_TTL_SEC;

export const getActorCacheTTL = (): number => 
  HERA_CONFIG.ACTOR_CACHE_TTL_SEC;

/**
 * Configuration Summary for Health Checks
 */
export const getConfigurationSummary = () => ({
  runtime: {
    rpc_version: HERA_CONFIG.RPC_VERSION,
    api_version: HERA_CONFIG.API_VERSION,
    guardrails_mode: HERA_CONFIG.GUARDRAILS.MODE,
    environment: isProductionEnvironment() ? 'production' : 'development'
  },
  entities_rpc: getEntityRpc(),
  transactions_rpc: getTxnRpc(),
  security: {
    smart_codes_required: HERA_CONFIG.SMART_CODE.REQUIRED,
    guardrails_enforced: isGuardrailsEnforced(),
    rate_limiting: getRateLimits()
  },
  cache: {
    idempotency_ttl: getIdempotencyTTL(),
    actor_cache_ttl: getActorCacheTTL()
  }
});

export default HERA_CONFIG;