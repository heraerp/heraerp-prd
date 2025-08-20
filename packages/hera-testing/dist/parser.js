"use strict";
/**
 * HERA Testing DSL Parser
 * Parses YAML business process test files and validates them
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dslParser = exports.TestParseError = void 0;
exports.parseBusinessProcessTest = parseBusinessProcessTest;
exports.validateBusinessProcessTest = validateBusinessProcessTest;
exports.extractTestMetadata = extractTestMetadata;
exports.generateTestTemplate = generateTestTemplate;
var yaml_1 = __importDefault(require("yaml"));
var schema_1 = require("./schema");
var TestParseError = /** @class */ (function (_super) {
    __extends(TestParseError, _super);
    function TestParseError(message, errors) {
        var _this = _super.call(this, message) || this;
        _this.errors = errors;
        _this.name = 'TestParseError';
        return _this;
    }
    return TestParseError;
}(Error));
exports.TestParseError = TestParseError;
/**
 * Parse a YAML business process test file
 */
function parseBusinessProcessTest(content) {
    return __awaiter(this, void 0, void 0, function () {
        var yamlData, result, errors, resolvedTest, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    yamlData = yaml_1.default.parse(content);
                    if (!yamlData) {
                        throw new TestParseError('Empty or invalid YAML content');
                    }
                    result = schema_1.BusinessProcessTestSchema.safeParse(yamlData);
                    if (!result.success) {
                        errors = formatZodErrors(result.error);
                        throw new TestParseError('Schema validation failed', errors);
                    }
                    return [4 /*yield*/, resolveReferences(result.data)];
                case 1:
                    resolvedTest = _a.sent();
                    return [2 /*return*/, resolvedTest];
                case 2:
                    error_1 = _a.sent();
                    if (error_1 instanceof TestParseError) {
                        throw error_1;
                    }
                    if (error_1 instanceof Error && error_1.name === 'YAMLParseError') {
                        throw new TestParseError("YAML parsing error: ".concat(error_1.message));
                    }
                    throw new TestParseError("Parsing failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Format Zod validation errors into readable messages
 */
function formatZodErrors(error) {
    return error.errors.map(function (err) {
        var path = err.path.join('.');
        return "".concat(path, ": ").concat(err.message);
    });
}
/**
 * Resolve template variables and references in test data
 */
function resolveReferences(test) {
    return __awaiter(this, void 0, void 0, function () {
        var context, _a, _b, _c;
        var _this = this;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    context = {
                        variables: new Map(),
                        timestamp: Date.now(),
                        test_org_id: test.context.organization_id
                    };
                    // Pre-populate common variables
                    context.variables.set('timestamp', context.timestamp);
                    context.variables.set('test_org_id', context.test_org_id);
                    context.variables.set('clock', test.context.clock || new Date().toISOString());
                    if (!test.setup) return [3 /*break*/, 2];
                    _a = test;
                    return [4 /*yield*/, Promise.all(test.setup.map(function (action) { return resolveActionReferences(action, context); }))];
                case 1:
                    _a.setup = _d.sent();
                    _d.label = 2;
                case 2:
                    // Resolve steps
                    _b = test;
                    return [4 /*yield*/, Promise.all(test.steps.map(function (step) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            var _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _a = [__assign({}, step)];
                                        _b = {};
                                        return [4 /*yield*/, Promise.all(step.actions.map(function (action) { return resolveActionReferences(action, context); }))];
                                    case 1: return [2 /*return*/, (__assign.apply(void 0, _a.concat([(_b.actions = _c.sent(), _b)])))];
                                }
                            });
                        }); }))];
                case 3:
                    // Resolve steps
                    _b.steps = _d.sent();
                    if (!test.cleanup) return [3 /*break*/, 5];
                    _c = test;
                    return [4 /*yield*/, Promise.all(test.cleanup.map(function (action) { return resolveActionReferences(action, context); }))];
                case 4:
                    _c.cleanup = _d.sent();
                    _d.label = 5;
                case 5: return [2 /*return*/, test];
            }
        });
    });
}
/**
 * Resolve references in individual actions
 */
