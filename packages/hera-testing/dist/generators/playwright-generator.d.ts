/**
 * HERA Playwright Generator
 * Converts business process tests to Playwright test files
 */
import { BusinessProcessTest } from '../dsl/schema';
export declare class PlaywrightGenerator {
    private template;
    constructor();
    /**
     * Generate Playwright test from business process test
     */
    generateTest(businessTest: BusinessProcessTest): Promise<string>;
    /**
     * Build template context from business test
     */
    private buildTemplateContext;
    /**
     * Build personas context for template
     */
    private buildPersonasContext;
    /**
     * Build step context for template
     */
    private buildStepContext;
    /**
     * Build action context for template
     */
    private buildActionContext;
    /**
     * Build assertion context for template
     */
    private buildAssertionContext;
    /**
     * Build imports needed for the test
     */
    private buildImports;
    /**
     * Build fixtures for the test
     */
    private buildFixtures;
    /**
     * Register Handlebars helpers
     */
    private registerHelpers;
    /**
     * Compile the Playwright test template
     */
    private compileTemplate;
}
