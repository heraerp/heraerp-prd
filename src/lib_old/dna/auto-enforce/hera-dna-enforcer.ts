/**
 * HERA DNA Auto-Enforcer System
 * Automatically enforces HERA DNA Enterprise components in ALL development
 * Works regardless of prompt timing, urgency, or context
 */

export interface BuildContext {
  type: 'ui' | 'component' | 'page' | 'feature' | 'api' | 'emergency' | 'unknown'
  urgency: 'low' | 'medium' | 'high' | 'critical' | 'firefight'
  hasUIElements: boolean
  userPrompt: string
  timestamp: Date
}

export interface DNAEnforcementResult {
  shouldUseDNA: boolean
  reason: string
  recommendedComponents: string[]
  enforcementLevel: 'optional' | 'recommended' | 'mandatory' | 'critical'
  autoEnhancedPrompt: string
}

/**
 * SACRED DNA ENFORCEMENT RULES
 * These rules CANNOT be bypassed under any circumstances
 */
const SACRED_DNA_RULES = {
  // Rule 1: ANY UI work MUST use DNA
  uiRequiresRNA: {
    patterns: [
      /\b(ui|component|interface|dashboard|form|card|button|modal|page)\b/i,
      /\b(react|next|tsx|jsx)\b/i,
      /\b(create|build|design|implement|develop)\b/i,
      /\b(stats|metrics|analytics|chart|graph|table)\b/i
    ],
    enforcement: 'mandatory' as const,
    reason: 'UI development detected - DNA components are mandatory'
  },

  // Rule 2: Emergency/Firefight gets DNA for stability
  emergencyGetsDNA: {
    patterns: [
      /\b(urgent|emergency|critical|firefight|asap|immediately|fix|bug|broken)\b/i,
      /\b(production|live|down|failing|error)\b/i
    ],
    enforcement: 'critical' as const,
    reason: 'Emergency situation - DNA components provide maximum stability'
  },

  // Rule 3: ANY development work gets DNA by default
  allDevelopmentGetsDNA: {
    patterns: [
      /\b(add|create|build|implement|develop|make|generate|setup)\b/i,
      /\b(feature|functionality|module|system)\b/i
    ],
    enforcement: 'recommended' as const,
    reason: 'Development work detected - DNA components recommended for consistency'
  }
}

/**
 * Component mapping from traditional to DNA Enterprise
 */
const DNA_COMPONENT_MAPPING = {
  // Traditional -> DNA Enterprise
  Card: 'EnterpriseCard',
  StatsCard: 'EnterpriseStatsCard',
  Dashboard: 'EnterpriseDashboard components',
  Button: 'EnterpriseCard with interactive props',
  Modal: 'EnterpriseCard with modal variants',
  Form: 'EnterpriseCard with form layouts',
  Table: 'EnterpriseCard with table variants',
  Chart: 'ChartPlaceholder with enterprise styling',
  Metric: 'MetricTile or EnterpriseStatsCard',
  KPI: 'KPICard',
  Progress: 'ProgressIndicator',
  Activity: 'ActivityItem',

  // Patterns to components
  stats: 'EnterpriseStatsCard with live updates',
  analytics: 'EnterpriseDashboard with KPI cards',
  dashboard: 'Complete EnterpriseDashboard suite',
  metrics: 'EnterpriseStatsCard with sparklines',
  realtime: 'EnterpriseStatsCard with live prop',
  'data visualization': 'EnterpriseStatsCard + ChartPlaceholder',
  'business intelligence': 'Full EnterpriseDashboard implementation'
}

/**
 * Auto-enhancement templates for common requests
 */
