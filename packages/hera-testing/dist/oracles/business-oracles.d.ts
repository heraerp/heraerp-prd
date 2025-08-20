/**
 * HERA Business Oracles - Pure validation functions for business rules
 * These functions validate business logic without external dependencies
 */
export interface EntityData {
    id: string;
    entity_type: string;
    entity_name: string;
    smart_code: string;
    metadata?: Record<string, any>;
}
export interface TransactionData {
    id: string;
    transaction_type: string;
    transaction_code: string;
    total_amount: number;
    smart_code: string;
    reference_entity_id?: string;
    metadata?: Record<string, any>;
    line_items?: TransactionLineData[];
}
export interface TransactionLineData {
    id: string;
    line_number: number;
    quantity?: number;
    unit_price?: number;
    line_amount: number;
    smart_code: string;
    line_entity_id?: string;
    metadata?: Record<string, any>;
}
export interface RelationshipData {
    id: string;
    from_entity_id: string;
    to_entity_id: string;
    relationship_type: string;
    smart_code: string;
    relationship_data?: Record<string, any>;
}
export interface DynamicFieldData {
    entity_id: string;
    field_name: string;
    field_value_text?: string;
    field_value_number?: number;
    field_value_boolean?: boolean;
    field_value_date?: Date;
    smart_code: string;
}
export declare function validateAccountingEquation(glAccounts: EntityData[], transactions: TransactionData[], tolerance?: number): {
    valid: boolean;
    difference: number;
    details: Record<string, number>;
};
export declare function validateInventoryBalance(products: EntityData[], transactions: TransactionData[], dynamicFields: DynamicFieldData[]): {
    valid: boolean;
    discrepancies: Array<{
        product_id: string;
        expected: number;
        actual: number;
    }>;
};
export declare function validateWorkflowStatus(entityId: string, expectedStatus: string, relationships: RelationshipData[], statusEntities: EntityData[]): {
    valid: boolean;
    currentStatus: string | null;
    validTransitions: string[];
};
export declare function validateTaxCalculation(transaction: TransactionData, taxRates: Record<string, number>, tolerance?: number): {
    valid: boolean;
    expectedTax: number;
    actualTax: number;
    breakdown: Record<string, number>;
};
export declare function validateSmartCodePatterns(entities: EntityData[], transactions: TransactionData[], relationships: RelationshipData[]): {
    valid: boolean;
    violations: Array<{
        type: string;
        id: string;
        code: string;
        issue: string;
    }>;
};
export declare function validateMultiTenantIsolation(organizationId: string, entities: EntityData[], transactions: TransactionData[], relationships: RelationshipData[]): {
    valid: boolean;
    violations: Array<{
        type: string;
        id: string;
        issue: string;
    }>;
};
export declare function validateRestaurantWorkflow(order: TransactionData, relationships: RelationshipData[], statusEntities: EntityData[]): {
    valid: boolean;
    currentStage: string;
    expectedNextStages: string[];
};
export declare const businessOracles: {
    validateAccountingEquation: typeof validateAccountingEquation;
    validateInventoryBalance: typeof validateInventoryBalance;
    validateWorkflowStatus: typeof validateWorkflowStatus;
    validateTaxCalculation: typeof validateTaxCalculation;
    validateSmartCodePatterns: typeof validateSmartCodePatterns;
    validateMultiTenantIsolation: typeof validateMultiTenantIsolation;
    validateRestaurantWorkflow: typeof validateRestaurantWorkflow;
};
