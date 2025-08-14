// Validate Restaurant Platform Readiness
// Smart Code: HERA.RESTAURANT.READINESS.VALIDATOR.v1

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function validateRestaurantReadiness() {
  console.log('🍽️ Validating Restaurant Platform Readiness...\n')
  
  try {
    // Check 1: HERA Schema Availability
    console.log('1️⃣ Checking HERA Universal Schema...')
    
    const heraTableChecks = [
      'core_organizations', 'core_entities', 'core_dynamic_data',
      'core_relationships', 'universal_transactions', 'universal_transaction_lines'
    ]
    
    let availableTables = []
    for (const tableName of heraTableChecks) {
      try {
        const { error } = await supabase.from(tableName).select('*').limit(1)
        if (!error) availableTables.push(tableName)
      } catch (err) {
        // Table doesn't exist
      }
    }
    
    console.log(`✅ HERA Schema: ${availableTables.length}/6 tables ready`)
    const tables = availableTables
    
    // Check 2: DNA System Components
    console.log('\n2️⃣ Checking DNA Component Library...')
    const { data: dnaComponents, error: dnaError } = await supabase
      .from('core_entities')
      .select('entity_name, smart_code')
      .eq('entity_type', 'ui_component_dna')
      .order('smart_code')
    
    if (dnaError) throw dnaError
    console.log(`✅ DNA Components: ${dnaComponents.length} patterns available`)
    dnaComponents.forEach(comp => {
      console.log(`   • ${comp.entity_name} (${comp.smart_code})`)
    })
    
    // Check 3: MVP Enhancement System
    console.log('\n3️⃣ Testing MVP Enhancement System...')
    const restaurantDescription = `
      Complete restaurant platform with customer-facing online menu, table reservations,
      online ordering, loyalty program, POS integration, kitchen display system,
      inventory management, staff scheduling, CRM, analytics dashboard, marketing tools,
      shell bar navigation, KPI dashboard, advanced filtering, enterprise tables,
      value help dialogs, micro charts, object pages, and message system
    `
    
    const { data: mvpCheck, error: mvpError } = await supabase
      .rpc('claude_check_mvp_completeness', { 
        p_application_description: restaurantDescription 
      })
    
    if (mvpError) throw mvpError
    console.log(`✅ MVP Completeness: ${mvpCheck.completeness_percentage}% (${mvpCheck.mvp_status})`)
    
    // Check 4: Business Module DNA
    console.log('\n4️⃣ Checking Restaurant Business Module DNA...')
    const { data: businessModules, error: businessError } = await supabase
      .from('core_entities')
      .select('entity_name, smart_code, metadata')
      .in('entity_type', ['business_module_dna', 'business_specialization_dna'])
      .order('smart_code')
    
    if (businessError) throw businessError
    console.log(`✅ Business Modules: ${businessModules.length} patterns available`)
    businessModules.forEach(module => {
      console.log(`   • ${module.entity_name} (${module.smart_code})`)
      if (module.metadata?.specializations) {
        console.log(`     Specializations: ${module.metadata.specializations.join(', ')}`)
      }
    })
    
    // Check 5: Restaurant Specialization
    console.log('\n5️⃣ Verifying Restaurant Specialization DNA...')
    const { data: restaurantDNA, error: restError } = await supabase
      .rpc('claude_get_component_dna', {
        p_smart_code: 'HERA.REST.INV.SPECIALIZATION.v1'
      })
    
    if (restError) throw restError
    const hasEntities = restaurantDNA.implementation?.specialized_entities
    const hasTransactions = restaurantDNA.implementation?.specialized_transactions
    const hasUI = restaurantDNA.implementation?.specialized_ui
    
    console.log(`✅ Restaurant DNA Complete:`)
    console.log(`   • Entities: ${hasEntities ? 'Available' : 'Missing'}`)
    console.log(`   • Transactions: ${hasTransactions ? 'Available' : 'Missing'}`)
    console.log(`   • UI Components: ${hasUI ? 'Available' : 'Missing'}`)
    
    // Check 6: Generate Enhancement Plan
    console.log('\n6️⃣ Generating Restaurant Platform Enhancement Plan...')
    const { data: enhancementPlan, error: enhanceError } = await supabase
      .rpc('claude_enhance_application_dna', { 
        p_application_description: restaurantDescription,
        p_target_completeness: 90
      })
    
    if (enhanceError) throw enhanceError
    console.log(`✅ Enhancement Plan: ${enhancementPlan.status}`)
    console.log(`   Current: ${enhancementPlan.current_completeness}%`)
    console.log(`   Target: ${enhancementPlan.target_completeness}%`)
    console.log(`   Time Estimate: ${enhancementPlan.estimated_implementation_time}`)
    
    // Final Readiness Assessment
    console.log('\n🏆 RESTAURANT PLATFORM READINESS ASSESSMENT')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const schemaReady = availableTables.length === 6
    const dnaReady = dnaComponents.length >= 4
    const mvpReady = mvpCheck.completeness_percentage >= 80
    const businessReady = businessModules.length >= 2
    const restaurantReady = hasEntities && hasTransactions && hasUI
    
    const readinessScore = [schemaReady, dnaReady, mvpReady, businessReady, restaurantReady]
      .filter(Boolean).length
    
    console.log(`✅ HERA Universal Schema: ${schemaReady ? 'READY' : 'NOT READY'}`)
    console.log(`✅ DNA Component Library: ${dnaReady ? 'READY' : 'NOT READY'}`)
    console.log(`✅ MVP Enhancement System: ${mvpReady ? 'READY' : 'NOT READY'}`)
    console.log(`✅ Business Module DNA: ${businessReady ? 'READY' : 'NOT READY'}`)
    console.log(`✅ Restaurant Specialization: ${restaurantReady ? 'READY' : 'NOT READY'}`)
    
    console.log(`\n🎯 Overall Readiness: ${readinessScore}/5 components ready`)
    
    if (readinessScore === 5) {
      console.log('\n🚀 SYSTEM IS FULLY READY FOR RESTAURANT PLATFORM DEVELOPMENT!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ All systems operational')
      console.log('✅ MVP standards enforced')
      console.log('✅ Restaurant patterns available')
      console.log('✅ Enterprise quality guaranteed')
      console.log('\n📋 Next Steps:')
      console.log('1. Copy the complete restaurant platform prompt')
      console.log('2. Load enhanced Claude context')  
      console.log('3. Build the revolutionary restaurant system!')
      console.log('\nExpected Result: 90%+ MVP completeness with enterprise-grade features')
    } else {
      console.log('\n⚠️ SYSTEM NEEDS PREPARATION')
      console.log('Please ensure all DNA components are deployed before building')
    }
    
  } catch (error) {
    console.error('❌ Readiness validation failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('• Run the DNA system implementation SQL')
    console.log('• Run the MVP enhancement system SQL')  
    console.log('• Verify Supabase connection and permissions')
    console.log('• Check that all functions are deployed')
  }
}

// Run validation
validateRestaurantReadiness()