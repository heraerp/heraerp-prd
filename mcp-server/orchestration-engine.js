#!/usr/bin/env node

/**
 * HERA Orchestration Engine CLI
 * Execute registered orchestration flows with transaction boundaries
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]
  const payload = process.argv[4]

  if (!command || command === 'help') {
    showHelp()
    return
  }

  try {
    switch (command) {
      case 'list':
        await listOrchestrations()
        break
      
      case 'execute':
        if (!arg) {
          console.error('❌ Please provide an orchestration smart code')
          process.exit(1)
        }
        await executeOrchestration(arg, payload ? JSON.parse(payload) : {})
        break
      
      case 'simulate':
        if (!arg) {
          console.error('❌ Please provide an orchestration smart code')
          process.exit(1)
        }
        await simulateOrchestration(arg, payload ? JSON.parse(payload) : {})
        break
      
      case 'validate':
        if (!arg) {
          console.error('❌ Please provide an orchestration smart code')
          process.exit(1)
        }
        await validateOrchestration(arg)
        break
      
      default:
        console.error(`❌ Unknown command: ${command}`)
        showHelp()
        process.exit(1)
    }
  } catch (error) {
    console.error('💥 Error:', error.message)
    process.exit(1)
  }
}

function showHelp() {
  console.log(`
🔄 HERA Orchestration Engine CLI

Usage: node orchestration-engine.js <command> [args]

Commands:
  list                              List all registered orchestrations
  execute <smart_code> [payload]    Execute an orchestration flow
  simulate <smart_code> [payload]   Simulate execution (dry run)
  validate <smart_code>            Validate orchestration DAG
  help                             Show this help message

Examples:
  node orchestration-engine.js list
  node orchestration-engine.js execute HERA.SALON.POS.ORCH.CART_LINE_MGMT.v1 '{"line_type":"RETAIL"}'
  node orchestration-engine.js simulate HERA.SALON.POS.ORCH.CART_LINE_MGMT.v1 '{"action":"add"}'
  node orchestration-engine.js validate HERA.SALON.POS.ORCH.CART_LINE_MGMT.v1
`)
}

async function listOrchestrations() {
  console.log('🔄 Available Orchestration Flows')
  console.log('================================\n')

  // Get registry entity
  const { data: registry } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', PLATFORM_ORG_ID)
    .eq('entity_type', 'system_registry')
    .eq('entity_code', 'PROCEDURE_REGISTRY')
    .single()

  if (!registry) {
    console.log('❌ No procedure registry found. Run: node register-procedures.js')
    return
  }

  // Get orchestrations only
  const { data: orchestrations, error } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('entity_id', registry.id)
    .eq('field_name', 'orchestration_spec')
    .order('smart_code')

  if (error) {
    throw new Error(`Failed to query orchestrations: ${error.message}`)
  }

  if (!orchestrations || orchestrations.length === 0) {
    console.log('No orchestration flows registered yet.')
    return
  }

  orchestrations.forEach((o, index) => {
    const spec = o.field_value_json
    console.log(`${index + 1}. ${spec.smart_code}`)
    if (spec.intent) {
      console.log(`   Intent: ${spec.intent.trim()}`)
    }
    
    if (spec.triggers) {
      console.log(`   Triggers: ${spec.triggers.length} API endpoints`)
      spec.triggers.forEach(trigger => {
        console.log(`     - ${trigger.on} → ${trigger.emit}`)
      })
    }
    
    if (spec.graph?.nodes) {
      console.log(`   Execution Steps: ${spec.graph.nodes.length}`)
    }
    
    if (spec.transaction_boundaries) {
      console.log(`   Transaction Boundaries: ${spec.transaction_boundaries.length}`)
    }
    
    console.log()
  })

  console.log(`✅ Total: ${orchestrations.length} orchestration flows available`)
}

async function executeOrchestration(smartCode, payload = {}) {
  console.log(`🚀 Executing Orchestration: ${smartCode}`)
  console.log('=' .repeat(50))
  
  // Get orchestration spec
  const spec = await getOrchestrationSpec(smartCode)
  if (!spec) {
    console.log(`❌ Orchestration not found: ${smartCode}`)
    return
  }

  console.log(`Intent: ${spec.intent || 'N/A'}`)
  console.log(`Payload:`, JSON.stringify(payload, null, 2))
  console.log()

  // Validate DAG
  const validation = validateDAG(spec)
  if (!validation.valid) {
    console.log('❌ Orchestration validation failed:')
    validation.errors.forEach(error => console.log(`   - ${error}`))
    return
  }

  console.log('✅ DAG validation passed')
  
  // Execute nodes in topological order
  const executionOrder = getTopologicalOrder(spec)
  console.log(`\n📋 Execution Plan: ${executionOrder.length} nodes`)
  executionOrder.forEach((nodeId, index) => {
    const node = spec.graph.nodes.find(n => n.id === nodeId)
    console.log(`   ${index + 1}. ${nodeId}: ${node.run}`)
  })

  console.log('\n🔄 Starting Execution...')
  
  const executionContext = {
    payload,
    startTime: Date.now(),
    completedNodes: [],
    failedNodes: [],
    compensations: []
  }

  try {
    for (const nodeId of executionOrder) {
      await executeNode(spec, nodeId, executionContext)
    }

    console.log('\n✅ Orchestration completed successfully!')
    console.log(`⏱️  Total execution time: ${Date.now() - executionContext.startTime}ms`)
    console.log(`📊 Nodes executed: ${executionContext.completedNodes.length}`)

  } catch (error) {
    console.error('\n❌ Orchestration failed:', error.message)
    
    // Run compensations
    if (spec.compensation_policy?.auto_compensate && executionContext.compensations.length > 0) {
      console.log('\n🔄 Running compensations...')
      for (const compensation of executionContext.compensations.reverse()) {
        console.log(`   Compensating: ${compensation.nodeId} → ${compensation.action}`)
        // Here you would execute the compensation logic
      }
    }
    
    throw error
  }
}

async function simulateOrchestration(smartCode, payload = {}) {
  console.log(`🧪 Simulating Orchestration: ${smartCode}`)
  console.log('=' .repeat(50))
  
  const spec = await getOrchestrationSpec(smartCode)
  if (!spec) {
    console.log(`❌ Orchestration not found: ${smartCode}`)
    return
  }

  console.log(`Intent: ${spec.intent || 'N/A'}`)
  console.log(`Payload:`, JSON.stringify(payload, null, 2))
  console.log()

  // Show execution plan without actually running
  const executionOrder = getTopologicalOrder(spec)
  console.log(`📋 Execution Plan (${executionOrder.length} nodes):`)
  
  executionOrder.forEach((nodeId, index) => {
    const node = spec.graph.nodes.find(n => n.id === nodeId)
    console.log(`   ${index + 1}. ${nodeId}`)
    console.log(`      → Execute: ${node.run}`)
    
    if (node.when) {
      const conditionResult = evaluateCondition(node.when, payload)
      console.log(`      → Condition: ${node.when} (${conditionResult ? '✅ true' : '❌ false'})`)
    }
    
    if (node.compensation) {
      console.log(`      → Compensation: ${node.compensation}`)
    }
    
    console.log()
  })

  // Show transaction boundaries
  if (spec.transaction_boundaries) {
    console.log('🔐 Transaction Boundaries:')
    spec.transaction_boundaries.forEach(boundary => {
      const nodes = boundary.applies_to.filter(nodeId => executionOrder.includes(nodeId))
      console.log(`   ${boundary.name}: [${nodes.join(', ')}]`)
    })
  }

  console.log('\n✅ Simulation completed - no actual execution performed')
}

async function validateOrchestration(smartCode) {
  console.log(`🔍 Validating Orchestration: ${smartCode}`)
  console.log('=' .repeat(50))
  
  const spec = await getOrchestrationSpec(smartCode)
  if (!spec) {
    console.log(`❌ Orchestration not found: ${smartCode}`)
    return
  }

  const validation = validateDAG(spec)
  
  if (validation.valid) {
    console.log('✅ Orchestration is valid!')
    console.log(`   Nodes: ${spec.graph?.nodes?.length || 0}`)
    console.log(`   Transaction Boundaries: ${spec.transaction_boundaries?.length || 0}`)
    console.log(`   Triggers: ${spec.triggers?.length || 0}`)
  } else {
    console.log('❌ Orchestration validation failed:')
    validation.errors.forEach(error => console.log(`   - ${error}`))
  }
}

// Resolution cache for performance
const specResolutionCache = new Map()

async function getOrchestrationSpec(smartCode, organizationId = null) {
  const cacheKey = `${smartCode}:${organizationId || 'platform'}`
  
  if (specResolutionCache.has(cacheKey)) {
    return specResolutionCache.get(cacheKey)
  }

  let spec = null

  // Try org-specific lookup first (if org provided)
  if (organizationId && organizationId !== PLATFORM_ORG_ID) {
    spec = await resolveSpecFromOrg(smartCode, organizationId, 'orchestration_spec')
  }

  // Fallback to platform registry
  if (!spec) {
    spec = await resolveSpecFromOrg(smartCode, PLATFORM_ORG_ID, 'orchestration_spec')
  }

  // Cache the result
  specResolutionCache.set(cacheKey, spec)
  return spec
}

async function resolveSpecFromOrg(smartCode, organizationId, fieldName) {
  // Find anchor entity for this spec
  const { data: anchor } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('entity_code', smartCode)
    .eq('entity_type', fieldName === 'orchestration_spec' ? 'orchestration' : 'procedure')
    .single()

  if (!anchor) return null

  const { data: item } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('entity_id', anchor.id)
    .eq('field_name', fieldName)
    .eq('smart_code', smartCode)
    .single()

  return item?.field_value_json || null
}

function validateDAG(spec) {
  const errors = []
  
  if (!spec.graph?.nodes) {
    errors.push('No execution graph defined')
    return { valid: false, errors }
  }

  if (!spec.graph.nodes.length) {
    errors.push('No nodes in execution graph')
    return { valid: false, errors }
  }

  // Check for required fields in nodes
  spec.graph.nodes.forEach(node => {
    if (!node.id) errors.push(`Node missing ID`)
    if (!node.run) errors.push(`Node ${node.id} missing run procedure`)
  })

  // Validate smart codes
  spec.graph.nodes.forEach(node => {
    if (node.run && !node.run.match(/^HERA\.[A-Z0-9_]+\.[A-Z0-9_]+\.[A-Z0-9_]+\.v\d+$/i)) {
      errors.push(`Node ${node.id} has invalid smart code: ${node.run}`)
    }
  })

  return { valid: errors.length === 0, errors }
}

function getTopologicalOrder(spec) {
  // Simple topological sort based on edge definitions
  // In a real implementation, this would parse the edges and create proper dependency graph
  return spec.graph.nodes.map(node => node.id)
}

async function executeNode(spec, nodeId, context) {
  const node = spec.graph.nodes.find(n => n.id === nodeId)
  
  console.log(`\n📍 Executing: ${nodeId}`)
  console.log(`   Procedure: ${node.run}`)
  
  // Evaluate condition if present
  if (node.when) {
    const conditionResult = evaluateCondition(node.when, context.payload)
    console.log(`   Condition: ${node.when} → ${conditionResult}`)
    
    if (!conditionResult) {
      console.log(`   ⏭️  Skipped (condition false)`)
      return
    }
  }

  // Generate idempotency key for this node execution
  const idemKey = generateIdempotencyKey(nodeId, context)
  console.log(`   🔑 Idempotency Key: ${idemKey}`)

  // Check if this node was already executed (idempotency)
  const existingExecution = await checkNodeExecution(idemKey, nodeId)
  if (existingExecution) {
    console.log(`   🔄 Already executed (idempotent)`)
    return
  }

  // Row-level locking for cart operations
  if (context.payload.cart_id && node.run.includes('CART')) {
    const lockAcquired = await acquireCartLock(context.payload.cart_id)
    if (!lockAcquired) {
      throw new Error('Cart is busy - another operation in progress')
    }
    console.log(`   🔒 Cart lock acquired`)
  }

  try {
    // Simulate execution (in real implementation, this would call the actual procedure)
    console.log(`   ⚡ Simulating execution...`)
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Record execution with idempotency metadata
    await recordNodeExecution(idemKey, nodeId, context)
    
    // Record completion
    context.completedNodes.push(nodeId)
    
    // Register compensation if defined
    if (node.compensation) {
      context.compensations.push({
        nodeId,
        action: node.compensation
      })
    }
    
    console.log(`   ✅ Completed`)

  } finally {
    // Release cart lock if acquired
    if (context.payload.cart_id && node.run.includes('CART')) {
      await releaseCartLock(context.payload.cart_id)
      console.log(`   🔓 Cart lock released`)
    }
  }
}

function generateIdempotencyKey(nodeId, context) {
  const crypto = require('crypto')
  const payload = JSON.stringify(context.payload)
  const input = `${nodeId}:${payload}:${context.startTime}`
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16)
}

async function checkNodeExecution(idemKey, nodeId) {
  try {
    const { data, error } = await supabase
      .from('universal_transactions')
      .select('id')
      .eq('metadata->>idem_key', idemKey)
      .eq('metadata->>node_id', nodeId)
      .eq('transaction_type', 'orchestration_node')
      .single()

    return !error && data
  } catch (error) {
    return false
  }
}

async function recordNodeExecution(idemKey, nodeId, context) {
  const { error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: context.payload.organization_id || PLATFORM_ORG_ID,
      transaction_type: 'orchestration_node',
      transaction_code: `ORCH-${nodeId}-${idemKey}`,
      smart_code: 'HERA.SYS.ORCHESTRATION.NODE.EXEC.v1',
      total_amount: 0,
      transaction_status: 'completed',
      ai_confidence: 1.0,
      metadata: {
        idem_key: idemKey,
        node_id: nodeId,
        execution_time: Date.now() - context.startTime,
        payload_hash: require('crypto').createHash('md5').update(JSON.stringify(context.payload)).digest('hex')
      }
    })

  if (error) {
    console.warn(`   ⚠️  Failed to record execution: ${error.message}`)
  }
}

async function acquireCartLock(cartId) {
  try {
    const { data, error } = await supabase
      .rpc('acquire_cart_lock', { cart_transaction_id: cartId })

    if (error) {
      console.warn(`   ⚠️  Lock acquisition failed: ${error.message}`)
      return false
    }

    return true
  } catch (error) {
    console.warn(`   ⚠️  Lock acquisition error: ${error.message}`)
    return false
  }
}

async function releaseCartLock(cartId) {
  try {
    await supabase
      .rpc('release_cart_lock', { cart_transaction_id: cartId })
  } catch (error) {
    console.warn(`   ⚠️  Lock release error: ${error.message}`)
  }
}

function evaluateCondition(condition, payload) {
  // Simple condition evaluation - in production this would use a proper expression parser
  try {
    // Replace $.payload with actual payload
    const expr = condition.replace(/\$\.payload/g, 'payload')
    // This is a simple eval - in production, use a safe expression evaluator
    return eval(expr)
  } catch (error) {
    console.warn(`Failed to evaluate condition: ${condition}`)
    return false
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { main }