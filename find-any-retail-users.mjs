#!/usr/bin/env node
/**
 * Search for any users in or related to retail organization
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';
const TARGET_ORG_ID = 'ff837c4c-95f2-43ac-a498-39597018b10c';
const PARTIAL_ID = 'b9789231';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function findRetailUsers() {
  console.log('🔍 Finding Any Users Related to Retail Organization\n');
  
  console.log('📋 Configuration:');
  console.log(`   Target Org: ${TARGET_ORG_ID}`);
  console.log(`   Partial ID: ${PARTIAL_ID}\n`);

  try {
    // 1. Search by partial ID
    console.log('1️⃣ Searching by partial ID');
    console.log('============================');
    
    const { data: partialIdUsers, error: partialError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'USER')
      .like('id', `${PARTIAL_ID}%`);
      
    if (partialError) {
      console.log('❌ Error searching by partial ID:', partialError.message);
    } else {
      console.log(`✅ Found ${partialIdUsers.length} users starting with ${PARTIAL_ID}:`);
      partialIdUsers.forEach(user => {
        console.log(`   - ${user.entity_name} (${user.id})`);
        console.log(`     Org: ${user.organization_id}`);
        console.log(`     Code: ${user.entity_code}`);
      });
    }

    // 2. Search all users in target organization
    console.log('\n2️⃣ All users in target organization');
    console.log('====================================');
    
    const { data: targetOrgUsers, error: targetError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'USER')
      .eq('organization_id', TARGET_ORG_ID);
      
    if (targetError) {
      console.log('❌ Error searching target org:', targetError.message);
    } else {
      console.log(`✅ Found ${targetOrgUsers.length} users in target organization:`);
      targetOrgUsers.forEach(user => {
        console.log(`   - ${user.entity_name} (${user.id})`);
        console.log(`     Code: ${user.entity_code}`);
      });
    }

    // 3. Search all entities in target organization to see what exists
    console.log('\n3️⃣ All entities in target organization (first 10)');
    console.log('===================================================');
    
    const { data: allEntities, error: allError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, entity_code')
      .eq('organization_id', TARGET_ORG_ID)
      .limit(10);
      
    if (allError) {
      console.log('❌ Error searching all entities:', allError.message);
    } else {
      console.log(`✅ Found ${allEntities.length} entities in target organization:`);
      allEntities.forEach(entity => {
        console.log(`   - ${entity.entity_name} (${entity.entity_type}) - ${entity.id}`);
      });
      
      // If we found any entities, try using their creator as actor
      if (allEntities.length > 0) {
        console.log('\n💡 Trying to find who created these entities...');
        
        const firstEntity = allEntities[0];
        const { data: entityDetails, error: detailError } = await supabase
          .from('core_entities')
          .select('created_by, updated_by')
          .eq('id', firstEntity.id)
          .single();
          
        if (!detailError && entityDetails) {
          console.log(`   Created by: ${entityDetails.created_by}`);
          console.log(`   Updated by: ${entityDetails.updated_by}`);
          
          if (entityDetails.created_by) {
            console.log(`\n🎯 Potential working user ID: ${entityDetails.created_by}`);
          }
        }
      }
    }

    // 4. Search recent users globally (might find the retail user)
    console.log('\n4️⃣ Recent USER entities globally (last 10)');
    console.log('=============================================');
    
    const { data: recentUsers, error: recentError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'USER')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (recentError) {
      console.log('❌ Error searching recent users:', recentError.message);
    } else {
      console.log(`✅ Found ${recentUsers.length} recent users:`);
      recentUsers.forEach(user => {
        console.log(`   - ${user.entity_name} (${user.id})`);
        console.log(`     Org: ${user.organization_id}`);
        console.log(`     Created: ${user.created_at}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

findRetailUsers();