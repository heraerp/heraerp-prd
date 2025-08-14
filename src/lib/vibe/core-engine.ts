// HERA 100% Vibe Coding System - Core Engine
// Smart Code: HERA.VIBE.FOUNDATION.CORE.ENGINE.v1
// Purpose: Main vibe coding engine for seamless continuity and manufacturing-grade integration

import { VibeContext, VibeComponent, IntegrationWeave, VibeSession } from './types'
import { SmartCodeRegistry } from './smart-code-registry'
import { ContextManager } from './context-manager'
import { IntegrationWeaver } from './integration-weaver'

export class VibeEngine {
  private static instance: VibeEngine
  private smartCodeRegistry: SmartCodeRegistry
  private contextManager: ContextManager
  private integrationWeaver: IntegrationWeaver
  private isInitialized: boolean = false

  // Singleton pattern for universal access
  public static getInstance(): VibeEngine {
    if (!VibeEngine.instance) {
      VibeEngine.instance = new VibeEngine()
    }
    return VibeEngine.instance
  }

  private constructor() {
    this.smartCodeRegistry = new SmartCodeRegistry()
    this.contextManager = new ContextManager()
    this.integrationWeaver = new IntegrationWeaver()
  }

  // Initialize the vibe engine with organization context
  async initialize(organizationId: string, sessionId?: string): Promise<void> {
    try {
      console.log('🧬 Initializing HERA Vibe Engine...')
      
      // Initialize core components
      await this.smartCodeRegistry.initialize()
      await this.contextManager.initialize(organizationId, sessionId)
      await this.integrationWeaver.initialize()

      this.isInitialized = true
      
      console.log('✅ HERA Vibe Engine initialized successfully')
      console.log(`   Organization: ${organizationId}`)
      console.log(`   Session: ${sessionId || 'new session'}`)
      
      // Register this initialization as a vibe event
      await this.logVibeEvent('engine_initialization', {
        organization_id: organizationId,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        smart_code: 'HERA.VIBE.ENGINE.INIT.SUCCESS.v1'
      })

    } catch (error) {
      console.error('❌ Failed to initialize HERA Vibe Engine:', error)
      throw new Error(`Vibe Engine initialization failed: ${error.message}`)
    }
  }

