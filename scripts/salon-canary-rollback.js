#!/usr/bin/env node

/**
 * SALON CANARY ROLLBACK
 * 
 * Instant rollback script for salon playbook features
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Rollback a specific feature flag
 */
async function rollbackFeature(organizationId: string, feature: string, reason: string = 'Manual rollback') {
  console.log(`\n⚠️  ROLLING BACK playbook_mode.${feature} for ${organizationId}...`)
  
  const startTime = Date.now()
  
  try {
    // Step 1: Disable the feature flag
    const { data, error } = await supabase
      .from('core_dynamic_data')
      .update({
        field_value: 'false',
        metadata: {
          disabled_at: new Date().toISOString(),
          disabled_by: 'rollback_script',
          reason: reason,
          previous_value: 'true'
        }
      })
      .eq('organization_id', organizationId)
      .eq('entity_id', organizationId)
      .eq('field_name', `playbook_mode_${feature}`)
      .select()
      .single()
      
    if (error) {
      console.error('❌ Error disabling feature flag:', error)
      return false
    }
    
    console.log(`✅ Feature flag disabled in ${Date.now() - startTime}ms`)
    
    // Step 2: Create audit record
    const { error: auditError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'audit',
        smart_code: 'HERA.AUDIT.ROLLBACK.V1',
        total_amount: 0,
        metadata: {
          feature: `playbook_mode.${feature}`,
          action: 'rollback',
          reason: reason,
          timestamp: new Date().toISOString(),
          rollback_duration_ms: Date.now() - startTime
        }
      })
      
    if (!auditError) {
      console.log('📝 Audit record created')
    }
    
    // Step 3: Check for in-flight operations
    const { count: inFlightCount } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .like('smart_code', `HERA.SALON.${feature.toUpperCase()}.%`)
      .gte('created_at', `now() - interval '5 minutes'`)
      
    if (inFlightCount > 0) {
      console.log(`⚠️  ${inFlightCount} in-flight operations detected (will complete on legacy path)`)
    }
    
    console.log('\n✅ ROLLBACK COMPLETED SUCCESSFULLY')
    console.log(`   Total time: ${Date.now() - startTime}ms`)
    
    return true
    
  } catch (error) {
    console.error('❌ Rollback failed:', error)
    return false
  }
}

/**
 * Emergency rollback all salon features
 */
async function emergencyRollbackAll(organizationId: string) {
  console.log('\n🚨 EMERGENCY ROLLBACK - ALL SALON FEATURES')
  console.log('==========================================')
  
  const features = [
    'pos_cart',
    'pos_lines', 
    'checkout',
    'appointments',
    'customers',
    'whatsapp',
    'returns',
    'calendar'
  ]
  
  let successCount = 0
  
  for (const feature of features) {
    const success = await rollbackFeature(organizationId, feature, 'Emergency rollback - all features')
    if (success) successCount++
  }
  
  console.log(`\n📊 Rollback Summary: ${successCount}/${features.length} features rolled back`)
  
  if (successCount === features.length) {
    console.log('✅ All features rolled back successfully')
  } else {
    console.log('⚠️  Some rollbacks failed - manual intervention required')
  }
}

/**
 * Check current feature flag status
 */
async function checkCurrentStatus(organizationId: string) {
  console.log(`\n📊 Current feature flags for ${organizationId}:`)
  
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value, metadata')
    .eq('organization_id', organizationId)
    .eq('entity_id', organizationId)
    .like('field_name', 'playbook_mode_%')
    
  if (error || !data || data.length === 0) {
    console.log('No playbook_mode flags found')
    return
  }
  
  data.forEach(flag => {
    const feature = flag.field_name.replace('playbook_mode_', '')
    const enabled = flag.field_value === 'true'
    const changedAt = flag.metadata?.enabled_at || flag.metadata?.disabled_at || 'unknown'
    console.log(`  - ${feature}: ${enabled ? '✅ ENABLED' : '❌ DISABLED'} (last changed: ${changedAt})`)
  })
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('Usage:')
    console.log('  node salon-canary-rollback.js <org-id> <feature>  # Rollback specific feature')
    console.log('  node salon-canary-rollback.js <org-id> --all      # Emergency rollback all')
    console.log('  node salon-canary-rollback.js <org-id> --status   # Check current status')
    console.log('')
    console.log('Features: pos_cart, pos_lines, checkout, appointments, customers, whatsapp, returns, calendar')
    process.exit(1)
  }
  
  const organizationId = args[0]
  const command = args[1]
  
  console.log('🔄 SALON CANARY ROLLBACK')
  console.log('=======================')
  console.log(`Organization: ${organizationId}`)
  console.log(`Time: ${new Date().toISOString()}`)
  
  if (command === '--status') {
    await checkCurrentStatus(organizationId)
  } else if (command === '--all') {
    console.log('\n⚠️  WARNING: This will rollback ALL salon features!')
    console.log('Press Ctrl+C within 3 seconds to cancel...')
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    await emergencyRollbackAll(organizationId)
  } else if (command) {
    const feature = command
    console.log(`\nRolling back feature: ${feature}`)
    
    const success = await rollbackFeature(organizationId, feature)
    
    if (success) {
      console.log('\n📋 Next steps:')
      console.log('1. Verify traffic has shifted back to legacy path')
      console.log('2. Check application logs for any errors')
      console.log('3. Investigate root cause of issues')
      console.log('4. Fix issues before re-enabling')
    }
  } else {
    console.error('Invalid command. Use --help for usage.')
    process.exit(1)
  }
}

// Quick rollback for Hair Talkz POS cart
export async function quickRollbackHairTalkzPOSCart() {
  const HAIR_TALKZ_ORG_ID = 'hair-talkz-salon-org-uuid'
  return await rollbackFeature(HAIR_TALKZ_ORG_ID, 'pos_cart', 'Quick rollback via function call')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}