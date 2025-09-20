/**
 * Redirect file for backward compatibility
 * All imports of MultiOrgAuthProvider should now use HERAAuthProvider
 */

export { 
  HERAAuthProvider as MultiOrgAuthProvider,
  useMultiOrgAuth,
  useHERAAuth
} from './HERAAuthProvider'

console.warn('⚠️ MultiOrgAuthProvider is deprecated. Please import from HERAAuthProvider directly.')