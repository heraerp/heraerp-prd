/**
 * Factory Dashboard API Client
 * Interfaces with Universal API respecting Six Sacred Tables
 */

import type { 
  UniversalTransaction, 
  UniversalTransactionLine, 
  ModuleEntity, 
  RelationshipRow,
  FiscalPeriod,
  OrgId 
} from '../types/factory';

export interface ApiConfig {
  baseUrl: string;
  token?: string;
}

export interface WaiverPayload {
  transaction_id: string;
  policy: string;
  reason: string;
  approved_by?: string;
}

export interface DashboardFilters {
  organization_id: OrgId;
  from_date?: string;
  to_date?: string;
  module_smart_code?: string;
  channel?: string;
  transaction_status?: string;
}

export class FactoryDashboardClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.config.token ? `Bearer ${this.config.token}` : '',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getTransactions(
    orgId: OrgId,
    from: string,
    to: string,
    filters?: Partial<DashboardFilters>
  ): Promise<UniversalTransaction[]> {
    const params = new URLSearchParams({
      organization_id: orgId,
      from_date: from,
      to_date: to,
      transaction_type_prefix: 'FACTORY.',
      ...filters,
    });

    const response = await this.fetch<{ data: UniversalTransaction[] }>(
      `/api/v1/universal?action=read&table=universal_transactions&${params}`
    );

    return response.data;
  }

  async getTransactionLines(
    orgId: OrgId,
    txnId: string
  ): Promise<UniversalTransactionLine[]> {
    const params = new URLSearchParams({
      organization_id: orgId,
      transaction_id: txnId,
    });

    const response = await this.fetch<{ data: UniversalTransactionLine[] }>(
      `/api/v1/universal?action=read&table=universal_transaction_lines&${params}`
    );

    return response.data;
  }

  async getModules(orgId: OrgId): Promise<ModuleEntity[]> {
    const params = new URLSearchParams({
      organization_id: orgId,
      entity_type: 'module',
    });

    const response = await this.fetch<{ data: ModuleEntity[] }>(
      `/api/v1/universal?action=read&table=core_entities&${params}`
    );

    return response.data;
  }

  async getRelationships(orgId: OrgId): Promise<RelationshipRow[]> {
    const params = new URLSearchParams({
      organization_id: orgId,
      relationship_type: 'DEPENDS_ON',
    });

    const response = await this.fetch<{ data: RelationshipRow[] }>(
      `/api/v1/universal?action=read&table=core_relationships&${params}`
    );

    return response.data;
  }

  async getFiscalPeriods(orgId: OrgId): Promise<FiscalPeriod[]> {
    const params = new URLSearchParams({
      organization_id: orgId,
      entity_type: 'fiscal_period',
    });

    const response = await this.fetch<{ data: FiscalPeriod[] }>(
      `/api/v1/universal?action=read&table=core_entities&${params}`
    );

    return response.data.filter(e => 
      e.metadata?.status === 'open' || 
      e.metadata?.status === 'current' || 
      e.metadata?.status === 'closed'
    );
  }

  async postWaiver(orgId: OrgId, payload: WaiverPayload): Promise<{ ok: boolean }> {
    const waiverLine: Partial<UniversalTransactionLine> = {
      transaction_id: payload.transaction_id,
      organization_id: orgId,
      line_type: 'WAIVER',
      smart_code: 'HERA.UNIVERSAL.FACTORY.WAIVER.v1_0',
      line_data: {
        policy: payload.policy,
        reason: payload.reason,
        approved_by: payload.approved_by || 'system',
        waived_at: new Date().toISOString(),
      },
    };

    const response = await this.fetch<{ success: boolean }>(
      '/api/v1/universal',
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          table: 'universal_transaction_lines',
          data: waiverLine,
        }),
      }
    );

    return { ok: response.success };
  }

  async getAllTransactionLines(
    orgId: OrgId,
    txnIds: string[]
  ): Promise<UniversalTransactionLine[]> {
    if (!txnIds.length) return [];

    const allLines: UniversalTransactionLine[] = [];
    
    // Batch fetch in chunks of 10 to avoid URL length limits
    const chunks = [];
    for (let i = 0; i < txnIds.length; i += 10) {
      chunks.push(txnIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const params = new URLSearchParams({
        organization_id: orgId,
        transaction_ids: chunk.join(','),
      });

      const response = await this.fetch<{ data: UniversalTransactionLine[] }>(
        `/api/v1/universal?action=read&table=universal_transaction_lines&${params}`
      );

      allLines.push(...response.data);
    }

    return allLines;
  }
}

export const createClient = (config: ApiConfig) => new FactoryDashboardClient(config);