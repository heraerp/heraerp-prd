'use client'

import '@/styles/sap-fiori-exact.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useMemo } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useRoles } from '@/lib/hooks/roles'
import { filterNavByRole, type NavItem } from '@/lib/roles'
import { HeraNavbar } from '@/components/hera/HeraNavbar'
import { Store, Home, ShoppingCart, Package, Truck, Wrench, TrendingUp, Users, BarChart3, Settings } from 'lucide-react'

export default function RetailLayout({ children }: PropsWithChildren) {
  const allRoles = useRoles()
  const pathname = usePathname()

  // Generate breadcrumbs based on current path
  const breadcrumbs = useMemo(() => {
    if (!pathname) return []
    
    const segments = pathname.split('/').filter(Boolean)
    const crumbs = []
    
    if (segments[0] === 'retail') {
      crumbs.push({ label: 'HERA Retail', href: '/retail/home', icon: Home })
      
      if (segments[1]) {
        const moduleMap: Record<string, { label: string; icon: any }> = {
          sales: { label: 'Sales', icon: ShoppingCart },
          inventory: { label: 'Inventory', icon: Package },
          procurement: { label: 'Procurement', icon: Truck },
          service: { label: 'Service', icon: Wrench },
          analytics: { label: 'Analytics', icon: BarChart3 },
          crm: { label: 'CRM', icon: Users },
          admin: { label: 'Settings', icon: Settings }
        }
        
        const module = moduleMap[segments[1]]
        if (module) {
          crumbs.push({ 
            label: module.label, 
            href: `/retail/${segments[1]}`,
            icon: module.icon
          })
          
          if (segments[2]) {
            const pageMap: Record<string, string> = {
              pos: 'Point of Sale',
              catalog: 'Product Catalog',
              po: 'Purchase Orders',
              intake: 'Service Intake'
            }
            
            const pageName = pageMap[segments[2]] || segments[2].replace('-', ' ')
            crumbs.push({ label: pageName })
          }
        }
      }
    }
    
    return crumbs
  }, [pathname])

  // Enterprise pages that should use full-screen layout (no dark background)
  const enterprisePages = [
    '/assets/', 
    '/ledger', 
    '/treasury', 
    '/materials', 
    '/inventory',
    '/analytics',
    '/reports',
    '/dashboard',
    '/procurement',
    '/sales',
    '/crm',
    '/finance',
    '/hr',
    '/admin'
  ]
  
  const isEnterprisePage = enterprisePages.some(page => pathname?.includes(page))

  if (isEnterprisePage) {
    // Full-screen enterprise layout without HERA containers or dark backgrounds
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen hera-font-primary" style={{ background: 'var(--hera-bg-main)' }}>
      <HeraNavbar
        title="HERA Enterprise Retail"
        breadcrumbs={breadcrumbs}
        showSearch={true}
        searchPlaceholder="Search across modules..."
        onSearchChange={(query) => {
          // Handle global search
          console.log('Global search:', query)
        }}
        actions={
          <Link href="/retail/sales/pos" className="hera-btn-accent hidden lg:flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Quick Sale
          </Link>
        }
      />
      
      <main className="max-w-7xl mx-auto px-6 py-8 min-h-[calc(100vh-5rem)]">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="hera-surface border-t mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                <Store className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-gray-600 hera-font-primary">HERA Enterprise Retail System</span>
            </div>
            <div className="text-xs text-gray-500 hera-font-primary">
              Powered by Universal Sacred Six Architecture • {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}