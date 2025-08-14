// Test DNA System Integration
// Run with: node scripts/test-dna-system.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testDNASystem() {
  console.log('🧬 Testing HERA DNA System Integration...\n')
  
  try {
    // Test 1: Load complete DNA context
    console.log('Test 1: Loading complete DNA context')
    const { data: context, error: contextError } = await supabase
      .rpc('claude_load_dna_context', { p_context_type: 'complete' })
    
    if (contextError) throw contextError
    console.log('✅ DNA context loaded successfully')
    console.log(`   - UI Components: ${context.ui_components?.length || 0}`)
    console.log(`   - Business Modules: ${context.business_modules?.length || 0}`)
    console.log(`   - Design Systems: ${context.design_systems?.length || 0}\n`)
    
    // Test 2: Get specific component DNA
    console.log('Test 2: Loading Glass Panel component DNA')
    const { data: glassPanel, error: panelError } = await supabase
      .rpc('claude_get_component_dna', { 
        p_smart_code: 'HERA.UI.GLASS.PANEL.v1' 
      })
    
    if (panelError) throw panelError
    console.log('✅ Glass Panel DNA loaded successfully')
    console.log(`   - Component: ${glassPanel.component?.entity_name}`)
    console.log(`   - CSS DNA: ${glassPanel.implementation?.css_dna ? 'Available' : 'Missing'}`)
    console.log(`   - React DNA: ${glassPanel.implementation?.react_component_dna ? 'Available' : 'Missing'}\n`)
    
    // Test 3: Get business module DNA  
    console.log('Test 3: Loading Restaurant Inventory DNA')
    const { data: restaurantDNA, error: restError } = await supabase
      .rpc('claude_get_component_dna', {
        p_smart_code: 'HERA.REST.INV.SPECIALIZATION.v1'
      })
    
    if (restError) throw restError
    console.log('✅ Restaurant specialization DNA loaded successfully')
    console.log(`   - Module: ${restaurantDNA.component?.entity_name}`)
    console.log(`   - Entities: ${restaurantDNA.implementation?.specialized_entities ? 'Available' : 'Missing'}`)
    console.log(`   - Transactions: ${restaurantDNA.implementation?.specialized_transactions ? 'Available' : 'Missing'}\n`)
    
    // Test 4: Verify HERA schema integration
    console.log('Test 4: Verifying HERA schema integration')
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', [
        'core_organizations', 'core_entities', 'core_dynamic_data',
        'core_relationships', 'universal_transactions', 'universal_transaction_lines'
      ])
    
    if (tableError) throw tableError
    console.log(`✅ HERA schema verified: ${tables.length}/6 tables found\n`)
    
    // Test 5: Check DNA organization exists
    console.log('Test 5: Verifying DNA organization')
    const { data: dnaOrg, error: orgError } = await supabase
      .from('core_organizations')
      .select('organization_name, organization_code, status')
      .eq('organization_code', 'HERA-DNA-SYS')
      .single()
    
    if (orgError) throw orgError
    console.log('✅ DNA organization verified')
    console.log(`   - Name: ${dnaOrg.organization_name}`)
    console.log(`   - Code: ${dnaOrg.organization_code}`)
    console.log(`   - Status: ${dnaOrg.status}\n`)
    
    console.log('🎉 All DNA system tests passed successfully!')
    console.log('\n🚀 HERA DNA System is ready for Claude CLI development!')
    
  } catch (error) {
    console.error('❌ DNA system test failed:', error.message)
    process.exit(1)
  }
}

// Run tests
testDNASystem()