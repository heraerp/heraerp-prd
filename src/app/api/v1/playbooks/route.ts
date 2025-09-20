/**
 * HERA Playbooks Definition API
 * 
 * Implements POST /playbooks and GET /playbooks endpoints with complete
 * playbook definition management using HERA's 6-table architecture.
 */

import { NextRequest, NextResponse } from 'next/server';
import { playbookDataLayer } from '@/lib/playbooks/data/playbook-data-layer';
import { PlaybookSmartCodes, playbookSmartCodeService } from '@/lib/playbooks/smart-codes/playbook-smart-codes';
import { playbookAuthService } from '@/lib/playbooks/auth/playbook-auth';
import { universalApi } from '@/lib/universal-api';

// Types for API requests/responses
interface CreatePlaybookRequest {
  name: string;
  description?: string;
  industry: string;
  module: string;
  version?: string;
  estimated_duration_hours?: number;
  worker_types?: string[];
  metadata?: Record<string, any>;
  steps?: CreateStepRequest[];
  contracts?: CreateContractRequest[];
  policies?: CreatePolicyRequest[];
}

interface CreateStepRequest {
  name: string;
  step_number: number;
  step_type: 'human' | 'system' | 'ai' | 'external';
  worker_type: string;
  estimated_duration_minutes: number;
  required_roles: string[];
  description: string;
  business_rules?: string[];
  error_handling?: string;
  metadata?: Record<string, any>;
}

interface CreateContractRequest {
  type: 'input_contract' | 'output_contract' | 'step_input_contract' | 'step_output_contract';
  schema: Record<string, any>;
  entity_id?: string; // For step-specific contracts
  metadata?: Record<string, any>;
}

interface CreatePolicyRequest {
  type: 'sla_policy' | 'quorum_policy' | 'segregation_policy' | 'approval_policy' | 'retry_policy';
  rules: Record<string, any>;
  metadata?: Record<string, any>;
}