function resolveActionReferences(action, context) {
    return __awaiter(this, void 0, void 0, function () {
        // Recursively resolve template variables
        function resolveValue(value) {
            if (typeof value === 'string') {
                return resolveTemplateString(value, context);
            }
            else if (Array.isArray(value)) {
                return value.map(resolveValue);
            }
            else if (typeof value === 'object' && value !== null) {
                var resolved = {};
                for (var _i = 0, _a = Object.entries(value); _i < _a.length; _i++) {
                    var _b = _a[_i], key = _b[0], val = _b[1];
                    resolved[key] = resolveValue(val);
                }
                return resolved;
            }
            return value;
        }
        var resolvedAction;
        return __generator(this, function (_a) {
            resolvedAction = JSON.parse(JSON.stringify(action));
            return [2 /*return*/, resolveValue(resolvedAction)];
        });
    });
}
/**
 * Resolve template strings like {{variable}} or {{step.field}}
 */
function resolveTemplateString(str, context) {
    var templateRegex = /\{\{([^}]+)\}\}/g;
    return str.replace(templateRegex, function (match, expression) {
        var trimmed = expression.trim();
        // Handle simple variables
        if (context.variables.has(trimmed)) {
            return context.variables.get(trimmed);
        }
        // Handle dot notation (e.g., step.field)
        if (trimmed.includes('.')) {
            var parts = trimmed.split('.');
            var value = context.variables.get(parts[0]);
            for (var i = 1; i < parts.length && value !== undefined; i++) {
                value = value[parts[i]];
            }
            if (value !== undefined) {
                return value;
            }
        }
        // Handle special expressions
        if (trimmed.startsWith('clock+')) {
            var offset = parseInt(trimmed.substring(6));
            var baseTime = new Date(context.variables.get('clock') || new Date());
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
        var yamlData = yaml_1.default.parse(content);
        var result = schema_1.BusinessProcessTestSchema.safeParse(yamlData);
        if (result.success) {
            return { valid: true, errors: [] };
        }
        else {
            return { valid: false, errors: formatZodErrors(result.error) };
        }
    }
    catch (error) {
        return { valid: false, errors: ["Parse error: ".concat(error instanceof Error ? error.message : String(error))] };
    }
}
/**
 * Extract metadata from business process test
 */
function extractTestMetadata(content) {
    var _a, _b;
    try {
        var yamlData = yaml_1.default.parse(content);
        return {
            id: yamlData.id,
            title: yamlData.title,
            industry: yamlData.industry,
            stepCount: ((_a = yamlData.steps) === null || _a === void 0 ? void 0 : _a.length) || 0,
            personaCount: Object.keys(yamlData.personas || {}).length,
            estimatedDuration: (_b = yamlData.metadata) === null || _b === void 0 ? void 0 : _b.estimated_duration
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
    var baseTemplate = {
        id: "".concat(industry, "-").concat(testName.toLowerCase().replace(/\s+/g, '-')),
        title: testName,
        industry: industry,
        version: '1.0.0',
        context: {
            tenant: "".concat(industry, "-test"),
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
    var commonPersonas = {
        owner: { role: 'owner', permissions: ['*'] },
        manager: { role: 'manager', permissions: ['read', 'write'] },
        user: { role: 'user', permissions: ['read'] }
    };
    var industryPersonas = {
        restaurant: __assign(__assign({}, commonPersonas), { server: { role: 'sales', permissions: ['orders:create', 'menu:read'] }, kitchen: { role: 'user', permissions: ['orders:read', 'kitchen:update'] }, cashier: { role: 'manager', permissions: ['payments:create', 'cash:access'] } }),
        healthcare: __assign(__assign({}, commonPersonas), { doctor: { role: 'manager', permissions: ['patients:all', 'treatments:create'] }, nurse: { role: 'user', permissions: ['patients:read', 'vitals:update'] }, receptionist: { role: 'sales', permissions: ['appointments:create', 'billing:read'] } }),
        salon: __assign(__assign({}, commonPersonas), { stylist: { role: 'user', permissions: ['appointments:read', 'services:perform'] }, receptionist: { role: 'sales', permissions: ['appointments:create', 'customers:read'] }, cashier: { role: 'user', permissions: ['payments:create', 'products:sell'] } })
    };
    return industryPersonas[industry] || commonPersonas;
}
/**
 * Get industry-specific step templates
 */
function getIndustrySteps(industry) {
    var baseSteps = [
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
    parseBusinessProcessTest: parseBusinessProcessTest,
    validateBusinessProcessTest: validateBusinessProcessTest,
    extractTestMetadata: extractTestMetadata,
    generateTestTemplate: generateTestTemplate
};
