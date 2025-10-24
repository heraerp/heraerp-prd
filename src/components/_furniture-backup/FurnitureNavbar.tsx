'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  Home,
  ShoppingCart,
  Factory,
  Package,
  BarChart3,
  FileText,
  DollarSign,
  Users,
  CheckCircle,
  Settings,
  Building2,
  Truck,
  Calculator,
  Target,
  Briefcase,
  Calendar,
  Clock,
  CreditCard,
  PieChart,
  TrendingUp,
  Armchair
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'

interface NavItem {
  title: string
  href?: string
  icon: React.ElementType
  items?: {
    title: string
    href: string
    description?: string
    icon: React.ElementType
  }[]
}

const navigationItems: NavItem[] = [
  {
    title: 'Sales',
    icon: ShoppingCart,
    items: [
      { title: 'Orders', href: '/furniture/sales/orders', description: 'Manage sales orders', icon: ShoppingCart },
      { title: 'Customers', href: '/furniture/sales/customers', description: 'Customer management', icon: Users },
      { title: 'Quotations', href: '/furniture/sales/quotations', description: 'Price quotations', icon: FileText },
      { title: 'Invoices', href: '/furniture/sales/invoices', description: 'Sales invoices', icon: CreditCard },
      { title: 'Reports', href: '/furniture/sales/reports', description: 'Sales analytics', icon: TrendingUp }
    ]
  },
  {
    title: 'Production',
    icon: Factory,
    items: [
      { title: 'Work Orders', href: '/furniture/production/orders', description: 'Production orders', icon: Factory },
      { title: 'Planning', href: '/furniture/production/planning', description: 'Production planning', icon: Calendar },
      { title: 'Routing', href: '/furniture/production/routing', description: 'Production routing', icon: Target },
      { title: 'Work Centers', href: '/furniture/production/workcenters', description: 'Work center management', icon: Building2 },
      { title: 'Scheduling', href: '/furniture/production/scheduling', description: 'Production scheduling', icon: Clock }
    ]
  },
  {
    title: 'Inventory',
    icon: Package,
    items: [
      { title: 'Stock Overview', href: '/furniture/inventory', description: 'Current inventory levels', icon: Package },
      { title: 'Movements', href: '/furniture/inventory/movements', description: 'Stock movements', icon: Truck },
      { title: 'Adjustments', href: '/furniture/inventory/adjustments', description: 'Inventory adjustments', icon: Calculator },
      { title: 'Locations', href: '/furniture/inventory/locations', description: 'Warehouse locations', icon: Building2 },
      { title: 'Valuation', href: '/furniture/inventory/valuation', description: 'Inventory valuation', icon: DollarSign }
    ]
  },
  {
    title: 'Products',
    icon: BarChart3,
    items: [
      { title: 'Catalog', href: '/furniture/products/catalog', description: 'Product catalog', icon: BarChart3 },
      { title: 'BOM', href: '/furniture/products/bom', description: 'Bill of materials', icon: FileText },
      { title: 'Costing', href: '/furniture/products/costing', description: 'Product costing', icon: DollarSign },
      { title: 'Categories', href: '/furniture/products/categories', description: 'Product categories', icon: Package },
      { title: 'Specifications', href: '/furniture/products/specs', description: 'Product specifications', icon: CheckCircle }
    ]
  },
  {
    title: 'Finance',
    icon: DollarSign,
    items: [
      { title: 'Dashboard', href: '/furniture/finance', description: 'Financial overview', icon: PieChart },
      { title: 'Accounts', href: '/furniture/finance/accounts', description: 'Chart of accounts', icon: DollarSign },
      { title: 'Payments', href: '/furniture/finance/payments', description: 'Payment management', icon: CreditCard },
      { title: 'Reports', href: '/furniture/finance/reports', description: 'Financial reports', icon: TrendingUp },
      { title: 'GST', href: '/furniture/finance/gst', description: 'GST management', icon: Calculator }
    ]
  },
  {
    title: 'HR & Payroll',
    icon: Users,
    items: [
      { title: 'Employees', href: '/furniture/hr/employees', description: 'Employee management', icon: Users },
      { title: 'Payroll', href: '/furniture/hr/payroll', description: 'Payroll processing', icon: CreditCard },
      { title: 'Attendance', href: '/furniture/hr/attendance', description: 'Attendance tracking', icon: Clock },
      { title: 'Leave', href: '/furniture/hr/leave', description: 'Leave management', icon: Calendar },
      { title: 'Compliance', href: '/furniture/hr/compliance', description: 'HR compliance', icon: CheckCircle }
    ]
  }
]

