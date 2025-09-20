/**
 * Test Utilities for HERA Playbook System
 * 
 * Provides comprehensive helper functions for testing playbook functionality
 * including data factories, mock workers, run management, and assertions.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  PlaybookDefinition, 
  PlaybookRun, 
  PlaybookStep,
  StepContract,
  StepStatus,
  RunStatus,
  WorkerType,
  SignalType,
  PolicyType,
  StepPolicy,
  StepExecution,
  WorkerResponse,
  SignalPayload
} from '../../types';

// ============================================
// Test Data Factories
// ============================================

/**
 * Creates a test organization with default values
 */
export function createTestOrganization(overrides?: Partial<{
  id: string;
  name: string;
  domain: string;
  settings: Record<string, any>;
}>): { id: string; name: string; domain: string; settings: Record<string, any> } {
  return {
    id: overrides?.id || `org_${uuidv4()}`,
    name: overrides?.name || 'Test Organization',
    domain: overrides?.domain || 'test-org',
    settings: overrides?.settings || {
      playbooks_enabled: true,
      max_concurrent_runs: 10
    }
  };
}

/**
 * Creates a test user with customizable roles
 */
export function createTestUser(overrides?: Partial<{
  id: string;
  email: string;
  name: string;
  organizationId: string;
  roles: string[];
}>): { 
  id: string; 
  email: string; 
  name: string; 
  organizationId: string; 
  roles: string[] 
} {
  return {
    id: overrides?.id || `user_${uuidv4()}`,
    email: overrides?.email || 'test@example.com',
    name: overrides?.name || 'Test User',
    organizationId: overrides?.organizationId || createTestOrganization().id,
    roles: overrides?.roles || ['user', 'playbook_executor']
  };
}

/**
 * Creates a simple test playbook definition
 */
export function createTestPlaybook(overrides?: Partial<PlaybookDefinition>): PlaybookDefinition {
  const defaultSteps = [
    createTestStep({ 
      stepNumber: 1, 
      name: 'Initialize',
      workerType: 'system' 
    }),
    createTestStep({ 
      stepNumber: 2, 
      name: 'Process',
      workerType: 'ai' 
    }),
    createTestStep({ 
      stepNumber: 3, 
      name: 'Complete',
      workerType: 'system' 
    })
  ];

  return {
    id: overrides?.id || `playbook_${uuidv4()}`,
    organizationId: overrides?.organizationId || createTestOrganization().id,
    name: overrides?.name || 'Test Playbook',
    description: overrides?.description || 'A test playbook for unit testing',
    smartCode: overrides?.smartCode || 'HERA.TEST.PLAYBOOK.v1',
    version: overrides?.version || '1.0.0',
    isActive: overrides?.isActive ?? true,
    steps: overrides?.steps || defaultSteps,
    metadata: overrides?.metadata || {},
    createdAt: overrides?.createdAt || new Date().toISOString(),
    updatedAt: overrides?.updatedAt || new Date().toISOString()
  };
}

/**
 * Creates a test step with customizable properties
 */
export function createTestStep(overrides?: Partial<PlaybookStep>): PlaybookStep {
  return {
    stepNumber: overrides?.stepNumber || 1,
    name: overrides?.name || 'Test Step',
    description: overrides?.description || 'A test step',
    workerType: overrides?.workerType || 'system',
    workerConfig: overrides?.workerConfig || {
      action: 'test_action',
      timeout: 30000
    },
    inputContract: overrides?.inputContract || createTestContract('input'),
    outputContract: overrides?.outputContract || createTestContract('output'),
    policies: overrides?.policies || [],
    retryConfig: overrides?.retryConfig || {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000
    },
    signalHandlers: overrides?.signalHandlers || {},
    metadata: overrides?.metadata || {}
  };
}

/**
 * Creates test contracts for input/output validation
 */
