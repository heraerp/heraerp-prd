#!/usr/bin/env node
/**
 * Check if merchandising domain and planning section exist in the database
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkMerchandisingPlanning() {
  console.log('🔍 Checking Merchandising Domain and Planning Section in Database\n');

  try {
    // Step 1: Find merchandising domain
    console.log('📍 STEP 1: Looking for Merchandising Domain');
    console.log('==========================================');
    
    const { data: domains, error: domainsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_DOMAIN')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .ilike('entity_name', '%merchandising%');

    if (domainsError) {
      console.error('❌ Error fetching domains:', domainsError);
      return;
    }

    console.log(`Found ${domains.length} merchandising domains:`);
    domains.forEach(d => {
      console.log(`  - ${d.entity_name} (${d.id})`);
      console.log(`    Code: ${d.entity_code}`);
      console.log(`    Smart Code: ${d.smart_code}`);
    });

    if (domains.length === 0) {
      console.log('❌ No merchandising domain found!');
      return;
    }

    const merchandisingDomain = domains[0];

    // Step 2: Find planning sections under merchandising domain
    console.log('\n📍 STEP 2: Looking for Planning Section under Merchandising');
    console.log('========================================================');
    
    const { data: sections, error: sectionsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_SECTION')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .eq('parent_entity_id', merchandisingDomain.id);

    if (sectionsError) {
      console.error('❌ Error fetching sections:', sectionsError);
      return;
    }

    console.log(`Found ${sections.length} sections under ${merchandisingDomain.entity_name}:`);
    sections.forEach(s => {
      console.log(`  - ${s.entity_name} (${s.entity_code})`);
    });

    const planningSection = sections.find(s => 
      s.entity_name.toLowerCase().includes('planning') || 
      s.entity_code?.toLowerCase().includes('planning')
    );

    if (!planningSection) {
      console.log('❌ No planning section found under merchandising domain!');
      console.log('\n🛠️  SOLUTION: Create the missing entities');
      return;
    }

    console.log(`\n✅ Found planning section: ${planningSection.entity_name} (${planningSection.id})`);

    // Step 3: Check for workspaces under planning section
    console.log('\n📍 STEP 3: Looking for Workspaces under Planning Section');
    console.log('====================================================');
    
    const { data: workspaces, error: workspacesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_WORKSPACE')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .eq('parent_entity_id', planningSection.id);

    if (workspacesError) {
      console.error('❌ Error fetching workspaces:', workspacesError);
      return;
    }

    console.log(`Found ${workspaces.length} workspaces under ${planningSection.entity_name}:`);
    workspaces.forEach(w => {
      console.log(`  - ${w.entity_name} (${w.entity_code})`);
    });

    if (workspaces.length === 0) {
      console.log('❌ No workspaces found under planning section!');
      console.log('\n🛠️  SOLUTION: Create the missing main workspace');
    } else {
      console.log(`\n✅ Found ${workspaces.length} workspace(s) under planning`);
    }

    // Step 4: Test the API call that would be made
    console.log('\n📍 STEP 4: Testing API Path');
    console.log('============================');
    console.log('🎯 URL: /api/v2/merchandising/planning/main');
    console.log(`📋 Expected hierarchy:`);
    console.log(`   Domain: ${merchandisingDomain.entity_name} (${merchandisingDomain.id})`);
    if (planningSection) {
      console.log(`   Section: ${planningSection.entity_name} (${planningSection.id})`);
      if (workspaces.length > 0) {
        console.log(`   Workspace: ${workspaces[0].entity_name} (${workspaces[0].id})`);
      } else {
        console.log(`   Workspace: MISSING - needs to be created`);
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkMerchandisingPlanning();