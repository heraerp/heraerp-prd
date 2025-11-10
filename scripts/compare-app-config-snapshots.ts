#!/usr/bin/env tsx

/**
 * HERA APP_CONFIG Snapshot Comparison Tool
 * Smart Code: HERA.PLATFORM.CONFIG.SNAPSHOT.COMPARE.v2
 * 
 * Compares APP_CONFIG snapshots between different versions/branches
 * for detecting configuration drift and generating visual diffs.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { diffLines, diffJson } from 'diff'

interface SnapshotComparison {
  summary: {
    baseline_file: string
    current_file: string
    comparison_date: string
    total_changes: number
    added_configs: string[]
    removed_configs: string[]
    modified_configs: string[]
    unchanged_configs: string[]
  }
  detailed_changes: Record<string, ConfigChange>
}

interface ConfigChange {
  change_type: 'added' | 'removed' | 'modified' | 'unchanged'
  baseline_config?: any
  current_config?: any
  field_changes?: FieldChange[]
  guardrail_impact?: 'breaking' | 'warning' | 'none'
}

interface FieldChange {
  field_path: string
  change_type: 'added' | 'removed' | 'modified'
  old_value?: any
  new_value?: any
  impact_level: 'high' | 'medium' | 'low'
}

/**
 * Load snapshot file
 */
function loadSnapshot(filePath: string): any {
  if (!existsSync(filePath)) {
    throw new Error(`Snapshot file not found: ${filePath}`)
  }

  const content = readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Compare two config objects and identify changes
 */
function compareConfigs(baselineConfig: any, currentConfig: any, configKey: string): ConfigChange {
  if (!baselineConfig && currentConfig) {
    return {
      change_type: 'added',
      current_config: currentConfig,
      guardrail_impact: 'none'
    }
  }

  if (baselineConfig && !currentConfig) {
    return {
      change_type: 'removed',
      baseline_config: baselineConfig,
      guardrail_impact: 'breaking'
    }
  }

  // Both exist, check for modifications
  const baselineStr = JSON.stringify(baselineConfig, null, 2)
  const currentStr = JSON.stringify(currentConfig, null, 2)

  if (baselineStr === currentStr) {
    return {
      change_type: 'unchanged',
      baseline_config: baselineConfig,
      current_config: currentConfig,
      guardrail_impact: 'none'
    }
  }

  // Identify specific field changes
  const fieldChanges = identifyFieldChanges(baselineConfig, currentConfig)
  const guardrailImpact = assessGuardrailImpact(fieldChanges)

  return {
    change_type: 'modified',
    baseline_config: baselineConfig,
    current_config: currentConfig,
    field_changes: fieldChanges,
    guardrail_impact: guardrailImpact
  }
}

/**
 * Identify specific field changes between configs
 */
function identifyFieldChanges(baseline: any, current: any, path: string = ''): FieldChange[] {
  const changes: FieldChange[] = []

  // Get all unique keys from both objects
  const allKeys = new Set([
    ...Object.keys(baseline || {}),
    ...Object.keys(current || {})
  ])

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key
    const baselineValue = baseline?.[key]
    const currentValue = current?.[key]

    if (baselineValue === undefined && currentValue !== undefined) {
      changes.push({
        field_path: currentPath,
        change_type: 'added',
        new_value: currentValue,
        impact_level: assessFieldImpact(key, undefined, currentValue)
      })
    } else if (baselineValue !== undefined && currentValue === undefined) {
      changes.push({
        field_path: currentPath,
        change_type: 'removed',
        old_value: baselineValue,
        impact_level: assessFieldImpact(key, baselineValue, undefined)
      })
    } else if (typeof baselineValue === 'object' && typeof currentValue === 'object' && 
               baselineValue !== null && currentValue !== null &&
               !Array.isArray(baselineValue) && !Array.isArray(currentValue)) {
      // Recursively compare nested objects
      changes.push(...identifyFieldChanges(baselineValue, currentValue, currentPath))
    } else if (JSON.stringify(baselineValue) !== JSON.stringify(currentValue)) {
      changes.push({
        field_path: currentPath,
        change_type: 'modified',
        old_value: baselineValue,
        new_value: currentValue,
        impact_level: assessFieldImpact(key, baselineValue, currentValue)
      })
    }
  }

  return changes
}