export function createTestContract(
  type: 'input' | 'output',
  schema?: Record<string, any>
): StepContract {
  const defaultSchema = type === 'input' 
    ? {
        type: 'object',
        properties: {
          value: { type: 'string' }
        },
        required: ['value']
      }
    : {
        type: 'object',
        properties: {
          result: { type: 'string' },
          success: { type: 'boolean' }
        },
        required: ['result', 'success']
      };

  return {
    schema: schema || defaultSchema,
    examples: [
      type === 'input' 
        ? { value: 'test input' }
        : { result: 'test output', success: true }
    ]
  };
}

/**
 * Creates test policies for steps
 */
export function createTestPolicy(
  type: PolicyType,
  overrides?: Partial<StepPolicy>
): StepPolicy {
  const basePolicy: StepPolicy = {
    type,
    config: {}
  };

  switch (type) {
    case 'sla':
      return {
        ...basePolicy,
        config: {
          maxDurationMs: 60000,
          warningThresholdMs: 30000,
          ...overrides?.config
        }
      };
    
    case 'approval':
      return {
        ...basePolicy,
        config: {
          approverRoles: ['manager', 'admin'],
          minApprovals: 1,
          timeoutMs: 3600000,
          ...overrides?.config
        }
      };
    
    case 'validation':
      return {
        ...basePolicy,
        config: {
          rules: [
            { field: 'amount', operator: 'lt', value: 10000 }
          ],
          ...overrides?.config
        }
      };
    
    default:
      return {
        ...basePolicy,
        ...overrides
      };
  }
}

// ============================================
// Mock Worker Handlers
// ============================================

/**
 * Mock system worker that simulates system operations
 */
export class MockSystemWorker {
  private responses: Map<string, WorkerResponse> = new Map();
  private defaultResponse: WorkerResponse = {
    success: true,
    output: { result: 'system operation completed' },
    metrics: {
      duration: 100,
      retries: 0
    }
  };

  setResponse(action: string, response: WorkerResponse): void {
    this.responses.set(action, response);
  }

  setDefaultResponse(response: WorkerResponse): void {
    this.defaultResponse = response;
  }

  async execute(input: any, config: any): Promise<WorkerResponse> {
    const action = config.action || 'default';
    const response = this.responses.get(action) || this.defaultResponse;
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return response;
  }
}

/**
 * Mock human worker that simulates human interactions
 */
export class MockHumanWorker {
  private approvalResponses: Map<string, boolean> = new Map();
  private defaultApproval: boolean = true;
  private responseDelay: number = 100;

  setApprovalResponse(stepId: string, approved: boolean): void {
    this.approvalResponses.set(stepId, approved);
  }

  setDefaultApproval(approved: boolean): void {
    this.defaultApproval = approved;
  }

  setResponseDelay(delayMs: number): void {
    this.responseDelay = delayMs;
  }

  async execute(input: any, config: any): Promise<WorkerResponse> {
    await new Promise(resolve => setTimeout(resolve, this.responseDelay));
    
    const approved = this.approvalResponses.get(input.stepId) ?? this.defaultApproval;
    
    return {
      success: true,
      output: {
        approved,
        approvedBy: 'test@example.com',
        approvedAt: new Date().toISOString(),
        comments: approved ? 'Approved for testing' : 'Rejected for testing'
      },
      metrics: {
        duration: this.responseDelay,
        retries: 0
      }
    };
  }
}

/**
 * Mock AI worker that simulates AI responses
 */
export class MockAIWorker {
  private responses: Map<string, any> = new Map();
  private defaultResponse: any = {
    classification: 'standard',
    confidence: 0.95,
    suggestions: ['Option A', 'Option B']
  };

  setResponse(prompt: string, response: any): void {
    this.responses.set(prompt, response);
  }

  setDefaultResponse(response: any): void {
    this.defaultResponse = response;
  }

  async execute(input: any, config: any): Promise<WorkerResponse> {
    const prompt = input.prompt || config.prompt || 'default';
    const response = this.responses.get(prompt) || this.defaultResponse;
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      output: response,
      metrics: {
        duration: 200,
        retries: 0,
        tokensUsed: 150
      }
    };
  }
}

