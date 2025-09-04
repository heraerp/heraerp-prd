"use strict";
/**
 * HERA DNA SDK Constants
 * Shared constants and configurations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELATIONSHIP_TYPES = exports.TRANSACTION_TYPES = exports.ENTITY_TYPES = exports.ORGANIZATION_ID_REGEX = exports.SMART_CODE_REGEX = void 0;
// Export smart code regex pattern
exports.SMART_CODE_REGEX = /^HERA\.[A-Z0-9]{2,15}(?:\.[A-Z0-9_]{2,30}){2,8}\.v[0-9]+$/;
// Export organization ID regex pattern  
exports.ORGANIZATION_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Export entity types
exports.ENTITY_TYPES = [
    'customer',
    'vendor',
    'product',
    'employee',
    'gl_account',
    'budget',
    'forecast',
    'location',
    'project',
    'development_task',
    'user',
    'ai_agent',
    'workflow_status',
    'msg_template',
    'agent_queue'
];
// Export transaction types
exports.TRANSACTION_TYPES = [
    'sale',
    'purchase',
    'payment',
    'transfer',
    'journal_entry',
    'budget_line',
    'forecast_line',
    'MESSAGE_THREAD',
    'CAMPAIGN'
];
// Export relationship types
exports.RELATIONSHIP_TYPES = [
    'has_status',
    'parent_of',
    'reports_to',
    'customer_of',
    'vendor_of',
    'member_of',
    'assigned_to'
];
//# sourceMappingURL=constants.js.map