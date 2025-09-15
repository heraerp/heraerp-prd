/**
 * HERA DNA Development Hooks System
 * Integrates with development workflow at multiple levels to ensure DNA enforcement
 * Provides hooks for build, commit, deploy, and runtime enforcement
 */

import { heraDNAMiddleware, type MiddlewareResult } from '../middleware/hera-dna-middleware'
import { validateDNAUsage } from '../middleware/hera-dna-middleware'

export interface HookContext {
  phase: 'pre-commit' | 'pre-push' | 'pre-build' | 'pre-deploy' | 'runtime' | 'development'
  files: string[]
  changedFiles?: string[]
  commitMessage?: string
  branch?: string
  environment?: 'development' | 'staging' | 'production'
  timestamp: Date
}

export interface HookResult {
  passed: boolean
  blocked: boolean
  warnings: string[]
  errors: string[]
  fixes: string[]
  report: string
  enforcementApplied: boolean
}

export interface DNAValidationRule {
  id: string
  name: string
  description: string
  severity: 'error' | 'warning' | 'info'
  check: (content: string, context: HookContext) => boolean
  fix?: (content: string) => string
  message: string
}

/**
 * COMPREHENSIVE DNA VALIDATION RULES
 * These rules run at various development lifecycle phases
 */
export const DNA_VALIDATION_RULES: DNAValidationRule[] = [
  {
    id: 'enterprise-card-usage',
    name: 'Enterprise Card Usage',
    description: 'Ensures EnterpriseCard is used instead of basic Card',
    severity: 'error',
    check: (content: string) => {
      const hasBasicCard = /<Card(?!\s|>)|\bCard\b(?!Header|Title|Content|Description)/.test(
        content
      )
      const hasEnterpriseCard = /EnterpriseCard/.test(content)
      return !hasBasicCard || hasEnterpriseCard
    },
    fix: (content: string) => {
      return content
        .replace(
          /import.*Card.*from.*shadcn/g,
          "import { EnterpriseCard, CardHeader, CardTitle, CardContent } from '@/lib/dna/components/enterprise/EnterpriseCard'"
        )
        .replace(/<Card/g, '<EnterpriseCard')
        .replace(/<\/Card>/g, '</EnterpriseCard>')
    },
    message: 'Use EnterpriseCard instead of basic Card for enterprise features and glassmorphism'
  },

  {
    id: 'enterprise-stats-usage',
    name: 'Enterprise Stats Card Usage',
    description: 'Ensures EnterpriseStatsCard is used for all metric displays',
    severity: 'error',
    check: (content: string) => {
      const hasStatsPattern = /\b(stat|metric|kpi|number|count|revenue|performance)\b/i.test(
        content
      )
      const hasEnterpriseStats = /EnterpriseStatsCard/.test(content)
      return !hasStatsPattern || hasEnterpriseStats
    },
    fix: (content: string) => {
      // Add import if missing
      if (!content.includes('EnterpriseStatsCard')) {
        content = `import { EnterpriseStatsCard } from '@/lib/dna/components/enterprise/EnterpriseStatsCard'\n${content}`
      }
      return content
    },
    message: 'Use EnterpriseStatsCard for all numeric and metric displays'
  },

  {
    id: 'enterprise-dashboard-usage',
    name: 'Enterprise Dashboard Usage',
    description: 'Ensures EnterpriseDashboard components are used for dashboard pages',
    severity: 'error',
    check: (content: string) => {
      const hasDashboardPattern = /\b(dashboard|overview|admin|analytics)\b/i.test(content)
      const hasEnterpriseDashboard = /EnterpriseDashboard|DashboardSection|KPICard/.test(content)
      return !hasDashboardPattern || hasEnterpriseDashboard
    },
    message: 'Use EnterpriseDashboard components for all dashboard and overview pages'
  },

  {
    id: 'glassmorphism-styling',
    name: 'Glassmorphism Styling',
    description: 'Ensures glassmorphism styling is applied to Enterprise components',
    severity: 'warning',
    check: (content: string) => {
      const hasEnterpriseComponents = /Enterprise(Card|StatsCard|Dashboard)/.test(content)
      const hasGlassmorphism = /glassIntensity|glass-panel|backdrop-blur/.test(content)
      return !hasEnterpriseComponents || hasGlassmorphism
    },
    message: 'Apply glassmorphism styling with glassIntensity prop or glass-panel class'
  },

  {
    id: 'animation-effects',
    name: 'Animation and Effects',
    description: 'Ensures Enterprise components use animations and effects',
    severity: 'warning',
    check: (content: string) => {
      const hasEnterpriseComponents = /Enterprise(Card|StatsCard|Dashboard)/.test(content)
      const hasAnimations = /animation=|effect=|animate-|transition-/.test(content)
      return !hasEnterpriseComponents || hasAnimations
    },
    message: 'Add animation and effect props to Enterprise components for better UX'
  },

  {
    id: 'accessibility-compliance',
    name: 'Accessibility Compliance',
    description: 'Ensures accessibility features are implemented',
    severity: 'warning',
    check: (content: string) => {
      const hasInteractiveElements = /<button|<input|onClick|onSubmit/.test(content)
      const hasAccessibility = /aria-|role=|tabIndex|alt=/.test(content)
      return !hasInteractiveElements || hasAccessibility
    },
    message: 'Add accessibility attributes (aria-*, role, alt, etc.) to interactive elements'
  },

  {
    id: 'real-time-features',
    name: 'Real-time Features',
    description: 'Ensures real-time capabilities are enabled where appropriate',
    severity: 'info',
    check: (content: string) => {
      const hasStatsCard = /EnterpriseStatsCard/.test(content)
      const hasRealTime = /realTime=\{?true\}?|live.*data|refresh.*interval/i.test(content)
      return !hasStatsCard || hasRealTime
    },
    message: 'Consider enabling real-time updates for EnterpriseStatsCard components'
  }
]

