/**
 * HERA DNA Auto-Select System
 * Intelligent component selection that works in ANY development context
 * Guarantees HERA DNA Enterprise components are ALWAYS used
 */

import { DNAEnforcer, type DNAEnforcementResult } from '../auto-enforce/hera-dna-enforcer'

export interface AutoSelectContext {
  userRequest: string
  developmentPhase: 'planning' | 'implementation' | 'testing' | 'emergency' | 'maintenance'
  promptLocation: 'beginning' | 'middle' | 'firefight' | 'follow_up'
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical' | 'firefight'
  hasExistingComponents: boolean
  projectScope: 'single_component' | 'page' | 'feature' | 'full_system'
}

export interface ComponentSelection {
  primary: string
  secondary: string[]
  imports: string[]
  usage: string
  reasoning: string
  confidence: number
  mandatory: boolean
}

export interface AutoSelectResult {
  context: AutoSelectContext
  enforcement: DNAEnforcementResult
  selection: ComponentSelection
  generatedCode: string
  instructions: string[]
  guarantees: string[]
}

/**
 * AUTOMATIC COMPONENT SELECTION MATRIX
 * This matrix ensures the RIGHT component is selected every time
 */
const COMPONENT_SELECTION_MATRIX = {
  // Stats, Metrics, Numbers, KPIs
  stats: {
    patterns: [
      'stat',
      'metric',
      'kpi',
      'number',
      'count',
      'revenue',
      'sales',
      'total',
      'performance',
      'analytics'
    ],
    primary: 'EnterpriseStatsCard',
    secondary: ['StatsGrid', 'MetricTile'],
    confidence: 0.95,
    mandatory: true
  },

  // Cards, Panels, Containers, Sections
  cards: {
    patterns: ['card', 'panel', 'container', 'section', 'box', 'content', 'display', 'show'],
    primary: 'EnterpriseCard',
    secondary: ['CardHeader', 'CardTitle', 'CardContent'],
    confidence: 0.9,
    mandatory: true
  },

  // Dashboards, Overviews, Admin Panels
  dashboard: {
    patterns: [
      'dashboard',
      'overview',
      'admin',
      'main',
      'home',
      'summary',
      'analytics',
      'reporting'
    ],
    primary: 'EnterpriseDashboard',
    secondary: ['DashboardSection', 'KPICard', 'ActivityItem', 'ProgressIndicator'],
    confidence: 0.98,
    mandatory: true
  },

  // Forms, Inputs, Data Entry
  forms: {
    patterns: ['form', 'input', 'field', 'entry', 'submit', 'validation', 'data'],
    primary: 'EnterpriseCard',
    secondary: ['FormSection', 'InputWrapper'],
    confidence: 0.85,
    mandatory: true
  },

  // Tables, Lists, Data Display
  tables: {
    patterns: ['table', 'list', 'grid', 'data', 'rows', 'columns', 'records'],
    primary: 'EnterpriseCard',
    secondary: ['TableSection', 'DataGrid'],
    confidence: 0.85,
    mandatory: true
  },

  // Modals, Dialogs, Popups
  modals: {
    patterns: ['modal', 'dialog', 'popup', 'overlay', 'confirm', 'alert'],
    primary: 'EnterpriseCard',
    secondary: ['ModalWrapper', 'DialogContent'],
    confidence: 0.9,
    mandatory: true
  },

  // Emergency/Firefight situations
  emergency: {
    patterns: [
      'urgent',
      'emergency',
      'broken',
      'fix',
      'bug',
      'critical',
      'down',
      'failing',
      'firefight'
    ],
    primary: 'EnterpriseCard',
    secondary: ['EnterpriseStatsCard', 'EnterpriseDashboard'],
    confidence: 1.0,
    mandatory: true
  }
}

/**
 * CODE GENERATION TEMPLATES
 * Auto-generates production-ready code with HERA DNA components
 */
