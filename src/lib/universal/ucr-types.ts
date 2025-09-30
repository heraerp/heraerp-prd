// src/lib/universal/ucr-types.ts
// UCR Bundle Type Definitions - The DNA blueprints for self-assembling validation

export type UCRBundle = {
  code: string;           // Smart Code
  kind: 'entity' | 'transaction' | 'relationship' | 'playbook';
  version: string;        // e.g., 'v1'
  
  metadata: {
    title: string;
    description?: string;
    author?: string;
    tags?: string[];
  };
  
  // Validation & transformation rules
  rules?: {
    fields: Record<string, FieldRule>;
    line_fields?: Record<string, FieldRule>;  // For transactions
    
    // Conditional requirements
    requires?: Array<{
      when: string;    // Predicate expression
      then: string;    // What becomes required
    }>;
    
    // Data transformations
    transforms?: Array<TransformRule>;
    
    // Domain enumeration sources
    lookups?: Record<string, StaticLookup | QueryLookup>;
    
    // Finance DNA & posting logic (transactions only)
    posting?: PostingRules;
  };
  
  // Procedures - atomic unit of work
  procedures?: Array<ProcedureStep>;
  
  // Playbook - multi-step orchestration
  playbook?: {
    steps: Array<ProcedureStep | ConditionalStep>;
    idempotency_key?: string;  // Expression
  };
};

export type FieldRule = {
  type: 'text' | 'number' | 'boolean' | 'date' | 'json';
  required?: boolean | string;  // Boolean or predicate
  min?: number; 
  max?: number;
  length?: { min?: number; max?: number };
  regex?: string;
  enum?: string[];
  default?: unknown | { expr: string };
  derive?: { expr: string; overwrite?: boolean };
  unique?: boolean;
  lookup?: string;
  format?: 'email' | 'uuid' | 'phone' | 'iso-date' | 'iso-datetime' | 'currency-3';
  description?: string;
};

export type TransformRule =
  | { op: 'trim'; fields: string[] }
  | { op: 'uppercase'; fields: string[] }
  | { op: 'lowercase'; fields: string[] }
  | { op: 'compute'; out: string; expr: string }
  | { op: 'rename'; from: string; to: string };

export type StaticLookup = { 
  kind: 'static'; 
  values: Array<{ value: string; label?: string }> 
};

export type QueryLookup = { 
  kind: 'query'; 
  rpc: string; 
  params?: Record<string, unknown> 
};

export type PostingRules = {
  currency: {
    require_base?: boolean;
    allow_exchange_rate?: boolean;
  };
  lines: Array<{
    match: { line_type: string };
    derive: {
      line_amount?: string;
      account_id?: string;
      polarity?: 'debit' | 'credit' | { expr: string };
    };
    validate?: string[];
  }>;
  require_balanced?: boolean;
};

export type ProcedureStep = {
  name: string;
  fn: string;  // RPC function name
  params: 'payload' | Record<string, unknown> | { expr: string };
  on_error?: 'stop' | 'continue' | { goto: string };
};

export type ConditionalStep = {
  if: string;
  then: Array<ProcedureStep>;
  else?: Array<ProcedureStep>;
};