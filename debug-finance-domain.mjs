#!/usr/bin/env node
/**
 * Debug Finance Domain Issue
 * Check what domain entity is being found vs. what sections expect
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function debugFinanceDomain() {
  console.log('🔍 Debug Finance Domain Entity vs Section Parent IDs\n');

  try {
    // Step 1: Find what the domain page logic would find for 'finance'
    console.log('📍 STEP 1: Finding domain entities that could match "finance"');
    console.log('=========================================================');
    
    const { data: allDomains, error: domainsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_DOMAIN')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000');

    if (domainsError) {
      console.error('❌ Error fetching domains:', domainsError);
      return;
    }

    console.log(`Found ${allDomains.length} total domains`);
    
    // Find finance-related domains
    const financeDomainsSlug = allDomains.filter(d => d.metadata?.slug === 'finance');
    const financeDomainsCode = allDomains.filter(d => 
      d.entity_code?.includes('FINANCE') || d.entity_name?.toLowerCase().includes('finance')
    );
    
    console.log('\n🎯 Finance domains by slug:');
    financeDomainsSlug.forEach(d => {
      console.log(`  - ${d.entity_name} (${d.id})`);
      console.log(`    Code: ${d.entity_code}`);
      console.log(`    Smart Code: ${d.smart_code}`);
      console.log(`    Metadata: ${JSON.stringify(d.metadata)}`);
    });
    
    console.log('\n🎯 Finance domains by code/name:');
    financeDomainsCode.forEach(d => {
      console.log(`  - ${d.entity_name} (${d.id})`);
      console.log(`    Code: ${d.entity_code}`);
      console.log(`    Smart Code: ${d.smart_code}`);
      console.log(`    Metadata: ${JSON.stringify(d.metadata)}`);
    });

    // Step 2: Check what domain ID the sections expect
    console.log('\n📍 STEP 2: Finding expected domain ID from sections');
    console.log('=================================================');
    
    const { data: financeSections, error: sectionsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_SECTION')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .ilike('entity_name', '%finance%');

    if (sectionsError) {
      console.error('❌ Error fetching sections:', sectionsError);
      return;
    }

    console.log(`Found ${financeSections.length} finance-related sections`);
    
    const parentIds = [...new Set(financeSections.map(s => s.parent_entity_id).filter(Boolean))];
    console.log(`\n🔗 Unique parent_entity_ids in finance sections: ${parentIds.length}`);
    
    for (const parentId of parentIds) {
      const sectionsWithThisParent = financeSections.filter(s => s.parent_entity_id === parentId);
      console.log(`\n🏢 Parent ID: ${parentId}`);
      console.log(`   📦 Sections (${sectionsWithThisParent.length}):`);
      sectionsWithThisParent.forEach(s => {
        console.log(`      - ${s.entity_name} (${s.entity_code})`);
      });
      
      // Find the domain entity for this parent ID
      const domainEntity = allDomains.find(d => d.id === parentId);
      if (domainEntity) {
        console.log(`   🎯 Domain Entity: ${domainEntity.entity_name}`);
        console.log(`      Code: ${domainEntity.entity_code}`);
        console.log(`      Metadata: ${JSON.stringify(domainEntity.metadata)}`);
      } else {
        console.log(`   ❌ Domain entity not found for parent ID: ${parentId}`);
      }
    }

    // Step 3: Simulate domain page logic
    console.log('\n📍 STEP 3: Simulating domain page logic for "finance"');
    console.log('=====================================================');
    
    // Simulate the logic from DomainPage component
    let matchedDomain = null;
    
    // Try metadata slug first
    matchedDomain = allDomains.find(d => d.metadata?.slug === 'finance');
    
    if (matchedDomain) {
      console.log(`✅ Found by slug: ${matchedDomain.entity_name} (${matchedDomain.id})`);
    } else {
      console.log(`⚠️  No domain found with metadata.slug = "finance"`);
      
      // Fallback: extract from entity_code or smart_code
      matchedDomain = allDomains.find(d => {
        if (d.entity_code?.startsWith('NAV-DOM-')) {
          let codeSlug = d.entity_code.replace('NAV-DOM-', '').toLowerCase();
          if (codeSlug === 'finance' || codeSlug === 'finance'.replace('-', '')) {
            return true;
          }
        }
        
        if (d.smart_code) {
          const smartCodeParts = d.smart_code.split('.');
          let smartCodeDomain = smartCodeParts[4]?.toLowerCase();
          if (smartCodeDomain === 'finance' || smartCodeDomain === 'finance'.replace('-', '')) {
            return true;
          }
        }
        
        return false;
      });
      
      if (matchedDomain) {
        console.log(`✅ Found by code/smart_code: ${matchedDomain.entity_name} (${matchedDomain.id})`);
      } else {
        console.log(`❌ No domain found by any method for "finance"`);
      }
    }

    // Step 4: Check if the matched domain has the right sections
    if (matchedDomain) {
      console.log('\n📍 STEP 4: Checking section filter with found domain');
      console.log('==================================================');
      
      const sectionsForDomain = financeSections.filter(s => s.parent_entity_id === matchedDomain.id);
      console.log(`🎯 Domain: ${matchedDomain.entity_name} (${matchedDomain.id})`);
      console.log(`📦 Sections that would be filtered: ${sectionsForDomain.length}`);
      
      if (sectionsForDomain.length === 0) {
        console.log('❌ PROBLEM: Filter would return 0 sections!');
        console.log('\n💡 SOLUTIONS:');
        console.log('1. Fix domain metadata to have correct slug');
        console.log('2. Fix section parent_entity_id to point to correct domain');
        console.log('3. Use relationships table instead of parent_entity_id field');
      } else {
        console.log('✅ Filter would work correctly');
        sectionsForDomain.forEach(s => {
          console.log(`   - ${s.entity_name}`);
        });
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

debugFinanceDomain();