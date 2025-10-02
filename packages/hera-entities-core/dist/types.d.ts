export type Cardinality = 'one' | 'many';
export type Role = 'owner' | 'manager' | 'grader' | 'staff' | 'receptionist' | 'viewer';
export interface DynamicField {
    name: string;
    type: 'text' | 'number' | 'boolean' | 'date' | 'json';
    smart_code: string;
    required?: boolean;
    defaultValue?: unknown;
    ui?: {
        label?: string;
        placeholder?: string;
        help?: string;
        visible?: boolean | ((role: Role, capabilities?: Record<string, boolean>) => boolean);
        widget?: 'input' | 'textarea' | 'select' | 'currency' | 'percent' | 'date' | 'json';
    };
}
export interface RelationshipDef {
    type: string;
    smart_code: string;
    cardinality: Cardinality;
    target?: string;
}
export interface EntityPreset {
    version: string;
    entity_type: string;
    smart_code: string;
    dynamicFields: DynamicField[];
    relationships?: RelationshipDef[];
    policy?: {
        canCreate?: (role: Role) => boolean;
        canEdit?: (role: Role) => boolean;
        canDelete?: (role: Role) => boolean;
    };
    metadata?: Record<string, unknown>;
}
