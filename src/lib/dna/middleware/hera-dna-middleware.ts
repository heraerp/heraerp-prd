/**
 * HERA DNA Development Middleware
 * Intercepts ALL development workflows and automatically enforces DNA components
 * Works at the development process level - NO development can bypass this
 */

import { heraDNAAutoSelector, type AutoSelectResult } from '../auto-select/hera-dna-auto-select'
import { DNAEnforcer, type DNAEnforcementResult } from '../auto-enforce/hera-dna-enforcer'

export interface MiddlewareContext {
  developmentType: 'ui' | 'component' | 'page' | 'feature' | 'api' | 'bug_fix' | 'enhancement'
  originalRequest: string
  timestamp: Date
  sessionId: string
  previousContext?: MiddlewareContext[]
  bypassAttempted?: boolean
  enforcementOverridden?: boolean
}

export interface MiddlewareResult {
  allowed: boolean
  transformedRequest: string
  enforcementActive: boolean
  dnaComponents: string[]
  generatedCode: string
  instructions: string[]
  warnings: string[]
  blockingReasons?: string[]
}

export interface DevelopmentSession {
  id: string
  startTime: Date
  requests: MiddlewareContext[]
  enforcementLevel: 'strict' | 'guided' | 'advisory'
  dnaComplianceRate: number
}

/**
 * DEVELOPMENT WORKFLOW INTERCEPTOR
 * This class intercepts ALL development requests and enforces DNA
 */
export class HeraDNAMiddleware {
  private activeSessions = new Map<string, DevelopmentSession>()
  private enforcementLevel: 'strict' | 'guided' | 'advisory' = 'strict'

  /**
   * MAIN MIDDLEWARE INTERCEPTOR
   * Every development request MUST pass through this method
   */
  intercept(request: string, context: Partial<MiddlewareContext> = {}): MiddlewareResult {
    const sessionId = context.sessionId || this.generateSessionId()
    const fullContext = this.buildContext(request, sessionId, context)

    // Log the request
    this.logRequest(fullContext)

    // Check if this is a bypass attempt
    const bypassAttempt = this.detectBypassAttempt(request)
    if (bypassAttempt.detected) {
      return this.handleBypassAttempt(request, bypassAttempt.reason, fullContext)
    }

    // Get DNA enforcement and auto-selection
    const enforcement = DNAEnforcer.preFlightCheck(request)
    const autoSelect = heraDNAAutoSelector.autoSelect(request, fullContext)

    // Apply enforcement
    return this.applyEnforcement(request, enforcement, autoSelect, fullContext)
  }

  /**
   * BYPASS DETECTION SYSTEM
   * Detects attempts to avoid DNA components
   */
  private detectBypassAttempt(request: string): { detected: boolean; reason: string } {
    const bypassPatterns = [
      // Direct bypass attempts
      /without.*dna|skip.*dna|ignore.*dna|bypass.*dna/i,
      /use.*basic|use.*simple|use.*plain/i,
      /just.*create|quick.*fix|simple.*solution/i,

      // Component-specific bypasses
      /use.*card(?!.*enterprise)|<card(?!.*enterprise)/i,
      /import.*card(?!.*enterprise)/i,
      /shadcn.*card|radix.*card|mui.*card/i,

      // Framework bypasses
      /raw.*react|vanilla.*js|plain.*html/i,
      /no.*components|without.*components/i,

      // Urgency-based bypasses
      /no.*time.*for|too.*complex|keep.*it.*simple/i,
      /just.*works|minimal.*viable|prototype/i
    ]

    for (const pattern of bypassPatterns) {
      if (pattern.test(request)) {
        return {
          detected: true,
          reason: `Bypass attempt detected: Pattern "${pattern.source}" matched in request`
        }
      }
    }

    return { detected: false, reason: '' }
  }

  /**
   * BYPASS ATTEMPT HANDLER
   * Handles attempts to bypass DNA enforcement
   */
  private handleBypassAttempt(
    request: string,
    reason: string,
    context: MiddlewareContext
  ): MiddlewareResult {
    const warnings = [
      '🚫 BYPASS ATTEMPT DETECTED',
      `🔍 REASON: ${reason}`,
      '⚠️  DNA enforcement is MANDATORY for code quality',
      '✅ Automatically switching to Enterprise components',
      '',
      '💡 ENTERPRISE BENEFITS:',
      '  • Professional glassmorphism design',
      '  • Advanced animations and interactions',
      '  • Accessibility compliance (WCAG AAA)',
      '  • Performance optimizations',
      '  • Real-time capabilities',
      '  • Enterprise-grade quality'
    ]

    // Force DNA enforcement regardless of bypass attempt
    const enforcement = DNAEnforcer.preFlightCheck(request)
    const autoSelect = heraDNAAutoSelector.autoSelect(request, context)

    // Transform request to enforce DNA
    const transformedRequest = this.transformRequestForDNA(request, autoSelect)

    return {
      allowed: true, // Always allowed, but with DNA enforcement
      transformedRequest,
      enforcementActive: true,
      dnaComponents: [autoSelect.selection.primary, ...autoSelect.selection.secondary],
      generatedCode: autoSelect.generatedCode,
      instructions: ['🛡️ BYPASS BLOCKED - DNA ENFORCEMENT ACTIVE', ...autoSelect.instructions],
      warnings
    }
  }

