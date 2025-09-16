/**
 * HERA DNA Auto-Selector
 * Automatically selects and applies HERA DNA UI components based on build requests
 * This ensures enterprise-grade UI is always used when appropriate
 */

import { GlassEffects, FioriPatterns } from '../design-system/tokens'

export interface BuildRequest {
  prompt: string
  techStack?: string[]
  features?: string[]
  industry?: string
}

export interface DNASelection {
  useHeraDNA: boolean
  components: string[]
  theme: string
  patterns: string[]
  enhancements: string[]
  qualityGates: string[]
}

export class HeraDNAAutoSelector {
  private static instance: HeraDNAAutoSelector

  // Singleton pattern for consistent selection
  static getInstance(): HeraDNAAutoSelector {
    if (!this.instance) {
      this.instance = new HeraDNAAutoSelector()
    }
    return this.instance
  }

  /**
   * Analyze build request and determine if HERA DNA should be used
   */
  analyzeBuildRequest(request: BuildRequest): DNASelection {
    const prompt = request.prompt.toLowerCase()

    // Keywords that trigger HERA DNA selection
    const enterpriseIndicators = [
      'enterprise',
      'professional',
      'business',
      'corporate',
      'dashboard',
      'analytics',
      'admin',
      'management',
      'saas',
      'platform',
      'system',
      'application'
    ]

    const uiIndicators = [
      'ui',
      'interface',
      'frontend',
      'component',
      'design',
      'glass',
      'glassmorphism',
      'modern',
      'premium'
    ]

    const fioriIndicators = [
      'fiori',
      'sap',
      'worklist',
      'object page',
      'shell bar',
      'responsive table',
      'smart table',
      'enterprise table'
    ]

    // Check if request warrants HERA DNA
    const hasEnterpriseNeeds = enterpriseIndicators.some(indicator => prompt.includes(indicator))

    const hasUIRequirements = uiIndicators.some(indicator => prompt.includes(indicator))

    const hasFioriPatterns = fioriIndicators.some(indicator => prompt.includes(indicator))

    // Auto-select HERA DNA for enterprise builds
    const useHeraDNA =
      hasEnterpriseNeeds ||
      hasUIRequirements ||
      hasFioriPatterns ||
      request.techStack?.includes('React') ||
      request.techStack?.includes('Next.js')

    if (!useHeraDNA) {
      return {
        useHeraDNA: false,
        components: [],
        theme: 'default',
        patterns: [],
        enhancements: [],
        qualityGates: []
      }
    }

    // Select appropriate components based on request
    const components = this.selectComponents(prompt, request)
    const theme = this.selectTheme(prompt, request.industry)
    const patterns = this.selectPatterns(prompt)
    const enhancements = this.selectEnhancements(prompt)
    const qualityGates = this.defineQualityGates()

    return {
      useHeraDNA: true,
      components,
      theme,
      patterns,
      enhancements,
      qualityGates
    }
  }

  /**
   * Select specific DNA components based on request
   */
  private selectComponents(prompt: string, request: BuildRequest): string[] {
    const components: string[] = []

    // Core components always included
    components.push('HERA.UI.GLASS.PANEL.v1')
    components.push('HERA.UI.THEME.PROVIDER.v1')

    // Navigation components
    if (/nav|menu|sidebar|header/i.test(prompt)) {
      components.push('HERA.UI.GLASS.NAVBAR.FIORI.v1')
      components.push('HERA.UI.SIDEBAR.ENTERPRISE.v1')
    }

    // Data display components
    if (/table|list|data|grid/i.test(prompt)) {
      components.push('HERA.UI.GLASS.TABLE.FIORI.RESPONSIVE.v1')
      components.push('HERA.UI.DATA.GRID.ENTERPRISE.v1')
    }

    // Dashboard components
    if (/dashboard|analytics|metrics|kpi|chart/i.test(prompt)) {
      components.push('HERA.UI.DASHBOARD.EXECUTIVE.GLASS.v1')
      components.push('HERA.UI.STAT.CARD.DNA.v1')
      components.push('HERA.UI.ANALYTICS.CHART.v1')
    }

    // Form components
    if (/form|input|field|submit/i.test(prompt)) {
      components.push('HERA.UI.FORM.ENTERPRISE.v1')
      components.push('HERA.UI.INPUT.GLASS.v1')
      components.push('HERA.UI.SELECT.GLASS.v1')
    }

    // Layout components
    if (/layout|page|template|structure/i.test(prompt)) {
      components.push('HERA.UI.LAYOUT.DYNAMIC.PAGE.v1')
      components.push('HERA.UI.LAYOUT.OBJECT.PAGE.v1')
    }

    // Industry-specific components
    if (request.industry) {
      components.push(...this.getIndustryComponents(request.industry))
    }

    return [...new Set(components)] // Remove duplicates
  }

  /**
   * Select theme based on request
   */
  private selectTheme(prompt: string, industry?: string): string {
    // Industry-specific themes
    if (industry) {
      const industryThemes: Record<string, string> = {
        restaurant: 'restaurant-premium',
        healthcare: 'healthcare-trust',
        finance: 'finance-professional',
        retail: 'retail-vibrant',
        technology: 'tech-innovation'
      }

      if (industryThemes[industry]) {
        return industryThemes[industry]
      }
    }

    // Theme indicators in prompt
    if (/dark|night|midnight/i.test(prompt)) {
      return 'ice-cream-enterprise-dark'
    }

    if (/light|bright|day/i.test(prompt)) {
      return 'ice-cream-enterprise-light'
    }

    if (/premium|luxury|executive/i.test(prompt)) {
      return 'executive-premium'
    }

    // Default enterprise theme
    return 'ice-cream-enterprise'
  }

