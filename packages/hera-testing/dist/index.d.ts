/**
 * HERA Universal Testing Framework
 * Entry point for the testing framework library
 */
export * from './dsl/schema';
export * from './dsl/parser';
export { TestRunner } from './runners/test-runner';
export type { TestRunnerConfig, TestResult } from './runners/test-runner';
export { PlaywrightGenerator } from './generators/playwright-generator';
export { businessOracles } from './oracles/business-oracles';
export type { EntityData, TransactionData, TransactionLineData, RelationshipData, DynamicFieldData } from './oracles/business-oracles';
export declare const VERSION = "1.0.0";
export declare const DEFAULT_CONFIG: {
    timeout: number;
    retries: number;
    browsers: string[];
    headless: boolean;
    debug: boolean;
};
/**
 * Create a new HERA test runner instance
 */
export declare function createTestRunner(config: any): any;
/**
 * Validate a business process test file
 */
export declare function validateTest(content: string): Promise<{
    valid: boolean;
    errors: string[];
}>;
/**
 * Parse a business process test file
 */
export declare function parseTest(content: string): Promise<{
    metadata: {
        tags: string[];
        priority: "low" | "medium" | "high" | "critical";
        requires_auth: boolean;
        requires_data: boolean;
        browser_support: ("chromium" | "firefox" | "webkit")[];
        mobile_support: boolean;
        estimated_duration?: number | undefined;
    };
    id: string;
    assertions: ({
        type: "ui";
        assertions: {
            condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
            value?: any;
            selector?: string | undefined;
            timeout?: number | undefined;
        }[];
    } | {
        type: "database";
        assertions: {
            condition: "contains" | "count" | "exists" | "not_exists" | "equals";
            table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
            expected?: any;
            filters?: Record<string, any> | undefined;
        }[];
    } | {
        type: "business";
        assertions: {
            oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
            expected?: any;
            tolerance?: number | undefined;
        }[];
    })[];
    title: string;
    version: string;
    context: {
        organization_id: string;
        tenant: string;
        currency: string;
        timezone: string;
        locale: string;
        fiscal_year: number;
        smart_code_prefix: string;
        clock?: string | undefined;
        industry?: "restaurant" | "healthcare" | "retail" | "salon" | "manufacturing" | "professional_services" | undefined;
    };
    personas: Record<string, {
        role: "owner" | "admin" | "manager" | "user" | "accountant" | "warehouse" | "sales" | "hr";
        organization_id?: string | undefined;
        entity_id?: string | undefined;
        permissions?: string[] | undefined;
    }>;
    steps: {
        timeout: number;
        id: string;
        description: string;
        persona: string;
        actions: ({
            action_type: "create_entity";
            data: {
                entity_type: string;
                entity_name: string;
                smart_code: string;
                entity_code?: string | undefined;
                metadata?: Record<string, any> | undefined;
                dynamic_fields?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        } | {
            action_type: "create_transaction";
            data: {
                smart_code: string;
                transaction_type: string;
                currency?: string | undefined;
                metadata?: Record<string, any> | undefined;
                transaction_code?: string | undefined;
                total_amount?: number | undefined;
                reference_entity_id?: string | undefined;
                line_items?: {
                    smart_code: string;
                    line_number: number;
                    line_amount: number;
                    metadata?: Record<string, any> | undefined;
                    line_entity_id?: string | undefined;
                    quantity?: number | undefined;
                    unit_price?: number | undefined;
                }[] | undefined;
            };
            store_as?: string | undefined;
        } | {
            action_type: "create_relationship";
            data: {
                smart_code: string;
                from_entity_id: string;
                to_entity_id: string;
                relationship_type: string;
                relationship_data?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        } | {
            entity_id: string;
            smart_code: string;
            action_type: "set_dynamic_field";
            field_name: string;
            field_value?: any;
        } | {
            action_type: "ui_interaction";
            selector: string;
            interaction: "fill" | "click" | "select" | "upload" | "wait";
            value?: string | undefined;
            timeout?: number | undefined;
        } | {
            action_type: "api_call";
            endpoint: string;
            method: "GET" | "POST" | "PUT" | "DELETE";
            data?: Record<string, any> | undefined;
            store_as?: string | undefined;
        } | {
            action_type: "wait";
            duration: number;
            condition?: string | undefined;
        })[];
        retry: number;
        preconditions?: string[] | undefined;
        postconditions?: string[] | undefined;
    }[];
    industry?: string | undefined;
    description?: string | undefined;
    author?: string | undefined;
    setup?: ({
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    } | {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    } | {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    } | {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    })[] | undefined;
    cleanup?: ({
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    } | {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    } | {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    } | {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    })[] | undefined;
}>;
