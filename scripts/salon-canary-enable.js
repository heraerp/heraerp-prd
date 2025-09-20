#!/usr/bin/env node

/**
 * SALON CANARY ENABLEMENT SCRIPT
 * 
 * This script safely enables the playbook mode for Hair Talkz POS cart operations
 * with full monitoring and rollback capability.
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const { createHash } = require('crypto')

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const HAIR_TALKZ_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0' // Hair Talkz organization

/**
 * Enable playbook mode for a specific feature
 */
async function enablePlaybookMode(
  organizationId,
  feature,
  enabled,
  reason
) {
  console.log(`\n🔧 ${enabled ? 'Enabling' : 'Disabling'} playbook_mode.${feature} for ${organizationId}...`)
  
  // First, delete any existing flag
  await supabase
    .from('core_dynamic_data')
    .delete()
    .eq('organization_id', organizationId)
    .eq('entity_id', organizationId)
    .eq('field_name', `playbook_mode_${feature}`)
  
  // Create the feature flag
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .insert({
      organization_id: organizationId,
      entity_id: organizationId,
      field_name: `playbook_mode_${feature}`,
      field_type: 'boolean',
      field_value_boolean: enabled,
      smart_code: 'HERA.CONFIG.FEATURE_FLAG.V1',
      field_value_json: {
        enabled_at: new Date().toISOString(),
        enabled_by: 'canary_script',
        reason: reason,
        previous_value: !enabled
      }
    })
    
  if (error) {
    console.error('❌ Error setting feature flag:', error)
    return false
  }
  
  console.log(`✅ Feature flag set: playbook_mode.${feature} = ${enabled}`)
  
  // Create audit record
  await createAuditRecord(organizationId, feature, enabled, reason)
  
  return true
}

/**
 * Create audit trail for feature flag changes
 */
async function createAuditRecord(
  organizationId,
  feature,
  enabled,
  reason
) {
  const { error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'audit',
      smart_code: 'HERA.AUDIT.FEATURE_FLAG.CHANGE.V1',
      total_amount: 0,
      metadata: {
        feature: `playbook_mode.${feature}`,
        enabled: enabled,
        reason: reason,
        timestamp: new Date().toISOString(),
        changed_by: 'canary_script'
      }
    })
    
  if (!error) {
    console.log('📝 Audit record created')
  }
}

/**
 * Verify current feature flag status
 */
async function checkFeatureFlags(organizationId) {
  console.log(`\n📊 Current feature flags for ${organizationId}:`)
  
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_boolean, field_value_json')
    .eq('organization_id', organizationId)
    .eq('entity_id', organizationId)
    .like('field_name', 'playbook_mode_%')
    
  if (error) {
    console.error('Error checking flags:', error)
    return
  }
  
  if (!data || data.length === 0) {
    console.log('No playbook_mode flags set (all default to false)')
    return
  }
  
  data.forEach(flag => {
    const feature = flag.field_name.replace('playbook_mode_', '')
    const enabled = flag.field_value_boolean === true
    const enabledAt = flag.field_value_json?.enabled_at || 'unknown'
    console.log(`  - ${feature}: ${enabled ? '✅ ENABLED' : '❌ DISABLED'} (since ${enabledAt})`)
  })
}

/**
 * Create baseline metrics snapshot before enabling
 */
async function createMetricsSnapshot(organizationId) {
  console.log('\n📸 Creating baseline metrics snapshot...')
  
  // Get current metrics
  const metrics = {
    timestamp: new Date().toISOString(),
    organization_id: organizationId,
    phase: 'pre_canary',
    metrics: {
      active_carts: 0,
      avg_reprice_time_ms: 0,
      error_rate_percent: 0,
      total_requests_24h: 0
    }
  }
  
  // Get active cart count
  const { count: cartCount } = await supabase
    .from('universal_transactions')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'cart')
    .eq('transaction_status', 'active')
    
  metrics.metrics.active_carts = cartCount || 0
  
  // Store snapshot
  const { error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'metrics',
      smart_code: 'HERA.METRICS.SNAPSHOT.CANARY.V1',
      total_amount: 0,
      metadata: metrics
    })
    
  if (!error) {
    console.log('✅ Metrics snapshot created')
    console.log(JSON.stringify(metrics, null, 2))
  }
  
  return metrics
}

