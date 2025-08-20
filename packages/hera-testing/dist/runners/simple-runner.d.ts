/**
 * Simple Test Runner for HERA Testing Framework
 * Focused on core functionality for salon testing
 */
import { BusinessProcessTest } from '../dsl/schema';
export interface SimpleTestResult {
    success: boolean;
    duration: number;
    steps: string[];
    message: string;
}
export declare class SimpleTestRunner {
    private organizationId;
    constructor(organizationId: string);
    /**
     * Run a business process test in simulation mode
     */
    runTest(test: BusinessProcessTest): Promise<SimpleTestResult>;
    /**
     * Simulate action execution
     */
    private simulateAction;
}
