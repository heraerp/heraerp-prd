'use client'

import React from 'react'
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
  DollarSign,
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
    { title: 'Owner Dashboard', href: '/salon/owner', icon: TrendingUp },
    {
      title: 'Appointments',
      href: '/salon/appointments1',
      icon: Calendar,
      badge: '3',
      badgeColor: LUXE_COLORS.emerald
    },
    { title: 'POS', href: '/salon/pos', icon: CreditCard },
    { title: 'Services', href: '/salon/services', icon: Scissors },
    { title: 'Products', href: '/salon/products', icon: Package },
    { title: 'Staff', href: '/salon/staff', icon: UserPlus },
    { title: 'Customers', href: '/salon/customers', icon: Users },
    { title: 'Branches', href: '/salon/branches', icon: Building2 },
    { title: 'Finance', href: '/salon/finance', icon: DollarSign },
    { title: 'Reports', href: '/salon/reports', icon: BarChart3 }
  ],

  receptionist: [
    { title: 'Dashboard', href: '/salon/receptionist/dashboard', icon: Home },
    {
      title: 'Appointments',
      href: '/salon/appointments1',
      icon: Calendar,
      badge: '3',
      badgeColor: LUXE_COLORS.emerald
    },
    { title: 'POS', href: '/salon/pos', icon: CreditCard },
    { title: 'Customers', href: '/salon/customers', icon: Users },
    { title: 'Services', href: '/salon/services', icon: Scissors },
    {
      title: 'WhatsApp',
      href: '/salon/whatsapp',
      icon: MessageCircle,
      badge: '5',
      badgeColor: LUXE_COLORS.gold
    }
  ],

  accountant: [
    { title: 'Dashboard', href: '/salon/dashboard', icon: Home },
    { title: 'Finance', href: '/salon/finance', icon: DollarSign },
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

export default function SalonRoleBasedDarkSidebar() {
  const { salonRole, isLoading } = useSecuredSalonContext()
  const { getNavigationItems } = useSalonSecurity()

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

  // Get role-specific items or default to owner
  const userRole = salonRole?.toLowerCase() as keyof typeof roleBasedSidebarItems
  const sidebarItems = roleBasedSidebarItems[userRole] || roleBasedSidebarItems.owner

  // Pass the role-specific items to the base sidebar
  return <SalonDarkSidebar items={sidebarItems} />
}
