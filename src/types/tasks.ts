import type { OrgId } from './common';

export interface TaskItem {
  id: string;
  run_id: string;
  sequence: number;
  step_name: string;
  subject_entity_id: string;
  organization_id: OrgId;
  due_at?: string;
  metadata?: Record<string, unknown>;
}

export interface StepSchemaResult {
  output_contract?: Record<string, unknown>;
  input_contract?: Record<string, unknown>;
  step_definition?: {
    name: string;
    worker_type: string;
    action: string;
    params?: Record<string, unknown>;
  };
}