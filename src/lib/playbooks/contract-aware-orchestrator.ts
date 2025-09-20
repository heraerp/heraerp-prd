/**
 * Contract-Aware Playbook Orchestrator
 * 
 * Enhanced orchestrator that validates data contracts and enforces
 * policies at every step of playbook execution using HERA's
 * dynamic data storage for contract definitions.
 */

import { PlaybookOrchestrator } from './orchestrator';
import { ContractValidationService, ValidationResult, PolicyValidationResult } from './contract-validation';
import { universalApi } from '@/lib/universal-api';
import type { WorkerResult } from './orchestrator';

export interface ContractValidationMetrics {
  input_validation: ValidationResult;
  output_validation?: ValidationResult;
  policy_validations: {
    sla: PolicyValidationResult;
    quorum?: PolicyValidationResult;
    segregation: PolicyValidationResult;
    approval?: PolicyValidationResult;
    retry?: PolicyValidationResult;
  };
  total_validation_time_ms: number;
  contract_compliance_score: number;
}

export interface EnhancedWorkerResult extends WorkerResult {
  contract_compliance?: ContractValidationMetrics;
  policy_violations?: string[];
  validation_warnings?: string[];
}

/**
 * Contract-Aware Orchestrator with full validation and policy enforcement
 */
export class ContractAwareOrchestrator extends PlaybookOrchestrator {
  private validationService: ContractValidationService;
  private validationMetrics: Map<string, ContractValidationMetrics> = new Map();

  constructor(organizationId: string) {
    super(organizationId);
    this.validationService = new ContractValidationService(organizationId);
  }

  /**
   * Start playbook run with input contract validation
   */
  async startRun(
    playbookId: string,
    inputs: any,
    options: {
      correlationId?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      subjectEntityId?: string;
    } = {}
  ): Promise<string> {
    const validationStart = Date.now();
    
    try {
      // 1. Validate playbook input contract
      const inputValidation = await this.validationService.validatePlaybookInput(
        playbookId,
        inputs
      );

      if (!inputValidation.valid) {
        throw new Error(
          `Playbook input validation failed: ${inputValidation.errors?.map(e => e.message).join(', ')}`
        );
      }

      // 2. Validate approval policy for run initiation
      const approvalValidation = await this.validationService.validateApprovalPolicy(
        playbookId,
        {
          amount: inputs.amount_requested,
          riskLevel: this.assessInputRiskLevel(inputs),
          specialCircumstances: inputs.special_circumstances
        }
      );

      if (!approvalValidation.compliant && approvalValidation.severity === 'critical') {
        throw new Error(`Approval policy violation: ${approvalValidation.message}`);
      }

      // 3. Create run with validated inputs
      const runId = await super.startRun(playbookId, inputValidation.validatedData!, options);

      // 4. Store validation metrics
      const validationTime = Date.now() - validationStart;
      const complianceMetrics: ContractValidationMetrics = {
        input_validation: inputValidation,
        policy_validations: {
          sla: { compliant: true, message: "Run initiated - SLA tracking started", severity: 'info' },
          segregation: { compliant: true, message: "No segregation conflicts at run start", severity: 'info' },
          approval: approvalValidation
        },
        total_validation_time_ms: validationTime,
        contract_compliance_score: this.calculateComplianceScore([inputValidation], [approvalValidation])
      };

      this.validationMetrics.set(runId, complianceMetrics);

      // 5. Log compliance audit event
      await this.logComplianceEvent(runId, 'run_started', complianceMetrics);

      return runId;

    } catch (error) {
      // Log validation failure
      await this.logComplianceEvent('unknown', 'validation_failed', {
        error: error.message,
        validation_time_ms: Date.now() - validationStart
      });
      throw error;
    }
  }

