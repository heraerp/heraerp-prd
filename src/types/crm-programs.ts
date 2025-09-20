export interface ProgramKpis {
  total_programs: number;
  active_rounds: number;
  avg_budget: number;
  new_this_month: number;
  updated_at: string;
}

export interface ProgramListItem {
  id: string;
  code: string;
  title: string;
  status: 'active' | 'paused' | 'archived';
  sponsor_org_name?: string;
  tags: string[];
  budget?: number;
  rounds_count: number;
  next_window?: {
    open: string;
    close: string;
  };
  smart_code: string;
  created_at: string;
}

export interface ProgramDetail extends ProgramListItem {
  description?: string;
  eligibility_rules?: Record<string, any>;
  sponsor_org_id?: string;
  grant_rounds: GrantRoundLite[];
}

export interface GrantRoundLite {
  id: string;
  round_code: string;
  window_open: string;
  window_close: string;
  budget?: number;
  kpis?: Record<string, any>;
}

export interface CreateProgramRequest {
  code: string;
  title: string;
  description?: string;
  budget?: number;
  tags?: string[];
  sponsor_org_id?: string;
  eligibility_rules?: Record<string, any>;
  status?: 'active' | 'paused' | 'archived';
}

export interface CreateGrantRoundRequest {
  round_code: string;
  window_open: string;
  window_close: string;
  budget?: number;
  kpis?: Record<string, any>;
}

export interface ProgramFilters {
  q?: string;
  status?: ('active' | 'paused' | 'archived')[];
  tags?: string[];
  sponsor_org_id?: string;
  budget_min?: number;
  budget_max?: number;
  page?: number;
  page_size?: number;
}

export interface ExportProgramsRequest {
  filters: ProgramFilters;
  format: 'csv' | 'json';
}

export interface PaginatedPrograms {
  items: ProgramListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}