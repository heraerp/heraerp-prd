export type Cardinality = 'one' | 'many';

export type Role = 'owner' | 'manager' | 'grader' | 'staff' | 'receptionist' | 'viewer';

export interface DynamicField {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'json';
  smart_code: string; // HERA.<...>.vN
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
  type: string;                // logical name
  smart_code: string;          // HERA.<...>.vN
  cardinality: Cardinality;    // one|many
  target?: string;             // target entity_type (optional, for docs)
}

export interface EntityPreset {
  version: string;             // semantic preset version (library)
  entity_type: string;         // e.g., PRODUCT
  smart_code: string;          // canonical SmartCode for the entity kind
  dynamicFields: DynamicField[];
  relationships?: RelationshipDef[];
  policy?: {
    canCreate?: (role: Role) => boolean;
    canEdit?: (role: Role) => boolean;
    canDelete?: (role: Role) => boolean;
  };
  // free-form metadata for doc generators
  metadata?: Record<string, unknown>;
}