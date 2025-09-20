/**
 * HERA Playbooks Signal API
 * 
 * Implements POST /playbook-runs/{runId}/signal
 * Sends signals to playbook runs to trigger state transitions and wake up waiting steps.
 */
import { NextRequest, NextResponse } from 'next/server';
import { universalApi } from '@/lib/universal-api';
import { playbookAuthService } from '@/lib/playbooks/auth/playbook-auth';
import { PlaybookSmartCodes } from '@/lib/playbooks/smart-codes/playbook-smart-codes';

// Supported signal types
export type PlaybookSignalType = 
  | 'HUMAN_INPUT_READY'      // Human has provided required input
  | 'EXTERNAL_EVENT'          // External system event occurred
  | 'APPROVAL_GRANTED'        // Approval given for waiting step
  | 'APPROVAL_DENIED'         // Approval denied for waiting step
  | 'TIMEOUT_OVERRIDE'        // Override a timeout condition
  | 'CANCEL_REQUEST'          // Request to cancel run/step
  | 'PAUSE_REQUEST'           // Request to pause run
  | 'RESUME_REQUEST'          // Request to resume paused run
  | 'RETRY_REQUEST'           // Request to retry failed step
  | 'SKIP_REQUEST';           // Request to skip a step

interface SignalPayload {
  signal_type: PlaybookSignalType;
  target_step_sequence?: number;  // Optional: specific step to signal
  data?: Record<string, any>;      // Signal-specific data
  reason?: string;                 // Human-readable reason
}

