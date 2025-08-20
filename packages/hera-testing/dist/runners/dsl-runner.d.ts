import { BusinessProcessTest } from '../dsl/schema';
export interface RunnerOptions {
    verbose?: boolean;
    dryRun?: boolean;
    continueOnError?: boolean;
    timeout?: number;
}
export interface RunResult {
    success: boolean;
    duration: number;
    steps: StepResult[];
    errors: Error[];
}
export interface StepResult {
    stepId: string;
    stepName: string;
    success: boolean;
    duration: number;
    error?: Error;
    data?: any;
}
/**
 * Execute business process tests defined in DSL
 */
export declare class DSLRunner {
    private options;
    private context;
    constructor(options?: RunnerOptions);
    /**
     * Run a business process test
     */
    run(test: BusinessProcessTest): Promise<RunResult>;
    /**
     * Setup test environment
     */
    private setupTest;
    /**
     * Execute a single test step
     */
    private executeStep;
    /**
     * Execute entity creation
     */
    private executeCreateEntity;
    /**
     * Execute entity update
     */
    private executeUpdateEntity;
    /**
     * Execute transaction creation
     */
    private executeCreateTransaction;
    /**
     * Execute relationship creation
     */
    private executeCreateRelationship;
    /**
     * Execute validation step
     */
    private executeValidation;
    /**
     * Execute wait step
     */
    private executeWait;
    /**
     * Run validations on step result
     */
    private runValidations;
    /**
     * Teardown test environment
     */
    private teardownTest;
    /**
     * Resolve references in data (e.g., {{step_id.field}})
     */
    private resolveReferences;
    /**
     * Get nested value from object
     */
    private getNestedValue;
    /**
     * Log message if verbose
     */
    private log;
}
