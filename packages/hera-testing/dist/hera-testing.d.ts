import { RunnerOptions } from './runners/dsl-runner';
import { ReportOptions } from './reporters/hera-reporter';
import { BusinessOracle } from './oracles/business-oracle';
/**
 * Main interface for HERA Testing Framework
 */
export declare class HeraTesting {
    private runner;
    private fixtures;
    constructor(organizationId: string, options?: RunnerOptions);
    /**
     * Run a test from file
     */
    runTestFile(filePath: string): Promise<any>;
    /**
     * Run multiple test files
     */
    runTestSuite(filePaths: string[]): Promise<any[]>;
    /**
     * Generate test code from DSL
     */
    generateTests(testFile: string, outputDir: string, types?: Array<'playwright' | 'jest' | 'pgtap' | 'agent'>): Promise<void>;
    /**
     * Generate test report
     */
    generateReport(results: any | any[], options?: ReportOptions): Promise<void>;
    /**
     * Validate business data
     */
    validateEntity(entity: any): any;
    validateTransaction(transaction: any): any;
    /**
     * Access to sub-modules
     */
    get parser(): any;
    get oracle(): typeof BusinessOracle;
    get helpers(): any;
    get testFixtures(): UniversalFixtures;
}