/**
 * Mock external worker that simulates external API responses
 */
export class MockExternalWorker {
  private responses: Map<string, any> = new Map();
  private shouldFail: boolean = false;
  private failureRate: number = 0;

  setResponse(endpoint: string, response: any): void {
    this.responses.set(endpoint, response);
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  async execute(input: any, config: any): Promise<WorkerResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Random failure based on rate
    if (this.failureRate > 0 && Math.random() < this.failureRate) {
      return {
        success: false,
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: 'Random failure for testing',
          details: { endpoint: config.endpoint }
        },
        metrics: {
          duration: 150,
          retries: 0
        }
      };
    }
    
    if (this.shouldFail) {
      return {
        success: false,
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: 'Mock external API failure',
          details: { endpoint: config.endpoint }
        },
        metrics: {
          duration: 150,
          retries: 0
        }
      };
    }
    
    const response = this.responses.get(config.endpoint) || {
      status: 200,
      data: { message: 'Mock external response' }
    };
    
    return {
      success: true,
      output: response,
      metrics: {
        duration: 150,
        retries: 0
      }
    };
  }
}

// ============================================
// Run Management Utilities
// ============================================

/**
 * Creates and starts a playbook run
 */
export async function createAndStartRun(
  playbook: PlaybookDefinition,
  input: any = {},
  options?: {
    userId?: string;
    metadata?: Record<string, any>;
  }
): Promise<PlaybookRun> {
  const run: PlaybookRun = {
    id: `run_${uuidv4()}`,
    organizationId: playbook.organizationId,
    playbookId: playbook.id,
    playbookVersion: playbook.version,
    status: 'running',
    currentStepNumber: 1,
    input,
    output: {},
    startedAt: new Date().toISOString(),
    startedBy: options?.userId || createTestUser().id,
    metadata: options?.metadata || {},
    stepExecutions: []
  };
  
  return run;
}

/**
 * Waits for run to complete with timeout
 */
export async function waitForRunCompletion(
  runId: string,
  options?: {
    timeoutMs?: number;
    checkIntervalMs?: number;
    getRunStatus: (runId: string) => Promise<RunStatus>;
  }
): Promise<boolean> {
  const timeoutMs = options?.timeoutMs || 30000;
  const checkIntervalMs = options?.checkIntervalMs || 100;
  const getRunStatus = options?.getRunStatus || (async () => 'completed' as RunStatus);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const status = await getRunStatus(runId);
    
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
  }
  
  return false;
}

/**
 * Simulates step execution with worker
 */
export async function simulateStepExecution(
  step: PlaybookStep,
  input: any,
  worker: MockSystemWorker | MockHumanWorker | MockAIWorker | MockExternalWorker
): Promise<StepExecution> {
  const execution: StepExecution = {
    stepNumber: step.stepNumber,
    status: 'running',
    input,
    startedAt: new Date().toISOString(),
    attempts: 0
  };
  
  try {
    const response = await worker.execute(input, step.workerConfig);
    
    execution.status = response.success ? 'completed' : 'failed';
    execution.output = response.output;
    execution.error = response.error;
    execution.completedAt = new Date().toISOString();
    execution.metrics = response.metrics;
    
  } catch (error: any) {
    execution.status = 'failed';
    execution.error = {
      code: 'WORKER_ERROR',
      message: error.message,
      stack: error.stack
    };
    execution.completedAt = new Date().toISOString();
  }
  
  return execution;
}

/**
 * Advances run to specific step number
 */
export function advanceRunToStep(
  run: PlaybookRun,
  targetStepNumber: number,
  completedSteps?: StepExecution[]
): PlaybookRun {
  const updatedRun = { ...run };
  updatedRun.currentStepNumber = targetStepNumber;
  
  if (completedSteps) {
    updatedRun.stepExecutions = [
      ...run.stepExecutions,
      ...completedSteps
    ];
  }
  
  return updatedRun;
}

