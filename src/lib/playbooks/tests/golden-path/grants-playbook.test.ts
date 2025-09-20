import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { seedGrantsPlaybook } from '../../seeds/grants-playbook';
import { 
  PlaybookDefinition, 
  PlaybookRun, 
  PlaybookRunStep,
  StepDefinition,
  WorkerType,
  StepStatus,
  RunStatus 
} from '../../types';

// Test organization and auth setup
const TEST_ORG_ID = 'test-grants-org-' + uuidv4();
const TEST_USER_ID = 'test-user-' + uuidv4();
const PLAYBOOK_NAME = 'Federal Research Grant Application';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mock universal API for test context
const mockUniversalApi = {
  setOrganizationId: (orgId: string) => console.log(`Set organization: ${orgId}`),
  createEntity: async (data: any) => ({ data: { id: uuidv4(), ...data }, error: null }),
  createTransaction: async (data: any) => ({ data: { id: uuidv4(), ...data }, error: null }),
  setDynamicField: async (entityId: string, field: string, value: any) => ({ data: { success: true }, error: null }),
};

describe('Grants Playbook Golden Path Test', () => {
  let playbook: PlaybookDefinition;
  let playbookRun: PlaybookRun;

  beforeAll(async () => {
    // Set up test organization
    mockUniversalApi.setOrganizationId(TEST_ORG_ID);

    // Seed the Grants playbook
    const seedResult = await seedGrantsPlaybook(TEST_ORG_ID);
    expect(seedResult.success).toBe(true);
    expect(seedResult.data).toBeDefined();

    // Fetch the seeded playbook
    const { data: playbookData, error: playbookError } = await supabase
      .from('playbook_definitions')
      .select('*')
      .eq('organization_id', TEST_ORG_ID)
      .eq('name', PLAYBOOK_NAME)
      .single();

    expect(playbookError).toBeNull();
    expect(playbookData).toBeDefined();
    playbook = playbookData;

    // Verify all steps were created
    const { data: steps, error: stepsError } = await supabase
      .from('playbook_step_definitions')
      .select('*')
      .eq('playbook_definition_id', playbook.id)
      .order('sequence', { ascending: true });

    expect(stepsError).toBeNull();
    expect(steps).toHaveLength(11); // Should have all 11 steps
  });

  afterAll(async () => {
    // Cleanup test data
    if (playbook?.id) {
      await supabase.from('playbook_runs').delete().eq('playbook_definition_id', playbook.id);
      await supabase.from('playbook_step_definitions').delete().eq('playbook_definition_id', playbook.id);
      await supabase.from('playbook_definitions').delete().eq('id', playbook.id);
    }
  });

  it('should execute the complete grants application workflow successfully', async () => {
    // Create a playbook run with valid input data
    const inputData = {
      grant_type: 'research',
      funding_amount: 250000,
      project_title: 'Advanced Materials Research for Renewable Energy',
      principal_investigator: 'Dr. Jane Smith',
      institution: 'State University Research Lab',
      department: 'Materials Science',
      project_duration_months: 36,
      indirect_cost_rate: 0.45,
      has_prior_funding: true,
      compliance_certifications: ['IRB', 'IACUC', 'Export Control'],
    };

    const { data: runData, error: runError } = await supabase
      .from('playbook_runs')
      .insert({
        id: uuidv4(),
        organization_id: TEST_ORG_ID,
        playbook_definition_id: playbook.id,
        name: `Grant Application - ${inputData.project_title}`,
        status: 'pending' as RunStatus,
        input_data: inputData,
        output_data: {},
        metadata: {
          created_by: TEST_USER_ID,
          submission_deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        },
      })
      .select()
      .single();

    expect(runError).toBeNull();
    expect(runData).toBeDefined();
    playbookRun = runData;

    // Fetch all step definitions
    const { data: stepDefs } = await supabase
      .from('playbook_step_definitions')
      .select('*')
      .eq('playbook_definition_id', playbook.id)
      .order('sequence', { ascending: true });

    // Start the run
    await updateRunStatus(playbookRun.id, 'running');

    // Process each step sequentially
    for (const stepDef of stepDefs!) {
      console.log(`\nProcessing Step ${stepDef.sequence}: ${stepDef.name}`);

      // Create run step
      const runStep = await createRunStep(playbookRun.id, stepDef);

      // Process based on worker type
      switch (stepDef.worker_type) {
        case 'system':
          await processSystemStep(runStep, stepDef, inputData);
          break;
        case 'human':
          await processHumanStep(runStep, stepDef, inputData);
          break;
        case 'ai':
          await processAIStep(runStep, stepDef, inputData);
          break;
        case 'external':
          await processExternalStep(runStep, stepDef, inputData);
          break;
      }

      // Verify step completed successfully
      const completedStep = await getRunStep(runStep.id);
      expect(completedStep.status).toBe('completed');
      expect(completedStep.output_data).toBeDefined();
    }

    // Update run to completed
    await updateRunStatus(playbookRun.id, 'completed', {
      grant_id: 'GRANT-2024-' + Math.floor(Math.random() * 10000),
      submission_confirmation: 'GRANTS-GOV-' + uuidv4().substring(0, 8),
      estimated_award_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      total_budget: inputData.funding_amount * (1 + inputData.indirect_cost_rate),
    });

    // Verify final run status
    const { data: completedRun } = await supabase
      .from('playbook_runs')
      .select('*')
      .eq('id', playbookRun.id)
      .single();

    expect(completedRun.status).toBe('completed');
    expect(completedRun.output_data).toHaveProperty('grant_id');
    expect(completedRun.output_data).toHaveProperty('submission_confirmation');
    expect(completedRun.completed_at).toBeDefined();

    // Verify output contract compliance
    const outputContract = JSON.parse(playbook.output_contract || '{}');
    for (const [key, schema] of Object.entries(outputContract.properties || {})) {
      expect(completedRun.output_data).toHaveProperty(key);
    }
  });
});