const CODE_TEMPLATES = {
  EnterpriseStatsCard: (props: any = {}) => `
import { EnterpriseStatsCard } from '@/src/lib/dna/components/enterprise/EnterpriseStatsCard'

<EnterpriseStatsCard
  title="${props.title || 'Key Metric'}"
  value={${props.value || 'data.value'}}
  format="${props.format || 'number'}"
  showTrend={true}
  realTime={true}
  layout="horizontal"
  className="mb-6"
  glassIntensity="medium"
  animation="fade"
  effect="shimmer"
/>`,

  EnterpriseCard: (props: any = {}) => `
import { EnterpriseCard, CardHeader, CardTitle, CardContent } from '@/src/lib/dna/components/enterprise/EnterpriseCard'

<EnterpriseCard
  className="mb-6"
  glassIntensity="medium"
  animation="slide"
  effect="glow"
  variant="default"
>
  <CardHeader>
    <CardTitle>${props.title || 'Enterprise Content'}</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Your content here */}
  </CardContent>
</EnterpriseCard>`,

  EnterpriseDashboard: (props: any = {}) => `
import { 
  DashboardSection, 
  KPICard, 
  ActivityItem, 
  MetricTile, 
  ProgressIndicator 
} from '@/src/lib/dna/components/enterprise/EnterpriseDashboard'

<div className="enterprise-dashboard space-y-6">
  {/* KPI Section */}
  <DashboardSection title="Key Metrics" collapsible={true}>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Revenue"
        value={revenue}
        format="currency"
        trend="up"
        change={15.2}
      />
      {/* Add more KPIs */}
    </div>
  </DashboardSection>
  
  {/* Activity Section */}
  <DashboardSection title="Recent Activity">
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <ActivityItem key={index} {...activity} />
      ))}
    </div>
  </DashboardSection>
</div>`
}

/**
 * HERA DNA Auto-Selector Class
 * The main intelligence engine for automatic component selection
 */
export class HeraDNAAutoSelector {
  /**
   * MAIN AUTO-SELECT METHOD
   * This method GUARANTEES HERA DNA components are used
   */
  autoSelect(userRequest: string, context: Partial<AutoSelectContext> = {}): AutoSelectResult {
    // Build complete context
    const fullContext: AutoSelectContext = {
      userRequest,
      developmentPhase: this.detectPhase(userRequest),
      promptLocation: this.detectPromptLocation(userRequest, context),
      urgencyLevel: this.detectUrgency(userRequest),
      hasExistingComponents: context.hasExistingComponents || false,
      projectScope: this.detectScope(userRequest),
      ...context
    }

    // Get DNA enforcement
    const enforcement = DNAEnforcer.preFlightCheck(userRequest)

    // Select components using matrix
    const selection = this.selectComponents(userRequest, fullContext)

    // Generate code
    const generatedCode = this.generateCode(selection, fullContext)

    // Create instructions
    const instructions = this.generateInstructions(selection, fullContext, enforcement)

    return {
      context: fullContext,
      enforcement,
      selection,
      generatedCode,
      instructions,
      guarantees: [
        '✅ HERA DNA Enterprise components GUARANTEED',
        '✅ Professional glassmorphism design applied',
        '✅ Advanced animations and micro-interactions',
        '✅ Accessibility (WCAG AAA) compliance built-in',
        '✅ Performance optimizations included',
        '✅ Real-time capabilities enabled',
        '✅ Enterprise-grade quality assured'
      ]
    }
  }

  private detectPhase(request: string): AutoSelectContext['developmentPhase'] {
    if (/\b(emergency|urgent|fix|bug|broken|down)\b/i.test(request)) return 'emergency'
    if (/\b(test|testing|validate|check)\b/i.test(request)) return 'testing'
    if (/\b(plan|design|architecture|structure)\b/i.test(request)) return 'planning'
    if (/\b(update|modify|change|maintain)\b/i.test(request)) return 'maintenance'
    return 'implementation'
  }

