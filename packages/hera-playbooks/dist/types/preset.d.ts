/**
 * HERA Entity Preset Type Definitions
 */
export type FieldType = 'text' | 'number' | 'date' | 'json' | 'boolean';
export interface DynamicFieldDefinition {
    name: string;
    type: FieldType;
    required?: boolean;
    smart_code: string;
    ui?: {
        widget?: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'currency' | 'badge' | 'markdown';
        options?: string[];
        visible?: (role: string) => boolean;
    };
}
export interface RelationshipDefinition {
    type: string;
    smart_code: string;
    cardinality: 'one' | 'many';
}
export interface EntityPreset {
    entityType: string;
    smartCode: string;
    label: string;
    dynamicFields: DynamicFieldDefinition[];
    relationships?: RelationshipDefinition[];
}
