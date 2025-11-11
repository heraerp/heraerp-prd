#!/usr/bin/env node
/**
 * Find retail@heraerp.com user entity
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function findRetailUser() {
  console.log('🔍 Finding retail@heraerp.com user entity\n');

  try {
    // Search for retail user by email in entity name or dynamic data
    console.log('1️⃣ Searching by entity name containing "retail"');
    console.log('===============================================');
    
    const { data: usersByName, error: nameError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'USER')
      .ilike('entity_name', '%retail%');
      
    if (nameError) {
      console.log('❌ Error searching by name:', nameError.message);
    } else {
      console.log(`✅ Found ${usersByName.length} users with "retail" in name:`);
      usersByName.forEach(user => {
        console.log(`   - ${user.entity_name} (${user.id})`);
        console.log(`     Code: ${user.entity_code}`);
        console.log(`     Org: ${user.organization_id}`);
        console.log(`     Description: ${user.entity_description}`);
        console.log('');
      });
    }

    // Search by email in dynamic data
    console.log('2️⃣ Searching dynamic data for email "retail@heraerp.com"');
    console.log('=======================================================');
    
    const { data: emailData, error: emailError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_text, field_value_json')
      .eq('field_name', 'email')
      .eq('field_value_text', 'retail@heraerp.com');
      
    if (emailError) {
      console.log('❌ Error searching email:', emailError.message);
    } else if (emailData.length === 0) {
      console.log('❌ No entities found with email "retail@heraerp.com"');
    } else {
      console.log(`✅ Found ${emailData.length} entities with email "retail@heraerp.com":`);
      
      for (const email of emailData) {
        console.log(`   - Entity ID: ${email.entity_id}`);
        
        // Get the entity details
        const { data: entity, error: entityError } = await supabase
          .from('core_entities')
          .select('*')
          .eq('id', email.entity_id)
          .single();
          
        if (entity && !entityError) {
          console.log(`     Name: ${entity.entity_name}`);
          console.log(`     Type: ${entity.entity_type}`);
          console.log(`     Code: ${entity.entity_code}`);
          console.log(`     Org: ${entity.organization_id}`);
          console.log('');
        }
      }
    }

    // Search all USER entities in target organization
    console.log('3️⃣ All USER entities in target organization');
    console.log('============================================');
    
    const TARGET_ORG_ID = 'ff837c4c-95f2-43ac-a498-39597018b10c';
    
    const { data: targetUsers, error: targetError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'USER')
      .eq('organization_id', TARGET_ORG_ID);
      
    if (targetError) {
      console.log('❌ Error searching target org users:', targetError.message);
    } else {
      console.log(`✅ Found ${targetUsers.length} USER entities in target organization:`);
      targetUsers.forEach(user => {
        console.log(`   - ${user.entity_name} (${user.id})`);
        console.log(`     Code: ${user.entity_code}`);
        console.log(`     Created: ${user.created_at}`);
        console.log('');
      });
    }

    // Search broadly for any email containing "retail"
    console.log('4️⃣ Searching for any email containing "retail"');
    console.log('===============================================');
    
    const { data: retailEmails, error: retailError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_text')
      .eq('field_name', 'email')
      .ilike('field_value_text', '%retail%');
      
    if (retailError) {
      console.log('❌ Error searching retail emails:', retailError.message);
    } else {
      console.log(`✅ Found ${retailEmails.length} entities with "retail" in email:`);
      
      for (const email of retailEmails) {
        console.log(`   - Email: ${email.field_value_text} (Entity: ${email.entity_id})`);
        
        // Get the entity details
        const { data: entity, error: entityError } = await supabase
          .from('core_entities')
          .select('entity_name, entity_type, organization_id')
          .eq('id', email.entity_id)
          .single();
          
        if (entity && !entityError) {
          console.log(`     Name: ${entity.entity_name} (${entity.entity_type})`);
          console.log(`     Org: ${entity.organization_id}`);
        }
        console.log('');
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

findRetailUser();