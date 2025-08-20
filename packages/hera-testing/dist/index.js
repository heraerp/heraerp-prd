"use strict";
/**
 * HERA Universal Testing Framework
 * Entry point for the testing framework library
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = exports.VERSION = exports.businessOracles = exports.PlaywrightGenerator = exports.TestRunner = void 0;
exports.createTestRunner = createTestRunner;
exports.validateTest = validateTest;
exports.parseTest = parseTest;
// Core DSL and Schema
__exportStar(require("./dsl/schema"), exports);
__exportStar(require("./dsl/parser"), exports);
// Test Runner
var test_runner_1 = require("./runners/test-runner");
Object.defineProperty(exports, "TestRunner", { enumerable: true, get: function () { return test_runner_1.TestRunner; } });
// Generators
var playwright_generator_1 = require("./generators/playwright-generator");
Object.defineProperty(exports, "PlaywrightGenerator", { enumerable: true, get: function () { return playwright_generator_1.PlaywrightGenerator; } });
// Business Oracles
var business_oracles_1 = require("./oracles/business-oracles");
Object.defineProperty(exports, "businessOracles", { enumerable: true, get: function () { return business_oracles_1.businessOracles; } });
// Version
exports.VERSION = '1.0.0';
// Default configuration
exports.DEFAULT_CONFIG = {
    timeout: 30000,
    retries: 2,
    browsers: ['chromium'],
    headless: true,
    debug: false
};
/**
 * Create a new HERA test runner instance
 */
function createTestRunner(config) {
    return new TestRunner(config);
}
/**
 * Validate a business process test file
 */
async function validateTest(content) {
    const { validateBusinessProcessTest } = await Promise.resolve().then(() => __importStar(require('./dsl/parser')));
    return validateBusinessProcessTest(content);
}
/**
 * Parse a business process test file
 */
async function parseTest(content) {
    const { parseBusinessProcessTest } = await Promise.resolve().then(() => __importStar(require('./dsl/parser')));
    return parseBusinessProcessTest(content);
}
