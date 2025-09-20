/**
 * HERA Playbook Contract Validation Service
 * 
 * Provides runtime validation of data contracts and policy enforcement
 * for playbook inputs, outputs, and business rules using JSON Schema
 * and dynamic data storage.
 */

import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { universalApi } from '@/lib/universal-api';

// Types
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  validatedData?: any;
  contractVersion?: string;
  validatedAt?: string;
  performance?: {
    validation_time_ms: number;
    schema_load_time_ms: number;
  };
}

export interface ValidationError {
  path?: string;
  message: string;
  value?: any;
  schema?: any;
  code?: string;
}

export interface PolicyValidationResult {
  compliant: boolean;
  message: string;
  metrics?: Record<string, any>;
  recommendations?: string[];
  policy_version?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export interface ContractMetadata {
  version: string;
  created_by: string;
  created_at: string;
  validated_at?: string;
  checksum?: string;
  schema_format: string;
}

/**
 * Main Contract Validation Service
 */
export class ContractValidationService {
  private ajv: Ajv;
  private contractCache: Map<string, any> = new Map();
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.ajv = new Ajv({ 
      allErrors: true,
      verbose: true,
      strict: false,
      addUsedSchema: false,
      removeAdditional: 'all', // Remove additional properties
      useDefaults: true,       // Apply default values
      coerceTypes: true       // Type coercion
    });
    
    // Add standard formats (email, date-time, uuid, etc.)
    addFormats(this.ajv);
    
    // Add custom business rule keywords
    this.addCustomKeywords();
  }

