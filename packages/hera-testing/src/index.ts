/**
 * HERA Universal Testing Framework
 * Entry point for the testing framework library
 */

// Core DSL and Schema
export * from './dsl/schema';
export * from './dsl/parser';

// Test Runner
export { TestRunner } from './runners/test-runner';
export type { TestRunnerConfig, TestResult } from './runners/test-runner';

// Generators
export { PlaywrightGenerator } from './generators/playwright-generator';

// Business Oracles
export { businessOracles } from './oracles/business-oracles';
export type { 
  EntityData, 
  TransactionData, 
  TransactionLineData, 
  RelationshipData, 
  DynamicFieldData 
} from './oracles/business-oracles';

// Version
export const VERSION = '1.0.0';

// Default configuration
export const DEFAULT_CONFIG = {
  timeout: 30000,
  retries: 2,
  browsers: ['chromium'],
  headless: true,
  debug: false
};

/**
 * Create a new HERA test runner instance
 */
export function createTestRunner(config: any) {
  return new TestRunner(config);
}

/**
 * Validate a business process test file
 */
export async function validateTest(content: string) {
  const { validateBusinessProcessTest } = await import('./dsl/parser');
  return validateBusinessProcessTest(content);
}

/**
 * Parse a business process test file
 */
export async function parseTest(content: string) {
  const { parseBusinessProcessTest } = await import('./dsl/parser');
  return parseBusinessProcessTest(content);
}