const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Organization IDs
const organizations = {
  headOffice: '849b6efe-2bf0-438f-9c70-01835ac2fe15',
  parkRegis: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
  mercureGold: '0b1b37cd-4096-4718-8cd4-e370f234005b'
};

async function setupCommissionStructure() {
  console.log('💰 Setting up Commission Structure for Hair Talkz...\n');

  // Commission structure configuration
  const commissionStructure = {
    // Service-based commissions
    services: [
      {
        category: 'hair_cut',
        name: 'Hair Cutting Services',
        rules: [
          { role: 'SENIOR_STYLIST', rate: 35, smart_code: 'HERA.SALON.COMM.HAIRCUT.SR.v1' },
          { role: 'STYLIST', rate: 30, smart_code: 'HERA.SALON.COMM.HAIRCUT.MID.v1' },
          { role: 'JUNIOR_STYLIST', rate: 25, smart_code: 'HERA.SALON.COMM.HAIRCUT.JR.v1' }
        ]
      },
      {
        category: 'hair_color',
        name: 'Hair Coloring Services',
        rules: [
          { role: 'COLORIST', rate: 32, smart_code: 'HERA.SALON.COMM.COLOR.SPEC.v1' },
          { role: 'SENIOR_STYLIST', rate: 35, smart_code: 'HERA.SALON.COMM.COLOR.SR.v1' },
          { role: 'STYLIST', rate: 28, smart_code: 'HERA.SALON.COMM.COLOR.MID.v1' }
        ]
      },
      {
        category: 'treatments',
        name: 'Hair & Beauty Treatments',
        rules: [
          { role: 'THERAPIST', rate: 30, smart_code: 'HERA.SALON.COMM.TREATMENT.v1' },
          { role: 'SENIOR_STYLIST', rate: 32, smart_code: 'HERA.SALON.COMM.TREATMENT.SR.v1' }
        ]
      },
      {
        category: 'retail',
        name: 'Product Sales',
        rules: [
          { role: 'ALL_STAFF', rate: 10, smart_code: 'HERA.SALON.COMM.RETAIL.v1' }
        ]
      }
    ],
    
    // Management bonuses
    management: [
      {
        role: 'BRANCH_MANAGER',
        type: 'revenue_based',
        rate: 2,
        threshold: 100000, // Monthly revenue threshold
        smart_code: 'HERA.SALON.COMM.MGT.REVENUE.v1'
      }
    ],
    
    // Special incentives
    incentives: [
      {
        name: 'New Client Bonus',
        amount: 25,
        smart_code: 'HERA.SALON.COMM.BONUS.NEWCLIENT.v1'
      },
      {
        name: 'Upsell Bonus',
        type: 'percentage',
        rate: 5,
        smart_code: 'HERA.SALON.COMM.BONUS.UPSELL.v1'
      },
      {
        name: 'Perfect Attendance',
        amount: 500,
        period: 'monthly',
        smart_code: 'HERA.SALON.COMM.BONUS.ATTENDANCE.v1'
      }
    ]
  };

  // Create commission structure for each branch
  for (const [branchKey, orgId] of Object.entries(organizations)) {
    if (branchKey === 'headOffice') continue; // Skip head office
    
    console.log(`\n=== Setting up commission for ${branchKey} ===`);

    // 1. Create Commission Configuration Entity
    const { data: commConfig, error: configError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'commission_configuration',
        entity_code: `COMM-CONFIG-${branchKey.toUpperCase()}`,
        entity_name: `Commission Configuration - ${branchKey}`,
        smart_code: 'HERA.SALON.COMM.CONFIG.v1'
      })
      .select()
      .single();

    if (configError) {
      console.error('Error creating commission config:', configError);
      continue;
    }

    console.log('✅ Created commission configuration entity');

    // 2. Create service commission rules
    for (const service of commissionStructure.services) {
      for (const rule of service.rules) {
        const { data: commRule, error: ruleError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: orgId,
            entity_type: 'commission_rule',
            entity_code: `COMM-${service.category.toUpperCase()}-${rule.role}`,
            entity_name: `${service.name} - ${rule.role}`,
            smart_code: rule.smart_code
          })
          .select()
          .single();

        if (commRule && !ruleError) {
          // Add rule details
          await supabase
            .from('core_dynamic_data')
            .insert([
              {
                organization_id: orgId,
                entity_id: commRule.id,
                field_name: 'service_category',
                field_value_text: service.category,
                smart_code: 'HERA.SALON.COMM.CATEGORY.v1'
              },
              {
                organization_id: orgId,
                entity_id: commRule.id,
                field_name: 'applicable_role',
                field_value_text: rule.role,
                smart_code: 'HERA.SALON.COMM.ROLE.v1'
              },
              {
                organization_id: orgId,
                entity_id: commRule.id,
                field_name: 'commission_rate',
                field_value_number: rule.rate,
                smart_code: 'HERA.SALON.COMM.RATE.v1'
              },
              {
                organization_id: orgId,
                entity_id: commRule.id,
                field_name: 'calculation_basis',
                field_value_text: 'service_revenue',
                smart_code: 'HERA.SALON.COMM.BASIS.v1'
              }
            ]);

          // Link to configuration
          await supabase
            .from('core_relationships')
            .insert({
              organization_id: orgId,
              from_entity_id: commConfig.id,
              to_entity_id: commRule.id,
              relationship_type: 'has_rule',
              smart_code: 'HERA.SALON.COMM.REL.RULE.v1'
            });

          console.log(`✅ Created commission rule: ${service.name} - ${rule.role} (${rule.rate}%)`);
        }
      }
    }

    // 3. Create management bonus rules
    for (const mgmtRule of commissionStructure.management) {
      const { data: bonusRule, error: bonusError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'commission_rule',
          entity_code: `COMM-MGMT-${mgmtRule.role}`,
          entity_name: `Management Bonus - ${mgmtRule.role}`,
          smart_code: mgmtRule.smart_code
        })
        .select()
        .single();

      if (bonusRule && !bonusError) {
        await supabase
          .from('core_dynamic_data')
          .insert([
            {
              organization_id: orgId,
              entity_id: bonusRule.id,
              field_name: 'bonus_type',
              field_value_text: mgmtRule.type,
              smart_code: 'HERA.SALON.COMM.BONUS.TYPE.v1'
            },
            {
              organization_id: orgId,
              entity_id: bonusRule.id,
              field_name: 'bonus_rate',
              field_value_number: mgmtRule.rate,
              smart_code: 'HERA.SALON.COMM.BONUS.RATE.v1'
            },
            {
              organization_id: orgId,
              entity_id: bonusRule.id,
              field_name: 'revenue_threshold',
              field_value_number: mgmtRule.threshold,
              smart_code: 'HERA.SALON.COMM.THRESHOLD.v1'
            }
          ]);

        console.log(`✅ Created management bonus: ${mgmtRule.role} (${mgmtRule.rate}% over ${mgmtRule.threshold} AED)`);
      }
    }

    // 4. Create incentive programs
    for (const incentive of commissionStructure.incentives) {
      const { data: incentiveEntity, error: incError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'incentive_program',
          entity_code: `INCENTIVE-${incentive.name.toUpperCase().replace(/\s+/g, '-')}`,
          entity_name: incentive.name,
          smart_code: incentive.smart_code
        })
        .select()
        .single();

      if (incentiveEntity && !incError) {
        const incentiveData = [
          {
            field_name: 'incentive_name',
            field_value_text: incentive.name,
            smart_code: 'HERA.SALON.INCENTIVE.NAME.v1'
          }
        ];

        if (incentive.amount) {
          incentiveData.push({
            field_name: 'bonus_amount',
            field_value_number: incentive.amount,
            smart_code: 'HERA.SALON.INCENTIVE.AMOUNT.v1'
          });
        }

        if (incentive.rate) {
          incentiveData.push({
            field_name: 'bonus_rate',
            field_value_number: incentive.rate,
            smart_code: 'HERA.SALON.INCENTIVE.RATE.v1'
          });
        }

        if (incentive.period) {
          incentiveData.push({
            field_name: 'period',
            field_value_text: incentive.period,
            smart_code: 'HERA.SALON.INCENTIVE.PERIOD.v1'
          });
        }

        for (const data of incentiveData) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: orgId,
              entity_id: incentiveEntity.id,
              ...data
            });
        }

        console.log(`✅ Created incentive program: ${incentive.name}`);
      }
    }
  }

  // Create commission calculation examples
  console.log('\n\n📊 Commission Calculation Examples:');
  console.log('=====================================');
  console.log('\nExample 1: Senior Stylist Monthly Commission');
  console.log('- Hair services revenue: 25,000 AED');
  console.log('- Commission rate: 35%');
  console.log('- Service commission: 8,750 AED');
  console.log('- Product sales: 2,000 AED @ 10% = 200 AED');
  console.log('- New client bonus: 4 clients × 25 AED = 100 AED');
  console.log('- Total commission: 9,050 AED');
  
  console.log('\nExample 2: Branch Manager Monthly Bonus');
  console.log('- Branch revenue: 150,000 AED');
  console.log('- Exceeds threshold: 100,000 AED');
  console.log('- Bonus rate: 2%');
  console.log('- Revenue bonus: 3,000 AED');
  console.log('- Base salary: 18,000 AED');
  console.log('- Total compensation: 21,000 AED');
  
  console.log('\n\n✅ Commission structure setup complete!');
}

// Create commission tracking function
async function createCommissionTracking() {
  console.log('\n\n📈 Setting up Commission Tracking System...\n');

  // This would typically be called when processing sales transactions
  const trackingExample = {
    transaction_id: 'TXN-001',
    service_type: 'hair_color',
    service_amount: 350,
    employee_id: 'EMP-PR-002', // Jessica Martinez
    employee_role: 'SENIOR_STYLIST',
    commission_rate: 35,
    commission_amount: 122.50,
    date: '2025-01-15'
  };

  console.log('Commission Tracking Process:');
  console.log('1. When service is completed, transaction is created');
  console.log('2. System identifies employee and their role');
  console.log('3. Looks up applicable commission rate');
  console.log('4. Calculates commission amount');
  console.log('5. Creates commission entry linked to transaction');
  console.log('6. Accumulates for monthly payout');
  
  console.log('\nExample tracking entry:', trackingExample);
}

// Main execution
async function main() {
  await setupCommissionStructure();
  await createCommissionTracking();
}

main().catch(console.error);