// src/ui/theme/useThemeApi.ts
'use client'

export function useThemeApi() {
  return {
    get: async (orgId: string) =>
      fetch(`/api/ucr/theme?org_id=${orgId}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(j => j.data ?? null),

    save: async (orgId: string, theme: any) =>
      fetch('/api/ucr/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-hera-org': orgId },
        body: JSON.stringify({ theme })
      })
        .then(r => r.json())
        .then(j => j.success === true)
  }
}
