/**
 * HERA DNA Auto-Enforcement System
 * Main entry point for guaranteed enterprise component usage
 *
 * This system GUARANTEES HERA DNA Enterprise components are used in ALL scenarios:
 * - Regular development
 * - Emergency situations (firefighting)
 * - Mid-development changes
 * - Follow-up requests
 * - Any timing or context
 */

// Core Enforcement System
export {
  analyzeBuildRequest,
  preFlightDNACheck,
  getDNAInstructions,
  DNAEnforcer,
  type BuildContext,
  type DNAEnforcementResult,
  DNA_ENFORCEMENT_RULES
} from './auto-enforce/hera-dna-enforcer'

// Auto-Selection Intelligence
export {
  HeraDNAAutoSelector,
  heraDNAAutoSelector,
  autoSelectComponents,
  getEnterpriseComponents,
  generateEnterpriseCode,
  createFullEnforcementResult,
  type AutoSelectContext,
  type ComponentSelection,
  type AutoSelectResult
} from './auto-select/hera-dna-auto-select'

// Middleware & Workflow Integration
export {
  HeraDNAMiddleware,
  heraDNAMiddleware,
  interceptDevelopment,
  checkDNACompliance,
  transformToDNA,
  validateDNAUsage,
  preCommitDNAValidation,
  devServerMiddleware,
  type MiddlewareContext,
  type MiddlewareResult
} from './middleware/hera-dna-middleware'

// Hooks & Git Integration
export {
  HeraDNAHooks,
  heraDNAHooks,
  setupGitHooks,
  validateFileDNA,
  validateProjectDNA,
  autoFixDNA,
  packageJsonScripts,
  cicdIntegration,
  DNA_VALIDATION_RULES,
  type HookContext,
  type HookResult,
  type DNAValidationRule
} from './hooks/hera-dna-hooks'

// Enterprise Components (Core DNA)
export { EnterpriseCard } from './components/enterprise/EnterpriseCard'
export { EnterpriseStatsCard } from './components/enterprise/EnterpriseStatsCard'
export { EnterpriseDashboard } from './components/enterprise/EnterpriseDashboard'

// Layout Components
export { HeraSidebar, HERA_SIDEBAR_DNA } from './components/layout/hera-sidebar-dna'
export type {
  HeraSidebarProps,
  HeraSidebarConfig,
  HeraSidebarNavItem,
  HeraSidebarApp
} from './components/layout/hera-sidebar-dna'

// Financial Module Components
export { GLModule, GL_MODULE_DNA } from './modules/financial/gl-module-dna'
export type { GLModuleProps } from './modules/financial/gl-module-dna'

export { APModule, AP_MODULE_DNA } from './modules/financial/ap-module-dna'
export type { APModuleProps } from './modules/financial/ap-module-dna'

export { ARModule, AR_MODULE_DNA } from './modules/financial/ar-module-dna'
export type { ARModuleProps } from './modules/financial/ar-module-dna'

export { FAModule, FA_MODULE_DNA } from './modules/financial/fa-module-dna'
export type { FAModuleProps } from './modules/financial/fa-module-dna'

/**
 * CONVENIENCE FUNCTIONS
 * Use these for immediate DNA enforcement in any context
 */

/**
 * Universal DNA Enforcement Function
 * Works for ANY development request, ANY timing, ANY context
 *
 * @param userRequest - Any development request (string)
 * @param context - Optional context information
 * @returns Complete enforcement result with code and instructions
 */
