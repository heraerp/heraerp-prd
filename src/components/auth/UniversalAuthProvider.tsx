'use client'

// Re-export from the universal auth directory
export {
  UniversalAuthProvider,
  useUniversalAuth,
  UniversalAuthContext,
  type User,
  type Organization,
  type HeraContext,
  type UniversalAuthConfig,
  type UniversalAuthContextType
} from '@/components/universal/auth/UniversalAuthProvider'

// Alias for compatibility with existing imports that expect 'useAuth'
export { useUniversalAuth as useAuth } from '@/components/universal/auth/UniversalAuthProvider'