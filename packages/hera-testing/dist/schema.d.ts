import { z } from 'zod';
export declare const PersonaSchema: z.ZodObject<{
    role: z.ZodEnum<["owner", "admin", "manager", "user", "accountant", "warehouse", "sales", "hr"]>;
    organization_id: z.ZodOptional<z.ZodString>;
    entity_id: z.ZodOptional<z.ZodString>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    role?: "hr" | "user" | "owner" | "admin" | "manager" | "accountant" | "warehouse" | "sales";
    organization_id?: string;
    entity_id?: string;
    permissions?: string[];
}, {
    role?: "hr" | "user" | "owner" | "admin" | "manager" | "accountant" | "warehouse" | "sales";
    organization_id?: string;
    entity_id?: string;
    permissions?: string[];
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
    currency?: string;
    organization_id?: string;
    tenant?: string;
    timezone?: string;
    locale?: string;
    fiscal_year?: number;
    clock?: string;
    smart_code_prefix?: string;
    industry?: "restaurant" | "healthcare" | "retail" | "salon" | "manufacturing" | "professional_services";
}, {
    currency?: string;
    organization_id?: string;
    tenant?: string;
    timezone?: string;
    locale?: string;
    fiscal_year?: number;
    clock?: string;
    smart_code_prefix?: string;
    industry?: "restaurant" | "healthcare" | "retail" | "salon" | "manufacturing" | "professional_services";
}>;
export declare const EntityDataSchema: z.ZodObject<{
    entity_type: z.ZodString;
    entity_name: z.ZodString;
    entity_code: z.ZodOptional<z.ZodString>;
    smart_code: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    dynamic_fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    metadata?: Record<string, any>;
    entity_type?: string;
    entity_name?: string;
    entity_code?: string;
    smart_code?: string;
    dynamic_fields?: Record<string, any>;
}, {
    metadata?: Record<string, any>;
    entity_type?: string;
    entity_name?: string;
    entity_code?: string;
    smart_code?: string;
    dynamic_fields?: Record<string, any>;
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
        metadata?: Record<string, any>;
        smart_code?: string;
        line_entity_id?: string;
        line_number?: number;
        quantity?: number;
        unit_price?: number;
        line_amount?: number;
    }, {
        metadata?: Record<string, any>;
        smart_code?: string;
        line_entity_id?: string;
        line_number?: number;
        quantity?: number;
        unit_price?: number;
        line_amount?: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    currency?: string;
    metadata?: Record<string, any>;
    smart_code?: string;
    transaction_type?: string;
    transaction_code?: string;
    total_amount?: number;
    reference_entity_id?: string;
    line_items?: {
        metadata?: Record<string, any>;
        smart_code?: string;
        line_entity_id?: string;
        line_number?: number;
        quantity?: number;
        unit_price?: number;
        line_amount?: number;
    }[];
}, {
    currency?: string;
    metadata?: Record<string, any>;
    smart_code?: string;
    transaction_type?: string;
    transaction_code?: string;
    total_amount?: number;
    reference_entity_id?: string;
    line_items?: {
        metadata?: Record<string, any>;
        smart_code?: string;
        line_entity_id?: string;
        line_number?: number;
        quantity?: number;
        unit_price?: number;
        line_amount?: number;
    }[];
}>;
export declare const RelationshipDataSchema: z.ZodObject<{
    from_entity_id: z.ZodString;
    to_entity_id: z.ZodString;
    relationship_type: z.ZodString;
    smart_code: z.ZodString;
    relationship_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    smart_code?: string;
    from_entity_id?: string;
    to_entity_id?: string;
    relationship_type?: string;
    relationship_data?: Record<string, any>;
}, {
    smart_code?: string;
    from_entity_id?: string;
    to_entity_id?: string;
    relationship_type?: string;
    relationship_data?: Record<string, any>;
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
        metadata?: Record<string, any>;
        entity_type?: string;
        entity_name?: string;
        entity_code?: string;
        smart_code?: string;
        dynamic_fields?: Record<string, any>;
    }, {
        metadata?: Record<string, any>;
        entity_type?: string;
        entity_name?: string;
        entity_code?: string;
        smart_code?: string;
        dynamic_fields?: Record<string, any>;
    }>;
    store_as: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    data?: {
        metadata?: Record<string, any>;
        entity_type?: string;
        entity_name?: string;
        entity_code?: string;
        smart_code?: string;
        dynamic_fields?: Record<string, any>;
    };
    action_type?: "create_entity";
    store_as?: string;
}, {
    data?: {
        metadata?: Record<string, any>;
        entity_type?: string;
        entity_name?: string;
        entity_code?: string;
        smart_code?: string;
        dynamic_fields?: Record<string, any>;
    };
    action_type?: "create_entity";
    store_as?: string;
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
            metadata?: Record<string, any>;
            smart_code?: string;
            line_entity_id?: string;
            line_number?: number;
            quantity?: number;
            unit_price?: number;
            line_amount?: number;
        }, {
            metadata?: Record<string, any>;
            smart_code?: string;
            line_entity_id?: string;
            line_number?: number;
            quantity?: number;
            unit_price?: number;
            line_amount?: number;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        currency?: string;
        metadata?: Record<string, any>;
        smart_code?: string;
        transaction_type?: string;
        transaction_code?: string;
        total_amount?: number;
        reference_entity_id?: string;
        line_items?: {
            metadata?: Record<string, any>;
            smart_code?: string;
            line_entity_id?: string;
            line_number?: number;
            quantity?: number;
            unit_price?: number;
            line_amount?: number;
        }[];
    }, {
        currency?: string;
        metadata?: Record<string, any>;
        smart_code?: string;
        transaction_type?: string;
        transaction_code?: string;
        total_amount?: number;
        reference_entity_id?: string;
        line_items?: {
            metadata?: Record<string, any>;
            smart_code?: string;
            line_entity_id?: string;
            line_number?: number;
            quantity?: number;
            unit_price?: number;
            line_amount?: number;
        }[];
    }>;
    store_as: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    data?: {
        currency?: string;
        metadata?: Record<string, any>;
        smart_code?: string;
        transaction_type?: string;
        transaction_code?: string;
        total_amount?: number;
        reference_entity_id?: string;
        line_items?: {
            metadata?: Record<string, any>;
            smart_code?: string;
            line_entity_id?: string;
            line_number?: number;
            quantity?: number;
            unit_price?: number;
            line_amount?: number;
        }[];
    };
    action_type?: "create_transaction";
    store_as?: string;
}, {
    data?: {
        currency?: string;
        metadata?: Record<string, any>;
        smart_code?: string;
        transaction_type?: string;
        transaction_code?: string;
        total_amount?: number;
        reference_entity_id?: string;
        line_items?: {
            metadata?: Record<string, any>;
            smart_code?: string;
            line_entity_id?: string;
            line_number?: number;
            quantity?: number;
            unit_price?: number;
            line_amount?: number;
        }[];
    };
    action_type?: "create_transaction";
    store_as?: string;
}>, z.ZodObject<{
    action_type: z.ZodLiteral<"create_relationship">;
    data: z.ZodObject<{
        from_entity_id: z.ZodString;
        to_entity_id: z.ZodString;
        relationship_type: z.ZodString;
        smart_code: z.ZodString;
        relationship_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        smart_code?: string;
        from_entity_id?: string;
        to_entity_id?: string;
        relationship_type?: string;
        relationship_data?: Record<string, any>;
    }, {
        smart_code?: string;
        from_entity_id?: string;
        to_entity_id?: string;
        relationship_type?: string;
        relationship_data?: Record<string, any>;
    }>;
    store_as: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    data?: {
        smart_code?: string;
        from_entity_id?: string;
        to_entity_id?: string;
        relationship_type?: string;
        relationship_data?: Record<string, any>;
    };
    action_type?: "create_relationship";
    store_as?: string;
}, {
    data?: {
        smart_code?: string;
        from_entity_id?: string;
        to_entity_id?: string;
        relationship_type?: string;
        relationship_data?: Record<string, any>;
    };
    action_type?: "create_relationship";
    store_as?: string;
}>, z.ZodObject<{
    action_type: z.ZodLiteral<"set_dynamic_field">;
    entity_id: z.ZodString;
    field_name: z.ZodString;
    field_value: z.ZodAny;
    smart_code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    entity_id?: string;
    smart_code?: string;
    action_type?: "set_dynamic_field";
    field_name?: string;
    field_value?: any;
}, {
    entity_id?: string;
    smart_code?: string;
    action_type?: "set_dynamic_field";
    field_name?: string;
    field_value?: any;
}>, z.ZodObject<{
    action_type: z.ZodLiteral<"ui_interaction">;
    selector: z.ZodString;
    interaction: z.ZodEnum<["click", "fill", "select", "upload", "wait"]>;
    value: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    value?: string;
    timeout?: number;
    action_type?: "ui_interaction";
    selector?: string;
    interaction?: "fill" | "select" | "click" | "upload" | "wait";
}, {
    value?: string;
    timeout?: number;
    action_type?: "ui_interaction";
    selector?: string;
    interaction?: "fill" | "select" | "click" | "upload" | "wait";
}>, z.ZodObject<{
    action_type: z.ZodLiteral<"api_call">;
    endpoint: z.ZodString;
    method: z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    store_as: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    data?: Record<string, any>;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    action_type?: "api_call";
    store_as?: string;
    endpoint?: string;
}, {
    data?: Record<string, any>;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    action_type?: "api_call";
    store_as?: string;
    endpoint?: string;
}>, z.ZodObject<{
    action_type: z.ZodLiteral<"wait">;
    duration: z.ZodNumber;
    condition: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    duration?: number;
    action_type?: "wait";
    condition?: string;
}, {
    duration?: number;
    action_type?: "wait";
    condition?: string;
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
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        }, {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        data?: {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        };
        action_type?: "create_entity";
        store_as?: string;
    }, {
        data?: {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        };
        action_type?: "create_entity";
        store_as?: string;
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
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }, {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        }, {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        data?: {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        };
        action_type?: "create_transaction";
        store_as?: string;
    }, {
        data?: {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        };
        action_type?: "create_transaction";
        store_as?: string;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"create_relationship">;
        data: z.ZodObject<{
            from_entity_id: z.ZodString;
            to_entity_id: z.ZodString;
            relationship_type: z.ZodString;
            smart_code: z.ZodString;
            relationship_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        }, {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        data?: {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        };
        action_type?: "create_relationship";
        store_as?: string;
    }, {
        data?: {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        };
        action_type?: "create_relationship";
        store_as?: string;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"set_dynamic_field">;
        entity_id: z.ZodString;
        field_name: z.ZodString;
        field_value: z.ZodAny;
        smart_code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        entity_id?: string;
        smart_code?: string;
        action_type?: "set_dynamic_field";
        field_name?: string;
        field_value?: any;
    }, {
        entity_id?: string;
        smart_code?: string;
        action_type?: "set_dynamic_field";
        field_name?: string;
        field_value?: any;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"ui_interaction">;
        selector: z.ZodString;
        interaction: z.ZodEnum<["click", "fill", "select", "upload", "wait"]>;
        value: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value?: string;
        timeout?: number;
        action_type?: "ui_interaction";
        selector?: string;
        interaction?: "fill" | "select" | "click" | "upload" | "wait";
    }, {
        value?: string;
        timeout?: number;
        action_type?: "ui_interaction";
        selector?: string;
        interaction?: "fill" | "select" | "click" | "upload" | "wait";
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"api_call">;
        endpoint: z.ZodString;
        method: z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        data?: Record<string, any>;
        method?: "GET" | "POST" | "PUT" | "DELETE";
        action_type?: "api_call";
        store_as?: string;
        endpoint?: string;
    }, {
        data?: Record<string, any>;
        method?: "GET" | "POST" | "PUT" | "DELETE";
        action_type?: "api_call";
        store_as?: string;
        endpoint?: string;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"wait">;
        duration: z.ZodNumber;
        condition: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        duration?: number;
        action_type?: "wait";
        condition?: string;
    }, {
        duration?: number;
        action_type?: "wait";
        condition?: string;
    }>]>, "many">;
    preconditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    postconditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retry: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    description?: string;
    timeout?: number;
    persona?: string;
    actions?: ({
        data?: {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        };
        action_type?: "create_entity";
        store_as?: string;
    } | {
        data?: {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        };
        action_type?: "create_transaction";
        store_as?: string;
    } | {
        data?: {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        };
        action_type?: "create_relationship";
        store_as?: string;
    } | {
        entity_id?: string;
        smart_code?: string;
        action_type?: "set_dynamic_field";
        field_name?: string;
        field_value?: any;
    } | {
        value?: string;
        timeout?: number;
        action_type?: "ui_interaction";
        selector?: string;
        interaction?: "fill" | "select" | "click" | "upload" | "wait";
    } | {
        data?: Record<string, any>;
        method?: "GET" | "POST" | "PUT" | "DELETE";
        action_type?: "api_call";
        store_as?: string;
        endpoint?: string;
    } | {
        duration?: number;
        action_type?: "wait";
        condition?: string;
    })[];
    preconditions?: string[];
    postconditions?: string[];
    retry?: number;
}, {
    id?: string;
    description?: string;
    timeout?: number;
    persona?: string;
    actions?: ({
        data?: {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        };
        action_type?: "create_entity";
        store_as?: string;
    } | {
        data?: {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        };
        action_type?: "create_transaction";
        store_as?: string;
    } | {
        data?: {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        };
        action_type?: "create_relationship";
        store_as?: string;
    } | {
        entity_id?: string;
        smart_code?: string;
        action_type?: "set_dynamic_field";
        field_name?: string;
        field_value?: any;
    } | {
        value?: string;
        timeout?: number;
        action_type?: "ui_interaction";
        selector?: string;
        interaction?: "fill" | "select" | "click" | "upload" | "wait";
    } | {
        data?: Record<string, any>;
        method?: "GET" | "POST" | "PUT" | "DELETE";
        action_type?: "api_call";
        store_as?: string;
        endpoint?: string;
    } | {
        duration?: number;
        action_type?: "wait";
        condition?: string;
    })[];
    preconditions?: string[];
    postconditions?: string[];
    retry?: number;
}>;
export declare const UIAssertionSchema: z.ZodObject<{
    type: z.ZodLiteral<"ui">;
    assertions: z.ZodArray<z.ZodObject<{
        selector: z.ZodOptional<z.ZodString>;
        condition: z.ZodEnum<["visible", "hidden", "contains", "not_contains", "enabled", "disabled", "count"]>;
        value: z.ZodOptional<z.ZodAny>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value?: any;
        timeout?: number;
        selector?: string;
        condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
    }, {
        value?: any;
        timeout?: number;
        selector?: string;
        condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type?: "ui";
    assertions?: {
        value?: any;
        timeout?: number;
        selector?: string;
        condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
    }[];
}, {
    type?: "ui";
    assertions?: {
        value?: any;
        timeout?: number;
        selector?: string;
        condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
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
        table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
        filters?: Record<string, any>;
    }, {
        table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
        filters?: Record<string, any>;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type?: "database";
    assertions?: {
        table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
        filters?: Record<string, any>;
    }[];
}, {
    type?: "database";
    assertions?: {
        table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
        filters?: Record<string, any>;
    }[];
}>;
export declare const BusinessAssertionSchema: z.ZodObject<{
    type: z.ZodLiteral<"business">;
    assertions: z.ZodArray<z.ZodObject<{
        oracle: z.ZodEnum<["accounting_equation", "inventory_balance", "workflow_status", "tax_calculation", "smart_code_validation"]>;
        expected: z.ZodAny;
        tolerance: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        expected?: any;
        oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        tolerance?: number;
    }, {
        expected?: any;
        oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        tolerance?: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type?: "business";
    assertions?: {
        expected?: any;
        oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        tolerance?: number;
    }[];
}, {
    type?: "business";
    assertions?: {
        expected?: any;
        oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        tolerance?: number;
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
        value?: any;
        timeout?: number;
        selector?: string;
        condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
    }, {
        value?: any;
        timeout?: number;
        selector?: string;
        condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type?: "ui";
    assertions?: {
        value?: any;
        timeout?: number;
        selector?: string;
        condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
    }[];
}, {
    type?: "ui";
    assertions?: {
        value?: any;
        timeout?: number;
        selector?: string;
        condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
    }[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"database">;
    assertions: z.ZodArray<z.ZodObject<{
        table: z.ZodEnum<["core_organizations", "core_entities", "core_dynamic_data", "core_relationships", "universal_transactions", "universal_transaction_lines"]>;
        condition: z.ZodEnum<["count", "exists", "not_exists", "equals", "contains"]>;
        filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        expected: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
        filters?: Record<string, any>;
    }, {
        table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
        filters?: Record<string, any>;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type?: "database";
    assertions?: {
        table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
        filters?: Record<string, any>;
    }[];
}, {
    type?: "database";
    assertions?: {
        table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
        expected?: any;
        condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
        filters?: Record<string, any>;
    }[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"business">;
    assertions: z.ZodArray<z.ZodObject<{
        oracle: z.ZodEnum<["accounting_equation", "inventory_balance", "workflow_status", "tax_calculation", "smart_code_validation"]>;
        expected: z.ZodAny;
        tolerance: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        expected?: any;
        oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        tolerance?: number;
    }, {
        expected?: any;
        oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        tolerance?: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type?: "business";
    assertions?: {
        expected?: any;
        oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        tolerance?: number;
    }[];
}, {
    type?: "business";
    assertions?: {
        expected?: any;
        oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
        tolerance?: number;
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
        currency?: string;
        organization_id?: string;
        tenant?: string;
        timezone?: string;
        locale?: string;
        fiscal_year?: number;
        clock?: string;
        smart_code_prefix?: string;
        industry?: "restaurant" | "healthcare" | "retail" | "salon" | "manufacturing" | "professional_services";
    }, {
        currency?: string;
        organization_id?: string;
        tenant?: string;
        timezone?: string;
        locale?: string;
        fiscal_year?: number;
        clock?: string;
        smart_code_prefix?: string;
        industry?: "restaurant" | "healthcare" | "retail" | "salon" | "manufacturing" | "professional_services";
    }>;
    personas: z.ZodRecord<z.ZodString, z.ZodObject<{
        role: z.ZodEnum<["owner", "admin", "manager", "user", "accountant", "warehouse", "sales", "hr"]>;
        organization_id: z.ZodOptional<z.ZodString>;
        entity_id: z.ZodOptional<z.ZodString>;
        permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        role?: "hr" | "user" | "owner" | "admin" | "manager" | "accountant" | "warehouse" | "sales";
        organization_id?: string;
        entity_id?: string;
        permissions?: string[];
    }, {
        role?: "hr" | "user" | "owner" | "admin" | "manager" | "accountant" | "warehouse" | "sales";
        organization_id?: string;
        entity_id?: string;
        permissions?: string[];
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
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        }, {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        data?: {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        };
        action_type?: "create_entity";
        store_as?: string;
    }, {
        data?: {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        };
        action_type?: "create_entity";
        store_as?: string;
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
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }, {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        }, {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        data?: {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        };
        action_type?: "create_transaction";
        store_as?: string;
    }, {
        data?: {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        };
        action_type?: "create_transaction";
        store_as?: string;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"create_relationship">;
        data: z.ZodObject<{
            from_entity_id: z.ZodString;
            to_entity_id: z.ZodString;
            relationship_type: z.ZodString;
            smart_code: z.ZodString;
            relationship_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        }, {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        data?: {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        };
        action_type?: "create_relationship";
        store_as?: string;
    }, {
        data?: {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        };
        action_type?: "create_relationship";
        store_as?: string;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"set_dynamic_field">;
        entity_id: z.ZodString;
        field_name: z.ZodString;
        field_value: z.ZodAny;
        smart_code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        entity_id?: string;
        smart_code?: string;
        action_type?: "set_dynamic_field";
        field_name?: string;
        field_value?: any;
    }, {
        entity_id?: string;
        smart_code?: string;
        action_type?: "set_dynamic_field";
        field_name?: string;
        field_value?: any;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"ui_interaction">;
        selector: z.ZodString;
        interaction: z.ZodEnum<["click", "fill", "select", "upload", "wait"]>;
        value: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value?: string;
        timeout?: number;
        action_type?: "ui_interaction";
        selector?: string;
        interaction?: "fill" | "select" | "click" | "upload" | "wait";
    }, {
        value?: string;
        timeout?: number;
        action_type?: "ui_interaction";
        selector?: string;
        interaction?: "fill" | "select" | "click" | "upload" | "wait";
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"api_call">;
        endpoint: z.ZodString;
        method: z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        data?: Record<string, any>;
        method?: "GET" | "POST" | "PUT" | "DELETE";
        action_type?: "api_call";
        store_as?: string;
        endpoint?: string;
    }, {
        data?: Record<string, any>;
        method?: "GET" | "POST" | "PUT" | "DELETE";
        action_type?: "api_call";
        store_as?: string;
        endpoint?: string;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"wait">;
        duration: z.ZodNumber;
        condition: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        duration?: number;
        action_type?: "wait";
        condition?: string;
    }, {
        duration?: number;
        action_type?: "wait";
        condition?: string;
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
                metadata?: Record<string, any>;
                entity_type?: string;
                entity_name?: string;
                entity_code?: string;
                smart_code?: string;
                dynamic_fields?: Record<string, any>;
            }, {
                metadata?: Record<string, any>;
                entity_type?: string;
                entity_name?: string;
                entity_code?: string;
                smart_code?: string;
                dynamic_fields?: Record<string, any>;
            }>;
            store_as: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            data?: {
                metadata?: Record<string, any>;
                entity_type?: string;
                entity_name?: string;
                entity_code?: string;
                smart_code?: string;
                dynamic_fields?: Record<string, any>;
            };
            action_type?: "create_entity";
            store_as?: string;
        }, {
            data?: {
                metadata?: Record<string, any>;
                entity_type?: string;
                entity_name?: string;
                entity_code?: string;
                smart_code?: string;
                dynamic_fields?: Record<string, any>;
            };
            action_type?: "create_entity";
            store_as?: string;
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
                    metadata?: Record<string, any>;
                    smart_code?: string;
                    line_entity_id?: string;
                    line_number?: number;
                    quantity?: number;
                    unit_price?: number;
                    line_amount?: number;
                }, {
                    metadata?: Record<string, any>;
                    smart_code?: string;
                    line_entity_id?: string;
                    line_number?: number;
                    quantity?: number;
                    unit_price?: number;
                    line_amount?: number;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                currency?: string;
                metadata?: Record<string, any>;
                smart_code?: string;
                transaction_type?: string;
                transaction_code?: string;
                total_amount?: number;
                reference_entity_id?: string;
                line_items?: {
                    metadata?: Record<string, any>;
                    smart_code?: string;
                    line_entity_id?: string;
                    line_number?: number;
                    quantity?: number;
                    unit_price?: number;
                    line_amount?: number;
                }[];
            }, {
                currency?: string;
                metadata?: Record<string, any>;
                smart_code?: string;
                transaction_type?: string;
                transaction_code?: string;
                total_amount?: number;
                reference_entity_id?: string;
                line_items?: {
                    metadata?: Record<string, any>;
                    smart_code?: string;
                    line_entity_id?: string;
                    line_number?: number;
                    quantity?: number;
                    unit_price?: number;
                    line_amount?: number;
                }[];
            }>;
            store_as: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            data?: {
                currency?: string;
                metadata?: Record<string, any>;
                smart_code?: string;
                transaction_type?: string;
                transaction_code?: string;
                total_amount?: number;
                reference_entity_id?: string;
                line_items?: {
                    metadata?: Record<string, any>;
                    smart_code?: string;
                    line_entity_id?: string;
                    line_number?: number;
                    quantity?: number;
                    unit_price?: number;
                    line_amount?: number;
                }[];
            };
            action_type?: "create_transaction";
            store_as?: string;
        }, {
            data?: {
                currency?: string;
                metadata?: Record<string, any>;
                smart_code?: string;
                transaction_type?: string;
                transaction_code?: string;
                total_amount?: number;
                reference_entity_id?: string;
                line_items?: {
                    metadata?: Record<string, any>;
                    smart_code?: string;
                    line_entity_id?: string;
                    line_number?: number;
                    quantity?: number;
                    unit_price?: number;
                    line_amount?: number;
                }[];
            };
            action_type?: "create_transaction";
            store_as?: string;
        }>, z.ZodObject<{
            action_type: z.ZodLiteral<"create_relationship">;
            data: z.ZodObject<{
                from_entity_id: z.ZodString;
                to_entity_id: z.ZodString;
                relationship_type: z.ZodString;
                smart_code: z.ZodString;
                relationship_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                smart_code?: string;
                from_entity_id?: string;
                to_entity_id?: string;
                relationship_type?: string;
                relationship_data?: Record<string, any>;
            }, {
                smart_code?: string;
                from_entity_id?: string;
                to_entity_id?: string;
                relationship_type?: string;
                relationship_data?: Record<string, any>;
            }>;
            store_as: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            data?: {
                smart_code?: string;
                from_entity_id?: string;
                to_entity_id?: string;
                relationship_type?: string;
                relationship_data?: Record<string, any>;
            };
            action_type?: "create_relationship";
            store_as?: string;
        }, {
            data?: {
                smart_code?: string;
                from_entity_id?: string;
                to_entity_id?: string;
                relationship_type?: string;
                relationship_data?: Record<string, any>;
            };
            action_type?: "create_relationship";
            store_as?: string;
        }>, z.ZodObject<{
            action_type: z.ZodLiteral<"set_dynamic_field">;
            entity_id: z.ZodString;
            field_name: z.ZodString;
            field_value: z.ZodAny;
            smart_code: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            entity_id?: string;
            smart_code?: string;
            action_type?: "set_dynamic_field";
            field_name?: string;
            field_value?: any;
        }, {
            entity_id?: string;
            smart_code?: string;
            action_type?: "set_dynamic_field";
            field_name?: string;
            field_value?: any;
        }>, z.ZodObject<{
            action_type: z.ZodLiteral<"ui_interaction">;
            selector: z.ZodString;
            interaction: z.ZodEnum<["click", "fill", "select", "upload", "wait"]>;
            value: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            value?: string;
            timeout?: number;
            action_type?: "ui_interaction";
            selector?: string;
            interaction?: "fill" | "select" | "click" | "upload" | "wait";
        }, {
            value?: string;
            timeout?: number;
            action_type?: "ui_interaction";
            selector?: string;
            interaction?: "fill" | "select" | "click" | "upload" | "wait";
        }>, z.ZodObject<{
            action_type: z.ZodLiteral<"api_call">;
            endpoint: z.ZodString;
            method: z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>;
            data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            store_as: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            data?: Record<string, any>;
            method?: "GET" | "POST" | "PUT" | "DELETE";
            action_type?: "api_call";
            store_as?: string;
            endpoint?: string;
        }, {
            data?: Record<string, any>;
            method?: "GET" | "POST" | "PUT" | "DELETE";
            action_type?: "api_call";
            store_as?: string;
            endpoint?: string;
        }>, z.ZodObject<{
            action_type: z.ZodLiteral<"wait">;
            duration: z.ZodNumber;
            condition: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            duration?: number;
            action_type?: "wait";
            condition?: string;
        }, {
            duration?: number;
            action_type?: "wait";
            condition?: string;
        }>]>, "many">;
        preconditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        postconditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        timeout: z.ZodDefault<z.ZodNumber>;
        retry: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        description?: string;
        timeout?: number;
        persona?: string;
        actions?: ({
            data?: {
                metadata?: Record<string, any>;
                entity_type?: string;
                entity_name?: string;
                entity_code?: string;
                smart_code?: string;
                dynamic_fields?: Record<string, any>;
            };
            action_type?: "create_entity";
            store_as?: string;
        } | {
            data?: {
                currency?: string;
                metadata?: Record<string, any>;
                smart_code?: string;
                transaction_type?: string;
                transaction_code?: string;
                total_amount?: number;
                reference_entity_id?: string;
                line_items?: {
                    metadata?: Record<string, any>;
                    smart_code?: string;
                    line_entity_id?: string;
                    line_number?: number;
                    quantity?: number;
                    unit_price?: number;
                    line_amount?: number;
                }[];
            };
            action_type?: "create_transaction";
            store_as?: string;
        } | {
            data?: {
                smart_code?: string;
                from_entity_id?: string;
                to_entity_id?: string;
                relationship_type?: string;
                relationship_data?: Record<string, any>;
            };
            action_type?: "create_relationship";
            store_as?: string;
        } | {
            entity_id?: string;
            smart_code?: string;
            action_type?: "set_dynamic_field";
            field_name?: string;
            field_value?: any;
        } | {
            value?: string;
            timeout?: number;
            action_type?: "ui_interaction";
            selector?: string;
            interaction?: "fill" | "select" | "click" | "upload" | "wait";
        } | {
            data?: Record<string, any>;
            method?: "GET" | "POST" | "PUT" | "DELETE";
            action_type?: "api_call";
            store_as?: string;
            endpoint?: string;
        } | {
            duration?: number;
            action_type?: "wait";
            condition?: string;
        })[];
        preconditions?: string[];
        postconditions?: string[];
        retry?: number;
    }, {
        id?: string;
        description?: string;
        timeout?: number;
        persona?: string;
        actions?: ({
            data?: {
                metadata?: Record<string, any>;
                entity_type?: string;
                entity_name?: string;
                entity_code?: string;
                smart_code?: string;
                dynamic_fields?: Record<string, any>;
            };
            action_type?: "create_entity";
            store_as?: string;
        } | {
            data?: {
                currency?: string;
                metadata?: Record<string, any>;
                smart_code?: string;
                transaction_type?: string;
                transaction_code?: string;
                total_amount?: number;
                reference_entity_id?: string;
                line_items?: {
                    metadata?: Record<string, any>;
                    smart_code?: string;
                    line_entity_id?: string;
                    line_number?: number;
                    quantity?: number;
                    unit_price?: number;
                    line_amount?: number;
                }[];
            };
            action_type?: "create_transaction";
            store_as?: string;
        } | {
            data?: {
                smart_code?: string;
                from_entity_id?: string;
                to_entity_id?: string;
                relationship_type?: string;
                relationship_data?: Record<string, any>;
            };
            action_type?: "create_relationship";
            store_as?: string;
        } | {
            entity_id?: string;
            smart_code?: string;
            action_type?: "set_dynamic_field";
            field_name?: string;
            field_value?: any;
        } | {
            value?: string;
            timeout?: number;
            action_type?: "ui_interaction";
            selector?: string;
            interaction?: "fill" | "select" | "click" | "upload" | "wait";
        } | {
            data?: Record<string, any>;
            method?: "GET" | "POST" | "PUT" | "DELETE";
            action_type?: "api_call";
            store_as?: string;
            endpoint?: string;
        } | {
            duration?: number;
            action_type?: "wait";
            condition?: string;
        })[];
        preconditions?: string[];
        postconditions?: string[];
        retry?: number;
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
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        }, {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        data?: {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        };
        action_type?: "create_entity";
        store_as?: string;
    }, {
        data?: {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        };
        action_type?: "create_entity";
        store_as?: string;
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
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }, {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        }, {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        data?: {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        };
        action_type?: "create_transaction";
        store_as?: string;
    }, {
        data?: {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        };
        action_type?: "create_transaction";
        store_as?: string;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"create_relationship">;
        data: z.ZodObject<{
            from_entity_id: z.ZodString;
            to_entity_id: z.ZodString;
            relationship_type: z.ZodString;
            smart_code: z.ZodString;
            relationship_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        }, {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        }>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        data?: {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        };
        action_type?: "create_relationship";
        store_as?: string;
    }, {
        data?: {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        };
        action_type?: "create_relationship";
        store_as?: string;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"set_dynamic_field">;
        entity_id: z.ZodString;
        field_name: z.ZodString;
        field_value: z.ZodAny;
        smart_code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        entity_id?: string;
        smart_code?: string;
        action_type?: "set_dynamic_field";
        field_name?: string;
        field_value?: any;
    }, {
        entity_id?: string;
        smart_code?: string;
        action_type?: "set_dynamic_field";
        field_name?: string;
        field_value?: any;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"ui_interaction">;
        selector: z.ZodString;
        interaction: z.ZodEnum<["click", "fill", "select", "upload", "wait"]>;
        value: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value?: string;
        timeout?: number;
        action_type?: "ui_interaction";
        selector?: string;
        interaction?: "fill" | "select" | "click" | "upload" | "wait";
    }, {
        value?: string;
        timeout?: number;
        action_type?: "ui_interaction";
        selector?: string;
        interaction?: "fill" | "select" | "click" | "upload" | "wait";
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"api_call">;
        endpoint: z.ZodString;
        method: z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        store_as: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        data?: Record<string, any>;
        method?: "GET" | "POST" | "PUT" | "DELETE";
        action_type?: "api_call";
        store_as?: string;
        endpoint?: string;
    }, {
        data?: Record<string, any>;
        method?: "GET" | "POST" | "PUT" | "DELETE";
        action_type?: "api_call";
        store_as?: string;
        endpoint?: string;
    }>, z.ZodObject<{
        action_type: z.ZodLiteral<"wait">;
        duration: z.ZodNumber;
        condition: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        duration?: number;
        action_type?: "wait";
        condition?: string;
    }, {
        duration?: number;
        action_type?: "wait";
        condition?: string;
    }>]>, "many">>;
    assertions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"ui">;
        assertions: z.ZodArray<z.ZodObject<{
            selector: z.ZodOptional<z.ZodString>;
            condition: z.ZodEnum<["visible", "hidden", "contains", "not_contains", "enabled", "disabled", "count"]>;
            value: z.ZodOptional<z.ZodAny>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            value?: any;
            timeout?: number;
            selector?: string;
            condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
        }, {
            value?: any;
            timeout?: number;
            selector?: string;
            condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type?: "ui";
        assertions?: {
            value?: any;
            timeout?: number;
            selector?: string;
            condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
        }[];
    }, {
        type?: "ui";
        assertions?: {
            value?: any;
            timeout?: number;
            selector?: string;
            condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
        }[];
    }>, z.ZodObject<{
        type: z.ZodLiteral<"database">;
        assertions: z.ZodArray<z.ZodObject<{
            table: z.ZodEnum<["core_organizations", "core_entities", "core_dynamic_data", "core_relationships", "universal_transactions", "universal_transaction_lines"]>;
            condition: z.ZodEnum<["count", "exists", "not_exists", "equals", "contains"]>;
            filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            expected: z.ZodAny;
        }, "strip", z.ZodTypeAny, {
            table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
            expected?: any;
            condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
            filters?: Record<string, any>;
        }, {
            table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
            expected?: any;
            condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
            filters?: Record<string, any>;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type?: "database";
        assertions?: {
            table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
            expected?: any;
            condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
            filters?: Record<string, any>;
        }[];
    }, {
        type?: "database";
        assertions?: {
            table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
            expected?: any;
            condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
            filters?: Record<string, any>;
        }[];
    }>, z.ZodObject<{
        type: z.ZodLiteral<"business">;
        assertions: z.ZodArray<z.ZodObject<{
            oracle: z.ZodEnum<["accounting_equation", "inventory_balance", "workflow_status", "tax_calculation", "smart_code_validation"]>;
            expected: z.ZodAny;
            tolerance: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            expected?: any;
            oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
            tolerance?: number;
        }, {
            expected?: any;
            oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
            tolerance?: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type?: "business";
        assertions?: {
            expected?: any;
            oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
            tolerance?: number;
        }[];
    }, {
        type?: "business";
        assertions?: {
            expected?: any;
            oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
            tolerance?: number;
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
        priority?: "high" | "low" | "medium" | "critical";
        tags?: string[];
        estimated_duration?: number;
        requires_auth?: boolean;
        requires_data?: boolean;
        browser_support?: ("chromium" | "firefox" | "webkit")[];
        mobile_support?: boolean;
    }, {
        priority?: "high" | "low" | "medium" | "critical";
        tags?: string[];
        estimated_duration?: number;
        requires_auth?: boolean;
        requires_data?: boolean;
        browser_support?: ("chromium" | "firefox" | "webkit")[];
        mobile_support?: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    title?: string;
    metadata?: {
        priority?: "high" | "low" | "medium" | "critical";
        tags?: string[];
        estimated_duration?: number;
        requires_auth?: boolean;
        requires_data?: boolean;
        browser_support?: ("chromium" | "firefox" | "webkit")[];
        mobile_support?: boolean;
    };
    description?: string;
    version?: string;
    industry?: string;
    assertions?: ({
        type?: "ui";
        assertions?: {
            value?: any;
            timeout?: number;
            selector?: string;
            condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
        }[];
    } | {
        type?: "database";
        assertions?: {
            table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
            expected?: any;
            condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
            filters?: Record<string, any>;
        }[];
    } | {
        type?: "business";
        assertions?: {
            expected?: any;
            oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
            tolerance?: number;
        }[];
    })[];
    author?: string;
    context?: {
        currency?: string;
        organization_id?: string;
        tenant?: string;
        timezone?: string;
        locale?: string;
        fiscal_year?: number;
        clock?: string;
        smart_code_prefix?: string;
        industry?: "restaurant" | "healthcare" | "retail" | "salon" | "manufacturing" | "professional_services";
    };
    personas?: Record<string, {
        role?: "hr" | "user" | "owner" | "admin" | "manager" | "accountant" | "warehouse" | "sales";
        organization_id?: string;
        entity_id?: string;
        permissions?: string[];
    }>;
    setup?: ({
        data?: {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        };
        action_type?: "create_entity";
        store_as?: string;
    } | {
        data?: {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        };
        action_type?: "create_transaction";
        store_as?: string;
    } | {
        data?: {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        };
        action_type?: "create_relationship";
        store_as?: string;
    } | {
        entity_id?: string;
        smart_code?: string;
        action_type?: "set_dynamic_field";
        field_name?: string;
        field_value?: any;
    } | {
        value?: string;
        timeout?: number;
        action_type?: "ui_interaction";
        selector?: string;
        interaction?: "fill" | "select" | "click" | "upload" | "wait";
    } | {
        data?: Record<string, any>;
        method?: "GET" | "POST" | "PUT" | "DELETE";
        action_type?: "api_call";
        store_as?: string;
        endpoint?: string;
    } | {
        duration?: number;
        action_type?: "wait";
        condition?: string;
    })[];
    steps?: {
        id?: string;
        description?: string;
        timeout?: number;
        persona?: string;
        actions?: ({
            data?: {
                metadata?: Record<string, any>;
                entity_type?: string;
                entity_name?: string;
                entity_code?: string;
                smart_code?: string;
                dynamic_fields?: Record<string, any>;
            };
            action_type?: "create_entity";
            store_as?: string;
        } | {
            data?: {
                currency?: string;
                metadata?: Record<string, any>;
                smart_code?: string;
                transaction_type?: string;
                transaction_code?: string;
                total_amount?: number;
                reference_entity_id?: string;
                line_items?: {
                    metadata?: Record<string, any>;
                    smart_code?: string;
                    line_entity_id?: string;
                    line_number?: number;
                    quantity?: number;
                    unit_price?: number;
                    line_amount?: number;
                }[];
            };
            action_type?: "create_transaction";
            store_as?: string;
        } | {
            data?: {
                smart_code?: string;
                from_entity_id?: string;
                to_entity_id?: string;
                relationship_type?: string;
                relationship_data?: Record<string, any>;
            };
            action_type?: "create_relationship";
            store_as?: string;
        } | {
            entity_id?: string;
            smart_code?: string;
            action_type?: "set_dynamic_field";
            field_name?: string;
            field_value?: any;
        } | {
            value?: string;
            timeout?: number;
            action_type?: "ui_interaction";
            selector?: string;
            interaction?: "fill" | "select" | "click" | "upload" | "wait";
        } | {
            data?: Record<string, any>;
            method?: "GET" | "POST" | "PUT" | "DELETE";
            action_type?: "api_call";
            store_as?: string;
            endpoint?: string;
        } | {
            duration?: number;
            action_type?: "wait";
            condition?: string;
        })[];
        preconditions?: string[];
        postconditions?: string[];
        retry?: number;
    }[];
    cleanup?: ({
        data?: {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        };
        action_type?: "create_entity";
        store_as?: string;
    } | {
        data?: {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        };
        action_type?: "create_transaction";
        store_as?: string;
    } | {
        data?: {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        };
        action_type?: "create_relationship";
        store_as?: string;
    } | {
        entity_id?: string;
        smart_code?: string;
        action_type?: "set_dynamic_field";
        field_name?: string;
        field_value?: any;
    } | {
        value?: string;
        timeout?: number;
        action_type?: "ui_interaction";
        selector?: string;
        interaction?: "fill" | "select" | "click" | "upload" | "wait";
    } | {
        data?: Record<string, any>;
        method?: "GET" | "POST" | "PUT" | "DELETE";
        action_type?: "api_call";
        store_as?: string;
        endpoint?: string;
    } | {
        duration?: number;
        action_type?: "wait";
        condition?: string;
    })[];
}, {
    id?: string;
    title?: string;
    metadata?: {
        priority?: "high" | "low" | "medium" | "critical";
        tags?: string[];
        estimated_duration?: number;
        requires_auth?: boolean;
        requires_data?: boolean;
        browser_support?: ("chromium" | "firefox" | "webkit")[];
        mobile_support?: boolean;
    };
    description?: string;
    version?: string;
    industry?: string;
    assertions?: ({
        type?: "ui";
        assertions?: {
            value?: any;
            timeout?: number;
            selector?: string;
            condition?: "contains" | "hidden" | "visible" | "disabled" | "not_contains" | "enabled" | "count";
        }[];
    } | {
        type?: "database";
        assertions?: {
            table?: "core_organizations" | "core_entities" | "core_dynamic_data" | "core_relationships" | "universal_transactions" | "universal_transaction_lines";
            expected?: any;
            condition?: "contains" | "count" | "exists" | "not_exists" | "equals";
            filters?: Record<string, any>;
        }[];
    } | {
        type?: "business";
        assertions?: {
            expected?: any;
            oracle?: "accounting_equation" | "inventory_balance" | "workflow_status" | "tax_calculation" | "smart_code_validation";
            tolerance?: number;
        }[];
    })[];
    author?: string;
    context?: {
        currency?: string;
        organization_id?: string;
        tenant?: string;
        timezone?: string;
        locale?: string;
        fiscal_year?: number;
        clock?: string;
        smart_code_prefix?: string;
        industry?: "restaurant" | "healthcare" | "retail" | "salon" | "manufacturing" | "professional_services";
    };
    personas?: Record<string, {
        role?: "hr" | "user" | "owner" | "admin" | "manager" | "accountant" | "warehouse" | "sales";
        organization_id?: string;
        entity_id?: string;
        permissions?: string[];
    }>;
    setup?: ({
        data?: {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        };
        action_type?: "create_entity";
        store_as?: string;
    } | {
        data?: {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        };
        action_type?: "create_transaction";
        store_as?: string;
    } | {
        data?: {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        };
        action_type?: "create_relationship";
        store_as?: string;
    } | {
        entity_id?: string;
        smart_code?: string;
        action_type?: "set_dynamic_field";
        field_name?: string;
        field_value?: any;
    } | {
        value?: string;
        timeout?: number;
        action_type?: "ui_interaction";
        selector?: string;
        interaction?: "fill" | "select" | "click" | "upload" | "wait";
    } | {
        data?: Record<string, any>;
        method?: "GET" | "POST" | "PUT" | "DELETE";
        action_type?: "api_call";
        store_as?: string;
        endpoint?: string;
    } | {
        duration?: number;
        action_type?: "wait";
        condition?: string;
    })[];
    steps?: {
        id?: string;
        description?: string;
        timeout?: number;
        persona?: string;
        actions?: ({
            data?: {
                metadata?: Record<string, any>;
                entity_type?: string;
                entity_name?: string;
                entity_code?: string;
                smart_code?: string;
                dynamic_fields?: Record<string, any>;
            };
            action_type?: "create_entity";
            store_as?: string;
        } | {
            data?: {
                currency?: string;
                metadata?: Record<string, any>;
                smart_code?: string;
                transaction_type?: string;
                transaction_code?: string;
                total_amount?: number;
                reference_entity_id?: string;
                line_items?: {
                    metadata?: Record<string, any>;
                    smart_code?: string;
                    line_entity_id?: string;
                    line_number?: number;
                    quantity?: number;
                    unit_price?: number;
                    line_amount?: number;
                }[];
            };
            action_type?: "create_transaction";
            store_as?: string;
        } | {
            data?: {
                smart_code?: string;
                from_entity_id?: string;
                to_entity_id?: string;
                relationship_type?: string;
                relationship_data?: Record<string, any>;
            };
            action_type?: "create_relationship";
            store_as?: string;
        } | {
            entity_id?: string;
            smart_code?: string;
            action_type?: "set_dynamic_field";
            field_name?: string;
            field_value?: any;
        } | {
            value?: string;
            timeout?: number;
            action_type?: "ui_interaction";
            selector?: string;
            interaction?: "fill" | "select" | "click" | "upload" | "wait";
        } | {
            data?: Record<string, any>;
            method?: "GET" | "POST" | "PUT" | "DELETE";
            action_type?: "api_call";
            store_as?: string;
            endpoint?: string;
        } | {
            duration?: number;
            action_type?: "wait";
            condition?: string;
        })[];
        preconditions?: string[];
        postconditions?: string[];
        retry?: number;
    }[];
    cleanup?: ({
        data?: {
            metadata?: Record<string, any>;
            entity_type?: string;
            entity_name?: string;
            entity_code?: string;
            smart_code?: string;
            dynamic_fields?: Record<string, any>;
        };
        action_type?: "create_entity";
        store_as?: string;
    } | {
        data?: {
            currency?: string;
            metadata?: Record<string, any>;
            smart_code?: string;
            transaction_type?: string;
            transaction_code?: string;
            total_amount?: number;
            reference_entity_id?: string;
            line_items?: {
                metadata?: Record<string, any>;
                smart_code?: string;
                line_entity_id?: string;
                line_number?: number;
                quantity?: number;
                unit_price?: number;
                line_amount?: number;
            }[];
        };
        action_type?: "create_transaction";
        store_as?: string;
    } | {
        data?: {
            smart_code?: string;
            from_entity_id?: string;
            to_entity_id?: string;
            relationship_type?: string;
            relationship_data?: Record<string, any>;
        };
        action_type?: "create_relationship";
        store_as?: string;
    } | {
        entity_id?: string;
        smart_code?: string;
        action_type?: "set_dynamic_field";
        field_name?: string;
        field_value?: any;
    } | {
        value?: string;
        timeout?: number;
        action_type?: "ui_interaction";
        selector?: string;
        interaction?: "fill" | "select" | "click" | "upload" | "wait";
    } | {
        data?: Record<string, any>;
        method?: "GET" | "POST" | "PUT" | "DELETE";
        action_type?: "api_call";
        store_as?: string;
        endpoint?: string;
    } | {
        duration?: number;
        action_type?: "wait";
        condition?: string;
    })[];
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
