// HERA Auth Components - Centralized exports
// Canonical provider: HERAAuthProvider (replaces MultiOrgAuthProvider)

export { HERAAuthProvider, useHERAAuth } from './HERAAuthProvider'

// Deprecated: kept for backward compatibility. Prefer HERAAuthProvider/useHERAAuth.
export { MultiOrgAuthProvider, useMultiOrgAuth } from './MultiOrgAuthProvider'
