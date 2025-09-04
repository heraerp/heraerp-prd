const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Organization IDs
const organizations = [
  { id: '849b6efe-2bf0-438f-9c70-01835ac2fe15', name: 'Salon Group' },
  { id: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', name: 'Hair Talkz • Park Regis' },
  { id: '0b1b37cd-4096-4718-8cd4-e370f234005b', name: 'Hair Talkz • Mercure Gold' }
];

async function setupFiscalYear() {
  console.log('🗓️ Setting up Fiscal Year Configuration for Salon Group...\n');

  for (const org of organizations) {
    console.log(`\n=== Configuring Fiscal Year for ${org.name} ===`);

    // 1. Create Fiscal Year Configuration entity
    const { data: fiscalConfig, error: configError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: org.id,
        entity_type: 'fiscal_configuration',
        entity_code: 'FISCAL-CONFIG-2025',
        entity_name: 'Fiscal Year Configuration 2025',
        smart_code: 'HERA.SALON.FISCAL.CONFIG.CALENDAR.v1'
      })
      .select()
      .single();

    if (configError) {
      console.error('Error creating fiscal config:', configError);
      continue;
    }

    console.log('✅ Created Fiscal Configuration entity');

    // 2. Add Fiscal Year settings as dynamic data
    const fiscalSettings = [
      { field_name: 'fiscal_year_start', field_value_text: '01-01', smart_code: 'HERA.FISCAL.START.v1' },
      { field_name: 'fiscal_year_end', field_value_text: '12-31', smart_code: 'HERA.FISCAL.END.v1' },
      { field_name: 'fiscal_year_type', field_value_text: 'calendar', smart_code: 'HERA.FISCAL.TYPE.v1' },
      { field_name: 'current_fiscal_year', field_value_number: 2025, smart_code: 'HERA.FISCAL.YEAR.v1' },
      { field_name: 'closing_month', field_value_number: 12, smart_code: 'HERA.FISCAL.CLOSING.MONTH.v1' },
      { field_name: 'periods_per_year', field_value_number: 12, smart_code: 'HERA.FISCAL.PERIODS.v1' },
      { field_name: 'allow_parallel_years', field_value_boolean: true, smart_code: 'HERA.FISCAL.PARALLEL.v1' },
      { field_name: 'auto_close_enabled', field_value_boolean: false, smart_code: 'HERA.FISCAL.AUTOCLOSE.v1' }
    ];

    for (const setting of fiscalSettings) {
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: org.id,
          entity_id: fiscalConfig.id,
          ...setting
        });
    }

    console.log('✅ Added Fiscal Year settings');

    // 3. Create Fiscal Periods for 2025
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    for (let i = 0; i < 12; i++) {
      const periodCode = `FY2025-P${String(i + 1).padStart(2, '0')}`;
      
      const { data: period, error: periodError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: org.id,
          entity_type: 'fiscal_period',
          entity_code: periodCode,
          entity_name: `${months[i]} 2025`,
          smart_code: `HERA.SALON.FISCAL.PERIOD.${i + 1}.v1`
        })
        .select()
        .single();

      if (period && !periodError) {
        // Add period details
        await supabase
          .from('core_dynamic_data')
          .insert([
            {
              organization_id: org.id,
              entity_id: period.id,
              field_name: 'period_number',
              field_value_number: i + 1,
              smart_code: 'HERA.FISCAL.PERIOD.NUM.v1'
            },
            {
              organization_id: org.id,
              entity_id: period.id,
              field_name: 'period_status',
              field_value_text: i < 11 ? 'open' : 'current',
              smart_code: 'HERA.FISCAL.PERIOD.STATUS.v1'
            },
            {
              organization_id: org.id,
              entity_id: period.id,
              field_name: 'start_date',
              field_value_text: `2025-${String(i + 1).padStart(2, '0')}-01`,
              smart_code: 'HERA.FISCAL.PERIOD.START.v1'
            },
            {
              organization_id: org.id,
              entity_id: period.id,
              field_name: 'end_date',
              field_value_text: `2025-${String(i + 1).padStart(2, '0')}-${new Date(2025, i + 1, 0).getDate()}`,
              smart_code: 'HERA.FISCAL.PERIOD.END.v1'
            }
          ]);

        // Create relationship to fiscal config
        await supabase
          .from('core_relationships')
          .insert({
            organization_id: org.id,
            from_entity_id: fiscalConfig.id,
            to_entity_id: period.id,
            relationship_type: 'has_period',
            smart_code: 'HERA.FISCAL.REL.CONFIG.PERIOD.v1'
          });
      }
    }

    console.log('✅ Created 12 Fiscal Periods for 2025');

    // 4. Create Year-End Closing Configuration
    const { data: closingConfig, error: closingError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: org.id,
        entity_type: 'closing_configuration',
        entity_code: 'YEAR-END-CONFIG',
        entity_name: 'Year-End Closing Configuration',
        smart_code: 'HERA.SALON.CLOSING.CONFIG.v1'
      })
      .select()
      .single();

    if (closingConfig && !closingError) {
      // Year-end closing steps configuration
      const closingSteps = [
        { field_name: 'step_1_reconcile_bank', field_value_boolean: true, smart_code: 'HERA.CLOSING.STEP.BANK.v1' },
        { field_name: 'step_2_reconcile_inventory', field_value_boolean: true, smart_code: 'HERA.CLOSING.STEP.INVENTORY.v1' },
        { field_name: 'step_3_accrue_expenses', field_value_boolean: true, smart_code: 'HERA.CLOSING.STEP.ACCRUE.v1' },
        { field_name: 'step_4_calculate_depreciation', field_value_boolean: true, smart_code: 'HERA.CLOSING.STEP.DEPRECIATION.v1' },
        { field_name: 'step_5_close_revenue', field_value_boolean: true, smart_code: 'HERA.CLOSING.STEP.REVENUE.v1' },
        { field_name: 'step_6_close_expenses', field_value_boolean: true, smart_code: 'HERA.CLOSING.STEP.EXPENSES.v1' },
        { field_name: 'step_7_calculate_pl', field_value_boolean: true, smart_code: 'HERA.CLOSING.STEP.PL.v1' },
        { field_name: 'step_8_transfer_retained', field_value_boolean: true, smart_code: 'HERA.CLOSING.STEP.RETAINED.v1' },
        { field_name: 'retained_earnings_account', field_value_text: '3200000', smart_code: 'HERA.CLOSING.RETAINED.ACCOUNT.v1' },
        { field_name: 'current_year_account', field_value_text: '3300000', smart_code: 'HERA.CLOSING.CURRENT.ACCOUNT.v1' }
      ];

      for (const step of closingSteps) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: org.id,
            entity_id: closingConfig.id,
            ...step
          });
      }

      console.log('✅ Created Year-End Closing Configuration');
    }

    // 5. Create Year-End Closing Checklist Template
    const checklistItems = [
      { code: 'YEC-01', name: 'Reconcile all bank accounts', category: 'reconciliation' },
      { code: 'YEC-02', name: 'Complete physical inventory count', category: 'inventory' },
      { code: 'YEC-03', name: 'Review and adjust prepaid expenses', category: 'adjustments' },
      { code: 'YEC-04', name: 'Accrue unpaid expenses', category: 'adjustments' },
      { code: 'YEC-05', name: 'Calculate and book depreciation', category: 'adjustments' },
      { code: 'YEC-06', name: 'Reconcile inter-branch accounts', category: 'reconciliation' },
      { code: 'YEC-07', name: 'Review customer deposits and gift cards', category: 'liabilities' },
      { code: 'YEC-08', name: 'Calculate commission payables', category: 'liabilities' },
      { code: 'YEC-09', name: 'Review and adjust VAT accounts', category: 'tax' },
      { code: 'YEC-10', name: 'Generate trial balance', category: 'reporting' },
      { code: 'YEC-11', name: 'Review P&L by service category', category: 'reporting' },
      { code: 'YEC-12', name: 'Close revenue accounts to P&L', category: 'closing' },
      { code: 'YEC-13', name: 'Close expense accounts to P&L', category: 'closing' },
      { code: 'YEC-14', name: 'Transfer P&L to retained earnings', category: 'closing' },
      { code: 'YEC-15', name: 'Generate final financial statements', category: 'reporting' }
    ];

    for (const item of checklistItems) {
      await supabase
        .from('core_entities')
        .insert({
          organization_id: org.id,
          entity_type: 'closing_checklist_item',
          entity_code: item.code,
          entity_name: item.name,
          smart_code: `HERA.SALON.CLOSING.CHECKLIST.${item.code}.v1`
        });
    }

    console.log('✅ Created Year-End Closing Checklist (15 items)');
  }

  console.log('\n\n🎉 Fiscal Year Configuration Complete!');
  console.log('=====================================');
  console.log('✓ Fiscal Year: January 1 - December 31');
  console.log('✓ 12 Monthly periods created for 2025');
  console.log('✓ Year-end closing configuration set');
  console.log('✓ Closing checklist templates created');
  console.log('✓ Retained Earnings account: 3200000');
  console.log('✓ Current Year Earnings account: 3300000');
}