// ============================================
// Assertion Helpers
// ============================================

/**
 * Asserts run has expected status
 */
export function assertRunStatus(
  run: PlaybookRun,
  expectedStatus: RunStatus,
  message?: string
): void {
  if (run.status !== expectedStatus) {
    throw new Error(
      message || 
      `Expected run status to be '${expectedStatus}', but got '${run.status}'`
    );
  }
}

/**
 * Asserts step has expected status
 */
export function assertStepStatus(
  execution: StepExecution,
  expectedStatus: StepStatus,
  message?: string
): void {
  if (execution.status !== expectedStatus) {
    throw new Error(
      message ||
      `Expected step ${execution.stepNumber} status to be '${expectedStatus}', but got '${execution.status}'`
    );
  }
}

/**
 * Validates data against contract schema
 */
export function assertContractValid(
  data: any,
  contract: StepContract,
  message?: string
): void {
  // Simple validation - in real implementation would use JSON Schema validator
  const required = contract.schema.required || [];
  const properties = contract.schema.properties || {};
  
  for (const field of required) {
    if (!(field in data)) {
      throw new Error(
        message ||
        `Contract validation failed: missing required field '${field}'`
      );
    }
  }
  
  for (const [field, schema] of Object.entries(properties)) {
    if (field in data && schema && typeof schema === 'object' && 'type' in schema) {
      const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field];
      const expectedType = (schema as any).type;
      
      if (actualType !== expectedType) {
        throw new Error(
          message ||
          `Contract validation failed: field '${field}' expected type '${expectedType}', got '${actualType}'`
        );
      }
    }
  }
}

/**
 * Verifies policy enforcement
 */
export function assertPolicyEnforced(
  execution: StepExecution,
  policy: StepPolicy,
  message?: string
): void {
  switch (policy.type) {
    case 'sla':
      const duration = execution.metrics?.duration || 0;
      const maxDuration = policy.config.maxDurationMs;
      
      if (duration > maxDuration) {
        throw new Error(
          message ||
          `SLA policy violated: execution took ${duration}ms, max allowed is ${maxDuration}ms`
        );
      }
      break;
      
    case 'approval':
      if (execution.status === 'completed' && !execution.output?.approved) {
        throw new Error(
          message ||
          'Approval policy violated: step completed without approval'
        );
      }
      break;
      
    case 'validation':
      // Validation logic would go here
      break;
  }
}

// ============================================
// Signal Testing Utilities
// ============================================

/**
 * Sends signal to run
 */
export async function sendSignal(
  runId: string,
  signal: SignalType,
  payload?: any,
  options?: {
    sendSignal?: (runId: string, signal: SignalPayload) => Promise<void>;
  }
): Promise<void> {
  const signalPayload: SignalPayload = {
    type: signal,
    payload,
    sentAt: new Date().toISOString()
  };
  
  const sendFn = options?.sendSignal || (async () => {});
  await sendFn(runId, signalPayload);
}

/**
 * Waits for signal to be processed
 */
export async function waitForSignalProcessing(
  runId: string,
  signalType: SignalType,
  options?: {
    timeoutMs?: number;
    checkIntervalMs?: number;
    isSignalProcessed?: (runId: string, signalType: SignalType) => Promise<boolean>;
  }
): Promise<boolean> {
  const timeoutMs = options?.timeoutMs || 5000;
  const checkIntervalMs = options?.checkIntervalMs || 100;
  const isProcessed = options?.isSignalProcessed || (async () => true);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (await isProcessed(runId, signalType)) {
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
  }
  
  return false;
}

/**
 * Verifies signal was handled correctly
 */
