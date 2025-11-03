/**
 * HERA v2.2 Configuration - Single Source of Truth
 * Smart Code: HERA.CONFIG.RUNTIME.V2.v1
 * 
 * Production-ready configuration management for v1 runtime with v2 Edge
 * Enables seamless v1→v2 migration with single config change
 */

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

// Type definitions for configuration
export type HeraConfig = typeof HERA_CONFIG;
export type RPCVersion = typeof HERA_CONFIG.RPC_VERSION;
export type GuardrailsMode = typeof HERA_CONFIG.GUARDRAILS.MODE;
export type APIVersion = typeof HERA_CONFIG.API_VERSION;

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
  const projectRef = Deno?.env?.get('SUPABASE_PROJECT_REF') || 
                    process?.env?.SUPABASE_PROJECT_REF;
  return projectRef === HERA_CONFIG.ENVIRONMENT.PRODUCTION;
};

export const isDevelopmentEnvironment = (): boolean => {
  const projectRef = Deno?.env?.get('SUPABASE_PROJECT_REF') || 
                    process?.env?.SUPABASE_PROJECT_REF;
  return projectRef === HERA_CONFIG.ENVIRONMENT.DEVELOPMENT;
};

/**
 * Security Configuration Getters
 */
export const getPlatformOrgId = (): string => 
  HERA_CONFIG.SECURITY.PLATFORM_ORG_ID;

export const getSmartCodeRegex = (): RegExp => 
  HERA_CONFIG.SMART_CODE.REGEX;

export const isSmartCodeRequired = (): boolean => 
  HERA_CONFIG.SMART_CODE.REQUIRED;

/**
 * Rate Limiting Configuration
 */
export const getRateLimits = () => HERA_CONFIG.SECURITY.RATE_LIMITING;

/**
 * Cache TTL Getters
 */
export const getIdempotencyTTL = (): number => 
  HERA_CONFIG.IDEMPOTENCY_TTL_SEC;

export const getActorCacheTTL = (): number => 
  HERA_CONFIG.ACTOR_CACHE_TTL_SEC;

/**
 * Configuration Validation
 */
export const validateConfiguration = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate RPC version
  if (!['v1', 'v2'].includes(HERA_CONFIG.RPC_VERSION)) {
    errors.push(`Invalid RPC_VERSION: ${HERA_CONFIG.RPC_VERSION}`);
  }

  // Validate guardrails mode
  if (!['warn', 'enforce'].includes(HERA_CONFIG.GUARDRAILS.MODE)) {
    errors.push(`Invalid GUARDRAILS.MODE: ${HERA_CONFIG.GUARDRAILS.MODE}`);
  }

  // Validate API version
  if (!['v2'].includes(HERA_CONFIG.API_VERSION)) {
    errors.push(`Invalid API_VERSION: ${HERA_CONFIG.API_VERSION}`);
  }

  // Validate TTL values
  if (HERA_CONFIG.IDEMPOTENCY_TTL_SEC <= 0) {
    errors.push('IDEMPOTENCY_TTL_SEC must be positive');
  }

  if (HERA_CONFIG.ACTOR_CACHE_TTL_SEC <= 0) {
    errors.push('ACTOR_CACHE_TTL_SEC must be positive');
  }

  // Validate Smart Code regex
  try {
    new RegExp(HERA_CONFIG.SMART_CODE.REGEX);
  } catch (e) {
    errors.push(`Invalid SMART_CODE.REGEX: ${e}`);
  }

  // Warnings for production readiness
  if (HERA_CONFIG.RPC_VERSION === 'v1' && HERA_CONFIG.GUARDRAILS.MODE === 'warn') {
    warnings.push('v1 runtime with WARN mode - consider upgrading to v2 with ENFORCE mode');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Configuration Summary for Logging/Debugging
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
    smart_codes_required: isSmartCodeRequired(),
    guardrails_enforced: isGuardrailsEnforced(),
    rate_limiting: getRateLimits()
  },
  cache: {
    idempotency_ttl: getIdempotencyTTL(),
    actor_cache_ttl: getActorCacheTTL()
  },
  validation: validateConfiguration()
});

/**
 * Migration Helper - Future v1→v2 Migration
 * Usage: Simply change RPC_VERSION to 'v2' and update RPC function names
 */
export const getMigrationInstructions = () => {
  if (isV1Runtime()) {
    return {
      current_state: 'v1 runtime with v2 Edge',
      migration_path: [
        'Update HERA_CONFIG.RPC_VERSION to "v2"',
        'Update HERA_CONFIG.ENTITIES_RPC to "hera_entities_crud_v2"',
        'Update HERA_CONFIG.TRANSACTIONS_RPC to "hera_transactions_post_v2"',
        'Update HERA_CONFIG.GUARDRAILS.MODE to "enforce"',
        'Deploy v2 RPC functions to database',
        'Run acceptance tests',
        'Deploy updated Edge Function'
      ],
      rollback: 'Revert configuration changes to restore v1 runtime'
    };
  }
  
  return {
    current_state: 'v2 runtime - fully upgraded',
    migration_path: ['Already on v2 runtime'],
    rollback: 'Update configuration to v1 values if needed'
  };
};

/**
 * Export default configuration for easy importing
 */
export default HERA_CONFIG;