// Create Year-End Closing DNA Function
async function createYearEndClosingDNA() {
  console.log('\n\n🧬 Creating Year-End Closing DNA Pattern...\n');

  // This DNA pattern will be stored in the system organization
  const systemOrgId = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'; // HERA System Organization

  const { data: closingDNA, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: systemOrgId,
      entity_type: 'dna_pattern',
      entity_code: 'DNA-YEAR-END-CLOSING',
      entity_name: 'Year-End Closing DNA Pattern',
      smart_code: 'HERA.DNA.CLOSING.YEAREND.v1'
    })
    .select()
    .single();

  if (closingDNA && !error) {
    // Add the DNA pattern code
    const dnaCode = `
-- HERA Year-End Closing DNA Pattern
-- Automatically closes fiscal year and carries forward balances

CREATE OR REPLACE FUNCTION hera_year_end_closing(
  p_organization_id UUID,
  p_fiscal_year INTEGER,
  p_closing_date DATE DEFAULT CURRENT_DATE
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_retained_earnings_id UUID;
  v_current_year_id UUID;
  v_total_revenue DECIMAL(15,2) := 0;
  v_total_expenses DECIMAL(15,2) := 0;
  v_net_income DECIMAL(15,2) := 0;
  v_closing_entry_id UUID;
BEGIN
  -- Step 1: Get retained earnings and current year accounts
  SELECT id INTO v_retained_earnings_id
  FROM core_entities
  WHERE organization_id = p_organization_id
    AND entity_type = 'gl_account'
    AND entity_code = '3200000';
    
  SELECT id INTO v_current_year_id
  FROM core_entities
  WHERE organization_id = p_organization_id
    AND entity_type = 'gl_account'
    AND entity_code = '3300000';

  -- Step 2: Calculate total revenue
  SELECT COALESCE(SUM(tl.line_amount), 0) INTO v_total_revenue
  FROM universal_transaction_lines tl
  JOIN universal_transactions t ON t.id = tl.transaction_id
  JOIN core_entities e ON e.id = tl.line_entity_id
  WHERE t.organization_id = p_organization_id
    AND e.entity_code LIKE '4%'
    AND EXTRACT(YEAR FROM t.transaction_date) = p_fiscal_year;

  -- Step 3: Calculate total expenses
  SELECT COALESCE(SUM(tl.line_amount), 0) INTO v_total_expenses
  FROM universal_transaction_lines tl
  JOIN universal_transactions t ON t.id = tl.transaction_id
  JOIN core_entities e ON e.id = tl.line_entity_id
  WHERE t.organization_id = p_organization_id
    AND e.entity_code LIKE '5%'
    AND EXTRACT(YEAR FROM t.transaction_date) = p_fiscal_year;

  -- Step 4: Calculate net income
  v_net_income := v_total_revenue - v_total_expenses;

  -- Step 5: Create closing journal entry
  INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    transaction_code,
    transaction_date,
    description,
    total_amount,
    smart_code
  ) VALUES (
    p_organization_id,
    'journal_entry',
    'JE-CLOSING-' || p_fiscal_year,
    p_closing_date,
    'Year-end closing for fiscal year ' || p_fiscal_year,
    ABS(v_net_income),
    'HERA.SALON.CLOSING.JE.YEAREND.v1'
  ) RETURNING id INTO v_closing_entry_id;

  -- Step 6: Create closing entry lines
  IF v_net_income > 0 THEN
    -- Profit: Debit Current Year, Credit Retained Earnings
    INSERT INTO universal_transaction_lines (transaction_id, line_entity_id, line_number, line_amount, line_type)
    VALUES 
      (v_closing_entry_id, v_current_year_id, 1, v_net_income, 'debit'),
      (v_closing_entry_id, v_retained_earnings_id, 2, v_net_income, 'credit');
  ELSE
    -- Loss: Debit Retained Earnings, Credit Current Year
    INSERT INTO universal_transaction_lines (transaction_id, line_entity_id, line_number, line_amount, line_type)
    VALUES 
      (v_closing_entry_id, v_retained_earnings_id, 1, ABS(v_net_income), 'debit'),
      (v_closing_entry_id, v_current_year_id, 2, ABS(v_net_income), 'credit');
  END IF;

  -- Return results
  v_result := json_build_object(
    'fiscal_year', p_fiscal_year,
    'total_revenue', v_total_revenue,
    'total_expenses', v_total_expenses,
    'net_income', v_net_income,
    'closing_entry_id', v_closing_entry_id,
    'status', 'completed'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
    `;

    await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: systemOrgId,
        entity_id: closingDNA.id,
        field_name: 'dna_pattern_code',
        field_value_text: dnaCode,
        smart_code: 'HERA.DNA.PATTERN.CODE.v1'
      });

    console.log('✅ Created Year-End Closing DNA Pattern');
  }
}

// Run both functions
async function main() {
  await setupFiscalYear();
  await createYearEndClosingDNA();
}

main().catch(console.error);