/**
 * Assess the impact level of a field change
 */
function assessFieldImpact(fieldName: string, oldValue: any, newValue: any): 'high' | 'medium' | 'low' {
  // High impact fields
  const highImpactFields = [
    'smart_code',
    'entity_code',
    'organization_id',
    'app_id',
    'entity_type',
    'transaction_type'
  ]

  // Medium impact fields
  const mediumImpactFields = [
    'entity_name',
    'name',
    'version',
    'entities',
    'transactions',
    'navigation'
  ]

  if (highImpactFields.some(field => fieldName.includes(field))) {
    return 'high'
  }

  if (mediumImpactFields.some(field => fieldName.includes(field))) {
    return 'medium'
  }

  return 'low'
}

/**
 * Assess guardrail impact of field changes
 */
function assessGuardrailImpact(fieldChanges: FieldChange[]): 'breaking' | 'warning' | 'none' {
  const highImpactChanges = fieldChanges.filter(change => change.impact_level === 'high')
  const mediumImpactChanges = fieldChanges.filter(change => change.impact_level === 'medium')

  if (highImpactChanges.length > 0) {
    return 'breaking'
  }

  if (mediumImpactChanges.length > 0) {
    return 'warning'
  }

  return 'none'
}

/**
 * Compare two snapshots
 */
function compareSnapshots(baselinePath: string, currentPath: string): SnapshotComparison {
  console.log(`🔍 Comparing snapshots:`)
  console.log(`  Baseline: ${baselinePath}`)
  console.log(`  Current:  ${currentPath}`)

  const baseline = loadSnapshot(baselinePath)
  const current = loadSnapshot(currentPath)

  const baselineConfigs = baseline.configs || {}
  const currentConfigs = current.configs || {}

  // Get all config keys
  const allConfigKeys = new Set([
    ...Object.keys(baselineConfigs),
    ...Object.keys(currentConfigs)
  ])

  const addedConfigs: string[] = []
  const removedConfigs: string[] = []
  const modifiedConfigs: string[] = []
  const unchangedConfigs: string[] = []
  const detailedChanges: Record<string, ConfigChange> = {}

  // Compare each config
  for (const configKey of allConfigKeys) {
    const baselineConfig = baselineConfigs[configKey]
    const currentConfig = currentConfigs[configKey]

    const change = compareConfigs(baselineConfig, currentConfig, configKey)
    detailedChanges[configKey] = change

    switch (change.change_type) {
      case 'added':
        addedConfigs.push(configKey)
        break
      case 'removed':
        removedConfigs.push(configKey)
        break
      case 'modified':
        modifiedConfigs.push(configKey)
        break
      case 'unchanged':
        unchangedConfigs.push(configKey)
        break
    }
  }

  const totalChanges = addedConfigs.length + removedConfigs.length + modifiedConfigs.length

  return {
    summary: {
      baseline_file: baselinePath,
      current_file: currentPath,
      comparison_date: new Date().toISOString(),
      total_changes: totalChanges,
      added_configs: addedConfigs.sort(),
      removed_configs: removedConfigs.sort(),
      modified_configs: modifiedConfigs.sort(),
      unchanged_configs: unchangedConfigs.sort()
    },
    detailed_changes: detailedChanges
  }
}

/**
 * Generate markdown diff report
 */
