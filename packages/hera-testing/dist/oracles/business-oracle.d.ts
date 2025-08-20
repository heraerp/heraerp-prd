/**
 * Business Logic Oracles - Validate business rules and calculations
 */
export declare class BusinessOracle {
    /**
     * Validate accounting equation (Assets = Liabilities + Equity)
     */
    static validateAccountingEquation(assets: number, liabilities: number, equity: number, tolerance?: number): boolean;
    /**
     * Validate journal entry balance (Debits = Credits)
     */
    static validateJournalBalance(lines: Array<{
        debit: number;
        credit: number;
    }>): boolean;
    /**
     * Validate transaction profitability
     */
    static calculateProfitability(revenue: number, cost: number, expenses?: number): {
        profit: number;
        margin: number;
        isValid: boolean;
    };
    /**
     * Validate inventory levels
     */
    static validateInventoryTransaction(currentStock: number, transactionQty: number, transactionType: 'in' | 'out', minStock?: number): {
        newStock: number;
        isValid: boolean;
        warning?: string;
    };
    /**
     * Validate smart code format
     */
    static validateSmartCode(smartCode: string): {
        isValid: boolean;
        components?: {
            system: string;
            industry: string;
            module: string;
            function: string;
            type: string;
            version: string;
        };
    };
    /**
     * Validate business workflow status progression
     */
    static validateStatusProgression(currentStatus: string, newStatus: string, allowedTransitions: Record<string, string[]>): {
        isValid: boolean;
        reason?: string;
    };
    /**
     * Validate credit limit
     */
    static validateCreditLimit(currentBalance: number, transactionAmount: number, creditLimit: number): {
        isValid: boolean;
        availableCredit: number;
        exceedsBy?: number;
    };
    /**
     * Validate tax calculation
     */
    static calculateTax(amount: number, taxRate: number, inclusive?: boolean): {
        netAmount: number;
        taxAmount: number;
        grossAmount: number;
    };
    /**
     * Validate discount application
     */
    static applyDiscount(originalPrice: number, discountType: 'percentage' | 'fixed', discountValue: number, maxDiscount?: number): {
        discountAmount: number;
        finalPrice: number;
        isValid: boolean;
        reason?: string;
    };
    /**
     * Validate payment terms
     */
    static calculateDueDate(invoiceDate: Date, paymentTerms: string): {
        dueDate: Date;
        daysAllowed: number;
    };
    /**
     * Validate batch expiry
     */
    static validateBatchExpiry(expiryDate: Date, warningDays?: number): {
        isExpired: boolean;
        isWarning: boolean;
        daysUntilExpiry: number;
    };
    /**
     * Industry-specific validations
     */
    static validateRestaurantOrder(order: {
        items: Array<{
            quantity: number;
            price: number;
        }>;
        tableNumber?: number;
        deliveryAddress?: string;
    }): {
        isValid: boolean;
        errors: string[];
    };
    static validateHealthcareAppointment(appointment: {
        patientId: string;
        providerId: string;
        startTime: Date;
        duration: number;
        serviceType: string;
    }): {
        isValid: boolean;
        errors: string[];
    };
}
