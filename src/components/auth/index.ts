// HERA Auth Components - Supabase Only
// Simplified auth exports for production

export { SupabaseAuthProvider, useSupabaseAuth } from '@/contexts/supabase-auth-context'

// Re-export for compatibility
export { useSupabaseAuth as useAuth } from '@/contexts/supabase-auth-context'

// Keep some working components
export { JobsLoginForm } from './JobsLoginForm'
export { JobsDashboard } from './JobsDashboard'
export { JobsRegistrationWizard } from './JobsRegistrationWizard'