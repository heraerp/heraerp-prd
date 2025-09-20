/**
 * HERA Playbooks Steps Management API
 * 
 * Implements POST /playbooks/{id}/steps for adding step definitions with versioning,
 * enforces state machine rules (only draft versions are mutable), and manages
 * step relationships and ordering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { playbookDataLayer } from '@/lib/playbooks/data/playbook-data-layer';
import { playbookAuthService } from '@/lib/playbooks/auth/playbook-auth';
import { PlaybookSmartCodes } from '@/lib/playbooks/smart-codes/playbook-smart-codes';
import { universalApi } from '@/lib/universal-api';

interface AddStepRequest {
  name: string;
  description: string;
  step_number: number;
  step_type: 'human' | 'system' | 'ai' | 'external';
  worker_type: string;
  estimated_duration_minutes: number;
  required_roles: string[];
  business_rules?: string[];
  error_handling?: string;
  dependencies?: StepDependency[];
  input_contract?: Record<string, any>;
  output_contract?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface StepDependency {
  depends_on_step_number: number;
  dependency_type: 'sequential' | 'conditional' | 'data';
  condition?: Record<string, any>;
}

interface AddStepsRequest {
  steps: AddStepRequest[];
  insert_mode?: 'append' | 'insert' | 'replace';
  insert_after_step?: number;
  reorder_existing?: boolean;
  create_new_version?: boolean;
}

/**
 * POST /api/v1/playbooks/{id}/steps - Add step definitions to playbook
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authState = playbookAuthService.getState();
    if (!authState.isAuthenticated || !authState.organization) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // Check permissions
    if (!playbookAuthService.canManagePlaybooks()) {
      return NextResponse.json({
        error: 'Insufficient permissions to modify playbooks',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // Set organization context
    const organizationId = authState.organization.id;
    playbookDataLayer.setOrganizationContext(organizationId);
    universalApi.setOrganizationId(organizationId);

    const playbookId = params.id;
    const body: AddStepsRequest = await request.json();

    // Validate request
    if (!body.steps || body.steps.length === 0) {
      return NextResponse.json({
        error: 'At least one step is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Get existing playbook
    const playbook = await playbookDataLayer.getPlaybookDefinition(playbookId);
    if (!playbook) {
      return NextResponse.json({
        error: 'Playbook not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // STATE MACHINE ENFORCEMENT: Check if playbook is mutable
    const mutabilityCheck = await checkPlaybookMutability(playbook);
    if (!mutabilityCheck.is_mutable) {
      if (body.create_new_version) {
        // Create new draft version
        const newVersion = await createNewPlaybookVersion(playbook, authState.user?.id);
        return await addStepsToPlaybook(newVersion, body, authState.user?.id);
      } else {
        return NextResponse.json({
          error: mutabilityCheck.reason,
          code: 'PLAYBOOK_IMMUTABLE',
          current_status: playbook.status,
          suggestion: 'Set create_new_version=true to create a new draft version',
          available_actions: ['create_new_version', 'view_published_version']
        }, { status: 423 }); // 423 Locked
      }
    }

    // Playbook is mutable (draft), proceed with adding steps
    return await addStepsToPlaybook(playbook, body, authState.user?.id);

  } catch (error) {
    console.error('Add steps error:', error);
    
    return NextResponse.json({
      error: 'Failed to add steps to playbook',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/v1/playbooks/{id}/steps - Get playbook steps with ordering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authState = playbookAuthService.getState();
    if (!authState.isAuthenticated || !authState.organization) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // Set organization context
    const organizationId = authState.organization.id;
    playbookDataLayer.setOrganizationContext(organizationId);

    const playbookId = params.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeContracts = searchParams.get('include_contracts') === 'true';
    const includeRelationships = searchParams.get('include_relationships') === 'true';
    const includeValidation = searchParams.get('include_validation') === 'true';

    // Get playbook
    const playbook = await playbookDataLayer.getPlaybookDefinition(playbookId);
    if (!playbook) {
      return NextResponse.json({
        error: 'Playbook not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // Check permissions
    if (!playbookAuthService.canExecutePlaybook(playbookId) && 
        !playbookAuthService.canManagePlaybooks()) {
      return NextResponse.json({
        error: 'Insufficient permissions to view this playbook',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // Get steps with relationships
    const steps = await playbookDataLayer.getPlaybookSteps(playbookId);
    
    // Sort by step number
    const sortedSteps = steps.sort((a, b) => 
      a.metadata.step_number - b.metadata.step_number
    );

    // Enrich steps with additional data
    const enrichedSteps = [];
    
    for (const step of sortedSteps) {
      const enriched: any = { ...step };

      // Include contracts if requested
      if (includeContracts) {
        enriched.input_contract = await playbookDataLayer.getContract(step.id, 'step_input_contract');
        enriched.output_contract = await playbookDataLayer.getContract(step.id, 'step_output_contract');
      }

      // Include relationships if requested
      if (includeRelationships) {
        enriched.dependencies = await getStepDependencies(step.id);
        enriched.dependents = await getStepDependents(step.id);
      }

      // Include validation if requested
      if (includeValidation) {
        enriched.validation_results = await validateStepDefinition(step, playbook);
      }

      enrichedSteps.push(enriched);
    }

    // Calculate step flow analysis
    const flowAnalysis = analyzeStepFlow(enrichedSteps);

    return NextResponse.json({
      success: true,
      data: {
        playbook_id: playbookId,
        playbook_name: playbook.name,
        playbook_status: playbook.status,
        is_mutable: (await checkPlaybookMutability(playbook)).is_mutable,
        total_steps: enrichedSteps.length,
        steps: enrichedSteps,
        flow_analysis: flowAnalysis
      },
      metadata: {
        organization_id: organizationId,
        includes_applied: {
          contracts: includeContracts,
          relationships: includeRelationships,
          validation: includeValidation
        },
        query_time_ms: Date.now() - (parseInt(request.headers.get('x-request-start') || '0') || Date.now())
      }
    });

  } catch (error) {
    console.error('Get steps error:', error);
    
    return NextResponse.json({
      error: 'Failed to get playbook steps',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions

/**
 * STATE MACHINE: Check if playbook can be modified
 */
