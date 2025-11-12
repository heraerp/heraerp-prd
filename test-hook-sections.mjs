#!/usr/bin/env node
/**
 * Test what sections the useUniversalEntityV1 hook would return
 * Simulate the hook's behavior
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testHookQuery() {
  console.log('🔍 Testing useUniversalEntityV1 hook query for APP_SECTION\n');
  
  try {
    // Simulate the exact query the hook makes
    const { data: sectionEntities, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_SECTION')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .limit(100);
      
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`✅ Hook query returned ${sectionEntities.length} total sections`);
    
    // Filter for finance sections like the component does
    const financeEntityId = '17a9d3e3-49ca-4080-8ff5-c2173f92f887';
    const financeSections = sectionEntities.filter(entity => entity.parent_entity_id === financeEntityId);
    
    console.log(`🎯 After filtering by parent_entity_id (${financeEntityId}): ${financeSections.length} sections\n`);
    
    console.log('📦 Finance sections that would be processed by DynamicSectionModules:');
    console.log('================================================================');
    
    financeSections.forEach((s, i) => {
      console.log(`${i + 1}. ${s.entity_name}`);
      console.log(`   ID: ${s.id}`);
      console.log(`   Code: ${s.entity_code}`);
      console.log(`   Parent ID: ${s.parent_entity_id}`);
      console.log(`   Status: ${s.status || 'N/A'}`);
      console.log(`   Metadata: ${s.metadata ? JSON.stringify(s.metadata) : 'N/A'}`);
      console.log('');
    });
    
    // Check if there are sections without parent_entity_id that might be using relationships
    const sectionsWithoutParent = sectionEntities.filter(s => 
      !s.parent_entity_id && 
      (s.entity_name.toLowerCase().includes('finance') || s.entity_code?.includes('FINANCE'))
    );
    
    if (sectionsWithoutParent.length > 0) {
      console.log('🔍 Finance sections WITHOUT parent_entity_id (might use relationships):');
      sectionsWithoutParent.forEach((s, i) => {
        console.log(`${i + 1}. ${s.entity_name} (${s.entity_code})`);
      });
    }
    
    console.log('\n🎯 CONCLUSION');
    console.log('==============');
    if (financeSections.length === 6) {
      console.log('✅ Hook returns all 6 finance sections correctly');
      console.log('🔍 The issue must be in the component rendering or client-side filtering');
    } else if (financeSections.length < 6) {
      console.log(`❌ Hook only returns ${financeSections.length} out of 6 expected sections`);
      console.log('🔍 The issue is in the database query or server-side filtering');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testHookQuery();