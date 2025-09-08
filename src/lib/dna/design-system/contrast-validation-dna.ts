/**
 * HERA DNA Contrast Validation System
 * Automated AA/AAA compliance checking for WCAG accessibility
 * Integrates with build pipeline to prevent contrast violations
 */

import { HERA_COLOR_TOKENS, HeraColorUtils } from './hera-color-palette-dna'

export interface ContrastPair {
  foreground: string
  background: string
  label: string
  context: 'normal' | 'large' | 'ui'
  required: 'AA' | 'AAA'
}

export interface ContrastResult {
  ratio: number
  passes: {
    AA: boolean
    AAA: boolean
  }
  grade: 'A+' | 'A' | 'B' | 'C' | 'F'
  label: string
  foreground: string
  background: string
}

export interface ContrastReport {
  passed: boolean
  totalPairs: number
  passingPairs: number
  failingPairs: number
  results: ContrastResult[]
  summary: string
}

/**
 * WCAG Contrast Requirements
 */
export const WCAG_STANDARDS = {
  AA: {
    normal: 4.5,    // Normal text
    large: 3.0,     // Large text (18pt+ or 14pt+ bold)
    ui: 3.0         // UI components
  },
  AAA: {
    normal: 7.0,    // Normal text
    large: 4.5,     // Large text
    ui: 4.5         // UI components
  }
} as const

/**
 * Critical HERA Color Pairs for Validation
 * These pairs MUST pass AA contrast requirements
 */
export const CRITICAL_CONTRAST_PAIRS: ContrastPair[] = [
  // Primary text combinations
  {
    foreground: '#0A0E14', // text.light
    background: '#FFFFFF', // bg.light
    label: 'Text on background (light mode)',
    context: 'normal',
    required: 'AA'
  },
  {
    foreground: '#E8EDF5', // text.dark
    background: '#0B0F17', // bg.dark
    label: 'Text on background (dark mode)',
    context: 'normal',
    required: 'AA'
  },

  // Primary button combinations
  {
    foreground: '#FFFFFF', // primaryFg.light
    background: '#3B82F6', // primary.light
    label: 'Primary button text (light mode)',
    context: 'ui',
    required: 'AA'
  },
  {
    foreground: '#0A0E14', // primaryFg.dark
    background: '#60A5FA', // primary.dark
    label: 'Primary button text (dark mode)',
    context: 'ui',
    required: 'AA'
  },

  // Secondary button combinations
  {
    foreground: '#0A0E14', // secondaryFg.light
    background: '#06B6D4', // secondary.light
    label: 'Secondary button text (light mode)',
    context: 'ui',
    required: 'AA'
  },
  {
    foreground: '#0A0E14', // secondaryFg.dark
    background: '#22D3EE', // secondary.dark
    label: 'Secondary button text (dark mode)',
    context: 'ui',
    required: 'AA'
  },

  // Accent combinations
  {
    foreground: '#0A0E14', // accentFg.light
    background: '#10B981', // accent.light
    label: 'Accent button text (light mode)',
    context: 'ui',
    required: 'AA'
  },
  {
    foreground: '#0A0E14', // accentFg.dark
    background: '#34D399', // accent.dark
    label: 'Accent button text (dark mode)',
    context: 'ui',
    required: 'AA'
  },

  // Status color combinations
  {
    foreground: '#FFFFFF',
    background: '#22C55E', // success.light
    label: 'Success message text (light mode)',
    context: 'ui',
    required: 'AA'
  },
  {
    foreground: '#FFFFFF',
    background: '#4ADE80', // success.dark
    label: 'Success message text (dark mode)',
    context: 'ui',
    required: 'AA'
  },
  {
    foreground: '#FFFFFF',
    background: '#EF4444', // danger.light
    label: 'Error message text (light mode)',
    context: 'ui',
    required: 'AA'
  },
  {
    foreground: '#FFFFFF',
    background: '#F87171', // danger.dark
    label: 'Error message text (dark mode)',
    context: 'ui',
    required: 'AA'
  },

  // Muted text combinations
  {
    foreground: '#64748B', // textMuted.light
    background: '#FFFFFF', // bg.light
    label: 'Muted text on background (light mode)',
    context: 'normal',
    required: 'AA'
  },
  {
    foreground: '#94A3B8', // textMuted.dark
    background: '#0B0F17', // bg.dark
    label: 'Muted text on background (dark mode)',
    context: 'normal',
    required: 'AA'
  },

  // Surface combinations
  {
    foreground: '#0A0E14', // text.light
    background: '#F8FAFC', // surface.light
    label: 'Text on surface (light mode)',
    context: 'normal',
    required: 'AA'
  },
  {
    foreground: '#E8EDF5', // text.dark
    background: '#111725', // surface.dark
    label: 'Text on surface (dark mode)',
    context: 'normal',
    required: 'AA'
  }
]

