import type { EntityId, OrgId, SmartCode, Timestamps, AIFields } from './common'

// CRM Entity Types
export type CrmEntityType =
  | 'constituent'
  | 'ps_org'
  | 'program'
  | 'grant_round'
  | 'case'
  | 'comm_template'

// CRM Smart Code Families
export type CrmEntitySmartCode =
  | `HERA.PUBLICSECTOR.CRM.ENTITY.CONSTITUENT.v${number}`
  | `HERA.PUBLICSECTOR.CRM.ENTITY.ORG.v${number}`
  | `HERA.PUBLICSECTOR.CRM.ENTITY.PROGRAM.v${number}`
  | `HERA.PUBLICSECTOR.CRM.ENTITY.GRANT_ROUND.v${number}`
  | `HERA.PUBLICSECTOR.CRM.ENTITY.CASE.v${number}`
  | `HERA.PUBLICSECTOR.CRM.ENTITY.COMM_TEMPLATE.v${number}`

export type CrmPlaybookSmartCode =
  | `HERA.PUBLICSECTOR.CRM.PLAYBOOK.DEF.${string}.v${number}`
  | `HERA.PUBLICSECTOR.CRM.PLAYBOOK.STEP.DEF.${string}.${string}.v${number}`
  | `HERA.PUBLICSECTOR.CRM.PLAYBOOK.RUN.${string}.v${number}`
  | `HERA.PUBLICSECTOR.CRM.PLAYBOOK.STEP.EXEC.${string}.v${number}`

export type CrmRelationshipCode =
  | 'HERA.PLAYBOOK.TARGET'
  | 'HERA.PLAYBOOK.HAS_STEP'
  | 'HERA.PLAYBOOK.VERSION_OF'
  | 'HERA.PLAYBOOK.RUN_OF'
  | 'HERA.PLAYBOOK.STEP.EXECUTES'
  | 'HERA.PUBLICSECTOR.CRM.PROGRAM.HAS_GRANT_ROUND'
  | 'HERA.PUBLICSECTOR.CRM.CASE.SUBJECT'
  | 'HERA.PUBLICSECTOR.CRM.ORG.SPONSORS_PROGRAM'

export type CrmSmartCode = SmartCode & (CrmEntitySmartCode | CrmPlaybookSmartCode)

// Entity Type Definitions
interface BaseEntity {
  id: EntityId
  organization_id: OrgId
  entity_type: CrmEntityType
  entity_name: string
  entity_code?: string
  smart_code: CrmSmartCode
  metadata?: Record<string, unknown>
}

export interface Constituent extends BaseEntity, Timestamps, AIFields {
  entity_type: 'constituent'
  smart_code: Extract<CrmEntitySmartCode, `HERA.PUBLICSECTOR.CRM.ENTITY.CONSTITUENT.v${number}`>
}

export interface PsOrg extends BaseEntity, Timestamps, AIFields {
  entity_type: 'ps_org'
  smart_code: Extract<CrmEntitySmartCode, `HERA.PUBLICSECTOR.CRM.ENTITY.ORG.v${number}`>
}

export interface Program extends BaseEntity, Timestamps, AIFields {
  entity_type: 'program'
  smart_code: Extract<CrmEntitySmartCode, `HERA.PUBLICSECTOR.CRM.ENTITY.PROGRAM.v${number}`>
}

export interface GrantRound extends BaseEntity, Timestamps, AIFields {
  entity_type: 'grant_round'
  smart_code: Extract<CrmEntitySmartCode, `HERA.PUBLICSECTOR.CRM.ENTITY.GRANT_ROUND.v${number}`>
}

export interface CaseEntity extends BaseEntity, Timestamps, AIFields {
  entity_type: 'case'
  smart_code: Extract<CrmEntitySmartCode, `HERA.PUBLICSECTOR.CRM.ENTITY.CASE.v${number}`>
}

export interface CommTemplate extends BaseEntity, Timestamps, AIFields {
  entity_type: 'comm_template'
  smart_code: Extract<CrmEntitySmartCode, `HERA.PUBLICSECTOR.CRM.ENTITY.COMM_TEMPLATE.v${number}`>
}

// Dynamic field interfaces (stored in core_dynamic_data)
export interface ConstituentFields {
  name: string
  dob: string
  national_id?: string
  address?: string
  email?: string
  phone?: string
  eligibility_flags?: string[]
  risk_score?: number
}

export interface PsOrgFields {
  legal_name: string
  registration_no: string
  sector: string
  address?: string
  contacts?: Array<{
    name: string
    role: string
    email?: string
    phone?: string
  }>
}

export interface ProgramFields {
  code: string
  title: string
  description?: string
  eligibility_rules?: Record<string, unknown>
  budget?: number
}

export interface GrantRoundFields {
  program_code: string
  round_code: string
  window_open: string
  window_close: string
  kpis?: Record<string, unknown>
}

export interface CaseFields {
  subject_entity_id: EntityId
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  sla_seconds: number
  current_status?: string
}

export interface CommTemplateFields {
  channel: 'email' | 'sms' | 'letter'
  subject?: string
  body: string
  placeholders?: string[]
}
