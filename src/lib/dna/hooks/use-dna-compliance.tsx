/**
 * HERA DNA Compliance React Hooks
 * Smart Code: HERA.DNA.HOOKS.COMPLIANCE.ENGINE.V1
 * 
 * REVOLUTIONARY: Real-time DNA compliance monitoring and enforcement
 * at the React component level. Every component automatically validates
 * its own genetic integrity and provides real-time feedback.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { heraDnaStandardization, HeraDnaValidationResult, HeraDnaViolation } from '../core/standardization-dna'
import { dnaEnforcement } from '../middleware/dna-enforcement-middleware'

// ============================================================================
// DNA COMPLIANCE MONITORING HOOKS
// ============================================================================

/**
 * useDnaCompliance - Master hook for DNA compliance monitoring
 */
export function useDnaCompliance(componentSmartCode?: string) {
  const [dnaStatus, setDnaStatus] = useState<'COMPLIANT' | 'VIOLATIONS' | 'UNKNOWN'>('UNKNOWN')
  const [violations, setViolations] = useState<HeraDnaViolation[]>([])
  const [complianceScore, setComplianceScore] = useState<number>(100)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const componentRef = useRef<string>(componentSmartCode || 'UNKNOWN_COMPONENT')

  const checkDnaCompliance = useCallback(async () => {
    const checkTime = new Date()
    
    try {
      // Validate component smart code if provided
      if (componentSmartCode) {
        const validation = heraDnaStandardization.validateSmartCodeDna(componentSmartCode)
        if (!validation.dnaCompliant) {
          setViolations([{
            type: 'COMPONENT_SMART_CODE_VIOLATION',
            severity: 'ERROR',
            message: `Component smart code ${componentSmartCode} violates DNA pattern`,
            fix: validation.fix
          }])
          setDnaStatus('VIOLATIONS')
          setComplianceScore(70)
          setLastCheck(checkTime)
          return
        }
      }

      // Check for global DNA compliance
      const globalViolations = await checkGlobalDnaCompliance()
      
      if (globalViolations.length === 0) {
        setDnaStatus('COMPLIANT')
        setViolations([])
        setComplianceScore(100)
      } else {
        setDnaStatus('VIOLATIONS')
        setViolations(globalViolations)
        setComplianceScore(calculateComplianceScore(globalViolations))
      }
      
      setLastCheck(checkTime)
      
    } catch (error) {
      console.error('🧬 DNA Compliance Check Failed:', error)
      setDnaStatus('UNKNOWN')
      setComplianceScore(0)
      setLastCheck(checkTime)
    }
  }, [componentSmartCode])

  // Auto-check compliance on mount and component updates
  useEffect(() => {
    checkDnaCompliance()
    
    // Set up periodic compliance checking
    const interval = setInterval(checkDnaCompliance, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [checkDnaCompliance])

  return {
    dnaStatus,
    violations,
    complianceScore,
    lastCheck,
    checkDnaCompliance,
    isCompliant: dnaStatus === 'COMPLIANT'
  }
}

/**
 * useDnaSmartCode - Hook for smart code validation and generation
 */
export function useDnaSmartCode() {
  const validateSmartCode = useCallback((smartCode: string): HeraDnaValidationResult => {
    return heraDnaStandardization.validateSmartCodeDna(smartCode)
  }, [])

  const generateSmartCode = useCallback((
    industry: string,
    module: string,
    type: string,
    subtype: string,
    version: number = 1
  ): string => {
    return dnaEnforcement.generateDnaSmartCode(industry, module, type, subtype, version)
  }, [])

  const fixSmartCode = useCallback((smartCode: string): string => {
    // Auto-fix common smart code violations
    return smartCode
      .toUpperCase()
      .replace(/\.v([0-9]+)$/i, '.V$1') // Fix lowercase version
      .replace(/[^A-Z0-9.]/g, '') // Remove invalid characters
  }, [])

  const getSmartCodeFamily = useCallback((smartCode: string): string | null => {
    const validation = validateSmartCode(smartCode)
    return validation.family || null
  }, [validateSmartCode])

  return {
    validateSmartCode,
    generateSmartCode,
    fixSmartCode,
    getSmartCodeFamily
  }
}

/**
 * useDnaApiResponse - Hook for API response standardization
 */
export function useDnaApiResponse() {
  const createStandardResponse = useCallback(<T>(
    data?: T,
    success: boolean = true,
    smartCode?: string,
    organizationId?: string
  ) => {
    return heraDnaStandardization.standardizeApiResponse(data, success, smartCode, organizationId)
  }, [])

  const createErrorResponse = useCallback((
    error: string | Error,
    smartCode?: string,
    organizationId?: string
  ) => {
    return heraDnaStandardization.createDnaErrorResponse(error, smartCode, organizationId)
  }, [])

  const validateResponse = useCallback((response: any): boolean => {
    return (
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      typeof response.success === 'boolean'
    )
  }, [])

  return {
    createStandardResponse,
    createErrorResponse,
    validateResponse
  }
}

/**
 * useDnaEntityValidation - Hook for entity DNA validation
 */
export function useDnaEntityValidation() {
  const [validationResults, setValidationResults] = useState<Map<string, HeraDnaValidationResult>>(new Map())

  const validateEntity = useCallback((entity: any): HeraDnaValidationResult => {
    const validation = heraDnaStandardization.validateEntityDna(entity)
    
    // Cache validation result
    if (entity.id) {
      setValidationResults(prev => new Map(prev).set(entity.id, validation))
    }
    
    return validation
  }, [])

  const validateEntities = useCallback((entities: any[]): HeraDnaValidationResult[] => {
    return entities.map(entity => validateEntity(entity))
  }, [validateEntity])

  const ensureEntityCompliance = useCallback((entity: any): any => {
    const validation = validateEntity(entity)
    
    if (!validation.dnaCompliant) {
      throw new Error(`Entity DNA violation: ${validation.error}`)
    }
    
    return entity
  }, [validateEntity])

  const getValidationResult = useCallback((entityId: string): HeraDnaValidationResult | null => {
    return validationResults.get(entityId) || null
  }, [validationResults])

  return {
    validateEntity,
    validateEntities,
    ensureEntityCompliance,
    getValidationResult,
    validationResults: Array.from(validationResults.entries())
  }
}

/**
 * useDnaOrganizationContext - Hook for organization-aware DNA compliance
 */
export function useDnaOrganizationContext() {
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [isMultiTenantCompliant, setIsMultiTenantCompliant] = useState<boolean>(false)

  useEffect(() => {
    // Extract organization ID from various sources
    const extractOrganizationId = (): string | null => {
      // Try URL parameters
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const orgFromUrl = urlParams.get('organization_id') || urlParams.get('org_id')
        if (orgFromUrl) return orgFromUrl

        // Try localStorage
        const orgFromStorage = localStorage.getItem('hera_organization_id')
        if (orgFromStorage) return orgFromStorage

        // Try subdomain (e.g., acme.heraerp.com)
        const subdomain = window.location.hostname.split('.')[0]
        if (subdomain && subdomain !== 'app' && subdomain !== 'localhost') {
          return subdomain
        }
      }

      return null
    }

    const orgId = extractOrganizationId()
    setOrganizationId(orgId)
    setIsMultiTenantCompliant(!!orgId)
  }, [])

  const enforceOrganizationFilter = useCallback((query: string): string => {
    if (!organizationId) {
      console.warn('🧬 DNA Warning: No organization ID available for query filtering')
      return query
    }

    return dnaEnforcement.interceptDatabaseQuery(query, organizationId)
  }, [organizationId])

  const createOrganizationContext = useCallback((smartCode?: string) => {
    return {
      organizationId,
      requestId: crypto.randomUUID(),
      smartCode,
      dnaTrace: crypto.randomUUID(),
      enforcementLevel: 'STANDARD' as const
    }
  }, [organizationId])

  return {
    organizationId,
    isMultiTenantCompliant,
    enforceOrganizationFilter,
    createOrganizationContext
  }
}

/**
 * useDnaMemoryPersistence - Hook for DNA pattern persistence
 */
export function useDnaMemoryPersistence() {
  const [memoryEngravementStatus, setMemoryEngravementStatus] = useState<'SUCCESS' | 'FAILED' | 'PENDING'>('PENDING')

  const engraveStandardizationDna = useCallback(async () => {
    try {
      const engravementResult = heraDnaStandardization.engraveStandardizationDna()
      
      if (engravementResult.success) {
        setMemoryEngravementStatus('SUCCESS')
        console.log('🧬 HERA DNA Standardization patterns engraved in memory:', engravementResult)
      } else {
        setMemoryEngravementStatus('FAILED')
      }
      
      return engravementResult
    } catch (error) {
      console.error('🧬 DNA Memory Engravment Failed:', error)
      setMemoryEngravementStatus('FAILED')
      throw error
    }
  }, [])

  const recallDnaPatterns = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('HERA_DNA_STANDARDIZATION')
      return stored ? JSON.parse(stored) : null
    }
    return null
  }, [])

  // Auto-engrave on mount
  useEffect(() => {
    engraveStandardizationDna()
  }, [engraveStandardizationDna])

  return {
    memoryEngravementStatus,
    engraveStandardizationDna,
    recallDnaPatterns
  }
}

