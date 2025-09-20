import type { OrgId } from '@/types/common'
import type { ListQueryParams } from '@/types/api'

export const queryKeys = {
  runs: {
    lists: () => ['runs'] as const,
    list: (orgId?: OrgId, params?: ListQueryParams) => ['runs', 'list', orgId, params] as const,
    detail: (orgId?: OrgId, runId?: string) => ['runs', 'detail', orgId, runId] as const,
    timeline: (orgId?: OrgId, runId?: string) => ['runs', 'timeline', orgId, runId] as const
  },
  playbooks: {
    lists: () => ['playbooks'] as const,
    list: (orgId?: OrgId, params?: ListQueryParams) =>
      ['playbooks', 'list', orgId, params] as const,
    detail: (orgId?: OrgId, id?: string) => ['playbooks', 'detail', orgId, id] as const,
    versions: (orgId?: OrgId, id?: string) => ['playbooks', 'versions', orgId, id] as const
  },
  organizations: {
    lists: () => ['organizations'] as const,
    list: (params?: ListQueryParams) => ['organizations', 'list', params] as const,
    detail: (id?: string) => ['organizations', 'detail', id] as const,
    current: () => ['organizations', 'current'] as const
  },
  auth: {
    session: () => ['auth', 'session'] as const,
    user: () => ['auth', 'user'] as const
  }
}