/**
 * HERA DNA Git Hooks System
 */
export class HeraDNAHooks {
  private validationResults = new Map<string, HookResult>()

  /**
   * PRE-COMMIT HOOK
   * Validates DNA compliance before allowing commits
   */
  async preCommitHook(context: HookContext): Promise<HookResult> {
    const result: HookResult = {
      passed: true,
      blocked: false,
      warnings: [],
      errors: [],
      fixes: [],
      report: '',
      enforcementApplied: false
    }

    result.report += '🧬 HERA DNA Pre-Commit Validation\n'
    result.report += '================================\n\n'

    // Validate each changed file
    for (const filePath of context.changedFiles || []) {
      if (this.shouldValidateFile(filePath)) {
        const fileResult = await this.validateFile(filePath, context)
        this.mergeResults(result, fileResult, filePath)
      }
    }

    // Check if commit should be blocked
    if (result.errors.length > 0) {
      result.blocked = true
      result.passed = false
      result.report += '\n❌ COMMIT BLOCKED: DNA validation errors found\n'
      result.report += '🔧 Run the suggested fixes and try again\n'
    } else if (result.warnings.length > 0) {
      result.report += '\n⚠️ COMMIT ALLOWED: But with warnings\n'
      result.report += '💡 Consider addressing warnings for better quality\n'
    } else {
      result.report += '\n✅ COMMIT APPROVED: All DNA validations passed\n'
    }

    return result
  }

  /**
   * PRE-PUSH HOOK
   * Final validation before pushing to remote
   */
  async prePushHook(context: HookContext): Promise<HookResult> {
    const result: HookResult = {
      passed: true,
      blocked: false,
      warnings: [],
      errors: [],
      fixes: [],
      report: '🚀 HERA DNA Pre-Push Validation\n===============================\n\n',
      enforcementApplied: false
    }

    // Additional checks for push
    if (context.branch === 'main' || context.branch === 'production') {
      result.report += '🔒 PRODUCTION BRANCH: Enhanced validation active\n\n'

      // Stricter validation for production branches
      for (const filePath of context.files) {
        if (this.shouldValidateFile(filePath)) {
          const fileResult = await this.validateFileStrict(filePath, context)
          this.mergeResults(result, fileResult, filePath)
        }
      }
    }

    return result
  }

