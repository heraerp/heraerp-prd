import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/state/org';
import type {
  AnalyticsPanelData,
  AnalyticsFilters,
  KPITrend,
  KPI,
  KPIUpdateRequest,
} from '@/types/analytics';

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

// Get analytics panel data
export function useAnalyticsPanels(filters?: AnalyticsFilters) {
  const { currentOrgId } = useOrgStore();
  const orgId = currentOrgId || CIVICFLOW_ORG_ID;

  return useQuery<AnalyticsPanelData>({
    queryKey: ['analytics-panels', orgId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      const response = await fetch(`/api/analytics/panels?${params}`, {
        headers: { 'X-Organization-Id': orgId },
      });
      if (!response.ok) throw new Error('Failed to fetch analytics data');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

// Get specific KPI trend data
export function useKPITrend(kpiId: string | undefined, filters?: AnalyticsFilters) {
  const { currentOrgId } = useOrgStore();
  const orgId = currentOrgId || CIVICFLOW_ORG_ID;

  return useQuery<KPITrend>({
    queryKey: ['kpi-trend', orgId, kpiId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      const response = await fetch(`/api/analytics/kpi/${kpiId}?${params}`, {
        headers: { 'X-Organization-Id': orgId },
      });
      if (!response.ok) throw new Error('Failed to fetch KPI trend');
      return response.json();
    },
    enabled: !!kpiId,
  });
}

// List all KPIs
export function useKPIs() {
  const { currentOrgId } = useOrgStore();
  const orgId = currentOrgId || CIVICFLOW_ORG_ID;

  return useQuery<KPI[]>({
    queryKey: ['kpis', orgId],
    queryFn: async () => {
      const response = await fetch('/api/analytics/kpis', {
        headers: { 'X-Organization-Id': orgId },
      });
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      return response.json();
    },
  });
}

// Update KPI value (used by nightly job)
export function useUpdateKPI() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrgStore();
  const orgId = currentOrgId || CIVICFLOW_ORG_ID;

  return useMutation({
    mutationFn: async (request: KPIUpdateRequest) => {
      // Update KPI entity
      const response = await fetch('/api/v2/universal/entity-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId,
        },
        body: JSON.stringify({
          id: request.kpi_id,
          entity_type: 'kpi',
          organization_id: orgId,
        }),
      });

      if (!response.ok) throw new Error('Failed to update KPI');

      // Update current value in dynamic data
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          entity_id: request.kpi_id,
          field_name: 'current_value',
          field_value_number: request.current_value,
          organization_id: orgId,
        }),
      });

      // Update last updated timestamp
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          entity_id: request.kpi_id,
          field_name: 'last_updated',
          field_value_text: new Date().toISOString(),
          organization_id: orgId,
        }),
      });

      // Store attribution data if provided
      if (request.attribution_data) {
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            entity_id: request.kpi_id,
            field_name: 'latest_attribution',
            field_value_json: request.attribution_data,
            organization_id: orgId,
          }),
        });
      }

      // Emit KPI.UPDATED transaction
      await fetch('/api/v2/universal/txn-emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId,
        },
        body: JSON.stringify({
          smart_code: 'HERA.PUBLICSECTOR.CRM.KPI.UPDATED.v1',
          metadata: {
            kpi_id: request.kpi_id,
            current_value: request.current_value,
            computation_metadata: request.computation_metadata,
            attribution_summary: request.attribution_data,
          },
        }),
      });

      return response.json();
    },
    onSuccess: () => {
      // Invalidate analytics queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['analytics-panels'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-trend'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
    },
  });
}

// Export analytics data
export function useExportAnalytics() {
  const { currentOrgId } = useOrgStore();
  const orgId = currentOrgId || CIVICFLOW_ORG_ID;

  return useMutation({
    mutationFn: async ({ format, filters }: { format: 'csv' | 'pdf' | 'json'; filters?: AnalyticsFilters }) => {
      const params = new URLSearchParams();
      params.append('format', format);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      const response = await fetch(`/api/analytics/export?${params}`, {
        headers: { 'X-Organization-Id': orgId },
      });

      if (!response.ok) throw new Error('Failed to export analytics');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    },
  });
}

// Create KPI entity
export function useCreateKPI() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrgStore();
  const orgId = currentOrgId || CIVICFLOW_ORG_ID;

  return useMutation({
    mutationFn: async (kpiData: Partial<KPI>) => {
      // Create KPI entity
      const response = await fetch('/api/v2/universal/entity-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId,
        },
        body: JSON.stringify({
          entity_type: 'kpi',
          entity_name: kpiData.entity_name,
          entity_code: `KPI-${Date.now()}`,
          smart_code: kpiData.smart_code || `HERA.PUBLICSECTOR.CRM.KPI.${kpiData.entity_name?.toUpperCase().replace(/\s/g, '_')}.v1`,
          organization_id: orgId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create KPI');
      const result = await response.json();
      const kpiId = result.data.id;

      // Store KPI configuration in dynamic data
      const fields = [
        { field_name: 'definition', field_value_json: kpiData.definition },
        { field_name: 'window', field_value_json: kpiData.window },
        { field_name: 'calculation', field_value_json: kpiData.calculation },
        { field_name: 'attribution_rules', field_value_json: kpiData.attribution_rules },
        { field_name: 'target_value', field_value_number: kpiData.target_value },
        { field_name: 'unit', field_value_text: kpiData.unit },
        { field_name: 'direction', field_value_text: kpiData.direction },
      ];

      for (const field of fields) {
        if (field.field_value_json || field.field_value_number !== undefined || field.field_value_text) {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              entity_id: kpiId,
              ...field,
              organization_id: orgId,
            }),
          });
        }
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
    },
  });
}