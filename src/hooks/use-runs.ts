import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/lib/api-client';
import { queryKeys } from './query-keys';
import type { 
  RunHeader, 
  TimelineEvent,
  CreateRunRequest,
  SendSignalRequest,
  StepCompleteRequest,
  RunListItem
} from '@/types/runs';
import type { 
  Paginated, 
  ListQueryParams 
} from '@/types/api';
import type { OrgId } from '@/types/common';

// Import the runs api from the client
import { runs } from '@/lib/api-client';

// Query hooks
export function useRunList(params?: ListQueryParams & { orgId?: OrgId }) {
  return useQuery({
    queryKey: queryKeys.runs.list(params?.orgId, params),
    queryFn: () => runs.list(params),
    enabled: !!params?.orgId,
    refetchInterval: (data) => {
      // Poll every 5 seconds if there are any active runs
      const hasActiveRuns = data?.data?.some(run => 
        ['pending', 'running', 'waiting'].includes(run.status)
      );
      return hasActiveRuns ? 5000 : false;
    },
  });
}

export function useRun(runId: string, orgId?: OrgId) {
  return useQuery({
    queryKey: queryKeys.runs.detail(orgId, runId),
    queryFn: () => runs.get(runId, orgId),
    enabled: !!runId && !!orgId,
    refetchInterval: (data) => {
      // Poll every 3 seconds if run is active
      const isActive = data && ['pending', 'running', 'waiting'].includes(data.status);
      return isActive ? 3000 : false;
    },
  });
}

export function useRunTimeline(runId: string, orgId?: OrgId) {
  return useQuery({
    queryKey: queryKeys.runs.timeline(orgId, runId),
    queryFn: async () => {
      // Since timeline is not in the api-client, we'll fetch it directly
      const response = await fetch(`/api/v1/runs/${runId}/timeline`, {
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'x-organization-id': orgId })
        }
      });
      if (!response.ok) throw new Error('Failed to fetch timeline');
      return response.json();
    },
    enabled: !!runId && !!orgId,
    refetchInterval: (data, query) => {
      // Poll every 5 seconds if we don't know run status or run is active
      // We can check if the run query is cached to determine status
      const runQuery = query.queryClient.getQueryData(queryKeys.runs.detail(orgId, runId)) as RunHeader | undefined;
      const isActive = !runQuery || ['pending', 'running', 'waiting'].includes(runQuery.status);
      return isActive ? 5000 : false;
    },
  });
}

// Mutation hooks
export function useStartRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRunRequest & { idempotencyKey?: string }) => {
      const { idempotencyKey = uuidv4(), ...body } = data;
      return runs.create({
        playbook_id: body.playbook_id,
        organization_id: body.organization_id,
        metadata: body.initial_context,
        idempotency_key: idempotencyKey
      });
    },
    onSuccess: (result, variables) => {
      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.runs.lists(),
      });
      
      // Invalidate the specific run detail if we have an ID
      if (result?.id && variables.organization_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.runs.detail(variables.organization_id, result.id),
        });
      }
    },
  });
}

export function useSendSignal(runId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendSignalRequest & { orgId: OrgId }) => {
      const { orgId, ...payload } = data;
      // Since signal is not in the api-client, we'll call it directly
      const response = await fetch(`/api/v1/runs/${runId}/signal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId && { 'x-organization-id': orgId })
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to send signal');
      return response.json();
    },
    onSuccess: (result, variables) => {
      // Invalidate the specific run
      queryClient.invalidateQueries({
        queryKey: queryKeys.runs.detail(variables.orgId, runId),
      });
      
      // Invalidate the timeline
      queryClient.invalidateQueries({
        queryKey: queryKeys.runs.timeline(variables.orgId, runId),
      });
    },
  });
}

export function useCompleteStep(runId: string, sequence: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StepCompleteRequest & { orgId: OrgId; idempotencyKey?: string }) => {
      const { idempotencyKey = uuidv4(), orgId, ...body } = data;
      return runs.completeStep(runId, sequence, body, orgId);
    },
    onSuccess: (result, variables) => {
      // Invalidate the specific run
      queryClient.invalidateQueries({
        queryKey: queryKeys.runs.detail(variables.orgId, runId),
      });
      
      // Invalidate the timeline
      queryClient.invalidateQueries({
        queryKey: queryKeys.runs.timeline(variables.orgId, runId),
      });
    },
  });
}