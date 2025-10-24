export type Role =
  | 'owner'
  | 'branch_manager'
  | 'sales'
  | 'service'
  | 'purchasing'
  | 'accountant'
  | 'hr'
  | 'analyst'
  | 'readonly'

export type NavItem = { label: string; href: string; roles?: Role[] }

export function filterNavByRole(items: NavItem[], userRoles: string[] = []) {
  if (!Array.isArray(items) || items.length === 0) return []
  const set = new Set(userRoles)
  return items.filter(it => {
    if (!it.roles || it.roles.length === 0) return true
    return it.roles.some(r => set.has(r))
  })
}