  /**
   * Select design patterns to apply
   */
  private selectPatterns(prompt: string): string[] {
    const patterns: string[] = []

    // Always include base patterns
    patterns.push('glassmorphism-2.0')
    patterns.push('responsive-design')
    patterns.push('accessibility-first')

    // Conditional patterns
    if (/fiori|sap|enterprise/i.test(prompt)) {
      patterns.push('fiori-enhanced')
      patterns.push('shell-bar-pattern')
      patterns.push('object-page-pattern')
    }

    if (/animation|motion|transition/i.test(prompt)) {
      patterns.push('smooth-animations')
      patterns.push('micro-interactions')
    }

    if (/mobile|responsive|adaptive/i.test(prompt)) {
      patterns.push('mobile-first')
      patterns.push('adaptive-layouts')
    }

    return patterns
  }

  /**
   * Select enhancements to apply
   */
  private selectEnhancements(prompt: string): string[] {
    const enhancements: string[] = []

    // Performance enhancements
    enhancements.push('lazy-loading')
    enhancements.push('code-splitting')
    enhancements.push('memoization')

    // Advanced features
    if (/real-time|live|streaming/i.test(prompt)) {
      enhancements.push('real-time-updates')
      enhancements.push('websocket-integration')
    }

    if (/offline|pwa|cache/i.test(prompt)) {
      enhancements.push('offline-support')
      enhancements.push('pwa-features')
    }

    if (/ai|smart|intelligent/i.test(prompt)) {
      enhancements.push('ai-insights')
      enhancements.push('smart-recommendations')
    }

    return enhancements
  }

  /**
   * Define quality gates for enterprise builds
   */
  private defineQualityGates(): string[] {
    return [
      'typescript-strict-mode',
      'accessibility-wcag-aaa',
      'performance-score-95+',
      'responsive-all-breakpoints',
      'cross-browser-compatibility',
      'security-headers-enabled',
      'error-boundary-coverage',
      'loading-state-management',
      'test-coverage-80+',
      'documentation-complete'
    ]
  }

  /**
   * Get industry-specific components
   */
  private getIndustryComponents(industry: string): string[] {
    const industryComponents: Record<string, string[]> = {
      restaurant: [
        'HERA.UI.POS.RESTAURANT.v1',
        'HERA.UI.MENU.MANAGER.v1',
        'HERA.UI.ORDER.TRACKER.v1'
      ],
      healthcare: [
        'HERA.UI.PATIENT.RECORD.v1',
        'HERA.UI.APPOINTMENT.SCHEDULER.v1',
        'HERA.UI.PRESCRIPTION.MANAGER.v1'
      ],
      retail: [
        'HERA.UI.INVENTORY.TRACKER.v1',
        'HERA.UI.POS.RETAIL.v1',
        'HERA.UI.CUSTOMER.LOYALTY.v1'
      ],
      finance: [
        'HERA.UI.PORTFOLIO.DASHBOARD.v1',
        'HERA.UI.TRANSACTION.MONITOR.v1',
        'HERA.UI.RISK.ANALYZER.v1'
      ]
    }

    return industryComponents[industry] || []
  }

  /**
   * Generate enhanced prompt with HERA DNA
   */
  enhancePrompt(originalPrompt: string, selection: DNASelection): string {
    if (!selection.useHeraDNA) {
      return originalPrompt
    }

    const enhancedPrompt = `
${originalPrompt}

**IMPORTANT: Use HERA DNA Enterprise UI System**

TECHNICAL REQUIREMENTS:
- Framework: React/Next.js 14+ with TypeScript (strict mode)
- UI System: HERA DNA with Glassmorphism + SAP Fiori patterns
- Theme: ${selection.theme}
- Components: ${selection.components.join(', ')}

DESIGN SPECIFICATIONS:
${
  selection.patterns.includes('glassmorphism-2.0')
    ? `
- Glassmorphism Effects:
  - Multi-layer glass with depth (blur: 20px, opacity: 0.05-0.15)
  - Subtle shadows and inset borders
  - Smooth hover transitions (700ms)
  - Glass intensity variants: subtle, medium, strong
`
    : ''
}

${
  selection.patterns.includes('fiori-enhanced')
    ? `
- Fiori Patterns:
  - Shell bar with 3-section layout
  - Responsive tables with micro-charts
  - Object page headers with KPIs
  - Smart filtering and personalization
`
    : ''
}

QUALITY STANDARDS:
${selection.qualityGates.map(gate => `- ${gate}`).join('\n')}

ENHANCEMENTS:
${selection.enhancements.map(enhancement => `- ${enhancement}`).join('\n')}

COLOR PALETTE:
- Use HERA ice-cream enterprise palette
- Ensure WCAG AAA contrast ratios
- Apply semantic color system

COMPONENT STRUCTURE:
- Create reusable, composable components
- Use proper TypeScript interfaces
- Include loading and error states
- Implement proper accessibility

Please build production-ready enterprise UI following HERA DNA standards.
`

    return enhancedPrompt
  }
}

// Export singleton instance
export const heraDNAAutoSelector = HeraDNAAutoSelector.getInstance()

// Helper function for easy use
export function analyzeAndEnhanceBuildRequest(
  prompt: string,
  options?: Partial<BuildRequest>
): {
  selection: DNASelection
  enhancedPrompt: string
} {
  const request: BuildRequest = {
    prompt,
    ...options
  }

  const selection = heraDNAAutoSelector.analyzeBuildRequest(request)
  const enhancedPrompt = heraDNAAutoSelector.enhancePrompt(prompt, selection)

  return {
    selection,
    enhancedPrompt
  }
}
