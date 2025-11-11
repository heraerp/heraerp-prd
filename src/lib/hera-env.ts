/**
 * HERA Environment Configuration
 * Smart Code: HERA.FRONTEND.ENV.CONFIG.v1
 * 
 * Environment detection and configuration for HERA frontend applications
 * Claude will use this for automatic environment setup
 */

// =============================================================================
// Environment Variables
// =============================================================================

export const HERA_ENV = {
  // Core HERA Configuration
  baseUrl: import.meta.env.VITE_HERA_BASE_URL as string,
  environment: import.meta.env.VITE_HERA_ENVIRONMENT as string || 'development',
  
  // Authentication Configuration
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  
  // Debug and Development
  debug: import.meta.env.VITE_HERA_DEBUG === 'true',
  enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS !== 'false',
  
  // API Configuration
  apiTimeout: parseInt(import.meta.env.VITE_HERA_API_TIMEOUT || '30000'),
  retryCount: parseInt(import.meta.env.VITE_HERA_RETRY_COUNT || '3'),
  
  // Feature Flags
  enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableErrorTracking: import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true',
} as const;

// =============================================================================
// Environment Validation
// =============================================================================

export interface EnvironmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate HERA environment configuration
 * Claude will use this to ensure proper setup
 */
export function validateEnvironment(): EnvironmentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  if (!HERA_ENV.baseUrl) {
    errors.push('VITE_HERA_BASE_URL is required');
  } else {
    try {
      new URL(HERA_ENV.baseUrl);
    } catch {
      errors.push('VITE_HERA_BASE_URL must be a valid URL');
    }
  }

  if (!HERA_ENV.supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is required');
  } else {
    try {
      new URL(HERA_ENV.supabaseUrl);
    } catch {
      errors.push('VITE_SUPABASE_URL must be a valid URL');
    }
  }

  if (!HERA_ENV.supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }

  // Warnings for optional configuration
  if (HERA_ENV.environment === 'production' && HERA_ENV.debug) {
    warnings.push('Debug mode is enabled in production environment');
  }

  if (HERA_ENV.apiTimeout < 5000) {
    warnings.push('API timeout is set to less than 5 seconds, which may cause issues');
  }

  if (HERA_ENV.retryCount > 5) {
    warnings.push('Retry count is set to more than 5, which may cause poor UX');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// =============================================================================
// Environment Detection
// =============================================================================

/**
 * Detect the current environment
 */
export function detectEnvironment(): 'development' | 'staging' | 'production' {
  // Explicit environment variable
  if (HERA_ENV.environment) {
    return HERA_ENV.environment as any;
  }

  // Detect from hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'development';
    }
    
    if (hostname.includes('staging') || hostname.includes('dev.')) {
      return 'staging';
    }
    
    return 'production';
  }

  // Default to development
  return 'development';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return detectEnvironment() === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return detectEnvironment() === 'production';
}

// =============================================================================
// HERA Configuration Builder
// =============================================================================

/**
 * Create HERA configuration from environment
 * Claude will use this to automatically configure the HERA client
 */
export function createHeraConfigFromEnv(
  getToken: () => Promise<string>,
  getOrgId: () => Promise<string | undefined>
) {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
  }

  // Log warnings in development
  if (isDevelopment() && validation.warnings.length > 0) {
    console.warn('HERA Environment Warnings:', validation.warnings);
  }

  return {
    baseUrl: HERA_ENV.baseUrl,
    getToken,
    getOrgId,
    timeout: HERA_ENV.apiTimeout,
    retryCount: HERA_ENV.retryCount
  };
}

// =============================================================================
// Development Helpers
// =============================================================================

/**
 * Log environment configuration (development only)
 */
export function logEnvironmentInfo(): void {
  if (!isDevelopment()) return;

  console.group('🚀 HERA Environment Configuration');
  console.log('Environment:', detectEnvironment());
  console.log('Base URL:', HERA_ENV.baseUrl);
  console.log('Debug Mode:', HERA_ENV.debug);
  console.log('API Timeout:', HERA_ENV.apiTimeout);
  console.log('Retry Count:', HERA_ENV.retryCount);
  
  const validation = validateEnvironment();
  if (validation.warnings.length > 0) {
    console.warn('Warnings:', validation.warnings);
  }
  
  console.groupEnd();
}

/**
 * Get debug information about the environment
 */
export function getEnvironmentDebugInfo() {
  return {
    environment: detectEnvironment(),
    validation: validateEnvironment(),
    config: HERA_ENV,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    timestamp: new Date().toISOString()
  };
}

// =============================================================================
// Environment-Specific Utilities
// =============================================================================

/**
 * Get the appropriate console method based on environment
 */
export function getLogger() {
  if (isDevelopment()) {
    return console;
  }
  
  // In production, only log errors
  return {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: console.error,
    debug: () => {},
    group: () => {},
    groupEnd: () => {},
    time: () => {},
    timeEnd: () => {}
  };
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof HERA_ENV): boolean {
  return HERA_ENV[feature] === true;
}

// =============================================================================
// Claude Generation Helpers
// =============================================================================

/**
 * Generate .env.example file content
 * Claude will use this to create environment documentation
 */
export function generateEnvExample(): string {
  return `# HERA Frontend Environment Configuration
# Copy this file to .env.local and fill in your values

# Required: HERA API Base URL
VITE_HERA_BASE_URL=https://your-project.supabase.co/functions/v1

# Required: Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Environment Configuration
VITE_HERA_ENVIRONMENT=development
VITE_HERA_DEBUG=true
VITE_ENABLE_DEV_TOOLS=true

# Optional: API Configuration
VITE_HERA_API_TIMEOUT=30000
VITE_HERA_RETRY_COUNT=3

# Optional: Feature Flags
VITE_ENABLE_OFFLINE_MODE=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
`;
}

/**
 * Generate TypeScript environment declarations
 * Claude will use this to create proper typing
 */
export function generateEnvTypes(): string {
  return `/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Required
  readonly VITE_HERA_BASE_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  
  // Optional
  readonly VITE_HERA_ENVIRONMENT?: string
  readonly VITE_HERA_DEBUG?: string
  readonly VITE_ENABLE_DEV_TOOLS?: string
  readonly VITE_HERA_API_TIMEOUT?: string
  readonly VITE_HERA_RETRY_COUNT?: string
  readonly VITE_ENABLE_OFFLINE_MODE?: string
  readonly VITE_ENABLE_ANALYTICS?: string
  readonly VITE_ENABLE_ERROR_TRACKING?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
`;
}

// =============================================================================
// Export Everything
// =============================================================================

export default HERA_ENV;