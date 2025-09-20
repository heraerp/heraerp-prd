/**
 * HERA Playbooks Human Worker Handler
 * 
 * Handles human task assignment, notifications, role-based access control,
 * and approval workflows with time tracking and performance measurement.
 */

import { universalApi } from '@/lib/universal-api';
import { ExecutionResult } from '../playbook-orchestrator-daemon';
import { PlaybookSmartCodes } from '../../smart-codes/playbook-smart-codes';

export interface HumanStepRequest {
  step_id: string;
  step_name: string;
  step_type: 'human';
  worker_type: string;
  input_data: Record<string, any>;
  metadata: Record<string, any>;
  run_context: {
    run_id: string;
    playbook_id: string;
    organization_id: string;
    execution_context: Record<string, any>;
  };
}

export interface HumanTaskAssignment {
  task_id: string;
  step_id: string;
  assigned_to: string | null;
  assigned_role: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'escalated';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date: string;
  estimated_duration_minutes: number;
  created_at: string;
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface HumanWorkerConfig {
  assignment_strategy: 'round_robin' | 'skill_based' | 'workload_balanced' | 'manual';
  auto_assignment_enabled: boolean;
  escalation_timeout_minutes: number;
  notification_channels: string[];
  approval_threshold: number;
  max_concurrent_tasks_per_user: number;
  skill_matching_enabled: boolean;
}

/**
 * HumanWorkerHandler - Human task management and workflow orchestration
 */
export class HumanWorkerHandler {
  private config: HumanWorkerConfig;
  private pendingTasks = new Map<string, HumanTaskAssignment>();
  private activeTasks = new Map<string, HumanTaskAssignment>();

  constructor(config?: Partial<HumanWorkerConfig>) {
    this.config = {
      assignment_strategy: 'skill_based',
      auto_assignment_enabled: true,
      escalation_timeout_minutes: 60,
      notification_channels: ['email', 'in_app'],
      approval_threshold: 1,
      max_concurrent_tasks_per_user: 5,
      skill_matching_enabled: true,
      ...config
    };
  }

  /**
   * Execute human step - creates task assignment and manages workflow
   */
  async executeStep(request: HumanStepRequest): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      console.log(`Human worker processing: ${request.step_name} (${request.worker_type})`);

      // Set organization context
      universalApi.setOrganizationId(request.run_context.organization_id);

      // Create human task assignment
      const taskAssignment = await this.createTaskAssignment(request);

      // Handle different human worker types
      const result = await this.routeToHumanWorker(request, taskAssignment);

