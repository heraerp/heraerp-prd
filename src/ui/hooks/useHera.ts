// src/ui/hooks/useHera.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHeraContext } from '../HeraProvider';

const orgHeader = (orgId: string) => ({ 'x-hera-org': orgId });

const qs = (o: Record<string, any>) =>
  new URLSearchParams(Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as any).toString();

export function useEntities(filters: Record<string, any> = {}) {
  const { orgId, apiBase } = useHeraContext();
  return useQuery({
    queryKey: ['entities', orgId, filters],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/entities?${qs(filters)}`, {
        headers: orgHeader(orgId),
      });
      if (!res.ok) throw new Error('Failed to load entities');
      return res.json();
    },
    staleTime: 5 * 60_000,
  });
}

export function useEntity(id: string) {
  const { orgId, apiBase } = useHeraContext();
  return useQuery({
    queryKey: ['entity', orgId, id],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/entities/${id}`, { headers: orgHeader(orgId) });
      if (!res.ok) throw new Error('Failed to load entity');
      return res.json();
    },
  });
}

export function useDynamicData(entityId: string) {
  const { orgId, apiBase } = useHeraContext();
  return useQuery({
    queryKey: ['dyn', orgId, entityId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/entities/${entityId}/dynamic-data`, {
        headers: orgHeader(orgId),
      });
      if (!res.ok) throw new Error('Failed to load dynamic data');
      return res.json();
    },
  });
}

export function useTransactions(filters: Record<string, any> = {}) {
  const { orgId, apiBase } = useHeraContext();
  return useQuery({
    queryKey: ['txns', orgId, filters],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/transactions?${qs(filters)}`, {
        headers: orgHeader(orgId),
      });
      if (!res.ok) throw new Error('Failed to load transactions');
      return res.json();
    },
  });
}

export function useTransaction(id: string, includeLines = true) {
  const { orgId, apiBase } = useHeraContext();
  return useQuery({
    queryKey: ['txn', orgId, id, includeLines],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/transactions/${id}?include_lines=${includeLines}`, {
        headers: orgHeader(orgId),
      });
      if (!res.ok) throw new Error('Failed to load transaction');
      return res.json();
    },
  });
}

export function useCreateTransaction() {
  const { orgId, apiBase } = useHeraContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(`${apiBase}/transactions`, {
        method: 'POST',
        headers: { ...orgHeader(orgId), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Create txn failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['txns', orgId] }),
  });
}

export function useRelationships(params: Record<string, any>) {
  const { orgId, apiBase } = useHeraContext();
  return useQuery({
    queryKey: ['rels', orgId, params],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/relationships?${qs(params)}`, {
        headers: orgHeader(orgId),
      });
      if (!res.ok) throw new Error('Failed to load relationships');
      return res.json();
    },
  });
}

// Entity mutations
export function useCreateEntity() {
  const { orgId, apiBase } = useHeraContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(`${apiBase}/entities`, {
        method: 'POST',
        headers: { ...orgHeader(orgId), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Create entity failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entities', orgId] }),
  });
}

export function useUpdateEntity() {
  const { orgId, apiBase } = useHeraContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await fetch(`${apiBase}/entities/${id}`, {
        method: 'PUT',
        headers: { ...orgHeader(orgId), 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Update entity failed');
      return res.json();
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['entities', orgId] });
      qc.invalidateQueries({ queryKey: ['entity', orgId, id] });
    },
  });
}

export function useDeleteEntity() {
  const { orgId, apiBase } = useHeraContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiBase}/entities/${id}`, {
        method: 'DELETE',
        headers: orgHeader(orgId),
      });
      if (!res.ok) throw new Error('Delete entity failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entities', orgId] }),
  });
}

// Dynamic fields
export function useDynamicFields(entityId: string) {
  const { orgId, apiBase } = useHeraContext();
  return useQuery({
    queryKey: ['dynamic-fields', orgId, entityId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/entities/${entityId}/dynamic-data`, {
        headers: orgHeader(orgId),
      });
      if (!res.ok) throw new Error('Failed to load dynamic fields');
      return res.json();
    },
    enabled: !!entityId,
  });
}

export function useSetDynamicField() {
  const { orgId, apiBase } = useHeraContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entityId, fieldName, value, smartCode }: {
      entityId: string;
      fieldName: string;
      value: any;
      smartCode?: string;
    }) => {
      const res = await fetch(`${apiBase}/entities/${entityId}/dynamic-data`, {
        method: 'POST',
        headers: { ...orgHeader(orgId), 'Content-Type': 'application/json' },
        body: JSON.stringify({ field_name: fieldName, value, smart_code: smartCode }),
      });
      if (!res.ok) throw new Error('Set dynamic field failed');
      return res.json();
    },
    onSuccess: (_, { entityId }) => {
      qc.invalidateQueries({ queryKey: ['dynamic-fields', orgId, entityId] });
      qc.invalidateQueries({ queryKey: ['dyn', orgId, entityId] });
    },
  });
}