async function checkPlaybookMutability(playbook: any): Promise<{
  is_mutable: boolean;
  reason?: string;
  allowed_operations: string[];
}> {
  // STATE MACHINE RULES:
  // - draft: fully mutable
  // - active: immutable (published and locked)
  // - deprecated: immutable  
  // - deleted: immutable

  switch (playbook.status) {
    case 'draft':
      return {
        is_mutable: true,
        allowed_operations: [
          'add_steps', 'remove_steps', 'reorder_steps',
          'update_metadata', 'add_contracts', 'update_contracts',
          'publish', 'delete'
        ]
      };

    case 'active':
      return {
        is_mutable: false,
        reason: 'Published playbooks are immutable. Create a new version to make changes.',
        allowed_operations: [
          'view', 'execute', 'create_new_version', 'deprecate'
        ]
      };

    case 'deprecated':
      return {
        is_mutable: false,
        reason: 'Deprecated playbooks are immutable. Create a new version to make changes.',
        allowed_operations: [
          'view', 'create_new_version', 'reactivate'
        ]
      };

    case 'deleted':
      return {
        is_mutable: false,
        reason: 'Deleted playbooks cannot be modified.',
        allowed_operations: ['view', 'restore']
      };

    default:
      return {
        is_mutable: false,
        reason: 'Unknown playbook status',
        allowed_operations: ['view']
      };
  }
}

/**
 * Create new version of playbook for modifications
 */
