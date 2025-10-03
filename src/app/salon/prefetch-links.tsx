'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Common routes to prefetch for better performance
const PREFETCH_ROUTES = [
  '/salon/dashboard',
  '/salon/service-categories',
  '/salon/services',
  '/salon/appointments1',
  '/salon/customers',
  '/salon/pos2',
  '/salon/finance',
  '/salon/owner'
]

export function PrefetchLinks() {
  const router = useRouter()

  useEffect(() => {
    // Prefetch common routes after a short delay
    const timer = setTimeout(() => {
      PREFETCH_ROUTES.forEach(route => {
        router.prefetch(route)
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [router])

  return null
}
