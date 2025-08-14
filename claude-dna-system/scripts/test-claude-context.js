import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testClaudeContext() {
  console.log('🤖 TESTING CLAUDE CLI DNA CONTEXT LOADING...\n');
  
  try {
    // Load complete DNA context
    console.log('1️⃣ Loading complete DNA context for Claude CLI...');
    const { data: dnaContext, error } = await supabase
      .rpc('claude_load_dna_context', { p_context_type: 'complete' });
    
    if (error) {
      throw new Error(`Context loading failed: ${error.message}`);
    }
    
    console.log('✅ Complete DNA context loaded!\n');
    
    // Show what Claude CLI will receive
    console.log('📋 CLAUDE CLI DNA CONTEXT SUMMARY:');
    console.log(`   🎨 UI Components: ${dnaContext.ui_components?.length || 0}`);
    console.log(`   🏢 Business Modules: ${dnaContext.business_modules?.length || 0}`);
    console.log(`   🎭 Design Systems: ${dnaContext.design_systems?.length || 0}`);
    console.log(`   ⏰ Context Generated: ${dnaContext.loaded_at}`);
    
    // Show UI Components
    if (dnaContext.ui_components?.length > 0) {
      console.log('\n🎨 Available UI Components:');
      dnaContext.ui_components.forEach(comp => {
        console.log(`   - ${comp.smart_code}: ${comp.entity_name}`);
        console.log(`     Type: ${comp.entity_type}`);
        console.log(`     Status: ${comp.status}`);
        console.log('');
      });
    }
    
    // Show Business Modules
    if (dnaContext.business_modules?.length > 0) {
      console.log('🏢 Available Business Modules:');
      dnaContext.business_modules.forEach(mod => {
        console.log(`   - ${mod.smart_code}: ${mod.entity_name}`);
        console.log(`     Type: ${mod.entity_type}`);
        console.log(`     Industry: ${mod.metadata?.industry || 'universal'}`);
        console.log('');
      });
    }
    
    // Test specific component DNA loading
    console.log('2️⃣ Testing specific component DNA loading...');
    const { data: panelDNA } = await supabase
      .rpc('claude_get_component_dna', { p_smart_code: 'HERA.UI.GLASS.PANEL.v1' });
    
    if (panelDNA) {
      console.log('✅ Glass Panel DNA loaded:');
      console.log(`   Component: ${panelDNA.component?.entity_name}`);
      console.log(`   Smart Code: ${panelDNA.component?.smart_code}`);
      
      if (panelDNA.implementation) {
        console.log('   📦 Implementation Available:');
        Object.keys(panelDNA.implementation).forEach(key => {
          console.log(`     - ${key}: ${panelDNA.implementation[key] ? 'Available' : 'Missing'}`);
        });
      }
    }
    
    // Test restaurant module DNA
    console.log('\n3️⃣ Testing restaurant specialization DNA...');
    const { data: restaurantDNA } = await supabase
      .rpc('claude_get_component_dna', { p_smart_code: 'HERA.REST.INV.SPECIALIZATION.v1' });
    
    if (restaurantDNA) {
      console.log('✅ Restaurant Inventory DNA loaded:');
      console.log(`   Module: ${restaurantDNA.component?.entity_name}`);
      console.log(`   Smart Code: ${restaurantDNA.component?.smart_code}`);
      
      if (restaurantDNA.implementation) {
        console.log('   🍽️ Restaurant Implementation:');
        Object.keys(restaurantDNA.implementation).forEach(key => {
          console.log(`     - ${key}: ${restaurantDNA.implementation[key] ? 'Available' : 'Missing'}`);
        });
      }
    }
    
    console.log('\n🎊 REVOLUTIONARY CLAUDE CLI DNA SYSTEM IS READY!');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Use the restaurant POS prompt with Claude CLI');
    console.log('   2. Claude will auto-load this DNA context');
    console.log('   3. Watch complete applications generate with perfect patterns!');
    
  } catch (error) {
    console.error('❌ Context test failed:', error.message);
  }
}

testClaudeContext().catch(console.error);