/**
 * useDnaViolationReporting - Hook for tracking and reporting DNA violations
 */
export function useDnaViolationReporting() {
  const [violations, setViolations] = useState<HeraDnaViolation[]>([])
  const [reportingEnabled, setReportingEnabled] = useState<boolean>(true)

  const reportViolation = useCallback((violation: HeraDnaViolation) => {
    if (!reportingEnabled) return

    setViolations(prev => [...prev, violation])
    
    // Log violation to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🧬 HERA DNA Violation [${violation.type}]:`, violation.message)
      if (violation.fix) {
        console.info(`🔧 Suggested Fix:`, violation.fix)
      }
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Send violation report to analytics service
      try {
        fetch('/api/v2/dna/violations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            violation,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
          })
        }).catch(error => {
          console.error('Failed to report DNA violation:', error)
        })
      } catch (error) {
        // Fail silently in production
      }
    }
  }, [reportingEnabled])

  const clearViolations = useCallback(() => {
    setViolations([])
  }, [])

  const getViolationsByType = useCallback((type: string): HeraDnaViolation[] => {
    return violations.filter(v => v.type === type)
  }, [violations])

  const getViolationReport = useCallback(() => {
    const violationCounts = violations.reduce((acc, violation) => {
      acc[violation.type] = (acc[violation.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalViolations: violations.length,
      violationsByType: violationCounts,
      violationsByActivity: violations.reduce((acc, violation) => {
        const severity = violation.severity
        acc[severity] = (acc[severity] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recentViolations: violations.slice(-10)
    }
  }, [violations])

  return {
    violations,
    reportingEnabled,
    setReportingEnabled,
    reportViolation,
    clearViolations,
    getViolationsByType,
    getViolationReport
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function checkGlobalDnaCompliance(): Promise<HeraDnaViolation[]> {
  const violations: HeraDnaViolation[] = []

  // Check for common anti-patterns in the DOM (client-side only)
  if (typeof window !== 'undefined') {
    // Check for non-standard API responses in network requests
    const performanceEntries = performance.getEntriesByType('resource')
    const apiCalls = performanceEntries.filter(entry => 
      entry.name.includes('/api/') && !entry.name.includes('/api/v2/')
    )

    if (apiCalls.length > 0) {
      violations.push({
        type: 'NON_STANDARD_API_USAGE',
        severity: 'WARNING',
        message: `${apiCalls.length} API calls not using v2 standard`,
        fix: 'Migrate API calls to /api/v2/ endpoints'
      })
    }
  }

  return violations
}

function calculateComplianceScore(violations: HeraDnaViolation[]): number {
  const maxScore = 100
  const penalties = {
    CRITICAL: 30,
    ERROR: 15,
    WARNING: 5
  }

  let totalPenalty = 0
  violations.forEach(violation => {
    totalPenalty += penalties[violation.severity] || 5
  })

  return Math.max(0, maxScore - totalPenalty)
}

// ============================================================================
// CONTEXT TYPE EXPORT (for provider component)
// ============================================================================

export interface DnaComplianceContextType {
  dnaStatus: 'COMPLIANT' | 'VIOLATIONS' | 'UNKNOWN'
  complianceScore: number
  violations: HeraDnaViolation[]
  isCompliant: boolean
  checkCompliance: () => Promise<void>
}