export function assertSignalHandled(
  run: PlaybookRun,
  signalType: SignalType,
  expectedOutcome?: {
    status?: RunStatus;
    currentStep?: number;
    hasOutput?: boolean;
  },
  message?: string
): void {
  if (expectedOutcome?.status && run.status !== expectedOutcome.status) {
    throw new Error(
      message ||
      `Signal '${signalType}' handling failed: expected status '${expectedOutcome.status}', got '${run.status}'`
    );
  }
  
  if (expectedOutcome?.currentStep && run.currentStepNumber !== expectedOutcome.currentStep) {
    throw new Error(
      message ||
      `Signal '${signalType}' handling failed: expected current step ${expectedOutcome.currentStep}, got ${run.currentStepNumber}`
    );
  }
  
  if (expectedOutcome?.hasOutput && !run.output) {
    throw new Error(
      message ||
      `Signal '${signalType}' handling failed: expected output to be present`
    );
  }
}

// ============================================
// Cleanup Utilities
// ============================================

/**
 * Removes all test data
 */
export async function cleanupTestData(options?: {
  organizationId?: string;
  playbookIds?: string[];
  runIds?: string[];
  deleteData?: (type: string, ids: string[]) => Promise<void>;
}): Promise<void> {
  const deleteFn = options?.deleteData || (async () => {});
  
  if (options?.runIds) {
    await deleteFn('runs', options.runIds);
  }
  
  if (options?.playbookIds) {
    await deleteFn('playbooks', options.playbookIds);
  }
  
  if (options?.organizationId) {
    await deleteFn('organizations', [options.organizationId]);
  }
}

/**
 * Resets database to clean state
 */
export async function resetDatabase(options?: {
  resetFn?: () => Promise<void>;
}): Promise<void> {
  const reset = options?.resetFn || (async () => {});
  await reset();
}

/**
 * Clears idempotency cache records
 */
export async function clearIdempotencyCache(options?: {
  organizationId?: string;
  runIds?: string[];
  clearCache?: (organizationId: string, runIds?: string[]) => Promise<void>;
}): Promise<void> {
  const clear = options?.clearCache || (async () => {});
  
  if (options?.organizationId) {
    await clear(options.organizationId, options?.runIds);
  }
}

// ============================================
// Time Management
// ============================================

let originalDateNow: () => number;
let mockedTime: number | null = null;

/**
 * Advances system time for testing
 */
export function advanceTime(milliseconds: number): void {
  if (mockedTime !== null) {
    mockedTime += milliseconds;
  }
}

/**
 * Freezes time at specific point
 */
export function freezeTime(timestamp?: number): void {
  if (!originalDateNow) {
    originalDateNow = Date.now;
  }
  
  mockedTime = timestamp || Date.now();
  Date.now = () => mockedTime!;
}

/**
 * Mocks Date.now() for consistent tests
 */
export function mockDateNow(mockFn: () => number): void {
  if (!originalDateNow) {
    originalDateNow = Date.now;
  }
  
  Date.now = mockFn;
}

/**
 * Restores original Date.now()
 */
export function restoreTime(): void {
  if (originalDateNow) {
    Date.now = originalDateNow;
    mockedTime = null;
  }
}

// ============================================
// Monitoring Utilities
// ============================================

interface TestMetrics {
  runId: string;
  duration: number;
  stepDurations: Record<number, number>;
  retryCount: number;
  errorCount: number;
  signalCount: number;
}

/**
 * Captures performance metrics for test run
 */
export function captureMetrics(run: PlaybookRun): TestMetrics {
  const startTime = new Date(run.startedAt).getTime();
  const endTime = run.completedAt ? new Date(run.completedAt).getTime() : Date.now();
  
  const stepDurations: Record<number, number> = {};
  let retryCount = 0;
  let errorCount = 0;
  
  for (const execution of run.stepExecutions) {
    if (execution.startedAt && execution.completedAt) {
      const start = new Date(execution.startedAt).getTime();
      const end = new Date(execution.completedAt).getTime();
      stepDurations[execution.stepNumber] = end - start;
    }
    
    retryCount += execution.attempts - 1;
    if (execution.error) {
      errorCount++;
    }
  }
  
  return {
    runId: run.id,
    duration: endTime - startTime,
    stepDurations,
    retryCount,
    errorCount,
    signalCount: 0 // Would need signal tracking in run
  };
}