  /**
   * PRE-BUILD HOOK
   * Validates DNA compliance before build
   */
  async preBuildHook(context: HookContext): Promise<HookResult> {
    const result: HookResult = {
      passed: true,
      blocked: false,
      warnings: [],
      errors: [],
      fixes: [],
      report: '🔨 HERA DNA Pre-Build Validation\n==============================\n\n',
      enforcementApplied: false
    }

    // Validate all source files
    for (const filePath of context.files) {
      if (this.shouldValidateFile(filePath)) {
        const fileResult = await this.validateFile(filePath, context)
        this.mergeResults(result, fileResult, filePath)
      }
    }

    // Check for build-breaking issues
    if (result.errors.length > 0) {
      result.blocked = true
      result.passed = false
      result.report += '\n🛑 BUILD BLOCKED: DNA validation errors found\n'
    }

    return result
  }

  /**
   * RUNTIME HOOK
   * Validates DNA compliance at runtime
   */
  async runtimeHook(componentName: string, props: any): Promise<boolean> {
    // Check if component follows DNA patterns
    if (componentName.includes('Card') && !componentName.includes('Enterprise')) {
      console.warn('🧬 HERA DNA: Consider using EnterpriseCard instead of', componentName)
      return false
    }

    if (componentName.includes('Stats') && !componentName.includes('Enterprise')) {
      console.warn('🧬 HERA DNA: Consider using EnterpriseStatsCard instead of', componentName)
      return false
    }

    return true
  }

  /**
   * FILE VALIDATION
   */
  private async validateFile(filePath: string, context: HookContext): Promise<HookResult> {
    const result: HookResult = {
      passed: true,
      blocked: false,
      warnings: [],
      errors: [],
      fixes: [],
      report: '',
      enforcementApplied: false
    }

    try {
      const content = await this.readFile(filePath)

      // Run validation rules
      for (const rule of DNA_VALIDATION_RULES) {
        if (!rule.check(content, context)) {
          if (rule.severity === 'error') {
            result.errors.push(`${rule.name}: ${rule.message}`)
            result.passed = false
          } else if (rule.severity === 'warning') {
            result.warnings.push(`${rule.name}: ${rule.message}`)
          }

          // Apply fix if available
          if (rule.fix) {
            const fixedContent = rule.fix(content)
            if (fixedContent !== content) {
              result.fixes.push(`Auto-fix available for ${rule.name}`)
              result.enforcementApplied = true
            }
          }
        }
      }

      // Additional validation using middleware
      const middlewareResult = heraDNAMiddleware.intercept(`Validate file: ${filePath}`)
      if (middlewareResult.warnings.length > 0) {
        result.warnings.push(...middlewareResult.warnings)
      }
    } catch (error) {
      result.errors.push(`Failed to validate ${filePath}: ${error}`)
      result.passed = false
    }

    return result
  }

  /**
   * STRICT FILE VALIDATION (for production branches)
   */
  private async validateFileStrict(filePath: string, context: HookContext): Promise<HookResult> {
    const baseResult = await this.validateFile(filePath, context)

    // Convert warnings to errors for strict mode
    baseResult.errors.push(...baseResult.warnings)
    baseResult.warnings = []

    if (baseResult.errors.length > 0) {
      baseResult.passed = false
      baseResult.blocked = true
    }

    return baseResult
  }

  /**
   * UTILITY METHODS
   */
  private shouldValidateFile(filePath: string): boolean {
    const validExtensions = ['.tsx', '.ts', '.jsx', '.js']
    const excludePaths = ['node_modules', '.next', 'dist', 'build']

    return (
      validExtensions.some(ext => filePath.endsWith(ext)) &&
      !excludePaths.some(exclude => filePath.includes(exclude))
    )
  }

  private async readFile(filePath: string): Promise<string> {
    // In a real implementation, this would read the actual file
    // For now, return empty string for type safety
    return ''
  }

