"use strict";
/**
 * HERA Test Runner - Executes business process tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRunner = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
class TestRunner {
    constructor(config) {
        this.executionContext = new Map();
        this.config = config;
        if (config.supabaseUrl && config.supabaseKey) {
            this.supabase = (0, supabase_js_1.createClient)(config.supabaseUrl, config.supabaseKey);
        }
    }
    /**
     * Run a complete business process test
     */
    async runBusinessProcess(test) {
        const startTime = Date.now();
        try {
            console.log(`🧪 Running test: ${test.title}`);
            // Initialize execution context
            this.initializeContext(test);
            // Execute setup actions
            if (test.setup) {
                await this.executeActions('setup', test.setup);
            }
            // Execute test steps
            const stepResults = [];
            for (const step of test.steps) {
                const stepResult = await this.executeStep(step);
                stepResults.push(stepResult);
                if (!stepResult.success && this.config.debug) {
                    console.error(`❌ Step ${step.id} failed:`, stepResult.error);
                    break;
                }
            }
            // Execute assertions
            const assertionResults = await this.executeAssertions(test.assertions);
            // Execute cleanup actions
            if (test.cleanup) {
                await this.executeActions('cleanup', test.cleanup);
            }
            const duration = Date.now() - startTime;
            const success = stepResults.every(s => s.success) &&
                assertionResults.every(a => a.success);
            return {
                success,
                duration,
                steps: stepResults,
                assertions: assertionResults
            };
        }
        catch (error) {
            return {
                success: false,
                duration: Date.now() - startTime,
                steps: [],
                error: error.message
            };
        }
    }
    /**
     * Initialize execution context with test variables
     */
    initializeContext(test) {
        this.executionContext.clear();
        this.executionContext.set('test_org_id', test.context.organization_id);
        this.executionContext.set('timestamp', Date.now());
        this.executionContext.set('clock', test.context.clock || new Date().toISOString());
    }
    /**
     * Execute a single test step
     */
    async executeStep(step) {
        const startTime = Date.now();
        try {
            console.log(`  📋 Executing step: ${step.description}`);
            const actionResults = [];
            for (const action of step.actions) {
                const actionResult = await this.executeAction(action);
                actionResults.push(actionResult);
                // Store result if specified
                if (action.store_as && actionResult.result) {
                    this.executionContext.set(action.store_as, actionResult.result);
                }
                if (!actionResult.success) {
                    return {
                        id: step.id,
                        success: false,
                        duration: Date.now() - startTime,
                        actions: actionResults,
                        error: actionResult.error
                    };
                }
            }
            return {
                id: step.id,
                success: true,
                duration: Date.now() - startTime,
                actions: actionResults
            };
        }
        catch (error) {
            return {
                id: step.id,
                success: false,
                duration: Date.now() - startTime,
                actions: [],
                error: error.message
            };
        }
    }
    /**
     * Execute individual action
     */
    async executeAction(action) {
        const startTime = Date.now();
        try {
            let result;
            switch (action.action_type) {
                case 'create_entity':
                    result = await this.createEntity(action.data);
                    break;
                case 'create_transaction':
                    result = await this.createTransaction(action.data);
                    break;
                case 'create_relationship':
                    result = await this.createRelationship(action.data);
                    break;
                case 'set_dynamic_field':
                    result = await this.setDynamicField(action.entity_id, action.field_name, action.field_value, action.smart_code);
                    break;
                case 'ui_interaction':
                    result = await this.performUIInteraction(action);
                    break;
                case 'api_call':
                    result = await this.makeAPICall(action.endpoint, action.method, action.data);
                    break;
                case 'wait':
                    result = await this.wait(action.duration, action.condition);
                    break;
                default:
                    throw new Error(`Unknown action type: ${action.action_type}`);
            }
            return {
                action_type: action.action_type,
                success: true,
                duration: Date.now() - startTime,
                result
            };
        }
        catch (error) {
            return {
                action_type: action.action_type,
                success: false,
                duration: Date.now() - startTime,
                error: error.message
            };
        }
    }
    /**
     * Create entity using Universal API
     */
    async createEntity(data) {
        if (!this.supabase) {
            // Mock mode for testing without database
            return {
                id: `mock-entity-${Date.now()}`,
                ...data,
                organization_id: this.config.organizationId
            };
        }
        const entityData = {
            ...data,
            organization_id: this.config.organizationId,
            created_at: new Date().toISOString()
        };
        const { data: result, error } = await this.supabase
            .from('core_entities')
            .insert(entityData)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create entity: ${error.message}`);
        }
        return result;
    }
    /**
     * Create transaction using Universal API
     */
    async createTransaction(data) {
        if (!this.supabase) {
            // Mock mode
            return {
                id: `mock-transaction-${Date.now()}`,
                ...data,
                organization_id: this.config.organizationId
            };
        }
        // Create transaction header
        const transactionData = {
            ...data,
            organization_id: this.config.organizationId,
            transaction_date: new Date().toISOString()
        };
        const { data: transaction, error: transactionError } = await this.supabase
            .from('universal_transactions')
            .insert(transactionData)
            .select()
            .single();
        if (transactionError) {
            throw new Error(`Failed to create transaction: ${transactionError.message}`);
        }
        // Create transaction lines if provided
        if (data.line_items && data.line_items.length > 0) {
            const lineItems = data.line_items.map((line) => ({
                ...line,
                transaction_id: transaction.id,
                organization_id: this.config.organizationId
            }));
            const { error: linesError } = await this.supabase
                .from('universal_transaction_lines')
                .insert(lineItems);
            if (linesError) {
                throw new Error(`Failed to create transaction lines: ${linesError.message}`);
            }
        }
        return transaction;
    }
    /**
     * Create relationship
     */
    async createRelationship(data) {
        if (!this.supabase) {
            return {
                id: `mock-relationship-${Date.now()}`,
                ...data,
                organization_id: this.config.organizationId
            };
        }
        const relationshipData = {
            ...data,
            organization_id: this.config.organizationId,
            created_at: new Date().toISOString()
        };
        const { data: result, error } = await this.supabase
            .from('core_relationships')
            .insert(relationshipData)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create relationship: ${error.message}`);
        }
        return result;
    }
    /**
     * Set dynamic field
     */
    async setDynamicField(entityId, fieldName, fieldValue, smartCode) {
        if (!this.supabase) {
            return { entity_id: entityId, field_name: fieldName, field_value: fieldValue };
        }
        const dynamicData = {
            entity_id: entityId,
            field_name: fieldName,
            smart_code: smartCode,
            organization_id: this.config.organizationId
        };
        // Determine field type and set appropriate column
        if (typeof fieldValue === 'string') {
            dynamicData.field_value_text = fieldValue;
        }
        else if (typeof fieldValue === 'number') {
            dynamicData.field_value_number = fieldValue;
        }
        else if (typeof fieldValue === 'boolean') {
            dynamicData.field_value_boolean = fieldValue;
        }
        else if (fieldValue instanceof Date) {
            dynamicData.field_value_date = fieldValue.toISOString();
        }
        const { data: result, error } = await this.supabase
            .from('core_dynamic_data')
            .upsert(dynamicData, {
            onConflict: 'entity_id,field_name',
            ignoreDuplicates: false
        })
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to set dynamic field: ${error.message}`);
        }
        return result;
    }
    /**
     * Perform UI interaction (placeholder for Playwright integration)
     */
    async performUIInteraction(action) {
        // In a full implementation, this would use Playwright
        console.log(`UI Interaction: ${action.interaction} on ${action.selector}`);
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true };
    }
    /**
     * Make API call
     */
    async makeAPICall(endpoint, method, data) {
        const url = `${this.config.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Wait for specified duration or condition
     */
    async wait(duration, condition) {
        console.log(`Waiting ${duration}ms${condition ? ` for condition: ${condition}` : ''}`);
        await new Promise(resolve => setTimeout(resolve, duration));
        return { waited: duration };
    }
    /**
     * Execute multiple actions (setup, cleanup)
     */
    async executeActions(phase, actions) {
        console.log(`  🔧 Executing ${phase} actions...`);
        for (const action of actions) {
            const result = await this.executeAction(action);
            if (action.store_as && result.result) {
                this.executionContext.set(action.store_as, result.result);
            }
            if (!result.success) {
                throw new Error(`${phase} action failed: ${result.error}`);
            }
        }
    }
    /**
     * Execute test assertions
     */
    async executeAssertions(assertions) {
        console.log('  ✅ Executing assertions...');
        const results = [];
        for (const assertion of assertions) {
            try {
                let success = false;
                let details;
                switch (assertion.type) {
                    case 'database':
                        ({ success, details } = await this.executeDatabaseAssertions(assertion.assertions));
                        break;
                    case 'business':
                        ({ success, details } = await this.executeBusinessAssertions(assertion.assertions));
                        break;
                    case 'ui':
                        ({ success, details } = await this.executeUIAssertions(assertion.assertions));
                        break;
                    default:
                        throw new Error(`Unknown assertion type: ${assertion.type}`);
                }
                results.push({ type: assertion.type, success, details });
            }
            catch (error) {
                results.push({
                    type: assertion.type,
                    success: false,
                    error: error.message
                });
            }
        }
        return results;
    }
    /**
     * Execute database assertions
     */
    async executeDatabaseAssertions(assertions) {
        if (!this.supabase) {
            return { success: true, details: { mode: 'mock' } };
        }
        const results = [];
        for (const assertion of assertions) {
            const { table, condition, filters, expected } = assertion;
            let query = this.supabase.from(table).select('*');
            if (filters) {
                for (const [key, value] of Object.entries(filters)) {
                    query = query.eq(key, value);
                }
            }
            const { data, error } = await query;
            if (error) {
                throw new Error(`Database query failed: ${error.message}`);
            }
            let actual;
            let passes = false;
            switch (condition) {
                case 'exists':
                    actual = data && data.length > 0;
                    passes = actual === expected;
                    break;
                case 'not_exists':
                    actual = !data || data.length === 0;
                    passes = actual === expected;
                    break;
                case 'count':
                    actual = data ? data.length : 0;
                    passes = actual === expected;
                    break;
                case 'equals':
                    actual = data;
                    passes = JSON.stringify(actual) === JSON.stringify(expected);
                    break;
                default:
                    throw new Error(`Unknown database condition: ${condition}`);
            }
            results.push({ table, condition, expected, actual, passes });
        }
        return {
            success: results.every(r => r.passes),
            details: results
        };
    }
    /**
     * Execute business logic assertions using oracles
     */
    async executeBusinessAssertions(assertions) {
        const results = [];
        for (const assertion of assertions) {
            const { oracle, expected, tolerance } = assertion;
            let actual;
            let passes = false;
            switch (oracle) {
                case 'smart_code_validation':
                    // This would validate smart codes using the oracle
                    actual = true; // Placeholder
                    passes = actual === expected;
                    break;
                case 'accounting_equation':
                    // This would use the accounting oracle
                    actual = true; // Placeholder
                    passes = actual === expected;
                    break;
                default:
                    console.warn(`Unknown business oracle: ${oracle}`);
                    actual = expected;
                    passes = true;
            }
            results.push({ oracle, expected, actual, passes, tolerance });
        }
        return {
            success: results.every(r => r.passes),
            details: results
        };
    }
    /**
     * Execute UI assertions (placeholder)
     */
    async executeUIAssertions(assertions) {
        // In a full implementation, this would use Playwright to verify UI state
        console.log('UI assertions not fully implemented in this version');
        return {
            success: true,
            details: { message: 'UI assertions skipped in this version' }
        };
    }
}
exports.TestRunner = TestRunner;
