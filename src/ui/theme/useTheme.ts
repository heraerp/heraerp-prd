// src/ui/theme/useTheme.ts
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useThemeApi } from './useThemeApi'
import { defaultTheme, ThemeTokens } from './types'

export function useTheme(orgId: string) {
  const api = useThemeApi()
  const qc = useQueryClient()

  const query = useQuery<ThemeTokens | null>({
    queryKey: ['hera-theme', orgId],
    queryFn: () => api.get(orgId),
    staleTime: 5 * 60 * 1000
  })

  const mutation = useMutation({
    mutationFn: (next: ThemeTokens) => api.save(orgId, next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hera-theme', orgId] })
  })

  return {
    theme: query.data || defaultTheme,
    isLoading: query.isLoading,
    saveTheme: (t: ThemeTokens) => mutation.mutateAsync(t),
    isSaving: mutation.isPending
  }
}