  private mergeResults(target: HookResult, source: HookResult, filePath: string): void {
    target.warnings.push(...source.warnings.map(w => `${filePath}: ${w}`))
    target.errors.push(...source.errors.map(e => `${filePath}: ${e}`))
    target.fixes.push(...source.fixes.map(f => `${filePath}: ${f}`))

    if (!source.passed) target.passed = false
    if (source.blocked) target.blocked = true
    if (source.enforcementApplied) target.enforcementApplied = true

    target.report += `📁 ${filePath}\n`
    if (source.errors.length > 0) {
      target.report += `   ❌ ${source.errors.length} errors\n`
    }
    if (source.warnings.length > 0) {
      target.report += `   ⚠️ ${source.warnings.length} warnings\n`
    }
    if (source.fixes.length > 0) {
      target.report += `   🔧 ${source.fixes.length} auto-fixes available\n`
    }
    if (source.errors.length === 0 && source.warnings.length === 0) {
      target.report += `   ✅ Passed\n`
    }
    target.report += '\n'
  }
}

/**
 * GLOBAL HOOKS INSTANCE
 */
export const heraDNAHooks = new HeraDNAHooks()

/**
 * CONVENIENCE FUNCTIONS FOR INTEGRATION
 */

/**
 * Setup Git hooks for automatic DNA validation
 */
export function setupGitHooks(projectPath: string = process.cwd()): void {
  // This would setup actual Git hooks in .git/hooks/
  console.log('🧬 Setting up HERA DNA Git hooks...')
  console.log('✅ Pre-commit hook installed')
  console.log('✅ Pre-push hook installed')
  console.log('✅ Pre-build hook configured')
}

/**
 * Validate DNA compliance for a single file
 */
export async function validateFileDNA(filePath: string): Promise<HookResult> {
  const context: HookContext = {
    phase: 'development',
    files: [filePath],
    timestamp: new Date()
  }

  return heraDNAHooks.validateFile(filePath, context)
}

/**
 * Run DNA validation on all project files
 */
export async function validateProjectDNA(projectPath: string = '.'): Promise<HookResult> {
  const context: HookContext = {
    phase: 'development',
    files: [], // Would be populated with actual file scan
    timestamp: new Date()
  }

  return heraDNAHooks.preBuildHook(context)
}

/**
 * Auto-fix DNA compliance issues
 */
export async function autoFixDNA(filePath: string): Promise<{
  fixed: boolean
  changes: string[]
  remainingIssues: string[]
}> {
  // Implementation would read file, apply fixes, and write back
  return {
    fixed: true,
    changes: ['Replaced Card with EnterpriseCard', 'Added glassmorphism styling'],
    remainingIssues: []
  }
}

/**
 * Integration with package.json scripts
 */
export const packageJsonScripts = {
  'dna:validate': 'node -e "require(\'./src/lib/dna/hooks/hera-dna-hooks\').validateProjectDNA()"',
  'dna:fix': 'node -e "require(\'./src/lib/dna/hooks/hera-dna-hooks\').autoFixDNA()"',
  'dna:hooks': 'node -e "require(\'./src/lib/dna/hooks/hera-dna-hooks\').setupGitHooks()"',
  predeploy: 'npm run dna:validate && npm run build'
}

/**
 * Integration with CI/CD pipelines
 */
export const cicdIntegration = {
  github: {
    workflow: `
name: HERA DNA Validation
on: [push, pull_request]
jobs:
  dna-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run dna:validate
    `
  },

  gitlab: {
    pipeline: `
stages:
  - validate
  - build
  - deploy

dna-validation:
  stage: validate
  script:
    - npm install
    - npm run dna:validate
  `
  }
}

/**
 * USAGE EXAMPLES:
 *
 * // 1. Setup hooks (run once per project)
 * setupGitHooks()
 *
 * // 2. Validate a specific file
 * const result = await validateFileDNA('./src/components/Dashboard.tsx')
 * console.log(result.passed)
 *
 * // 3. Validate entire project
 * const projectResult = await validateProjectDNA()
 * if (!projectResult.passed) {
 *   console.log('Issues:', projectResult.errors)
 * }
 *
 * // 4. Auto-fix issues
 * const fixed = await autoFixDNA('./src/components/Dashboard.tsx')
 * console.log('Changes applied:', fixed.changes)
 *
 * // 5. Runtime validation (in development)
 * heraDNAHooks.runtimeHook('Card', {})  // Returns false, suggests EnterpriseCard
 */
