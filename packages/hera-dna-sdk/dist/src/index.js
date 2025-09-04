"use strict";
/**
 * HERA DNA SDK
 * Type-safe enforcement of the sacred 6-table architecture
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.narrowTransactionType = exports.narrowEntityType = exports.assertSacredTable = exports.assertOrganizationId = exports.assertSmartCode = exports.assertDNA = exports.isCoreRelationship = exports.isCoreDynamicData = exports.isUniversalTransaction = exports.isCoreEntity = exports.isTransactionId = exports.isEntityId = exports.OrganizationIdSchema = exports.SmartCodeSchema = exports.UniversalTransactionSchema = exports.CoreEntitySchema = exports.ORGANIZATION_ID_REGEX = exports.SMART_CODE_PATTERN = exports.buildSmartCode = exports.validateTransactionId = exports.validateEntityId = exports.createTransactionId = exports.createEntityId = exports.createOrganizationId = exports.createSmartCode = exports.MODULE_TYPES = exports.INDUSTRY_TYPES = exports.OrganizationIsolationError = exports.DNAViolationError = exports.SACRED_TABLES = void 0;
// Re-export specific items to avoid conflicts
var types_1 = require("./types");
Object.defineProperty(exports, "SACRED_TABLES", { enumerable: true, get: function () { return types_1.SACRED_TABLES; } });
Object.defineProperty(exports, "DNAViolationError", { enumerable: true, get: function () { return types_1.DNAViolationError; } });
Object.defineProperty(exports, "OrganizationIsolationError", { enumerable: true, get: function () { return types_1.OrganizationIsolationError; } });
Object.defineProperty(exports, "INDUSTRY_TYPES", { enumerable: true, get: function () { return types_1.INDUSTRY_TYPES; } });
Object.defineProperty(exports, "MODULE_TYPES", { enumerable: true, get: function () { return types_1.MODULE_TYPES; } });
// Functions
Object.defineProperty(exports, "createSmartCode", { enumerable: true, get: function () { return types_1.createSmartCode; } });
Object.defineProperty(exports, "createOrganizationId", { enumerable: true, get: function () { return types_1.createOrganizationId; } });
Object.defineProperty(exports, "createEntityId", { enumerable: true, get: function () { return types_1.createEntityId; } });
Object.defineProperty(exports, "createTransactionId", { enumerable: true, get: function () { return types_1.createTransactionId; } });
Object.defineProperty(exports, "validateEntityId", { enumerable: true, get: function () { return types_1.validateEntityId; } });
Object.defineProperty(exports, "validateTransactionId", { enumerable: true, get: function () { return types_1.validateTransactionId; } });
Object.defineProperty(exports, "buildSmartCode", { enumerable: true, get: function () { return types_1.buildSmartCode; } });
// Constants
Object.defineProperty(exports, "SMART_CODE_PATTERN", { enumerable: true, get: function () { return types_1.SMART_CODE_PATTERN; } });
Object.defineProperty(exports, "ORGANIZATION_ID_REGEX", { enumerable: true, get: function () { return types_1.ORGANIZATION_ID_REGEX; } });
// Schemas
Object.defineProperty(exports, "CoreEntitySchema", { enumerable: true, get: function () { return types_1.CoreEntitySchema; } });
Object.defineProperty(exports, "UniversalTransactionSchema", { enumerable: true, get: function () { return types_1.UniversalTransactionSchema; } });
Object.defineProperty(exports, "SmartCodeSchema", { enumerable: true, get: function () { return types_1.SmartCodeSchema; } });
Object.defineProperty(exports, "OrganizationIdSchema", { enumerable: true, get: function () { return types_1.OrganizationIdSchema; } });
__exportStar(require("./client"), exports);
__exportStar(require("./validators"), exports);
// Export specific guards to avoid conflicts
var guards_1 = require("./guards");
Object.defineProperty(exports, "isEntityId", { enumerable: true, get: function () { return guards_1.isEntityId; } });
Object.defineProperty(exports, "isTransactionId", { enumerable: true, get: function () { return guards_1.isTransactionId; } });
Object.defineProperty(exports, "isCoreEntity", { enumerable: true, get: function () { return guards_1.isCoreEntity; } });
Object.defineProperty(exports, "isUniversalTransaction", { enumerable: true, get: function () { return guards_1.isUniversalTransaction; } });
Object.defineProperty(exports, "isCoreDynamicData", { enumerable: true, get: function () { return guards_1.isCoreDynamicData; } });
Object.defineProperty(exports, "isCoreRelationship", { enumerable: true, get: function () { return guards_1.isCoreRelationship; } });
Object.defineProperty(exports, "assertDNA", { enumerable: true, get: function () { return guards_1.assertDNA; } });
Object.defineProperty(exports, "assertSmartCode", { enumerable: true, get: function () { return guards_1.assertSmartCode; } });
Object.defineProperty(exports, "assertOrganizationId", { enumerable: true, get: function () { return guards_1.assertOrganizationId; } });
Object.defineProperty(exports, "assertSacredTable", { enumerable: true, get: function () { return guards_1.assertSacredTable; } });
Object.defineProperty(exports, "narrowEntityType", { enumerable: true, get: function () { return guards_1.narrowEntityType; } });
Object.defineProperty(exports, "narrowTransactionType", { enumerable: true, get: function () { return guards_1.narrowTransactionType; } });
__exportStar(require("./builders"), exports);
// Re-export generated SDK functions
__exportStar(require("../generated/sdk-functions"), exports);
//# sourceMappingURL=index.js.map