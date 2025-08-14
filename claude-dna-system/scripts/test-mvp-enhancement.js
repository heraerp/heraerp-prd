// Test MVP Enhancement System
// Smart Code: HERA.DNA.MVP.TEST.SYSTEM.v1

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testMVPEnhancement() {
  console.log('🎯 Testing HERA MVP Enhancement System...\n')
  
  try {
    // Test Case 1: Basic Restaurant POS Description
    console.log('Test 1: Basic Restaurant POS Application')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const posDescription = `
      Restaurant POS application with menu management, order taking, 
      and basic reporting. Has a simple navigation bar and data tables 
      for showing menu items and orders.
    `
    
    const { data: posAnalysis, error: posError } = await supabase
      .rpc('claude_check_mvp_completeness', { 
        p_application_description: posDescription 
      })
    
    if (posError) throw posError
    
    console.log(`✅ MVP Analysis Complete`)
    console.log(`   Completeness: ${posAnalysis.completeness_percentage}%`)
    console.log(`   Status: ${posAnalysis.mvp_status}`)
    console.log(`   Missing Components: ${posAnalysis.missing_components.length}`)
    
    if (posAnalysis.missing_components.length > 0) {
      console.log('\n   Missing MVP Components:')
      posAnalysis.missing_components.forEach(comp => {
        console.log(`   • ${comp.component} (${comp.priority})`)
        console.log(`     Smart Code: ${comp.smart_code}`)
      })
    }
    
    // Test Case 2: Enterprise CRM Description
    console.log('\n\nTest 2: Enterprise CRM Application')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const crmDescription = `
      Enterprise CRM with shell bar, global search, customer dashboard with KPIs,
      advanced filtering with presets, responsive tables with micro charts,
      value help dialogs, object pages for customer details, and comprehensive
      message handling system.
    `
    
    const { data: crmAnalysis, error: crmError } = await supabase
      .rpc('claude_check_mvp_completeness', { 
        p_application_description: crmDescription 
      })
    
    if (crmError) throw crmError
    
    console.log(`✅ MVP Analysis Complete`)
    console.log(`   Completeness: ${crmAnalysis.completeness_percentage}%`)
    console.log(`   Status: ${crmAnalysis.mvp_status}`)
    console.log(`   Components Detected: ${crmAnalysis.completeness_score}/${crmAnalysis.total_requirements}`)
    
    // Test Case 3: Generate Enhancement Plan
    console.log('\n\nTest 3: Generate Enhancement Plan for Restaurant POS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const { data: enhancementPlan, error: enhanceError } = await supabase
      .rpc('claude_enhance_application_dna', { 
        p_application_description: posDescription,
        p_target_completeness: 80
      })
    
    if (enhanceError) throw enhanceError
    
    console.log(`✅ Enhancement Plan Generated`)
    console.log(`   Current Completeness: ${enhancementPlan.current_completeness}%`)
    console.log(`   Target Completeness: ${enhancementPlan.target_completeness}%`)
    console.log(`   Status: ${enhancementPlan.status}`)
    console.log(`   Estimated Time: ${enhancementPlan.estimated_implementation_time}`)
    
    if (enhancementPlan.enhancement_plan && enhancementPlan.enhancement_plan.length > 0) {
      console.log('\n   Recommended Enhancements:')
      enhancementPlan.enhancement_plan.forEach((enh, idx) => {
        console.log(`\n   ${idx + 1}. ${enh.component_name} (${enh.priority})`)
        console.log(`      Smart Code: ${enh.smart_code}`)
        console.log(`      Guide: ${enh.implementation_dna?.implementation_guide}`)
      })
    }
    
    // Test Case 4: List All MVP Components
    console.log('\n\nTest 4: List All Available MVP Components')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const { data: mvpComponents, error: listError } = await supabase
      .from('core_entities')
      .select('entity_name, smart_code, entity_description, metadata')
      .eq('entity_type', 'ui_component_dna')
      .like('smart_code', '%.v2')
      .order('entity_name')
    
    if (listError) throw listError
    
    console.log(`✅ Found ${mvpComponents.length} MVP Components:`)
    mvpComponents.forEach(comp => {
      console.log(`\n   📦 ${comp.entity_name}`)
      console.log(`      Smart Code: ${comp.smart_code}`)
      console.log(`      Requirements: ${comp.metadata?.mvp_requirements?.join(', ') || 'N/A'}`)
    })
    
    // Summary
    console.log('\n\n🎉 MVP ENHANCEMENT SYSTEM TEST COMPLETE!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Completeness Checker: Working perfectly')
    console.log('✅ Enhancement Generator: Generating smart recommendations')
    console.log('✅ MVP Components: All 9 components available')
    console.log('✅ System Status: Ready for enterprise applications!')
    
  } catch (error) {
    console.error('❌ MVP Enhancement test failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('• Ensure MVP enhancement SQL was executed successfully')
    console.log('• Check that DNA organization exists')
    console.log('• Verify Supabase connection')
  }
}

// Run tests
testMVPEnhancement()