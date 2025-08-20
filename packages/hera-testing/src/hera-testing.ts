import { DSLParser } from './dsl/parser';
import { DSLRunner, RunnerOptions } from './runners/dsl-runner';
import { HERAReporter, ReportOptions } from './reporters/hera-reporter';
import { TestGenerator } from './generators/test-generator';
import { UniversalFixtures } from './fixtures/universal-fixtures';
import { BusinessOracle } from './oracles/business-oracle';
import { TestHelpers } from './utils/test-helpers';

/**
 * Main interface for HERA Testing Framework
 */
export class HeraTesting {
  private runner: DSLRunner;
  private fixtures: UniversalFixtures;

  constructor(organizationId: string, options?: RunnerOptions) {
    this.runner = new DSLRunner(options);
    this.fixtures = new UniversalFixtures(organizationId);
  }

  /**
   * Run a test from file
   */
  async runTestFile(filePath: string): Promise<any> {
    const test = await DSLParser.parseYAML(filePath);
    return this.runner.run(test);
  }

  /**
   * Run multiple test files
   */
  async runTestSuite(filePaths: string[]): Promise<any[]> {
    const results = [];
    
    for (const filePath of filePaths) {
      try {
        const result = await this.runTestFile(filePath);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error as Error,
          filePath,
        });
      }
    }
    
    return results;
  }

  /**
   * Generate test code from DSL
   */
  async generateTests(
    testFile: string,
    outputDir: string,
    types: Array<'playwright' | 'jest' | 'pgtap' | 'agent'> = ['jest']
  ): Promise<void> {
    const test = await DSLParser.parseYAML(testFile);

    for (const type of types) {
      const outputPath = `${outputDir}/${test.metadata.name.replace(/\s+/g, '-').toLowerCase()}.${type}.spec.ts`;
      
      switch (type) {
        case 'playwright':
          await TestGenerator.generatePlaywrightTest(test, outputPath);
          break;
        case 'jest':
          await TestGenerator.generateJestTest(test, outputPath);
          break;
        case 'pgtap':
          await TestGenerator.generatePgTAPTest(test, `${outputPath}.sql`);
          break;
        case 'agent':
          await TestGenerator.generateAgentTest(test, outputPath);
          break;
      }
    }
  }

  /**
   * Generate test report
   */
  async generateReport(
    results: any | any[],
    options: ReportOptions = { format: 'console' }
  ): Promise<void> {
    await HERAReporter.generateReport(results, options);
  }

  /**
   * Validate business data
   */
  validateEntity(entity: any) {
    return TestHelpers.validateHeraEntity(entity);
  }

  validateTransaction(transaction: any) {
    return TestHelpers.validateHeraTransaction(transaction);
  }

  /**
   * Access to sub-modules
   */
  get parser() { return DSLParser; }
  get oracle() { return BusinessOracle; }
  get helpers() { return TestHelpers; }
  get testFixtures() { return this.fixtures; }
}