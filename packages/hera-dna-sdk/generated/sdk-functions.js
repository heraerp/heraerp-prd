"use strict";
/**
 * Generated HERA DNA SDK Functions
 * Auto-generated from MCP tools - DO NOT EDIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMCP = initializeMCP;
exports.create_entity = create_entity;
exports.create_transaction = create_transaction;
exports.set_dynamic_field = set_dynamic_field;
exports.create_relationship = create_relationship;
exports.query_universal = query_universal;
let mcpClient;
function initializeMCP(client) {
    mcpClient = client;
}
/**
 * create-entity - MCP-backed SDK function
 */
async function create_entity(entity_type, entity_name, smart_code, organization_id) {
    if (!mcpClient) {
        throw new Error('MCP client not initialized. Call initializeMCP first.');
    }
    // Validate inputs
    if (!entity_type)
        throw new Error('entity_type is required');
    if (!entity_name)
        throw new Error('entity_name is required');
    if (!smart_code)
        throw new Error('Smart code is required');
    if (!organization_id)
        throw new Error('Organization ID is required');
    try {
        const result = await mcpClient.call('create-entity', {
            entity_type,
            entity_name,
            smart_code,
            organization_id
        });
        return {
            success: true,
            data: result,
            smartCode: smart_code,
            organizationId: organization_id
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            smartCode: smart_code,
            organizationId: organization_id
        };
    }
}
/**
 * create-transaction - MCP-backed SDK function
 */
async function create_transaction(transaction_type, transaction_code, smart_code, organization_id, amount) {
    if (!mcpClient) {
        throw new Error('MCP client not initialized. Call initializeMCP first.');
    }
    // Validate inputs
    if (!transaction_type)
        throw new Error('transaction_type is required');
    if (!transaction_code)
        throw new Error('transaction_code is required');
    if (!smart_code)
        throw new Error('Smart code is required');
    if (!organization_id)
        throw new Error('Organization ID is required');
    if (!amount)
        throw new Error('amount is required');
    try {
        const result = await mcpClient.call('create-transaction', {
            transaction_type,
            transaction_code,
            smart_code,
            organization_id,
            amount
        });
        return {
            success: true,
            data: result,
            smartCode: smart_code,
            organizationId: organization_id
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            smartCode: smart_code,
            organizationId: organization_id
        };
    }
}
/**
 * set-dynamic-field - MCP-backed SDK function
 */
async function set_dynamic_field(entity_id, field_name, field_value, smart_code, organization_id) {
    if (!mcpClient) {
        throw new Error('MCP client not initialized. Call initializeMCP first.');
    }
    // Validate inputs
    if (!entity_id)
        throw new Error('entity_id is required');
    if (!field_name)
        throw new Error('field_name is required');
    if (!field_value)
        throw new Error('field_value is required');
    if (!smart_code)
        throw new Error('Smart code is required');
    if (!organization_id)
        throw new Error('Organization ID is required');
    try {
        const result = await mcpClient.call('set-dynamic-field', {
            entity_id,
            field_name,
            field_value,
            smart_code,
            organization_id
        });
        return {
            success: true,
            data: result,
            smartCode: smart_code,
            organizationId: organization_id
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            smartCode: smart_code,
            organizationId: organization_id
        };
    }
}
/**
 * create-relationship - MCP-backed SDK function
 */
async function create_relationship(from_entity_id, to_entity_id, relationship_type, smart_code, organization_id) {
    if (!mcpClient) {
        throw new Error('MCP client not initialized. Call initializeMCP first.');
    }
    // Validate inputs
    if (!from_entity_id)
        throw new Error('from_entity_id is required');
    if (!to_entity_id)
        throw new Error('to_entity_id is required');
    if (!relationship_type)
        throw new Error('relationship_type is required');
    if (!smart_code)
        throw new Error('Smart code is required');
    if (!organization_id)
        throw new Error('Organization ID is required');
    try {
        const result = await mcpClient.call('create-relationship', {
            from_entity_id,
            to_entity_id,
            relationship_type,
            smart_code,
            organization_id
        });
        return {
            success: true,
            data: result,
            smartCode: smart_code,
            organizationId: organization_id
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            smartCode: smart_code,
            organizationId: organization_id
        };
    }
}
/**
 * query-universal - MCP-backed SDK function
 */
async function query_universal(table, filters, organization_id, smart_code) {
    if (!mcpClient) {
        throw new Error('MCP client not initialized. Call initializeMCP first.');
    }
    // Validate inputs
    if (!table)
        throw new Error('table is required');
    if (!filters)
        throw new Error('filters is required');
    if (!organization_id)
        throw new Error('Organization ID is required');
    if (!smart_code)
        throw new Error('Smart code is required');
    try {
        const result = await mcpClient.call('query-universal', {
            table,
            filters,
            organization_id,
            smart_code
        });
        return {
            success: true,
            data: result,
            smartCode: smart_code,
            organizationId: organization_id
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            smartCode: smart_code,
            organizationId: organization_id
        };
    }
}
//# sourceMappingURL=sdk-functions.js.map