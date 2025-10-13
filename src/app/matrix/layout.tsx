'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useMemo } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { filterNavByRole, type NavItem } from '@/lib/roles'

export default function MatrixLayout({ children }: PropsWithChildren) {
  const { roles = [], userRoles = [] } = useHERAAuth() || ({} as any)
  const allRoles = (roles || userRoles || []) as string[]
  const pathname = usePathname()

  const nav = useMemo<NavItem[]>(() => {
    return [
      { label: 'Home', href: '/matrix/home' },
      { label: 'Sales', href: '/matrix/sales/pos', roles: ['owner', 'branch_manager', 'sales'] },
      { label: 'Inventory', href: '/matrix/inventory/catalog', roles: ['owner', 'branch_manager'] },
      { label: 'Procurement', href: '/matrix/procurement/po', roles: ['owner', 'purchasing'] },
      { label: 'Service', href: '/matrix/service/intake', roles: ['owner', 'service', 'branch_manager'] },
      { label: 'Finance', href: '/matrix/finance/pl', roles: ['owner', 'accountant'] },
      { label: 'CRM', href: '/matrix/crm', roles: ['owner', 'sales'] },
      { label: 'HR', href: '/matrix/hr', roles: ['owner', 'hr'] },
      { label: 'Analytics', href: '/matrix/analytics', roles: ['owner', 'analyst'] },
      { label: 'Admin', href: '/matrix/admin', roles: ['owner'] }
    ]
  }, [])

  const items = filterNavByRole(nav, allRoles)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <div className="font-semibold tracking-tight">Matrix IT World</div>
          <nav className="flex items-center gap-3 text-sm">
            {items.map(it => {
              const active = pathname?.startsWith(it.href)
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={
                    'px-2 py-1 rounded hover:bg-muted transition-colors ' +
                    (active ? 'bg-muted font-medium' : 'text-muted-foreground')
                  }
                >
                  {it.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 flex-1">{children}</main>
    </div>
  )
}

