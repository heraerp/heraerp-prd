#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPlatformMinimal() {
  console.log('🏛️ Creating HERA Platform Organization (Minimal Setup)...\n');
  
  try {
    // Step 1: Verify Platform Organization exists
    const platformOrgId = '00000000-0000-0000-0000-000000000000';
    
    const { data: existingOrg } = await supabase
      .from('core_organizations')
      .select('id, organization_name')
      .eq('id', platformOrgId)
      .single();
      
    if (existingOrg) {
      console.log('✅ Platform Organization already exists');
      console.log(`   ID: ${existingOrg.id}`);
      console.log(`   Name: ${existingOrg.organization_name}\n`);
    } else {
      console.log('❌ Platform Organization not found. This should exist from previous step.\n');
      return { success: false, error: 'Platform org not found' };
    }
    
    console.log('🚀 Platform Organization Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Platform ID: ${platformOrgId}`);
    console.log(`🏛️ Organization: ${existingOrg.organization_name}`);
    console.log(`🔐 Ready for user identity bridging`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return {
      platformOrgId,
      success: true
    };
    
  } catch (error) {
    console.error('💥 Critical Error:', error);
    return { success: false, error };
  }
}

// Execute if called directly
if (require.main === module) {
  createPlatformMinimal()
    .then(result => {
      if (result && result.success) {
        console.log('✅ Setup completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Setup failed:', result ? result.error : 'Unknown error');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { createPlatformMinimal };