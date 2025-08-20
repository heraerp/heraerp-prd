"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestHelpers = void 0;
const faker_1 = require("faker");
/**
 * Utility functions for HERA testing
 */
class TestHelpers {
    /**
     * Generate random organization ID
     */
    static generateOrgId() {
        return faker_1.faker.datatype.uuid();
    }
    /**
     * Generate smart code
     */
    static generateSmartCode(industry, module, func, type, version = 1) {
        return `HERA.${industry.toUpperCase()}.${module.toUpperCase()}.${func.toUpperCase()}.${type.toUpperCase()}.v${version}`;
    }
    /**
     * Generate entity code
     */
    static generateEntityCode(type, sequence) {
        const prefix = type.substring(0, 4).toUpperCase();
        const suffix = sequence || faker_1.faker.datatype.number({ min: 1000, max: 9999 });
        return `${prefix}-${suffix}`;
    }
    /**
     * Generate transaction code
     */
    static generateTransactionCode(type) {
        const prefixes = {
            sale: 'SALE',
            purchase: 'PO',
            payment: 'PAY',
            receipt: 'RCP',
            journal_entry: 'JE',
            transfer: 'TRF',
        };
        const prefix = prefixes[type] || type.substring(0, 4).toUpperCase();
        const sequence = faker_1.faker.datatype.number({ min: 1000, max: 9999 });
        return `${prefix}-${sequence}`;
    }
    /**
     * Wait for condition with timeout
     */
    static async waitForCondition(condition, timeout = 10000, interval = 100) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (await condition()) {
                return;
            }
            await this.sleep(interval);
        }
        throw new Error(`Condition not met within ${timeout}ms timeout`);
    }
    /**
     * Sleep for specified milliseconds
     */
    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Deep clone object
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    /**
     * Generate test email
     */
    static generateTestEmail(domain = 'example.com') {
        return `test.${faker_1.faker.datatype.uuid().substring(0, 8)}@${domain}`;
    }
    /**
     * Generate test phone number
     */
    static generateTestPhone() {
        return faker_1.faker.phone.phoneNumber('+971-##-###-####');
    }
    /**
     * Format currency
     */
    static formatCurrency(amount, currency = 'AED') {
        return new Intl.NumberFormat('en-AE', {
            style: 'currency',
            currency,
        }).format(amount);
    }
    /**
     * Generate test address
     */
    static generateTestAddress() {
        return {
            street: faker_1.faker.address.streetAddress(),
            city: faker_1.faker.address.city(),
            state: faker_1.faker.address.state(),
            zipCode: faker_1.faker.address.zipCode(),
            country: faker_1.faker.address.country(),
        };
    }
    /**
     * Validate HERA data structure
     */
    static validateHeraEntity(entity) {
        const errors = [];
        if (!entity.entity_type) {
            errors.push('entity_type is required');
        }
        if (!entity.entity_name) {
            errors.push('entity_name is required');
        }
        if (!entity.entity_code) {
            errors.push('entity_code is required');
        }
        if (!entity.smart_code) {
            errors.push('smart_code is required');
        }
        else if (!/^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/.test(entity.smart_code)) {
            errors.push('smart_code format is invalid');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    /**
     * Validate HERA transaction structure
     */
    static validateHeraTransaction(transaction) {
        const errors = [];
        if (!transaction.transaction_type) {
            errors.push('transaction_type is required');
        }
        if (!transaction.transaction_code) {
            errors.push('transaction_code is required');
        }
        if (!transaction.smart_code) {
            errors.push('smart_code is required');
        }
        if (transaction.total_amount === undefined || transaction.total_amount === null) {
            errors.push('total_amount is required');
        }
        if (transaction.line_items && Array.isArray(transaction.line_items)) {
            transaction.line_items.forEach((line, index) => {
                if (!line.line_entity_id) {
                    errors.push(`line_items[${index}].line_entity_id is required`);
                }
                if (line.quantity === undefined || line.quantity === null) {
                    errors.push(`line_items[${index}].quantity is required`);
                }
                if (line.unit_price === undefined || line.unit_price === null) {
                    errors.push(`line_items[${index}].unit_price is required`);
                }
            });
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    /**
     * Generate test data for specific industries
     */
    static generateIndustryTestData(industry) {
        const generators = {
            restaurant: () => ({
                menuItems: Array.from({ length: 10 }, () => ({
                    name: faker_1.faker.lorem.words(2),
                    price: parseFloat(faker_1.faker.commerce.price(5, 50)),
                    category: faker_1.faker.random.arrayElement(['appetizer', 'main', 'dessert', 'beverage']),
                    preparation_time: faker_1.faker.datatype.number({ min: 5, max: 30 }),
                })),
                tables: Array.from({ length: 8 }, (_, i) => ({
                    number: i + 1,
                    seats: faker_1.faker.datatype.number({ min: 2, max: 8 }),
                    section: faker_1.faker.random.arrayElement(['main', 'patio', 'bar']),
                })),
            }),
            healthcare: () => ({
                services: Array.from({ length: 15 }, () => ({
                    name: faker_1.faker.lorem.words(3),
                    price: parseFloat(faker_1.faker.commerce.price(50, 500)),
                    duration: faker_1.faker.datatype.number({ min: 15, max: 120 }),
                    cpt_code: faker_1.faker.datatype.number({ min: 10000, max: 99999 }).toString(),
                })),
                providers: Array.from({ length: 5 }, () => ({
                    name: faker_1.faker.name.findName(),
                    specialty: faker_1.faker.random.arrayElement(['General', 'Cardiology', 'Dermatology', 'Pediatrics']),
                    license_number: faker_1.faker.random.alphaNumeric(10).toUpperCase(),
                })),
            }),
            retail: () => ({
                products: Array.from({ length: 50 }, () => ({
                    name: faker_1.faker.commerce.productName(),
                    sku: faker_1.faker.random.alphaNumeric(8).toUpperCase(),
                    barcode: faker_1.faker.datatype.number({ min: 1000000000, max: 9999999999 }).toString(),
                    price: parseFloat(faker_1.faker.commerce.price(10, 200)),
                    cost: parseFloat(faker_1.faker.commerce.price(5, 100)),
                })),
                categories: Array.from({ length: 10 }, () => ({
                    name: faker_1.faker.commerce.department(),
                    code: faker_1.faker.random.alphaNumeric(4).toUpperCase(),
                })),
            }),
            salon: () => ({
                services: Array.from({ length: 20 }, () => ({
                    name: faker_1.faker.lorem.words(2),
                    price: parseFloat(faker_1.faker.commerce.price(25, 150)),
                    duration: faker_1.faker.datatype.number({ min: 30, max: 180 }),
                    category: faker_1.faker.random.arrayElement(['hair', 'nails', 'facial', 'massage']),
                })),
                staff: Array.from({ length: 6 }, () => ({
                    name: faker_1.faker.name.findName(),
                    specialties: faker_1.faker.random.arrayElements(['hair', 'nails', 'facial', 'massage'], 2),
                    commission_rate: faker_1.faker.datatype.float({ min: 0.3, max: 0.6, precision: 0.01 }),
                })),
            }),
        };
        const generator = generators[industry];
        return generator ? generator() : null;
    }
    /**
     * Create test context for multi-tenant testing
     */
    static createTestContext(organizationName) {
        return {
            organizationId: this.generateOrgId(),
            organizationName,
            testData: new Map(),
            cleanup: [],
        };
    }
    /**
     * Mock universal API responses
     */
    static mockUniversalApiResponse(operation, data) {
        return {
            operation,
            success: true,
            data,
            timestamp: new Date().toISOString(),
            organization_id: this.generateOrgId(),
        };
    }
}
exports.TestHelpers = TestHelpers;
