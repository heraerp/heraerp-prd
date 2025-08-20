"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalFixtures = void 0;
const faker_1 = require("faker");
/**
 * Universal Fixtures - Generate test data using HERA's 6-table architecture
 */
class UniversalFixtures {
    constructor(organizationId) {
        this.organizationId = organizationId;
    }
    /**
     * Generate a customer entity
     */
    generateCustomer(overrides) {
        const code = `CUST-${faker_1.faker.random.alphaNumeric(6).toUpperCase()}`;
        return {
            entity_type: 'customer',
            entity_name: faker_1.faker.company.companyName(),
            entity_code: code,
            smart_code: 'HERA.CRM.CUST.ENT.PROF.v1',
            dynamic_fields: {
                email: faker_1.faker.internet.email(),
                phone: faker_1.faker.phone.phoneNumber(),
                credit_limit: faker_1.faker.datatype.number({ min: 1000, max: 50000 }),
                payment_terms: faker_1.faker.random.arrayElement(['NET30', 'NET60', 'COD']),
            },
            ...overrides,
        };
    }
    /**
     * Generate a product entity
     */
    generateProduct(overrides) {
        const code = `PROD-${faker_1.faker.random.alphaNumeric(6).toUpperCase()}`;
        return {
            entity_type: 'product',
            entity_name: faker_1.faker.commerce.productName(),
            entity_code: code,
            smart_code: 'HERA.INV.PROD.ENT.ITEM.v1',
            dynamic_fields: {
                price: parseFloat(faker_1.faker.commerce.price()),
                cost: parseFloat(faker_1.faker.commerce.price(10, 100)),
                stock_quantity: faker_1.faker.datatype.number({ min: 0, max: 1000 }),
                category: faker_1.faker.commerce.department(),
            },
            ...overrides,
        };
    }
    /**
     * Generate a GL account entity
     */
    generateGLAccount(accountType, overrides) {
        const accountNumbers = {
            asset: '1',
            liability: '2',
            equity: '3',
            revenue: '4',
            expense: '5',
        };
        const prefix = accountNumbers[accountType] || '9';
        const code = `${prefix}${faker_1.faker.datatype.number({ min: 100000, max: 999999 })}`;
        return {
            entity_type: 'gl_account',
            entity_name: faker_1.faker.company.bs(),
            entity_code: code,
            smart_code: `HERA.FIN.GL.ACC.${accountType.toUpperCase()}.v1`,
            dynamic_fields: {
                account_type: accountType,
                ifrs_classification: faker_1.faker.random.arrayElement(['current', 'non-current']),
                normal_balance: accountType.match(/asset|expense/) ? 'debit' : 'credit',
            },
            ...overrides,
        };
    }
    /**
     * Generate a sale transaction
     */
    generateSaleTransaction(customerId, lineItems, overrides) {
        const code = `SALE-${faker_1.faker.datatype.number({ min: 1000, max: 9999 })}`;
        const totalAmount = lineItems.reduce((sum, item) => sum + item.line_amount, 0);
        return {
            transaction_type: 'sale',
            transaction_code: code,
            smart_code: 'HERA.CRM.SALE.TXN.ORDER.v1',
            total_amount: totalAmount,
            from_entity_id: customerId,
            line_items: lineItems.map((item, index) => ({
                ...item,
                line_number: index + 1,
                smart_code: item.smart_code || 'HERA.CRM.SALE.LINE.ITEM.v1',
            })),
            ...overrides,
        };
    }
    /**
     * Generate a purchase transaction
     */
    generatePurchaseTransaction(vendorId, lineItems, overrides) {
        const code = `PO-${faker_1.faker.datatype.number({ min: 1000, max: 9999 })}`;
        const totalAmount = lineItems.reduce((sum, item) => sum + item.line_amount, 0);
        return {
            transaction_type: 'purchase',
            transaction_code: code,
            smart_code: 'HERA.SCM.PUR.TXN.ORDER.v1',
            total_amount: totalAmount,
            to_entity_id: vendorId,
            line_items: lineItems.map((item, index) => ({
                ...item,
                line_number: index + 1,
                smart_code: item.smart_code || 'HERA.SCM.PUR.LINE.ITEM.v1',
            })),
            ...overrides,
        };
    }
    /**
     * Generate a journal entry transaction
     */
    generateJournalEntry(description, lineItems, overrides) {
        const code = `JE-${faker_1.faker.datatype.number({ min: 1000, max: 9999 })}`;
        const totalDebit = lineItems.filter(item => item.debit_amount).reduce((sum, item) => sum + item.debit_amount, 0);
        return {
            transaction_type: 'journal_entry',
            transaction_code: code,
            smart_code: 'HERA.FIN.GL.TXN.JE.v1',
            total_amount: totalDebit,
            line_items: lineItems.map((item, index) => ({
                ...item,
                line_number: index + 1,
                smart_code: item.smart_code || 'HERA.FIN.GL.LINE.ENTRY.v1',
            })),
            ...overrides,
        };
    }
    /**
     * Generate a status relationship
     */
    generateStatusRelationship(entityId, statusEntityId, overrides) {
        return {
            from_entity_id: entityId,
            to_entity_id: statusEntityId,
            relationship_type: 'has_status',
            smart_code: 'HERA.WORKFLOW.STATUS.ASSIGN.v1',
            metadata: {
                assigned_at: new Date().toISOString(),
                assigned_by: 'test_user',
            },
            ...overrides,
        };
    }
    /**
     * Generate test data for a complete business scenario
     */
    generateBusinessScenario(scenario) {
        const scenarios = {
            restaurant: () => this.generateRestaurantScenario(),
            healthcare: () => this.generateHealthcareScenario(),
            retail: () => this.generateRetailScenario(),
            salon: () => this.generateSalonScenario(),
        };
        return scenarios[scenario]();
    }
    generateRestaurantScenario() {
        // Generate menu items
        const menuItems = Array.from({ length: 10 }, () => this.generateProduct({
            entity_type: 'product',
            smart_code: 'HERA.REST.MENU.ENT.ITEM.v1',
            dynamic_fields: {
                category: faker_1.faker.random.arrayElement(['appetizer', 'main', 'dessert', 'beverage']),
                preparation_time: faker_1.faker.datatype.number({ min: 5, max: 30 }),
                ingredients: faker_1.faker.lorem.words(5).split(' '),
            },
        }));
        // Generate customers
        const customers = Array.from({ length: 5 }, () => this.generateCustomer({
            smart_code: 'HERA.REST.CUST.ENT.DINER.v1',
        }));
        // Generate tables
        const tables = Array.from({ length: 10 }, (_, i) => ({
            entity_type: 'location',
            entity_name: `Table ${i + 1}`,
            entity_code: `TABLE-${i + 1}`,
            smart_code: 'HERA.REST.LOC.ENT.TABLE.v1',
            dynamic_fields: {
                seats: faker_1.faker.datatype.number({ min: 2, max: 8 }),
                section: faker_1.faker.random.arrayElement(['main', 'patio', 'bar']),
            },
        }));
        return { menuItems, customers, tables };
    }
    generateHealthcareScenario() {
        // Generate patients
        const patients = Array.from({ length: 20 }, () => this.generateCustomer({
            entity_type: 'patient',
            smart_code: 'HERA.HLTH.PAT.ENT.PROFILE.v1',
            dynamic_fields: {
                date_of_birth: faker_1.faker.date.past(50),
                insurance_provider: faker_1.faker.company.companyName(),
                medical_record_number: `MRN-${faker_1.faker.random.alphaNumeric(8).toUpperCase()}`,
            },
        }));
        // Generate services
        const services = Array.from({ length: 15 }, () => this.generateProduct({
            entity_type: 'service',
            smart_code: 'HERA.HLTH.SVC.ENT.PROCEDURE.v1',
            dynamic_fields: {
                cpt_code: faker_1.faker.datatype.number({ min: 10000, max: 99999 }).toString(),
                duration_minutes: faker_1.faker.datatype.number({ min: 15, max: 120 }),
                requires_authorization: faker_1.faker.datatype.boolean(),
            },
        }));
        return { patients, services };
    }
    generateRetailScenario() {
        // Generate products with SKUs
        const products = Array.from({ length: 50 }, () => this.generateProduct({
            smart_code: 'HERA.RETAIL.PROD.ENT.SKU.v1',
            dynamic_fields: {
                sku: `SKU-${faker_1.faker.random.alphaNumeric(8).toUpperCase()}`,
                barcode: faker_1.faker.datatype.number({ min: 1000000000, max: 9999999999 }).toString(),
                weight: faker_1.faker.datatype.float({ min: 0.1, max: 10, precision: 0.01 }),
                dimensions: {
                    length: faker_1.faker.datatype.number({ min: 1, max: 100 }),
                    width: faker_1.faker.datatype.number({ min: 1, max: 100 }),
                    height: faker_1.faker.datatype.number({ min: 1, max: 100 }),
                },
            },
        }));
        // Generate suppliers
        const suppliers = Array.from({ length: 10 }, () => ({
            entity_type: 'vendor',
            entity_name: faker_1.faker.company.companyName(),
            entity_code: `VENDOR-${faker_1.faker.random.alphaNumeric(6).toUpperCase()}`,
            smart_code: 'HERA.SCM.VENDOR.ENT.SUPPLIER.v1',
            dynamic_fields: {
                payment_terms: faker_1.faker.random.arrayElement(['NET30', 'NET60', '2/10 NET30']),
                minimum_order: faker_1.faker.datatype.number({ min: 100, max: 5000 }),
            },
        }));
        return { products, suppliers };
    }
    generateSalonScenario() {
        // Generate services
        const services = Array.from({ length: 20 }, () => this.generateProduct({
            entity_type: 'service',
            smart_code: 'HERA.SALON.SVC.ENT.TREATMENT.v1',
            dynamic_fields: {
                duration_minutes: faker_1.faker.datatype.number({ min: 30, max: 180 }),
                requires_specialist: faker_1.faker.datatype.boolean(),
                category: faker_1.faker.random.arrayElement(['hair', 'nails', 'facial', 'massage']),
            },
        }));
        // Generate staff
        const staff = Array.from({ length: 8 }, () => ({
            entity_type: 'employee',
            entity_name: faker_1.faker.name.findName(),
            entity_code: `STAFF-${faker_1.faker.random.alphaNumeric(4).toUpperCase()}`,
            smart_code: 'HERA.SALON.EMP.ENT.STYLIST.v1',
            dynamic_fields: {
                specialties: faker_1.faker.random.arrayElements(['hair', 'nails', 'facial', 'massage'], 2),
                commission_rate: faker_1.faker.datatype.float({ min: 0.3, max: 0.6, precision: 0.01 }),
                availability: 'full-time',
            },
        }));
        return { services, staff };
    }
}
exports.UniversalFixtures = UniversalFixtures;
