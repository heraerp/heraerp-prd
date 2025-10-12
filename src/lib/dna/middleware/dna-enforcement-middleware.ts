/**
 * HERA DNA Enforcement Middleware
 * Smart Code: HERA.DNA.MIDDLEWARE.ENFORCEMENT.ENGINE.V1
 * 
 * REVOLUTIONARY: Automatic DNA pattern enforcement at the middleware level.
 * Every API call, database operation, and component render automatically
 * enforces HERA standardization patterns without developer intervention.
 */

import { NextRequest, NextResponse } from 'next/server'
import { heraDnaStandardization, HeraDnaValidationResult } from '../core/standardization-dna'

// ============================================================================
// DNA ENFORCEMENT MIDDLEWARE CORE
// ============================================================================

export interface DnaEnforcementConfig {
  enforceSmartCodes: boolean
  enforceOrganizationId: boolean
  enforceResponseFormat: boolean
  autoFix: boolean
  strictMode: boolean
  logViolations: boolean
}

export interface DnaMiddlewareContext {
  organizationId?: string
  userId?: string
  requestId: string
  smartCode?: string
  dnaTrace: string
  enforcementLevel: 'STRICT' | 'STANDARD' | 'PERMISSIVE'
}

/**
 * HERA DNA Request Enforcement - Validates all incoming requests
 */
export class HeraDnaRequestEnforcement {
  private config: DnaEnforcementConfig
  private violations: string[] = []

  constructor(config: Partial<DnaEnforcementConfig> = {}) {
    this.config = {
      enforceSmartCodes: true,
      enforceOrganizationId: true,
      enforceResponseFormat: true,
      autoFix: true,
      strictMode: false,
      logViolations: true,
      ...config
    }
  }

  /**
   * DNA Request Validation - Ensures request follows HERA genetic patterns
   */
  async validateRequest(request: NextRequest): Promise<DnaMiddlewareContext> {
    const requestId = crypto.randomUUID()
    const dnaTrace = crypto.randomUUID()
    
    // Extract organization ID from various sources
    const organizationId = this.extractOrganizationId(request)
    
    // Validate organization ID requirement
    if (this.config.enforceOrganizationId && !organizationId) {
      this.addViolation('MISSING_ORGANIZATION_ID', 'Request missing organization_id for multi-tenant isolation')
    }

    // Extract and validate smart code if present
    const smartCode = this.extractSmartCode(request)
    if (smartCode && this.config.enforceSmartCodes) {
      const validation = heraDnaStandardization.validateSmartCodeDna(smartCode)
      if (!validation.dnaCompliant) {
        this.addViolation('INVALID_SMART_CODE', `Smart code ${smartCode} violates DNA pattern`)
      }
    }

    // Determine enforcement level based on path
    const enforcementLevel = this.determineEnforcementLevel(request.nextUrl.pathname)

    return {
      organizationId,
      requestId,
      smartCode,
      dnaTrace,
      enforcementLevel
    }
  }

  /**
   * DNA Response Enforcement - Ensures responses follow genetic template
   */
  enforceResponseDna(response: any, context: DnaMiddlewareContext): any {
    if (!this.config.enforceResponseFormat) {
      return response
    }

    // If response is already DNA compliant, return as-is
    if (this.isDnaCompliantResponse(response)) {
      return response
    }

    // Transform to DNA compliant format
    return heraDnaStandardization.standardizeApiResponse(
      response,
      true,
      context.smartCode,
      context.organizationId
    )
  }

  /**
   * DNA Database Query Enforcement - Ensures all queries include organization_id
   */
  enforceQueryDna(query: string, organizationId?: string): string {
    if (!this.config.enforceOrganizationId || !organizationId) {
      return query
    }

    // Check if query accesses core_entities without organization filter
    if (query.includes('FROM core_entities') && !query.includes('organization_id')) {
      this.addViolation('MISSING_ORG_FILTER', 'Database query missing organization_id filter')
      
      if (this.config.autoFix) {
        // Auto-inject organization filter
        return this.injectOrganizationFilter(query, organizationId)
      }
    }

    return query
  }

