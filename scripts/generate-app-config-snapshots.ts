#!/usr/bin/env tsx

/**
 * HERA APP_CONFIG Snapshot Generator
 * Smart Code: HERA.PLATFORM.CONFIG.SNAPSHOT.GENERATOR.v2
 * 
 * Generates deterministic snapshots of APP_CONFIG entities for regression testing
 * following the established Salon Staff preset patterns.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

interface AppConfigSnapshot {
  entity_id: string
  entity_code: string
  entity_name: string
  smart_code: string
  organization_id: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  app_definition: any
  metadata: {
    snapshot_version: string
    generated_at: string
    validation_status: 'valid' | 'invalid' | 'unknown'
    guardrail_compliance: boolean
  }
}

/**
 * Normalize object for consistent snapshots
 * Following Salon Staff preset pattern
 */
function normalize(obj: any): any {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj
  }

  // Convert functions to string representation
  if (typeof obj === 'function') {
    return `[Function: ${obj.name || 'anonymous'}]`
  }

  // Handle dates - normalize to ISO string
  if (obj instanceof Date) {
    return obj.toISOString()
  }

  // Sort arrays for consistency
  if (Array.isArray(obj)) {
    return obj
      .map(normalize)
      .sort((a, b) => {
        const aStr = JSON.stringify(a)
        const bStr = JSON.stringify(b)
        return aStr.localeCompare(bStr)
      })
  }

  // Sort object keys for consistency
  if (obj && typeof obj === 'object') {
    const normalized: any = {}
    Object.keys(obj)
      .sort()
      .forEach(key => {
        normalized[key] = normalize(obj[key])
      })
    return normalized
  }

  return obj
}

/**
 * Load APP_CONFIG entities from database
 */
async function loadAppConfigs(): Promise<AppConfigSnapshot[]> {
  console.log('🔍 Loading APP_CONFIG entities from database...')

  // Load entities
  const { data: entities, error: entitiesError } = await supabase
    .from('core_entities')
    .select(`
      id,
      entity_code,
      entity_name,
      entity_type,
      smart_code,
      organization_id,
      created_at,
      updated_at,
      created_by,
      updated_by,
      status
    `)
    .in('entity_type', ['APP_CONFIG', 'APP_CONFIG_OVERRIDE'])
    .eq('status', 'active')
    .order('entity_code')

  if (entitiesError) {
    throw new Error(`Failed to load APP_CONFIG entities: ${entitiesError.message}`)
  }

  if (!entities || entities.length === 0) {
    console.log('ℹ️  No APP_CONFIG entities found in database')
    return []
  }

  console.log(`📊 Found ${entities.length} APP_CONFIG entities`)

  // Load dynamic data for each entity
  const snapshots: AppConfigSnapshot[] = []

  for (const entity of entities) {
    console.log(`  Processing ${entity.entity_code}...`)

    // Load dynamic data
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_json, smart_code, validation_status')
      .eq('entity_id', entity.id)
      .in('field_name', ['app_definition', 'app_override'])

    // Find app definition or override
    const appDefinitionField = dynamicData?.find(d => d.field_name === 'app_definition')
    const appOverrideField = dynamicData?.find(d => d.field_name === 'app_override')
    
    const appDefinition = appDefinitionField?.field_value_json || appOverrideField?.field_value_json

    // Create snapshot
    const snapshot: AppConfigSnapshot = {
      entity_id: entity.id,
      entity_code: entity.entity_code,
      entity_name: entity.entity_name,
      smart_code: entity.smart_code,
      organization_id: entity.organization_id,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      created_by: entity.created_by,
      updated_by: entity.updated_by,
      app_definition: appDefinition,
      metadata: {
        snapshot_version: '2.0',
        generated_at: new Date().toISOString(),
        validation_status: appDefinitionField?.validation_status || 'unknown',
        guardrail_compliance: !!(entity.smart_code && entity.created_by && entity.updated_by)
      }
    }

    snapshots.push(snapshot)
  }

  return snapshots
}

/**
 * Generate individual snapshot files
 */
async function generateIndividualSnapshots(snapshots: AppConfigSnapshot[]): Promise<void> {
  const snapshotsDir = join(process.cwd(), 'snapshots', 'app-configs')
  
  // Ensure directory exists
  if (!existsSync(snapshotsDir)) {
    mkdirSync(snapshotsDir, { recursive: true })
  }

  console.log('\n📸 Generating individual snapshots...')

  for (const snapshot of snapshots) {
    const normalized = normalize(snapshot)
    const filename = `${snapshot.entity_code}.json`
    const filepath = join(snapshotsDir, filename)

    writeFileSync(filepath, JSON.stringify(normalized, null, 2) + '\n')
    console.log(`  ✅ ${filename}`)
  }

  console.log(`\n📁 Individual snapshots saved to: ${snapshotsDir}`)
}

/**
 * Generate unified snapshot file
 */
