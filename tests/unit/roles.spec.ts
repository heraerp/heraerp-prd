import { describe, it, expect } from 'vitest'
import { filterNavByRole } from '@/lib/roles'

describe('filterNavByRole', () => {
  it('returns all when no roles required', () => {
    const items = [
      { label: 'Home', href: '/home' },
      { label: 'Sales', href: '/sales' }
    ]
    expect(filterNavByRole(items, ['readonly']).length).toBe(2)
  })

  it('filters by required roles', () => {
    const items = [
      { label: 'Home', href: '/home' },
      { label: 'Finance', href: '/finance', roles: ['accountant'] }
    ]
    expect(filterNavByRole(items, ['sales']).map(i => i.label)).toEqual(['Home'])
    expect(filterNavByRole(items, ['accountant']).map(i => i.label)).toEqual(['Home', 'Finance'])
  })
})