/**
 * Verifies SLA compliance for run
 */
export function assertSLACompliance(
  metrics: TestMetrics,
  slaConfig: {
    maxTotalDuration?: number;
    maxStepDurations?: Record<number, number>;
    maxRetries?: number;
    maxErrors?: number;
  },
  message?: string
): void {
  if (slaConfig.maxTotalDuration && metrics.duration > slaConfig.maxTotalDuration) {
    throw new Error(
      message ||
      `SLA violation: total duration ${metrics.duration}ms exceeds max ${slaConfig.maxTotalDuration}ms`
    );
  }
  
  if (slaConfig.maxStepDurations) {
    for (const [step, maxDuration] of Object.entries(slaConfig.maxStepDurations)) {
      const stepNum = parseInt(step);
      const actualDuration = metrics.stepDurations[stepNum] || 0;
      
      if (actualDuration > maxDuration) {
        throw new Error(
          message ||
          `SLA violation: step ${stepNum} duration ${actualDuration}ms exceeds max ${maxDuration}ms`
        );
      }
    }
  }
  
  if (slaConfig.maxRetries !== undefined && metrics.retryCount > slaConfig.maxRetries) {
    throw new Error(
      message ||
      `SLA violation: retry count ${metrics.retryCount} exceeds max ${slaConfig.maxRetries}`
    );
  }
  
  if (slaConfig.maxErrors !== undefined && metrics.errorCount > slaConfig.maxErrors) {
    throw new Error(
      message ||
      `SLA violation: error count ${metrics.errorCount} exceeds max ${slaConfig.maxErrors}`
    );
  }
}

/**
 * Generates test execution report
 */
export function generateTestReport(
  testName: string,
  runs: PlaybookRun[],
  options?: {
    includeMetrics?: boolean;
    includeErrors?: boolean;
    format?: 'json' | 'markdown';
  }
): string {
  const format = options?.format || 'json';
  
  const report = {
    testName,
    executedAt: new Date().toISOString(),
    totalRuns: runs.length,
    successfulRuns: runs.filter(r => r.status === 'completed').length,
    failedRuns: runs.filter(r => r.status === 'failed').length,
    cancelledRuns: runs.filter(r => r.status === 'cancelled').length,
    runs: runs.map(run => {
      const metrics = options?.includeMetrics ? captureMetrics(run) : undefined;
      const errors = options?.includeErrors 
        ? run.stepExecutions.filter(e => e.error).map(e => ({
            step: e.stepNumber,
            error: e.error
          }))
        : undefined;
        
      return {
        id: run.id,
        status: run.status,
        duration: metrics?.duration,
        metrics,
        errors
      };
    })
  };
  
  if (format === 'markdown') {
    return `
# Test Report: ${report.testName}

**Executed At:** ${report.executedAt}

## Summary
- **Total Runs:** ${report.totalRuns}
- **Successful:** ${report.successfulRuns}
- **Failed:** ${report.failedRuns}
- **Cancelled:** ${report.cancelledRuns}

## Run Details
${report.runs.map(run => `
### Run ${run.id}
- **Status:** ${run.status}
- **Duration:** ${run.duration}ms
${run.errors?.length ? `- **Errors:** ${run.errors.length}` : ''}
`).join('\n')}
`;
  }
  
  return JSON.stringify(report, null, 2);
}

// Export all mock workers as a collection
export const MockWorkers = {
  SystemWorker: MockSystemWorker,
  HumanWorker: MockHumanWorker,
  AIWorker: MockAIWorker,
  ExternalWorker: MockExternalWorker
};

// Export cleanup function that should be called in afterEach
export function cleanupAfterTest(): void {
  restoreTime();
}