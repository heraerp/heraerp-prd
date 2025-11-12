#!/usr/bin/env node
/**
 * Check all finance sections that should be displayed
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkAllFinanceSections() {
  console.log('🔍 Checking ALL sections with parent_entity_id = 17a9d3e3-49ca-4080-8ff5-c2173f92f887\n');
  
  try {
    const { data: sections, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_SECTION')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .eq('parent_entity_id', '17a9d3e3-49ca-4080-8ff5-c2173f92f887')
      .order('entity_name');
      
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`✅ Found ${sections.length} sections that should be displayed:`);
    console.log('================================================================');
    
    sections.forEach((s, i) => {
      console.log(`${i + 1}. ${s.entity_name}`);
      console.log(`   Code: ${s.entity_code}`);
      console.log(`   Description: ${s.entity_description || 'N/A'}`);
      console.log(`   Metadata: ${s.metadata ? JSON.stringify(s.metadata) : 'N/A'}`);
      console.log(`   Status: ${s.status || 'N/A'}`);
      console.log(`   Created: ${s.created_at}`);
      console.log('');
    });
    
    console.log('🎯 SUMMARY');
    console.log('===========');
    console.log(`Total sections in DB: ${sections.length}`);
    console.log(`Sections shown in UI: 2 (Finance Cockpit, Journals & Ledgers)`);
    console.log(`Missing from UI: ${sections.length - 2}`);
    
    if (sections.length > 2) {
      console.log('\n🔍 ANALYSIS: The DynamicSectionModules component should show all these sections');
      console.log('but something is filtering them out. Check:');
      console.log('1. Organization ID filtering (should be platform org 00000000...)');
      console.log('2. Parent entity ID matching');
      console.log('3. Any status/metadata filtering in the component');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkAllFinanceSections();