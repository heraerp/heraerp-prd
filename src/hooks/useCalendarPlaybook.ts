'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  searchAppointments,
  searchStaff,
  searchServices,
  searchCustomers
} from '@/lib/playbook/entities'

type Params = {
  organization_id: string
  branch_id?: string
  fromISO: string
  toISO: string
  q?: string
}

export function useCalendarPlaybook({ organization_id, branch_id, fromISO, toISO, q }: Params) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])

  useEffect(() => {
    // Skip if no organization ID
    if (!organization_id) {
      setLoading(false)
      return
    }

    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        // batched Playbook calls (these are all org-scoped and use Universal API v2 under the hood)
        const [appt, stf, svc, cst] = await Promise.all([
          searchAppointments({
            organization_id,
            branch_id,
            date_from: fromISO,
            date_to: toISO,
            q,
            page: 1,
            page_size: 500
          }),
          searchStaff({ organization_id, branch_id, page: 1, page_size: 500 }),
          searchServices({ organization_id, branch_id, page: 1, page_size: 500 }),
          q
            ? searchCustomers({ organization_id, q, page: 1, page_size: 50 })
            : Promise.resolve({ rows: [] })
        ])
        if (!alive) return

        // Defensive checks to ensure data is in expected format
        setAppointments(Array.isArray(appt?.rows) ? appt.rows : [])
        setStaff(Array.isArray(stf?.rows) ? stf.rows : [])
        setServices(Array.isArray(svc?.rows) ? svc.rows : [])
        setCustomers(Array.isArray(cst?.rows) ? cst.rows : [])
        setError(null)
      } catch (e: any) {
        if (!alive) return
        console.error('Calendar playbook error:', e)
        setError(e)
        // Reset to empty arrays on error
        setAppointments([])
        setStaff([])
        setServices([])
        setCustomers([])
      } finally {
        alive && setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [organization_id, branch_id, fromISO, toISO, q])

  // quick lookups with defensive checks
  const staffById = useMemo(() => {
    if (!Array.isArray(staff)) return new Map()
    return new Map(staff.map(s => [s.id, s]))
  }, [staff])

  const svcById = useMemo(() => {
    if (!Array.isArray(services)) return new Map()
    return new Map(services.map(s => [s.id, s]))
  }, [services])

  const custById = useMemo(() => {
    if (!Array.isArray(customers)) return new Map()
    return new Map(customers.map(c => [c.id, c]))
  }, [customers])

  return { loading, error, appointments, staff, services, customers, staffById, svcById, custById }
}