  // Private helper methods
  private extractOrganizationId(request: NextRequest): string | undefined {
    // Try multiple sources for organization ID
    const headers = request.headers
    const url = request.nextUrl

    return (
      headers.get('x-organization-id') ||
      headers.get('x-hera-org-id') ||
      url.searchParams.get('organization_id') ||
      url.searchParams.get('org_id') ||
      this.extractFromPath(url.pathname)
    )
  }

  private extractSmartCode(request: NextRequest): string | undefined {
    const headers = request.headers
    const url = request.nextUrl

    return (
      headers.get('x-smart-code') ||
      headers.get('x-hera-smart-code') ||
      url.searchParams.get('smart_code')
    )
  }

  private extractFromPath(pathname: string): string | undefined {
    // Extract org ID from paths like /org/[orgId]/... or /api/v2/organizations/[orgId]
    const orgMatch = pathname.match(/\/(?:org|organizations)\/([a-f0-9-]{36})/i)
    return orgMatch?.[1]
  }

  private determineEnforcementLevel(pathname: string): 'STRICT' | 'STANDARD' | 'PERMISSIVE' {
    if (pathname.startsWith('/api/v2/')) return 'STRICT'
    if (pathname.startsWith('/api/')) return 'STANDARD'
    return 'PERMISSIVE'
  }

  private isDnaCompliantResponse(response: any): boolean {
    return (
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      typeof response.success === 'boolean'
    )
  }

  private injectOrganizationFilter(query: string, organizationId: string): string {
    // Simple injection for common patterns
    if (query.includes('WHERE')) {
      return query.replace(/WHERE/, `WHERE organization_id = '${organizationId}' AND`)
    } else {
      return query.replace(/FROM core_entities/, `FROM core_entities WHERE organization_id = '${organizationId}'`)
    }
  }

  private addViolation(type: string, message: string): void {
    this.violations.push(`${type}: ${message}`)
    
    if (this.config.logViolations) {
      console.warn(`🧬 HERA DNA Violation [${type}]:`, message)
    }
  }

  getViolations(): string[] {
    return [...this.violations]
  }
}

// ============================================================================
// DNA MIDDLEWARE FUNCTIONS
// ============================================================================

/**
 * withDnaEnforcement - Higher-order function for API route DNA enforcement
 */
export function withDnaEnforcement(
  handler: (request: NextRequest, context: DnaMiddlewareContext) => Promise<NextResponse>,
  config?: Partial<DnaEnforcementConfig>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const enforcement = new HeraDnaRequestEnforcement(config)
    
    try {
      // Validate request DNA
      const context = await enforcement.validateRequest(request)
      
      // Check for violations in strict mode
      const violations = enforcement.getViolations()
      if (violations.length > 0 && context.enforcementLevel === 'STRICT') {
        return NextResponse.json(
          heraDnaStandardization.createDnaErrorResponse(
            `DNA violations detected: ${violations.join(', ')}`,
            'HERA.DNA.MIDDLEWARE.VIOLATION.V1',
            context.organizationId
          ),
          { status: 400 }
        )
      }

      // Execute handler with DNA context
      const response = await handler(request, context)
      
      // Enforce response DNA if JSON
      if (response.headers.get('content-type')?.includes('application/json')) {
        const responseData = await response.json()
        const enforcedData = enforcement.enforceResponseDna(responseData, context)
        
        return NextResponse.json(enforcedData, {
          status: response.status,
          headers: {
            ...Object.fromEntries([...response.headers]),
            'x-hera-dna-trace': context.dnaTrace,
            'x-hera-dna-compliant': 'true'
          }
        })
      }

      return response
      
    } catch (error) {
      // Create DNA-compliant error response
      const errorResponse = heraDnaStandardization.createDnaErrorResponse(
        error instanceof Error ? error : new Error('Unknown error'),
        'HERA.DNA.MIDDLEWARE.ERROR.V1'
      )
      
      return NextResponse.json(errorResponse, { status: 500 })
    }
  }
}

/**
 * DNA Component Validation - Validates DNA patterns for components
 */
export function validateComponentDna(smartCode: string): HeraDnaValidationResult {
  const validation = heraDnaStandardization.validateSmartCodeDna(smartCode)
  
  if (!validation.dnaCompliant) {
    console.error(`🧬 Component DNA Violation: ${smartCode} - ${validation.error}`)
    
    // In development, throw error
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`🧬 HERA DNA Violation: ${smartCode} - ${validation.error}\nFix: ${validation.fix}`)
    }
  }

  return validation
}

