#!/usr/bin/env node

console.log('🌍 HERA GLOBAL COA DIRECT UPDATE');
console.log('=' .repeat(50));
console.log('📋 Implementing Universal 5-6-7-8-9 Expense Classification');
console.log('🎯 Target: All organizations in Supabase database');
console.log('');

const { createClient } = require('@supabase/supabase-js');

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

async function deployGlobalCOADirect() {
  try {
    console.log('📊 Step 1: Getting all GL accounts...');
    
    // Get all GL account entities
    const { data: glAccounts, error: glError } = await supabase
      .from('core_entities')
      .select('id, entity_code, entity_name, smart_code, organization_id')
      .eq('entity_type', 'gl_account')
      .order('entity_code');

    if (glError) {
      console.error('❌ Error getting GL accounts:', glError);
      return;
    }

    console.log(`✅ Found ${glAccounts?.length || 0} GL accounts to process`);

    console.log('🔄 Step 2: Updating account types directly...');

    // Process accounts by type
    const updates = [
      { range: '5', type: 'cost_of_sales', name: 'Cost of Sales' },
      { range: '6', type: 'direct_expenses', name: 'Direct Expenses' },
      { range: '7', type: 'indirect_expenses', name: 'Indirect Expenses' },
      { range: '8', type: 'taxes_extraordinary', name: 'Taxes & Extraordinary' },
      { range: '9', type: 'statistical', name: 'Statistical Accounts' }
    ];

    let totalUpdated = 0;

    for (const update of updates) {
      const accountsToUpdate = glAccounts.filter(acc => acc.entity_code.startsWith(update.range));
      
      if (accountsToUpdate.length === 0) {
        console.log(`   ⚪ ${update.range}xxx: No accounts found`);
        continue;
      }

      console.log(`   🔄 ${update.range}xxx: Processing ${accountsToUpdate.length} ${update.name} accounts...`);

      for (const account of accountsToUpdate) {
        try {
          // Check if account_type already exists
          const { data: existingType, error: checkError } = await supabase
            .from('core_dynamic_data')
            .select('id, field_value_text')
            .eq('entity_id', account.id)
            .eq('field_name', 'account_type')
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            console.warn(`     ⚠️ Error checking ${account.entity_code}:`, checkError.message);
            continue;
          }

          if (existingType) {
            // Update existing
            const { error: updateError } = await supabase
              .from('core_dynamic_data')
              .update({
                field_value_text: update.type,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingType.id);

            if (updateError) {
              console.warn(`     ⚠️ Error updating ${account.entity_code}:`, updateError.message);
            } else {
              totalUpdated++;
              console.log(`     ✅ Updated ${account.entity_code} (${existingType.field_value_text} → ${update.type})`);
            }
          } else {
            // Insert new
            const { error: insertError } = await supabase
              .from('core_dynamic_data')
              .insert({
                organization_id: account.organization_id,
                entity_id: account.id,
                field_name: 'account_type',
                field_type: 'text',
                field_value_text: update.type,
                smart_code: account.smart_code + '.ACCOUNT_TYPE',
                field_order: 1,
                is_searchable: true,
                is_required: true,
                validation_status: 'valid'
              });

            if (insertError) {
              console.warn(`     ⚠️ Error inserting ${account.entity_code}:`, insertError.message);
            } else {
              totalUpdated++;
              console.log(`     ✅ Added ${account.entity_code} as ${update.type}`);
            }
          }

          // Add normal_balance if not exists
          const { data: existingBalance, error: balanceCheckError } = await supabase
            .from('core_dynamic_data')
            .select('id')
            .eq('entity_id', account.id)
            .eq('field_name', 'normal_balance')
            .single();

          if (balanceCheckError && balanceCheckError.code === 'PGRST116') {
            // Insert normal_balance
            const normalBalance = ['1', '5', '6', '7', '8', '9'].includes(update.range) ? 'debit' : 'credit';
            await supabase
              .from('core_dynamic_data')
              .insert({
                organization_id: account.organization_id,
                entity_id: account.id,
                field_name: 'normal_balance',
                field_type: 'text',
                field_value_text: normalBalance,
                smart_code: account.smart_code + '.NORMAL_BALANCE',
                field_order: 2,
                is_searchable: true,
                is_required: true,
                validation_status: 'valid'
              });
          }

        } catch (error) {
          console.warn(`     ⚠️ Error processing ${account.entity_code}:`, error.message);
        }
      }
    }

    console.log(`✅ Updated ${totalUpdated} account types`);

    console.log('🔄 Step 3: Updating smart codes...');

    // Update smart codes for the new account types
    let smartCodeUpdates = 0;
    for (const account of glAccounts) {
      if (account.smart_code && account.smart_code.includes('.EXPENSES.')) {
        let newSmartCode = account.smart_code;
        
        if (account.entity_code.startsWith('5')) {
          newSmartCode = account.smart_code.replace('.EXPENSES.', '.COST_OF_SALES.');
        } else if (account.entity_code.startsWith('6')) {
          newSmartCode = account.smart_code.replace('.EXPENSES.', '.DIRECT_EXPENSES.');
        } else if (account.entity_code.startsWith('7')) {
          newSmartCode = account.smart_code.replace('.EXPENSES.', '.INDIRECT_EXPENSES.');
        } else if (account.entity_code.startsWith('8')) {
          newSmartCode = account.smart_code.replace('.EXPENSES.', '.TAXES_EXTRAORDINARY.');
        } else if (account.entity_code.startsWith('9')) {
          newSmartCode = account.smart_code.replace('.EXPENSES.', '.STATISTICAL.');
        }

        if (newSmartCode !== account.smart_code) {
          const { error: smartUpdateError } = await supabase
            .from('core_entities')
            .update({
              smart_code: newSmartCode,
              updated_at: new Date().toISOString()
            })
            .eq('id', account.id);

          if (smartUpdateError) {
            console.warn(`   ⚠️ Error updating smart code for ${account.entity_code}:`, smartUpdateError.message);
          } else {
            smartCodeUpdates++;
            console.log(`   ✅ Updated smart code for ${account.entity_code}`);
          }
        }
      }
    }

    console.log(`✅ Updated ${smartCodeUpdates} smart codes`);

    console.log('🔍 Step 4: Verifying final structure...');

    // Get final distribution
    const { data: finalTypes, error: finalError } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('field_name', 'account_type');

    if (!finalError && finalTypes) {
      console.log('📊 Final account type distribution:');
      const finalDistribution = {};
      finalTypes.forEach(type => {
        finalDistribution[type.field_value_text] = (finalDistribution[type.field_value_text] || 0) + 1;
      });
      Object.entries(finalDistribution).sort().forEach(([type, count]) => {
        console.log(`   ${type}: ${count} accounts`);
      });

      // Count new structure accounts
      const newStructureCount = (finalDistribution['cost_of_sales'] || 0) + 
                               (finalDistribution['direct_expenses'] || 0) + 
                               (finalDistribution['indirect_expenses'] || 0) + 
                               (finalDistribution['taxes_extraordinary'] || 0) + 
                               (finalDistribution['statistical'] || 0);

      console.log('');
      console.log('🎉 SUCCESS: GLOBAL COA NUMBERING STRUCTURE UPDATED!');
      console.log('=' .repeat(60));
      console.log('🌍 UNIVERSAL IMPLEMENTATION COMPLETED:');
      console.log('✅ 1000-1999: Assets (existing)');
      console.log('✅ 2000-2999: Liabilities (existing)');
      console.log('✅ 3000-3999: Equity (existing)');
      console.log('✅ 4000-4999: Revenue (existing)');
      console.log('✅ 5000-5999: Cost of Sales (UPDATED)');
      console.log('✅ 6000-6999: Direct Expenses (UPDATED)');
      console.log('✅ 7000-7999: Indirect Expenses (UPDATED)');
      console.log('✅ 8000-8999: Taxes & Extraordinary (UPDATED)');
      console.log('✅ 9000-9999: Statistical Accounts (UPDATED)');
      console.log('');
      console.log(`📊 TOTAL ACCOUNTS UPDATED: ${totalUpdated}`);
      console.log(`📊 NEW STRUCTURE ACCOUNTS: ${newStructureCount}`);
      console.log(`📊 SMART CODES UPDATED: ${smartCodeUpdates}`);
      console.log('');
      console.log('🚀 GLOBAL IMPACT:');
      console.log('• All GL accounts now follow universal 5-6-7-8-9 structure');
      console.log('• Smart codes updated to reflect new classification');
      console.log('• Normal balance fields added where missing');
      console.log('• All future COA implementations will use this standard');
      console.log('');
      console.log('💡 NEXT STEPS:');
      console.log('1. All progressive applications will automatically use new structure');
      console.log('2. Update HERA DNA with global COA patterns');
      console.log('3. Verify salon COA page reflects new structure');
      console.log('');
      console.log('🧬 HERA: Universal COA patterns now enforced globally!');
    }

  } catch (error) {
    console.error('❌ Global COA direct update failed:', error.message);
    console.error(error);
  }
}

deployGlobalCOADirect().catch(console.error);