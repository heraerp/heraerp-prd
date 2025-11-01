'use client'

import React, { useMemo } from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useSalonSecurity } from '@/hooks/useSalonSecurity'
import SalonDarkSidebar, { SidebarItem } from './SalonDarkSidebar'
import {
  Home,
  Calendar,
  CreditCard,
  Users,
  Scissors,
  Package,
  FolderOpen,
  MessageCircle,
  UserPlus,
  Banknote,
  BarChart3,
  Receipt,
  FileText,
  TrendingUp,
  Clipboard,
  LineChart,
  Calculator,
  Building2,
  Scale,
  Shield,
  Settings,
  Database,
  Key,
  Bell,
  Loader2
} from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'

// Define role-specific sidebar items
const roleBasedSidebarItems: Record<string, SidebarItem[]> = {
  owner: [
    { title: 'Dashboard', href: '/salon/dashboard', icon: Home },
    {
      title: 'Appointments',
      href: '/salon/appointments',
      icon: Calendar
    },
    { title: 'POS', href: '/salon/pos', icon: CreditCard },
    { title: 'Services', href: '/salon/services', icon: Scissors },
    { title: 'Products', href: '/salon/products', icon: Package },
    { title: 'Staff', href: '/salon/staffs', icon: UserPlus },
    { title: 'Customers', href: '/salon/customers', icon: Users },
    { title: 'Branches', href: '/salon/branches', icon: Building2 },
    { title: 'Finance', href: '/salon/finance', icon: Banknote }
    // Reports and Inventory remain in More modal
  ],

  receptionist: [
    { title: 'Dashboard', href: '/salon/receptionist', icon: Home },
    {
      title: 'Appointments',
      href: '/salon/appointments',
      icon: Calendar
    },
    { title: 'POS', href: '/salon/pos', icon: CreditCard },
    { title: 'Services', href: '/salon/services', icon: Scissors },
    { title: 'Products', href: '/salon/products', icon: Package },
    { title: 'Staff', href: '/salon/staffs', icon: UserPlus },
    { title: 'Customers', href: '/salon/customers', icon: Users }
    // WhatsApp moved to More modal
  ],

  accountant: [
    { title: 'Dashboard', href: '/salon/dashboard', icon: Home },
    { title: 'Finance', href: '/salon/finance', icon: Banknote },
    { title: 'P&L Report', href: '/salon/finance#pnl', icon: BarChart3 },
    { title: 'VAT Reports', href: '/salon/finance#vat', icon: Clipboard },
    { title: 'Expenses', href: '/salon/finance#expenses', icon: Receipt },
    { title: 'Invoices', href: '/salon/finance#invoices', icon: FileText },
    { title: 'Cash Flow', href: '/salon/finance#cashflow', icon: LineChart },
    { title: 'Payroll', href: '/salon/finance#payroll', icon: Calculator },
    { title: 'Balance Sheet', href: '/salon/reports/balance-sheet', icon: Scale },
    { title: 'Reports', href: '/salon/reports', icon: TrendingUp }
  ],

  admin: [
    { title: 'Dashboard', href: '/salon/admin/dashboard', icon: Home },
    { title: 'Users', href: '/salon/settings#users', icon: Users },
    { title: 'Security', href: '/salon/settings#security', icon: Shield },
    { title: 'System', href: '/salon/settings', icon: Settings },
    { title: 'Database', href: '/salon/admin/database', icon: Database },
    { title: 'API Keys', href: '/salon/settings#integrations', icon: Key },
    { title: 'Logs', href: '/salon/logs', icon: FileText },
    { title: 'Backup', href: '/salon/backup', icon: Package },
    { title: 'Alerts', href: '/salon/alerts', icon: Bell }
  ]
}

export default React.memo(function SalonRoleBasedDarkSidebar() {
  const { salonRole, organizationId, isLoading } = useSecuredSalonContext()

  // 🎯 ENTERPRISE FIX: Memoize sidebar items to prevent re-calculation on every render
  // This eliminates the need to call expensive API hooks on every navigation
  const sidebarItems = useMemo(() => {
    if (isLoading) return []

    // Get role-specific items or default to owner
    const userRole = salonRole?.toLowerCase() as keyof typeof roleBasedSidebarItems
    const items = roleBasedSidebarItems[userRole] || roleBasedSidebarItems.owner

    // ✅ PERFORMANCE FIX: Show all items by default
    // Inventory settings check removed - no longer makes API calls on every render
    // If inventory management needs to be conditional, check it at the page level instead
    return items
  }, [salonRole, isLoading])

  if (isLoading) {
    return (
      <div
        className="fixed inset-y-0 left-0 h-[100dvh] w-20 z-40 border-r flex items-center justify-center"
        style={{
          backgroundColor: LUXE_COLORS.charcoal,
          borderColor: `${LUXE_COLORS.gold}15`
        }}
      >
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: LUXE_COLORS.gold }} />
      </div>
    )
  }

  // Pass the role-specific items to the base sidebar
  return <SalonDarkSidebar items={sidebarItems} />
})
