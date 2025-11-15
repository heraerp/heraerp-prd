#!/usr/bin/env node

/**
 * HERA Chart of Accounts Assignment System
 * Creates relationship-based COA template assignment system for organizations
 * Assigns Universal + Industry + Country COA templates via core_relationships
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000';
const PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001';

// COA Template Configuration
const COA_TEMPLATES = {
  // Universal base template (required for all)
  universal: {
    smart_code: 'HERA.PLATFORM.FINANCE.GL.TEMPLATE.UNIVERSAL.v1',
    description: 'Universal Chart of Accounts - Base template for all industries',
    mandatory: true
  },

  // Industry-specific templates
  industry: {
    salon: {
      smart_code: 'HERA.SALON.FINANCE.GL.TEMPLATE.INDUSTRY.v1',
      description: 'Salon & Beauty Industry COA Template',
      features: ['stylist_commissions', 'beauty_products', 'treatment_packages', 'tips_management']
    },
    restaurant: {
      smart_code: 'HERA.RESTAURANT.FINANCE.GL.TEMPLATE.INDUSTRY.v1', 
      description: 'Restaurant & Food Service COA Template',
      features: ['food_inventory', 'kitchen_equipment', 'server_tips', 'delivery_platforms']
    },
    telecom: {
      smart_code: 'HERA.TELECOM.FINANCE.GL.TEMPLATE.INDUSTRY.v1',
      description: 'Telecommunications & ISP COA Template', 
      features: ['network_infrastructure', 'subscription_revenue', 'agent_commissions', 'spectrum_licenses']
    },
    manufacturing: {
      smart_code: 'HERA.MANUFACTURING.FINANCE.GL.TEMPLATE.INDUSTRY.v1',
      description: 'Manufacturing Industry COA Template',
      features: ['production_equipment', 'manufacturing_overhead', 'quality_assurance', 'contract_manufacturing']
    },
    retail: {
      smart_code: 'HERA.RETAIL.FINANCE.GL.TEMPLATE.INDUSTRY.v1',
      description: 'Retail Industry COA Template',
      features: ['merchandise_inventory', 'store_fixtures', 'online_sales', 'visual_merchandising']
    }
  },

  // Country-specific templates
  country: {
    uae: {
      smart_code: 'HERA.UAE.FINANCE.GL.TEMPLATE.COUNTRY.v1',
      description: 'UAE Tax Compliance COA Template (VAT 5%)',
      features: ['vat_compliance', 'fta_integration', 'excise_tax', 'aed_currency']
    },
    india: {
      smart_code: 'HERA.INDIA.FINANCE.GL.TEMPLATE.COUNTRY.v1',
      description: 'India Tax Compliance COA Template (GST)',
      features: ['gst_compliance', 'tds_management', 'roc_compliance', 'inr_currency']
    },
    usa: {
      smart_code: 'HERA.USA.FINANCE.GL.TEMPLATE.COUNTRY.v1',
      description: 'USA Tax Compliance COA Template',
      features: ['federal_tax', 'state_tax', 'sales_tax', 'payroll_tax']
    },
    uk: {
      smart_code: 'HERA.UK.FINANCE.GL.TEMPLATE.COUNTRY.v1',
      description: 'UK Tax Compliance COA Template (VAT 20%)',
      features: ['vat_compliance', 'corporation_tax', 'paye_integration', 'gbp_currency']
    },
    generic: {
      smart_code: 'HERA.GENERIC.FINANCE.GL.TEMPLATE.COUNTRY.v1',
      description: 'Generic International Tax Compliance COA Template',
      features: ['basic_tax_compliance', 'multi_currency', 'international_banking']
    }
  }
};

async function createCOATemplateEntities() {
  console.log('\n📚 Creating COA Template Entities');
  console.log('='.repeat(40));

  const templateEntities = [];
  let successCount = 0;
  let errorCount = 0;

  // Create Universal Template Entity
  try {
    const { data: universalEntity, error: universalError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: PLATFORM_ORG_ID,
        entity_type: 'coa_template',
        entity_code: 'COA_UNIVERSAL',
        entity_name: 'Universal Chart of Accounts Template',
        smart_code: COA_TEMPLATES.universal.smart_code,
        created_by: PLATFORM_USER_ID,
        updated_by: PLATFORM_USER_ID,
        status: 'active',
        metadata: {
          template_type: 'universal',
          mandatory: true,
          description: COA_TEMPLATES.universal.description,
          version: '1.0'
        }
      })
      .select()
      .single();

    if (universalError) throw universalError;

    templateEntities.push({ type: 'universal', name: 'universal', entity: universalEntity });
    console.log('✅ Universal Template Entity');
    successCount++;
  } catch (error) {
    console.error('❌ Universal Template Entity:', error.message);
    errorCount++;
  }

  // Create Industry Template Entities
  for (const [industryKey, industryTemplate] of Object.entries(COA_TEMPLATES.industry)) {
    try {
      const { data: industryEntity, error: industryError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: PLATFORM_ORG_ID,
          entity_type: 'coa_template',
          entity_code: `COA_INDUSTRY_${industryKey.toUpperCase()}`,
          entity_name: industryTemplate.description,
          smart_code: industryTemplate.smart_code,
          created_by: PLATFORM_USER_ID,
          updated_by: PLATFORM_USER_ID,
          status: 'active',
          metadata: {
            template_type: 'industry',
            industry: industryKey,
            features: industryTemplate.features,
            description: industryTemplate.description,
            version: '1.0'
          }
        })
        .select()
        .single();

      if (industryError) throw industryError;

      templateEntities.push({ type: 'industry', name: industryKey, entity: industryEntity });
      console.log(`✅ Industry Template: ${industryKey}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Industry Template ${industryKey}:`, error.message);
      errorCount++;
    }
  }

  // Create Country Template Entities
  for (const [countryKey, countryTemplate] of Object.entries(COA_TEMPLATES.country)) {
    try {
      const { data: countryEntity, error: countryError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: PLATFORM_ORG_ID,
          entity_type: 'coa_template',
          entity_code: `COA_COUNTRY_${countryKey.toUpperCase()}`,
          entity_name: countryTemplate.description,
          smart_code: countryTemplate.smart_code,
          created_by: PLATFORM_USER_ID,
          updated_by: PLATFORM_USER_ID,
          status: 'active',
          metadata: {
            template_type: 'country',
            country: countryKey,
            features: countryTemplate.features,
            description: countryTemplate.description,
            version: '1.0'
          }
        })
        .select()
        .single();

      if (countryError) throw countryError;

      templateEntities.push({ type: 'country', name: countryKey, entity: countryEntity });
      console.log(`✅ Country Template: ${countryKey}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Country Template ${countryKey}:`, error.message);
      errorCount++;
    }
  }

  console.log(`📊 Template Entities: ${successCount}/${successCount + errorCount} created\n`);
  return templateEntities;
}

async function assignCOATemplate(organizationId, templateType, templateName, options = {}) {
  console.log(`🔗 Assigning ${templateType} template '${templateName}' to organization ${organizationId}`);

  try {
    // Find the template entity
    const { data: templateEntity, error: templateError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', PLATFORM_ORG_ID)
      .eq('entity_type', 'coa_template')
      .eq('entity_code', `COA_${templateType.toUpperCase()}_${templateName.toUpperCase()}`)
      .single();

    if (templateError) {
      // Try universal template
      if (templateType === 'universal') {
        const { data: universalEntity, error: universalError } = await supabase
          .from('core_entities')
          .select('*')
          .eq('organization_id', PLATFORM_ORG_ID)
          .eq('entity_type', 'coa_template')
          .eq('entity_code', 'COA_UNIVERSAL')
          .single();

        if (universalError) throw universalError;
        templateEntity = universalEntity;
      } else {
        throw templateError;
      }
    }

    // Find the target organization entity
    const { data: orgEntity, error: orgError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError) throw orgError;

    // Create assignment relationship
    const { data: relationship, error: relationshipError } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: organizationId, // Store in target org for easier querying
        from_entity_id: organizationId,  // Organization
        to_entity_id: templateEntity.id, // COA Template
        relationship_type: 'USES_COA_TEMPLATE',
        effective_date: new Date().toISOString().split('T')[0],
        created_by: options.actorUserId || PLATFORM_USER_ID,
        updated_by: options.actorUserId || PLATFORM_USER_ID,
        relationship_data: {
          template_type: templateType,
          template_name: templateName,
          assignment_date: new Date().toISOString(),
          assignment_reason: options.reason || `${templateType} template assignment`,
          auto_assigned: options.autoAssigned || false,
          features_enabled: templateEntity.metadata?.features || []
        }
      })
      .select()
      .single();

    if (relationshipError) throw relationshipError;

    console.log(`✅ Assigned ${templateType} template '${templateName}' to organization`);
    return relationship;

  } catch (error) {
    console.error(`❌ Failed to assign ${templateType} template '${templateName}':`, error.message);
    throw error;
  }
}

async function assignCompleteCOA(organizationId, industry, country, options = {}) {
  console.log(`\n🚀 Assigning Complete COA Package to Organization: ${organizationId}`);
  console.log('='.repeat(60));
  console.log(`Industry: ${industry}, Country: ${country}`);

  const assignments = [];

  try {
    // 1. Assign Universal Template (Mandatory)
    const universalAssignment = await assignCOATemplate(
      organizationId, 
      'universal', 
      'universal', 
      { ...options, reason: 'Mandatory universal base template' }
    );
    assignments.push(universalAssignment);

    // 2. Assign Industry Template
    if (industry && COA_TEMPLATES.industry[industry]) {
      const industryAssignment = await assignCOATemplate(
        organizationId,
        'industry',
        industry,
        { ...options, reason: `Industry-specific template for ${industry} business` }
      );
      assignments.push(industryAssignment);
    }

    // 3. Assign Country Template  
    if (country && COA_TEMPLATES.country[country]) {
      const countryAssignment = await assignCOATemplate(
        organizationId,
        'country', 
        country,
        { ...options, reason: `Country-specific compliance template for ${country}` }
      );
      assignments.push(countryAssignment);
    }

    console.log(`\n✅ Complete COA Package Assigned Successfully!`);
    console.log(`📊 Total Templates Assigned: ${assignments.length}`);
    
    return assignments;

  } catch (error) {
    console.error(`❌ Failed to assign complete COA package:`, error.message);
    throw error;
  }
}

async function getCOAAssignments(organizationId) {
  console.log(`\n📋 Retrieving COA Assignments for Organization: ${organizationId}`);
  
  try {
    const { data: assignments, error } = await supabase
      .from('core_relationships')
      .select(`
        *,
        template:to_entity_id(
          id,
          entity_code,
          entity_name,
          smart_code,
          metadata
        )
      `)
      .eq('from_entity_id', organizationId)
      .eq('relationship_type', 'USES_COA_TEMPLATE')
      .is('expiration_date', null);

    if (error) throw error;

    console.log(`📊 Found ${assignments.length} COA template assignments:`);
    
    assignments.forEach(assignment => {
      const templateData = assignment.relationship_data;
      console.log(`   • ${templateData.template_type}: ${templateData.template_name}`);
    });

    return assignments;

  } catch (error) {
    console.error(`❌ Failed to retrieve COA assignments:`, error.message);
    throw error;
  }
}

async function copyCOAFromTemplates(organizationId, actorUserId) {
  console.log(`\n📋 Copying COA from Assigned Templates to Organization: ${organizationId}`);
  console.log('='.repeat(60));

  try {
    // Get all COA template assignments for this organization
    const assignments = await getCOAAssignments(organizationId);
    
    if (assignments.length === 0) {
      throw new Error('No COA templates assigned to this organization. Assign templates first.');
    }

    let totalAccountsCopied = 0;
    const copiedAccounts = [];

    for (const assignment of assignments) {
      const templateData = assignment.relationship_data;
      console.log(`\n📚 Processing ${templateData.template_type} template: ${templateData.template_name}`);

      // Query pattern based on smart_code structure
      let smartCodePattern;
      switch (templateData.template_type) {
        case 'universal':
          smartCodePattern = 'HERA.PLATFORM.FINANCE.GL.%';
          break;
        case 'industry':
          smartCodePattern = `HERA.${templateData.template_name.toUpperCase()}.FINANCE.GL.%`;
          break;
        case 'country':
          smartCodePattern = `HERA.${templateData.template_name.toUpperCase()}.FINANCE.GL.%`;
          break;
        default:
          continue;
      }

      // Get template accounts from platform organization
      const { data: templateAccounts, error: templateError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('entity_type', 'gl_account')
        .like('smart_code', smartCodePattern);

      if (templateError) {
        console.error(`❌ Error fetching template accounts:`, templateError.message);
        continue;
      }

      console.log(`   Found ${templateAccounts.length} accounts in template`);

      // Copy each account to the target organization
      for (const templateAccount of templateAccounts) {
        try {
          // Check if account already exists in target organization
          const { data: existingAccount, error: existingError } = await supabase
            .from('core_entities')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('entity_type', 'gl_account')
            .eq('entity_code', templateAccount.entity_code)
            .single();

          if (existingAccount) {
            console.log(`   ⚠️  Account ${templateAccount.entity_code} already exists, skipping`);
            continue;
          }

          // Copy the account to target organization
          const { data: newAccount, error: newAccountError } = await supabase
            .from('core_entities')
            .insert({
              organization_id: organizationId, // Target organization
              entity_type: 'gl_account',
              entity_code: templateAccount.entity_code,
              entity_name: templateAccount.entity_name,
              smart_code: templateAccount.smart_code,
              created_by: actorUserId,
              updated_by: actorUserId,
              status: 'active',
              metadata: {
                ...templateAccount.metadata,
                copied_from_template: {
                  template_type: templateData.template_type,
                  template_name: templateData.template_name,
                  source_entity_id: templateAccount.id,
                  copied_date: new Date().toISOString()
                }
              }
            })
            .select()
            .single();

          if (newAccountError) throw newAccountError;

          // Copy dynamic data fields
          const { data: templateDynamicData, error: dynamicError } = await supabase
            .from('core_dynamic_data')
            .select('*')
            .eq('organization_id', PLATFORM_ORG_ID)
            .eq('entity_id', templateAccount.id);

          if (dynamicError) {
            console.warn(`   ⚠️  Warning: Could not fetch dynamic data for ${templateAccount.entity_code}`);
          } else {
            for (const dynamicField of templateDynamicData) {
              await supabase
                .from('core_dynamic_data')
                .insert({
                  organization_id: organizationId,
                  entity_id: newAccount.id,
                  field_name: dynamicField.field_name,
                  field_type: dynamicField.field_type,
                  field_value_text: dynamicField.field_value_text,
                  field_value_number: dynamicField.field_value_number,
                  field_value_boolean: dynamicField.field_value_boolean,
                  field_value_json: dynamicField.field_value_json,
                  smart_code: dynamicField.smart_code,
                  created_by: actorUserId,
                  updated_by: actorUserId
                });
            }
          }

          copiedAccounts.push({
            code: newAccount.entity_code,
            name: newAccount.entity_name,
            template: templateData.template_name
          });

          totalAccountsCopied++;

        } catch (error) {
          console.error(`   ❌ Error copying account ${templateAccount.entity_code}:`, error.message);
        }
      }
    }

    console.log(`\n✅ COA Copy Complete!`);
    console.log(`📊 Total Accounts Copied: ${totalAccountsCopied}`);
    console.log(`📚 Templates Processed: ${assignments.length}`);

    return {
      totalAccountsCopied,
      copiedAccounts,
      templatesProcessed: assignments.length
    };

  } catch (error) {
    console.error(`❌ Failed to copy COA from templates:`, error.message);
    throw error;
  }
}

async function demonstrateAssignmentSystem() {
  console.log('🚀 HERA COA Assignment System Demonstration');
  console.log('='.repeat(50));

  try {
    // Step 1: Create template entities
    console.log('\n📚 Step 1: Creating COA Template Entities...');
    const templateEntities = await createCOATemplateEntities();

    // Step 2: Demo organization assignment
    console.log('\n🏢 Step 2: Demo Organization Assignment...');
    const demoOrgId = '550e8400-e29b-41d4-a716-446655440000'; // Example org
    
    // Assign complete COA package (Universal + Salon + UAE)
    const assignments = await assignCompleteCOA(demoOrgId, 'salon', 'uae', {
      actorUserId: PLATFORM_USER_ID,
      autoAssigned: true,
      reason: 'Demo assignment for UAE salon business'
    });

    // Step 3: Retrieve assignments
    console.log('\n📋 Step 3: Retrieving Assignments...');
    const retrievedAssignments = await getCOAAssignments(demoOrgId);

    // Step 4: Copy COA (commented out to avoid actual copying in demo)
    // console.log('\n📋 Step 4: Copying COA from Templates...');
    // const copyResult = await copyCOAFromTemplates(demoOrgId, PLATFORM_USER_ID);

    console.log('\n🎉 Assignment System Demonstration Complete!');

    return {
      templateEntities: templateEntities.length,
      assignments: assignments.length,
      retrievedAssignments: retrievedAssignments.length
    };

  } catch (error) {
    console.error('\n❌ Demonstration failed:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  demonstrateAssignmentSystem()
    .then(results => {
      console.log('\n✨ COA Assignment System Ready!');
      console.log('\n🔧 Available Functions:');
      console.log('   • createCOATemplateEntities() - Create template entities');
      console.log('   • assignCompleteCOA(orgId, industry, country) - Assign COA package');
      console.log('   • getCOAAssignments(orgId) - Retrieve assignments');
      console.log('   • copyCOAFromTemplates(orgId, actorId) - Copy COA to organization');
      
      console.log('\n📖 Usage Examples:');
      console.log('   • Salon in UAE: assignCompleteCOA(orgId, "salon", "uae")');
      console.log('   • Restaurant in India: assignCompleteCOA(orgId, "restaurant", "india")');
      console.log('   • Manufacturing in USA: assignCompleteCOA(orgId, "manufacturing", "usa")');
      
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { 
  createCOATemplateEntities,
  assignCOATemplate,
  assignCompleteCOA,
  getCOAAssignments,
  copyCOAFromTemplates,
  COA_TEMPLATES
};