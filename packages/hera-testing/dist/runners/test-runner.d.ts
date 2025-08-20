/**
 * HERA Test Runner - Executes business process tests
 */
import { BusinessProcessTest } from '../dsl/schema';
export interface TestRunnerConfig {
    organizationId: string;
    browser: string;
    headless: boolean;
    debug: boolean;
    baseUrl: string;
    supabaseUrl?: string;
    supabaseKey?: string;
}
export interface TestResult {
    success: boolean;
    duration: number;
    steps: StepResult[];
    assertions?: AssertionResult[];
    error?: string;
}
export interface StepResult {
    id: string;
    success: boolean;
    duration: number;
    actions: ActionResult[];
    error?: string;
}
export interface ActionResult {
    action_type: string;
    success: boolean;
    duration: number;
    result?: any;
    error?: string;
}
export interface AssertionResult {
    type: string;
    success: boolean;
    details?: any;
    error?: string;
}
export declare class TestRunner {
    private config;
    private supabase?;
    private executionContext;
    constructor(config: TestRunnerConfig);
    /**
     * Run a complete business process test
     */
    runBusinessProcess(test: BusinessProcessTest): Promise<TestResult>;
    /**
     * Initialize execution context with test variables
     */
    private initializeContext;
    /**
     * Execute a single test step
     */
    private executeStep;
    /**
     * Execute individual action
     */
    private executeAction;
    /**
     * Create entity using Universal API
     */
    private createEntity;
    /**
     * Create transaction using Universal API
     */
    private createTransaction;
    /**
     * Create relationship
     */
    private createRelationship;
    /**
     * Set dynamic field
     */
    private setDynamicField;
    /**
     * Perform UI interaction (placeholder for Playwright integration)
     */
    private performUIInteraction;
    /**
     * Make API call
     */
    private makeAPICall;
    /**
     * Wait for specified duration or condition
     */
    private wait;
    /**
     * Execute multiple actions (setup, cleanup)
     */
    private executeActions;
    /**
     * Execute test assertions
     */
    private executeAssertions;
    /**
     * Execute database assertions
     */
    private executeDatabaseAssertions;
    /**
     * Execute business logic assertions using oracles
     */
    private executeBusinessAssertions;
    /**
     * Execute UI assertions (placeholder)
     */
    private executeUIAssertions;
}