const AUTO_ENHANCEMENT_TEMPLATES = {
  emergency: `
EMERGENCY PROTOCOL ACTIVATED - Using HERA DNA Enterprise Components for maximum stability:
- EnterpriseCard with error handling and loading states
- Professional glassmorphism for visual clarity under pressure
- Performance-optimized components for reliability
- Accessibility built-in for inclusive emergency responses
Original request: {originalPrompt}
`,

  dashboard: `
DASHBOARD REQUEST ENHANCED - Full Enterprise Dashboard Suite:
- EnterpriseStatsCard with real-time updates and sparklines
- KPICard components with trend analysis
- DashboardSection with collapsible organization
- ActivityItem components for user engagement
- Professional glassmorphism with enterprise color schemes
Enhanced request: {originalPrompt}
`,

  stats: `
STATISTICS REQUEST ENHANCED - Advanced Metrics Display:
- EnterpriseStatsCard with live data capabilities
- Multiple formatting options (currency, percentage, compact)
- Built-in trend calculation and sparkline visualization
- Professional tooltips and expandable descriptions
- Real-time updates with smooth animations
Enhanced request: {originalPrompt}
`,

  form: `
FORM REQUEST ENHANCED - Enterprise Form Components:
- EnterpriseCard as form containers with validation states
- Professional glassmorphism for form fields
- Advanced error handling and loading states
- Accessibility-compliant form interactions
Enhanced request: {originalPrompt}
`,

  general: `
REQUEST AUTO-ENHANCED - HERA DNA Enterprise Components:
- Professional glassmorphism design system
- Advanced animations and micro-interactions
- Performance optimizations and accessibility
- Enterprise-grade component architecture
Enhanced request: {originalPrompt}
`
}

/**
 * Analyze build context and determine DNA enforcement
 */
export function analyzeBuildRequest(
  userPrompt: string,
  urgency: 'low' | 'medium' | 'high' | 'critical' | 'firefight' = 'medium'
): DNAEnforcementResult {
  const context: BuildContext = {
    type: detectRequestType(userPrompt),
    urgency,
    hasUIElements: detectUIElements(userPrompt),
    userPrompt,
    timestamp: new Date()
  }

  // Apply SACRED DNA RULES (cannot be bypassed)
  let enforcementLevel: DNAEnforcementResult['enforcementLevel'] = 'optional'
  let reason = 'Default DNA enforcement'
  let shouldUseDNA = true // DEFAULT: Always use DNA

  // Check emergency/firefight rule
  if (SACRED_DNA_RULES.emergencyGetsDNA.patterns.some(pattern => pattern.test(userPrompt))) {
    enforcementLevel = 'critical'
    reason = SACRED_DNA_RULES.emergencyGetsDNA.reason
    shouldUseDNA = true
  }

  // Check UI requirement rule
  else if (SACRED_DNA_RULES.uiRequiresRNA.patterns.some(pattern => pattern.test(userPrompt))) {
    enforcementLevel = 'mandatory'
    reason = SACRED_DNA_RULES.uiRequiresRNA.reason
    shouldUseDNA = true
  }

  // Check general development rule
  else if (
    SACRED_DNA_RULES.allDevelopmentGetsDNA.patterns.some(pattern => pattern.test(userPrompt))
  ) {
    enforcementLevel = 'recommended'
    reason = SACRED_DNA_RULES.allDevelopmentGetsDNA.reason
    shouldUseDNA = true
  }

  // Get recommended components
  const recommendedComponents = getRecommendedComponents(userPrompt, context)

  // Auto-enhance prompt
  const autoEnhancedPrompt = enhancePromptWithDNA(userPrompt, context, recommendedComponents)

  return {
    shouldUseDNA,
    reason,
    recommendedComponents,
    enforcementLevel,
    autoEnhancedPrompt
  }
}

/**
 * Detect request type from prompt
 */
function detectRequestType(prompt: string): BuildContext['type'] {
  const uiPatterns = /\b(ui|component|interface|dashboard|form|card|button|modal|page)\b/i
  const emergencyPatterns = /\b(urgent|emergency|critical|firefight|fix|bug|broken|down)\b/i

  if (emergencyPatterns.test(prompt)) return 'emergency'
  if (uiPatterns.test(prompt)) return 'ui'
  if (/\b(api|endpoint|route|server)\b/i.test(prompt)) return 'api'
  if (/\b(feature|functionality|module)\b/i.test(prompt)) return 'feature'
  if (/\b(component|react|tsx)\b/i.test(prompt)) return 'component'
  if (/\b(page|screen|view)\b/i.test(prompt)) return 'page'

  return 'unknown'
}

/**
 * Detect UI elements in prompt
 */
function detectUIElements(prompt: string): boolean {
  const uiPatterns = [
    /\b(card|button|form|input|modal|dialog|dropdown|menu|table|chart|graph)\b/i,
    /\b(dashboard|analytics|stats|metrics|kpi)\b/i,
    /\b(interface|ui|component|layout|design)\b/i,
    /\b(display|show|render|present)\b/i
  ]

  return uiPatterns.some(pattern => pattern.test(prompt))
}

/**
 * Get recommended DNA components based on prompt
 */