  /**
   * Execute step with comprehensive contract and policy validation
   */
  protected async executeStep(
    runId: string,
    stepId: string,
    stepDef: any,
    inputs: any
  ): Promise<EnhancedWorkerResult> {
    const validationStart = Date.now();
    let validationMetrics: ContractValidationMetrics | undefined;

    try {
      // 1. Pre-execution validation
      const preValidation = await this.performPreExecutionValidation(
        runId,
        stepId,
        stepDef,
        inputs
      );

      if (preValidation.hasBlockingViolations) {
        return {
          status: 'failed',
          error: `Pre-execution validation failed: ${preValidation.blockingReasons.join(', ')}`,
          duration_ms: Date.now() - validationStart,
          ai_confidence: 0.1,
          ai_insights: 'Step blocked by validation failures',
          contract_compliance: preValidation.metrics,
          policy_violations: preValidation.blockingReasons,
          validation_warnings: preValidation.warnings
        };
      }

      // 2. Execute step with validated inputs
      const stepResult = await super.executeStep(
        runId,
        stepId,
        stepDef,
        preValidation.validatedInputs
      );

      // 3. Post-execution validation (if step completed successfully)
      if (stepResult.status === 'completed' && stepResult.outputs) {
        const postValidation = await this.performPostExecutionValidation(
          stepId,
          stepDef,
          stepResult.outputs,
          preValidation.metrics
        );

        if (!postValidation.outputValidation.valid) {
          return {
            ...stepResult,
            status: 'failed',
            error: `Output validation failed: ${postValidation.outputValidation.errors?.map(e => e.message).join(', ')}`,
            contract_compliance: postValidation.metrics,
            validation_warnings: ['Output contract validation failed after successful execution']
          };
        }

        validationMetrics = postValidation.metrics;
        stepResult.outputs = postValidation.outputValidation.validatedData;
      } else {
        validationMetrics = preValidation.metrics;
      }

      // 4. Update global validation metrics
      this.updateValidationMetrics(runId, validationMetrics);

      // 5. Log compliance event
      await this.logComplianceEvent(runId, 'step_executed', {
        step_id: stepId,
        step_name: stepDef.metadata?.step_name,
        validation_metrics: validationMetrics
      });

      return {
        ...stepResult,
        contract_compliance: validationMetrics,
        validation_warnings: preValidation.warnings
      };

    } catch (error) {
      // Log validation error
      await this.logComplianceEvent(runId, 'step_validation_error', {
        step_id: stepId,
        error: error.message,
        validation_time_ms: Date.now() - validationStart
      });

      return {
        status: 'failed',
        error: error.message,
        duration_ms: Date.now() - validationStart,
        ai_confidence: 0.1,
        ai_insights: `Step execution failed: ${error.message}`,
        contract_compliance: validationMetrics
      };
    }
  }

  /**
   * Complete playbook run with output contract validation
   */
  async completeRun(
    runId: string,
    finalOutputs: any
  ): Promise<{ success: boolean; validationResults?: ValidationResult }> {
    try {
      // Get run details
      const run = await universalApi.getTransaction(runId);
      const playbookId = run.reference_entity_id;

      // Validate final outputs against playbook output contract
      const outputValidation = await this.validationService.validatePlaybookOutput(
        playbookId,
        finalOutputs
      );

      if (!outputValidation.valid) {
        // Update run status to failed due to output validation
        await universalApi.updateTransaction(runId, {
          status: 'failed',
          metadata: {
            ...run.metadata,
            completion_error: 'Output contract validation failed',
            output_validation_errors: outputValidation.errors,
            completed_at: new Date().toISOString()
          }
        });

        return {
          success: false,
          validationResults: outputValidation
        };
      }

      // Complete run successfully
      await super.completeRun(runId, outputValidation.validatedData!);

      // Log final compliance metrics
      const finalMetrics = this.validationMetrics.get(runId);
      await this.logComplianceEvent(runId, 'run_completed', {
        final_outputs_validated: true,
        compliance_metrics: finalMetrics
      });

      return {
        success: true,
        validationResults: outputValidation
      };

    } catch (error) {
      await this.logComplianceEvent(runId, 'run_completion_failed', {
        error: error.message
      });
      throw error;
    }
  }

  // Private validation methods

