import { format, isWeekend, eachDayOfInterval, differenceInBusinessDays } from 'date-fns'

const BASE = process.env.NEXT_PUBLIC_PLAYBOOK_BASE_URL
const KEY = process.env.NEXT_PUBLIC_PLAYBOOK_API_KEY

// Mock data generators
const generateMockStaff = (count: number, branchId?: string) => {
  const names = ['Emily Chen', 'Sarah Johnson', 'Mike Wilson', 'Jessica Lee', 'Alex Rodriguez']
  return Array.from({ length: Math.min(count, names.length) }, (_, i) => ({
    id: `staff-${i + 1}`,
    entity_type: 'employee',
    entity_name: names[i],
    entity_code: `EMP${String(i + 1).padStart(3, '0')}`,
    smart_code: 'HERA.SALON.STAFF.V1',
    organization_id: 'mock-org',
    metadata: {
      branch_id: branchId || 'branch-1',
      role: ['Stylist', 'Senior Stylist', 'Manager'][i % 3],
      join_date: new Date(2023, 0, 15 + i * 30).toISOString()
    }
  }))
}

const generateMockRequests = (staffId?: string) => {
  const baseRequests = [
    {
      id: 'req-1',
      transaction_type: 'leave_request',
      transaction_code: 'LR-2025-001',
      smart_code: 'HERA.HR.LEAVE.REQUEST.V1',
      source_entity_id: staffId || 'staff-1',
      transaction_date: '2025-09-25',
      status: 'approved',
      metadata: {
        branch_id: 'branch-1',
        type: 'ANNUAL',
        from: '2025-10-01',
        to: '2025-10-05',
        days: 5
      }
    },
    {
      id: 'req-2',
      transaction_type: 'leave_request',
      transaction_code: 'LR-2025-002',
      smart_code: 'HERA.HR.LEAVE.REQUEST.V1',
      source_entity_id: staffId || 'staff-2',
      transaction_date: '2025-09-20',
      status: 'pending',
      metadata: {
        branch_id: 'branch-1',
        type: 'ANNUAL',
        from: '2025-11-15',
        to: '2025-11-20',
        days: 4
      }
    }
  ]

  return staffId ? baseRequests.filter(r => r.source_entity_id === staffId) : baseRequests
}

// API wrapper functions with mock fallbacks
export async function listStaff({
  organization_id,
  branch_id,
  q,
  limit = 50,
  offset = 0
}: {
  organization_id: string
  branch_id?: string
  q?: string
  limit?: number
  offset?: number
}) {
  // Use the searchStaff function from entities playbook
  const { searchStaff } = await import('@/lib/playbook/entities')

  try {
    const result = await searchStaff({
      organization_id,
      branch_id,
      q,
      page: Math.floor(offset / limit) + 1,
      page_size: limit
    })

    // Transform the result to match the expected format
    return {
      items: result.rows || [],
      total: result.total || 0
    }
  } catch (error) {
    console.error('Error searching staff:', error)
    // Return mock data as fallback
    const allStaff = generateMockStaff(10, branch_id)
    const filtered = q
      ? allStaff.filter(s => s.entity_name.toLowerCase().includes(q.toLowerCase()))
      : allStaff
    return {
      items: filtered.slice(offset, offset + limit),
      total: filtered.length
    }
  }
}

export async function listPolicies({ organization_id }: { organization_id: string }) {
  if (!BASE || !KEY) {
    return {
      items: [
        {
          id: 'policy-1',
          entity_name: 'Standard Annual Leave',
          entity_code: 'STD-ANNUAL',
          smart_code: 'HERA.HR.LEAVE.POLICY.V1',
          metadata: {
            accrual_method: 'ANNUAL',
            annual_entitlement: 25,
            carry_over_cap: 5,
            prorate: true,
            min_notice_days: 7
          }
        },
        {
          id: 'policy-2',
          entity_name: 'Manager Leave Policy',
          entity_code: 'MGR-ANNUAL',
          smart_code: 'HERA.HR.LEAVE.POLICY.V1',
          metadata: {
            accrual_method: 'ANNUAL',
            annual_entitlement: 30,
            carry_over_cap: 10,
            prorate: true,
            min_notice_days: 14
          }
        }
      ],
      total: 2
    }
  }

  const response = await fetch(
    `${BASE}/entities?type=HERA.HR.LEAVE.POLICY.V1&organization_id=${organization_id}`,
    {
      headers: { Authorization: `Bearer ${KEY}` }
    }
  )
  return response.json()
}