// Helper functions for processing different worker types

async function createRunStep(runId: string, stepDef: StepDefinition): Promise<PlaybookRunStep> {
  const { data, error } = await supabase
    .from('playbook_run_steps')
    .insert({
      id: uuidv4(),
      run_id: runId,
      step_definition_id: stepDef.id,
      status: 'pending' as StepStatus,
      sequence: stepDef.sequence,
      started_at: new Date().toISOString(),
      input_data: {},
      output_data: {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getRunStep(stepId: string): Promise<PlaybookRunStep> {
  const { data, error } = await supabase
    .from('playbook_run_steps')
    .select('*')
    .eq('id', stepId)
    .single();

  if (error) throw error;
  return data;
}

async function updateRunStep(
  stepId: string, 
  status: StepStatus, 
  outputData?: any
): Promise<void> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  if (outputData) {
    updates.output_data = outputData;
  }

  await supabase
    .from('playbook_run_steps')
    .update(updates)
    .eq('id', stepId);
}

async function updateRunStatus(
  runId: string, 
  status: RunStatus, 
  outputData?: any
): Promise<void> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  if (outputData) {
    updates.output_data = outputData;
  }

  await supabase
    .from('playbook_runs')
    .update(updates)
    .eq('id', runId);
}

// System step processor
async function processSystemStep(
  runStep: PlaybookRunStep, 
  stepDef: StepDefinition,
  inputData: any
): Promise<void> {
  await updateRunStep(runStep.id, 'running');

  let outputData: any = {};

  switch (stepDef.key) {
    case 'check_eligibility':
      outputData = {
        is_eligible: true,
        eligibility_score: 0.95,
        requirements_met: ['institution_accredited', 'pi_qualified', 'budget_within_limits'],
        warnings: [],
      };
      break;

    case 'assess_risk':
      outputData = {
        risk_score: 0.15, // Low risk
        risk_factors: {
          financial: 0.1,
          technical: 0.2,
          compliance: 0.15,
        },
        mitigation_required: false,
      };
      break;

    case 'generate_award':
      outputData = {
        award_amount: inputData.funding_amount,
        indirect_costs: inputData.funding_amount * inputData.indirect_cost_rate,
        total_award: inputData.funding_amount * (1 + inputData.indirect_cost_rate),
        payment_schedule: [
          { period: 'Year 1', amount: inputData.funding_amount * 0.4 },
          { period: 'Year 2', amount: inputData.funding_amount * 0.35 },
          { period: 'Year 3', amount: inputData.funding_amount * 0.25 },
        ],
      };
      break;
  }

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  await updateRunStep(runStep.id, 'completed', outputData);
}

// Human step processor
async function processHumanStep(
  runStep: PlaybookRunStep, 
  stepDef: StepDefinition,
  inputData: any
): Promise<void> {
  await updateRunStep(runStep.id, 'running');

  let outputData: any = {};

  switch (stepDef.key) {
    case 'collect_documents':
      outputData = {
        documents_collected: [
          { type: 'budget_justification', status: 'complete', file_id: uuidv4() },
          { type: 'project_narrative', status: 'complete', file_id: uuidv4() },
          { type: 'cv_biosketch', status: 'complete', file_id: uuidv4() },
          { type: 'support_letters', status: 'complete', file_id: uuidv4() },
        ],
        collection_complete: true,
      };
      break;

    case 'review_compliance':
      outputData = {
        compliance_status: 'approved',
        certifications_verified: inputData.compliance_certifications,
        reviewer: 'compliance-officer-' + uuidv4().substring(0, 8),
        review_notes: 'All compliance requirements satisfied',
      };
      break;

    case 'scientific_review':
      outputData = {
        review_score: 1.8, // Excellent (1-5 scale, 1 best)
        merit_rating: 'exceptional',
        strengths: ['innovative approach', 'strong preliminary data', 'excellent team'],
        weaknesses: ['minor budget concerns addressed'],
      };
      break;

    case 'budget_review':
      outputData = {
        budget_approved: true,
        total_direct_costs: inputData.funding_amount,
        total_indirect_costs: inputData.funding_amount * inputData.indirect_cost_rate,
        cost_share_required: false,
        reviewer_comments: 'Budget justified and reasonable',
      };
      break;

    case 'final_approval':
      outputData = {
        approval_status: 'approved',
        approval_date: new Date().toISOString(),
        approver_id: 'grants-director-' + uuidv4().substring(0, 8),
        conditions: [],
      };
      break;
  }

  // Simulate human processing time
  await new Promise(resolve => setTimeout(resolve, 200));

  await updateRunStep(runStep.id, 'completed', outputData);
}

// AI step processor
async function processAIStep(
  runStep: PlaybookRunStep, 
  stepDef: StepDefinition,
  inputData: any
): Promise<void> {
  await updateRunStep(runStep.id, 'running');

  let outputData: any = {};

  if (stepDef.key === 'validate_documents') {
    outputData = {
      validation_status: 'passed',
      completeness_score: 0.98,
      quality_score: 0.95,
      issues_found: [],
      ai_confidence: 0.97,
      validation_details: {
        budget_justification: { status: 'valid', score: 0.99 },
        project_narrative: { status: 'valid', score: 0.96 },
        cv_biosketch: { status: 'valid', score: 0.97 },
        support_letters: { status: 'valid', score: 0.95 },
      },
    };
  }

  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 150));

  await updateRunStep(runStep.id, 'completed', outputData);
}

// External step processor
async function processExternalStep(
  runStep: PlaybookRunStep, 
  stepDef: StepDefinition,
  inputData: any
): Promise<void> {
  await updateRunStep(runStep.id, 'running');

  let outputData: any = {};

  if (stepDef.key === 'submit_to_grants_gov') {
    outputData = {
      submission_status: 'success',
      grants_gov_tracking_id: 'GRANTS-' + Date.now(),
      submission_timestamp: new Date().toISOString(),
      confirmation_number: 'CONF-' + uuidv4().substring(0, 12).toUpperCase(),
      next_steps: [
        'Application received by Grants.gov',
        'Validation in progress',
        'Agency review pending',
      ],
    };
  }

  // Simulate external API call time
  await new Promise(resolve => setTimeout(resolve, 300));

  await updateRunStep(runStep.id, 'completed', outputData);
}