  private async performPreExecutionValidation(
    runId: string,
    stepId: string,
    stepDef: any,
    inputs: any
  ): Promise<{
    validatedInputs: any;
    metrics: ContractValidationMetrics;
    hasBlockingViolations: boolean;
    blockingReasons: string[];
    warnings: string[];
  }> {
    const validationStart = Date.now();
    const warnings: string[] = [];
    const blockingReasons: string[] = [];

    // 1. Validate step input contract
    const inputValidation = await this.validationService.validateStepInput(stepId, inputs);
    
    if (!inputValidation.valid) {
      blockingReasons.push(`Input validation: ${inputValidation.errors?.map(e => e.message).join(', ')}`);
    }

    // 2. Get run context for policy validation
    const runContext = await this.getRunContext(runId, stepDef);

    // 3. Validate SLA policy
    const slaValidation = await this.validationService.validateSLAPolicy(
      stepDef.metadata.playbook_id,
      {
        stepName: stepDef.metadata.step_name,
        startTime: inputs.step_started_at || new Date().toISOString(),
        businessHoursOnly: runContext.businessHoursOnly
      }
    );

    if (!slaValidation.compliant && slaValidation.severity === 'critical') {
      blockingReasons.push(`SLA violation: ${slaValidation.message}`);
    } else if (!slaValidation.compliant) {
      warnings.push(`SLA warning: ${slaValidation.message}`);
    }

    // 4. Validate segregation of duties
    const segregationValidation = await this.validationService.validateSegregationPolicy(
      stepDef.metadata.playbook_id,
      {
        stepName: stepDef.metadata.step_name,
        currentUserId: runContext.currentUserId,
        currentUserRoles: runContext.currentUserRoles,
        previousStepUsers: runContext.previousStepUsers,
        relationshipChecks: runContext.relationshipChecks
      }
    );

    if (!segregationValidation.compliant && segregationValidation.severity === 'critical') {
      blockingReasons.push(`Segregation violation: ${segregationValidation.message}`);
    }

    // 5. Validate quorum policy (for committee steps)
    let quorumValidation: PolicyValidationResult | undefined;
    if (stepDef.metadata.step_name === 'CommitteeReview') {
      quorumValidation = await this.validationService.validateQuorumPolicy(
        stepDef.metadata.playbook_id,
        {
          stepName: stepDef.metadata.step_name,
          voters: runContext.committeeMembers,
          votingWindowStart: runContext.votingWindowStart,
          conflictChecks: runContext.conflictChecks
        }
      );

      if (!quorumValidation.compliant && quorumValidation.severity === 'error') {
        blockingReasons.push(`Quorum violation: ${quorumValidation.message}`);
      }
    }

    // 6. Validate approval policy (for decision steps)
    let approvalValidation: PolicyValidationResult | undefined;
    if (['AwardDecision', 'ApprovalRequired'].includes(stepDef.metadata.step_name)) {
      approvalValidation = await this.validationService.validateApprovalPolicy(
        stepDef.metadata.playbook_id,
        {
          amount: inputs.amount_requested || runContext.transactionAmount,
          riskLevel: runContext.riskLevel,
          approvers: runContext.approvers,
          specialCircumstances: runContext.specialCircumstances
        }
      );

      if (!approvalValidation.compliant && approvalValidation.severity === 'critical') {
        blockingReasons.push(`Approval violation: ${approvalValidation.message}`);
      }
    }

    // 7. Build validation metrics
    const validationTime = Date.now() - validationStart;
    const metrics: ContractValidationMetrics = {
      input_validation: inputValidation,
      policy_validations: {
        sla: slaValidation,
        segregation: segregationValidation,
        ...(quorumValidation && { quorum: quorumValidation }),
        ...(approvalValidation && { approval: approvalValidation })
      },
      total_validation_time_ms: validationTime,
      contract_compliance_score: this.calculateComplianceScore(
        [inputValidation],
        [slaValidation, segregationValidation, quorumValidation, approvalValidation].filter(Boolean)
      )
    };

    return {
      validatedInputs: inputValidation.validatedData || inputs,
      metrics,
      hasBlockingViolations: blockingReasons.length > 0,
      blockingReasons,
      warnings
    };
  }

  private async performPostExecutionValidation(
    stepId: string,
    stepDef: any,
    outputs: any,
    preValidationMetrics: ContractValidationMetrics
  ): Promise<{
    outputValidation: ValidationResult;
    metrics: ContractValidationMetrics;
  }> {
    // Validate step output contract
    const outputValidation = await this.validationService.validateStepOutput(stepId, outputs);

    // Update metrics with output validation
    const metrics: ContractValidationMetrics = {
      ...preValidationMetrics,
      output_validation: outputValidation,
      contract_compliance_score: this.calculateComplianceScore(
        [preValidationMetrics.input_validation, outputValidation],
        Object.values(preValidationMetrics.policy_validations).filter(Boolean)
      )
    };

    return {
      outputValidation,
      metrics
    };
  }

