import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function assessDataLoss() {
  console.log('🔍 ASSESSING DATA LOSS AFTER FINANCE DNA V2 CLEANUP\n');
  console.log('=' .repeat(60) + '\n');

  const targetOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

  try {
    // Check core_relationships
    console.log('1. CORE_RELATIONSHIPS TABLE:');
    const { count: relCount, error: relError } = await supabase
      .from('core_relationships')
      .select('*', { count: 'exact', head: true });

    if (relError) {
      console.error('Error:', relError);
    } else {
      console.log(`   Total relationships: ${relCount}`);
      if (relCount === 0) {
        console.log('   ❌ CRITICAL: ALL RELATIONSHIP DATA LOST!');
      }
    }

    // Check core_entities for target org
    console.log('\n2. CORE_ENTITIES FOR TARGET ORG:');
    const { count: entityCount, error: entityError } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', targetOrgId);

    if (entityError) {
      console.error('Error:', entityError);
    } else {
      console.log(`   Entities in target org: ${entityCount}`);
    }

    // Get sample entities to see what remains
    const { data: entities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('entity_type, entity_name, smart_code')
      .eq('organization_id', targetOrgId)
      .limit(10);

    if (!entitiesError && entities.length > 0) {
      console.log('   Sample entities:');
      entities.forEach((e, i) => {
        console.log(`     ${i+1}. ${e.entity_type}: ${e.entity_name} (${e.smart_code})`);
      });
    }

    // Check core_dynamic_data
    console.log('\n3. CORE_DYNAMIC_DATA FOR TARGET ORG:');
    const { count: dynamicCount, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', targetOrgId);

    if (dynamicError) {
      console.error('Error:', dynamicError);
    } else {
      console.log(`   Dynamic data records: ${dynamicCount}`);
    }

    // Check universal_transactions
    console.log('\n4. UNIVERSAL_TRANSACTIONS FOR TARGET ORG:');
    const { count: txnCount, error: txnError } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', targetOrgId);

    if (txnError) {
      console.error('Error:', txnError);
    } else {
      console.log(`   Transactions: ${txnCount}`);
    }

    // Check universal_transaction_lines
    console.log('\n5. UNIVERSAL_TRANSACTION_LINES FOR TARGET ORG:');
    // Need to join with transactions to filter by org
    const { data: txnLines, error: linesError } = await supabase
      .from('universal_transaction_lines')
      .select(`
        *,
        universal_transactions!inner(organization_id)
      `)
      .eq('universal_transactions.organization_id', targetOrgId);

    if (linesError) {
      console.error('Error:', linesError);
    } else {
      console.log(`   Transaction lines: ${txnLines?.length || 0}`);
    }

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📋 DATA LOSS SUMMARY:');
    console.log('=' .repeat(60));
    
    if (relCount === 0) {
      console.log('❌ CRITICAL LOSS: All relationships deleted');
      console.log('   This affects:');
      console.log('   - Status workflows (has_status relationships)');
      console.log('   - Account hierarchies (parent_of/child_of)');
      console.log('   - User-organization memberships');
      console.log('   - Entity categorizations');
      console.log('   - Workflow transitions');
    }

    console.log('\n🔧 WHAT NEEDS TO BE RESTORED:');
    console.log('1. User-organization relationships (user_member_of_org)');
    console.log('2. Account hierarchy relationships (parent_of/child_of)');
    console.log('3. Status workflow relationships (has_status)');
    console.log('4. Entity categorization relationships');
    console.log('5. Service-staff assignments');
    console.log('6. Customer-appointment relationships');

    // Check if we can find backup data or reference scripts
    console.log('\n🔍 CHECKING FOR BACKUP/REFERENCE DATA...');
    
    // Look for any system organization data that might serve as templates
    const { data: systemOrg, error: systemError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944') // System org
      .limit(5);

    if (!systemError && systemOrg?.length > 0) {
      console.log('✅ System organization data found - can use as templates');
    } else {
      console.log('❌ No system organization data found');
    }

  } catch (error) {
    console.error('Error during assessment:', error);
  }
}

assessDataLoss();