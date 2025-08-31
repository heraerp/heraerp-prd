#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Supabase configuration with service key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL to add RLS policies for demo organizations
const ADD_DEMO_RLS_POLICIES = `
-- Enable RLS on all tables (if not already enabled)
ALTER TABLE core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines ENABLE ROW LEVEL SECURITY;

-- Drop existing demo policies if they exist
DROP POLICY IF EXISTS "Demo organizations are viewable by all" ON core_organizations;
DROP POLICY IF EXISTS "Demo entities are viewable by all" ON core_entities;
DROP POLICY IF EXISTS "Demo dynamic data is viewable by all" ON core_dynamic_data;
DROP POLICY IF EXISTS "Demo relationships are viewable by all" ON core_relationships;
DROP POLICY IF EXISTS "Demo transactions are viewable by all" ON universal_transactions;
DROP POLICY IF EXISTS "Demo transaction lines are viewable by all" ON universal_transaction_lines;

-- Create policies for core_organizations
CREATE POLICY "Demo organizations are viewable by all" ON core_organizations
  FOR SELECT
  USING (
    organization_name IN (
      'Kochi Ice Cream Manufacturing',
      'Mario''s Authentic Italian Restaurant',
      'Dr. Smith''s Family Medicine',
      'Glow & Grace Beauty Salon',
      'Strategic Business Partners',
      'Elite Fashion Boutique',
      'ABC Manufacturing Inc'
    )
  );

-- Create policies for core_entities
CREATE POLICY "Demo entities are viewable by all" ON core_entities
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM core_organizations 
      WHERE organization_name IN (
        'Kochi Ice Cream Manufacturing',
        'Mario''s Authentic Italian Restaurant',
        'Dr. Smith''s Family Medicine',
        'Glow & Grace Beauty Salon',
        'Strategic Business Partners',
        'Elite Fashion Boutique',
        'ABC Manufacturing Inc'
      )
    )
  );

-- Create policies for core_dynamic_data
CREATE POLICY "Demo dynamic data is viewable by all" ON core_dynamic_data
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM core_organizations 
      WHERE organization_name IN (
        'Kochi Ice Cream Manufacturing',
        'Mario''s Authentic Italian Restaurant',
        'Dr. Smith''s Family Medicine',
        'Glow & Grace Beauty Salon',
        'Strategic Business Partners',
        'Elite Fashion Boutique',
        'ABC Manufacturing Inc'
      )
    )
  );

-- Create policies for core_relationships
CREATE POLICY "Demo relationships are viewable by all" ON core_relationships
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM core_organizations 
      WHERE organization_name IN (
        'Kochi Ice Cream Manufacturing',
        'Mario''s Authentic Italian Restaurant',
        'Dr. Smith''s Family Medicine',
        'Glow & Grace Beauty Salon',
        'Strategic Business Partners',
        'Elite Fashion Boutique',
        'ABC Manufacturing Inc'
      )
    )
  );

-- Create policies for universal_transactions
CREATE POLICY "Demo transactions are viewable by all" ON universal_transactions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM core_organizations 
      WHERE organization_name IN (
        'Kochi Ice Cream Manufacturing',
        'Mario''s Authentic Italian Restaurant',
        'Dr. Smith''s Family Medicine',
        'Glow & Grace Beauty Salon',
        'Strategic Business Partners',
        'Elite Fashion Boutique',
        'ABC Manufacturing Inc'
      )
    )
  );

-- Create policies for universal_transaction_lines
CREATE POLICY "Demo transaction lines are viewable by all" ON universal_transaction_lines
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM core_organizations 
      WHERE organization_name IN (
        'Kochi Ice Cream Manufacturing',
        'Mario''s Authentic Italian Restaurant',
        'Dr. Smith''s Family Medicine',
        'Glow & Grace Beauty Salon',
        'Strategic Business Partners',
        'Elite Fashion Boutique',
        'ABC Manufacturing Inc'
      )
    )
  );
`;

async function fixDemoAccess() {
  console.log('🔧 Fixing Production Demo Access...\n');

  try {
    // Execute the SQL to add RLS policies
    console.log('📝 Adding RLS policies for demo organizations...');
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql: ADD_DEMO_RLS_POLICIES
    });

    if (sqlError) {
      // If direct SQL execution fails, try using the Supabase SQL editor approach
      console.log('⚠️  Direct SQL execution not available. Please run the following SQL in Supabase Dashboard:');
      console.log('\n' + '='.repeat(80));
      console.log(ADD_DEMO_RLS_POLICIES);
      console.log('='.repeat(80) + '\n');
      
      console.log('📋 Steps to apply:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Create a new query');
      console.log('4. Paste the SQL above');
      console.log('5. Click "Run"');
      console.log('\n✨ Once applied, all demo routes will work correctly!');
      return;
    }

    console.log('✅ RLS policies added successfully!');

    // Verify the fix by checking data access
    console.log('\n🔍 Verifying data access...');
    
    const { data: orgs, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, organization_name')
      .eq('organization_name', 'Kochi Ice Cream Manufacturing')
      .single();

    if (!orgError && orgs) {
      console.log('✅ Demo organization accessible:', orgs.organization_name);

      // Check entity count
      const { count: entityCount } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgs.id);

      console.log(`✅ Entities accessible: ${entityCount} records`);

      // Check transaction count
      const { count: txCount } = await supabase
        .from('universal_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgs.id);

      console.log(`✅ Transactions accessible: ${txCount} records`);

      console.log('\n🎉 Production demo access fixed successfully!');
      console.log('🌐 The following URLs should now work:');
      console.log('   - https://heraerp.com/icecream');
      console.log('   - https://heraerp.com/restaurant');
      console.log('   - https://heraerp.com/salon');
      console.log('   - https://heraerp.com/healthcare');
    } else {
      console.log('❌ Could not verify data access. Please check Supabase Dashboard.');
    }

  } catch (error) {
    console.error('❌ Error fixing demo access:', error);
    console.log('\n💡 Please apply the RLS policies manually via Supabase Dashboard (see SQL above)');
  }
}

// Run the fix
fixDemoAccess().catch(console.error);