'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orgApi } from '@/lib/api-client'
import type {
  OrganizationEntity,
  ContactEntity,
  RelationshipLink,
  ActivityLog
} from '@/types/organizations'

export const orgKeys = {
  all: ['organizations'] as const,
  list: (filters: Record<string, unknown>) => [...orgKeys.all, 'list', filters] as const,
  detail: (id: string) => [...orgKeys.all, 'detail', id] as const,
  contacts: (orgEntityId: string) => [...orgKeys.all, 'contacts', orgEntityId] as const
}

export function useOrganizationList(filters: {
  q?: string
  type?: string
  stage?: string
  rm?: string
  tag?: string
  limit?: number
  orgId?: string
}) {
  return useQuery({
    queryKey: orgKeys.list(filters),
    queryFn: () => orgApi.listOrganizations(filters),
    select: res => res.items as OrganizationEntity[],
    retry: 3
  })
}

export function useOrganization(id: string, orgId?: string) {
  return useQuery({
    queryKey: orgKeys.detail(id),
    queryFn: () => orgApi.getOrganization(id, orgId),
    enabled: !!id
  })
}

export function useContacts(orgEntityId: string, orgId?: string) {
  return useQuery({
    queryKey: orgKeys.contacts(orgEntityId),
    queryFn: () => orgApi.listContacts(orgEntityId, orgId),
    select: res => res.items as ContactEntity[],
    enabled: !!orgEntityId
  })
}

export function useCreateOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: orgApi.createOrganization,
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.all })
  })
}

export function useUpdateOrganization(id: string, orgId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<OrganizationEntity>) =>
      orgApi.updateOrganization(id, patch, orgId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.detail(id) })
      qc.invalidateQueries({ queryKey: orgKeys.all })
    }
  })
}

export function useCreateContact(orgEntityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: orgApi.createContact,
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.contacts(orgEntityId) })
  })
}

export function useLinkRelationship(orgId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rel: RelationshipLink) => orgApi.linkRelationship(rel, orgId),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.all })
  })
}

export function useLogActivity(id: string, orgId: string) {
  return useMutation({
    mutationFn: (activity: ActivityLog) => orgApi.logActivity(orgId, id, activity)
  })
}
