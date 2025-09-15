/**
 * HERA ERP Readiness Questionnaire Module
 * Smart Code: HERA.ERP.READINESS.MODULE.INDEX.V1
 *
 * Complete questionnaire system using Sacred Six Tables architecture
 */

// Core types
export type {
  QuestionnaireTemplate,
  QuestionnaireSession,
  Question,
  Section,
  AnswerValue,
  AnswerLine,
  SessionAPI,
  ValidationResult,
  AIInsights,
  AIConfidence,
  Progress,
  SmartCode,
  InputType,
  SessionStatus
} from './types'

// Main components
export { ReadinessWizard } from './ReadinessWizard'
export { ReadinessWizardV2 } from './ReadinessWizardV2'

// Template system
export { createReadinessTemplate } from './template'

// API services
export {
  ReadinessQuestionnaireService,
  ReadinessAIService,
  ReadinessValidationService,
  createReadinessServices
} from './api-service'

// Smart Codes used by the system
export const QUESTIONNAIRE_SMART_CODES = {
  // Templates
  TEMPLATE_QUESTIONNAIRE: 'HERA.ERP.Readiness.Template.Questionnaire.V1',

  // Sections
  SECTION_STANDARD: 'HERA.ERP.Readiness.Section.Standard.V1',

  // Questions
  QUESTION_TEXT: 'HERA.ERP.Readiness.Question.Text.V1',
  QUESTION_TEXTAREA: 'HERA.ERP.Readiness.Question.Textarea.V1',
  QUESTION_SELECT: 'HERA.ERP.Readiness.Question.Select.V1',
  QUESTION_MULTISELECT: 'HERA.ERP.Readiness.Question.Multiselect.V1',
  QUESTION_YESNO: 'HERA.ERP.Readiness.Question.YesNo.V1',
  QUESTION_NUMBER: 'HERA.ERP.Readiness.Question.Number.V1',

  // Sessions & Answers
  SESSION_TRANSACTION: 'HERA.ERP.Readiness.Session.Transaction.V1',
  SESSION_PROGRESS: 'HERA.ERP.Readiness.Session.Progress.V1',
  SESSION_COMPLETE: 'HERA.ERP.Readiness.Session.Complete.V1',
  ANSWER_LINE: 'HERA.ERP.Readiness.Answer.Line.V1',

  // AI Analysis
  AI_ANALYSIS: 'HERA.ERP.Readiness.AI.Analysis.V1',
  AI_INSIGHTS: 'HERA.ERP.Readiness.AI.Insights.V1'
} as const

// Section codes for the questionnaire
export const SECTION_CODES = {
  COMPANY_PROFILE: 'COMPANY_PROFILE',
  SALES: 'SALES',
  PROCUREMENT: 'PROCUREMENT',
  PRODUCTION: 'PRODUCTION',
  INVENTORY: 'INVENTORY',
  PROJECTS: 'PROJECTS',
  FINANCE: 'FINANCE',
  HR_PAYROLL: 'HR_PAYROLL',
  ASSETS: 'ASSETS',
  IT_INFRASTRUCTURE: 'IT_INFRASTRUCTURE',
  AI_AGENTS: 'AI_AGENTS',
  GENERAL_EXPECTATIONS: 'GENERAL_EXPECTATIONS'
} as const

// Validation rules
export const VALIDATION_RULES = {
  MAX_TEXT_LENGTH: 1000,
  MAX_MULTISELECT_OPTIONS: 10,
  MIN_NUMBER_VALUE: 0,
  MAX_SESSION_TIME_HOURS: 24
} as const