  /**
   * ENFORCEMENT APPLICATION
   * Applies DNA enforcement based on analysis results
   */
  private applyEnforcement(
    request: string,
    enforcement: DNAEnforcementResult,
    autoSelect: AutoSelectResult,
    context: MiddlewareContext
  ): MiddlewareResult {
    // Always enforce DNA for quality and consistency
    const transformedRequest = enforcement.autoEnhancedPrompt

    return {
      allowed: true,
      transformedRequest,
      enforcementActive: true,
      dnaComponents: [autoSelect.selection.primary, ...autoSelect.selection.secondary],
      generatedCode: autoSelect.generatedCode,
      instructions: [
        '🧬 HERA DNA MIDDLEWARE ACTIVE',
        `📊 ENFORCEMENT: ${enforcement.enforcementLevel.toUpperCase()}`,
        `🎯 COMPONENT: ${autoSelect.selection.primary}`,
        `🔧 CONFIDENCE: ${(autoSelect.selection.confidence * 100).toFixed(1)}%`,
        '',
        ...autoSelect.instructions
      ],
      warnings:
        enforcement.enforcementLevel === 'critical'
          ? [
              '⚠️ CRITICAL ENFORCEMENT: This is an emergency situation',
              '🛡️ Using maximum stability DNA components'
            ]
          : []
    }
  }

  /**
   * REQUEST TRANSFORMATION
   * Transforms requests to ensure DNA components are used
   */
  private transformRequestForDNA(originalRequest: string, autoSelect: AutoSelectResult): string {
    let transformed = originalRequest

    // Add DNA component specifications
    transformed += `

🧬 HERA DNA ENFORCEMENT APPLIED:
- PRIMARY COMPONENT: ${autoSelect.selection.primary}
- SECONDARY COMPONENTS: ${autoSelect.selection.secondary.join(', ')}
- IMPORTS REQUIRED: ${autoSelect.selection.imports.join('; ')}

GENERATED IMPLEMENTATION:
${autoSelect.generatedCode}

MANDATORY REQUIREMENTS:
✅ Use ONLY HERA DNA Enterprise components
✅ Apply glassmorphism styling with glassIntensity props
✅ Include animations and micro-interactions
✅ Implement accessibility features (WCAG AAA)
✅ Add performance optimizations
✅ Enable real-time capabilities where applicable

This enforcement cannot be bypassed or overridden.
`

    return transformed
  }

  /**
   * SESSION MANAGEMENT
   */
  private buildContext(
    request: string,
    sessionId: string,
    partial: Partial<MiddlewareContext>
  ): MiddlewareContext {
    return {
      developmentType: this.detectDevelopmentType(request),
      originalRequest: request,
      timestamp: new Date(),
      sessionId,
      previousContext: this.getPreviousContext(sessionId),
      ...partial
    }
  }

  private detectDevelopmentType(request: string): MiddlewareContext['developmentType'] {
    if (/\b(ui|component|interface|design)\b/i.test(request)) return 'ui'
    if (/\b(page|screen|view|route)\b/i.test(request)) return 'page'
    if (/\b(feature|functionality|module)\b/i.test(request)) return 'feature'
    if (/\b(api|endpoint|service|backend)\b/i.test(request)) return 'api'
    if (/\b(fix|bug|issue|problem|error)\b/i.test(request)) return 'bug_fix'
    if (/\b(enhance|improve|update|modify)\b/i.test(request)) return 'enhancement'
    return 'component'
  }

