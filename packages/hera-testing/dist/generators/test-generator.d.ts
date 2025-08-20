import { BusinessProcessTest } from '../dsl/schema';
/**
 * Generate test files from DSL definitions
 */
export declare class TestGenerator {
    /**
     * Generate Playwright test from DSL
     */
    static generatePlaywrightTest(test: BusinessProcessTest, outputPath: string): Promise<void>;
    private static generatePlaywrightStep;
    /**
     * Generate pgTAP database test from DSL
     */
    static generatePgTAPTest(test: BusinessProcessTest, outputPath: string): Promise<void>;
    private static generatePgTAPStep;
    /**
     * Generate Jest unit test from DSL
     */
    static generateJestTest(test: BusinessProcessTest, outputPath: string): Promise<void>;
    private static generateJestStep;
    /**
     * Generate Agent/MCP test from DSL
     */
    static generateAgentTest(test: BusinessProcessTest, outputPath: string): Promise<void>;
    private static generateAgentStep;
    private static stepToNaturalLanguage;
}
