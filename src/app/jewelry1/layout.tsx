'use client'

import React from 'react'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from '@/components/ui/sidebar'
import { 
  Home,
  ShoppingCart, 
  Package, 
  Users, 
  Gem,
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  Truck,
  UserCircle,
  Calendar,
  Star,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigationItems = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/jewelry1',
    description: 'Overview and key metrics'
  },
  {
    title: 'Point of Sale',
    icon: ShoppingCart,
    href: '/jewelry1/pos',
    description: 'Process sales transactions'
  },
  {
    title: 'Inventory',
    icon: Package,
    href: '/jewelry1/inventory',
    description: 'Manage products and stock',
    submenu: [
      { title: 'Products', href: '/jewelry1/inventory/products' },
      { title: 'Categories', href: '/jewelry1/inventory/categories' },
      { title: 'Stock Levels', href: '/jewelry1/inventory/stock' },
      { title: 'Adjustments', href: '/jewelry1/inventory/adjustments' }
    ]
  },
  {
    title: 'Customers',
    icon: Users,
    href: '/jewelry1/customers',
    description: 'Customer relationship management',
    submenu: [
      { title: 'Customer List', href: '/jewelry1/customers/list' },
      { title: 'Add Customer', href: '/jewelry1/customers/new' },
      { title: 'VIP Customers', href: '/jewelry1/customers/vip' }
    ]
  },
  {
    title: 'Manufacturing',
    icon: Gem,
    href: '/jewelry1/manufacturing',
    description: 'Production and design',
    submenu: [
      { title: 'Work Orders', href: '/jewelry1/manufacturing/orders' },
      { title: 'Designs', href: '/jewelry1/manufacturing/designs' },
      { title: 'Materials', href: '/jewelry1/manufacturing/materials' }
    ]
  },
  {
    title: 'Orders',
    icon: FileText,
    href: '/jewelry1/orders',
    description: 'Manage sales orders',
    submenu: [
      { title: 'Active Orders', href: '/jewelry1/orders/active' },
      { title: 'Order History', href: '/jewelry1/orders/history' },
      { title: 'Custom Orders', href: '/jewelry1/orders/custom' }
    ]
  },
  {
    title: 'Vendors',
    icon: Truck,
    href: '/jewelry1/vendors',
    description: 'Supplier management',
    submenu: [
      { title: 'Vendor List', href: '/jewelry1/vendors/list' },
      { title: 'Purchase Orders', href: '/jewelry1/vendors/po' },
      { title: 'Payments', href: '/jewelry1/vendors/payments' }
    ]
  },
  {
    title: 'Finance',
    icon: CreditCard,
    href: '/jewelry1/finance',
    description: 'Financial management',
    submenu: [
      { title: 'Invoices', href: '/jewelry1/finance/invoices' },
      { title: 'Payments', href: '/jewelry1/finance/payments' },
      { title: 'GST Reports', href: '/jewelry1/finance/gst' },
      { title: 'Accounts', href: '/jewelry1/finance/accounts' }
    ]
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    href: '/jewelry1/analytics',
    description: 'Business insights',
    submenu: [
      { title: 'Sales Reports', href: '/jewelry1/analytics/sales' },
      { title: 'Inventory Reports', href: '/jewelry1/analytics/inventory' },
      { title: 'Customer Analytics', href: '/jewelry1/analytics/customers' }
    ]
  }
]

const bottomNavigationItems = [
  {
    title: 'Profile',
    icon: UserCircle,
    href: '/jewelry1/profile'
  },
  {
    title: 'Settings', 
    icon: Settings,
    href: '/jewelry1/settings'
  }
]

function Jewelry1LayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, organization, isAuthenticated } = useHERAAuth()
  const pathname = usePathname()

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-slate-600">Please log in to access Jewelry1 ERP</p>
      </div>
    </div>
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* SAP Fiori Sidebar */}
        <Sidebar className="hidden md:flex border-r border-slate-200 bg-slate-50">
          <SidebarHeader className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Gem className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Jewelry1 ERP</h2>
                <p className="text-xs text-slate-500">Fiori Design</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="flex-1 p-4">
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    className={cn(
                      "w-full justify-start text-left hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors",
                      pathname === item.href && "bg-blue-100 text-blue-700 font-medium"
                    )}
                  >
                    <Link href={item.href} className="flex items-center space-x-3 p-3">
                      <item.icon className="w-5 h-5" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs text-slate-500">{item.description}</div>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                  
                  {/* Submenu */}
                  {item.submenu && pathname.startsWith(item.href) && (
                    <div className="ml-8 mt-2 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "block text-sm py-2 px-3 rounded-md hover:bg-slate-100 transition-colors",
                            pathname === subItem.href && "bg-blue-50 text-blue-700 font-medium"
                          )}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          {/* Bottom Navigation */}
          <div className="p-4 border-t border-slate-200">
            <SidebarMenu>
              {bottomNavigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    className={cn(
                      "w-full justify-start text-left hover:bg-slate-100 rounded-lg transition-colors",
                      pathname === item.href && "bg-slate-200 font-medium"
                    )}
                  >
                    <Link href={item.href} className="flex items-center space-x-3 p-3">
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            {/* User Info */}
            <div className="mt-4 p-3 bg-slate-100 rounded-lg">
              <div className="text-sm font-medium text-slate-900">
                {user?.entity_name || 'Demo User'}
              </div>
              <div className="text-xs text-slate-500">
                {organization?.entity_name || 'Demo Organization'}
              </div>
            </div>
          </div>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 min-h-screen bg-slate-50">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}

export default function Jewelry1Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <HERAAuthProvider>
      <Jewelry1LayoutContent>{children}</Jewelry1LayoutContent>
    </HERAAuthProvider>
  )
}