export async function upsertPolicy({
  organization_id,
  id,
  name,
  code,
  accrual
}: {
  organization_id: string
  id?: string
  name: string
  code?: string
  accrual: any
}) {
  if (!BASE || !KEY) {
    return { id: id || 'new-policy', success: true }
  }

  const method = id ? 'PATCH' : 'POST'
  const url = id ? `${BASE}/entities/${id}` : `${BASE}/entities`

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      organization_id,
      entity_type: 'leave_policy',
      entity_name: name,
      entity_code: code,
      smart_code: 'HERA.HR.LEAVE.POLICY.V1',
      metadata: accrual
    })
  })

  return response.json()
}

export async function listRequests({
  organization_id,
  branch_id,
  staff_id,
  status,
  from,
  to,
  limit = 50,
  offset = 0
}: {
  organization_id: string
  branch_id?: string
  staff_id?: string
  status?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}) {
  if (!BASE || !KEY) {
    const allRequests = generateMockRequests(staff_id)
    const filtered = allRequests.filter(r => {
      if (status && r.status !== status) return false
      if (branch_id && r.metadata.branch_id !== branch_id) return false
      return true
    })

    return {
      items: filtered.slice(offset, offset + limit),
      total: filtered.length
    }
  }

  const params = new URLSearchParams({
    smart_code: 'HERA.HR.LEAVE.REQUEST.V1',
    organization_id,
    limit: String(limit),
    offset: String(offset)
  })

  if (branch_id) params.append('metadata.branch_id', branch_id)
  if (staff_id) params.append('source_entity_id', staff_id)
  if (status) params.append('status', status)
  if (from) params.append('transaction_date_gte', from)
  if (to) params.append('transaction_date_lte', to)

  const response = await fetch(`${BASE}/universal_transactions?${params}`, {
    headers: { Authorization: `Bearer ${KEY}` }
  })
  return response.json()
}

export async function createRequest({
  organization_id,
  staff_id,
  branch_id,
  from,
  to,
  lines,
  notes
}: {
  organization_id: string
  staff_id: string
  branch_id: string
  from: Date
  to: Date
  lines: any[]
  notes?: string
}) {
  if (!BASE || !KEY) {
    return {
      id: `req-${Date.now()}`,
      success: true
    }
  }

  // Create transaction
  const txnResponse = await fetch(`${BASE}/universal_transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      organization_id,
      transaction_type: 'leave_request',
      transaction_code: `LR-${new Date().getFullYear()}-${Date.now()}`,
      smart_code: 'HERA.HR.LEAVE.REQUEST.V1',
      source_entity_id: staff_id,
      transaction_date: new Date().toISOString(),
      status: 'pending',
      metadata: {
        branch_id,
        from: from.toISOString(),
        to: to.toISOString(),
        notes
      }
    })
  })

  const txn = await txnResponse.json()

  // Create transaction lines
  for (const line of lines) {
    await fetch(`${BASE}/universal_transaction_lines`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_id,
        transaction_id: txn.id,
        line_description: `Leave day: ${line.date}`,
        smart_code: 'HERA.HR.LEAVE.LINE.V1',
        metadata: line
      })
    })
  }

  return txn
}

export async function decideRequest({
  organization_id,
  request_id,
  approver_id,
  decision,
  reason
}: {
  organization_id: string
  request_id: string
  approver_id: string
  decision: 'APPROVE' | 'REJECT'
  reason?: string
}) {
  if (!BASE || !KEY) {
    return { success: true }
  }

  // Create approval transaction
  await fetch(`${BASE}/universal_transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      organization_id,
      transaction_type: 'leave_approval',
      smart_code: 'HERA.HR.LEAVE.APPROVAL.V1',
      source_entity_id: approver_id,
      reference_number: request_id,
      metadata: {
        request_id,
        decision,
        reason
      }
    })
  })

  // Update request status
  await fetch(`${BASE}/universal_transactions/${request_id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: decision === 'APPROVE' ? 'approved' : 'rejected'
    })
  })

  return { success: true }
}

export async function getBalances({
  organization_id,
  staff_ids,
  period_start,
  period_end
}: {
  organization_id: string
  staff_ids: string[]
  period_start: string
  period_end: string
}) {
  if (!BASE || !KEY) {
    // Return mock balances
    return staff_ids.map(staff_id => ({
      staff_id,
      policy_id: 'policy-1',
      period_start,
      period_end,
      entitlement_days: 25,
      carried_over_days: 3,
      accrued_days: 0,
      taken_days: 8,
      scheduled_days: 5
    }))
  }

  const response = await fetch(`${BASE}/dynamic_data/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      organization_id,
      smart_code: 'HERA.HR.LEAVE.BALANCE.V1',
      entity_ids: staff_ids,
      filters: {
        period_start,
        period_end
      }
    })
  })

  return response.json()
}

export async function upsertBalance(entity_id: string, data: any) {
  if (!BASE || !KEY) {
    return { success: true }
  }

  const response = await fetch(`${BASE}/dynamic_data/upsert`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entity_id,
      smart_code: 'HERA.HR.LEAVE.BALANCE.V1',
      data
    })
  })

  return response.json()
}

export async function listHolidays({
  organization_id,
  year
}: {
  organization_id: string
  year: number
}) {
  if (!BASE || !KEY) {
    // Return UK public holidays for mock
    return {
      items: [
        { id: 'hol-1', entity_name: "New Year's Day", metadata: { date: `${year}-01-01` } },
        { id: 'hol-2', entity_name: 'Good Friday', metadata: { date: `${year}-04-18` } },
        { id: 'hol-3', entity_name: 'Easter Monday', metadata: { date: `${year}-04-21` } },
        { id: 'hol-4', entity_name: 'Early May Bank Holiday', metadata: { date: `${year}-05-05` } },
        { id: 'hol-5', entity_name: 'Spring Bank Holiday', metadata: { date: `${year}-05-26` } },
        { id: 'hol-6', entity_name: 'Summer Bank Holiday', metadata: { date: `${year}-08-25` } },
        { id: 'hol-7', entity_name: 'Christmas Day', metadata: { date: `${year}-12-25` } },
        { id: 'hol-8', entity_name: 'Boxing Day', metadata: { date: `${year}-12-26` } }
      ],
      total: 8
    }
  }

  const response = await fetch(
    `${BASE}/entities?type=HERA.HR.HOLIDAY.V1&organization_id=${organization_id}&metadata.year=${year}`,
    {
      headers: { Authorization: `Bearer ${KEY}` }
    }
  )
  return response.json()
}

// Utility: working-day calculator (Europe/London), excluding holidays/weekends
export function calculateWorkingDays(
  from: Date,
  to: Date,
  holidays: Date[],
  halfDayStart = false,
  halfDayEnd = false
): number {
  const days = eachDayOfInterval({ start: from, end: to })
  const holidayStrings = holidays.map(h => format(h, 'yyyy-MM-dd'))

  let workingDays = 0

  for (const day of days) {
    const dayString = format(day, 'yyyy-MM-dd')
    if (!isWeekend(day) && !holidayStrings.includes(dayString)) {
      workingDays++
    }
  }

  // Adjust for half days
  if (halfDayStart && workingDays > 0) workingDays -= 0.5
  if (halfDayEnd && workingDays > 0) workingDays -= 0.5

  return workingDays
}
