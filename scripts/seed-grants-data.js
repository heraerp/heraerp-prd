#!/usr/bin/env node

/**
 * HERA CivicFlow Grants Seed Data Script
 * 
 * This script creates comprehensive seed data for the CivicFlow grants module
 * following HERA's Sacred Six Tables architecture with proper Smart Codes.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Demo organization ID for CivicFlow
const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Smart Code constants for grants
const SMART_CODES = {
  PROGRAM: 'HERA.CIVIC.PROG.ENT.GOV.v1',
  GRANT_ROUND: 'HERA.CIVIC.ROUND.ENT.FUNDING.v1',
  GRANT_APPLICATION: 'HERA.CIVIC.GRANT.APP.SUBMISSION.v1',
  CONSTITUENT: 'HERA.CIVIC.CONST.ENT.CITIZEN.v1',
  PARTNER_ORG: 'HERA.CIVIC.ORG.ENT.PARTNER.v1',
  PROGRAM_BUDGET: 'HERA.CIVIC.PROG.DYN.BUDGET.v1',
  APPLICATION_STATUS: 'HERA.CIVIC.GRANT.DYN.STATUS.v1',
  APPLICATION_AMOUNT: 'HERA.CIVIC.GRANT.DYN.AMOUNT.v1',
  SCORING: 'HERA.CIVIC.GRANT.DYN.SCORE.v1',
  WORKFLOW_STEP: 'HERA.CIVIC.GRANT.DYN.WORKFLOW.v1',
};

// Sample data definitions
const PROGRAMS = [
  {
    code: 'SNAP-2024',
    title: 'Supplemental Nutrition Assistance Program',
    description: 'Federal program providing food assistance to low-income families and individuals.',
    budget: 5000000,
    tags: ['SNAP', 'NUTRITION', 'FEDERAL', 'LOW_INCOME'],
    status: 'active'
  },
  {
    code: 'HOUSING-ASSIST-2024',
    title: 'Emergency Housing Assistance',
    description: 'State program providing emergency housing assistance and rental support.',
    budget: 2500000,
    tags: ['HOUSING', 'EMERGENCY', 'RENTAL', 'STATE'],
    status: 'active'
  },
  {
    code: 'YOUTH-DEV-2024',
    title: 'Youth Development Program',
    description: 'Community program focused on youth education and workforce development.',
    budget: 750000,
    tags: ['YOUTH', 'EDUCATION', 'WORKFORCE', 'COMMUNITY'],
    status: 'active'
  },
  {
    code: 'SENIOR-CARE-2024',
    title: 'Senior Care Services',
    description: 'Healthcare and social services program for senior citizens.',
    budget: 1200000,
    tags: ['SENIORS', 'HEALTHCARE', 'SOCIAL_SERVICES'],
    status: 'active'
  }
];

const GRANT_ROUNDS = [
  {
    round_code: 'SNAP-2024-Q1',
    title: 'SNAP Q1 2024 Round',
    description: 'First quarter 2024 SNAP assistance round',
    budget: 1250000,
    max_award: 50000,
    application_deadline: '2024-03-31',
    start_date: '2024-01-01',
    end_date: '2024-03-31',
    status: 'open'
  },
  {
    round_code: 'HOUSING-2024-EMERGENCY',
    title: 'Emergency Housing Round',
    description: 'Emergency housing assistance for families in crisis',
    budget: 625000,
    max_award: 25000,
    application_deadline: '2024-12-31',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    status: 'open'
  },
  {
    round_code: 'YOUTH-2024-SUMMER',
    title: 'Summer Youth Programs',
    description: 'Summer youth development and education programs',
    budget: 187500,
    max_award: 15000,
    application_deadline: '2024-05-15',
    start_date: '2024-06-01',
    end_date: '2024-08-31',
    status: 'open'
  }
];

const CONSTITUENTS = [
  {
    name: 'Maria Rodriguez',
    type: 'individual',
    contact_email: 'maria.rodriguez@email.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Springfield, IL 62701'
  },
  {
    name: 'Johnson Family',
    type: 'household',
    contact_email: 'johnson.family@email.com',
    phone: '(555) 234-5678',
    address: '456 Oak Ave, Springfield, IL 62702'
  },
  {
    name: 'Springfield Community Center',
    type: 'organization',
    contact_email: 'info@springfieldcc.org',
    phone: '(555) 345-6789',
    address: '789 Community Blvd, Springfield, IL 62703'
  },
  {
    name: 'Senior Care Network',
    type: 'nonprofit',
    contact_email: 'contact@seniorcareagency.org',
    phone: '(555) 456-7890',
    address: '321 Care Dr, Springfield, IL 62704'
  }
];

const GRANT_APPLICATIONS = [
  {
    summary: 'Family of 4 requesting emergency food assistance due to job loss',
    amount_requested: 2500,
    status: 'submitted',
    tags: ['EMERGENCY', 'FAMILY', 'FOOD_INSECURITY'],
    scoring: { need: 9, impact: 8, feasibility: 9, total: 26 },
    pending_step: { step_name: 'Initial Review', awaiting_input: false }
  },
  {
    summary: 'Single mother requesting housing assistance after eviction notice',
    amount_requested: 15000,
    status: 'in_review',
    tags: ['HOUSING', 'SINGLE_PARENT', 'EMERGENCY'],
    scoring: { need: 10, impact: 9, feasibility: 8, total: 27 },
    pending_step: { step_name: 'Financial Verification', awaiting_input: true }
  },
  {
    summary: 'Community center requesting funding for after-school youth programs',
    amount_requested: 12000,
    status: 'approved',
    amount_awarded: 10000,
    tags: ['YOUTH', 'EDUCATION', 'COMMUNITY'],
    scoring: { need: 8, impact: 9, feasibility: 10, total: 27 }
  },
  {
    summary: 'Senior care program requesting funds for meal delivery service',
    amount_requested: 8000,
    status: 'awarded',
    amount_awarded: 7500,
    tags: ['SENIORS', 'NUTRITION', 'SERVICE_DELIVERY'],
    scoring: { need: 9, impact: 8, feasibility: 9, total: 26 }
  },
  {
    summary: 'Youth development program for at-risk teenagers',
    amount_requested: 25000,
    status: 'rejected',
    tags: ['YOUTH', 'AT_RISK', 'DEVELOPMENT'],
    scoring: { need: 7, impact: 6, feasibility: 5, total: 18 },
    rejection_reason: 'Insufficient program details and community impact assessment'
  }
];

async function createEntity(entityType, entityName, entityCode, smartCode, metadata = {}) {
  const { data, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: DEMO_ORG_ID,
      entity_type: entityType,
      entity_name: entityName,
      entity_code: entityCode,
      smart_code: smartCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata
    })
    .select()
    .single();

  if (error) {
    console.error(`Error creating ${entityType} entity:`, error);
    throw error;
  }

  return data;
}

async function createDynamicField(entityId, fieldName, value, smartCode, dataType = 'text') {
  const fieldData = {
    organization_id: DEMO_ORG_ID,
    entity_id: entityId,
    field_name: fieldName,
    smart_code: smartCode,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Set the appropriate value field based on data type
  if (dataType === 'number') {
    fieldData.field_value_number = value;
  } else if (dataType === 'boolean') {
    fieldData.field_value_boolean = value;
  } else if (dataType === 'json') {
    fieldData.field_value_json = value;
  } else {
    fieldData.field_value_text = value;
  }

  const { data, error } = await supabase
    .from('core_dynamic_data')
    .insert(fieldData)
    .select()
    .single();

  if (error) {
    console.error(`Error creating dynamic field ${fieldName}:`, error);
    throw error;
  }

  return data;
}

async function createRelationship(fromEntityId, toEntityId, relationshipType, smartCode, relationshipData = {}) {
  const { data, error } = await supabase
    .from('core_relationships')
    .insert({
      organization_id: DEMO_ORG_ID,
      from_entity_id: fromEntityId,
      to_entity_id: toEntityId,
      relationship_type: relationshipType,
      relationship_direction: 'bidirectional',
      relationship_strength: 1.0,
      smart_code: smartCode,
      effective_date: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      relationship_data: relationshipData
    })
    .select()
    .single();

  if (error) {
    console.error(`Error creating relationship:`, error);
    throw error;
  }

  return data;
}

async function seedGrantsData() {
  console.log('🌱 Starting CivicFlow Grants seed data creation...');
  
  try {
    // 1. Create Programs
    console.log('📋 Creating grant programs...');
    const createdPrograms = [];
    
    for (const program of PROGRAMS) {
      const programEntity = await createEntity(
        'program',
        program.title,
        program.code,
        SMART_CODES.PROGRAM,
        { status: program.status, tags: program.tags }
      );
      
      // Add budget as dynamic field
      await createDynamicField(
        programEntity.id,
        'budget',
        program.budget,
        SMART_CODES.PROGRAM_BUDGET,
        'number'
      );
      
      // Add description as dynamic field
      await createDynamicField(
        programEntity.id,
        'description',
        program.description,
        SMART_CODES.PROGRAM,
        'text'
      );
      
      createdPrograms.push(programEntity);
      console.log(`  ✅ Created program: ${program.title}`);
    }

    // 2. Create Grant Rounds
    console.log('🎯 Creating grant rounds...');
    const createdRounds = [];
    
    for (let i = 0; i < GRANT_ROUNDS.length; i++) {
      const round = GRANT_ROUNDS[i];
      const programEntity = createdPrograms[i % createdPrograms.length]; // Distribute rounds across programs
      
      const roundEntity = await createEntity(
        'grant_round',
        round.title,
        round.round_code,
        SMART_CODES.GRANT_ROUND,
        { 
          status: round.status,
          program_id: programEntity.id,
          application_deadline: round.application_deadline,
          start_date: round.start_date,
          end_date: round.end_date
        }
      );
      
      // Add round budget and max award as dynamic fields
      await createDynamicField(roundEntity.id, 'budget', round.budget, SMART_CODES.GRANT_ROUND, 'number');
      await createDynamicField(roundEntity.id, 'max_award', round.max_award, SMART_CODES.GRANT_ROUND, 'number');
      await createDynamicField(roundEntity.id, 'description', round.description, SMART_CODES.GRANT_ROUND, 'text');
      
      // Create relationship: round belongs to program
      await createRelationship(
        roundEntity.id,
        programEntity.id,
        'belongs_to_program',
        SMART_CODES.GRANT_ROUND
      );
      
      createdRounds.push(roundEntity);
      console.log(`  ✅ Created grant round: ${round.title}`);
    }

    // 3. Create Constituents
    console.log('👥 Creating constituents...');
    const createdConstituents = [];
    
    for (const constituent of CONSTITUENTS) {
      const constituentEntity = await createEntity(
        'constituent',
        constituent.name,
        `CONST-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
        SMART_CODES.CONSTITUENT,
        { type: constituent.type }
      );
      
      // Add contact information as dynamic fields
      if (constituent.contact_email) {
        await createDynamicField(constituentEntity.id, 'email', constituent.contact_email, SMART_CODES.CONSTITUENT);
      }
      if (constituent.phone) {
        await createDynamicField(constituentEntity.id, 'phone', constituent.phone, SMART_CODES.CONSTITUENT);
      }
      if (constituent.address) {
        await createDynamicField(constituentEntity.id, 'address', constituent.address, SMART_CODES.CONSTITUENT);
      }
      
      createdConstituents.push(constituentEntity);
      console.log(`  ✅ Created constituent: ${constituent.name}`);
    }

    // 4. Create Grant Applications
    console.log('📝 Creating grant applications...');
    
    for (let i = 0; i < GRANT_APPLICATIONS.length; i++) {
      const application = GRANT_APPLICATIONS[i];
      const applicantEntity = createdConstituents[i % createdConstituents.length];
      const roundEntity = createdRounds[i % createdRounds.length];
      
      const applicationEntity = await createEntity(
        'grant_application',
        `Grant Application - ${applicantEntity.entity_name}`,
        `APP-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
        SMART_CODES.GRANT_APPLICATION,
        {
          status: application.status,
          tags: application.tags,
          applicant_type: 'constituent',
          round_id: roundEntity.id,
          applicant_id: applicantEntity.id
        }
      );
      
      // Add application details as dynamic fields
      await createDynamicField(applicationEntity.id, 'summary', application.summary, SMART_CODES.GRANT_APPLICATION);
      await createDynamicField(applicationEntity.id, 'amount_requested', application.amount_requested, SMART_CODES.APPLICATION_AMOUNT, 'number');
      await createDynamicField(applicationEntity.id, 'status', application.status, SMART_CODES.APPLICATION_STATUS);
      
      if (application.amount_awarded) {
        await createDynamicField(applicationEntity.id, 'amount_awarded', application.amount_awarded, SMART_CODES.APPLICATION_AMOUNT, 'number');
      }
      
      if (application.scoring) {
        await createDynamicField(applicationEntity.id, 'scoring', application.scoring, SMART_CODES.SCORING, 'json');
      }
      
      if (application.pending_step) {
        await createDynamicField(applicationEntity.id, 'pending_step', application.pending_step, SMART_CODES.WORKFLOW_STEP, 'json');
      }
      
      if (application.rejection_reason) {
        await createDynamicField(applicationEntity.id, 'rejection_reason', application.rejection_reason, SMART_CODES.GRANT_APPLICATION);
      }
      
      // Create relationships
      await createRelationship(
        applicationEntity.id,
        applicantEntity.id,
        'submitted_by',
        SMART_CODES.GRANT_APPLICATION
      );
      
      await createRelationship(
        applicationEntity.id,
        roundEntity.id,
        'applies_to_round',
        SMART_CODES.GRANT_APPLICATION
      );
      
      console.log(`  ✅ Created application: ${application.summary.substring(0, 50)}...`);
    }

    console.log('\n🎉 CivicFlow Grants seed data created successfully!');
    console.log('\nCreated:');
    console.log(`  📋 ${PROGRAMS.length} grant programs`);
    console.log(`  🎯 ${GRANT_ROUNDS.length} grant rounds`);
    console.log(`  👥 ${CONSTITUENTS.length} constituents`);
    console.log(`  📝 ${GRANT_APPLICATIONS.length} grant applications`);
    console.log('\n🔍 You can now view the grants data at /civicflow/grants');

  } catch (error) {
    console.error('❌ Error creating seed data:', error);
    process.exit(1);
  }
}

// Run the seed script
if (require.main === module) {
  seedGrantsData().then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
}

module.exports = { seedGrantsData };