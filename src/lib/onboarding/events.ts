/**
 * HERA Universal Onboarding - Event System
 * 
 * Emits universal transactions and lines for analytics
 * Follows HERA's 6-table architecture for audit trail
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  OnboardingTransaction,
  OnboardingTransactionLine,
  OnboardingStatus,
  SmartCode,
  EmitContext,
} from './types';

/**
 * Generate unique transaction ID
 */
function generateTransactionId(): string {
  return `txn_${uuidv4()}`;
}

/**
 * Generate unique line ID
 */
function generateLineId(): string {
  return `line_${uuidv4()}`;
}

/**
 * Get current ISO timestamp
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Build universal transaction header
 */
function buildTransaction(context: EmitContext): OnboardingTransaction {
  return {
    id: generateTransactionId(),
    organization_id: context.organizationId,
    smart_code: context.tourCode,
    occurred_at: getCurrentTimestamp(),
    ai_confidence: null, // Placeholder for future AI integration
    ai_insights: null, // Placeholder for future AI integration
    metadata: {
      ...context.metadata,
      event_type: 'onboarding',
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      screen_resolution: typeof window !== 'undefined' 
        ? `${window.screen.width}x${window.screen.height}` 
        : undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };
}

/**
 * Build transaction line for step event
 */
function buildTransactionLine(
  transactionId: string,
  lineIndex: number,
  context: EmitContext
): OnboardingTransactionLine {
  const duration = context.startTime && context.endTime
    ? context.endTime - context.startTime
    : undefined;
  
  return {
    id: generateLineId(),
    transaction_id: transactionId,
    line_index: lineIndex,
    smart_code: context.stepCode || context.tourCode,
    status: context.status,
    duration_ms: duration,
    metadata: {
      ...context.metadata,
      timestamp: getCurrentTimestamp(),
    },
  };
}

/**
 * Emit tour start event
 */
export function emitTourStart(
  organizationId: string,
  tourCode: SmartCode,
  metadata?: Record<string, unknown>,
  onEmit?: (txn: OnboardingTransaction, lines: OnboardingTransactionLine[]) => void
): void {
  if (!onEmit) return;
  
  const context: EmitContext = {
    organizationId,
    tourCode,
    status: 'started',
    metadata: {
      ...metadata,
      event: 'tour_start',
    },
  };
  
  const transaction = buildTransaction(context);
  const line = buildTransactionLine(transaction.id, 0, context);
  
  onEmit(transaction, [line]);
}

/**
 * Emit step shown event
 */
export function emitStepShown(
  organizationId: string,
  tourCode: SmartCode,
  stepCode: SmartCode,
  stepIndex: number,
  metadata?: Record<string, unknown>,
  onEmit?: (txn: OnboardingTransaction, lines: OnboardingTransactionLine[]) => void
): void {
  if (!onEmit) return;
  
  const context: EmitContext = {
    organizationId,
    tourCode,
    stepCode,
    status: 'shown',
    metadata: {
      ...metadata,
      event: 'step_shown',
      step_index: stepIndex,
    },
  };
  
  const transaction = buildTransaction(context);
  const line = buildTransactionLine(transaction.id, 0, context);
  
  onEmit(transaction, [line]);
}

/**
 * Emit step completed event
 */
export function emitStepCompleted(
  organizationId: string,
  tourCode: SmartCode,
  stepCode: SmartCode,
  stepIndex: number,
  startTime: number,
  metadata?: Record<string, unknown>,
  onEmit?: (txn: OnboardingTransaction, lines: OnboardingTransactionLine[]) => void
): void {
  if (!onEmit) return;
  
  const endTime = Date.now();
  const context: EmitContext = {
    organizationId,
    tourCode,
    stepCode,
    status: 'completed',
    startTime,
    endTime,
    metadata: {
      ...metadata,
      event: 'step_completed',
      step_index: stepIndex,
    },
  };
  
  const transaction = buildTransaction(context);
  const line = buildTransactionLine(transaction.id, 0, context);
  
  onEmit(transaction, [line]);
}

/**
 * Emit tour completed event
 */
export function emitTourCompleted(
  organizationId: string,
  tourCode: SmartCode,
  totalSteps: number,
  completedSteps: number,
  startTime: number,
  stepDurations: Record<string, number>,
  metadata?: Record<string, unknown>,
  onEmit?: (txn: OnboardingTransaction, lines: OnboardingTransactionLine[]) => void
): void {
  if (!onEmit) return;
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  const avgStepDuration = Object.values(stepDurations).reduce((a, b) => a + b, 0) / completedSteps;
  
  const context: EmitContext = {
    organizationId,
    tourCode,
    status: 'completed',
    startTime,
    endTime,
    metadata: {
      ...metadata,
      event: 'tour_completed',
      total_steps: totalSteps,
      completed_steps: completedSteps,
      total_duration_ms: totalDuration,
      avg_step_duration_ms: avgStepDuration,
      completion_rate: (completedSteps / totalSteps) * 100,
    },
  };
  
  const transaction = buildTransaction(context);
  
  // Create lines for summary and each step duration
  const lines: OnboardingTransactionLine[] = [];
  
  // Summary line
  lines.push(buildTransactionLine(transaction.id, 0, context));
  
  // Step duration lines
  let lineIndex = 1;
  Object.entries(stepDurations).forEach(([stepCode, duration]) => {
    lines.push({
      id: generateLineId(),
      transaction_id: transaction.id,
      line_index: lineIndex++,
      smart_code: stepCode as SmartCode,
      status: 'completed',
      duration_ms: duration,
      metadata: {
        event: 'step_duration',
      },
    });
  });
  
  onEmit(transaction, lines);
}

/**
 * Emit tour dismissed/skipped event
 */
export function emitTourDismissed(
  organizationId: string,
  tourCode: SmartCode,
  status: 'skipped' | 'dismissed',
  currentStep: number,
  totalSteps: number,
  startTime: number,
  metadata?: Record<string, unknown>,
  onEmit?: (txn: OnboardingTransaction, lines: OnboardingTransactionLine[]) => void
): void {
  if (!onEmit) return;
  
  const endTime = Date.now();
  const context: EmitContext = {
    organizationId,
    tourCode,
    status,
    startTime,
    endTime,
    metadata: {
      ...metadata,
      event: `tour_${status}`,
      current_step: currentStep,
      total_steps: totalSteps,
      progress_percentage: (currentStep / totalSteps) * 100,
    },
  };
  
  const transaction = buildTransaction(context);
  const line = buildTransactionLine(transaction.id, 0, context);
  
  onEmit(transaction, [line]);
}

/**
 * Emit step error event
 */
export function emitStepError(
  organizationId: string,
  tourCode: SmartCode,
  stepCode: SmartCode,
  stepIndex: number,
  error: string,
  metadata?: Record<string, unknown>,
  onEmit?: (txn: OnboardingTransaction, lines: OnboardingTransactionLine[]) => void
): void {
  if (!onEmit) return;
  
  const context: EmitContext = {
    organizationId,
    tourCode,
    stepCode,
    status: 'error',
    metadata: {
      ...metadata,
      event: 'step_error',
      step_index: stepIndex,
      error_message: error,
    },
  };
  
  const transaction = buildTransaction(context);
  const line = buildTransactionLine(transaction.id, 0, context);
  
  onEmit(transaction, [line]);
}

/**
 * Create event emitter for a tour session
 */
export class OnboardingEventEmitter {
  private organizationId: string;
  private tourCode: SmartCode;
  private startTime: number;
  private stepStartTimes: Map<string, number> = new Map();
  private stepDurations: Record<string, number> = {};
  private onEmit?: (txn: OnboardingTransaction, lines: OnboardingTransactionLine[]) => void;
  
  constructor(
    organizationId: string,
    tourCode: SmartCode,
    onEmit?: (txn: OnboardingTransaction, lines: OnboardingTransactionLine[]) => void
  ) {
    this.organizationId = organizationId;
    this.tourCode = tourCode;
    this.startTime = Date.now();
    this.onEmit = onEmit;
  }
  
  tourStart(metadata?: Record<string, unknown>): void {
    emitTourStart(this.organizationId, this.tourCode, metadata, this.onEmit);
  }
  
  stepShown(stepCode: SmartCode, stepIndex: number, metadata?: Record<string, unknown>): void {
    this.stepStartTimes.set(stepCode, Date.now());
    emitStepShown(this.organizationId, this.tourCode, stepCode, stepIndex, metadata, this.onEmit);
  }
  
  stepCompleted(stepCode: SmartCode, stepIndex: number, metadata?: Record<string, unknown>): void {
    const startTime = this.stepStartTimes.get(stepCode) || Date.now();
    const duration = Date.now() - startTime;
    this.stepDurations[stepCode] = duration;
    
    emitStepCompleted(
      this.organizationId,
      this.tourCode,
      stepCode,
      stepIndex,
      startTime,
      metadata,
      this.onEmit
    );
  }
  
  tourCompleted(totalSteps: number, completedSteps: number, metadata?: Record<string, unknown>): void {
    emitTourCompleted(
      this.organizationId,
      this.tourCode,
      totalSteps,
      completedSteps,
      this.startTime,
      this.stepDurations,
      metadata,
      this.onEmit
    );
  }
  
  tourDismissed(
    status: 'skipped' | 'dismissed',
    currentStep: number,
    totalSteps: number,
    metadata?: Record<string, unknown>
  ): void {
    emitTourDismissed(
      this.organizationId,
      this.tourCode,
      status,
      currentStep,
      totalSteps,
      this.startTime,
      metadata,
      this.onEmit
    );
  }
  
  stepError(stepCode: SmartCode, stepIndex: number, error: string, metadata?: Record<string, unknown>): void {
    emitStepError(
      this.organizationId,
      this.tourCode,
      stepCode,
      stepIndex,
      error,
      metadata,
      this.onEmit
    );
  }
  
  getStepDurations(): Record<string, number> {
    return { ...this.stepDurations };
  }
  
  getTotalDuration(): number {
    return Date.now() - this.startTime;
  }
}