/**
 * Environment variable validation and configuration
 * Validates required environment variables at runtime
 */

function validateEnv() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (!apiBaseUrl) {
    console.warn(
      'NEXT_PUBLIC_API_BASE_URL is not set. Falling back to http://localhost:4000/api'
    );
    return 'http://localhost:4000/api';
  }

  return apiBaseUrl;
}

export const API_BASE_URL = validateEnv();

// Additional environment validations can be added here
export function validateRequiredEnvVars() {
  const warnings: string[] = [];
  
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    warnings.push('NEXT_PUBLIC_API_BASE_URL is not configured');
  }

  if (warnings.length > 0) {
    console.warn('Environment configuration warnings:', warnings);
  }

  return warnings;
}

// Run validation on module load in development
if (process.env.NODE_ENV === 'development') {
  validateRequiredEnvVars();
}