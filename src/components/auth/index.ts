// HERA Auth Components - Multi-Organization SaaS
// Centralized auth exports for the new architecture

export { MultiOrgAuthProvider, useMultiOrgAuth } from './MultiOrgAuthProvider'

// Re-export for compatibility during migration
export { useMultiOrgAuth as useAuth } from './MultiOrgAuthProvider'