/**
 * Setup monitoring alerts
 */
async function setupMonitoringAlerts(organizationId) {
  console.log('\n🚨 Setting up monitoring alerts...')
  
  const alerts = [
    {
      name: 'pos_cart_error_rate',
      condition: 'error_rate > 0.001', // 0.1%
      severity: 'critical',
      action: 'rollback_flag'
    },
    {
      name: 'pos_cart_latency_p95',
      condition: 'p95_latency_ms > 200',
      severity: 'warning',
      action: 'investigate'
    },
    {
      name: 'correlation_id_missing',
      condition: 'correlation_coverage < 0.95', // 95%
      severity: 'warning',
      action: 'check_adapter'
    }
  ]
  
  // Store alert configuration
  for (const alert of alerts) {
    // Delete existing alert config
    await supabase
      .from('core_dynamic_data')
      .delete()
      .eq('organization_id', organizationId)
      .eq('entity_id', `alert-${alert.name}`)
      .eq('field_name', 'alert_config')
    
    // Insert new alert config
    await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: organizationId,
        entity_id: `alert-${alert.name}`,
        field_name: 'alert_config',
        field_type: 'json',
        field_value_json: alert,
        smart_code: 'HERA.MONITOR.ALERT.CONFIG.V1'
      })
  }
  
  console.log(`✅ ${alerts.length} monitoring alerts configured`)
}

/**
 * Main canary enablement flow
 */
async function enableCanary() {
  console.log('🚀 SALON CANARY ENABLEMENT - Hair Talkz POS Cart')
  console.log('================================================')
  
  // Step 1: Check current status
  await checkFeatureFlags(HAIR_TALKZ_ORG_ID)
  
  // Step 2: Create baseline metrics
  await createMetricsSnapshot(HAIR_TALKZ_ORG_ID)
  
  // Step 3: Setup monitoring
  await setupMonitoringAlerts(HAIR_TALKZ_ORG_ID)
  
  // Step 4: Enable the flag
  const success = await enablePlaybookMode(
    HAIR_TALKZ_ORG_ID,
    'pos_cart',
    true,
    'Canary rollout phase 1: POS cart repricing'
  )
  
  if (!success) {
    console.error('\n❌ Failed to enable canary. Aborting.')
    process.exit(1)
  }
  
  // Step 5: Verify enablement
  await checkFeatureFlags(HAIR_TALKZ_ORG_ID)
  
  console.log('\n✅ CANARY ENABLED SUCCESSFULLY!')
  console.log('\n📋 Next Steps:')
  console.log('1. Run the 3 scripted test flows')
  console.log('2. Monitor dashboard: http://localhost:3000/dashboards/hair-talkz-workflows')
  console.log('3. Check SLOs every hour for 24 hours')
  console.log('4. If any issues, run: npm run salon:canary:rollback')
  
  // Print rollback command
  console.log('\n🔄 Instant Rollback Command:')
  console.log(`node scripts/salon-canary-rollback.js ${HAIR_TALKZ_ORG_ID} pos_cart`)
}

/**
 * Rollback function (can be called separately)
 */
async function rollbackCanary(organizationId, feature) {
  console.log(`\n⚠️  ROLLING BACK playbook_mode.${feature} for ${organizationId}...`)
  
  const success = await enablePlaybookMode(
    organizationId,
    feature,
    false,
    'Rollback due to issues detected'
  )
  
  if (success) {
    console.log('✅ Rollback completed successfully')
  } else {
    console.error('❌ Rollback failed! Manual intervention required.')
  }
  
  return success
}

// Run if called directly
if (require.main === module) {
  enableCanary().catch(console.error)
}

// Export for use in other scripts
module.exports = { rollbackCanary }