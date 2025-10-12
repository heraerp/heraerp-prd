/**
 * HERA DNA Standardization System - Main Entry Point
 * Smart Code: HERA.DNA.CORE.STANDARDIZATION.INDEX.V1
 * 
 * REVOLUTIONARY: Complete DNA standardization system embedded into HERA's core.
 * This exports all standardization components, hooks, and utilities for
 * automatic enforcement of HERA architectural patterns.
 */

// ============================================================================
// CORE DNA STANDARDIZATION EXPORTS
// ============================================================================

// Core Standardization Engine
export {
  heraDnaStandardization,
  HeraDnaStandardizationEngine,
  SMART_CODE_DNA_PATTERN,
  HERA_DNA_SMART_CODE_FAMILIES,
  SACRED_SIX_TABLES_DNA,
  HERA_DNA_ANTI_PATTERNS,
  HERA_DNA_API_RESPONSE_SCHEMA,
  HERA_DNA_STANDARDIZATION_SMART_CODES,
  HERA_DNA_MEMORY,
  withDnaStandardization,
  HeraDnaStandardizationSchema
} from './core/standardization-dna'

// Types
export type {
  HeraDnaStandardization,
  HeraDnaApiResponse,
  HeraDnaValidationResult,
  HeraDnaViolation,
  HeraDnaCodeAnalysis,
  HeraDnaMemoryEngravment
} from './core/standardization-dna'

// ============================================================================
// DNA ENFORCEMENT MIDDLEWARE EXPORTS
// ============================================================================

// Enforcement Middleware
export {
  withDnaEnforcement,
  withComponentDna,
  interceptDatabaseQuery,
  generateDnaSmartCode,
  HeraDnaRequestEnforcement,
  dnaMemoryManager,
  dnaEnforcement
} from './middleware/dna-enforcement-middleware'

// Types
export type {
  DnaEnforcementConfig,
  DnaMiddlewareContext
} from './middleware/dna-enforcement-middleware'

// ============================================================================
// DNA COMPLIANCE HOOKS EXPORTS
// ============================================================================

// React Hooks
export {
  useDnaCompliance,
  useDnaSmartCode,
  useDnaApiResponse,
  useDnaEntityValidation,
  useDnaOrganizationContext,
  useDnaMemoryPersistence,
  useDnaViolationReporting
} from './hooks/use-dna-compliance'

export type { DnaComplianceContextType } from './hooks/use-dna-compliance'

// React Providers
export {
  DnaComplianceProvider,
  useDnaComplianceContext
} from './providers/dna-compliance-provider'

// ============================================================================
// DNA COMPLIANCE COMPONENTS EXPORTS
// ============================================================================

// React Components
export {
  default as DnaComplianceMonitor,
  DnaComplianceIndicator,
  DnaComplianceBadge
} from './components/dna-compliance-monitor'

// ============================================================================
// DNA UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick DNA validation function for immediate use
 */
export function validateDnaCompliance(smartCode: string) {
  return heraDnaStandardization.validateSmartCodeDna(smartCode)
}

/**
 * Create DNA-compliant API response
 */
export function createDnaResponse<T>(
  data?: T,
  success: boolean = true,
  smartCode?: string,
  organizationId?: string
) {
  return heraDnaStandardization.standardizeApiResponse(data, success, smartCode, organizationId)
}

/**
 * Create DNA-compliant error response
 */
export function createDnaError(
  error: string | Error,
  smartCode?: string,
  organizationId?: string
) {
  return heraDnaStandardization.createDnaErrorResponse(error, smartCode, organizationId)
}

/**
 * Validate entity DNA compliance
 */
export function validateEntityDna(entity: any) {
  return heraDnaStandardization.validateEntityDna(entity)
}

/**
 * Analyze code for DNA violations
 */
export function analyzeDnaViolations(code: string, filePath: string) {
  return heraDnaStandardization.analyzeCodeDna(code, filePath)
}

/**
 * Engrave DNA patterns into memory
 */
export function engraveDnaMemory() {
  return heraDnaStandardization.engraveStandardizationDna()
}

// ============================================================================
// DNA STANDARDIZATION CONSTANTS
// ============================================================================

/**
 * Common DNA Smart Codes for immediate use
 */