function generateMarkdownReport(comparison: SnapshotComparison): string {
  let report = '# HERA APP_CONFIG Snapshot Comparison Report\n\n'
  
  report += `**Comparison Date**: ${comparison.summary.comparison_date}\n`
  report += `**Baseline**: \`${comparison.summary.baseline_file}\`\n`
  report += `**Current**: \`${comparison.summary.current_file}\`\n\n`

  // Summary
  report += '## Summary\n\n'
  report += `- **Total Changes**: ${comparison.summary.total_changes}\n`
  report += `- **Added Configurations**: ${comparison.summary.added_configs.length}\n`
  report += `- **Removed Configurations**: ${comparison.summary.removed_configs.length}\n`
  report += `- **Modified Configurations**: ${comparison.summary.modified_configs.length}\n`
  report += `- **Unchanged Configurations**: ${comparison.summary.unchanged_configs.length}\n\n`

  // Impact Assessment
  const breakingChanges = Object.values(comparison.detailed_changes)
    .filter(change => change.guardrail_impact === 'breaking')
  const warningChanges = Object.values(comparison.detailed_changes)
    .filter(change => change.guardrail_impact === 'warning')

  report += '## Impact Assessment\n\n'
  report += `- **Breaking Changes**: ${breakingChanges.length} ❌\n`
  report += `- **Warning Changes**: ${warningChanges.length} ⚠️\n`
  report += `- **Safe Changes**: ${comparison.summary.total_changes - breakingChanges.length - warningChanges.length} ✅\n\n`

  // Added Configurations
  if (comparison.summary.added_configs.length > 0) {
    report += '## Added Configurations ✅\n\n'
    comparison.summary.added_configs.forEach(configKey => {
      const change = comparison.detailed_changes[configKey]
      const config = change.current_config
      report += `### ${configKey}\n\n`
      report += `- **Smart Code**: \`${config?.smart_code || 'N/A'}\`\n`
      report += `- **Organization**: ${config?.organization_id || 'N/A'}\n`
      if (config?.app_definition) {
        report += `- **App ID**: \`${config.app_definition.app_id || 'N/A'}\`\n`
        report += `- **Version**: \`${config.app_definition.version || 'N/A'}\`\n`
      }
      report += '\n'
    })
  }

  // Removed Configurations
  if (comparison.summary.removed_configs.length > 0) {
    report += '## Removed Configurations ❌\n\n'
    comparison.summary.removed_configs.forEach(configKey => {
      const change = comparison.detailed_changes[configKey]
      const config = change.baseline_config
      report += `### ${configKey}\n\n`
      report += `- **Smart Code**: \`${config?.smart_code || 'N/A'}\`\n`
      report += `- **Organization**: ${config?.organization_id || 'N/A'}\n`
      if (config?.app_definition) {
        report += `- **App ID**: \`${config.app_definition.app_id || 'N/A'}\`\n`
        report += `- **Version**: \`${config.app_definition.version || 'N/A'}\`\n`
      }
      report += '\n'
    })
  }

  // Modified Configurations
  if (comparison.summary.modified_configs.length > 0) {
    report += '## Modified Configurations 📝\n\n'
    comparison.summary.modified_configs.forEach(configKey => {
      const change = comparison.detailed_changes[configKey]
      const impactIcon = change.guardrail_impact === 'breaking' ? '❌' : 
                        change.guardrail_impact === 'warning' ? '⚠️' : '✅'
      
      report += `### ${configKey} ${impactIcon}\n\n`
      report += `- **Impact Level**: ${change.guardrail_impact}\n`
      report += `- **Field Changes**: ${change.field_changes?.length || 0}\n\n`

      if (change.field_changes && change.field_changes.length > 0) {
        report += '#### Field Changes\n\n'
        change.field_changes.forEach(fieldChange => {
          const changeIcon = fieldChange.change_type === 'added' ? '➕' :
                           fieldChange.change_type === 'removed' ? '➖' : '📝'
          const impactBadge = fieldChange.impact_level === 'high' ? '🔴' :
                             fieldChange.impact_level === 'medium' ? '🟡' : '🟢'
          
          report += `- ${changeIcon} **${fieldChange.field_path}** ${impactBadge}\n`
          
          if (fieldChange.change_type === 'modified') {
            report += `  - **Old**: \`${JSON.stringify(fieldChange.old_value)}\`\n`
            report += `  - **New**: \`${JSON.stringify(fieldChange.new_value)}\`\n`
          } else if (fieldChange.change_type === 'added') {
            report += `  - **Value**: \`${JSON.stringify(fieldChange.new_value)}\`\n`
          } else if (fieldChange.change_type === 'removed') {
            report += `  - **Was**: \`${JSON.stringify(fieldChange.old_value)}\`\n`
          }
        })
        report += '\n'
      }
    })
  }

  // Unchanged Configurations (Summary only)
  if (comparison.summary.unchanged_configs.length > 0) {
    report += `## Unchanged Configurations (${comparison.summary.unchanged_configs.length})\n\n`
    report += comparison.summary.unchanged_configs.map(key => `- ${key}`).join('\n')
    report += '\n\n'
  }

  return report
}