      return {
        success: true,
        output_data: result.output_data,
        duration_ms: Date.now() - startTime,
        worker_info: {
          worker_id: `human-${taskAssignment.task_id}`,
          worker_type: request.worker_type
        }
      };

    } catch (error) {
      console.error(`Human worker error for ${request.step_name}:`, error);

      return {
        success: false,
        error: {
          code: this.categorizeError(error),
          message: error instanceof Error ? error.message : 'Unknown human workflow error',
          details: {
            worker_type: request.worker_type,
            step_name: request.step_name
          },
          recoverable: true // Human errors are generally recoverable
        },
        duration_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Create task assignment in HERA universal tables
   */
  private async createTaskAssignment(request: HumanStepRequest): Promise<HumanTaskAssignment> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const requiredRoles = request.metadata.required_roles || ['user'];
    const priority = this.determinePriority(request);
    const estimatedDuration = request.metadata.estimated_duration_minutes || 30;
    
    // Create task as universal_transaction
    const taskTransaction = await universalApi.createTransaction({
      transaction_type: 'human_task',
      smart_code: PlaybookSmartCodes.forHumanTask(request.worker_type),
      subject_entity_id: request.step_id,
      total_amount: estimatedDuration, // Store duration as amount
      organization_id: request.run_context.organization_id,
      metadata: {
        task_id: taskId,
        step_name: request.step_name,
        worker_type: request.worker_type,
        required_roles: requiredRoles,
        priority,
        status: 'pending',
        assignment_strategy: this.config.assignment_strategy,
        auto_assignment_enabled: this.config.auto_assignment_enabled,
        escalation_timeout_minutes: this.config.escalation_timeout_minutes,
        run_context: request.run_context,
        input_data: request.input_data,
        task_instructions: request.metadata.description || `Complete: ${request.step_name}`,
        business_rules: request.metadata.business_rules || [],
        created_at: new Date().toISOString(),
        due_date: new Date(Date.now() + estimatedDuration * 60 * 1000).toISOString()
      }
    });

    const taskAssignment: HumanTaskAssignment = {
      task_id: taskId,
      step_id: request.step_id,
      assigned_to: null,
      assigned_role: requiredRoles[0],
      status: 'pending',
      priority,
      due_date: new Date(Date.now() + estimatedDuration * 60 * 1000).toISOString(),
      estimated_duration_minutes: estimatedDuration,
      created_at: new Date().toISOString()
    };

    this.pendingTasks.set(taskId, taskAssignment);

    // Attempt auto-assignment if enabled
    if (this.config.auto_assignment_enabled) {
      await this.attemptAutoAssignment(taskAssignment, requiredRoles);
    }

    // Send notifications
    await this.sendTaskNotifications(taskAssignment, 'task_created');

    return taskAssignment;
  }

  /**
   * Route to specific human worker implementation
   */
  private async routeToHumanWorker(
    request: HumanStepRequest, 
    taskAssignment: HumanTaskAssignment
  ): Promise<{ output_data: Record<string, any> }> {
    
    switch (request.worker_type) {
      case 'approval_manager':
        return await this.executeApprovalManager(request, taskAssignment);
      
      case 'document_reviewer':
        return await this.executeDocumentReviewer(request, taskAssignment);
      
      case 'data_entry_specialist':
        return await this.executeDataEntrySpecialist(request, taskAssignment);
      
      case 'quality_inspector':
        return await this.executeQualityInspector(request, taskAssignment);
      
      case 'customer_service_rep':
        return await this.executeCustomerServiceRep(request, taskAssignment);
      
      case 'financial_analyst':
        return await this.executeFinancialAnalyst(request, taskAssignment);
      
      case 'project_manager':
        return await this.executeProjectManager(request, taskAssignment);
      
      default:
        return await this.executeGenericHumanTask(request, taskAssignment);
    }
  }

  /**
   * Approval manager workflow
   */
  private async executeApprovalManager(
    request: HumanStepRequest, 
    taskAssignment: HumanTaskAssignment
  ): Promise<{ output_data: Record<string, any> }> {
    
    const approvalRequest = {
      approval_type: request.metadata.approval_type || 'general',
      approval_amount: request.input_data.amount || 0,
      approval_reason: request.input_data.reason || 'Workflow approval required',
      requires_approvals: this.config.approval_threshold,
      approval_deadline: taskAssignment.due_date,
      escalation_path: request.metadata.escalation_path || []
    };

    // Create approval workflow
    const approvalWorkflow = await this.createApprovalWorkflow(approvalRequest, taskAssignment);

    return {
      output_data: {
        task_created: true,
        task_id: taskAssignment.task_id,
        approval_workflow: approvalWorkflow,
        assignment_status: taskAssignment.status,
        estimated_completion: taskAssignment.due_date,
        notification_sent: true,
        workflow_type: 'approval_manager',
        tracking_url: `/tasks/${taskAssignment.task_id}`
      }
    };
  }

  /**
   * Document reviewer workflow
   */
  private async executeDocumentReviewer(
    request: HumanStepRequest, 
    taskAssignment: HumanTaskAssignment
  ): Promise<{ output_data: Record<string, any> }> {
    
    const documents = request.input_data.documents || [];
    const reviewCriteria = request.metadata.review_criteria || ['completeness', 'accuracy', 'compliance'];

    // Create document review checklist
    const reviewChecklist = await this.createDocumentReviewChecklist(documents, reviewCriteria);

    return {
      output_data: {
        task_created: true,
        task_id: taskAssignment.task_id,
        documents_count: documents.length,
        review_checklist: reviewChecklist,
        assignment_status: taskAssignment.status,
        estimated_completion: taskAssignment.due_date,
        workflow_type: 'document_reviewer',
        tracking_url: `/tasks/${taskAssignment.task_id}`
      }
    };
  }

  /**
   * Data entry specialist workflow
   */
  private async executeDataEntrySpecialist(
    request: HumanStepRequest, 
    taskAssignment: HumanTaskAssignment
  ): Promise<{ output_data: Record<string, any> }> {
    
    const dataTemplate = request.metadata.data_template || {};
    const validationRules = request.metadata.validation_rules || [];
    const requiredFields = request.metadata.required_fields || [];

    // Create data entry form
    const dataEntryForm = await this.createDataEntryForm(dataTemplate, validationRules, requiredFields);

    return {
      output_data: {
        task_created: true,
        task_id: taskAssignment.task_id,
        data_entry_form: dataEntryForm,
        required_fields_count: requiredFields.length,
        validation_rules_count: validationRules.length,
        assignment_status: taskAssignment.status,
        estimated_completion: taskAssignment.due_date,
        workflow_type: 'data_entry_specialist',
        tracking_url: `/tasks/${taskAssignment.task_id}`
      }
    };
  }

  /**
   * Generic human task workflow
   */
  private async executeGenericHumanTask(
    request: HumanStepRequest, 
    taskAssignment: HumanTaskAssignment
  ): Promise<{ output_data: Record<string, any> }> {
    
    console.log(`Creating generic human task: ${request.worker_type}`);

    // Create basic task structure
    const taskStructure = {
      instructions: request.metadata.description || `Complete: ${request.step_name}`,
      input_data: request.input_data,
      business_rules: request.metadata.business_rules || [],
      estimated_duration: taskAssignment.estimated_duration_minutes,
      required_skills: request.metadata.required_skills || [],
      priority: taskAssignment.priority
    };

    return {
      output_data: {
        task_created: true,
        task_id: taskAssignment.task_id,
        task_structure: taskStructure,
        assignment_status: taskAssignment.status,
        estimated_completion: taskAssignment.due_date,
        workflow_type: request.worker_type,
        tracking_url: `/tasks/${taskAssignment.task_id}`
      }
    };
  }

  // Helper methods

  private determinePriority(request: HumanStepRequest): 'low' | 'normal' | 'high' | 'urgent' {
    const runPriority = request.run_context.execution_context?.priority;
    const stepPriority = request.metadata.priority;
    
    if (stepPriority === 'urgent' || runPriority === 'critical') return 'urgent';
    if (stepPriority === 'high' || runPriority === 'high') return 'high';
    if (stepPriority === 'low' || runPriority === 'low') return 'low';
    
    return 'normal';
  }

  private async attemptAutoAssignment(
    taskAssignment: HumanTaskAssignment, 
    requiredRoles: string[]
  ): Promise<void> {
    
    // Find eligible users based on roles and workload
    const eligibleUsers = await this.findEligibleUsers(requiredRoles, taskAssignment);
    
    if (eligibleUsers.length > 0) {
      let selectedUser;
      
      switch (this.config.assignment_strategy) {
        case 'round_robin':
          selectedUser = await this.selectUserRoundRobin(eligibleUsers);
          break;
        case 'skill_based':
          selectedUser = await this.selectUserBySkill(eligibleUsers, taskAssignment);
          break;
        case 'workload_balanced':
          selectedUser = await this.selectUserByWorkload(eligibleUsers);
          break;
        default:
          selectedUser = eligibleUsers[0];
      }
      
      if (selectedUser) {
        await this.assignTaskToUser(taskAssignment, selectedUser);
      }
    }
  }

  private async findEligibleUsers(requiredRoles: string[], taskAssignment: HumanTaskAssignment): Promise<any[]> {
    // Query users with required roles
    const usersResult = await universalApi.queryEntities({
      filters: {
        entity_type: 'user',
        // Note: In production, this would filter by role relationships
        status: 'active'
      },
      limit: 50
    });

    // Filter by role compatibility and workload
    const eligibleUsers = [];
    
    for (const user of usersResult.data) {
      const userRoles = user.metadata?.roles || [];
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (hasRequiredRole) {
        const currentWorkload = await this.getUserCurrentWorkload(user.id);
        if (currentWorkload < this.config.max_concurrent_tasks_per_user) {
          eligibleUsers.push({
            ...user,
            current_workload: currentWorkload
          });
        }
      }
    }

    return eligibleUsers;
  }

  private async selectUserRoundRobin(users: any[]): Promise<any> {
    // Simple round-robin selection (would use persistent state in production)
    return users[0];
  }

  private async selectUserBySkill(users: any[], taskAssignment: HumanTaskAssignment): Promise<any> {
    // Score users by skill match
    const scoredUsers = users.map(user => {
      const userSkills = user.metadata?.skills || [];
      const requiredSkills = taskAssignment.step_id || []; // Would get from step metadata
      
      const skillScore = this.calculateSkillMatch(userSkills, requiredSkills);
      
      return {
        ...user,
        skill_score: skillScore
      };
    });

    // Sort by skill score and select highest
    scoredUsers.sort((a, b) => b.skill_score - a.skill_score);
    return scoredUsers[0];
  }

  private async selectUserByWorkload(users: any[]): Promise<any> {
    // Select user with lowest current workload
    users.sort((a, b) => a.current_workload - b.current_workload);
    return users[0];
  }

  private async assignTaskToUser(taskAssignment: HumanTaskAssignment, user: any): Promise<void> {
    taskAssignment.assigned_to = user.id;
    taskAssignment.status = 'assigned';
    taskAssignment.assigned_at = new Date().toISOString();
    
    // Move from pending to active
    this.pendingTasks.delete(taskAssignment.task_id);
    this.activeTasks.set(taskAssignment.task_id, taskAssignment);
    
    // Update in database
    await this.updateTaskAssignment(taskAssignment);
    
    // Send assignment notification
    await this.sendTaskNotifications(taskAssignment, 'task_assigned');
  }

  private async getUserCurrentWorkload(userId: string): Promise<number> {
    const activeTasksResult = await universalApi.queryTransactions({
      filters: {
        transaction_type: 'human_task',
        'metadata->>assigned_to': userId,
        'metadata->>status': ['assigned', 'in_progress']
      }
    });

    return activeTasksResult.data.length;
  }

  private calculateSkillMatch(userSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 50; // Neutral score
    
    const matchCount = requiredSkills.filter(skill => userSkills.includes(skill)).length;
    return (matchCount / requiredSkills.length) * 100;
  }

  private async createApprovalWorkflow(
    approvalRequest: any, 
    taskAssignment: HumanTaskAssignment
  ): Promise<any> {
    
    return {
      approval_id: `approval_${taskAssignment.task_id}`,
      approval_type: approvalRequest.approval_type,
      requires_approvals: approvalRequest.requires_approvals,
      current_approvals: 0,
      approval_status: 'pending',
      approvers: [],
      approval_deadline: approvalRequest.approval_deadline,
      created_at: new Date().toISOString()
    };
  }

  private async createDocumentReviewChecklist(documents: any[], criteria: string[]): Promise<any> {
    return {
      checklist_id: `checklist_${Date.now()}`,
      documents: documents.map(doc => ({
        document_id: doc.id || doc.name,
        document_name: doc.name,
        review_status: 'pending',
        criteria_checklist: criteria.map(criterion => ({
          criterion,
          status: 'pending',
          comments: ''
        }))
      })),
      overall_status: 'pending',
      created_at: new Date().toISOString()
    };
  }

  private async createDataEntryForm(template: any, validationRules: any[], requiredFields: string[]): Promise<any> {
    return {
      form_id: `form_${Date.now()}`,
      template,
      fields: Object.keys(template).map(fieldName => ({
        field_name: fieldName,
        field_type: template[fieldName].type || 'text',
        required: requiredFields.includes(fieldName),
        validation_rules: validationRules.filter(rule => rule.field === fieldName),
        current_value: null
      })),
      completion_status: 'pending',
      created_at: new Date().toISOString()
    };
  }

  private async updateTaskAssignment(taskAssignment: HumanTaskAssignment): Promise<void> {
    // Update the task transaction in database
    const taskResult = await universalApi.queryTransactions({
      filters: {
        transaction_type: 'human_task',
        'metadata->>task_id': taskAssignment.task_id
      },
      limit: 1
    });

    if (taskResult.data.length > 0) {
      const taskTransaction = taskResult.data[0];
      await universalApi.updateTransaction(taskTransaction.id, {
        metadata: {
          ...taskTransaction.metadata,
          assigned_to: taskAssignment.assigned_to,
          status: taskAssignment.status,
          assigned_at: taskAssignment.assigned_at,
          updated_at: new Date().toISOString()
        }
      });
    }
  }

  private async sendTaskNotifications(taskAssignment: HumanTaskAssignment, eventType: string): Promise<void> {
    console.log(`Sending ${eventType} notification for task ${taskAssignment.task_id}`);
    
    // Create notification record
    await universalApi.createTransaction({
      transaction_type: 'notification',
      smart_code: PlaybookSmartCodes.forNotification(eventType),
      subject_entity_id: taskAssignment.step_id,
      total_amount: 1,
      metadata: {
        notification_type: eventType,
        task_id: taskAssignment.task_id,
        recipient: taskAssignment.assigned_to || 'role_based',
        channels: this.config.notification_channels,
        message: this.generateNotificationMessage(taskAssignment, eventType),
        sent_at: new Date().toISOString()
      }
    });
  }

  private generateNotificationMessage(taskAssignment: HumanTaskAssignment, eventType: string): string {
    switch (eventType) {
      case 'task_created':
        return `New task created: ${taskAssignment.step_id} (Priority: ${taskAssignment.priority})`;
      case 'task_assigned':
        return `Task assigned to you: ${taskAssignment.step_id} (Due: ${taskAssignment.due_date})`;
      case 'task_escalated':
        return `Task escalated: ${taskAssignment.step_id} (Overdue)`;
      default:
        return `Task update: ${taskAssignment.step_id}`;
    }
  }

  private categorizeError(error: any): string {
    if (error.message?.includes('assignment')) return 'ASSIGNMENT_ERROR';
    if (error.message?.includes('permission')) return 'PERMISSION_ERROR';
    if (error.message?.includes('notification')) return 'NOTIFICATION_ERROR';
    if (error.message?.includes('workload')) return 'WORKLOAD_ERROR';
    return 'HUMAN_WORKFLOW_ERROR';
  }

  // Additional worker type handlers

  private async executeQualityInspector(request: HumanStepRequest, taskAssignment: HumanTaskAssignment): Promise<{ output_data: Record<string, any> }> {
    return { output_data: { task_created: true, task_id: taskAssignment.task_id, workflow_type: 'quality_inspector' } };
  }

  private async executeCustomerServiceRep(request: HumanStepRequest, taskAssignment: HumanTaskAssignment): Promise<{ output_data: Record<string, any> }> {
    return { output_data: { task_created: true, task_id: taskAssignment.task_id, workflow_type: 'customer_service_rep' } };
  }

  private async executeFinancialAnalyst(request: HumanStepRequest, taskAssignment: HumanTaskAssignment): Promise<{ output_data: Record<string, any> }> {
    return { output_data: { task_created: true, task_id: taskAssignment.task_id, workflow_type: 'financial_analyst' } };
  }

  private async executeProjectManager(request: HumanStepRequest, taskAssignment: HumanTaskAssignment): Promise<{ output_data: Record<string, any> }> {
    return { output_data: { task_created: true, task_id: taskAssignment.task_id, workflow_type: 'project_manager' } };
  }

  /**
   * Get worker status and metrics
   */
  getWorkerStatus(): {
    pending_tasks: number;
    active_tasks: number;
    config: HumanWorkerConfig;
    assignment_metrics: {
      auto_assignment_rate: number;
      avg_assignment_time_minutes: number;
    };
  } {
    return {
      pending_tasks: this.pendingTasks.size,
      active_tasks: this.activeTasks.size,
      config: this.config,
      assignment_metrics: {
        auto_assignment_rate: 75, // Would calculate from historical data
        avg_assignment_time_minutes: 15 // Would calculate from historical data
      }
    };
  }
}