export async function POST(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    // Extract auth
    const auth = await playbookAuthService.authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ 
        success: false, 
        error: auth.error 
      }, { status: 401 });
    }
    
    // Parse request body
    const body: SignalPayload = await request.json();
    const { signal_type, target_step_sequence, data, reason } = body;
    
    // Validate signal type
    const validSignals: PlaybookSignalType[] = [
      'HUMAN_INPUT_READY', 'EXTERNAL_EVENT', 'APPROVAL_GRANTED', 'APPROVAL_DENIED',
      'TIMEOUT_OVERRIDE', 'CANCEL_REQUEST', 'PAUSE_REQUEST', 'RESUME_REQUEST',
      'RETRY_REQUEST', 'SKIP_REQUEST'
    ];
    
    if (!validSignals.includes(signal_type)) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid signal type: ${signal_type}` 
      }, { status: 400 });
    }
    
    // Set organization context
    universalApi.setOrganizationId(auth.organizationId!);
    
    // Get the run header
    const runs = await universalApi.readTransactions({
      filters: {
        id: params.runId,
        transaction_type: 'playbook_run',
        organization_id: auth.organizationId!
      }
    });
    
    if (!runs || runs.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Playbook run not found' 
      }, { status: 404 });
    }
    
    const run = runs[0];
    
    // Check permission to send signals
    const hasPermission = await playbookAuthService.checkPermission(
      auth.userId!,
      auth.organizationId!,
      'PLAYBOOK_RUN_SIGNAL',
      { playbook_id: run.metadata?.playbook_id }
    );
    
    if (!hasPermission) {
      return NextResponse.json({ 
        success: false, 
        error: 'Permission denied' 
      }, { status: 403 });
    }
    
    // Create signal transaction
    const signalTransaction = await universalApi.createTransaction({
      transaction_type: 'playbook_signal',
      organization_id: auth.organizationId!,
      reference_entity_id: params.runId,
      smart_code: PlaybookSmartCodes.EXECUTION.SIGNAL,
      total_amount: 0,
      metadata: {
        run_id: params.runId,
        signal_type,
        target_step_sequence,
        data,
        reason,
        sent_by_user_id: auth.userId,
        sent_by_user_name: auth.userName,
        timestamp: new Date().toISOString()
      }
    });
    
    // Process signal based on type
    let processingResult;
    switch (signal_type) {
      case 'HUMAN_INPUT_READY':
        processingResult = await processHumanInputReady(
          params.runId, 
          target_step_sequence, 
          data,
          auth
        );
        break;
        
      case 'EXTERNAL_EVENT':
        processingResult = await processExternalEvent(
          params.runId,
          target_step_sequence,
          data,
          auth
        );
        break;
        
      case 'APPROVAL_GRANTED':
      case 'APPROVAL_DENIED':
        processingResult = await processApprovalSignal(
          params.runId,
          target_step_sequence,
          signal_type === 'APPROVAL_GRANTED',
          data,
          reason,
          auth
        );
        break;
        
      case 'CANCEL_REQUEST':
        processingResult = await processCancelRequest(
          params.runId,
          target_step_sequence,
          reason,
          auth
        );
        break;
        
      case 'PAUSE_REQUEST':
        processingResult = await processPauseRequest(
          params.runId,
          reason,
          auth
        );
        break;
        
      case 'RESUME_REQUEST':
        processingResult = await processResumeRequest(
          params.runId,
          auth
        );
        break;
        
      case 'RETRY_REQUEST':
        processingResult = await processRetryRequest(
          params.runId,
          target_step_sequence!,
          auth
        );
        break;
        
      case 'SKIP_REQUEST':
        processingResult = await processSkipRequest(
          params.runId,
          target_step_sequence!,
          reason,
          auth
        );
        break;
        
      default:
        processingResult = {
          success: false,
          message: 'Signal type not implemented'
        };
    }
    
    // Update signal transaction with processing result
    await universalApi.updateTransaction(signalTransaction.id, {
      metadata: {
        ...signalTransaction.metadata,
        processed: true,
        processing_result: processingResult,
        processed_at: new Date().toISOString()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Signal sent successfully',
      data: {
        signal_id: signalTransaction.id,
        signal_type,
        processing_result: processingResult
      }
    });
    
  } catch (error) {
    console.error('Failed to process signal:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

async function processHumanInputReady(
  runId: string,
  targetStepSequence: number | undefined,
  data: any,
  auth: any
): Promise<any> {
  // Find waiting step(s)
  const lines = await universalApi.readTransactionLines({
    transaction_id: runId,
    filters: targetStepSequence ? { line_number: targetStepSequence } : undefined
  });
  
  const waitingSteps = lines?.filter(
    l => l.metadata?.status === 'waiting_for_input' && 
         l.metadata?.step_type === 'human'
  ) || [];
  
  if (waitingSteps.length === 0) {
    return {
      success: false,
      message: 'No steps waiting for human input'
    };
  }
  
  // Process each waiting step
  const processed = [];
  for (const step of waitingSteps) {
    // Update step with input data
    await universalApi.updateTransactionLine(
      runId,
      step.line_number,
      {
        metadata: {
          ...step.metadata,
          status: 'ready',
          input_received: true,
          input_data: data,
          input_received_at: new Date().toISOString(),
          input_received_from: auth.userId
        }
      }
    );
    
    processed.push({
      step_sequence: step.line_number,
      step_name: step.metadata?.step_name
    });
  }
  
  return {
    success: true,
    message: `Input received for ${processed.length} step(s)`,
    processed_steps: processed
  };
}

async function processExternalEvent(
  runId: string,
  targetStepSequence: number | undefined,
  data: any,
  auth: any
): Promise<any> {
  // Find waiting external steps
  const lines = await universalApi.readTransactionLines({
    transaction_id: runId,
    filters: targetStepSequence ? { line_number: targetStepSequence } : undefined
  });
  
  const waitingSteps = lines?.filter(
    l => l.metadata?.status === 'waiting_for_signal' && 
         l.metadata?.step_type === 'external'
  ) || [];
  
  if (waitingSteps.length === 0) {
    return {
      success: false,
      message: 'No steps waiting for external event'
    };
  }
  
  // Process each waiting step
  const processed = [];
  for (const step of waitingSteps) {
    // Check if event matches expected pattern
    const expectedEvent = step.metadata?.wait_for_event;
    if (expectedEvent && data?.event_type !== expectedEvent) {
      continue; // Skip if event doesn't match
    }
    
    // Update step with event data
    await universalApi.updateTransactionLine(
      runId,
      step.line_number,
      {
        metadata: {
          ...step.metadata,
          status: 'ready',
          event_received: true,
          event_data: data,
          event_received_at: new Date().toISOString()
        }
      }
    );
    
    processed.push({
      step_sequence: step.line_number,
      step_name: step.metadata?.step_name
    });
  }
  
  return {
    success: true,
    message: `External event processed for ${processed.length} step(s)`,
    processed_steps: processed
  };
}

async function processApprovalSignal(
  runId: string,
  targetStepSequence: number | undefined,
  isApproved: boolean,
  data: any,
  reason: string | undefined,
  auth: any
): Promise<any> {
  if (!targetStepSequence) {
    return {
      success: false,
      message: 'Target step sequence required for approval signals'
    };
  }
  
  // Get the specific step
  const lines = await universalApi.readTransactionLines({
    transaction_id: runId,
    filters: { line_number: targetStepSequence }
  });
  
  if (!lines || lines.length === 0) {
    return {
      success: false,
      message: 'Step not found'
    };
  }
  
  const step = lines[0];
  if (step.metadata?.status !== 'waiting_for_approval') {
    return {
      success: false,
      message: 'Step is not waiting for approval'
    };
  }
  
  // Update step based on approval decision
  const newStatus = isApproved ? 'ready' : 'failed';
  await universalApi.updateTransactionLine(
    runId,
    targetStepSequence,
    {
      metadata: {
        ...step.metadata,
        status: newStatus,
        approval_received: true,
        approval_granted: isApproved,
        approval_reason: reason,
        approval_data: data,
        approved_by: auth.userId,
        approval_timestamp: new Date().toISOString()
      }
    }
  );
  
  return {
    success: true,
    message: `Approval ${isApproved ? 'granted' : 'denied'} for step ${targetStepSequence}`,
    step_name: step.metadata?.step_name,
    new_status: newStatus
  };
}

async function processCancelRequest(
  runId: string,
  targetStepSequence: number | undefined,
  reason: string | undefined,
  auth: any
): Promise<any> {
  if (targetStepSequence) {
    // Cancel specific step
    const lines = await universalApi.readTransactionLines({
      transaction_id: runId,
      filters: { line_number: targetStepSequence }
    });
    
    if (!lines || lines.length === 0) {
      return {
        success: false,
        message: 'Step not found'
      };
    }
    
    const step = lines[0];
    const cancelableStatuses = ['pending', 'ready', 'waiting_for_input', 'waiting_for_signal', 'waiting_for_approval'];
    
    if (!cancelableStatuses.includes(step.metadata?.status)) {
      return {
        success: false,
        message: `Cannot cancel step in status: ${step.metadata?.status}`
      };
    }
    
    await universalApi.updateTransactionLine(
      runId,
      targetStepSequence,
      {
        metadata: {
          ...step.metadata,
          status: 'cancelled',
          cancel_reason: reason,
          cancelled_by: auth.userId,
          cancelled_at: new Date().toISOString()
        }
      }
    );
    
    return {
      success: true,
      message: `Step ${targetStepSequence} cancelled`,
      step_name: step.metadata?.step_name
    };
  } else {
    // Cancel entire run
    const run = await universalApi.readTransactions({
      filters: { id: runId }
    });
    
    if (!run || run.length === 0) {
      return {
        success: false,
        message: 'Run not found'
      };
    }
    
    const currentStatus = run[0].metadata?.status;
    if (['completed', 'failed', 'cancelled'].includes(currentStatus)) {
      return {
        success: false,
        message: `Cannot cancel run in status: ${currentStatus}`
      };
    }
    
    // Update run status
    await universalApi.updateTransaction(runId, {
      metadata: {
        ...run[0].metadata,
        status: 'cancelled',
        cancel_reason: reason,
        cancelled_by: auth.userId,
        cancelled_at: new Date().toISOString()
      }
    });
    
    // Cancel all pending/active steps
    const allLines = await universalApi.readTransactionLines({
      transaction_id: runId
    });
    
    let cancelledCount = 0;
    for (const line of allLines || []) {
      const cancelableStatuses = ['pending', 'ready', 'waiting_for_input', 'waiting_for_signal', 'waiting_for_approval', 'in_progress'];
      if (cancelableStatuses.includes(line.metadata?.status)) {
        await universalApi.updateTransactionLine(
          runId,
          line.line_number,
          {
            metadata: {
              ...line.metadata,
              status: 'cancelled',
              cancel_reason: 'Run cancelled',
              cancelled_by: auth.userId,
              cancelled_at: new Date().toISOString()
            }
          }
        );
        cancelledCount++;
      }
    }
    
    return {
      success: true,
      message: 'Run cancelled',
      steps_cancelled: cancelledCount
    };
  }
}

async function processPauseRequest(
  runId: string,
  reason: string | undefined,
  auth: any
): Promise<any> {
  const run = await universalApi.readTransactions({
    filters: { id: runId }
  });
  
  if (!run || run.length === 0) {
    return {
      success: false,
      message: 'Run not found'
    };
  }
  
  const currentStatus = run[0].metadata?.status;
  if (currentStatus !== 'in_progress') {
    return {
      success: false,
      message: `Cannot pause run in status: ${currentStatus}`
    };
  }
  
  // Update run to paused
  await universalApi.updateTransaction(runId, {
    metadata: {
      ...run[0].metadata,
      status: 'paused',
      pause_reason: reason,
      paused_by: auth.userId,
      paused_at: new Date().toISOString()
    }
  });
  
  return {
    success: true,
    message: 'Run paused successfully'
  };
}

async function processResumeRequest(
  runId: string,
  auth: any
): Promise<any> {
  const run = await universalApi.readTransactions({
    filters: { id: runId }
  });
  
  if (!run || run.length === 0) {
    return {
      success: false,
      message: 'Run not found'
    };
  }
  
  const currentStatus = run[0].metadata?.status;
  if (currentStatus !== 'paused') {
    return {
      success: false,
      message: `Cannot resume run in status: ${currentStatus}`
    };
  }
  
  // Update run to in_progress
  await universalApi.updateTransaction(runId, {
    metadata: {
      ...run[0].metadata,
      status: 'in_progress',
      resumed_by: auth.userId,
      resumed_at: new Date().toISOString()
    }
  });
  
  return {
    success: true,
    message: 'Run resumed successfully'
  };
}

async function processRetryRequest(
  runId: string,
  targetStepSequence: number,
  auth: any
): Promise<any> {
  const lines = await universalApi.readTransactionLines({
    transaction_id: runId,
    filters: { line_number: targetStepSequence }
  });
  
  if (!lines || lines.length === 0) {
    return {
      success: false,
      message: 'Step not found'
    };
  }
  
  const step = lines[0];
  if (step.metadata?.status !== 'failed') {
    return {
      success: false,
      message: `Cannot retry step in status: ${step.metadata?.status}`
    };
  }
  
  // Reset step to ready for retry
  await universalApi.updateTransactionLine(
    runId,
    targetStepSequence,
    {
      metadata: {
        ...step.metadata,
        status: 'ready',
        retry_requested: true,
        retry_requested_by: auth.userId,
        retry_requested_at: new Date().toISOString(),
        retry_count: (step.metadata?.retry_count || 0) + 1
      }
    }
  );
  
  return {
    success: true,
    message: `Step ${targetStepSequence} queued for retry`,
    step_name: step.metadata?.step_name,
    retry_count: (step.metadata?.retry_count || 0) + 1
  };
}

async function processSkipRequest(
  runId: string,
  targetStepSequence: number,
  reason: string | undefined,
  auth: any
): Promise<any> {
  const lines = await universalApi.readTransactionLines({
    transaction_id: runId,
    filters: { line_number: targetStepSequence }
  });
  
  if (!lines || lines.length === 0) {
    return {
      success: false,
      message: 'Step not found'
    };
  }
  
  const step = lines[0];
  const skippableStatuses = ['pending', 'ready', 'waiting_for_input', 'waiting_for_signal', 'waiting_for_approval', 'failed'];
  
  if (!skippableStatuses.includes(step.metadata?.status)) {
    return {
      success: false,
      message: `Cannot skip step in status: ${step.metadata?.status}`
    };
  }
  
  // Check permission to skip
  const canSkip = await playbookAuthService.checkPermission(
    auth.userId!,
    auth.organizationId!,
    'PLAYBOOK_STEP_SKIP'
  );
  
  if (!canSkip && !step.metadata?.allow_skip) {
    return {
      success: false,
      message: 'Permission denied: Step cannot be skipped'
    };
  }
  
  // Update step to skipped
  await universalApi.updateTransactionLine(
    runId,
    targetStepSequence,
    {
      metadata: {
        ...step.metadata,
        status: 'skipped',
        skip_reason: reason,
        skipped_by: auth.userId,
        skipped_at: new Date().toISOString()
      }
    }
  );
  
  // Activate dependent steps
  await activateDependentSteps(runId, targetStepSequence, auth.organizationId!);
  
  return {
    success: true,
    message: `Step ${targetStepSequence} skipped`,
    step_name: step.metadata?.step_name
  };
}

async function activateDependentSteps(
  runId: string,
  completedSequence: number,
  organizationId: string
): Promise<void> {
  // Get all step lines for the run
  const allLines = await universalApi.readTransactionLines({
    transaction_id: runId
  });
  
  if (!allLines || allLines.length === 0) return;
  
  // Find steps that depend on the completed/skipped step
  for (const line of allLines) {
    const dependencies = line.metadata?.dependencies || [];
    const dependsOnCompleted = dependencies.some(
      (dep: any) => dep.step_sequence === completedSequence
    );
    
    if (dependsOnCompleted && line.metadata?.status === 'pending') {
      // Check if all dependencies are satisfied
      const allDependenciesMet = await checkAllDependencies(
        runId,
        line.line_number,
        dependencies,
        allLines
      );
      
      if (allDependenciesMet) {
        // Activate the step
        await universalApi.updateTransactionLine(
          runId,
          line.line_number,
          {
            metadata: {
              ...line.metadata,
              status: 'ready',
              activated_at: new Date().toISOString()
            }
          }
        );
      }
    }
  }
}

async function checkAllDependencies(
  runId: string,
  stepSequence: number,
  dependencies: any[],
  allLines: any[]
): Promise<boolean> {
  for (const dep of dependencies) {
    const depLine = allLines.find(l => l.line_number === dep.step_sequence);
    if (!depLine) return false;
    
    const depStatus = depLine.metadata?.status;
    
    // Check based on dependency type
    if (dep.dependency_type === 'completion') {
      if (!['completed', 'skipped'].includes(depStatus)) return false;
    } else if (dep.dependency_type === 'success') {
      if (depStatus !== 'completed') return false;
    } else if (dep.dependency_type === 'any') {
      if (!['completed', 'failed', 'cancelled', 'skipped'].includes(depStatus)) return false;
    }
  }
  
  return true;
}