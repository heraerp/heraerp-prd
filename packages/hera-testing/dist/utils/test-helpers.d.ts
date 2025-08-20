/**
 * Utility functions for HERA testing
 */
export declare class TestHelpers {
    /**
     * Generate random organization ID
     */
    static generateOrgId(): string;
    /**
     * Generate smart code
     */
    static generateSmartCode(industry: string, module: string, func: string, type: string, version?: number): string;
    /**
     * Generate entity code
     */
    static generateEntityCode(type: string, sequence?: number): string;
    /**
     * Generate transaction code
     */
    static generateTransactionCode(type: string): string;
    /**
     * Wait for condition with timeout
     */
    static waitForCondition(condition: () => Promise<boolean>, timeout?: number, interval?: number): Promise<void>;
    /**
     * Sleep for specified milliseconds
     */
    static sleep(ms: number): Promise<void>;
    /**
     * Deep clone object
     */
    static deepClone<T>(obj: T): T;
    /**
     * Generate test email
     */
    static generateTestEmail(domain?: string): string;
    /**
     * Generate test phone number
     */
    static generateTestPhone(): string;
    /**
     * Format currency
     */
    static formatCurrency(amount: number, currency?: string): string;
    /**
     * Generate test address
     */
    static generateTestAddress(): {
        street: any;
        city: any;
        state: any;
        zipCode: any;
        country: any;
    };
    /**
     * Validate HERA data structure
     */
    static validateHeraEntity(entity: any): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Validate HERA transaction structure
     */
    static validateHeraTransaction(transaction: any): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Generate test data for specific industries
     */
    static generateIndustryTestData(industry: string): {
        menuItems: {
            name: any;
            price: number;
            category: any;
            preparation_time: any;
        }[];
        tables: {
            number: number;
            seats: any;
            section: any;
        }[];
    } | {
        services: {
            name: any;
            price: number;
            duration: any;
            cpt_code: any;
        }[];
        providers: {
            name: any;
            specialty: any;
            license_number: any;
        }[];
    } | {
        products: {
            name: any;
            sku: any;
            barcode: any;
            price: number;
            cost: number;
        }[];
        categories: {
            name: any;
            code: any;
        }[];
    } | {
        services: {
            name: any;
            price: number;
            duration: any;
            category: any;
        }[];
        staff: {
            name: any;
            specialties: any;
            commission_rate: any;
        }[];
    } | null;
    /**
     * Create test context for multi-tenant testing
     */
    static createTestContext(organizationName: string): {
        organizationId: string;
        organizationName: string;
        testData: Map<any, any>;
        cleanup: (() => Promise<void>)[];
    };
    /**
     * Mock universal API responses
     */
    static mockUniversalApiResponse(operation: string, data: any): {
        operation: string;
        success: boolean;
        data: any;
        timestamp: string;
        organization_id: string;
    };
}