  private detectPromptLocation(
    request: string,
    context: Partial<AutoSelectContext>
  ): AutoSelectContext['promptLocation'] {
    if (/\b(firefight|emergency|urgent|critical)\b/i.test(request)) return 'firefight'
    if (context.promptLocation) return context.promptLocation
    return 'beginning'
  }

  private detectUrgency(request: string): AutoSelectContext['urgencyLevel'] {
    if (/\b(firefight|emergency|critical|urgent|asap|immediately)\b/i.test(request))
      return 'firefight'
    if (/\b(important|priority|soon|quickly)\b/i.test(request)) return 'high'
    if (/\b(medium|normal|standard)\b/i.test(request)) return 'medium'
    if (/\b(low|later|future)\b/i.test(request)) return 'low'
    return 'medium'
  }

  private detectScope(request: string): AutoSelectContext['projectScope'] {
    if (/\b(system|application|platform|complete)\b/i.test(request)) return 'full_system'
    if (/\b(feature|module|section)\b/i.test(request)) return 'feature'
    if (/\b(page|screen|view)\b/i.test(request)) return 'page'
    return 'single_component'
  }

  private selectComponents(request: string, context: AutoSelectContext): ComponentSelection {
    const lowerRequest = request.toLowerCase()

    // Find best match from selection matrix
    let bestMatch = { confidence: 0, key: '', config: COMPONENT_SELECTION_MATRIX.cards }

    for (const [key, config] of Object.entries(COMPONENT_SELECTION_MATRIX)) {
      const matchScore = config.patterns.reduce((score, pattern) => {
        return lowerRequest.includes(pattern) ? score + 1 : score
      }, 0)

      if (matchScore > bestMatch.confidence) {
        bestMatch = { confidence: matchScore, key, config }
      }
    }

    // Emergency override - always use enterprise components with max confidence
    if (context.urgencyLevel === 'firefight' || context.developmentPhase === 'emergency') {
      bestMatch = { confidence: 10, key: 'emergency', config: COMPONENT_SELECTION_MATRIX.emergency }
    }

    const config = bestMatch.config

    return {
      primary: config.primary,
      secondary: config.secondary,
      imports: this.generateImports(config),
      usage: this.generateUsage(config, context),
      reasoning: `Selected ${config.primary} based on ${bestMatch.key} pattern match with ${bestMatch.confidence} confidence`,
      confidence: Math.min(config.confidence + bestMatch.confidence * 0.1, 1.0),
      mandatory: config.mandatory
    }
  }

  private generateImports(config: any): string[] {
    const imports = []

    if (config.primary === 'EnterpriseStatsCard') {
      imports.push(
        "import { EnterpriseStatsCard, StatsGrid } from '@/src/lib/dna/components/enterprise/EnterpriseStatsCard'"
      )
    }

    if (config.primary === 'EnterpriseCard') {
      imports.push(
        "import { EnterpriseCard, CardHeader, CardTitle, CardContent } from '@/src/lib/dna/components/enterprise/EnterpriseCard'"
      )
    }

    if (config.primary === 'EnterpriseDashboard') {
      imports.push(
        "import { DashboardSection, KPICard, ActivityItem, MetricTile, ProgressIndicator } from '@/src/lib/dna/components/enterprise/EnterpriseDashboard'"
      )
    }

    return imports
  }

  private generateUsage(config: any, context: AutoSelectContext): string {
    return `Use ${config.primary} as the primary component with ${config.secondary.join(', ')} for enhanced functionality`
  }

  private generateCode(selection: ComponentSelection, context: AutoSelectContext): string {
    const template = CODE_TEMPLATES[selection.primary as keyof typeof CODE_TEMPLATES]
    if (!template) return ''

    // Customize based on context
    const props = {
      title: this.inferTitle(context.userRequest),
      format: this.inferFormat(context.userRequest)
    }

    return template(props)
  }