export function universalDNAEnforcement(
  userRequest: string,
  context: { urgency?: 'low' | 'medium' | 'high' | 'critical' | 'firefight' } = {}
) {
  // Import locally to avoid circular dependencies
  const { createFullEnforcementResult } = require('./auto-select/hera-dna-auto-select')
  const { interceptDevelopment } = require('./middleware/hera-dna-middleware')

  // Get comprehensive enforcement result
  const fullResult = createFullEnforcementResult(userRequest)

  // Get middleware result for workflow integration
  const middlewareResult = interceptDevelopment(userRequest)

  return {
    // Original enforcement data
    ...fullResult,

    // Middleware integration
    workflowIntegration: {
      allowed: middlewareResult.allowed,
      transformedRequest: middlewareResult.transformedRequest,
      enforcementActive: middlewareResult.enforcementActive,
      warnings: middlewareResult.warnings
    },

    // Convenience accessors
    primaryComponent: fullResult.autoSelect.selection.primary,
    generatedCode: fullResult.autoSelect.generatedCode,
    isEmergency: context.urgency === 'firefight' || context.urgency === 'critical',
    isMandatory:
      fullResult.enforcement.enforcementLevel === 'mandatory' ||
      fullResult.enforcement.enforcementLevel === 'critical',

    // Quick usage instructions
    quickStart: {
      imports: fullResult.autoSelect.selection.imports,
      component: fullResult.autoSelect.selection.primary,
      usage: fullResult.autoSelect.selection.usage,
      confidence: `${(fullResult.autoSelect.selection.confidence * 100).toFixed(1)}%`
    }
  }
}

/**
 * Emergency DNA Enforcement
 * For firefighting and critical situations
 * Maximum stability and reliability components
 */
export function emergencyDNAEnforcement(userRequest: string) {
  return universalDNAEnforcement(userRequest, { urgency: 'firefight' })
}

/**
 * Quick DNA Component Selection
 * Returns just the component information for immediate use
 */
export function quickDNASelect(userRequest: string): {
  component: string
  code: string
  imports: string[]
  confidence: number
} {
  const {
    getEnterpriseComponents,
    generateEnterpriseCode
  } = require('./auto-select/hera-dna-auto-select')

  const selection = getEnterpriseComponents(userRequest)
  const code = generateEnterpriseCode(userRequest)

  return {
    component: selection.primary,
    code: code,
    imports: selection.imports,
    confidence: selection.confidence
  }
}

/**
 * Setup Complete DNA System
 * One-command setup for entire enforcement system
 */
export function setupCompleteDNASystem(projectPath: string = process.cwd()) {
  const { setupGitHooks } = require('./hooks/hera-dna-hooks')

  console.log('🧬 Setting up complete HERA DNA Auto-Enforcement System...\n')

  // Setup Git hooks
  setupGitHooks(projectPath)

  console.log('✅ Git hooks installed (pre-commit, pre-push, pre-build)')
  console.log('✅ Validation rules configured')
  console.log('✅ Middleware integration active')
  console.log('✅ Auto-selection system ready')
  console.log('✅ Emergency enforcement protocols enabled')

  console.log('\n🎯 System Features:')
  console.log('  • Automatic component selection based on context')
  console.log('  • Emergency/firefight mode with maximum stability')
  console.log('  • Bypass attempt detection and blocking')
  console.log('  • Real-time validation and auto-fixes')
  console.log('  • CI/CD pipeline integration ready')
  console.log('  • Professional glassmorphism design guaranteed')

  console.log('\n🚀 HERA DNA Auto-Enforcement System is now active!')
  console.log('   All development will automatically use Enterprise components.\n')

  return {
    installed: true,
    features: [
      'Auto-component selection',
      'Emergency mode enforcement',
      'Bypass prevention',
      'Git hooks integration',
      'Real-time validation',
      'Professional design guarantee'
    ]
  }
}

// Default export for convenience
export default {
  // Main functions
  universalDNAEnforcement,
  emergencyDNAEnforcement,
  quickDNASelect,
  setupCompleteDNASystem,

  // System components
  DNAEnforcer: require('./auto-enforce/hera-dna-enforcer').DNAEnforcer,
  autoSelector: require('./auto-select/hera-dna-auto-select').heraDNAAutoSelector,
  middleware: require('./middleware/hera-dna-middleware').heraDNAMiddleware,
  hooks: require('./hooks/hera-dna-hooks').heraDNAHooks
}
