export interface RunHeader {
  id: string;
  playbook_name: string;
  playbook_version: string;
  organization_id: string;
  status: 'pending' | 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string | null;
  step_count?: number;
  progress_percentage?: number;
  actual_duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface RunListItem extends RunHeader {
  subject_entity_name?: string;
  subject_entity_type?: string;
}

export interface TimelineEvent {
  id: string;
  run_id: string;
  event_type: 'run_started' | 'step_started' | 'step_completed' | 'step_failed' | 'run_completed' | 'run_failed' | 'signal_received';
  sequence: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CreateRunRequest {
  playbook_id: string;
  organization_id: string;
  initial_context?: Record<string, any>;
  dry_run?: boolean;
}

export interface SendSignalRequest {
  signal_type: string;
  signal_data?: Record<string, any>;
}

export interface StepCompleteRequest {
  outcome: 'success' | 'failure' | 'skipped';
  output_data?: Record<string, any>;
  error_message?: string;
}

export interface StepExecUpdate {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress_percentage?: number;
  metadata?: Record<string, any>;
}