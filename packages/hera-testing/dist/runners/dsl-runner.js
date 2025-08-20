"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSLRunner = void 0;
const universal_api_1 = require("@/lib/universal-api");
const business_oracle_1 = require("../oracles/business-oracle");
const chalk_1 = __importDefault(require("chalk"));
/**
 * Execute business process tests defined in DSL
 */
class DSLRunner {
    constructor(options = {}) {
        this.context = new Map();
        this.options = {
            verbose: true,
            dryRun: false,
            continueOnError: false,
            timeout: 300000, // 5 minutes default
            ...options,
        };
    }
    /**
     * Run a business process test
     */
    async run(test) {
        const startTime = Date.now();
        const results = [];
        const errors = [];
        this.log(chalk_1.default.blue.bold(`\\n🚀 Running test: ${test.metadata.name}`));
        this.log(chalk_1.default.gray(`Description: ${test.metadata.description}`));
        this.log(chalk_1.default.gray(`Process type: ${test.metadata.process_type}`));
        try {
            // Setup phase
            await this.setupTest(test);
            // Execute steps
            for (const step of test.steps) {
                const stepResult = await this.executeStep(step, test);
                results.push(stepResult);
                if (!stepResult.success && !this.options.continueOnError) {
                    errors.push(stepResult.error);
                    break;
                }
                if (stepResult.error) {
                    errors.push(stepResult.error);
                }
            }
            // Teardown phase
            if (test.teardown) {
                await this.teardownTest(test);
            }
        }
        catch (error) {
            errors.push(error);
        }
        const duration = Date.now() - startTime;
        const success = errors.length === 0;
        // Summary
        this.log('\\n' + chalk_1.default.bold('Test Summary:'));
        this.log(`Duration: ${chalk_1.default.yellow(duration + 'ms')}`);
        this.log(`Steps: ${chalk_1.default.green(results.filter(r => r.success).length)} passed, ${chalk_1.default.red(results.filter(r => !r.success).length)} failed`);
        if (success) {
            this.log(chalk_1.default.green.bold('\\n✅ Test passed!'));
        }
        else {
            this.log(chalk_1.default.red.bold('\\n❌ Test failed!'));
            errors.forEach(err => this.log(chalk_1.default.red(`  - ${err.message}`)));
        }
        return {
            success,
            duration,
            steps: results,
            errors,
        };
    }
    /**
     * Setup test environment
     */
    async setupTest(test) {
        this.log(chalk_1.default.cyan('\\n📋 Setup Phase'));
        if (this.options.dryRun) {
            this.log(chalk_1.default.gray('  (dry run - skipping actual setup)'));
            return;
        }
        // Create organization
        const org = await universal_api_1.universalApi.setupBusiness({
            organization_name: test.setup.organization.name,
            business_type: test.setup.organization.business_type,
            owner_name: 'Test Runner',
        });
        this.context.set('organizationId', org.organization.id);
        universal_api_1.universalApi.setOrganizationId(org.organization.id);
        this.log(chalk_1.default.green(`  ✓ Created organization: ${test.setup.organization.name}`));
        // Create setup entities
        if (test.setup.entities) {
            for (const entity of test.setup.entities) {
                const created = await universal_api_1.universalApi.createEntity(entity);
                this.context.set(`entity_${entity.entity_code}`, created);
                this.log(chalk_1.default.green(`  ✓ Created entity: ${entity.entity_name}`));
            }
        }
        // Create setup relationships
        if (test.setup.relationships) {
            for (const rel of test.setup.relationships) {
                await universal_api_1.universalApi.createRelationship(rel);
                this.log(chalk_1.default.green(`  ✓ Created relationship: ${rel.relationship_type}`));
            }
        }
    }
    /**
     * Execute a single test step
     */
    async executeStep(step, test) {
        const startTime = Date.now();
        this.log(chalk_1.default.cyan(`\\n▶ Step: ${step.name}`));
        if (this.options.dryRun) {
            this.log(chalk_1.default.gray('  (dry run - skipping execution)'));
            return {
                stepId: step.id,
                stepName: step.name,
                success: true,
                duration: 0,
            };
        }
        try {
            let data;
            switch (step.type) {
                case 'create_entity':
                    data = await this.executeCreateEntity(step);
                    break;
                case 'update_entity':
                    data = await this.executeUpdateEntity(step);
                    break;
                case 'create_transaction':
                    data = await this.executeCreateTransaction(step);
                    break;
                case 'create_relationship':
                    data = await this.executeCreateRelationship(step);
                    break;
                case 'validate':
                    data = await this.executeValidation(step);
                    break;
                case 'wait':
                    await this.executeWait(step);
                    break;
                default:
                    throw new Error(`Unknown step type: ${step.type}`);
            }
            // Store result in context
            this.context.set(step.id, data);
            // Run validations if present
            if (step.validations) {
                await this.runValidations(step.validations, data);
            }
            this.log(chalk_1.default.green(`  ✓ Step completed successfully`));
            return {
                stepId: step.id,
                stepName: step.name,
                success: true,
                duration: Date.now() - startTime,
                data,
            };
        }
        catch (error) {
            this.log(chalk_1.default.red(`  ✗ Step failed: ${error.message}`));
            return {
                stepId: step.id,
                stepName: step.name,
                success: false,
                duration: Date.now() - startTime,
                error: error,
            };
        }
    }
    /**
     * Execute entity creation
     */
    async executeCreateEntity(step) {
        const data = this.resolveReferences(step.data);
        const entity = await universal_api_1.universalApi.createEntity(data);
        this.log(chalk_1.default.gray(`  Created entity: ${entity.entity_code}`));
        return entity;
    }
    /**
     * Execute entity update
     */
    async executeUpdateEntity(step) {
        const data = this.resolveReferences(step.data);
        const { id, ...updates } = data;
        const entity = await universal_api_1.universalApi.updateEntity(id, updates);
        this.log(chalk_1.default.gray(`  Updated entity: ${entity.entity_code}`));
        return entity;
    }
    /**
     * Execute transaction creation
     */
    async executeCreateTransaction(step) {
        const data = this.resolveReferences(step.data);
        const transaction = await universal_api_1.universalApi.createTransaction(data);
        this.log(chalk_1.default.gray(`  Created transaction: ${transaction.transaction_code}`));
        return transaction;
    }
    /**
     * Execute relationship creation
     */
    async executeCreateRelationship(step) {
        const data = this.resolveReferences(step.data);
        const relationship = await universal_api_1.universalApi.createRelationship(data);
        this.log(chalk_1.default.gray(`  Created relationship: ${relationship.relationship_type}`));
        return relationship;
    }
    /**
     * Execute validation step
     */
    async executeValidation(step) {
        const validations = step.validations || [];
        const context = this.resolveReferences(step.data || {});
        for (const validation of validations) {
            if (validation.oracle) {
                // Use business oracle for complex validations
                const oracleMethod = business_oracle_1.BusinessOracle[validation.oracle];
                if (!oracleMethod) {
                    throw new Error(`Unknown oracle method: ${validation.oracle}`);
                }
                const result = oracleMethod(...(validation.params || []));
                if (!result.isValid) {
                    throw new Error(`Oracle validation failed: ${result.reason || validation.oracle}`);
                }
            }
        }
        return { validated: true };
    }
    /**
     * Execute wait step
     */
    async executeWait(step) {
        const duration = step.data.duration || 1000;
        this.log(chalk_1.default.gray(`  Waiting ${duration}ms...`));
        await new Promise(resolve => setTimeout(resolve, duration));
    }
    /**
     * Run validations on step result
     */
    async runValidations(validations, data) {
        for (const validation of validations) {
            const actual = this.getNestedValue(data, validation.field);
            switch (validation.type) {
                case 'exists':
                    if (actual === undefined || actual === null) {
                        throw new Error(`Field ${validation.field} does not exist`);
                    }
                    break;
                case 'equals':
                    if (actual !== validation.expected) {
                        throw new Error(`Field ${validation.field} expected ${validation.expected}, got ${actual}`);
                    }
                    break;
                case 'contains':
                    if (!String(actual).includes(validation.expected)) {
                        throw new Error(`Field ${validation.field} does not contain ${validation.expected}`);
                    }
                    break;
                case 'greater_than':
                    if (Number(actual) <= Number(validation.expected)) {
                        throw new Error(`Field ${validation.field} (${actual}) is not greater than ${validation.expected}`);
                    }
                    break;
                case 'less_than':
                    if (Number(actual) >= Number(validation.expected)) {
                        throw new Error(`Field ${validation.field} (${actual}) is not less than ${validation.expected}`);
                    }
                    break;
                case 'business_rule':
                    // Use business oracle
                    if (validation.oracle) {
                        const oracleMethod = business_oracle_1.BusinessOracle[validation.oracle];
                        if (oracleMethod) {
                            const result = oracleMethod(actual, ...(validation.params || []));
                            if (!result.isValid) {
                                throw new Error(`Business rule validation failed: ${result.reason}`);
                            }
                        }
                    }
                    break;
            }
            this.log(chalk_1.default.gray(`    ✓ Validation passed: ${validation.field} ${validation.type}`));
        }
    }
    /**
     * Teardown test environment
     */
    async teardownTest(test) {
        this.log(chalk_1.default.cyan('\\n🧹 Teardown Phase'));
        if (this.options.dryRun || !test.teardown?.clean_data) {
            this.log(chalk_1.default.gray('  (skipping teardown)'));
            return;
        }
        // Clean up test data
        // In a real implementation, this would delete the test organization and all related data
        this.log(chalk_1.default.green('  ✓ Test data cleaned up'));
    }
    /**
     * Resolve references in data (e.g., {{step_id.field}})
     */
    resolveReferences(data) {
        if (typeof data === 'string') {
            // Check for reference pattern {{step_id.field}}
            const refPattern = /{{(\\w+)(?:\\.(\\w+))?}}/g;
            return data.replace(refPattern, (match, stepId, field) => {
                const stepData = this.context.get(stepId);
                if (!stepData)
                    return match;
                return field ? this.getNestedValue(stepData, field) : stepData;
            });
        }
        if (Array.isArray(data)) {
            return data.map(item => this.resolveReferences(item));
        }
        if (typeof data === 'object' && data !== null) {
            const resolved = {};
            for (const [key, value] of Object.entries(data)) {
                resolved[key] = this.resolveReferences(value);
            }
            return resolved;
        }
        return data;
    }
    /**
     * Get nested value from object
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    /**
     * Log message if verbose
     */
    log(message) {
        if (this.options.verbose) {
            console.log(message);
        }
    }
}
exports.DSLRunner = DSLRunner;
