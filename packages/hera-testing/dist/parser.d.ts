/**
 * HERA Testing DSL Parser
 * Parses YAML business process test files and validates them
 */
import { BusinessProcessTest } from './schema';
export declare class TestParseError extends Error {
    errors?: string[];
    constructor(message: string, errors?: string[]);
}
/**
 * Parse a YAML business process test file
 */
export declare function parseBusinessProcessTest(content: string): Promise<BusinessProcessTest>;
/**
 * Validate business process test without parsing
 */
export declare function validateBusinessProcessTest(content: string): {
    valid: boolean;
    errors: string[];
};
/**
 * Extract metadata from business process test
 */
export declare function extractTestMetadata(content: string): {
    id?: string;
    title?: string;
    industry?: string;
    stepCount?: number;
    personaCount?: number;
    estimatedDuration?: number;
};
/**
 * Generate test template for specific industry
 */
export declare function generateTestTemplate(industry: string, testName: string): string;
export declare const dslParser: {
    parseBusinessProcessTest: typeof parseBusinessProcessTest;
    validateBusinessProcessTest: typeof validateBusinessProcessTest;
    extractTestMetadata: typeof extractTestMetadata;
    generateTestTemplate: typeof generateTestTemplate;
};
