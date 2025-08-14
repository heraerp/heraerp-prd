import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDNAFunctions() {
  console.log('🧬 TESTING DNA LOADING FUNCTIONS...\n');
  
  try {
    // Test 1: Try claude_load_dna_context
    console.log('1️⃣ Testing claude_load_dna_context...');
    const { data: contextData, error: contextError } = await supabase
      .rpc('claude_load_dna_context', { p_context_type: 'complete' });
    
    if (contextError) {
      console.log(`❌ Function not found: ${contextError.message}`);
      console.log('   The DNA functions need to be deployed');
    } else {
      console.log('✅ claude_load_dna_context works!');
      console.log(`   UI Components: ${contextData.ui_components?.length || 0}`);
      console.log(`   Business Modules: ${contextData.business_modules?.length || 0}`);
    }

    // Test 2: Try claude_get_component_dna
    console.log('\n2️⃣ Testing claude_get_component_dna...');
    const { data: componentData, error: componentError } = await supabase
      .rpc('claude_get_component_dna', { p_smart_code: 'HERA.UI.GLASS.PANEL.v1' });
    
    if (componentError) {
      console.log(`❌ Function not found: ${componentError.message}`);
    } else {
      console.log('✅ claude_get_component_dna works!');
      console.log(`   Component: ${componentData.component?.entity_name}`);
    }

    // Test 3: Let's see what entities we have
    console.log('\n3️⃣ Checking existing DNA patterns...');
    const { data: dnaOrg } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('organization_code', 'HERA-DNA-SYS')
      .single();

    if (dnaOrg) {
      const { data: entities } = await supabase
        .from('core_entities')
        .select('smart_code, entity_name, entity_type')
        .eq('organization_id', dnaOrg.id)
        .order('smart_code');

      if (entities && entities.length > 0) {
        console.log('✅ DNA Patterns found:');
        entities.forEach(e => {
          console.log(`   ${e.smart_code}: ${e.entity_name} (${e.entity_type})`);
        });
      } else {
        console.log('⚠️ No DNA patterns found in entities');
      }
    }

    // Test 4: Let's check dynamic data
    console.log('\n4️⃣ Checking DNA implementation data...');
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_type')
      .limit(10);

    console.log(`   Found ${dynamicData?.length || 0} dynamic data records`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDNAFunctions().catch(console.error);
