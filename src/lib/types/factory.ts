/**
 * HERA Factory Dashboard Types
 * Strict adherence to Six Sacred Tables
 */

export type OrgId = string;
export type SmartCode = string;
export type Channel = 'beta' | 'stable' | 'LTS';

export interface UniversalTransaction {
  id: string;
  organization_id: OrgId;
  transaction_type: string; // FACTORY.*
  smart_code: SmartCode;    // module smart code
  transaction_date: string;
  transaction_status: 'pending' | 'running' | 'passed' | 'failed' | 'blocked';
  ai_confidence?: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface UniversalTransactionLine {
  id: string;
  transaction_id: string;
  organization_id: OrgId;
  line_number: number;
  line_type: string; // STEP.* or WAIVER
  smart_code: SmartCode;
  line_data?: Record<string, unknown>;
  ai_confidence?: number;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

export interface ModuleEntity {
  id: string;
  organization_id: OrgId;
  entity_type: 'module';
  entity_name: string;
  smart_code: SmartCode;
  version?: number;
  metadata?: {
    release_channels?: Channel[];
    latest_version?: string;
    released_at?: string;
    industry?: string;
    description?: string;
  };
}

export interface RelationshipRow {
  id: string;
  organization_id: OrgId;
  from_entity_id: string;
  to_entity_id: string;
  relationship_type: 'DEPENDS_ON' | 'GOVERNS' | 'PACKAGED_AS' | 'VALIDATED_BY';
  metadata?: Record<string, unknown>;
}

export interface KPISet {
  leadTimeDays: number;
  coverageAvg: number;
  guardrailPassRate: number;
  auditReady: boolean;
  fiscalAligned: boolean;
}

export interface FiscalPeriod {
  id: string;
  organization_id: OrgId;
  entity_type: 'fiscal_period';
  entity_code: string;
  metadata: {
    status: 'open' | 'current' | 'closed';
    period_start: string;
    period_end: string;
    fiscal_year: number;
  };
}

export interface Artifact {
  coverage?: string;
  sbom?: string;
  trace?: string;
  report?: string;
  junit?: string;
  screenshots?: string;
}

export interface GuardrailResult {
  severity: 'error' | 'warn' | 'info';
  message: string;
  policy: string;
  canWaive: boolean;
}