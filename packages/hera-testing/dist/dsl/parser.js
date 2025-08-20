"use strict";
/**
 * HERA Testing DSL Parser
 * Parses YAML business process test files and validates them
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dslParser = exports.TestParseError = void 0;
exports.parseBusinessProcessTest = parseBusinessProcessTest;
exports.validateBusinessProcessTest = validateBusinessProcessTest;
exports.extractTestMetadata = extractTestMetadata;
exports.generateTestTemplate = generateTestTemplate;
const yaml_1 = __importDefault(require("yaml"));
const schema_1 = require("./schema");
class TestParseError extends Error {
    constructor(message, errors) {
        super(message);
        this.errors = errors;
        this.name = 'TestParseError';
    }
}
exports.TestParseError = TestParseError;
/**
 * Parse a YAML business process test file
 */
async function parseBusinessProcessTest(content) {
    try {
        // Parse YAML content
        const yamlData = yaml_1.default.parse(content);
        if (!yamlData) {
            throw new TestParseError('Empty or invalid YAML content');
        }
        // Validate against schema
        const result = schema_1.BusinessProcessTestSchema.safeParse(yamlData);
        if (!result.success) {
            const errors = formatZodErrors(result.error);
            throw new TestParseError('Schema validation failed', errors);
        }
        // Resolve references and template variables
        const resolvedTest = await resolveReferences(result.data);
        return resolvedTest;
    }
    catch (error) {
        if (error instanceof TestParseError) {
            throw error;
        }
        if (error instanceof Error && error.name === 'YAMLParseError') {
            throw new TestParseError(`YAML parsing error: ${error.message}`);
        }
        throw new TestParseError(`Parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Format Zod validation errors into readable messages
 */
function formatZodErrors(error) {
    return error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
    });
}
/**
 * Resolve template variables and references in test data
 */
async function resolveReferences(test) {
    const context = {
        variables: new Map(),
        timestamp: Date.now(),
        test_org_id: test.context.organization_id
    };
    // Pre-populate common variables
    context.variables.set('timestamp', context.timestamp);
    context.variables.set('test_org_id', context.test_org_id);
    context.variables.set('clock', test.context.clock || new Date().toISOString());
    // Resolve setup actions
    if (test.setup) {
        test.setup = await Promise.all(test.setup.map(action => resolveActionReferences(action, context)));
    }
    // Resolve steps
    test.steps = await Promise.all(test.steps.map(async (step) => ({
        ...step,
        actions: await Promise.all(step.actions.map(action => resolveActionReferences(action, context)))
    })));
    // Resolve cleanup actions
    if (test.cleanup) {
        test.cleanup = await Promise.all(test.cleanup.map(action => resolveActionReferences(action, context)));
    }
    return test;
}
/**
 * Resolve references in individual actions
 */
async function resolveActionReferences(action, context) {
    const resolvedAction = JSON.parse(JSON.stringify(action));
    // Recursively resolve template variables
    function resolveValue(value) {
        if (typeof value === 'string') {
            return resolveTemplateString(value, context);
        }
        else if (Array.isArray(value)) {
            return value.map(resolveValue);
        }
        else if (typeof value === 'object' && value !== null) {
            const resolved = {};
            for (const [key, val] of Object.entries(value)) {
                resolved[key] = resolveValue(val);
            }
            return resolved;
        }
        return value;
    }
    return resolveValue(resolvedAction);
}
/**
 * Resolve template strings like {{variable}} or {{step.field}}
 */
function resolveTemplateString(str, context) {
    const templateRegex = /\{\{([^}]+)\}\}/g;
    return str.replace(templateRegex, (match, expression) => {
        const trimmed = expression.trim();
        // Handle simple variables
        if (context.variables.has(trimmed)) {
            return context.variables.get(trimmed);
        }
        // Handle dot notation (e.g., step.field)
        if (trimmed.includes('.')) {
            const parts = trimmed.split('.');
            let value = context.variables.get(parts[0]);
            for (let i = 1; i < parts.length && value !== undefined; i++) {
                value = value[parts[i]];
            }
            if (value !== undefined) {
                return value;
            }
        }
        // Handle special expressions
        if (trimmed.startsWith('clock+')) {
            const offset = parseInt(trimmed.substring(6));
            const baseTime = new Date(context.variables.get('clock') || new Date());
            return new Date(baseTime.getTime() + offset * 1000).toISOString();
        }
        if (trimmed === 'timestamp') {
            return context.timestamp.toString();
        }
        // Return original if not resolved
        return match;
    });
}
/**
 * Validate business process test without parsing
 */
function validateBusinessProcessTest(content) {
    try {
        const yamlData = yaml_1.default.parse(content);
        const result = schema_1.BusinessProcessTestSchema.safeParse(yamlData);
        if (result.success) {
            return { valid: true, errors: [] };
        }
        else {
            return { valid: false, errors: formatZodErrors(result.error) };
        }
    }
    catch (error) {
        return { valid: false, errors: [`Parse error: ${error instanceof Error ? error.message : String(error)}`] };
    }
}
/**
 * Extract metadata from business process test
 */
function extractTestMetadata(content) {
    try {
        const yamlData = yaml_1.default.parse(content);
        return {
            id: yamlData.id,
            title: yamlData.title,
            industry: yamlData.industry,
            stepCount: yamlData.steps?.length || 0,
            personaCount: Object.keys(yamlData.personas || {}).length,
            estimatedDuration: yamlData.metadata?.estimated_duration
        };
    }
    catch (error) {
        return {};
    }
}
/**
 * Generate test template for specific industry
 */
function generateTestTemplate(industry, testName) {
    const baseTemplate = {
        id: `${industry}-${testName.toLowerCase().replace(/\s+/g, '-')}`,
        title: testName,
        industry: industry,
        version: '1.0.0',
        context: {
            tenant: `${industry}-test`,
            organization_id: '{{test_org_id}}',
            currency: 'USD',
            industry: industry
        },
        personas: getIndustryPersonas(industry),
        steps: getIndustrySteps(industry),
        assertions: getIndustryAssertions(industry),
        metadata: {
            tags: [industry],
            priority: 'medium',
            requires_auth: true,
            requires_data: true
        }
    };
    return yaml_1.default.stringify(baseTemplate, { lineWidth: 100 });
}
/**
 * Get industry-specific personas
 */
function getIndustryPersonas(industry) {
    const commonPersonas = {
        owner: { role: 'owner', permissions: ['*'] },
        manager: { role: 'manager', permissions: ['read', 'write'] },
        user: { role: 'user', permissions: ['read'] }
    };
    const industryPersonas = {
        restaurant: {
            ...commonPersonas,
            server: { role: 'sales', permissions: ['orders:create', 'menu:read'] },
            kitchen: { role: 'user', permissions: ['orders:read', 'kitchen:update'] },
            cashier: { role: 'manager', permissions: ['payments:create', 'cash:access'] }
        },
        healthcare: {
            ...commonPersonas,
            doctor: { role: 'manager', permissions: ['patients:all', 'treatments:create'] },
            nurse: { role: 'user', permissions: ['patients:read', 'vitals:update'] },
            receptionist: { role: 'sales', permissions: ['appointments:create', 'billing:read'] }
        },
        salon: {
            ...commonPersonas,
            stylist: { role: 'user', permissions: ['appointments:read', 'services:perform'] },
            receptionist: { role: 'sales', permissions: ['appointments:create', 'customers:read'] },
            cashier: { role: 'user', permissions: ['payments:create', 'products:sell'] }
        }
    };
    return industryPersonas[industry] || commonPersonas;
}
/**
 * Get industry-specific step templates
 */
function getIndustrySteps(industry) {
    const baseSteps = [
        {
            id: 'setup_data',
            description: 'Setup test data',
            persona: 'user',
            actions: [
                {
                    action_type: 'create_entity',
                    data: {
                        entity_type: 'customer',
                        entity_name: 'Test Customer',
                        smart_code: 'HERA.CRM.CUST.ENT.PROF.v1'
                    }
                }
            ]
        }
    ];
    return baseSteps;
}
/**
 * Get industry-specific assertions
 */
function getIndustryAssertions(industry) {
    return [
        {
            type: 'database',
            assertions: [
                {
                    table: 'core_entities',
                    condition: 'exists',
                    expected: true
                }
            ]
        },
        {
            type: 'business',
            assertions: [
                {
                    oracle: 'smart_code_validation',
                    expected: true
                }
            ]
        }
    ];
}
// Export for external use
exports.dslParser = {
    parseBusinessProcessTest,
    validateBusinessProcessTest,
    extractTestMetadata,
    generateTestTemplate
};