async function createNewPlaybookVersion(
  originalPlaybook: any,
  userId?: string
): Promise<any> {
  // Parse current version and increment
  const currentVersion = originalPlaybook.version;
  const versionParts = currentVersion.split('.').map(Number);
  versionParts[1] = (versionParts[1] || 0) + 1; // Increment minor version
  const newVersion = versionParts.join('.');

  // Generate new smart code with updated version
  const newSmartCode = PlaybookSmartCodes.forPlaybookDefinition(
    originalPlaybook.metadata.industry,
    originalPlaybook.name.toUpperCase().replace(/\s+/g, '_'),
    newVersion
  );

  // Create new playbook version
  const newPlaybook = await playbookDataLayer.createPlaybookDefinition({
    name: originalPlaybook.name,
    description: originalPlaybook.description,
    smart_code: newSmartCode,
    status: 'draft', // New versions always start as draft
    version: newVersion,
    ai_confidence: originalPlaybook.ai_confidence,
    ai_insights: `New version created from ${originalPlaybook.version}`,
    metadata: {
      ...originalPlaybook.metadata,
      created_from_version: originalPlaybook.version,
      created_from_id: originalPlaybook.id,
      version_history: [
        ...(originalPlaybook.metadata.version_history || []),
        {
          version: originalPlaybook.version,
          id: originalPlaybook.id,
          created_at: originalPlaybook.created_at
        }
      ],
      created_by: userId || 'system',
      last_modified: new Date().toISOString()
    }
  });

  // Copy existing steps to new version
  const existingSteps = await playbookDataLayer.getPlaybookSteps(originalPlaybook.id);
  
  for (const step of existingSteps) {
    const newStepSmartCode = PlaybookSmartCodes.forStepDefinition(
      originalPlaybook.metadata.industry,
      step.name.toUpperCase().replace(/\s+/g, '_'),
      newVersion
    );

    const newStep = await playbookDataLayer.createStepDefinition({
      name: step.name,
      smart_code: newStepSmartCode,
      status: 'active',
      version: newVersion,
      ai_confidence: step.ai_confidence,
      ai_insights: step.ai_insights,
      metadata: {
        ...step.metadata,
        copied_from_step: step.id,
        copied_from_version: originalPlaybook.version
      }
    });

    // Create relationship between new playbook and new step
    await playbookDataLayer.createRelationship({
      from_entity_id: newPlaybook.id,
      to_entity_id: newStep.id,
      smart_code: PlaybookSmartCodes.forRelationship('CONTAINS.STEP'),
      metadata: {
        step_sequence: step.metadata.step_number,
        is_required: true,
        can_be_skipped: false,
        copied_from_relationship: true
      }
    });
  }

  // Copy contracts and policies
  const contracts = await getPlaybookContracts(originalPlaybook.id);
  for (const contract of contracts) {
    await playbookDataLayer.saveContract({
      entity_id: newPlaybook.id,
      code: contract.code,
      value_json: contract.value_json,
      data_type: contract.data_type,
      validation_rule: contract.validation_rule
    });
  }

  return newPlaybook;
}

/**
 * Add steps to a playbook (must be mutable)
 */
