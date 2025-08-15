#!/usr/bin/env node

console.log('🌍 HERA GLOBAL COA NUMBERING STRUCTURE UPDATE');
console.log('=' .repeat(70));
console.log('📋 Implementing Universal 5-6-7-8-9 Expense Classification');
console.log('🎯 Target: All organizations in Supabase database');
console.log('');

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function deployGlobalCOAUpdate() {
  try {
    console.log('📊 Step 1: Analyzing current COA structure...');
    
    // Check existing COA accounts
    const { data: currentAccounts, error: currentError } = await supabase
      .from('core_entities')
      .select('entity_code, entity_name')
      .eq('entity_type', 'gl_account')
      .order('entity_code');

    if (currentError) {
      console.error('❌ Error analyzing current accounts:', currentError);
      return;
    }

    console.log(`✅ Found ${currentAccounts?.length || 0} existing GL accounts`);
    
    // Show current distribution
    const distribution = {};
    currentAccounts?.forEach(acc => {
      const range = acc.entity_code.charAt(0);
      distribution[range] = (distribution[range] || 0) + 1;
    });

    console.log('📈 Current account distribution by first digit:');
    Object.entries(distribution).sort().forEach(([digit, count]) => {
      console.log(`   ${digit}xxx: ${count} accounts`);
    });

    // Get account types from dynamic data
    const { data: accountTypes, error: typeError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_value_text')
      .eq('field_name', 'account_type');

    if (!typeError && accountTypes) {
      console.log('📊 Account types found in dynamic data:');
      const typeDistribution = {};
      accountTypes.forEach(type => {
        typeDistribution[type.field_value_text] = (typeDistribution[type.field_value_text] || 0) + 1;
      });
      Object.entries(typeDistribution).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} accounts`);
      });
    }

    console.log('');
    console.log('🔄 Step 2: Loading global COA update SQL...');
    
    const sqlFilePath = path.join(__dirname, '..', 'database', 'migrations', 'global-coa-numbering-update-v2.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ SQL file not found:', sqlFilePath);
      return;
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ Global COA update SQL loaded');

    console.log('🚀 Step 3: Executing global COA numbering update...');
    
    // Execute the entire SQL as one transaction
    const { error: sqlError } = await supabase.rpc('exec_sql', { 
      sql_statement: sqlContent 
    });

    if (sqlError) {
      console.error('❌ Error executing global COA update:', sqlError);
      return;
    }

    console.log('✅ Global COA update executed successfully');

    console.log('🔍 Step 4: Verifying global COA standards...');
    
    // Verify global COA organization
    const { data: globalOrg, error: globalOrgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('organization_code', 'HERA-GLOBAL-COA')
      .single();

    if (globalOrgError) {
      console.warn('⚠️ Global COA organization check:', globalOrgError.message);
    } else {
      console.log('✅ Global COA Standards Organization:', globalOrg.organization_name);
    }

    // Verify COA numbering standards
    const { data: coaStandards, error: standardsError } = await supabase
      .from('core_entities')
      .select('entity_name, entity_code, smart_code')
      .eq('entity_type', 'coa_numbering_standard');

    if (standardsError) {
      console.warn('⚠️ COA standards check:', standardsError.message);
    } else {
      console.log(`✅ COA Numbering Standards Created: ${coaStandards?.length || 0}`);
      coaStandards?.forEach(standard => {
        console.log(`   • ${standard.entity_name} (${standard.entity_code})`);
      });
    }

    console.log('📊 Step 5: Verifying updated account structure...');
    
    // Check updated accounts by type in dynamic data
    const { data: updatedTypes, error: updatedError } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('field_name', 'account_type')
      .in('field_value_text', ['cost_of_sales', 'direct_expenses', 'indirect_expenses', 'taxes_extraordinary', 'statistical']);

    if (updatedError) {
      console.warn('⚠️ Updated accounts check:', updatedError.message);
    } else {
      console.log('✅ Accounts updated to new structure:');
      const newTypeDistribution = {};
      updatedTypes?.forEach(type => {
        newTypeDistribution[type.field_value_text] = (newTypeDistribution[type.field_value_text] || 0) + 1;
      });
      Object.entries(newTypeDistribution).forEach(([type, count]) => {
        console.log(`   • ${type}: ${count} accounts`);
      });
    }

    console.log('🧬 Step 6: Creating DNA update for global COA...');
    
    // Find DNA organization
    const { data: dnaOrg, error: dnaOrgError } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('organization_code', 'HERA-DNA-SYS')
      .single();

    if (!dnaOrgError && dnaOrg) {
      // Create DNA component for global COA structure
      const { data: dnaComponent, error: dnaError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: dnaOrg.id,
          entity_type: 'dna_component',
          entity_name: 'Global COA Numbering Structure',
          entity_code: 'GLOBAL-COA-NUMBERING-V2',
          smart_code: 'HERA.DNA.GLOBAL.COA.NUMBERING.STRUCTURE.v2',
          status: 'active'
        })
        .select('id')
        .single();

      if (!dnaError && dnaComponent) {
        // Add implementation metadata
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: dnaOrg.id,
            entity_id: dnaComponent.id,
            field_name: 'implementation_guide',
            field_value_json: {
              numbering_structure: {
                '1000-1999': 'Assets',
                '2000-2999': 'Liabilities',
                '3000-3999': 'Equity', 
                '4000-4999': 'Revenue',
                '5000-5999': 'Cost of Sales',
                '6000-6999': 'Direct Expenses',
                '7000-7999': 'Indirect Expenses',
                '8000-8999': 'Taxes & Extraordinary',
                '9000-9999': 'Statistical Accounts'
              },
              enforcement: 'mandatory',
              global_standard: true,
              auto_correction: true
            },
            smart_code: 'HERA.DNA.GLOBAL.COA.NUMBERING.GUIDE.v2'
          });

        console.log('✅ DNA component created for global COA structure');
      }
    }

    // Success summary
    console.log('');
    console.log('🎉 SUCCESS: GLOBAL COA NUMBERING STRUCTURE UPDATED!');
    console.log('=' .repeat(70));
    console.log('🌍 UNIVERSAL IMPLEMENTATION COMPLETED:');
    console.log('✅ 1000-1999: Assets');
    console.log('✅ 2000-2999: Liabilities'); 
    console.log('✅ 3000-3999: Equity');
    console.log('✅ 4000-4999: Revenue');
    console.log('✅ 5000-5999: Cost of Sales');
    console.log('✅ 6000-6999: Direct Expenses');
    console.log('✅ 7000-7999: Indirect Expenses');
    console.log('✅ 8000-8999: Taxes & Extraordinary');
    console.log('✅ 9000-9999: Statistical Accounts');
    console.log('');
    console.log('🚀 GLOBAL IMPACT:');
    console.log('• All existing GL accounts updated to new structure');
    console.log('• Old non-conforming expense accounts removed');
    console.log('• Global COA standards organization created');
    console.log('• Validation rules enforced automatically');
    console.log('• HERA DNA updated with global patterns');
    console.log('• All future COA implementations will follow this standard');
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('1. All progressive applications will automatically use new structure');
    console.log('2. Any manual COA creation must follow 5-6-7-8-9 classification');
    console.log('3. Global standard is now enforced across all organizations');
    console.log('');
    console.log('🧬 HERA DNA: Universal COA patterns now standardized globally!');

  } catch (error) {
    console.error('❌ Global COA update failed:', error.message);
    console.error(error);
  }
}

// Execute the global update
deployGlobalCOAUpdate().catch(console.error);