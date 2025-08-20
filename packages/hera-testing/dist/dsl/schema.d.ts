import { z } from 'zod';
export declare const PersonaSchema: z.ZodObject<{
    role: z.ZodEnum<["owner", "admin", "manager", "user", "accountant", "warehouse", "sales", "hr"]>;
    organization_id: z.ZodOptional<z.ZodString>;
    entity_id: z.ZodOptional<z.ZodString>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    role: "owner" | "admin" | "manager" | "user" | "accountant" | "warehouse" | "sales" | "hr";
    organization_id?: string | undefined;
    entity_id?: string | undefined;
    permissions?: string[] | undefined;
}, {
    role: "owner" | "admin" | "manager" | "user" | "accountant" | "warehouse" | "sales" | "hr";
    organization_id?: string | undefined;
    entity_id?: string | undefined;
    permissions?: string[] | undefined;
}>;
export declare const ContextSchema: z.ZodObject<{
    tenant: z.ZodString;
    organization_id: z.ZodString;
    currency: z.ZodDefault<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    locale: z.ZodDefault<z.ZodString>;
    fiscal_year: z.ZodDefault<z.ZodNumber>;
    clock: z.ZodOptional<z.ZodString>;
    smart_code_prefix: z.ZodDefault<z.ZodString>;
    industry: z.ZodOptional<z.ZodEnum<["restaurant", "healthcare", "retail", "salon", "manufacturing", "professional_services"]>>;
}, "strip", z.ZodTypeAny, {
    organization_id: string;
    tenant: string;
    currency: string;
    timezone: string;
    locale: string;
    fiscal_year: number;
    smart_code_prefix: string;
    clock?: string | undefined;
    industry?: "restaurant" | "healthcare" | "retail" | "salon" | "manufacturing" | "professional_services" | undefined;
}, {
    organization_id: string;
    tenant: string;
    currency?: string | undefined;
    timezone?: string | undefined;
    locale?: string | undefined;
    fiscal_year?: number | undefined;
    clock?: string | undefined;
    smart_code_prefix?: string | undefined;
    industry?: "restaurant" | "healthcare" | "retail" | "salon" | "manufacturing" | "professional_services" | undefined;
}>;
export declare const EntityDataSchema: z.ZodObject<{
    entity_type: z.ZodString;
    entity_name: z.ZodString;
    entity_code: z.ZodOptional<z.ZodString>;
    smart_code: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    dynamic_fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    entity_type: string;
    entity_name: string;
    smart_code: string;
    entity_code?: string | undefined;
    metadata?: Record<string, any> | undefined;
    dynamic_fields?: Record<string, any> | undefined;
}, {
    entity_type: string;
    entity_name: string;
    smart_code: string;
    entity_code?: string | undefined;
    metadata?: Record<string, any> | undefined;
    dynamic_fields?: Record<string, any> | undefined;
}>;
export declare const TransactionDataSchema: z.ZodObject<{
    transaction_type: z.ZodString;
    transaction_code: z.ZodOptional<z.ZodString>;
    smart_code: z.ZodString;
    total_amount: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodString>;
    reference_entity_id: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    line_items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        line_entity_id: z.ZodOptional<z.ZodString>;
        line_number: z.ZodNumber;
        quantity: z.ZodOptional<z.ZodNumber>;
        unit_price: z.ZodOptional<z.ZodNumber>;
        line_amount: z.ZodNumber;
        smart_code: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        smart_code: string;
        line_number: number;
        line_amount: number;
        metadata?: Record<string, any> | undefined;
        line_entity_id?: string | undefined;
        quantity?: number | undefined;
        unit_price?: number | undefined;
    }, {
        smart_code: string;
        line_number: number;
        line_amount: number;
        metadata?: Record<string, any> | undefined;
        line_entity_id?: string | undefined;
        quantity?: number | undefined;
        unit_price?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    smart_code: string;
    transaction_type: string;
    currency?: string | undefined;
    metadata?: Record<string, any> | undefined;
    transaction_code?: string | undefined;
    total_amount?: number | undefined;
    reference_entity_id?: string | undefined;
    line_items?: {
        smart_code: string;
        line_number: number;
        line_amount: number;
        metadata?: Record<string, any> | undefined;
        line_entity_id?: string | undefined;
        quantity?: number | undefined;
        unit_price?: number | undefined;
    }[] | undefined;
}, {
    smart_code: string;
    transaction_type: string;
    currency?: string | undefined;
    metadata?: Record<string, any> | undefined;
    transaction_code?: string | undefined;
    total_amount?: number | undefined;
    reference_entity_id?: string | undefined;
    line_items?: {
        smart_code: string;
        line_number: number;
        line_amount: number;
        metadata?: Record<string, any> | undefined;
        line_entity_id?: string | undefined;
        quantity?: number | undefined;
        unit_price?: number | undefined;
    }[] | undefined;
}>;
export declare const RelationshipDataSchema: z.ZodObject<{
    from_entity_id: z.ZodString;
    to_entity_id: z.ZodString;
    relationship_type: z.ZodString;
    smart_code: z.ZodString;
    relationship_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    smart_code: string;
    from_entity_id: string;
    to_entity_id: string;
    relationship_type: string;
    relationship_data?: Record<string, any> | undefined;
}, {
    smart_code: string;
    from_entity_id: string;
    to_entity_id: string;
    relationship_type: string;
    relationship_data?: Record<string, any> | undefined;
}>;
export declare const StepActionSchema: z.ZodDiscriminatedUnion<"action_type", [z.ZodObject<{
    action_type: z.ZodLiteral<"create_entity">;
    data: z.ZodObject<{
        entity_type: z.ZodString;
        entity_name: z.ZodString;
        entity_code: z.ZodOptional<z.ZodString>;
        smart_code: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        dynamic_fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        entity_type: string;
        entity_name: string;
        smart_code: string;
        entity_code?: string | undefined;
        metadata?: Record<string, any> | undefined;
        dynamic_fields?: Record<string, any> | undefined;
    }, {
        entity_type: string;
        entity_name: string;
        smart_code: string;
        entity_code?: string | undefined;
        metadata?: Record<string, any> | undefined;
        dynamic_fields?: Record<string, any> | undefined;
    }>;
    store_as: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action_type: "create_entity";
    data: {
        entity_type: string;
        entity_name: string;
        smart_code: string;
        entity_code?: string | undefined;
        metadata?: Record<string, any> | undefined;
        dynamic_fields?: Record<string, any> | undefined;
    };
    store_as?: string | undefined;
}, {
    action_type: "create_entity";
    data: {
        entity_type: string;
        entity_name: string;
        smart_code: string;
        entity_code?: string | undefined;
        metadata?: Record<string, any> | undefined;
        dynamic_fields?: Record<string, any> | undefined;
    };
    store_as?: string | undefined;
}>, z.ZodObject<{
    action_type: z.ZodLiteral<"create_transaction">;
    data: z.ZodObject<{
        transaction_type: z.ZodString;
        transaction_code: z.ZodOptional<z.ZodString>;
        smart_code: z.ZodString;
        total_amount: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        reference_entity_id: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        line_items: z.ZodOptional<z.ZodArray<z.ZodObject<{
            line_entity_id: z.ZodOptional<z.ZodString>;
            line_number: z.ZodNumber;
            quantity: z.ZodOptional<z.ZodNumber>;
            unit_price: z.ZodOptional<z.ZodNumber>;
            line_amount: z.ZodNumber;
            smart_code: z.ZodString;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            smart_code: string;
            line_number: number;
            line_amount: number;
            metadata?: Record<string, any> | undefined;
            line_entity_id?: string | undefined;
            quantity?: number | undefined;
            unit_price?: number | undefined;
        }, {
            smart_code: string;
            line_number: number;
            line_amount: number;
            metadata?: Record<string, any> | undefined;
            line_entity_id?: string | undefined;
            quantity?: number | undefined;
            unit_price?: number | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        smart_code: string;
        transaction_type: string;
        currency?: string | undefined;
        metadata?: Record<string, any> | undefined;
        transaction_code?: string | undefined;
        total_amount?: number | undefined;
        reference_entity_id?: string | undefined;
        line_items?: {
            smart_code: string;
            line_number: number;
            line_amount: number;
            metadata?: Record<string, any> | undefined;
            line_entity_id?: string | undefined;
            quantity?: number | undefined;
            unit_price?: number | undefined;
        }[] | undefined;
    }, {
        smart_code: string;
        transaction_type: string;
        currency?: string | undefined;
        metadata?: Record<string, any> | undefined;
        transaction_code?: string | undefined;
        total_amount?: number | undefined;
        reference_entity_id?: string | undefined;
        line_items?: {
            smart_code: string;
            line_number: number;
            line_amount: number;
            metadata?: Record<string, any> | undefined;
            line_entity_id?: string | undefined;
            quantity?: number | undefined;
            unit_price?: number | undefined;
        }[] | undefined;
    }>;
    store_as: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action_type: "create_transaction";
    data: {
        smart_code: string;
        transaction_type: string;
        currency?: string | undefined;
        metadata?: Record<string, any> | undefined;
        transaction_code?: string | undefined;
        total_amount?: number | undefined;
        reference_entity_id?: string | undefined;
        line_items?: {
            smart_code: string;
            line_number: number;
            line_amount: number;
            metadata?: Record<string, any> | undefined;
            line_entity_id?: string | undefined;
            quantity?: number | undefined;
            unit_price?: number | undefined;
        }[] | undefined;
    };
    store_as?: string | undefined;
}, {
    action_type: "create_transaction";
    data: {
        smart_code: string;
        transaction_type: string;
        currency?: string | undefined;
        metadata?: Record<string, any> | undefined;
        transaction_code?: string | undefined;
        total_amount?: number | undefined;
        reference_entity_id?: string | undefined;
        line_items?: {
            smart_code: string;
            line_number: number;
            line_amount: number;
            metadata?: Record<string, any> | undefined;
            line_entity_id?: string | undefined;
            quantity?: number | undefined;
            unit_price?: number | undefined;
        }[] | undefined;
    };
    store_as?: string | undefined;
}>, z.ZodObject<{
    action_type: z.ZodLiteral<"create_relationship">;
    data: z.ZodObject<{
        from_entity_id: z.ZodString;
        to_entity_id: z.ZodString;
        relationship_type: z.ZodString;
        smart_code: z.ZodString;
        relationship_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        smart_code: string;
        from_entity_id: string;
        to_entity_id: string;
        relationship_type: string;
        relationship_data?: Record<string, any> | undefined;
    }, {
        smart_code: string;
        from_entity_id: string;
        to_entity_id: string;
        relationship_type: string;
        relationship_data?: Record<string, any> | undefined;
    }>;
    store_as: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action_type: "create_relationship";
    data: {
        smart_code: string;
        from_entity_id: string;
        to_entity_id: string;
        relationship_type: string;
        relationship_data?: Record<string, any> | undefined;
    };
    store_as?: string | undefined;
}, {
    action_type: "create_relationship";
    data: {
        smart_code: string;
        from_entity_id: string;
        to_entity_id: string;
        relationship_type: string;
        relationship_data?: Record<string, any> | undefined;
    };
    store_as?: string | undefined;
}>, z.ZodObject<{
    action_type: z.ZodLiteral<"set_dynamic_field">;
    entity_id: z.ZodString;
    field_name: z.ZodString;
    field_value: z.ZodAny;
    smart_code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    entity_id: string;
    smart_code: string;
    action_type: "set_dynamic_field";
    field_name: string;
    field_value?: any;
}, {
    entity_id: string;
    smart_code: string;
    action_type: "set_dynamic_field";
    field_name: string;
    field_value?: any;
}>, z.ZodObject<{
    action_type: z.ZodLiteral<"ui_interaction">;
    selector: z.ZodString;
    interaction: z.ZodEnum<["click", "fill", "select", "upload", "wait"]>;
    value: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    action_type: "ui_interaction";
    selector: string;
    interaction: "fill" | "click" | "select" | "upload" | "wait";
    value?: string | undefined;
    timeout?: number | undefined;
}, {
    action_type: "ui_interaction";
    selector: string;
    interaction: "fill" | "click" | "select" | "upload" | "wait";
    value?: string | undefined;
    timeout?: number | undefined;
}>, z.ZodObject<{
    action_type: z.ZodLiteral<"api_call">;
    endpoint: z.ZodString;
    method: z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    store_as: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action_type: "api_call";
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    data?: Record<string, any> | undefined;
    store_as?: string | undefined;
}, {
    action_type: "api_call";
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    data?: Record<string, any> | undefined;
    store_as?: string | undefined;
}>, z.ZodObject<{
    action_type: z.ZodLiteral<"wait">;
    duration: z.ZodNumber;
    condition: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action_type: "wait";
    duration: number;
    condition?: string | undefined;
}, {
    action_type: "wait";
    duration: number;
    condition?: string | undefined;
}>]>;
export declare const StepSchema: z.ZodObject<{
    id: z.ZodString;
    description: z.ZodString;
    persona: z.ZodString;
    actions: z.ZodArray<z.ZodDiscriminatedUnion<"action_type", [z.ZodObject<{
        action_type: z.ZodLiteral<"create_entity">;
        data: z.ZodObject<{
            entity_type: z.ZodString;
            entity_name: z.ZodString;
            entity_code: z.ZodOptional<z.ZodString>;
            smart_code: z.ZodString;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            dynamic_fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        }, {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    }, {
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"create_transaction">;
        data: z.ZodObject<{
            transaction_type: z.ZodString;
            transaction_code: z.ZodOptional<z.ZodString>;
            smart_code: z.ZodString;
            total_amount: z.ZodOptional<z.ZodNumber>;
            currency: z.ZodOptional<z.ZodString>;
            reference_entity_id: z.ZodOptional<z.ZodString>;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            line_items: z.ZodOptional<z.ZodArray<z.ZodObject<{
                line_entity_id: z.ZodOptional<z.ZodString>;
                line_number: z.ZodNumber;
                quantity: z.ZodOptional<z.ZodNumber>;
                unit_price: z.ZodOptional<z.ZodNumber>;
                line_amount: z.ZodNumber;
                smart_code: z.ZodString;
                metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }, {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        }, {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    }, {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"create_relationship">;
        data: z.ZodObject<{
            from_entity_id: z.ZodString;
            to_entity_id: z.ZodString;
            relationship_type: z.ZodString;
            smart_code: z.ZodString;
            relationship_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        }, {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    }, {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"set_dynamic_field">;
        entity_id: z.ZodString;
        field_name: z.ZodString;
        field_value: z.ZodAny;
        smart_code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    }, {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"ui_interaction">;
        selector: z.ZodString;
        interaction: z.ZodEnum<["click", "fill", "select", "upload", "wait"]>;
        value: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    }, {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"api_call">;
        endpoint: z.ZodString;
        method: z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    }, {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"wait">;
        duration: z.ZodNumber;
        condition: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    }, {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    }>]>, "many">;
    preconditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    postconditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retry: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timeout: number;
    id: string;
    description: string;
    persona: string;
    actions: ({
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    } | {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    } | {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    } | {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    })[];
    retry: number;
    preconditions?: string[] | undefined;
    postconditions?: string[] | undefined;
}, {
    id: string;
    description: string;
    persona: string;
    actions: ({
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    } | {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    } | {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    } | {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    })[];
    timeout?: number | undefined;
    preconditions?: string[] | undefined;
    postconditions?: string[] | undefined;
    retry?: number | undefined;
}>;
export declare const UIAssertionSchema: z.ZodObject<{
    type: z.ZodLiteral<"ui">;
    assertions: z.ZodArray<z.ZodObject<{
        selector: z.ZodOptional<z.ZodString>;
        condition: z.ZodEnum<["visible", "hidden", "contains", "not_contains", "enabled", "disabled", "count"]>;
        value: z.ZodOptional<z.ZodAny>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
        value?: any;
        selector?: string | undefined;
        timeout?: number | undefined;
    }, {
        condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
        value?: any;
        selector?: string | undefined;
        timeout?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "ui";
    assertions: {
        condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
        value?: any;
        selector?: string | undefined;
        timeout?: number | undefined;
    }[];
}, {
    type: "ui";
    assertions: {
        condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
        value?: any;
        selector?: string | undefined;
        timeout?: number | undefined;
    }[];
}>;
export declare const DatabaseAssertionSchema: z.ZodObject<{
    type: z.ZodLiteral<"database">;
    assertions: z.ZodArray<z.ZodObject<{
        table: z.ZodEnum<["core_organizations", "core_entities", "core_dynamic_data", "core_relationships", "universal_transactions", "universal_transaction_lines"]>;
        condition: z.ZodEnum<["count", "exists", "not_exists", "equals", "contains"]>;
        filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        expected: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        condition: "contains" | "count" | "exists" | "not_exists" | "equals";
        table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        filters?: Record<string, any> | undefined;
    }, {
        condition: "contains" | "count" | "exists" | "not_exists" | "equals";
        table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        filters?: Record<string, any> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "database";
    assertions: {
        condition: "contains" | "count" | "exists" | "not_exists" | "equals";
        table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        filters?: Record<string, any> | undefined;
    }[];
}, {
    type: "database";
    assertions: {
        condition: "contains" | "count" | "exists" | "not_exists" | "equals";
        table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        filters?: Record<string, any> | undefined;
    }[];
}>;
export declare const BusinessAssertionSchema: z.ZodObject<{
    type: z.ZodLiteral<"business">;
    assertions: z.ZodArray<z.ZodObject<{
        oracle: z.ZodEnum<["accounting_equation", "inventory_balance", "workflow_status", "tax_calculation", "smart_code_validation"]>;
        expected: z.ZodAny;
        tolerance: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        expected?: any;
        tolerance?: number | undefined;
    }, {
        oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        expected?: any;
        tolerance?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "business";
    assertions: {
        oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        expected?: any;
        tolerance?: number | undefined;
    }[];
}, {
    type: "business";
    assertions: {
        oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        expected?: any;
        tolerance?: number | undefined;
    }[];
}>;
export declare const AssertionSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"ui">;
    assertions: z.ZodArray<z.ZodObject<{
        selector: z.ZodOptional<z.ZodString>;
        condition: z.ZodEnum<["visible", "hidden", "contains", "not_contains", "enabled", "disabled", "count"]>;
        value: z.ZodOptional<z.ZodAny>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
        value?: any;
        selector?: string | undefined;
        timeout?: number | undefined;
    }, {
        condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
        value?: any;
        selector?: string | undefined;
        timeout?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "ui";
    assertions: {
        condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
        value?: any;
        selector?: string | undefined;
        timeout?: number | undefined;
    }[];
}, {
    type: "ui";
    assertions: {
        condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
        value?: any;
        selector?: string | undefined;
        timeout?: number | undefined;
    }[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"database">;
    assertions: z.ZodArray<z.ZodObject<{
        table: z.ZodEnum<["core_organizations", "core_entities", "core_dynamic_data", "core_relationships", "universal_transactions", "universal_transaction_lines"]>;
        condition: z.ZodEnum<["count", "exists", "not_exists", "equals", "contains"]>;
        filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        expected: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        condition: "contains" | "count" | "exists" | "not_exists" | "equals";
        table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        filters?: Record<string, any> | undefined;
    }, {
        condition: "contains" | "count" | "exists" | "not_exists" | "equals";
        table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        filters?: Record<string, any> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "database";
    assertions: {
        condition: "contains" | "count" | "exists" | "not_exists" | "equals";
        table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        filters?: Record<string, any> | undefined;
    }[];
}, {
    type: "database";
    assertions: {
        condition: "contains" | "count" | "exists" | "not_exists" | "equals";
        table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        filters?: Record<string, any> | undefined;
    }[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"business">;
    assertions: z.ZodArray<z.ZodObject<{
        oracle: z.ZodEnum<["accounting_equation", "inventory_balance", "workflow_status", "tax_calculation", "smart_code_validation"]>;
        expected: z.ZodAny;
        tolerance: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        expected?: any;
        tolerance?: number | undefined;
    }, {
        oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        expected?: any;
        tolerance?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "business";
    assertions: {
        oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        expected?: any;
        tolerance?: number | undefined;
    }[];
}, {
    type: "business";
    assertions: {
        oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        expected?: any;
        tolerance?: number | undefined;
    }[];
}>]>;
export declare const BusinessProcessTestSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    version: z.ZodDefault<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    context: z.ZodObject<{
        tenant: z.ZodString;
        organization_id: z.ZodString;
        currency: z.ZodDefault<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
        locale: z.ZodDefault<z.ZodString>;
        fiscal_year: z.ZodDefault<z.ZodNumber>;
        clock: z.ZodOptional<z.ZodString>;
        smart_code_prefix: z.ZodDefault<z.ZodString>;
        industry: z.ZodOptional<z.ZodEnum<["restaurant", "healthcare", "retail", "salon", "manufacturing", "professional_services"]>>;
    }, "strip", z.ZodTypeAny, {
        organization_id: string;
        tenant: string;
        currency: string;
        timezone: string;
        locale: string;
        fiscal_year: number;
        smart_code_prefix: string;
        clock?: string | undefined;
        industry?: "restaurant" | "healthcare" | "retail" | "salon" | "manufacturing" | "professional_services" | undefined;
    }, {
        organization_id: string;
        tenant: string;
        currency?: string | undefined;
        timezone?: string | undefined;
        locale?: string | undefined;
        fiscal_year?: number | undefined;
        clock?: string | undefined;
        smart_code_prefix?: string | undefined;
        industry?: "restaurant" | "healthcare" | "retail" | "salon" | "manufacturing" | "professional_services" | undefined;
    }>;
    personas: z.ZodRecord<z.ZodString, z.ZodObject<{
        role: z.ZodEnum<["owner", "admin", "manager", "user", "accountant", "warehouse", "sales", "hr"]>;
        organization_id: z.ZodOptional<z.ZodString>;
        entity_id: z.ZodOptional<z.ZodString>;
        permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        role: "owner" | "admin" | "manager" | "user" | "accountant" | "warehouse" | "sales" | "hr";
        organization_id?: string | undefined;
        entity_id?: string | undefined;
        permissions?: string[] | undefined;
    }, {
        role: "owner" | "admin" | "manager" | "user" | "accountant" | "warehouse" | "sales" | "hr";
        organization_id?: string | undefined;
        entity_id?: string | undefined;
        permissions?: string[] | undefined;
    }>>;
    setup: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"action_type", [z.ZodObject<{
        action_type: z.ZodLiteral<"create_entity">;
        data: z.ZodObject<{
            entity_type: z.ZodString;
            entity_name: z.ZodString;
            entity_code: z.ZodOptional<z.ZodString>;
            smart_code: z.ZodString;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            dynamic_fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        }, {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    }, {
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"create_transaction">;
        data: z.ZodObject<{
            transaction_type: z.ZodString;
            transaction_code: z.ZodOptional<z.ZodString>;
            smart_code: z.ZodString;
            total_amount: z.ZodOptional<z.ZodNumber>;
            currency: z.ZodOptional<z.ZodString>;
            reference_entity_id: z.ZodOptional<z.ZodString>;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            line_items: z.ZodOptional<z.ZodArray<z.ZodObject<{
                line_entity_id: z.ZodOptional<z.ZodString>;
                line_number: z.ZodNumber;
                quantity: z.ZodOptional<z.ZodNumber>;
                unit_price: z.ZodOptional<z.ZodNumber>;
                line_amount: z.ZodNumber;
                smart_code: z.ZodString;
                metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }, {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        }, {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    }, {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"create_relationship">;
        data: z.ZodObject<{
            from_entity_id: z.ZodString;
            to_entity_id: z.ZodString;
            relationship_type: z.ZodString;
            smart_code: z.ZodString;
            relationship_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        }, {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    }, {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"set_dynamic_field">;
        entity_id: z.ZodString;
        field_name: z.ZodString;
        field_value: z.ZodAny;
        smart_code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    }, {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"ui_interaction">;
        selector: z.ZodString;
        interaction: z.ZodEnum<["click", "fill", "select", "upload", "wait"]>;
        value: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    }, {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"api_call">;
        endpoint: z.ZodString;
        method: z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    }, {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"wait">;
        duration: z.ZodNumber;
        condition: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    }, {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    }>]>, "many">>;
    steps: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        description: z.ZodString;
        persona: z.ZodString;
        actions: z.ZodArray<z.ZodDiscriminatedUnion<"action_type", [z.ZodObject<{
            action_type: z.ZodLiteral<"create_entity">;
            data: z.ZodObject<{
                entity_type: z.ZodString;
                entity_name: z.ZodString;
                entity_code: z.ZodOptional<z.ZodString>;
                smart_code: z.ZodString;
                metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                dynamic_fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                entity_type: string;
                entity_name: string;
                smart_code: string;
                entity_code?: string | undefined;
                metadata?: Record<string, any> | undefined;
                dynamic_fields?: Record<string, any> | undefined;
            }, {
                entity_type: string;
                entity_name: string;
                smart_code: string;
                entity_code?: string | undefined;
                metadata?: Record<string, any> | undefined;
                dynamic_fields?: Record<string, any> | undefined;
            }>;
            store_as: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action_type: "create_entity";
            data: {
                entity_type: string;
                entity_name: string;
                smart_code: string;
                entity_code?: string | undefined;
                metadata?: Record<string, any> | undefined;
                dynamic_fields?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        }, {
            action_type: "create_entity";
            data: {
                entity_type: string;
                entity_name: string;
                smart_code: string;
                entity_code?: string | undefined;
                metadata?: Record<string, any> | undefined;
                dynamic_fields?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        }>, z.ZodObject<{
            action_type: z.ZodLiteral<"create_transaction">;
            data: z.ZodObject<{
                transaction_type: z.ZodString;
                transaction_code: z.ZodOptional<z.ZodString>;
                smart_code: z.ZodString;
                total_amount: z.ZodOptional<z.ZodNumber>;
                currency: z.ZodOptional<z.ZodString>;
                reference_entity_id: z.ZodOptional<z.ZodString>;
                metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                line_items: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    line_entity_id: z.ZodOptional<z.ZodString>;
                    line_number: z.ZodNumber;
                    quantity: z.ZodOptional<z.ZodNumber>;
                    unit_price: z.ZodOptional<z.ZodNumber>;
                    line_amount: z.ZodNumber;
                    smart_code: z.ZodString;
                    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                }, "strip", z.ZodTypeAny, {
                    smart_code: string;
                    line_number: number;
                    line_amount: number;
                    metadata?: Record<string, any> | undefined;
                    line_entity_id?: string | undefined;
                    quantity?: number | undefined;
                    unit_price?: number | undefined;
                }, {
                    smart_code: string;
                    line_number: number;
                    line_amount: number;
                    metadata?: Record<string, any> | undefined;
                    line_entity_id?: string | undefined;
                    quantity?: number | undefined;
                    unit_price?: number | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                smart_code: string;
                transaction_type: string;
                currency?: string | undefined;
                metadata?: Record<string, any> | undefined;
                transaction_code?: string | undefined;
                total_amount?: number | undefined;
                reference_entity_id?: string | undefined;
                line_items?: {
                    smart_code: string;
                    line_number: number;
                    line_amount: number;
                    metadata?: Record<string, any> | undefined;
                    line_entity_id?: string | undefined;
                    quantity?: number | undefined;
                    unit_price?: number | undefined;
                }[] | undefined;
            }, {
                smart_code: string;
                transaction_type: string;
                currency?: string | undefined;
                metadata?: Record<string, any> | undefined;
                transaction_code?: string | undefined;
                total_amount?: number | undefined;
                reference_entity_id?: string | undefined;
                line_items?: {
                    smart_code: string;
                    line_number: number;
                    line_amount: number;
                    metadata?: Record<string, any> | undefined;
                    line_entity_id?: string | undefined;
                    quantity?: number | undefined;
                    unit_price?: number | undefined;
                }[] | undefined;
            }>;
            store_as: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action_type: "create_transaction";
            data: {
                smart_code: string;
                transaction_type: string;
                currency?: string | undefined;
                metadata?: Record<string, any> | undefined;
                transaction_code?: string | undefined;
                total_amount?: number | undefined;
                reference_entity_id?: string | undefined;
                line_items?: {
                    smart_code: string;
                    line_number: number;
                    line_amount: number;
                    metadata?: Record<string, any> | undefined;
                    line_entity_id?: string | undefined;
                    quantity?: number | undefined;
                    unit_price?: number | undefined;
                }[] | undefined;
            };
            store_as?: string | undefined;
        }, {
            action_type: "create_transaction";
            data: {
                smart_code: string;
                transaction_type: string;
                currency?: string | undefined;
                metadata?: Record<string, any> | undefined;
                transaction_code?: string | undefined;
                total_amount?: number | undefined;
                reference_entity_id?: string | undefined;
                line_items?: {
                    smart_code: string;
                    line_number: number;
                    line_amount: number;
                    metadata?: Record<string, any> | undefined;
                    line_entity_id?: string | undefined;
                    quantity?: number | undefined;
                    unit_price?: number | undefined;
                }[] | undefined;
            };
            store_as?: string | undefined;
        }>, z.ZodObject<{
            action_type: z.ZodLiteral<"create_relationship">;
            data: z.ZodObject<{
                from_entity_id: z.ZodString;
                to_entity_id: z.ZodString;
                relationship_type: z.ZodString;
                smart_code: z.ZodString;
                relationship_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                smart_code: string;
                from_entity_id: string;
                to_entity_id: string;
                relationship_type: string;
                relationship_data?: Record<string, any> | undefined;
            }, {
                smart_code: string;
                from_entity_id: string;
                to_entity_id: string;
                relationship_type: string;
                relationship_data?: Record<string, any> | undefined;
            }>;
            store_as: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action_type: "create_relationship";
            data: {
                smart_code: string;
                from_entity_id: string;
                to_entity_id: string;
                relationship_type: string;
                relationship_data?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        }, {
            action_type: "create_relationship";
            data: {
                smart_code: string;
                from_entity_id: string;
                to_entity_id: string;
                relationship_type: string;
                relationship_data?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        }>, z.ZodObject<{
            action_type: z.ZodLiteral<"set_dynamic_field">;
            entity_id: z.ZodString;
            field_name: z.ZodString;
            field_value: z.ZodAny;
            smart_code: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            entity_id: string;
            smart_code: string;
            action_type: "set_dynamic_field";
            field_name: string;
            field_value?: any;
        }, {
            entity_id: string;
            smart_code: string;
            action_type: "set_dynamic_field";
            field_name: string;
            field_value?: any;
        }>, z.ZodObject<{
            action_type: z.ZodLiteral<"ui_interaction">;
            selector: z.ZodString;
            interaction: z.ZodEnum<["click", "fill", "select", "upload", "wait"]>;
            value: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            action_type: "ui_interaction";
            selector: string;
            interaction: "fill" | "click" | "select" | "upload" | "wait";
            value?: string | undefined;
            timeout?: number | undefined;
        }, {
            action_type: "ui_interaction";
            selector: string;
            interaction: "fill" | "click" | "select" | "upload" | "wait";
            value?: string | undefined;
            timeout?: number | undefined;
        }>, z.ZodObject<{
            action_type: z.ZodLiteral<"api_call">;
            endpoint: z.ZodString;
            method: z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>;
            data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            store_as: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action_type: "api_call";
            endpoint: string;
            method: "GET" | "POST" | "PUT" | "DELETE";
            data?: Record<string, any> | undefined;
            store_as?: string | undefined;
        }, {
            action_type: "api_call";
            endpoint: string;
            method: "GET" | "POST" | "PUT" | "DELETE";
            data?: Record<string, any> | undefined;
            store_as?: string | undefined;
        }>, z.ZodObject<{
            action_type: z.ZodLiteral<"wait">;
            duration: z.ZodNumber;
            condition: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action_type: "wait";
            duration: number;
            condition?: string | undefined;
        }, {
            action_type: "wait";
            duration: number;
            condition?: string | undefined;
        }>]>, "many">;
        preconditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        postconditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timeout: z.ZodDefault<z.ZodNumber>;
        retry: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        timeout: number;
        id: string;
        description: string;
        persona: string;
        actions: ({
            action_type: "create_entity";
            data: {
                entity_type: string;
                entity_name: string;
                smart_code: string;
                entity_code?: string | undefined;
                metadata?: Record<string, any> | undefined;
                dynamic_fields?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        } | {
            action_type: "create_transaction";
            data: {
                smart_code: string;
                transaction_type: string;
                currency?: string | undefined;
                metadata?: Record<string, any> | undefined;
                transaction_code?: string | undefined;
                total_amount?: number | undefined;
                reference_entity_id?: string | undefined;
                line_items?: {
                    smart_code: string;
                    line_number: number;
                    line_amount: number;
                    metadata?: Record<string, any> | undefined;
                    line_entity_id?: string | undefined;
                    quantity?: number | undefined;
                    unit_price?: number | undefined;
                }[] | undefined;
            };
            store_as?: string | undefined;
        } | {
            action_type: "create_relationship";
            data: {
                smart_code: string;
                from_entity_id: string;
                to_entity_id: string;
                relationship_type: string;
                relationship_data?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        } | {
            entity_id: string;
            smart_code: string;
            action_type: "set_dynamic_field";
            field_name: string;
            field_value?: any;
        } | {
            action_type: "ui_interaction";
            selector: string;
            interaction: "fill" | "click" | "select" | "upload" | "wait";
            value?: string | undefined;
            timeout?: number | undefined;
        } | {
            action_type: "api_call";
            endpoint: string;
            method: "GET" | "POST" | "PUT" | "DELETE";
            data?: Record<string, any> | undefined;
            store_as?: string | undefined;
        } | {
            action_type: "wait";
            duration: number;
            condition?: string | undefined;
        })[];
        retry: number;
        preconditions?: string[] | undefined;
        postconditions?: string[] | undefined;
    }, {
        id: string;
        description: string;
        persona: string;
        actions: ({
            action_type: "create_entity";
            data: {
                entity_type: string;
                entity_name: string;
                smart_code: string;
                entity_code?: string | undefined;
                metadata?: Record<string, any> | undefined;
                dynamic_fields?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        } | {
            action_type: "create_transaction";
            data: {
                smart_code: string;
                transaction_type: string;
                currency?: string | undefined;
                metadata?: Record<string, any> | undefined;
                transaction_code?: string | undefined;
                total_amount?: number | undefined;
                reference_entity_id?: string | undefined;
                line_items?: {
                    smart_code: string;
                    line_number: number;
                    line_amount: number;
                    metadata?: Record<string, any> | undefined;
                    line_entity_id?: string | undefined;
                    quantity?: number | undefined;
                    unit_price?: number | undefined;
                }[] | undefined;
            };
            store_as?: string | undefined;
        } | {
            action_type: "create_relationship";
            data: {
                smart_code: string;
                from_entity_id: string;
                to_entity_id: string;
                relationship_type: string;
                relationship_data?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        } | {
            entity_id: string;
            smart_code: string;
            action_type: "set_dynamic_field";
            field_name: string;
            field_value?: any;
        } | {
            action_type: "ui_interaction";
            selector: string;
            interaction: "fill" | "click" | "select" | "upload" | "wait";
            value?: string | undefined;
            timeout?: number | undefined;
        } | {
            action_type: "api_call";
            endpoint: string;
            method: "GET" | "POST" | "PUT" | "DELETE";
            data?: Record<string, any> | undefined;
            store_as?: string | undefined;
        } | {
            action_type: "wait";
            duration: number;
            condition?: string | undefined;
        })[];
        timeout?: number | undefined;
        preconditions?: string[] | undefined;
        postconditions?: string[] | undefined;
        retry?: number | undefined;
    }>, "many">;
    cleanup: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"action_type", [z.ZodObject<{
        action_type: z.ZodLiteral<"create_entity">;
        data: z.ZodObject<{
            entity_type: z.ZodString;
            entity_name: z.ZodString;
            entity_code: z.ZodOptional<z.ZodString>;
            smart_code: z.ZodString;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            dynamic_fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        }, {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    }, {
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"create_transaction">;
        data: z.ZodObject<{
            transaction_type: z.ZodString;
            transaction_code: z.ZodOptional<z.ZodString>;
            smart_code: z.ZodString;
            total_amount: z.ZodOptional<z.ZodNumber>;
            currency: z.ZodOptional<z.ZodString>;
            reference_entity_id: z.ZodOptional<z.ZodString>;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            line_items: z.ZodOptional<z.ZodArray<z.ZodObject<{
                line_entity_id: z.ZodOptional<z.ZodString>;
                line_number: z.ZodNumber;
                quantity: z.ZodOptional<z.ZodNumber>;
                unit_price: z.ZodOptional<z.ZodNumber>;
                line_amount: z.ZodNumber;
                smart_code: z.ZodString;
                metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }, {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        }, {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    }, {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"create_relationship">;
        data: z.ZodObject<{
            from_entity_id: z.ZodString;
            to_entity_id: z.ZodString;
            relationship_type: z.ZodString;
            smart_code: z.ZodString;
            relationship_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        }, {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    }, {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"set_dynamic_field">;
        entity_id: z.ZodString;
        field_name: z.ZodString;
        field_value: z.ZodAny;
        smart_code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    }, {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"ui_interaction">;
        selector: z.ZodString;
        interaction: z.ZodEnum<["click", "fill", "select", "upload", "wait"]>;
        value: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    }, {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"api_call">;
        endpoint: z.ZodString;
        method: z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    }, {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"wait">;
        duration: z.ZodNumber;
        condition: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    }, {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    }>]>, "many">>;
    assertions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"ui">;
        assertions: z.ZodArray<z.ZodObject<{
            selector: z.ZodOptional<z.ZodString>;
            condition: z.ZodEnum<["visible", "hidden", "contains", "not_contains", "enabled", "disabled", "count"]>;
            value: z.ZodOptional<z.ZodAny>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
            value?: any;
            selector?: string | undefined;
            timeout?: number | undefined;
        }, {
            condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
            value?: any;
            selector?: string | undefined;
            timeout?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "ui";
        assertions: {
            condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
            value?: any;
            selector?: string | undefined;
            timeout?: number | undefined;
        }[];
    }, {
        type: "ui";
        assertions: {
            condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
            value?: any;
            selector?: string | undefined;
            timeout?: number | undefined;
        }[];
    }>, z.ZodObject<{
        type: z.ZodLiteral<"database">;
        assertions: z.ZodArray<z.ZodObject<{
            table: z.ZodEnum<["core_organizations", "core_entities", "core_dynamic_data", "core_relationships", "universal_transactions", "universal_transaction_lines"]>;
            condition: z.ZodEnum<["count", "exists", "not_exists", "equals", "contains"]>;
            filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            expected: z.ZodAny;
        }, "strip", z.ZodTypeAny, {
            condition: "contains" | "count" | "exists" | "not_exists" | "equals";
            table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
            expected?: any;
            filters?: Record<string, any> | undefined;
        }, {
            condition: "contains" | "count" | "exists" | "not_exists" | "equals";
            table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
            expected?: any;
            filters?: Record<string, any> | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "database";
        assertions: {
            condition: "contains" | "count" | "exists" | "not_exists" | "equals";
            table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
            expected?: any;
            filters?: Record<string, any> | undefined;
        }[];
    }, {
        type: "database";
        assertions: {
            condition: "contains" | "count" | "exists" | "not_exists" | "equals";
            table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
            expected?: any;
            filters?: Record<string, any> | undefined;
        }[];
    }>, z.ZodObject<{
        type: z.ZodLiteral<"business">;
        assertions: z.ZodArray<z.ZodObject<{
            oracle: z.ZodEnum<["accounting_equation", "inventory_balance", "workflow_status", "tax_calculation", "smart_code_validation"]>;
            expected: z.ZodAny;
            tolerance: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
            expected?: any;
            tolerance?: number | undefined;
        }, {
            oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
            expected?: any;
            tolerance?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "business";
        assertions: {
            oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
            expected?: any;
            tolerance?: number | undefined;
        }[];
    }, {
        type: "business";
        assertions: {
            oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
            expected?: any;
            tolerance?: number | undefined;
        }[];
    }>]>, "many">;
    metadata: z.ZodDefault<z.ZodObject<{
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
        estimated_duration: z.ZodOptional<z.ZodNumber>;
        requires_auth: z.ZodDefault<z.ZodBoolean>;
        requires_data: z.ZodDefault<z.ZodBoolean>;
        browser_support: z.ZodDefault<z.ZodArray<z.ZodEnum<["chromium", "firefox", "webkit"]>, "many">>;
        mobile_support: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        tags: string[];
        priority: "low" | "medium" | "high" | "critical";
        requires_auth: boolean;
        requires_data: boolean;
        browser_support: ("chromium" | "firefox" | "webkit")[];
        mobile_support: boolean;
        estimated_duration?: number | undefined;
    }, {
        tags?: string[] | undefined;
        priority?: "low" | "medium" | "high" | "critical" | undefined;
        estimated_duration?: number | undefined;
        requires_auth?: boolean | undefined;
        requires_data?: boolean | undefined;
        browser_support?: ("chromium" | "firefox" | "webkit")[] | undefined;
        mobile_support?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    metadata: {
        tags: string[];
        priority: "low" | "medium" | "high" | "critical";
        requires_auth: boolean;
        requires_data: boolean;
        browser_support: ("chromium" | "firefox" | "webkit")[];
        mobile_support: boolean;
        estimated_duration?: number | undefined;
    };
    id: string;
    assertions: ({
        type: "ui";
        assertions: {
            condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
            value?: any;
            selector?: string | undefined;
            timeout?: number | undefined;
        }[];
    } | {
        type: "database";
        assertions: {
            condition: "contains" | "count" | "exists" | "not_exists" | "equals";
            table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
            expected?: any;
            filters?: Record<string, any> | undefined;
        }[];
    } | {
        type: "business";
        assertions: {
            oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
            expected?: any;
            tolerance?: number | undefined;
        }[];
    })[];
    title: string;
    version: string;
    context: {
        organization_id: string;
        tenant: string;
        currency: string;
        timezone: string;
        locale: string;
        fiscal_year: number;
        smart_code_prefix: string;
        clock?: string | undefined;
        industry?: "restaurant" | "healthcare" | "retail" | "salon" | "manufacturing" | "professional_services" | undefined;
    };
    personas: Record<string, {
        role: "owner" | "admin" | "manager" | "user" | "accountant" | "warehouse" | "sales" | "hr";
        organization_id?: string | undefined;
        entity_id?: string | undefined;
        permissions?: string[] | undefined;
    }>;
    steps: {
        timeout: number;
        id: string;
        description: string;
        persona: string;
        actions: ({
            action_type: "create_entity";
            data: {
                entity_type: string;
                entity_name: string;
                smart_code: string;
                entity_code?: string | undefined;
                metadata?: Record<string, any> | undefined;
                dynamic_fields?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        } | {
            action_type: "create_transaction";
            data: {
                smart_code: string;
                transaction_type: string;
                currency?: string | undefined;
                metadata?: Record<string, any> | undefined;
                transaction_code?: string | undefined;
                total_amount?: number | undefined;
                reference_entity_id?: string | undefined;
                line_items?: {
                    smart_code: string;
                    line_number: number;
                    line_amount: number;
                    metadata?: Record<string, any> | undefined;
                    line_entity_id?: string | undefined;
                    quantity?: number | undefined;
                    unit_price?: number | undefined;
                }[] | undefined;
            };
            store_as?: string | undefined;
        } | {
            action_type: "create_relationship";
            data: {
                smart_code: string;
                from_entity_id: string;
                to_entity_id: string;
                relationship_type: string;
                relationship_data?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        } | {
            entity_id: string;
            smart_code: string;
            action_type: "set_dynamic_field";
            field_name: string;
            field_value?: any;
        } | {
            action_type: "ui_interaction";
            selector: string;
            interaction: "fill" | "click" | "select" | "upload" | "wait";
            value?: string | undefined;
            timeout?: number | undefined;
        } | {
            action_type: "api_call";
            endpoint: string;
            method: "GET" | "POST" | "PUT" | "DELETE";
            data?: Record<string, any> | undefined;
            store_as?: string | undefined;
        } | {
            action_type: "wait";
            duration: number;
            condition?: string | undefined;
        })[];
        retry: number;
        preconditions?: string[] | undefined;
        postconditions?: string[] | undefined;
    }[];
    industry?: string | undefined;
    description?: string | undefined;
    author?: string | undefined;
    setup?: ({
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    } | {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    } | {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    } | {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    })[] | undefined;
    cleanup?: ({
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    } | {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    } | {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    } | {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    })[] | undefined;
}, {
    id: string;
    assertions: ({
        type: "ui";
        assertions: {
            condition: "visible" | "hidden" | "contains" | "not_contains" | "enabled" | "disabled" | "count";
            value?: any;
            selector?: string | undefined;
            timeout?: number | undefined;
        }[];
    } | {
        type: "database";
        assertions: {
            condition: "contains" | "count" | "exists" | "not_exists" | "equals";
            table: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
            expected?: any;
            filters?: Record<string, any> | undefined;
        }[];
    } | {
        type: "business";
        assertions: {
            oracle: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
            expected?: any;
            tolerance?: number | undefined;
        }[];
    })[];
    title: string;
    context: {
        organization_id: string;
        tenant: string;
        currency?: string | undefined;
        timezone?: string | undefined;
        locale?: string | undefined;
        fiscal_year?: number | undefined;
        clock?: string | undefined;
        smart_code_prefix?: string | undefined;
        industry?: "restaurant" | "healthcare" | "retail" | "salon" | "manufacturing" | "professional_services" | undefined;
    };
    personas: Record<string, {
        role: "owner" | "admin" | "manager" | "user" | "accountant" | "warehouse" | "sales" | "hr";
        organization_id?: string | undefined;
        entity_id?: string | undefined;
        permissions?: string[] | undefined;
    }>;
    steps: {
        id: string;
        description: string;
        persona: string;
        actions: ({
            action_type: "create_entity";
            data: {
                entity_type: string;
                entity_name: string;
                smart_code: string;
                entity_code?: string | undefined;
                metadata?: Record<string, any> | undefined;
                dynamic_fields?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        } | {
            action_type: "create_transaction";
            data: {
                smart_code: string;
                transaction_type: string;
                currency?: string | undefined;
                metadata?: Record<string, any> | undefined;
                transaction_code?: string | undefined;
                total_amount?: number | undefined;
                reference_entity_id?: string | undefined;
                line_items?: {
                    smart_code: string;
                    line_number: number;
                    line_amount: number;
                    metadata?: Record<string, any> | undefined;
                    line_entity_id?: string | undefined;
                    quantity?: number | undefined;
                    unit_price?: number | undefined;
                }[] | undefined;
            };
            store_as?: string | undefined;
        } | {
            action_type: "create_relationship";
            data: {
                smart_code: string;
                from_entity_id: string;
                to_entity_id: string;
                relationship_type: string;
                relationship_data?: Record<string, any> | undefined;
            };
            store_as?: string | undefined;
        } | {
            entity_id: string;
            smart_code: string;
            action_type: "set_dynamic_field";
            field_name: string;
            field_value?: any;
        } | {
            action_type: "ui_interaction";
            selector: string;
            interaction: "fill" | "click" | "select" | "upload" | "wait";
            value?: string | undefined;
            timeout?: number | undefined;
        } | {
            action_type: "api_call";
            endpoint: string;
            method: "GET" | "POST" | "PUT" | "DELETE";
            data?: Record<string, any> | undefined;
            store_as?: string | undefined;
        } | {
            action_type: "wait";
            duration: number;
            condition?: string | undefined;
        })[];
        timeout?: number | undefined;
        preconditions?: string[] | undefined;
        postconditions?: string[] | undefined;
        retry?: number | undefined;
    }[];
    industry?: string | undefined;
    metadata?: {
        tags?: string[] | undefined;
        priority?: "low" | "medium" | "high" | "critical" | undefined;
        estimated_duration?: number | undefined;
        requires_auth?: boolean | undefined;
        requires_data?: boolean | undefined;
        browser_support?: ("chromium" | "firefox" | "webkit")[] | undefined;
        mobile_support?: boolean | undefined;
    } | undefined;
    description?: string | undefined;
    version?: string | undefined;
    author?: string | undefined;
    setup?: ({
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    } | {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    } | {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    } | {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    })[] | undefined;
    cleanup?: ({
        action_type: "create_entity";
        data: {
            entity_type: string;
            entity_name: string;
            smart_code: string;
            entity_code?: string | undefined;
            metadata?: Record<string, any> | undefined;
            dynamic_fields?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_transaction";
        data: {
            smart_code: string;
            transaction_type: string;
            currency?: string | undefined;
            metadata?: Record<string, any> | undefined;
            transaction_code?: string | undefined;
            total_amount?: number | undefined;
            reference_entity_id?: string | undefined;
            line_items?: {
                smart_code: string;
                line_number: number;
                line_amount: number;
                metadata?: Record<string, any> | undefined;
                line_entity_id?: string | undefined;
                quantity?: number | undefined;
                unit_price?: number | undefined;
            }[] | undefined;
        };
        store_as?: string | undefined;
    } | {
        action_type: "create_relationship";
        data: {
            smart_code: string;
            from_entity_id: string;
            to_entity_id: string;
            relationship_type: string;
            relationship_data?: Record<string, any> | undefined;
        };
        store_as?: string | undefined;
    } | {
        entity_id: string;
        smart_code: string;
        action_type: "set_dynamic_field";
        field_name: string;
        field_value?: any;
    } | {
        action_type: "ui_interaction";
        selector: string;
        interaction: "fill" | "click" | "select" | "upload" | "wait";
        value?: string | undefined;
        timeout?: number | undefined;
    } | {
        action_type: "api_call";
        endpoint: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        data?: Record<string, any> | undefined;
        store_as?: string | undefined;
    } | {
        action_type: "wait";
        duration: number;
        condition?: string | undefined;
    })[] | undefined;
}>;
export type BusinessProcessTest = z.infer<typeof BusinessProcessTestSchema>;
export type Persona = z.infer<typeof PersonaSchema>;
export type Context = z.infer<typeof ContextSchema>;
export type StepAction = z.infer<typeof StepActionSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Assertion = z.infer<typeof AssertionSchema>;
export declare const SMART_CODE_PATTERNS: {
    readonly ENTITY: {
        readonly CUSTOMER: "HERA.CRM.CUST.ENT.PROF.v1";
        readonly VENDOR: "HERA.SCM.VEND.ENT.PROF.v1";
        readonly PRODUCT: "HERA.INV.PROD.ENT.ITEM.v1";
        readonly EMPLOYEE: "HERA.HR.EMP.ENT.PROF.v1";
        readonly GL_ACCOUNT: "HERA.FIN.GL.ACC.ENT.v1";
    };
    readonly TRANSACTION: {
        readonly SALE: "HERA.CRM.SALE.TXN.ORDER.v1";
        readonly PURCHASE: "HERA.SCM.PUR.TXN.ORDER.v1";
        readonly PAYMENT: "HERA.FIN.PAY.TXN.v1";
        readonly JOURNAL: "HERA.FIN.GL.TXN.JE.v1";
    };
    readonly RELATIONSHIP: {
        readonly HAS_STATUS: "HERA.WORKFLOW.STATUS.ASSIGN.v1";
        readonly PARENT_OF: "HERA.ORG.HIERARCHY.PARENT.v1";
        readonly MEMBER_OF: "HERA.ORG.MEMBERSHIP.v1";
    };
};
