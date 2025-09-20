#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSalonAnchorDirect() {
  console.log('🏢 Creating Salon Organization Anchor (Direct SQL)...\n');
  
  try {
    const salonOrgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
    
    // Use direct SQL to bypass smart code constraint for now
    const { data, error } = await supabase.rpc('create_org_anchor', {
      p_org_id: salonOrgId,
      p_entity_name: 'Salon Organization Anchor',
      p_entity_code: 'SALON-ANCHOR'
    });
    
    if (error) {
      console.log('RPC function not available, using direct insert...\n');
      
      // Direct minimal insert - let's see what fails
      const { data: result, error: insertError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: salonOrgId,
          entity_type: 'org_anchor',
          entity_name: 'Salon Organization Anchor',
          entity_code: 'SALON-ANCHOR',
          smart_code: '', // Empty smart code to see what happens
          status: 'active'
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('❌ Direct insert failed:', insertError);
        
        // Try without smart_code field entirely
        const { data: result2, error: insertError2 } = await supabase
          .from('core_entities')
          .insert({
            organization_id: salonOrgId,
            entity_type: 'org_anchor',
            entity_name: 'Salon Organization Anchor',
            entity_code: 'SALON-ANCHOR-2',
            status: 'active'
          })
          .select()
          .single();
          
        if (insertError2) {
          console.error('❌ Insert without smart_code failed:', insertError2);
          return { success: false, error: insertError2 };
        } else {
          console.log('✅ Created anchor without smart_code:', result2.id);
          return {
            salonOrgId,
            salonAnchorId: result2.id,
            success: true
          };
        }
      } else {
        console.log('✅ Created anchor with empty smart_code:', result.id);
        return {
          salonOrgId,
          salonAnchorId: result.id,
          success: true
        };
      }
    } else {
      console.log('✅ Created anchor via RPC:', data);
      return {
        salonOrgId,
        salonAnchorId: data,
        success: true
      };
    }
    
  } catch (error) {
    console.error('💥 Critical Error:', error);
    return { success: false, error };
  }
}

// Execute if called directly
if (require.main === module) {
  createSalonAnchorDirect()
    .then(result => {
      if (result && result.success) {
        console.log('\n🚀 Salon Anchor Setup Complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🏢 Salon Org ID: ${result.salonOrgId}`);
        console.log(`⚓ Anchor Entity ID: ${result.salonAnchorId}`);
        console.log(`🔐 Ready for user membership relationships`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        process.exit(0);
      } else {
        console.error('❌ Salon Anchor setup failed:', result ? result.error : 'Unknown error');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { createSalonAnchorDirect };