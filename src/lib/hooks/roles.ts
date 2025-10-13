"use client"

import { useEffect, useState } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export function useRoles() {
  const auth = useHERAAuth()
  const [roles, setRoles] = useState<string[]>([])

  useEffect(() => {
    const useMock = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_HERA_MOCK === '1'
    if (useMock) {
      try {
        const raw = localStorage.getItem('matrixRoles')
        const parsed = raw ? (JSON.parse(raw) as string[]) : ['owner']
        setRoles(Array.isArray(parsed) ? parsed : ['owner'])
        return
      } catch {
        setRoles(['owner'])
        return
      }
    }
    // live/auth driven
    const r = (auth?.roles || auth?.userRoles || []) as string[]
    setRoles(r)
  }, [auth?.roles, auth?.userRoles])

  return roles
}