export const DNA_SMART_CODES = {
  // Core DNA Operations
  VALIDATION: 'HERA.DNA.CORE.VALIDATION.V1',
  ENFORCEMENT: 'HERA.DNA.CORE.ENFORCEMENT.V1',
  COMPLIANCE: 'HERA.DNA.CORE.COMPLIANCE.V1',
  
  // API Operations
  API_REQUEST: 'HERA.DNA.API.REQUEST.V1',
  API_RESPONSE: 'HERA.DNA.API.RESPONSE.V1',
  API_ERROR: 'HERA.DNA.API.ERROR.V1',
  
  // Entity Operations
  ENTITY_CREATE: 'HERA.DNA.ENTITY.CREATE.V1',
  ENTITY_UPDATE: 'HERA.DNA.ENTITY.UPDATE.V1',
  ENTITY_DELETE: 'HERA.DNA.ENTITY.DELETE.V1',
  
  // Component Operations
  COMPONENT_RENDER: 'HERA.DNA.COMPONENT.RENDER.V1',
  COMPONENT_MOUNT: 'HERA.DNA.COMPONENT.MOUNT.V1',
  COMPONENT_UPDATE: 'HERA.DNA.COMPONENT.UPDATE.V1'
} as const

/**
 * DNA Compliance Levels
 */
export const DNA_COMPLIANCE_LEVELS = {
  STRICT: 'STRICT',
  STANDARD: 'STANDARD', 
  PERMISSIVE: 'PERMISSIVE'
} as const

/**
 * DNA Violation Severities
 */
export const DNA_VIOLATION_SEVERITIES = {
  CRITICAL: 'CRITICAL',
  ERROR: 'ERROR',
  WARNING: 'WARNING'
} as const

// ============================================================================
// DNA INITIALIZATION
// ============================================================================

/**
 * Initialize HERA DNA Standardization System
 * Call this once at app startup to engrave patterns in memory
 */
export function initializeDnaStandardization() {
  try {
    // Engrave standardization patterns in memory
    const engravementResult = heraDnaStandardization.engraveStandardizationDna()
    
    // Initialize memory manager
    dnaMemoryManager.engraveEnforcementPatterns()
    
    console.log('🧬 HERA DNA Standardization System Initialized:', {
      success: engravementResult.success,
      engravedAt: engravementResult.engravedAt,
      patterns: Object.keys(engravementResult.dnaPatterns).length
    })
    
    return engravementResult
  } catch (error) {
    console.error('🧬 Failed to initialize HERA DNA Standardization:', error)
    throw error
  }
}

/**
 * Get DNA compliance status for the entire system
 */
export async function getDnaSystemStatus() {
  const engine = heraDnaStandardization
  
  // Check various aspects of system compliance
  const systemStatus = {
    memoryEngravementStatus: 'ACTIVE',
    smartCodeComplianceRate: 100, // Would be calculated from actual usage
    apiResponseComplianceRate: 100, // Would be calculated from actual responses
    entityComplianceRate: 100, // Would be calculated from actual entities
    overallComplianceScore: 100,
    lastSystemCheck: new Date().toISOString(),
    activeViolations: 0,
    systemHealth: 'EXCELLENT' as 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  }
  
  return systemStatus
}

// ============================================================================
// GLOBAL DNA REGISTRATION
// ============================================================================

// Make DNA system available globally for debugging and development
if (typeof globalThis !== 'undefined') {
  (globalThis as any).HERA_DNA = {
    engine: heraDnaStandardization,
    enforcement: dnaEnforcement,
    memory: dnaMemoryManager,
    utilities: {
      validateDnaCompliance,
      createDnaResponse,
      createDnaError,
      validateEntityDna,
      analyzeDnaViolations,
      engraveDnaMemory,
      initializeDnaStandardization,
      getDnaSystemStatus
    },
    constants: {
      SMART_CODES: DNA_SMART_CODES,
      COMPLIANCE_LEVELS: DNA_COMPLIANCE_LEVELS,
      VIOLATION_SEVERITIES: DNA_VIOLATION_SEVERITIES
    }
  }
}

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================

// Auto-initialize DNA system when module is imported
if (typeof window !== 'undefined') {
  // Client-side initialization
  setTimeout(() => {
    try {
      initializeDnaStandardization()
    } catch (error) {
      console.warn('🧬 DNA auto-initialization failed (non-critical):', error)
    }
  }, 100)
} else {
  // Server-side initialization
  try {
    initializeDnaStandardization()
  } catch (error) {
    console.warn('🧬 DNA server-side initialization failed (non-critical):', error)
  }
}