"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeraTesting = void 0;
const parser_1 = require("./dsl/parser");
const dsl_runner_1 = require("./runners/dsl-runner");
const hera_reporter_1 = require("./reporters/hera-reporter");
const test_generator_1 = require("./generators/test-generator");
const universal_fixtures_1 = require("./fixtures/universal-fixtures");
const business_oracle_1 = require("./oracles/business-oracle");
const test_helpers_1 = require("./utils/test-helpers");
/**
 * Main interface for HERA Testing Framework
 */
class HeraTesting {
    constructor(organizationId, options) {
        this.runner = new dsl_runner_1.DSLRunner(options);
        this.fixtures = new universal_fixtures_1.UniversalFixtures(organizationId);
    }
    /**
     * Run a test from file
     */
    async runTestFile(filePath) {
        const test = await parser_1.DSLParser.parseYAML(filePath);
        return this.runner.run(test);
    }
    /**
     * Run multiple test files
     */
    async runTestSuite(filePaths) {
        const results = [];
        for (const filePath of filePaths) {
            try {
                const result = await this.runTestFile(filePath);
                results.push(result);
            }
            catch (error) {
                results.push({
                    success: false,
                    error: error,
                    filePath,
                });
            }
        }
        return results;
    }
    /**
     * Generate test code from DSL
     */
    async generateTests(testFile, outputDir, types = ['jest']) {
        const test = await parser_1.DSLParser.parseYAML(testFile);
        for (const type of types) {
            const outputPath = `${outputDir}/${test.metadata.name.replace(/\s+/g, '-').toLowerCase()}.${type}.spec.ts`;
            switch (type) {
                case 'playwright':
                    await test_generator_1.TestGenerator.generatePlaywrightTest(test, outputPath);
                    break;
                case 'jest':
                    await test_generator_1.TestGenerator.generateJestTest(test, outputPath);
                    break;
                case 'pgtap':
                    await test_generator_1.TestGenerator.generatePgTAPTest(test, `${outputPath}.sql`);
                    break;
                case 'agent':
                    await test_generator_1.TestGenerator.generateAgentTest(test, outputPath);
                    break;
            }
        }
    }
    /**
     * Generate test report
     */
    async generateReport(results, options = { format: 'console' }) {
        await hera_reporter_1.HERAReporter.generateReport(results, options);
    }
    /**
     * Validate business data
     */
    validateEntity(entity) {
        return test_helpers_1.TestHelpers.validateHeraEntity(entity);
    }
    validateTransaction(transaction) {
        return test_helpers_1.TestHelpers.validateHeraTransaction(transaction);
    }
    /**
     * Access to sub-modules
     */
    get parser() { return parser_1.DSLParser; }
    get oracle() { return business_oracle_1.BusinessOracle; }
    get helpers() { return test_helpers_1.TestHelpers; }
    get testFixtures() { return this.fixtures; }
}
exports.HeraTesting = HeraTesting;