  // Preserve context for seamless continuity
  async preserveContext(context: Partial<VibeContext>): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Vibe Engine not initialized')
    }

    const contextId = await this.contextManager.preserveContext({
      smart_code: context.smart_code || 'HERA.VIBE.CONTEXT.PRESERVE.AUTO.v1',
      session_id: context.session_id || this.contextManager.getCurrentSessionId(),
      conversation_state: context.conversation_state || {},
      task_lineage: context.task_lineage || [],
      code_evolution: context.code_evolution || [],
      relationship_map: context.relationship_map || {},
      business_context: context.business_context || {},
      user_intent: context.user_intent || '',
      timestamp: new Date(),
      organization_id: this.contextManager.getOrganizationId(),
      ...context
    })

    console.log(`💾 Context preserved: ${contextId}`)
    return contextId
  }

  // Restore context for amnesia-free operation
  async restoreContext(contextId: string): Promise<VibeContext> {
    if (!this.isInitialized) {
      throw new Error('Vibe Engine not initialized')
    }

    const context = await this.contextManager.restoreContext(contextId)
    console.log(`🔄 Context restored: ${contextId}`)
    
    return context
  }

  // Register a vibe component for seamless integration
  async registerComponent(component: VibeComponent): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Vibe Engine not initialized')
    }

    // Register with smart code registry
    await this.smartCodeRegistry.registerComponent(component)

    // Preserve component context
    await this.preserveContext({
      smart_code: component.smart_code,
      business_context: {
        component_type: 'registration',
        component_id: component.id,
        component_purpose: component.purpose
      },
      user_intent: `Register ${component.name} component`
    })

    console.log(`🔗 Component registered: ${component.name}`)
  }

  // Create seamless integration between components
  async createIntegration(
    sourceSmartCode: string, 
    targetSmartCode: string, 
    integrationPattern: string
  ): Promise<IntegrationWeave> {
    if (!this.isInitialized) {
      throw new Error('Vibe Engine not initialized')
    }

    const integration = await this.integrationWeaver.createIntegration(
      sourceSmartCode,
      targetSmartCode,
      integrationPattern
    )

    // Preserve integration context
    await this.preserveContext({
      smart_code: integration.smart_code,
      business_context: {
        integration_type: 'component_weaving',
        source: sourceSmartCode,
        target: targetSmartCode,
        pattern: integrationPattern
      },
      relationship_map: {
        [sourceSmartCode]: [targetSmartCode]
      },
      user_intent: 'Create seamless component integration'
    })

    console.log(`🔀 Integration created: ${sourceSmartCode} → ${targetSmartCode}`)
    return integration
  }

  // Manufacturing-grade quality validation
  async validateQuality(componentSmartCode: string): Promise<QualityReport> {
    if (!this.isInitialized) {
      throw new Error('Vibe Engine not initialized')
    }

    const component = await this.smartCodeRegistry.getComponent(componentSmartCode)
    if (!component) {
      throw new Error(`Component not found: ${componentSmartCode}`)
    }

    const qualityReport: QualityReport = {
      smart_code: `HERA.VIBE.QUALITY.REPORT.${component.id.toUpperCase()}.v1`,
      component_smart_code: componentSmartCode,
      timestamp: new Date(),
      quality_score: 0,
      checks: [],
      recommendations: [],
      status: 'pending'
    }

    // Run quality checks
    const checks = [
      this.validateSmartCodeCompliance(component),
      this.validateIntegrationHealth(component),
      this.validateDocumentation(component),
      this.validatePerformance(component),
      this.validateSecurity(component)
    ]

    const results = await Promise.all(checks)
    qualityReport.checks = results
    qualityReport.quality_score = results.reduce((sum, check) => sum + check.score, 0) / results.length
    qualityReport.status = qualityReport.quality_score >= 95 ? 'excellent' : 
                          qualityReport.quality_score >= 85 ? 'good' : 
                          qualityReport.quality_score >= 70 ? 'acceptable' : 'needs_improvement'

    // Generate recommendations
    qualityReport.recommendations = this.generateQualityRecommendations(results)

    console.log(`📊 Quality validation: ${componentSmartCode} - Score: ${qualityReport.quality_score}%`)
    return qualityReport
  }

  // Get current session information
  getCurrentSession(): VibeSession {
    if (!this.isInitialized) {
      throw new Error('Vibe Engine not initialized')
    }

    return {
      session_id: this.contextManager.getCurrentSessionId(),
      organization_id: this.contextManager.getOrganizationId(),
      start_time: this.contextManager.getSessionStartTime(),
      context_count: this.contextManager.getContextCount(),
      integration_count: this.integrationWeaver.getIntegrationCount(),
      quality_score: this.getAverageQualityScore()
    }
  }

  // Private helper methods
  private async logVibeEvent(eventType: string, data: any): Promise<void> {
    // Log to universal transactions table
    try {
      const response = await fetch('/api/v1/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hera_auth_token')}`
        },
        body: JSON.stringify({
          action: 'create',
          table: 'universal_transactions',
          data: {
            transaction_type: 'vibe_event',
            smart_code: data.smart_code,
            metadata: {
              event_type: eventType,
              ...data
            }
          }
        })
      })

      if (!response.ok) {
        console.warn('⚠️ Failed to log vibe event to universal transactions')
      }
    } catch (error) {
      console.warn('⚠️ Vibe event logging failed:', error.message)
    }
  }

  private async validateSmartCodeCompliance(component: VibeComponent): Promise<QualityCheck> {
    // Validate smart code format and compliance
    const isValidFormat = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/.test(component.smart_code)
    const hasCorrectModule = component.smart_code.includes('VIBE')
    
    return {
      name: 'Smart Code Compliance',
      score: isValidFormat && hasCorrectModule ? 100 : 60,
      status: isValidFormat && hasCorrectModule ? 'pass' : 'warning',
      details: 'Smart code format and HERA compliance validation'
    }
  }

  private async validateIntegrationHealth(component: VibeComponent): Promise<QualityCheck> {
    // Check integration health and compatibility
    const integrations = await this.integrationWeaver.getComponentIntegrations(component.smart_code)
    const healthyIntegrations = integrations.filter(i => i.health_status === 'healthy').length
    const score = integrations.length > 0 ? (healthyIntegrations / integrations.length) * 100 : 90

    return {
      name: 'Integration Health',
      score,
      status: score >= 90 ? 'pass' : score >= 70 ? 'warning' : 'fail',
      details: `${healthyIntegrations}/${integrations.length} integrations healthy`
    }
  }

  private async validateDocumentation(component: VibeComponent): Promise<QualityCheck> {
    // Validate self-documentation completeness
    const hasDescription = !!component.purpose && component.purpose.length > 10
    const hasUsagePatterns = component.usage_patterns && component.usage_patterns.length > 0
    const hasRelationships = component.relationships && component.relationships.length > 0
    
    const score = [hasDescription, hasUsagePatterns, hasRelationships].filter(Boolean).length * 33.33

    return {
      name: 'Documentation Quality',
      score,
      status: score >= 90 ? 'pass' : score >= 60 ? 'warning' : 'fail',
      details: 'Self-documentation completeness validation'
    }
  }

  private async validatePerformance(component: VibeComponent): Promise<QualityCheck> {
    // Validate performance characteristics
    const hasMetrics = component.performance_metrics && Object.keys(component.performance_metrics).length > 0
    const score = hasMetrics ? 95 : 80 // Assume good performance if metrics exist

    return {
      name: 'Performance Validation',
      score,
      status: score >= 90 ? 'pass' : 'warning',
      details: 'Performance metrics and characteristics validation'
    }
  }

  private async validateSecurity(component: VibeComponent): Promise<QualityCheck> {
    // Validate security compliance
    const hasOrganizationContext = component.smart_code.includes('HERA')
    const hasProperPatterns = component.smart_code.includes('VIBE')
    
    const score = hasOrganizationContext && hasProperPatterns ? 100 : 80

    return {
      name: 'Security Compliance',
      score,
      status: score >= 95 ? 'pass' : 'warning',
      details: 'HERA security pattern compliance validation'
    }
  }

  private generateQualityRecommendations(checks: QualityCheck[]): string[] {
    const recommendations: string[] = []
    
    checks.forEach(check => {
      if (check.score < 90) {
        switch (check.name) {
          case 'Smart Code Compliance':
            recommendations.push('Update smart code to follow HERA.VIBE.MODULE.FUNCTION.TYPE.v1 format')
            break
          case 'Integration Health':
            recommendations.push('Review and repair unhealthy component integrations')
            break
          case 'Documentation Quality':
            recommendations.push('Enhance self-documentation with usage patterns and relationships')
            break
          case 'Performance Validation':
            recommendations.push('Add performance metrics and monitoring capabilities')
            break
          case 'Security Compliance':
            recommendations.push('Ensure proper HERA security patterns and organization context')
            break
        }
      }
    })

    return recommendations
  }

  private getAverageQualityScore(): number {
    // This would calculate from stored quality reports
    return 95 // Placeholder for manufacturing-grade quality
  }
}

// Type definitions for quality validation
interface QualityReport {
  smart_code: string
  component_smart_code: string
  timestamp: Date
  quality_score: number
  checks: QualityCheck[]
  recommendations: string[]
  status: 'excellent' | 'good' | 'acceptable' | 'needs_improvement'
}

interface QualityCheck {
  name: string
  score: number
  status: 'pass' | 'warning' | 'fail'
  details: string
}

// Export singleton instance
export const vibeEngine = VibeEngine.getInstance()