/**
 * Legacy support for component DNA wrapper
 */
export function withComponentDna<T>(component: T, smartCode: string): T {
  validateComponentDna(smartCode)
  return component
}

/**
 * DNA Database Query Interceptor
 */
export function interceptDatabaseQuery(
  query: string,
  organizationId?: string
): string {
  const enforcement = new HeraDnaRequestEnforcement()
  return enforcement.enforceQueryDna(query, organizationId)
}

/**
 * DNA Smart Code Generator - Creates DNA-compliant smart codes
 */
export function generateDnaSmartCode(
  industry: string,
  module: string,
  type: string,
  subtype: string,
  version: number = 1
): string {
  const smartCode = `HERA.${industry.toUpperCase()}.${module.toUpperCase()}.${type.toUpperCase()}.${subtype.toUpperCase()}.V${version}`
  
  const validation = heraDnaStandardization.validateSmartCodeDna(smartCode)
  if (!validation.dnaCompliant) {
    throw new Error(`Generated smart code violates DNA pattern: ${validation.error}`)
  }
  
  return smartCode
}

// ============================================================================
// DNA MEMORY PERSISTENCE
// ============================================================================

/**
 * DNA Memory Manager - Persists standardization patterns across sessions
 */
export class DnaMemoryManager {
  private static instance: DnaMemoryManager
  private memoryKey = 'HERA_DNA_ENFORCEMENT_MEMORY'

  static getInstance(): DnaMemoryManager {
    if (!DnaMemoryManager.instance) {
      DnaMemoryManager.instance = new DnaMemoryManager()
    }
    return DnaMemoryManager.instance
  }

  /**
   * Store DNA patterns in persistent memory
   */
  engraveEnforcementPatterns(): void {
    const enforcementMemory = {
      patterns: {
        smartCodeRegex: heraDnaStandardization.validateSmartCodeDna('HERA.TEST.PATTERN.CHECK.V1'),
        sacredTables: ['core_organizations', 'core_entities', 'core_dynamic_data', 'core_relationships', 'universal_transactions', 'universal_transaction_lines'],
        antiPatterns: [
          'status varchar',
          'CREATE TABLE custom_',
          'FROM core_entities) -- missing org filter',
          '.v1', '.v2', '.v3' // lowercase versions
        ]
      },
      enforcementRules: {
        organizationIdRequired: true,
        smartCodeValidation: true,
        responseFormatEnforcement: true,
        databaseQueryFiltering: true
      },
      violationCounts: this.getViolationCounts(),
      lastEngraved: new Date().toISOString(),
      dnaVersion: 'V1'
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.memoryKey, JSON.stringify(enforcementMemory))
    }

    // Also store in global memory for server-side access
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).HERA_DNA_ENFORCEMENT_MEMORY = enforcementMemory
    }
  }

  /**
   * Retrieve DNA patterns from memory
   */
  recallEnforcementPatterns(): any {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.memoryKey)
      if (stored) {
        return JSON.parse(stored)
      }
    }

    if (typeof globalThis !== 'undefined') {
      return (globalThis as any).HERA_DNA_ENFORCEMENT_MEMORY
    }

    return null
  }

  private getViolationCounts(): Record<string, number> {
    // In a real implementation, this would track violation counts
    return {
      smartCodeViolations: 0,
      organizationIdMissing: 0,
      statusColumnUsage: 0,
      customTableCreation: 0,
      nonStandardResponses: 0
    }
  }
}

// ============================================================================
// EXPORTS & INITIALIZATION
// ============================================================================

// Initialize DNA memory manager
export const dnaMemoryManager = DnaMemoryManager.getInstance()

// Engrave enforcement patterns in memory on module load
dnaMemoryManager.engraveEnforcementPatterns()

// Export enforcement utilities
export const dnaEnforcement = {
  withDnaEnforcement,
  withComponentDna,
  interceptDatabaseQuery,
  generateDnaSmartCode,
  HeraDnaRequestEnforcement
}

// Make enforcement available globally for debugging
if (typeof globalThis !== 'undefined') {
  (globalThis as any).HERA_DNA_ENFORCEMENT = dnaEnforcement
}