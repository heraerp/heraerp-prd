#!/usr/bin/env node

/**
 * HERA Procedure Registry Query Tool
 * Query and inspect procedures registered in core_dynamic_data
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]

  if (!command || command === 'help') {
    showHelp()
    return
  }

  try {
    switch (command) {
      case 'list':
        await listProcedures()
        break
      
      case 'get':
        if (!arg) {
          console.error('❌ Please provide a smart code')
          console.log('Usage: node query-procedures.js get HERA.SALON.POS.CART.ADD_LINE.v1')
          process.exit(1)
        }
        await getProcedure(arg)
        break
      
      case 'search':
        if (!arg) {
          console.error('❌ Please provide a search term')
          console.log('Usage: node query-procedures.js search SALON')
          process.exit(1)
        }
        await searchProcedures(arg)
        break
      
      case 'validate':
        await validateProcedures()
        break
      
      case 'orchestrations':
        await listOrchestrations()
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
🔍 HERA Procedure Registry Query Tool

Usage: node query-procedures.js <command> [args]

Commands:
  list                        List all registered procedures and orchestrations
  get <smart_code>           Get a specific procedure/orchestration by smart code
  search <term>              Search procedures/orchestrations by smart code or intent
  validate                   Validate all registered procedures and orchestrations
  orchestrations             List only orchestration flows
  help                       Show this help message

Examples:
  node query-procedures.js list
  node query-procedures.js get HERA.SALON.POS.CART.ADD_LINE.v1
  node query-procedures.js search SALON
  node query-procedures.js validate
`)
}

async function listProcedures() {
  console.log('📋 Registered Procedures')
  console.log('=======================\n')

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

  // Get all procedures and orchestrations
  const { data: specs, error } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('entity_id', registry.id)
    .in('field_name', ['procedure_spec', 'orchestration_spec'])
    .order('smart_code')

  if (error) {
    throw new Error(`Failed to query procedures: ${error.message}`)
  }

  if (!specs || specs.length === 0) {
    console.log('No procedures or orchestrations registered yet.')
    return
  }

  // Separate by type
  const procedures = specs.filter(s => s.field_name === 'procedure_spec')
  const orchestrations = specs.filter(s => s.field_name === 'orchestration_spec')

  // Group procedures by module
  const grouped = {}
  procedures.forEach(p => {
    const spec = p.field_value_json
    const parts = spec.smart_code.split('.')
    const module = parts[2] // e.g., POS, INV, CRM
    
    if (!grouped[module]) grouped[module] = []
    grouped[module].push({ spec, type: 'procedure' })
  })

  // Add orchestrations to appropriate modules
  orchestrations.forEach(o => {
    const spec = o.field_value_json
    const parts = spec.smart_code.split('.')
    const module = parts[2] // e.g., POS, INV, CRM
    
    if (!grouped[module]) grouped[module] = []
    grouped[module].push({ spec, type: 'orchestration' })
  })

  // Display grouped
  Object.entries(grouped).forEach(([module, items]) => {
    console.log(`\n${module} Module (${items.length} items)`)
    console.log('-'.repeat(50))
    
    items.forEach(({ spec, type }) => {
      const typeIcon = type === 'orchestration' ? '🔄' : '📄'
      console.log(`  ${typeIcon} ${spec.smart_code} (${type})`)
      if (spec.intent) {
        console.log(`    → ${spec.intent.trim()}`)
      }
    })
  })

  console.log(`\n✅ Total: ${procedures.length} procedures, ${orchestrations.length} orchestrations`)
}

async function listOrchestrations() {
  console.log('🔄 Orchestration Flows')
  console.log('=====================\n')

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

  orchestrations.forEach(o => {
    const spec = o.field_value_json
    console.log(`🔄 ${spec.smart_code}`)
    if (spec.intent) {
      console.log(`   Intent: ${spec.intent.trim()}`)
    }
    
    if (spec.triggers) {
      console.log(`   Triggers: ${spec.triggers.length} API endpoints`)
    }
    
    if (spec.graph?.nodes) {
      console.log(`   Nodes: ${spec.graph.nodes.length} execution steps`)
    }
    
    if (spec.transaction_boundaries) {
      console.log(`   Transaction Boundaries: ${spec.transaction_boundaries.length}`)
    }
    
    console.log(`   File: ${o.ai_insights?.file_path || o.ai_insights?.file_name}`)
    console.log()
  })

  console.log(`✅ Total: ${orchestrations.length} orchestration flows`)
}

async function getProcedure(smartCode) {
  console.log(`\n🔍 Fetching procedure: ${smartCode}\n`)

  // Get registry entity
  const { data: registry } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', PLATFORM_ORG_ID)
    .eq('entity_type', 'system_registry')
    .eq('entity_code', 'PROCEDURE_REGISTRY')
    .single()

  if (!registry) {
    console.log('❌ No procedure registry found.')
    return
  }

  // Get specific procedure or orchestration
  const { data: specs, error } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('entity_id', registry.id)
    .in('field_name', ['procedure_spec', 'orchestration_spec'])
    .eq('smart_code', smartCode)

  if (error || !specs || specs.length === 0) {
    console.log(`❌ Procedure/orchestration not found: ${smartCode}`)
    return
  }

  const item = specs[0]
  const isOrchestration = item.field_name === 'orchestration_spec'

  const spec = item.field_value_json
  
  // Display specification details
  const typeIcon = isOrchestration ? '🔄' : '📄'
  const typeLabel = isOrchestration ? 'Orchestration' : 'Procedure'
  
  console.log(`${typeIcon} ${typeLabel} Specification`)
  console.log('='.repeat(30))
  console.log(`Smart Code: ${spec.smart_code}`)
  console.log(`Intent: ${spec.intent?.trim() || 'N/A'}`)
  
  if (spec.scope) {
    console.log('\nScope:')
    if (spec.scope.in_scope?.length > 0) {
      console.log('  In Scope:')
      spec.scope.in_scope.forEach(s => console.log(`    - ${s}`))
    }
    if (spec.scope.out_of_scope?.length > 0) {
      console.log('  Out of Scope:')
      spec.scope.out_of_scope.forEach(s => console.log(`    - ${s}`))
    }
  }

  if (spec.inputs) {
    console.log('\nInputs:')
    if (spec.inputs.required?.length > 0) {
      console.log('  Required:')
      spec.inputs.required.forEach(i => {
        console.log(`    - ${i.name} (${i.type}) from ${i.where}`)
      })
    }
    if (spec.inputs.optional?.length > 0) {
      console.log('  Optional:')
      spec.inputs.optional.forEach(i => {
        console.log(`    - ${i.name} (${i.type}) from ${i.where}`)
        if (i.default !== undefined) {
          console.log(`      default: ${i.default}`)
        }
      })
    }
  }

  if (spec.outputs) {
    console.log('\nOutputs:')
    if (spec.outputs.entities_created?.length > 0) {
      console.log('  Entities Created:', spec.outputs.entities_created.join(', '))
    }
    if (spec.outputs.transactions_emitted?.length > 0) {
      console.log('  Transactions Emitted:', spec.outputs.transactions_emitted.join(', '))
    }
  }

  if (spec.errors?.length > 0) {
    console.log('\nError Handling:')
    spec.errors.forEach(err => {
      console.log(`  ${err.code}: ${err.when} (action: ${err.action})`)
    })
  }

  // Orchestration-specific sections
  if (isOrchestration) {
    if (spec.triggers?.length > 0) {
      console.log('\nTriggers:')
      spec.triggers.forEach(trigger => {
        console.log(`  ${trigger.on} → ${trigger.emit}`)
      })
    }

    if (spec.graph?.nodes?.length > 0) {
      console.log('\nExecution Graph:')
      spec.graph.nodes.forEach(node => {
        console.log(`  ${node.id}: ${node.run}`)
        if (node.when) console.log(`    condition: ${node.when}`)
        if (node.compensation) console.log(`    compensation: ${node.compensation}`)
      })
    }

    if (spec.transaction_boundaries?.length > 0) {
      console.log('\nTransaction Boundaries:')
      spec.transaction_boundaries.forEach(boundary => {
        console.log(`  ${boundary.name}: [${boundary.applies_to.join(', ')}]`)
      })
    }

    if (spec.retry_policy) {
      console.log('\nRetry Policy:')
      console.log(`  Max Attempts: ${spec.retry_policy.max_attempts}`)
      console.log(`  Backoff: ${spec.retry_policy.backoff}`)
      console.log(`  Base Delay: ${spec.retry_policy.base_delay_ms}ms`)
    }
  }

  // Registration metadata
  console.log('\n📝 Registration Metadata')
  console.log('=======================')
  console.log(`Registered: ${item.ai_insights?.registered_at || item.created_at}`)
  console.log(`Last Updated: ${item.ai_insights?.last_updated || item.updated_at}`)
  console.log(`File: ${item.ai_insights?.file_path || item.ai_insights?.file_name || 'Unknown'}`)
  console.log(`Type: ${item.ai_insights?.file_type || 'Unknown'}`)
  if (item.ai_insights?.checksum) {
    console.log(`Checksum: ${item.ai_insights.checksum}`)
  }
}

async function searchProcedures(term) {
  console.log(`\n🔍 Searching for: "${term}"\n`)

  // Get registry entity
  const { data: registry } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', PLATFORM_ORG_ID)
    .eq('entity_type', 'system_registry')
    .eq('entity_code', 'PROCEDURE_REGISTRY')
    .single()

  if (!registry) {
    console.log('❌ No procedure registry found.')
    return
  }

  // Search procedures
  const { data: procedures, error } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('entity_id', registry.id)
    .eq('field_name', 'procedure_spec')

  if (error) {
    throw new Error(`Failed to search: ${error.message}`)
  }

  // Filter by search term
  const searchTerm = term.toUpperCase()
  const matches = procedures.filter(p => {
    const spec = p.field_value_json
    return spec.smart_code.includes(searchTerm) || 
           spec.intent?.toUpperCase().includes(searchTerm)
  })

  if (matches.length === 0) {
    console.log('No procedures found matching your search.')
    return
  }

  console.log(`Found ${matches.length} procedure(s):\n`)
  
  matches.forEach(p => {
    const spec = p.field_value_json
    console.log(`${spec.smart_code}`)
    if (spec.intent) {
      console.log(`  → ${spec.intent.trim()}`)
    }
    console.log()
  })
}

async function validateProcedures() {
  console.log('🔍 Validating Registered Procedures')
  console.log('===================================\n')

  // Get registry entity
  const { data: registry } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', PLATFORM_ORG_ID)
    .eq('entity_type', 'system_registry')
    .eq('entity_code', 'PROCEDURE_REGISTRY')
    .single()

  if (!registry) {
    console.log('❌ No procedure registry found.')
    return
  }

  // Get all procedures
  const { data: procedures, error } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('entity_id', registry.id)
    .eq('field_name', 'procedure_spec')

  if (error) {
    throw new Error(`Failed to query procedures: ${error.message}`)
  }

  const issues = []
  
  procedures.forEach(p => {
    const spec = p.field_value_json
    const procIssues = []
    
    // Validate required fields
    if (!spec.smart_code) procIssues.push('Missing smart_code')
    if (!spec.intent) procIssues.push('Missing intent')
    if (!spec.inputs) procIssues.push('Missing inputs section')
    if (!spec.outputs) procIssues.push('Missing outputs section')
    if (!spec.happy_path) procIssues.push('Missing happy_path')
    
    // Validate smart code pattern
    if (spec.smart_code && !spec.smart_code.match(/^HERA\.[A-Z0-9_]+\.[A-Z0-9_]+\.[A-Z0-9_]+\.v\d+$/)) {
      procIssues.push('Invalid smart_code pattern')
    }
    
    if (procIssues.length > 0) {
      issues.push({
        smart_code: spec.smart_code || 'UNKNOWN',
        issues: procIssues
      })
    }
  })

  if (issues.length === 0) {
    console.log(`✅ All ${procedures.length} procedures are valid!`)
  } else {
    console.log(`❌ Found issues in ${issues.length} procedure(s):\n`)
    issues.forEach(({ smart_code, issues }) => {
      console.log(`${smart_code}:`)
      issues.forEach(issue => console.log(`  - ${issue}`))
    })
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { main }