  /**
   * Validate playbook input data against input contract
   */
  async validatePlaybookInput(
    playbookId: string,
    inputData: any
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const contract = await this.getContract(playbookId, 'input_contract');
      const schemaLoadTime = Date.now() - startTime;
      
      if (!contract) {
        return {
          valid: false,
          errors: [{ 
            message: `No input contract found for playbook ${playbookId}`,
            code: 'CONTRACT_NOT_FOUND'
          }]
        };
      }

      const validationStart = Date.now();
      const result = await this.validateAgainstSchema(contract, inputData);
      const validationTime = Date.now() - validationStart;

      return {
        ...result,
        performance: {
          validation_time_ms: validationTime,
          schema_load_time_ms: schemaLoadTime
        }
      };

    } catch (error) {
      return {
        valid: false,
        errors: [{ 
          message: `Playbook input validation failed: ${error.message}`,
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * Validate playbook output data against output contract
   */
  async validatePlaybookOutput(
    playbookId: string,
    outputData: any
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const contract = await this.getContract(playbookId, 'output_contract');
      const schemaLoadTime = Date.now() - startTime;
      
      if (!contract) {
        return {
          valid: false,
          errors: [{ 
            message: `No output contract found for playbook ${playbookId}`,
            code: 'CONTRACT_NOT_FOUND'
          }]
        };
      }

      const validationStart = Date.now();
      const result = await this.validateAgainstSchema(contract, outputData);
      const validationTime = Date.now() - validationStart;

      return {
        ...result,
        performance: {
          validation_time_ms: validationTime,
          schema_load_time_ms: schemaLoadTime
        }
      };

    } catch (error) {
      return {
        valid: false,
        errors: [{ 
          message: `Playbook output validation failed: ${error.message}`,
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * Validate step input data against step input contract
   */
  async validateStepInput(
    stepId: string,
    inputData: any
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const contract = await this.getContract(stepId, 'input_contract');
      const schemaLoadTime = Date.now() - startTime;
      
      if (!contract) {
        // If no step-specific contract, validation passes
        return {
          valid: true,
          validatedData: inputData,
          validatedAt: new Date().toISOString(),
          performance: {
            validation_time_ms: 0,
            schema_load_time_ms: schemaLoadTime
          }
        };
      }

      const validationStart = Date.now();
      const result = await this.validateAgainstSchema(contract, inputData);
      const validationTime = Date.now() - validationStart;

      return {
        ...result,
        performance: {
          validation_time_ms: validationTime,
          schema_load_time_ms: schemaLoadTime
        }
      };

    } catch (error) {
      return {
        valid: false,
        errors: [{ 
          message: `Step input validation failed: ${error.message}`,
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * Validate step output data against step output contract
   */
  async validateStepOutput(
    stepId: string,
    outputData: any
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const contract = await this.getContract(stepId, 'output_contract');
      const schemaLoadTime = Date.now() - startTime;
      
      if (!contract) {
        // If no step-specific contract, validation passes
        return {
          valid: true,
          validatedData: outputData,
          validatedAt: new Date().toISOString(),
          performance: {
            validation_time_ms: 0,
            schema_load_time_ms: schemaLoadTime
          }
        };
      }

      const validationStart = Date.now();
      const result = await this.validateAgainstSchema(contract, outputData);
      const validationTime = Date.now() - validationStart;

      return {
        ...result,
        performance: {
          validation_time_ms: validationTime,
          schema_load_time_ms: schemaLoadTime
        }
      };

    } catch (error) {
      return {
        valid: false,
        errors: [{ 
          message: `Step output validation failed: ${error.message}`,
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * Validate SLA policy compliance
   */
  async validateSLAPolicy(
    playbookId: string,
    context: {
      stepName?: string;
      startTime: string;
      currentTime?: string;
      businessHoursOnly?: boolean;
    }
  ): Promise<PolicyValidationResult> {
    try {
      const policy = await this.getPolicy(playbookId, 'sla_policy');
      
      if (!policy) {
        return {
          compliant: true,
          message: "No SLA policy defined - no time constraints",
          severity: 'info'
        };
      }

      const policyRules = JSON.parse(policy.field_value_text);
      const currentTime = context.currentTime || new Date().toISOString();
      
      // Calculate elapsed time
      const startMs = new Date(context.startTime).getTime();
      const currentMs = new Date(currentTime).getTime();
      const elapsedMs = currentMs - startMs;
      const elapsedMinutes = elapsedMs / (1000 * 60);
      const elapsedHours = elapsedMs / (1000 * 60 * 60);

      // Check step-specific SLA
      if (context.stepName) {
        const stepSLA = policyRules.rules?.step_slas?.[context.stepName];
        
        if (stepSLA) {
          let allowedMinutes: number;
          
          if (stepSLA.duration_hours) {
            allowedMinutes = stepSLA.duration_hours * 60;
          } else if (stepSLA.duration_minutes) {
            allowedMinutes = stepSLA.duration_minutes;
          } else {
            return {
              compliant: true,
              message: `No time limit defined for step ${context.stepName}`,
              severity: 'info'
            };
          }

          // Adjust for business hours if required
          if (stepSLA.business_hours_only && context.businessHoursOnly) {
            allowedMinutes = this.adjustForBusinessHours(allowedMinutes, context.startTime, currentTime);
          }

          const compliant = elapsedMinutes <= allowedMinutes;
          const compliancePercentage = Math.min(100, (allowedMinutes / elapsedMinutes) * 100);

          return {
            compliant,
            message: compliant 
              ? `Step ${context.stepName} within SLA (${elapsedMinutes.toFixed(1)}/${allowedMinutes} minutes)`
              : `Step ${context.stepName} exceeds SLA (${elapsedMinutes.toFixed(1)}/${allowedMinutes} minutes)`,
            severity: compliant ? 'info' : (elapsedMinutes > allowedMinutes * 1.5 ? 'critical' : 'warning'),
            metrics: {
              elapsed_minutes: Math.round(elapsedMinutes * 10) / 10,
              allowed_minutes: allowedMinutes,
              compliance_percentage: Math.round(compliancePercentage * 10) / 10,
              business_hours_adjusted: stepSLA.business_hours_only
            },
            policy_version: policy.metadata?.version
          };
        }
      }

      // Check overall playbook SLA
      const playbookSLA = policyRules.rules?.playbook_sla;
      if (playbookSLA) {
        const allowedHours = playbookSLA.total_duration_hours;
        const compliant = elapsedHours <= allowedHours;
        
        return {
          compliant,
          message: compliant
            ? `Playbook within SLA (${elapsedHours.toFixed(1)}/${allowedHours} hours)`
            : `Playbook exceeds SLA (${elapsedHours.toFixed(1)}/${allowedHours} hours)`,
          severity: compliant ? 'info' : 'warning',
          metrics: {
            elapsed_hours: Math.round(elapsedHours * 10) / 10,
            allowed_hours: allowedHours,
            compliance_percentage: Math.min(100, (allowedHours / elapsedHours) * 100)
          }
        };
      }

      return {
        compliant: true,
        message: "No applicable SLA rules found",
        severity: 'info'
      };

    } catch (error) {
      return {
        compliant: false,
        message: `SLA policy validation failed: ${error.message}`,
        severity: 'error'
      };
    }
  }

  /**
   * Validate quorum policy compliance
   */
  async validateQuorumPolicy(
    playbookId: string,
    context: {
      stepName: string;
      voters?: Array<{ id: string; role: string; vote?: string }>;
      votingWindowStart?: string;
      conflictChecks?: Array<{ voterId: string; conflicts: string[] }>;
    }
  ): Promise<PolicyValidationResult> {
    try {
      const policy = await this.getPolicy(playbookId, 'quorum_policy');
      
      if (!policy) {
        return {
          compliant: true,
          message: "No quorum policy defined",
          severity: 'info'
        };
      }

      const policyRules = JSON.parse(policy.field_value_text);
      
      // Only apply to committee review steps
      if (context.stepName !== 'CommitteeReview') {
        return {
          compliant: true,
          message: "Quorum policy not applicable to this step type",
          severity: 'info'
        };
      }

      const quorumRules = policyRules.rules?.committee_review;
      if (!quorumRules) {
        return {
          compliant: true,
          message: "No committee review quorum rules defined",
          severity: 'info'
        };
      }

      const voters = context.voters || [];
      const voterCount = voters.length;

      // Check minimum voters
      if (voterCount < quorumRules.minimum_voters) {
        return {
          compliant: false,
          message: `Insufficient voters: ${voterCount}/${quorumRules.minimum_voters} required`,
          severity: 'error',
          metrics: {
            current_voters: voterCount,
            required_voters: quorumRules.minimum_voters,
            deficit: quorumRules.minimum_voters - voterCount
          }
        };
      }

      // Check maximum voters
      if (quorumRules.maximum_voters && voterCount > quorumRules.maximum_voters) {
        return {
          compliant: false,
          message: `Too many voters: ${voterCount}/${quorumRules.maximum_voters} maximum`,
          severity: 'warning',
          metrics: {
            current_voters: voterCount,
            maximum_voters: quorumRules.maximum_voters,
            excess: voterCount - quorumRules.maximum_voters
          }
        };
      }

      // Check voting window
      if (context.votingWindowStart) {
        const windowStartMs = new Date(context.votingWindowStart).getTime();
        const currentMs = Date.now();
        const elapsedHours = (currentMs - windowStartMs) / (1000 * 60 * 60);
        
        if (elapsedHours > quorumRules.voting_window_hours) {
          return {
            compliant: false,
            message: `Voting window expired: ${elapsedHours.toFixed(1)}/${quorumRules.voting_window_hours} hours`,
            severity: 'error',
            metrics: {
              elapsed_hours: Math.round(elapsedHours * 10) / 10,
              allowed_hours: quorumRules.voting_window_hours,
              window_start: context.votingWindowStart
            }
          };
        }
      }

      // Check for conflicts of interest
      if (quorumRules.voter_qualification?.conflict_of_interest_check && context.conflictChecks) {
        const conflictedVoters = context.conflictChecks.filter(check => check.conflicts.length > 0);
        
        if (conflictedVoters.length > 0) {
          return {
            compliant: false,
            message: `Conflict of interest detected for ${conflictedVoters.length} voters`,
            severity: 'critical',
            metrics: {
              conflicted_voters: conflictedVoters.length,
              total_voters: voterCount,
              conflicts: conflictedVoters.map(cv => ({
                voter_id: cv.voterId,
                conflict_types: cv.conflicts
              }))
            }
          };
        }
      }

      // Check consensus if votes are cast
      const votedCount = voters.filter(v => v.vote).length;
      if (votedCount >= quorumRules.minimum_voters) {
        const approveVotes = voters.filter(v => v.vote === 'approve').length;
        const consensusRatio = approveVotes / votedCount;
        const requiredConsensus = quorumRules.consensus_threshold || 0.5;
        
        if (consensusRatio < requiredConsensus) {
          return {
            compliant: false,
            message: `Consensus not reached: ${(consensusRatio * 100).toFixed(1)}% approval (${(requiredConsensus * 100)}% required)`,
            severity: 'warning',
            metrics: {
              approve_votes: approveVotes,
              total_votes: votedCount,
              consensus_percentage: Math.round(consensusRatio * 1000) / 10,
              required_percentage: Math.round(requiredConsensus * 1000) / 10
            }
          };
        }
      }

      return {
        compliant: true,
        message: `Quorum requirements met: ${voterCount} eligible voters`,
        severity: 'info',
        metrics: {
          voter_count: voterCount,
          minimum_required: quorumRules.minimum_voters,
          maximum_allowed: quorumRules.maximum_voters
        }
      };

    } catch (error) {
      return {
        compliant: false,
        message: `Quorum policy validation failed: ${error.message}`,
        severity: 'error'
      };
    }
  }

  /**
   * Validate segregation of duties policy
   */
  async validateSegregationPolicy(
    playbookId: string,
    context: {
      stepName: string;
      currentUserId: string;
      currentUserRoles: string[];
      previousStepUsers?: Array<{ stepName: string; userId: string; roles: string[] }>;
      relationshipChecks?: Array<{ type: string; detected: boolean }>;
    }
  ): Promise<PolicyValidationResult> {
    try {
      const policy = await this.getPolicy(playbookId, 'segregation_policy');
      
      if (!policy) {
        return {
          compliant: true,
          message: "No segregation of duties policy defined",
          severity: 'info'
        };
      }

      const policyRules = JSON.parse(policy.field_value_text);
      const stepRules = policyRules.rules?.role_separation?.[context.stepName];
      
      if (!stepRules) {
        return {
          compliant: true,
          message: `No segregation rules defined for step ${context.stepName}`,
          severity: 'info'
        };
      }

      // Check allowed roles
      if (stepRules.allowed_roles) {
        const hasAllowedRole = stepRules.allowed_roles.some((role: string) =>
          context.currentUserRoles.includes(role)
        );
        
        if (!hasAllowedRole) {
          return {
            compliant: false,
            message: `User roles ${context.currentUserRoles.join(', ')} not allowed for step ${context.stepName}`,
            severity: 'critical',
            metrics: {
              user_roles: context.currentUserRoles,
              allowed_roles: stepRules.allowed_roles
            }
          };
        }
      }

      // Check prohibited combinations with previous steps
      if (stepRules.requires_different_user_from && context.previousStepUsers) {
        const prohibitedSteps = stepRules.requires_different_user_from;
        const conflictingSteps = context.previousStepUsers.filter(prevStep =>
          prohibitedSteps.includes(prevStep.stepName) && prevStep.userId === context.currentUserId
        );
        
        if (conflictingSteps.length > 0) {
          return {
            compliant: false,
            message: `Same user cannot execute both ${conflictingSteps[0].stepName} and ${context.stepName}`,
            severity: 'critical',
            metrics: {
              conflicting_steps: conflictingSteps.map(cs => cs.stepName),
              user_id: context.currentUserId
            }
          };
        }
      }

      // Check prohibited role combinations
      if (stepRules.prohibited_combinations && context.previousStepUsers) {
        for (const combination of stepRules.prohibited_combinations) {
          const [role1, role2] = combination;
          
          const hasRole1InHistory = context.previousStepUsers.some(prevStep =>
            prevStep.userId === context.currentUserId && prevStep.roles.includes(role1)
          );
          
          const hasRole2Now = context.currentUserRoles.includes(role2);
          
          if (hasRole1InHistory && hasRole2Now) {
            return {
              compliant: false,
              message: `Prohibited role combination: ${role1} in previous step and ${role2} in current step`,
              severity: 'critical',
              metrics: {
                prohibited_combination: [role1, role2],
                user_id: context.currentUserId
              }
            };
          }
        }
      }

      // Check relationship conflicts
      if (context.relationshipChecks) {
        const prohibitedConflicts = policyRules.rules?.conflict_detection;
        
        if (prohibitedConflicts) {
          const detectedProhibitions = context.relationshipChecks.filter(check =>
            check.detected && 
            prohibitedConflicts[check.type] === 'prohibited'
          );
          
          if (detectedProhibitions.length > 0) {
            return {
              compliant: false,
              message: `Prohibited relationships detected: ${detectedProhibitions.map(dp => dp.type).join(', ')}`,
              severity: 'critical',
              metrics: {
                prohibited_relationships: detectedProhibitions.map(dp => dp.type),
                user_id: context.currentUserId
              }
            };
          }
        }
      }

      return {
        compliant: true,
        message: `Segregation of duties requirements met for step ${context.stepName}`,
        severity: 'info',
        metrics: {
          user_roles: context.currentUserRoles,
          step_name: context.stepName
        }
      };

    } catch (error) {
      return {
        compliant: false,
        message: `Segregation policy validation failed: ${error.message}`,
        severity: 'error'
      };
    }
  }

  /**
   * Validate approval thresholds policy
   */
  async validateApprovalPolicy(
    playbookId: string,
    context: {
      amount?: number;
      riskLevel?: 'low' | 'medium' | 'high' | 'critical';
      approvers?: Array<{ userId: string; role: string; level: string }>;
      specialCircumstances?: string[];
    }
  ): Promise<PolicyValidationResult> {
    try {
      const policy = await this.getPolicy(playbookId, 'approval_policy');
      
      if (!policy) {
        return {
          compliant: true,
          message: "No approval policy defined",
          severity: 'info'
        };
      }

      const policyRules = JSON.parse(policy.field_value_text);
      
      // Determine applicable approval tier based on amount
      let applicableTier: any = null;
      
      if (context.amount && policyRules.rules?.amount_based_approval) {
        const tiers = policyRules.rules.amount_based_approval;
        
        for (const [tierName, tierRules] of Object.entries(tiers)) {
          const rules = tierRules as any;
          if (context.amount >= rules.min_amount && context.amount <= rules.max_amount) {
            applicableTier = { name: tierName, ...rules };
            break;
          }
        }
      }

      if (!applicableTier) {
        return {
          compliant: true,
          message: "No applicable approval tier found",
          severity: 'info'
        };
      }

      const approvers = context.approvers || [];
      const requiredApprovals = applicableTier.required_approvals;

      // Check sufficient number of approvers
      if (approvers.length < requiredApprovals) {
        return {
          compliant: false,
          message: `Insufficient approvals: ${approvers.length}/${requiredApprovals} required for ${applicableTier.name}`,
          severity: 'error',
          metrics: {
            current_approvals: approvers.length,
            required_approvals: requiredApprovals,
            approval_tier: applicableTier.name,
            amount: context.amount
          }
        };
      }

      // Check approver roles
      if (applicableTier.approval_roles) {
        const hasRequiredRoles = applicableTier.approval_roles.every((requiredRole: string) =>
          approvers.some(approver => approver.role === requiredRole)
        );
        
        if (!hasRequiredRoles) {
          return {
            compliant: false,
            message: `Missing required approver roles: ${applicableTier.approval_roles.join(', ')}`,
            severity: 'error',
            metrics: {
              required_roles: applicableTier.approval_roles,
              current_approver_roles: approvers.map(a => a.role),
              approval_tier: applicableTier.name
            }
          };
        }
      }

      // Check special circumstances
      if (context.specialCircumstances && policyRules.rules?.special_circumstances) {
        const specialRules = policyRules.rules.special_circumstances;
        
        for (const circumstance of context.specialCircumstances) {
          const circumstanceRules = specialRules[circumstance];
          if (circumstanceRules) {
            // Apply special rules (e.g., expedited approval, enhanced authority)
            return {
              compliant: true,
              message: `Special circumstances approval: ${circumstance}`,
              severity: 'info',
              metrics: {
                special_circumstance: circumstance,
                applied_rules: circumstanceRules
              }
            };
          }
        }
      }

      return {
        compliant: true,
        message: `Approval requirements met: ${approvers.length} approvals for ${applicableTier.name}`,
        severity: 'info',
        metrics: {
          approvals_received: approvers.length,
          approval_tier: applicableTier.name,
          amount: context.amount,
          approver_roles: approvers.map(a => a.role)
        }
      };

    } catch (error) {
      return {
        compliant: false,
        message: `Approval policy validation failed: ${error.message}`,
        severity: 'error'
      };
    }
  }

  // Private helper methods

  private async validateAgainstSchema(contract: any, data: any): Promise<ValidationResult> {
    try {
      const schema = JSON.parse(contract.field_value_text);
      const cacheKey = `${contract.entity_id}_${contract.field_name}`;
      
      // Check cache for compiled schema
      let validate = this.contractCache.get(cacheKey);
      if (!validate) {
        validate = this.ajv.compile(schema);
        this.contractCache.set(cacheKey, validate);
      }

      const valid = validate(data);
      
      if (valid) {
        return {
          valid: true,
          validatedData: data,
          contractVersion: contract.metadata?.version,
          validatedAt: new Date().toISOString()
        };
      } else {
        return {
          valid: false,
          errors: this.formatErrors(validate.errors || []),
          contractVersion: contract.metadata?.version
        };
      }

    } catch (error) {
      return {
        valid: false,
        errors: [{ 
          message: `Schema validation error: ${error.message}`,
          code: 'SCHEMA_ERROR'
        }]
      };
    }
  }

  private async getContract(entityId: string, fieldName: string): Promise<any | null> {
    try {
      universalApi.setOrganizationId(this.organizationId);
      
      const dynamicData = await universalApi.queryDynamicData({
        filters: {
          entity_id: entityId,
          field_name: fieldName,
          organization_id: this.organizationId
        }
      });

      return dynamicData.data?.[0] || null;

    } catch (error) {
      console.error(`Failed to get contract ${fieldName} for entity ${entityId}:`, error);
      return null;
    }
  }

  private async getPolicy(playbookId: string, policyType: string): Promise<any | null> {
    try {
      return await this.getContract(playbookId, policyType);
    } catch (error) {
      console.error(`Failed to get policy ${policyType} for playbook ${playbookId}:`, error);
      return null;
    }
  }

  private formatErrors(ajvErrors: ErrorObject[]): ValidationError[] {
    return ajvErrors.map(error => ({
      path: error.instancePath || error.schemaPath,
      message: error.message || 'Validation error',
      value: error.data,
      schema: error.schema,
      code: error.keyword?.toUpperCase()
    }));
  }

  private adjustForBusinessHours(
    allowedMinutes: number,
    startTime: string,
    endTime: string
  ): number {
    // Simplified business hours calculation
    // In production, this would use proper business calendar logic
    const businessHoursPerDay = 8; // 9 AM to 5 PM
    const totalHoursPerDay = 24;
    const businessRatio = businessHoursPerDay / totalHoursPerDay;
    
    return allowedMinutes / businessRatio;
  }

  private addCustomKeywords(): void {
    // Add custom keyword for business rule validation
    this.ajv.addKeyword({
      keyword: 'businessRule',
      type: 'object',
      schemaType: 'string',
      compile: (rule: string) => {
        return (data: any) => {
          // Custom business rule validation logic
          switch (rule) {
            case 'budget_total_equals_amount':
              if (data.budget_breakdown && data.amount_requested) {
                const total = Object.values(data.budget_breakdown).reduce((sum: number, val: any) => sum + (val || 0), 0);
                return Math.abs(total - data.amount_requested) < 0.01;
              }
              return true;
            
            case 'project_duration_reasonable':
              return !data.project_duration_months || (data.project_duration_months >= 6 && data.project_duration_months <= 36);
              
            default:
              return true;
          }
        };
      }
    });

    // Add keyword for smart code validation
    this.ajv.addKeyword({
      keyword: 'smartCode',
      type: 'string',
      schemaType: 'object',
      compile: (schema: any) => {
        return (data: string) => {
          if (!data) return false;
          
          const pattern = schema.pattern || /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z_]+\.V\d+$/;
          return pattern.test(data);
        };
      }
    });
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.contractCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.contractCache.size,
      keys: Array.from(this.contractCache.keys())
    };
  }
}

/**
 * Factory function to create validation service
 */
export function createContractValidationService(organizationId: string): ContractValidationService {
  return new ContractValidationService(organizationId);
}