function getRecommendedComponents(prompt: string, context: BuildContext): string[] {
  const recommendations: string[] = []

  // Analyze prompt for component keywords
  Object.entries(DNA_COMPONENT_MAPPING).forEach(([keyword, component]) => {
    if (new RegExp(`\\b${keyword}\\b`, 'i').test(prompt)) {
      recommendations.push(component)
    }
  })

  // Always recommend based on context type
  switch (context.type) {
    case 'ui':
    case 'component':
      recommendations.push('EnterpriseCard', 'EnterpriseStatsCard')
      break
    case 'page':
      recommendations.push('EnterpriseDashboard components', 'DashboardSection')
      break
    case 'emergency':
      recommendations.push('EnterpriseCard with error handling', 'Professional loading states')
      break
    default:
      recommendations.push('EnterpriseCard (universal)')
  }

  return [...new Set(recommendations)] // Remove duplicates
}

/**
 * Enhance prompt with DNA components and guidance
 */
function enhancePromptWithDNA(
  originalPrompt: string,
  context: BuildContext,
  recommendedComponents: string[]
): string {
  let template = AUTO_ENHANCEMENT_TEMPLATES.general

  // Select appropriate template
  if (context.urgency === 'firefight' || context.urgency === 'critical') {
    template = AUTO_ENHANCEMENT_TEMPLATES.emergency
  } else if (/dashboard/i.test(originalPrompt)) {
    template = AUTO_ENHANCEMENT_TEMPLATES.dashboard
  } else if (/stats|metrics|analytics/i.test(originalPrompt)) {
    template = AUTO_ENHANCEMENT_TEMPLATES.stats
  } else if (/form|input/i.test(originalPrompt)) {
    template = AUTO_ENHANCEMENT_TEMPLATES.form
  }

  const enhancedPrompt = template.replace('{originalPrompt}', originalPrompt)

  return `${enhancedPrompt}

MANDATORY DNA COMPONENTS TO USE:
${recommendedComponents.map(comp => `- ${comp}`).join('\n')}

SACRED DNA IMPORTS (ALWAYS USE THESE):
import { EnterpriseCard, CardHeader, CardTitle } from '@/src/lib/dna/components/enterprise/EnterpriseCard'
import { EnterpriseStatsCard, StatsGrid } from '@/src/lib/dna/components/enterprise/EnterpriseStatsCard' 
import { DashboardSection, KPICard, ActivityItem, MetricTile, ProgressIndicator } from '@/src/lib/dna/components/enterprise/EnterpriseDashboard'

ENFORCEMENT LEVEL: ${context.urgency === 'firefight' ? 'CRITICAL' : 'MANDATORY'}
REASON: Professional enterprise-grade components with glassmorphism, animations, and accessibility built-in.
`
}

/**
 * Pre-flight check - Run before any development
 */
export function preFlightDNACheck(userPrompt: string): DNAEnforcementResult {
  // Auto-detect urgency from prompt
  let urgency: BuildContext['urgency'] = 'medium'

  if (/\b(firefight|emergency|critical|urgent|asap|immediately)\b/i.test(userPrompt)) {
    urgency = 'firefight'
  } else if (/\b(important|priority|soon|quickly)\b/i.test(userPrompt)) {
    urgency = 'high'
  }

  return analyzeBuildRequest(userPrompt, urgency)
}

/**
 * Get DNA enforcement instructions for Claude
 */
export function getDNAInstructions(enforcementResult: DNAEnforcementResult): string {
  return `
🧬 HERA DNA ENFORCEMENT ACTIVE 🧬

ENFORCEMENT LEVEL: ${enforcementResult.enforcementLevel.toUpperCase()}
REASON: ${enforcementResult.reason}

YOU MUST:
✅ Use only HERA DNA Enterprise components
✅ Import from /lib/dna/components/enterprise/
✅ Apply glassmorphism with glassIntensity props
✅ Use enterprise animations and effects
✅ Implement accessibility features
✅ Follow the enhanced prompt below

ENHANCED PROMPT:
${enforcementResult.autoEnhancedPrompt}

RECOMMENDED COMPONENTS:
${enforcementResult.recommendedComponents.map(c => `• ${c}`).join('\n')}

This enforcement cannot be bypassed. DNA components provide enterprise-grade quality, performance, and accessibility.
`
}

// Export singleton enforcer
export const DNAEnforcer = {
  analyze: analyzeBuildRequest,
  preFlightCheck: preFlightDNACheck,
  getInstructions: getDNAInstructions
}
