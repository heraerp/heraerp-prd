'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useMemo } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useRoles } from '@/lib/hooks/roles'
import { filterNavByRole, type NavItem } from '@/lib/roles'

export default function MatrixLayout({ children }: PropsWithChildren) {
  const allRoles = useRoles()
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
    <div className="min-h-screen flex flex-col" style={{background: 'linear-gradient(135deg, #F9F6EE 0%, #D8CBB3 100%)'}}>
      <header className="glass-nav fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BB8D3F] to-[#8B4729] flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div className="font-bold tracking-tight text-[#45492D] text-xl">Matrix IT World</div>
          </div>
          <nav className="flex items-center gap-2">
            {items.map(it => {
              const active = pathname?.startsWith(it.href)
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={
                    active 
                      ? 'glass-btn-primary text-white font-medium'
                      : 'glass-btn-secondary hover:glass-warm transition-all duration-300'
                  }
                >
                  {it.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="pt-20 container mx-auto px-6 py-8 flex-1">{children}</main>
    </div>
  )
}
