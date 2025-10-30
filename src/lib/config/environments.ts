/**
 * Environment Configuration for HERA v2.2
 * Smart Code: HERA.CONFIG.ENVIRONMENT.MANAGER.v1
 * 
 * Manages different environment configurations for development and production
 */

export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiV2BaseUrl: string;
  environment: 'development' | 'production' | 'staging';
}

export const ENVIRONMENTS: Record<string, EnvironmentConfig> = {
  development: {
    supabaseUrl: 'https://qqagokigwuujyeyrgdkq.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTM1MjYsImV4cCI6MjA3NTM4OTUyNn0.H_u1YByJg63dGkhIQsvr3oeUSe4UOOcv_g341h3BJOY',
    apiV2BaseUrl: 'https://qqagokigwuujyeyrgdkq.supabase.co',
    environment: 'development'
  },
  production: {
    supabaseUrl: 'https://awfcrncxngqwbhqapffb.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MDk2MTUsImV4cCI6MjA3MDM4NTYxNX0.VBgaT6jg5k_vTz-5ibD90m2O6K5F6m-se2I_vLAD2G0',
    apiV2BaseUrl: 'https://awfcrncxngqwbhqapffb.supabase.co',
    environment: 'production'
  }
};

/**
 * Get current environment configuration based on NODE_ENV or explicit environment
 */
export function getCurrentEnvironmentConfig(explicitEnv?: string): EnvironmentConfig {
  const env = explicitEnv || process.env.NODE_ENV || 'development';
  
  // Map Next.js environments to our environments
  const environmentMap: Record<string, keyof typeof ENVIRONMENTS> = {
    'development': 'development',
    'dev': 'development',
    'local': 'development',
    'production': 'production',
    'prod': 'production',
    'staging': 'production' // Use production Supabase for staging
  };
  
  const mappedEnv = environmentMap[env] || 'development';
  return ENVIRONMENTS[mappedEnv];
}

/**
 * Create HERA Client with environment-aware configuration
 */
export function createEnvironmentAwareHeraClient(token: string, orgId: string, environment?: string) {
  const config = getCurrentEnvironmentConfig(environment);
  
  // Import HeraClient dynamically to avoid circular dependencies
  return import('../hera/client').then(({ HeraClient }) => {
    return new HeraClient(config.apiV2BaseUrl, token, orgId);
  });
}

/**
 * Get API v2 endpoint URL for current environment
 */
export function getApiV2Url(environment?: string): string {
  const config = getCurrentEnvironmentConfig(environment);
  return `${config.apiV2BaseUrl}/functions/v1/api-v2`;
}

/**
 * Environment detection utilities
 */
export const ENV_UTILS = {
  isDevelopment: () => getCurrentEnvironmentConfig().environment === 'development',
  isProduction: () => getCurrentEnvironmentConfig().environment === 'production',
  getCurrentEnv: () => getCurrentEnvironmentConfig().environment,
  
  // For debugging and logging
  logCurrentConfig: () => {
    const config = getCurrentEnvironmentConfig();
    console.log('🏛️ HERA Environment Config:', {
      environment: config.environment,
      supabaseUrl: config.supabaseUrl,
      apiV2Url: getApiV2Url()
    });
  }
};

export default getCurrentEnvironmentConfig;