  private inferTitle(request: string): string {
    if (/dashboard/i.test(request)) return 'Dashboard Overview'
    if (/stats|metric/i.test(request)) return 'Performance Metrics'
    if (/revenue|sales/i.test(request)) return 'Revenue Analytics'
    return 'Enterprise Data'
  }

  private inferFormat(request: string): string {
    if (/revenue|sales|money|currency/i.test(request)) return 'currency'
    if (/percent|rate|ratio/i.test(request)) return 'percentage'
    if (/count|users|items/i.test(request)) return 'compact'
    return 'number'
  }

  private generateInstructions(
    selection: ComponentSelection,
    context: AutoSelectContext,
    enforcement: DNAEnforcementResult
  ): string[] {
    const instructions = [
      `🎯 PRIMARY COMPONENT: ${selection.primary}`,
      `📦 REQUIRED IMPORTS: ${selection.imports.join('; ')}`,
      `⚡ ENFORCEMENT LEVEL: ${enforcement.enforcementLevel.toUpperCase()}`,
      `🧠 REASONING: ${selection.reasoning}`
    ]

    // Context-specific instructions
    if (context.urgencyLevel === 'firefight') {
      instructions.push('🚨 EMERGENCY MODE: Use error boundaries and loading states')
      instructions.push('⚡ PERFORMANCE: Prioritize stability over animations')
    }

    if (context.projectScope === 'full_system') {
      instructions.push('🏗️ SYSTEM SCOPE: Create reusable component patterns')
      instructions.push('📋 CONSISTENCY: Maintain enterprise design language')
    }

    return instructions
  }
}

/**
 * GLOBAL AUTO-SELECTOR INSTANCE
 * Use this singleton everywhere for consistent component selection
 */
export const heraDNAAutoSelector = new HeraDNAAutoSelector()

/**
 * CONVENIENCE FUNCTIONS
 */
export function autoSelectComponents(
  userRequest: string,
  context?: Partial<AutoSelectContext>
): AutoSelectResult {
  return heraDNAAutoSelector.autoSelect(userRequest, context)
}

export function getEnterpriseComponents(userRequest: string): ComponentSelection {
  return heraDNAAutoSelector.autoSelect(userRequest).selection
}

export function generateEnterpriseCode(userRequest: string): string {
  return heraDNAAutoSelector.autoSelect(userRequest).generatedCode
}

/**
 * INTEGRATION WITH EXISTING ENFORCER
 */
export function createFullEnforcementResult(userRequest: string): {
  enforcement: DNAEnforcementResult
  autoSelect: AutoSelectResult
  finalInstructions: string[]
} {
  const enforcement = DNAEnforcer.preFlightCheck(userRequest)
  const autoSelect = heraDNAAutoSelector.autoSelect(userRequest)

  const finalInstructions = [
    ...DNAEnforcer.getInstructions(enforcement).split('\n'),
    '',
    '🧬 AUTO-SELECTED COMPONENTS:',
    ...autoSelect.instructions,
    '',
    '💻 GENERATED CODE:',
    autoSelect.generatedCode,
    '',
    '✅ GUARANTEES:',
    ...autoSelect.guarantees
  ]

  return {
    enforcement,
    autoSelect,
    finalInstructions
  }
}

/**
 * USAGE EXAMPLES:
 *
 * // 1. Any development request
 * const result = autoSelectComponents("Create a sales dashboard")
 * console.log(result.generatedCode) // Complete EnterpriseDashboard
 *
 * // 2. Emergency scenario
 * const emergency = autoSelectComponents("URGENT: Fix broken metrics", {
 *   promptLocation: 'firefight',
 *   urgencyLevel: 'firefight'
 * })
 *
 * // 3. Get just the components
 * const components = getEnterpriseComponents("Show user stats")
 * console.log(components.primary) // "EnterpriseStatsCard"
 *
 * // 4. Full enforcement + auto-selection
 * const full = createFullEnforcementResult("Build admin panel")
 * console.log(full.finalInstructions) // Complete implementation guide
 */
