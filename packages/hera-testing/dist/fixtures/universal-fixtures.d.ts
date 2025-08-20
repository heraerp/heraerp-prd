import { Entity, Transaction, Relationship } from '../dsl/schema';
/**
 * Universal Fixtures - Generate test data using HERA's 6-table architecture
 */
export declare class UniversalFixtures {
    private organizationId;
    constructor(organizationId: string);
    /**
     * Generate a customer entity
     */
    generateCustomer(overrides?: Partial<Entity>): Entity;
    /**
     * Generate a product entity
     */
    generateProduct(overrides?: Partial<Entity>): Entity;
    /**
     * Generate a GL account entity
     */
    generateGLAccount(accountType: string, overrides?: Partial<Entity>): Entity;
    /**
     * Generate a sale transaction
     */
    generateSaleTransaction(customerId: string, lineItems: any[], overrides?: Partial<Transaction>): Transaction;
    /**
     * Generate a purchase transaction
     */
    generatePurchaseTransaction(vendorId: string, lineItems: any[], overrides?: Partial<Transaction>): Transaction;
    /**
     * Generate a journal entry transaction
     */
    generateJournalEntry(description: string, lineItems: any[], overrides?: Partial<Transaction>): Transaction;
    /**
     * Generate a status relationship
     */
    generateStatusRelationship(entityId: string, statusEntityId: string, overrides?: Partial<Relationship>): Relationship;
    /**
     * Generate test data for a complete business scenario
     */
    generateBusinessScenario(scenario: 'restaurant' | 'healthcare' | 'retail' | 'salon'): {
        menuItems: Entity[];
        customers: Entity[];
        tables: {
            entity_type: string;
            entity_name: string;
            entity_code: string;
            smart_code: string;
            dynamic_fields: {
                seats: any;
                section: any;
            };
        }[];
    } | {
        patients: Entity[];
        services: Entity[];
    } | {
        products: Entity[];
        suppliers: {
            entity_type: string;
            entity_name: any;
            entity_code: string;
            smart_code: string;
            dynamic_fields: {
                payment_terms: any;
                minimum_order: any;
            };
        }[];
    } | {
        services: Entity[];
        staff: {
            entity_type: string;
            entity_name: any;
            entity_code: string;
            smart_code: string;
            dynamic_fields: {
                specialties: any;
                commission_rate: any;
                availability: string;
            };
        }[];
    };
    private generateRestaurantScenario;
    private generateHealthcareScenario;
    private generateRetailScenario;
    private generateSalonScenario;
}
