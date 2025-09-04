/**
 * HERA ERP Readiness Questionnaire Types
 * Smart Code: HERA.ERP.READINESS.TYPES.DEFINITION.V1
 * 
 * TypeScript contracts for the questionnaire system using Sacred Six Tables
 */

// Smart Code & Base Types
export type SmartCode = `HERA.${string}.${string}.${string}.${string}.V${number}`;

export type InputType = 'text' | 'textarea' | 'select' | 'multiselect' | 'yesno' | 'number' | 'date';

export interface QuestionOption {
  code: string;           // stable code (e.g., "PROCUREMENT_TENDER")
  label: string;          // human readable
  description?: string;
}

export interface Question {
  id: string;
  organization_id: string;
  smart_code: SmartCode;  // e.g., HERA.ERP.Readiness.Question.YesNo.V1
  section_code: string;   // e.g., "SALES", "PROCUREMENT"
  prompt: string;
  help_text?: string;
  input_type: InputType;
  options?: QuestionOption[];
  required?: boolean;
  display_order: number;
  kpi_tags?: string[];    // e.g., ["profitability","compliance"]
}

export interface Section {
  code: string;           // stable, e.g., "COMPANY_PROFILE"
  title: string;
  description?: string;
  display_order: number;
  questions: Question[];
  smart_code: SmartCode;  // HERA.ERP.Readiness.Section.Standard.V1
}

export interface QuestionnaireTemplate {
  id: string;
  organization_id: string;
  title: string;
  version: number;
  smart_code: SmartCode;  // HERA.ERP.Readiness.Template.Questionnaire.V1
  sections: Section[];
}

export type AnswerValue =
  | string
  | number
  | boolean
  | string[]
  | { dateISO: string }
  | { [k: string]: unknown }; // future-proof

export interface AnswerLine {
  question_id: string;
  sequence: number;
  response_value: AnswerValue;
  response_text?: string;
  attachments?: { name: string; url: string }[];
  smart_code: SmartCode;  // HERA.ERP.Readiness.Answer.Line.V1
}

export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface QuestionnaireSession {
  id: string;
  organization_id: string;
  respondent_id: string;
  template_id: string;
  status: SessionStatus;
  started_at: string;     // ISO
  completed_at?: string;  // ISO
  current_index: number;  // 0-based pointer into flattened question list
  ai_insights?: Record<string, unknown>;
  ai_confidence?: Record<string, number>;
  smart_code: SmartCode;  // HERA.ERP.Readiness.Session.Transaction.V1
  answers: AnswerLine[];
}

export interface Progress {
  current: number; // answered
  total: number;   // total questions
  percent: number; // 0-100
}

// AI Insights Types
export interface AIInsights {
  section_summaries?: Record<string, {
    readiness_score: number;  // 0-100
    key_gaps: string[];
    recommendations: string[];
  }>;
  overall_readiness?: number; // 0-100
  risk_flags?: {
    credit?: boolean;
    compliance?: boolean;
    operational?: boolean;
  };
  integration_suggestions?: {
    whatsapp?: boolean;
    accounting_system?: boolean;
    crm?: boolean;
  };
  top_priorities?: string[];
}

export interface AIConfidence {
  overall: number;         // 0-1
  section: Record<string, number>; // section_code -> confidence 0-1
}

// API Contract Types
export interface CreateSessionRequest {
  organization_id: string;
  template_id: string;
  respondent_id: string;
  smart_code: SmartCode;
}

export interface SaveAnswerRequest {
  question_id: string;
  sequence: number;
  response_value: AnswerValue;
  response_text?: string;
  attachments?: { name: string; url: string }[];
}

export interface SessionAPI {
  saveAnswer: (line: AnswerLine) => Promise<void>;
  next: () => Promise<QuestionnaireSession>;
  prev: () => Promise<QuestionnaireSession>;
  complete: () => Promise<QuestionnaireSession>;
}

// Component Props
export interface ReadinessWizardProps {
  template: QuestionnaireTemplate;
  session: QuestionnaireSession;
  api: SessionAPI;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Export Types
export interface ExportRequest {
  session_id: string;
  format: 'csv' | 'json' | 'pdf';
  include_ai_insights?: boolean;
}

export interface ExportResult {
  download_url: string;
  expires_at: string;
  file_size: number;
}