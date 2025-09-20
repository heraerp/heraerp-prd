import type { OrgId, EntityId, SmartCode, Timestamps, AIFields } from '@/types/common';

export type OrgType = 'Partner' | 'Funder' | 'Investee' | 'Government';
export type EngagementStage = 'Exploration' | 'Co-design' | 'Approval' | 'Deployment' | 'Monitoring';

export interface OrganizationEntity extends Timestamps, AIFields {
  readonly id: EntityId;
  readonly organization_id: OrgId;         // tenant boundary
  readonly name: string;
  readonly smart_code: SmartCode;          // e.g., HERA.CRM.ORGS.ENTITY.ORGANIZATION.v1
  // dynamic_data snapshot used in UI
  readonly data?: {
    readonly type?: OrgType;
    readonly legal_name?: string;
    readonly reg_no?: string;
    readonly address?: string;
    readonly tags?: readonly string[];
    readonly imd_decile?: number;
    readonly impact_kpis?: Record<string, unknown>;
    readonly engagement_stage?: EngagementStage;
    readonly relationship_manager_user_id?: string;
  };
}

export interface ContactEntity extends Timestamps, AIFields {
  readonly id: EntityId;
  readonly organization_id: OrgId;
  readonly name: string;                    // "First Last"
  readonly smart_code: SmartCode;           // HERA.CRM.CONTACTS.ENTITY.PERSON.v1
  readonly data?: {
    readonly email?: string;
    readonly phone?: string;
    readonly role?: string;
    readonly org_entity_id?: EntityId;      // back-link to Organization
    readonly tags?: readonly string[];
  };
}

export interface RelationshipLink {
  readonly from_entity_id: EntityId;
  readonly to_entity_id: EntityId;
  readonly smart_code: SmartCode;           // e.g., HERA.CRM.REL.REL_MANAGER.v1
  readonly note?: string;
}

export type ActivityType = 'email' | 'call' | 'meeting' | 'note';

export interface ActivityLog {
  readonly type: ActivityType;
  readonly occurred_at: string;             // ISO
  readonly subject?: string;
  readonly body?: string;
  readonly participants?: readonly string[];
}