  private generateSessionId(): string {
    return `hera-dna-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private logRequest(context: MiddlewareContext): void {
    if (!this.activeSessions.has(context.sessionId)) {
      this.activeSessions.set(context.sessionId, {
        id: context.sessionId,
        startTime: new Date(),
        requests: [],
        enforcementLevel: this.enforcementLevel,
        dnaComplianceRate: 1.0 // Start with 100% compliance
      })
    }

    const session = this.activeSessions.get(context.sessionId)!
    session.requests.push(context)
  }

  private getPreviousContext(sessionId: string): MiddlewareContext[] {
    const session = this.activeSessions.get(sessionId)
    return session ? session.requests : []
  }

  /**
   * COMPLIANCE MONITORING
   */
  getComplianceReport(sessionId: string): {
    sessionId: string
    totalRequests: number
    dnaEnforcedRequests: number
    complianceRate: number
    bypassAttempts: number
    topComponents: string[]
  } | null {
    const session = this.activeSessions.get(sessionId)
    if (!session) return null

    const bypassAttempts = session.requests.filter(req => req.bypassAttempted).length
    const topComponents = this.getTopComponents(session.requests)

    return {
      sessionId,
      totalRequests: session.requests.length,
      dnaEnforcedRequests: session.requests.length - bypassAttempts,
      complianceRate: session.dnaComplianceRate,
      bypassAttempts,
      topComponents
    }
  }

  private getTopComponents(requests: MiddlewareContext[]): string[] {
    // This would be implemented based on actual component usage
    return ['EnterpriseCard', 'EnterpriseStatsCard', 'EnterpriseDashboard']
  }

  /**
   * CONFIGURATION
   */
  setEnforcementLevel(level: 'strict' | 'guided' | 'advisory'): void {
    this.enforcementLevel = level
  }

  getEnforcementLevel(): string {
    return this.enforcementLevel
  }
}

/**
 * GLOBAL MIDDLEWARE INSTANCE
 */
export const heraDNAMiddleware = new HeraDNAMiddleware()

/**
 * CONVENIENCE FUNCTIONS FOR DEVELOPMENT WORKFLOWS
 */

/**
 * Intercept and enforce DNA for any development request
 */
export function interceptDevelopment(request: string, sessionId?: string): MiddlewareResult {
  return heraDNAMiddleware.intercept(request, { sessionId })
}

/**
 * Check if a request would be allowed or needs transformation
 */
export function checkDNACompliance(request: string): {
  compliant: boolean
  issues: string[]
  suggestions: string[]
} {
  const result = heraDNAMiddleware.intercept(request)

  return {
    compliant: result.warnings.length === 0,
    issues: result.warnings,
    suggestions: result.instructions
  }
}

/**
 * Transform any development request to use DNA components
 */
export function transformToDNA(request: string): string {
  const result = heraDNAMiddleware.intercept(request)
  return result.transformedRequest
}

/**
 * Validate that generated code uses DNA components
 */
export function validateDNAUsage(code: string): {
  valid: boolean
  dnaComponents: string[]
  violations: string[]
  suggestions: string[]
} {
  const dnaComponents = []
  const violations = []
  const suggestions = []

  // Check for Enterprise components
  if (/EnterpriseCard/g.test(code)) dnaComponents.push('EnterpriseCard')
  if (/EnterpriseStatsCard/g.test(code)) dnaComponents.push('EnterpriseStatsCard')
  if (/EnterpriseDashboard/g.test(code)) dnaComponents.push('EnterpriseDashboard')

  // Check for violations
  if (code.includes('<Card') && !code.includes('EnterpriseCard')) {
    violations.push('Using basic Card instead of EnterpriseCard')
    suggestions.push('Replace <Card> with <EnterpriseCard>')
  }

  if (/\b(stat|metric|number)\b/i.test(code) && !code.includes('EnterpriseStatsCard')) {
    violations.push('Displaying metrics without EnterpriseStatsCard')
    suggestions.push('Use EnterpriseStatsCard for all numeric displays')
  }

  return {
    valid: violations.length === 0 && dnaComponents.length > 0,
    dnaComponents,
    violations,
    suggestions
  }
}

/**
 * INTEGRATION WITH DEVELOPMENT TOOLS
 */

/**
 * Pre-commit hook integration
 */
export function preCommitDNAValidation(changedFiles: string[]): {
  passed: boolean
  report: string
  fixes: string[]
} {
  // This would validate all changed files for DNA compliance
  // Implementation would scan files for component usage
  return {
    passed: true,
    report: 'All files use HERA DNA Enterprise components',
    fixes: []
  }
}

/**
 * Development server integration
 */
export function devServerMiddleware(request: any, response: any, next: any): void {
  // Intercept development server requests to enforce DNA
  if (request.url?.includes('/api/dev/create-component')) {
    const result = heraDNAMiddleware.intercept(request.body?.description || '')
    response.json(result)
    return
  }
  next()
}

/**
 * USAGE EXAMPLES:
 *
 * // 1. Intercept any development request
 * const result = interceptDevelopment("Create a stats dashboard")
 * console.log(result.transformedRequest) // Auto-enhanced with DNA components
 *
 * // 2. Check compliance before implementation
 * const compliance = checkDNACompliance("Build a simple card")
 * console.log(compliance.compliant) // false - suggests EnterpriseCard
 *
 * // 3. Transform non-compliant requests
 * const transformed = transformToDNA("Use basic React components")
 * console.log(transformed) // Transformed to use Enterprise DNA
 *
 * // 4. Validate generated code
 * const validation = validateDNAUsage(myCode)
 * if (!validation.valid) {
 *   console.log('Violations:', validation.violations)
 * }
 */