async function addStepsToPlaybook(
  playbook: any,
  request: AddStepsRequest,
  userId?: string
): Promise<NextResponse> {
  const createdSteps = [];
  const createdRelationships = [];
  const errors = [];

  // Get existing steps for numbering and validation
  const existingSteps = await playbookDataLayer.getPlaybookSteps(playbook.id);
  const existingStepNumbers = existingSteps.map(s => s.metadata.step_number);

  // Validate step numbers for conflicts
  for (const stepRequest of request.steps) {
    if (existingStepNumbers.includes(stepRequest.step_number) && 
        request.insert_mode !== 'replace') {
      errors.push(`Step number ${stepRequest.step_number} already exists`);
    }

    // Validate required fields
    if (!stepRequest.name || !stepRequest.step_type || !stepRequest.worker_type) {
      errors.push(`Step ${stepRequest.step_number}: name, step_type, and worker_type are required`);
    }

    // Validate step dependencies
    if (stepRequest.dependencies) {
      for (const dep of stepRequest.dependencies) {
        if (!existingStepNumbers.includes(dep.depends_on_step_number) &&
            !request.steps.some(s => s.step_number === dep.depends_on_step_number)) {
          errors.push(`Step ${stepRequest.step_number}: dependency on non-existent step ${dep.depends_on_step_number}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors
    }, { status: 400 });
  }

  // Handle step reordering if needed
  if (request.reorder_existing && request.insert_mode === 'insert') {
    await reorderExistingSteps(playbook.id, request.insert_after_step || 0, request.steps.length);
  }

  // Create new steps
  for (const stepRequest of request.steps) {
    try {
      const stepSmartCode = PlaybookSmartCodes.forStepDefinition(
        playbook.metadata.industry,
        stepRequest.name.toUpperCase().replace(/\s+/g, '_'),
        playbook.version
      );

      const step = await playbookDataLayer.createStepDefinition({
        name: stepRequest.name,
        smart_code: stepSmartCode,
        status: 'active',
        version: playbook.version,
        ai_confidence: 0.90,
        ai_insights: `Step definition for ${stepRequest.step_type} worker`,
        metadata: {
          step_number: stepRequest.step_number,
          step_type: stepRequest.step_type,
          worker_type: stepRequest.worker_type,
          estimated_duration_minutes: stepRequest.estimated_duration_minutes,
          required_roles: stepRequest.required_roles,
          description: stepRequest.description,
          business_rules: stepRequest.business_rules || [],
          error_handling: stepRequest.error_handling || 'retry_with_validation',
          next_steps: [], // Will be calculated based on dependencies
          added_by: userId || 'system',
          added_at: new Date().toISOString(),
          ...stepRequest.metadata
        }
      });

      createdSteps.push(step);

      // Create relationship between playbook and step
      const playbookStepRelationship = await playbookDataLayer.createRelationship({
        from_entity_id: playbook.id,
        to_entity_id: step.id,
        smart_code: PlaybookSmartCodes.forRelationship('CONTAINS.STEP'),
        metadata: {
          step_sequence: stepRequest.step_number,
          is_required: true,
          can_be_skipped: false,
          parallel_group: null
        }
      });

      createdRelationships.push(playbookStepRelationship);

      // Create step contracts if provided
      if (stepRequest.input_contract) {
        await playbookDataLayer.saveContract({
          entity_id: step.id,
          code: 'step_input_contract',
          value_json: {
            $schema: "https://json-schema.org/draft/2020-12/schema",
            title: `${stepRequest.name} Input Contract`,
            ...stepRequest.input_contract
          },
          data_type: 'json_schema',
          validation_rule: PlaybookSmartCodes.forContract('step_input', playbook.version)
        });
      }

      if (stepRequest.output_contract) {
        await playbookDataLayer.saveContract({
          entity_id: step.id,
          code: 'step_output_contract',
          value_json: {
            $schema: "https://json-schema.org/draft/2020-12/schema",
            title: `${stepRequest.name} Output Contract`,
            ...stepRequest.output_contract
          },
          data_type: 'json_schema',
          validation_rule: PlaybookSmartCodes.forContract('step_output', playbook.version)
        });
      }

      // Create step dependencies
      if (stepRequest.dependencies) {
        for (const dependency of stepRequest.dependencies) {
          // Find the step this depends on
          const dependsOnStep = [...existingSteps, ...createdSteps].find(s => 
            s.metadata.step_number === dependency.depends_on_step_number
          );

          if (dependsOnStep) {
            const depRelationship = await playbookDataLayer.createRelationship({
              from_entity_id: step.id,
              to_entity_id: dependsOnStep.id,
              smart_code: PlaybookSmartCodes.forRelationship('STEP.DEPENDS.ON'),
              metadata: {
                dependency_type: dependency.dependency_type,
                condition: dependency.condition,
                created_from_step_definition: true
              }
            });

            createdRelationships.push(depRelationship);
          }
        }
      }

    } catch (stepError) {
      console.error(`Error creating step ${stepRequest.step_number}:`, stepError);
      errors.push(`Failed to create step ${stepRequest.step_number}: ${stepError}`);
    }
  }

  // Update playbook metadata
  await playbookDataLayer.updatePlaybookDefinition(playbook.id, {
    metadata: {
      ...playbook.metadata,
      step_count: existingSteps.length + createdSteps.length,
      last_modified: new Date().toISOString(),
      modified_by: userId || 'system',
      steps_added: createdSteps.length,
      last_step_addition: new Date().toISOString()
    }
  });

  // Return results
  return NextResponse.json({
    success: true,
    data: {
      playbook_id: playbook.id,
      playbook_name: playbook.name,
      playbook_status: playbook.status,
      steps_added: createdSteps.length,
      relationships_created: createdRelationships.length,
      total_steps: existingSteps.length + createdSteps.length,
      created_steps: createdSteps.map(s => ({
        id: s.id,
        name: s.name,
        step_number: s.metadata.step_number,
        step_type: s.metadata.step_type,
        worker_type: s.metadata.worker_type
      })),
      validation_errors: errors.length > 0 ? errors : undefined
    },
    metadata: {
      organization_id: playbook.organization_id,
      operation: 'add_steps',
      insert_mode: request.insert_mode || 'append',
      created_by: userId || 'system',
      creation_time: new Date().toISOString()
    }
  }, { status: 201 });
}

// Additional helper functions

async function reorderExistingSteps(
  playbookId: string, 
  insertAfterStep: number, 
  newStepsCount: number
): Promise<void> {
  const existingSteps = await playbookDataLayer.getPlaybookSteps(playbookId);
  
  for (const step of existingSteps) {
    if (step.metadata.step_number > insertAfterStep) {
      // Shift step numbers to make room
      const newStepNumber = step.metadata.step_number + newStepsCount;
      
      await playbookDataLayer.updateStepDefinition(step.id, {
        metadata: {
          ...step.metadata,
          step_number: newStepNumber,
          reordered_at: new Date().toISOString()
        }
      });
    }
  }
}

async function getStepDependencies(stepId: string): Promise<any[]> {
  const relationships = await playbookDataLayer.queryRelationships({
    filters: {
      from_entity_id: stepId,
      smart_code: 'HERA.PLAYBOOK.STEP.DEPENDS.ON.V1'
    }
  });

  return relationships.data;
}

async function getStepDependents(stepId: string): Promise<any[]> {
  const relationships = await playbookDataLayer.queryRelationships({
    filters: {
      to_entity_id: stepId,
      smart_code: 'HERA.PLAYBOOK.STEP.DEPENDS.ON.V1'
    }
  });

  return relationships.data;
}

async function validateStepDefinition(step: any, playbook: any): Promise<any[]> {
  const validationResults = [];

  // Validate step number uniqueness
  // Validate required roles exist
  // Validate business rules format
  // Validate estimated duration reasonableness

  return validationResults;
}

function analyzeStepFlow(steps: any[]): any {
  return {
    total_steps: steps.length,
    estimated_total_duration_minutes: steps.reduce((sum, s) => 
      sum + (s.metadata.estimated_duration_minutes || 0), 0
    ),
    worker_type_distribution: getWorkerTypeDistribution(steps),
    complexity_score: calculateComplexityScore(steps),
    potential_bottlenecks: identifyPotentialBottlenecks(steps)
  };
}

function getWorkerTypeDistribution(steps: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  for (const step of steps) {
    const workerType = step.metadata.worker_type;
    distribution[workerType] = (distribution[workerType] || 0) + 1;
  }
  
  return distribution;
}

function calculateComplexityScore(steps: any[]): number {
  // Calculate based on number of steps, dependencies, and worker types
  let score = steps.length * 2;
  
  // Add complexity for human steps
  score += steps.filter(s => s.metadata.step_type === 'human').length * 3;
  
  // Add complexity for external steps
  score += steps.filter(s => s.metadata.step_type === 'external').length * 2;
  
  return Math.min(100, score);
}

function identifyPotentialBottlenecks(steps: any[]): string[] {
  const bottlenecks = [];
  
  // Check for long-running steps
  const longSteps = steps.filter(s => 
    (s.metadata.estimated_duration_minutes || 0) > 60
  );
  
  if (longSteps.length > 0) {
    bottlenecks.push(`${longSteps.length} step(s) with >60 minute duration`);
  }
  
  // Check for human steps
  const humanSteps = steps.filter(s => s.metadata.step_type === 'human');
  if (humanSteps.length > steps.length * 0.5) {
    bottlenecks.push('High ratio of human steps may cause delays');
  }
  
  return bottlenecks;
}

async function getPlaybookContracts(playbookId: string): Promise<any[]> {
  const contractTypes = ['input_contract', 'output_contract'];
  const contracts = [];
  
  for (const type of contractTypes) {
    const contract = await playbookDataLayer.getContract(playbookId, type);
    if (contract) {
      contracts.push(contract);
    }
  }
  
  return contracts;
}