/**
 * HERA Contrast Validator Class
 */
export class HeraContrastValidator {
  
  /**
   * Convert hex color to sRGB
   */
  private static hexToSrgb(hex: string): number[] {
    const cleanHex = hex.replace('#', '')
    const r = parseInt(cleanHex.slice(0, 2), 16) / 255
    const g = parseInt(cleanHex.slice(2, 4), 16) / 255  
    const b = parseInt(cleanHex.slice(4, 6), 16) / 255
    
    return [r, g, b].map(c => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    )
  }

  /**
   * Calculate relative luminance
   */
  private static getRelativeLuminance(hex: string): number {
    const [R, G, B] = this.hexToSrgb(hex)
    return 0.2126 * R + 0.7152 * G + 0.0722 * B
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static calculateContrastRatio(foreground: string, background: string): number {
    const L1 = this.getRelativeLuminance(foreground)
    const L2 = this.getRelativeLuminance(background)
    
    const [lighter, darker] = [Math.max(L1, L2), Math.min(L1, L2)]
    return (lighter + 0.05) / (darker + 0.05)
  }

  /**
   * Check if a contrast ratio meets WCAG requirements
   */
  static checkContrastCompliance(
    ratio: number, 
    context: ContrastPair['context'], 
    standard: 'AA' | 'AAA'
  ): boolean {
    const requirement = WCAG_STANDARDS[standard][context]
    return ratio >= requirement
  }

  /**
   * Get contrast grade based on ratio
   */
  static getContrastGrade(ratio: number, context: ContrastPair['context']): ContrastResult['grade'] {
    const aaaThreshold = WCAG_STANDARDS.AAA[context]
    const aaThreshold = WCAG_STANDARDS.AA[context]
    
    if (ratio >= aaaThreshold * 1.5) return 'A+'
    if (ratio >= aaaThreshold) return 'A'
    if (ratio >= aaThreshold) return 'B'
    if (ratio >= aaThreshold * 0.8) return 'C'
    return 'F'
  }

  /**
   * Validate a single contrast pair
   */
  static validatePair(pair: ContrastPair): ContrastResult {
    const ratio = this.calculateContrastRatio(pair.foreground, pair.background)
    
    return {
      ratio,
      passes: {
        AA: this.checkContrastCompliance(ratio, pair.context, 'AA'),
        AAA: this.checkContrastCompliance(ratio, pair.context, 'AAA')
      },
      grade: this.getContrastGrade(ratio, pair.context),
      label: pair.label,
      foreground: pair.foreground,
      background: pair.background
    }
  }

  /**
   * Validate all critical contrast pairs
   */
  static validateAllPairs(pairs: ContrastPair[] = CRITICAL_CONTRAST_PAIRS): ContrastReport {
    const results = pairs.map(pair => this.validatePair(pair))
    
    const passingPairs = results.filter(result => 
      result.passes.AA && result.grade !== 'F'
    ).length
    
    const failingPairs = results.length - passingPairs
    const passed = failingPairs === 0

    let summary = `Contrast Validation Report:\n`
    summary += `📊 Total Pairs: ${results.length}\n`
    summary += `✅ Passing: ${passingPairs}\n`
    summary += `❌ Failing: ${failingPairs}\n`
    
    if (passed) {
      summary += `🎉 All contrast requirements met!`
    } else {
      summary += `⚠️  ${failingPairs} pairs need attention`
    }

    return {
      passed,
      totalPairs: results.length,
      passingPairs,
      failingPairs,
      results,
      summary
    }
  }

  /**
   * Generate detailed report for CI/CD
   */
  static generateDetailedReport(pairs: ContrastPair[] = CRITICAL_CONTRAST_PAIRS): string {
    const report = this.validateAllPairs(pairs)
    let output = `\n🧬 HERA DNA Contrast Validation Report\n`
    output += `=====================================\n\n`

    for (const result of report.results) {
      const status = result.passes.AA ? '✅' : '❌'
      const grade = result.grade
      const ratio = result.ratio.toFixed(2)
      
      output += `${status} ${result.label}\n`
      output += `   Ratio: ${ratio}:1 (Grade: ${grade})\n`
      output += `   Colors: ${result.foreground} on ${result.background}\n`
      output += `   AA: ${result.passes.AA ? 'PASS' : 'FAIL'} | AAA: ${result.passes.AAA ? 'PASS' : 'FAIL'}\n\n`
    }

    output += `\n${report.summary}\n`
    
    if (!report.passed) {
      output += `\n🔧 Recommended Actions:\n`
      report.results
        .filter(r => !r.passes.AA)
        .forEach(result => {
          output += `• Fix "${result.label}" - needs ${this.getRequiredRatio(result)} contrast ratio\n`
        })
    }

    return output
  }

  private static getRequiredRatio(result: ContrastResult): string {
    const context = 'ui' // Most restrictive for safety
    const required = WCAG_STANDARDS.AA[context]
    return `≥${required}:1`
  }

  /**
   * CLI-friendly validation (for package.json scripts)
   */
  static validateForCLI(): void {
    console.log('🧬 Running HERA DNA Contrast Validation...\n')
    
    const report = this.validateAllPairs()
    console.log(this.generateDetailedReport())
    
    if (!report.passed) {
      console.error('\n❌ Contrast validation failed!')
      console.error('Fix the failing contrast pairs before deploying.\n')
      process.exit(1)
    } else {
      console.log('\n✅ All contrast requirements met!')
      console.log('Safe to deploy with excellent accessibility.\n')
    }
  }

  /**
   * Integration with HERA DNA Auto-Enforcement
   */
  static validateDNAComponents(): ContrastReport {
    // Additional pairs specifically for DNA components
    const dnaComponentPairs: ContrastPair[] = [
      // EnterpriseCard combinations
      {
        foreground: '#0A0E14',
        background: '#FFFFFF',
        label: 'EnterpriseCard content (light)',
        context: 'normal',
        required: 'AA'
      },
      {
        foreground: '#E8EDF5',
        background: '#111725',
        label: 'EnterpriseCard content (dark)',
        context: 'normal',
        required: 'AA'
      },
      
      // EnterpriseStatsCard numbers (large text)
      {
        foreground: '#0A0E14',
        background: '#F8FAFC',
        label: 'Stats card values (light)',
        context: 'large',
        required: 'AA'
      },
      {
        foreground: '#E8EDF5',
        background: '#111725',
        label: 'Stats card values (dark)',
        context: 'large',
        required: 'AA'
      }
    ]

    const allPairs = [...CRITICAL_CONTRAST_PAIRS, ...dnaComponentPairs]
    return this.validateAllPairs(allPairs)
  }
}

/**
 * React Hook for Runtime Contrast Checking
 */
export function useContrastValidation() {
  const [validationResults, setValidationResults] = useState<ContrastReport | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const validateContrast = useCallback(async (pairs?: ContrastPair[]) => {
    setIsValidating(true)
    
    // Run validation in next tick to prevent blocking UI
    setTimeout(() => {
      const results = HeraContrastValidator.validateAllPairs(pairs)
      setValidationResults(results)
      setIsValidating(false)
    }, 0)
  }, [])

  const validateDNAComponents = useCallback(async () => {
    setIsValidating(true)
    
    setTimeout(() => {
      const results = HeraContrastValidator.validateDNAComponents()
      setValidationResults(results)
      setIsValidating(false)
    }, 0)
  }, [])

  return {
    validationResults,
    isValidating,
    validateContrast,
    validateDNAComponents,
    isCompliant: validationResults?.passed ?? null
  }
}

// Required imports for React hook
import { useState, useCallback } from 'react'

/**
 * Export validation function for CI/CD integration
 */
export const validateContrastForBuild = () => {
  HeraContrastValidator.validateForCLI()
}

/**
 * Export everything
 */
export {
  HeraContrastValidator,
  CRITICAL_CONTRAST_PAIRS,
  WCAG_STANDARDS
}

/**
 * USAGE EXAMPLES:
 * 
 * 1. CLI Validation (package.json):
 * "scripts": {
 *   "check:contrast": "node -e \"require('./src/lib/dna/design-system/contrast-validation-dna').validateContrastForBuild()\""
 * }
 * 
 * 2. Programmatic Validation:
 * const report = HeraContrastValidator.validateAllPairs()
 * console.log(report.passed) // true/false
 * 
 * 3. React Component:
 * const { validateDNAComponents, isCompliant } = useContrastValidation()
 * 
 * 4. Custom Pair Validation:
 * const customPair = { foreground: '#fff', background: '#000', label: 'Custom', context: 'normal', required: 'AA' }
 * const result = HeraContrastValidator.validatePair(customPair)
 */