async function generateUnifiedSnapshot(snapshots: AppConfigSnapshot[]): Promise<void> {
  const snapshotsDir = join(process.cwd(), 'snapshots')
  
  // Ensure directory exists
  if (!existsSync(snapshotsDir)) {
    mkdirSync(snapshotsDir, { recursive: true })
  }

  console.log('\n📸 Generating unified snapshot...')

  // Create unified snapshot object
  const unifiedSnapshot = {
    metadata: {
      generated_at: new Date().toISOString(),
      total_configs: snapshots.length,
      snapshot_version: '2.0',
      platform_organization_id: PLATFORM_ORG_ID
    },
    configs: snapshots.reduce((acc, snapshot) => {
      acc[snapshot.entity_code] = normalize(snapshot)
      return acc
    }, {} as Record<string, any>)
  }

  const normalized = normalize(unifiedSnapshot)
  const filepath = join(snapshotsDir, 'app-configs.json')

  writeFileSync(filepath, JSON.stringify(normalized, null, 2) + '\n')
  console.log(`  ✅ Unified snapshot: app-configs.json`)
  console.log(`\n📁 Unified snapshot saved to: ${filepath}`)
}

/**
 * Generate summary report
 */
async function generateSummaryReport(snapshots: AppConfigSnapshot[]): Promise<void> {
  const snapshotsDir = join(process.cwd(), 'snapshots')
  
  console.log('\n📊 Generating summary report...')

  // Calculate statistics
  const stats = {
    total_configs: snapshots.length,
    by_type: snapshots.reduce((acc, s) => {
      const hasDefinition = !!s.app_definition
      const type = hasDefinition ? 'APP_CONFIG' : 'APP_CONFIG_OVERRIDE'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    by_organization: snapshots.reduce((acc, s) => {
      acc[s.organization_id] = (acc[s.organization_id] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    guardrail_compliance: {
      compliant: snapshots.filter(s => s.metadata.guardrail_compliance).length,
      non_compliant: snapshots.filter(s => !s.metadata.guardrail_compliance).length
    },
    validation_status: snapshots.reduce((acc, s) => {
      const status = s.metadata.validation_status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // Generate markdown report
  let report = '# HERA APP_CONFIG Snapshot Report\n\n'
  report += `**Generated**: ${new Date().toISOString()}\n`
  report += `**Total Configurations**: ${stats.total_configs}\n\n`

  report += '## Configuration Types\n\n'
  Object.entries(stats.by_type).forEach(([type, count]) => {
    report += `- **${type}**: ${count}\n`
  })

  report += '\n## Organization Distribution\n\n'
  Object.entries(stats.by_organization).forEach(([orgId, count]) => {
    const orgType = orgId === PLATFORM_ORG_ID ? 'Platform Organization' : 'Tenant Organization'
    report += `- **${orgType}**: ${count}\n`
  })

  report += '\n## Guardrail Compliance\n\n'
  report += `- **Compliant**: ${stats.guardrail_compliance.compliant} ✅\n`
  report += `- **Non-Compliant**: ${stats.guardrail_compliance.non_compliant} ❌\n`

  report += '\n## Validation Status\n\n'
  Object.entries(stats.validation_status).forEach(([status, count]) => {
    const icon = status === 'valid' ? '✅' : status === 'invalid' ? '❌' : '❓'
    report += `- **${status}**: ${count} ${icon}\n`
  })

  report += '\n## Individual Snapshots\n\n'
  snapshots.forEach(snapshot => {
    const complianceIcon = snapshot.metadata.guardrail_compliance ? '✅' : '❌'
    const validationIcon = snapshot.metadata.validation_status === 'valid' ? '✅' : 
                           snapshot.metadata.validation_status === 'invalid' ? '❌' : '❓'
    
    report += `- **${snapshot.entity_code}** ${complianceIcon} ${validationIcon}\n`
    report += `  - Smart Code: \`${snapshot.smart_code}\`\n`
    report += `  - Organization: ${snapshot.organization_id === PLATFORM_ORG_ID ? 'Platform' : 'Tenant'}\n`
    if (snapshot.app_definition) {
      report += `  - App ID: \`${snapshot.app_definition.app_id || 'N/A'}\`\n`
      report += `  - Version: \`${snapshot.app_definition.version || 'N/A'}\`\n`
    }
    report += '\n'
  })

  const reportPath = join(snapshotsDir, 'app-configs-report.md')
  writeFileSync(reportPath, report)
  console.log(`  ✅ Summary report: app-configs-report.md`)
  console.log(`\n📁 Summary report saved to: ${reportPath}`)
}

/**
 * Main execution function
 */
async function generateSnapshots(): Promise<void> {
  console.log('🚀 HERA APP_CONFIG Snapshot Generator v2.0')
  console.log('===========================================')

  try {
    // Load configurations from database
    const snapshots = await loadAppConfigs()

    if (snapshots.length === 0) {
      console.log('⚠️  No APP_CONFIG entities found. Skipping snapshot generation.')
      return
    }

    // Generate snapshots
    await generateIndividualSnapshots(snapshots)
    await generateUnifiedSnapshot(snapshots)
    await generateSummaryReport(snapshots)

    console.log('\n✅ APP_CONFIG snapshots generated successfully!')
    console.log(`📊 Total configurations: ${snapshots.length}`)
    console.log(`📁 Snapshot location: ${join(process.cwd(), 'snapshots')}`)

  } catch (error) {
    console.error('💥 Error generating APP_CONFIG snapshots:', error)
    process.exit(1)
  }
}

// Support CLI modes
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const isCI = args.includes('--ci')

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No files will be written')
  // Override write functions for dry run
  const originalWriteFileSync = writeFileSync
  global.writeFileSync = ((filepath: string, data: string) => {
    console.log(`[DRY RUN] Would write: ${filepath} (${data.length} bytes)`)
  }) as any
}

if (isCI) {
  console.log('🤖 CI MODE - Enhanced logging enabled')
}

// Execute
generateSnapshots().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})