interface PlaybookQueryParams {
  industry?: string;
  module?: string;
  status?: string;
  latest_only?: boolean;
  include_contracts?: boolean;
  include_policies?: boolean;
  include_steps?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * POST /api/v1/playbooks - Create playbook definition
 */
export async function POST(request: NextRequest) {
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
        error: 'Insufficient permissions to create playbooks',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    const body: CreatePlaybookRequest = await request.json();
    
    // Validate required fields
    if (!body.name || !body.industry) {
      return NextResponse.json({
        error: 'Name and industry are required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Set organization context
    const organizationId = authState.organization.id;
    playbookDataLayer.setOrganizationContext(organizationId);
    universalApi.setOrganizationId(organizationId);

    // Generate smart code for playbook definition
    const version = body.version || '1';
    const playbookSmartCode = PlaybookSmartCodes.forPlaybookDefinition(
      body.industry,
      body.name.toUpperCase().replace(/\s+/g, '_'),
      version
    );

    // Validate smart code
    const codeValidation = playbookSmartCodeService.validateSmartCode(playbookSmartCode);
    if (!codeValidation.valid) {
      return NextResponse.json({
        error: 'Invalid smart code generated',
        code: 'SMART_CODE_ERROR',
        details: codeValidation.errors
      }, { status: 400 });
    }

    // Check for existing playbook with same name
    const existingPlaybooks = await playbookDataLayer.queryPlaybookDefinitions({
      filters: {
        entity_name: body.name,
        'metadata->>industry': body.industry
      }
    });

    if (existingPlaybooks.data.length > 0) {
      return NextResponse.json({
        error: 'Playbook with this name already exists in the specified industry',
        code: 'DUPLICATE_PLAYBOOK'
      }, { status: 409 });
    }

    // Create playbook definition
    const playbookMetadata = {
      industry: body.industry,
      module: body.module || 'WORKFLOW',
      estimated_duration_hours: body.estimated_duration_hours || 1,
      worker_types: body.worker_types || ['human'],
      step_count: body.steps?.length || 0,
      input_schema_ref: 'input_contract',
      output_schema_ref: 'output_contract',
      created_by: authState.user?.id || 'system',
      last_modified: new Date().toISOString(),
      ...body.metadata
    };

    const playbook = await playbookDataLayer.createPlaybookDefinition({
      name: body.name,
      description: body.description,
      smart_code: playbookSmartCode,
      status: 'draft',
      version,
      ai_confidence: 0.95,
      ai_insights: `Playbook definition created with ${body.steps?.length || 0} steps`,
      metadata: playbookMetadata
    });

    // Create step definitions if provided
    const createdSteps = [];
    if (body.steps && body.steps.length > 0) {
      for (const stepData of body.steps) {
        const stepSmartCode = PlaybookSmartCodes.forStepDefinition(
          body.industry,
          stepData.name.toUpperCase().replace(/\s+/g, '_'),
          version
        );

        const step = await playbookDataLayer.createStepDefinition({
          name: stepData.name,
          smart_code: stepSmartCode,
          status: 'active',
          version,
          ai_confidence: 0.90,
          ai_insights: `Step definition for ${stepData.step_type} worker`,
          metadata: {
            step_number: stepData.step_number,
            step_type: stepData.step_type,
            worker_type: stepData.worker_type,
            estimated_duration_minutes: stepData.estimated_duration_minutes,
            required_roles: stepData.required_roles,
            description: stepData.description,
            business_rules: stepData.business_rules || [],
            next_steps: [], // Will be populated based on step order
            error_handling: stepData.error_handling || 'retry_with_validation',
            ...stepData.metadata
          }
        });

        createdSteps.push(step);

        // Create relationship between playbook and step
        await playbookDataLayer.createRelationship({
          from_entity_id: playbook.id,
          to_entity_id: step.id,
          smart_code: PlaybookSmartCodes.forRelationship('CONTAINS.STEP'),
          metadata: {
            step_sequence: stepData.step_number,
            is_required: true,
            can_be_skipped: false,
            parallel_group: null
          }
        });
      }

      // Create step sequence relationships (step A follows step B)
      for (let i = 1; i < createdSteps.length; i++) {
        await playbookDataLayer.createRelationship({
          from_entity_id: createdSteps[i].id,
          to_entity_id: createdSteps[i - 1].id,
          smart_code: PlaybookSmartCodes.forRelationship('STEP.FOLLOWS.STEP'),
          metadata: {
            sequence_order: i + 1,
            dependency_type: 'sequential'
          }
        });
      }
    }

    // Create contracts if provided
    const createdContracts = [];
    if (body.contracts && body.contracts.length > 0) {
      for (const contractData of body.contracts) {
        const entityId = contractData.entity_id || playbook.id;
        const contractSmartCode = contractData.type.includes('step') 
          ? PlaybookSmartCodes.forContract('step_input', version)
          : PlaybookSmartCodes.forContract(
              contractData.type.replace('_contract', '') as 'input' | 'output',
              version
            );

        const contract = await playbookDataLayer.saveContract({
          entity_id: entityId,
          code: contractData.type,
          value_json: {
            $schema: "https://json-schema.org/draft/2020-12/schema",
            title: `${body.name} ${contractData.type.replace('_', ' ')}`,
            ...contractData.schema
          },
          data_type: 'json_schema',
          validation_rule: contractSmartCode
        });

        createdContracts.push(contract);
      }
    }

    // Create policies if provided
    const createdPolicies = [];
    if (body.policies && body.policies.length > 0) {
      for (const policyData of body.policies) {
        const policySmartCode = PlaybookSmartCodes.forPolicy(
          policyData.type.replace('_policy', '') as 'sla' | 'quorum' | 'segregation' | 'approval' | 'retry',
          version
        );

        const policy = await playbookDataLayer.saveContract({
          entity_id: playbook.id,
          code: policyData.type,
          value_json: {
            rules: policyData.rules,
            created_at: new Date().toISOString(),
            version,
            ...policyData.metadata
          },
          data_type: 'policy_rules',
          validation_rule: policySmartCode
        });

        createdPolicies.push(policy);
      }
    }

    // Update playbook metadata with creation summary
    await playbookDataLayer.updatePlaybookDefinition(playbook.id, {
      metadata: {
        ...playbookMetadata,
        steps_created: createdSteps.length,
        contracts_created: createdContracts.length,
        policies_created: createdPolicies.length,
        creation_summary: {
          steps: createdSteps.map(s => ({ id: s.id, name: s.name, type: s.metadata.step_type })),
          contracts: createdContracts.map(c => ({ type: c.code, entity_id: c.entity_id })),
          policies: createdPolicies.map(p => ({ type: p.code, rules_count: Object.keys(p.value_json.rules || {}).length }))
        }
      }
    });

    // Return complete playbook definition
    return NextResponse.json({
      success: true,
      data: {
        playbook,
        steps: createdSteps,
        contracts: createdContracts,
        policies: createdPolicies,
        relationships_created: createdSteps.length + Math.max(0, createdSteps.length - 1)
      },
      metadata: {
        smart_code: playbookSmartCode,
        validation: codeValidation,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        creation_time_ms: Date.now() - request.headers.get('x-request-start') || 0
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create playbook error:', error);
    
    return NextResponse.json({
      error: 'Failed to create playbook',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/v1/playbooks - List playbook definitions
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: PlaybookQueryParams = {
      industry: searchParams.get('industry') || undefined,
      module: searchParams.get('module') || undefined,
      status: searchParams.get('status') || undefined,
      latest_only: searchParams.get('latest_only') === 'true',
      include_contracts: searchParams.get('include_contracts') === 'true',
      include_policies: searchParams.get('include_policies') === 'true',
      include_steps: searchParams.get('include_steps') === 'true',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    // Build filters
    const filters: Record<string, any> = {};
    
    if (queryParams.industry) {
      filters['metadata->>industry'] = queryParams.industry;
    }
    
    if (queryParams.module) {
      filters['metadata->>module'] = queryParams.module;
    }
    
    if (queryParams.status) {
      filters.status = queryParams.status;
    }

    // Query playbooks
    const result = await playbookDataLayer.queryPlaybookDefinitions({
      filters,
      sort: { field: 'updated_at', direction: 'desc' },
      limit: queryParams.limit,
      offset: queryParams.offset
    });

    // Handle latest version resolution
    let playbooks = result.data;
    
    if (queryParams.latest_only) {
      playbooks = await resolveLatestVersions(playbooks);
    }

    // Enrich with additional data if requested
    const enrichedPlaybooks = [];
    
    for (const playbook of playbooks) {
      const enriched: any = { ...playbook };

      // Include steps
      if (queryParams.include_steps) {
        enriched.steps = await playbookDataLayer.getPlaybookSteps(playbook.id);
      }

      // Include contracts
      if (queryParams.include_contracts) {
        enriched.contracts = await getPlaybookContracts(playbook.id);
      }

      // Include policies
      if (queryParams.include_policies) {
        enriched.policies = await getPlaybookPolicies(playbook.id);
      }

      enrichedPlaybooks.push(enriched);
    }

    // Calculate summary statistics
    const summary = {
      total_playbooks: result.total,
      active_playbooks: enrichedPlaybooks.filter(p => p.status === 'active').length,
      draft_playbooks: enrichedPlaybooks.filter(p => p.status === 'draft').length,
      industries: [...new Set(enrichedPlaybooks.map(p => p.metadata.industry))],
      modules: [...new Set(enrichedPlaybooks.map(p => p.metadata.module))],
      avg_duration_hours: enrichedPlaybooks.reduce((sum, p) => sum + (p.metadata.estimated_duration_hours || 0), 0) / enrichedPlaybooks.length,
      total_steps: enrichedPlaybooks.reduce((sum, p) => sum + (p.metadata.step_count || 0), 0)
    };

    return NextResponse.json({
      success: true,
      data: enrichedPlaybooks,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        has_more: result.has_more,
        offset: queryParams.offset
      },
      summary,
      filters_applied: queryParams,
      metadata: {
        organization_id: organizationId,
        query_time_ms: Date.now() - (request.headers.get('x-request-start') || Date.now()),
        latest_version_resolution: queryParams.latest_only
      }
    });

  } catch (error) {
    console.error('List playbooks error:', error);
    
    return NextResponse.json({
      error: 'Failed to list playbooks',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions

/**
 * Resolve latest versions of playbooks by name and industry
 */
async function resolveLatestVersions(playbooks: any[]): Promise<any[]> {
  const playbookGroups = new Map<string, any[]>();
  
  // Group playbooks by name and industry
  for (const playbook of playbooks) {
    const key = `${playbook.name}:${playbook.metadata.industry}`;
    if (!playbookGroups.has(key)) {
      playbookGroups.set(key, []);
    }
    playbookGroups.get(key)!.push(playbook);
  }
  
  // Get latest version from each group
  const latestPlaybooks = [];
  
  for (const [key, group] of playbookGroups.entries()) {
    // Sort by version number (handle semantic versioning)
    const sorted = group.sort((a, b) => {
      const versionA = parseVersion(a.version);
      const versionB = parseVersion(b.version);
      
      if (versionA.major !== versionB.major) return versionB.major - versionA.major;
      if (versionA.minor !== versionB.minor) return versionB.minor - versionA.minor;
      return versionB.patch - versionA.patch;
    });
    
    latestPlaybooks.push(sorted[0]);
  }
  
  return latestPlaybooks;
}

/**
 * Parse version string into components
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split('.').map(p => parseInt(p) || 0);
  return {
    major: parts[0] || 1,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  };
}

/**
 * Get contracts for a playbook
 */
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

/**
 * Get policies for a playbook
 */
async function getPlaybookPolicies(playbookId: string): Promise<any[]> {
  const policyTypes = ['sla_policy', 'quorum_policy', 'segregation_policy', 'approval_policy', 'retry_policy'];
  const policies = [];
  
  for (const type of policyTypes) {
    const policy = await playbookDataLayer.getContract(playbookId, type);
    if (policy) {
      policies.push(policy);
    }
  }
  
  return policies;
}