/**
 * Generate JSON diff report
 */
function generateJsonReport(comparison: SnapshotComparison): string {
  return JSON.stringify(comparison, null, 2)
}

/**
 * Main comparison function
 */
async function compareAppConfigSnapshots(): Promise<void> {
  console.log('🔍 HERA APP_CONFIG Snapshot Comparison Tool v2.0')
  console.log('==================================================')

  const args = process.argv.slice(2)
  
  // Parse command line arguments
  let baselinePath = args.find(arg => arg.startsWith('--baseline='))?.split('=')[1]
  let currentPath = args.find(arg => arg.startsWith('--current='))?.split('=')[1]
  const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'snapshots/comparisons'
  const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'both'

  // Default paths
  if (!baselinePath) {
    baselinePath = join(process.cwd(), 'snapshots', 'app-configs-baseline.json')
  }
  
  if (!currentPath) {
    currentPath = join(process.cwd(), 'snapshots', 'app-configs.json')
  }

  try {
    // Perform comparison
    const comparison = compareSnapshots(baselinePath, currentPath)
    
    // Generate reports
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outputDirPath = join(process.cwd(), outputDir)
    
    // Ensure output directory exists
    const fs = await import('fs')
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true })
    }

    if (format === 'markdown' || format === 'both') {
      const markdownReport = generateMarkdownReport(comparison)
      const markdownPath = join(outputDirPath, `app-config-diff-${timestamp}.md`)
      writeFileSync(markdownPath, markdownReport)
      console.log(`📄 Markdown report saved: ${markdownPath}`)
    }

    if (format === 'json' || format === 'both') {
      const jsonReport = generateJsonReport(comparison)
      const jsonPath = join(outputDirPath, `app-config-diff-${timestamp}.json`)
      writeFileSync(jsonPath, jsonReport)
      console.log(`📄 JSON report saved: ${jsonPath}`)
    }

    // Summary output
    console.log('\n📊 Comparison Summary:')
    console.log(`  Total Changes: ${comparison.summary.total_changes}`)
    console.log(`  Added: ${comparison.summary.added_configs.length}`)
    console.log(`  Removed: ${comparison.summary.removed_configs.length}`)
    console.log(`  Modified: ${comparison.summary.modified_configs.length}`)
    console.log(`  Unchanged: ${comparison.summary.unchanged_configs.length}`)

    // Impact summary
    const breakingChanges = Object.values(comparison.detailed_changes)
      .filter(change => change.guardrail_impact === 'breaking').length
    const warningChanges = Object.values(comparison.detailed_changes)
      .filter(change => change.guardrail_impact === 'warning').length

    console.log('\n⚡ Impact Summary:')
    console.log(`  Breaking Changes: ${breakingChanges} ${breakingChanges > 0 ? '❌' : '✅'}`)
    console.log(`  Warning Changes: ${warningChanges} ${warningChanges > 0 ? '⚠️' : '✅'}`)

    // Exit code based on impact
    if (breakingChanges > 0) {
      console.log('\n💥 Breaking changes detected - review required!')
      process.exit(1)
    } else if (warningChanges > 0) {
      console.log('\n⚠️  Warning changes detected - consider review')
      process.exit(0)
    } else {
      console.log('\n✅ All changes are safe')
      process.exit(0)
    }

  } catch (error) {
    console.error('💥 Error comparing snapshots:', error)
    process.exit(1)
  }
}

// Show usage if no arguments provided
if (process.argv.length === 2) {
  console.log(`
Usage: tsx compare-app-config-snapshots.ts [options]

Options:
  --baseline=<path>   Path to baseline snapshot (default: snapshots/app-configs-baseline.json)
  --current=<path>    Path to current snapshot (default: snapshots/app-configs.json)
  --output=<dir>      Output directory for reports (default: snapshots/comparisons)
  --format=<format>   Report format: markdown, json, or both (default: both)

Examples:
  tsx compare-app-config-snapshots.ts
  tsx compare-app-config-snapshots.ts --baseline=snapshots/v1.0.0/app-configs.json
  tsx compare-app-config-snapshots.ts --format=markdown --output=reports
`)
  process.exit(0)
}

// Execute comparison
compareAppConfigSnapshots().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})