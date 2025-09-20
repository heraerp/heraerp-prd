export type OrgId = string;
export type UserId = string;
export type EntityId = string;
export type TransactionId = string;
export type SmartCode = string;

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Organization extends BaseEntity {
  name: string;
  subdomain: string;
  industry?: string;
  settings?: Record<string, any>;
}

export interface User extends BaseEntity {
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface EntityWithOrg extends BaseEntity {
  organization_id: OrgId;
}