  private async getRunContext(runId: string, stepDef: any): Promise<any> {
    // Get run transaction
    const run = await universalApi.getTransaction(runId);
    
    // Get previous step executions
    const stepExecutions = await universalApi.queryTransactionLines({
      transaction_id: runId,
      organization_id: this.organizationId
    });

    // Build context object with all necessary information for policy validation
    return {
      currentUserId: run.metadata?.current_user_id || 'system',
      currentUserRoles: run.metadata?.current_user_roles || [],
      businessHoursOnly: true, // Could be configured per organization
      transactionAmount: run.total_amount,
      riskLevel: this.assessRiskLevel(run),
      previousStepUsers: stepExecutions.data?.map(step => ({
        stepName: step.metadata?.step_name,
        userId: step.metadata?.executed_by,
        roles: step.metadata?.user_roles || []
      })) || [],
      committeeMembers: run.metadata?.committee_members || [],
      votingWindowStart: run.metadata?.voting_window_start,
      conflictChecks: run.metadata?.conflict_checks || [],
      approvers: run.metadata?.approvers || [],
      specialCircumstances: run.metadata?.special_circumstances || [],
      relationshipChecks: run.metadata?.relationship_checks || []
    };
  }

  private assessInputRiskLevel(inputs: any): 'low' | 'medium' | 'high' | 'critical' {
    // Simple risk assessment based on amount and other factors
    const amount = inputs.amount_requested || 0;
    
    if (amount > 75000) return 'high';
    if (amount > 25000) return 'medium';
    if (inputs.new_applicant) return 'medium';
    return 'low';
  }

  private assessRiskLevel(run: any): 'low' | 'medium' | 'high' | 'critical' {
    // Assess risk based on run characteristics
    const amount = run.total_amount || 0;
    const aiConfidence = run.ai_confidence || 1;
    
    if (amount > 75000 && aiConfidence < 0.7) return 'critical';
    if (amount > 50000 || aiConfidence < 0.8) return 'high';
    if (amount > 25000 || aiConfidence < 0.9) return 'medium';
    return 'low';
  }

  private calculateComplianceScore(
    validationResults: ValidationResult[],
    policyResults: PolicyValidationResult[]
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Contract validation score (weight: 40%)
    const validResults = validationResults.filter(r => r.valid);
    const contractScore = validResults.length / validationResults.length;
    totalScore += contractScore * 0.4;
    totalWeight += 0.4;

    // Policy compliance score (weight: 60%)
    if (policyResults.length > 0) {
      const compliantPolicies = policyResults.filter(p => p.compliant);
      const policyScore = compliantPolicies.length / policyResults.length;
      totalScore += policyScore * 0.6;
      totalWeight += 0.6;
    }

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  }

  private updateValidationMetrics(runId: string, stepMetrics: ContractValidationMetrics): void {
    const existingMetrics = this.validationMetrics.get(runId);
    
    if (existingMetrics) {
      // Aggregate metrics across all steps
      const aggregatedMetrics: ContractValidationMetrics = {
        input_validation: stepMetrics.input_validation,
        output_validation: stepMetrics.output_validation,
        policy_validations: stepMetrics.policy_validations,
        total_validation_time_ms: existingMetrics.total_validation_time_ms + stepMetrics.total_validation_time_ms,
        contract_compliance_score: Math.round(
          (existingMetrics.contract_compliance_score + stepMetrics.contract_compliance_score) / 2
        )
      };
      
      this.validationMetrics.set(runId, aggregatedMetrics);
    } else {
      this.validationMetrics.set(runId, stepMetrics);
    }
  }

  private async logComplianceEvent(
    runId: string,
    eventType: string,
    details: any
  ): Promise<void> {
    try {
      await universalApi.createTransaction({
        transaction_type: 'compliance_audit',
        transaction_code: `AUDIT-${eventType.toUpperCase()}-${Date.now()}`,
        smart_code: `HERA.PLAYBOOK.COMPLIANCE.${eventType.toUpperCase()}.V1`,
        organization_id: this.organizationId,
        reference_entity_id: runId,
        metadata: {
          event_type: eventType,
          timestamp: new Date().toISOString(),
          details
        }
      });
    } catch (error) {
      console.error('Failed to log compliance event:', error);
      // Don't throw - compliance logging should not break workflow
    }
  }

  /**
   * Get validation metrics for a run
   */
  getValidationMetrics(runId: string): ContractValidationMetrics | undefined {
    return this.validationMetrics.get(runId);
  }

  /**
   * Clear validation metrics (for cleanup)
   */
  clearValidationMetrics(runId: string): void {
    this.validationMetrics.delete(runId);
  }

  /**
   * Get validation service for direct access
   */
  getValidationService(): ContractValidationService {
    return this.validationService;
  }
}

/**
 * Factory function to create contract-aware orchestrator
 */
export function createContractAwareOrchestrator(organizationId: string): ContractAwareOrchestrator {
  return new ContractAwareOrchestrator(organizationId);
}