export default function FurnitureNavbar() {
  const pathname = usePathname()
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())

  const toggleDropdown = (title: string) => {
    const newOpenDropdowns = new Set(openDropdowns)
    if (newOpenDropdowns.has(title)) {
      newOpenDropdowns.delete(title)
    } else {
      newOpenDropdowns.add(title)
    }
    setOpenDropdowns(newOpenDropdowns)
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="w-full bg-[var(--color-body)]/95 backdrop-blur-xl border-b border-[var(--color-border)]/50 sticky top-0 z-50">
      <div className="w-full px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/furniture" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-teal)] to-[var(--color-accent-indigo)] flex items-center justify-center">
              <Armchair className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[var(--color-text-primary)] font-bold text-lg leading-tight">Kerala Furniture</span>
              <span className="text-[var(--color-text-secondary)] text-xs leading-tight">Enterprise Management</span>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* Home */}
            <Link href="/furniture">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]",
                  pathname === '/furniture' && "text-[var(--color-accent-teal)] bg-[var(--color-accent-teal)]/10"
                )}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>

            {/* Navigation with Dropdowns */}
            {navigationItems.map((item) => (
              <DropdownMenu key={item.title}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]",
                      item.items?.some(subItem => isActive(subItem.href)) && "text-[var(--color-accent-teal)] bg-[var(--color-accent-teal)]/10"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-[var(--color-surface)] border-[var(--color-border)]" align="start">
                  <DropdownMenuLabel className="text-[var(--color-text-primary)] font-semibold">
                    {item.title} Management
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--color-border)]" />
                  {item.items?.map((subItem) => (
                    <DropdownMenuItem key={subItem.href} asChild className="cursor-pointer">
                      <Link
                        href={subItem.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] rounded-md",
                          isActive(subItem.href) && "text-[var(--color-accent-teal)] bg-[var(--color-accent-teal)]/10"
                        )}
                      >
                        <subItem.icon className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">{subItem.title}</span>
                          {subItem.description && (
                            <span className="text-xs text-[var(--color-text-secondary)]">{subItem.description}</span>
                          )}
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </div>

          {/* Settings */}
          <div className="flex items-center gap-2">
            <Link href="/furniture/reports">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
              >
                <TrendingUp className="h-4 w-4" />
                Reports
              </Button>
            </Link>
            <Link href="/furniture/settings">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Horizontal scroll */}
      <div className="lg:hidden border-t border-[var(--color-border)]/30">
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-hide">
          <Link href="/furniture">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2 whitespace-nowrap text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                pathname === '/furniture' && "text-[var(--color-accent-teal)]"
              )}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          {navigationItems.map((item) => (
            <DropdownMenu key={item.title}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 whitespace-nowrap text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                    item.items?.some(subItem => isActive(subItem.href)) && "text-[var(--color-accent-teal)]"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[var(--color-surface)] border-[var(--color-border)]" align="start">
                <DropdownMenuLabel className="text-[var(--color-text-primary)]">{item.title}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[var(--color-border)]" />
                {item.items?.map((subItem) => (
                  <DropdownMenuItem key={subItem.href} asChild>
                    <Link
                      href={subItem.href}
                      className={cn(
                        "flex items-center gap-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                        isActive(subItem.href) && "text-[var(--color-accent-teal)]"
                      )}
                    >
                      <subItem.icon className="h-4 w-4" />
                      {subItem.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
      </div>
    </nav>
  )
}