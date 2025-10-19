'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Users,
  Scissors,
  Package,
  MessageCircle,
  BarChart,
  Settings,
  CreditCard,
  Home,
  DollarSign,
  FileText,
  Shield,
  TrendingDown,
  LogOut,
  X,
  Grid3x3,
  CalendarCheck,
  Building2
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeColor?: string
  roles?: string[] // Roles that can access this item
}

// Role-based sidebar items configuration
const getSidebarItems = (role: string): SidebarItem[] => {
  // Normalize role to match our convention (lowercase with first letter capitalized)
  const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()

  const allItems: SidebarItem[] = [
    // Dashboard - available to Owner and Admin only
    {
      title: 'Dashboard',
      href: '/salon/dashboard',
      icon: Home,
      roles: ['Owner', 'Administrator']
    },

    // Receptionist Dashboard - Receptionist only
    {
      title: 'My Dashboard',
      href: '/salon/receptionist',
      icon: Home,
      roles: ['Receptionist']
    },

    // POS & Appointments - Receptionist main features
    {
      title: 'Point of Sale',
      href: '/salon/pos',
      icon: CreditCard,
      roles: ['Owner', 'Receptionist', 'Administrator']
    },
    {
      title: 'Appointments',
      href: '/salon/appointments1',
      icon: Calendar,
      badge: '3',
      badgeColor: 'bg-violet-500',
      roles: ['Owner', 'Receptionist', 'Administrator']
    },
    {
      title: 'Kanban Board',
      href: '/salon/kanban',
      icon: Grid3x3,
      roles: ['Owner', 'Receptionist', 'Administrator']
    },

    // Customer management
    {
      title: 'Customers',
      href: '/salon/customers',
      icon: Users,
      roles: ['Owner', 'Receptionist', 'Administrator']
    },

    // WhatsApp - for customer communication
    {
      title: 'WhatsApp',
      href: '/salon/whatsapp',
      icon: MessageCircle,
      badge: '5',
      badgeColor: 'bg-green-500',
      roles: ['Owner', 'Receptionist', 'Administrator']
    },

    // Services & Inventory - Admin features
    {
      title: 'Services',
      href: '/salon/services',
      icon: Scissors,
      roles: ['Owner', 'Administrator']
    },
    {
      title: 'Inventory',
      href: '/salon/inventory',
      icon: Package,
      roles: ['Owner', 'Administrator']
    },

    // Financial features - Accountant focused
    {
      title: 'Finance',
      href: '/salon/finance',
      icon: DollarSign,
      roles: ['Owner', 'Accountant', 'Administrator']
    },
    {
      title: 'Reports',
      href: '/salon/reports',
      icon: BarChart,
      roles: ['Owner', 'Accountant', 'Administrator']
    },
    {
      title: 'P&L Report',
      href: '/salon/reports/branch-pnl',
      icon: TrendingDown,
      roles: ['Owner', 'Accountant']
    },

    // Staff management
    {
      title: 'Leave Management',
      href: '/salon/leave',
      icon: CalendarCheck,
      roles: ['Owner', 'Administrator']
    },

    // Settings - Admin only
    {
      title: 'Settings',
      href: '/salon/settings',
      icon: Settings,
      roles: ['Owner', 'Administrator']
    }
  ]

  // Filter items based on role (using normalized role)
  return allItems.filter(item => !item.roles || item.roles.includes(normalizedRole))
}

// Apps modal items with role restrictions
const getAllApps = (role: string): SidebarItem[] => {
  // Normalize role to match our convention
  const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()

  const allApps: SidebarItem[] = [
    // Core modules
    { title: 'Dashboard', href: '/salon/dashboard', icon: Home, roles: ['Owner', 'Administrator'] },
    { title: 'My Dashboard', href: '/salon/receptionist', icon: Home, roles: ['Receptionist'] },
    {
      title: 'POS',
      href: '/salon/pos',
      icon: CreditCard,
      roles: ['Owner', 'Receptionist', 'Administrator']
    },
    {
      title: 'Appointments',
      href: '/salon/appointments1',
      icon: Calendar,
      roles: ['Owner', 'Receptionist', 'Administrator']
    },
    {
      title: 'Kanban Board',
      href: '/salon/kanban',
      icon: Grid3x3,
      roles: ['Owner', 'Receptionist', 'Administrator']
    },
    {
      title: 'Customers',
      href: '/salon/customers',
      icon: Users,
      roles: ['Owner', 'Receptionist', 'Administrator']
    },

    // Admin features
    {
      title: 'Services',
      href: '/salon/services',
      icon: Scissors,
      roles: ['Owner', 'Administrator']
    },
    {
      title: 'Inventory',
      href: '/salon/inventory',
      icon: Package,
      roles: ['Owner', 'Administrator']
    },
    {
      title: 'Settings',
      href: '/salon/settings',
      icon: Settings,
      roles: ['Owner', 'Administrator']
    },

    // Financial
    {
      title: 'Finance',
      href: '/salon/finance',
      icon: DollarSign,
      roles: ['Owner', 'Accountant', 'Administrator']
    },
    {
      title: 'Reports',
      href: '/salon/reports',
      icon: BarChart,
      roles: ['Owner', 'Accountant', 'Administrator']
    },
    {
      title: 'Branch P&L',
      href: '/salon/reports/branch-pnl',
      icon: Building2,
      roles: ['Owner', 'Accountant']
    },

    // Communication
    {
      title: 'WhatsApp',
      href: '/salon/whatsapp',
      icon: MessageCircle,
      roles: ['Owner', 'Receptionist', 'Administrator']
    },

    // Staff Management
    { title: 'Leave', href: '/salon/leave', icon: CalendarCheck, roles: ['Owner', 'Administrator'] }
  ]

  return allApps.filter(app => !app.roles || app.roles.includes(normalizedRole))
}

// Apps Modal Component
function AppsModal({
  isOpen,
  onClose,
  isActive,
  apps
}: {
  isOpen: boolean
  onClose: () => void
  isActive: (href: string) => boolean
  apps: SidebarItem[]
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">All Apps</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto max-h-[60vh] pr-2">
          {apps.map(app => {
            const Icon = app.icon
            const active = isActive(app.href)

            return (
              <Link
                key={app.href}
                href={app.href}
                onClick={onClose}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:bg-accent',
                  active && 'bg-accent ring-1 ring-pink-500/50'
                )}
              >
                <div
                  className={cn(
                    'p-3 rounded-xl transition-all',
                    active ? 'bg-gradient-to-br from-pink-500 to-violet-600' : 'bg-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      active ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs text-center',
                    active ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {app.title}
                </span>
                {app.badge && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full text-primary-foreground font-medium',
                      app.badgeColor || 'bg-pink-500'
                    )}
                  >
                    {app.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function SalonRoleBasedSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [appsModalOpen, setAppsModalOpen] = useState(false)
  const [userRole, setUserRole] = useState<string>('Staff')
  const [userName, setUserName] = useState<string>('User')

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem('salonRole') || 'Staff'
    const name = localStorage.getItem('salonUserName') || 'User'
    setUserRole(role)
    setUserName(name)
  }, [])

  const isActive = (href: string) => pathname === href

  const sidebarItems = getSidebarItems(userRole)
  const allApps = getAllApps(userRole)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('organizationId')
    localStorage.removeItem('salonRole')
    localStorage.removeItem('salonUserName')
    router.push('/salon-access')
  }

  // Get role-specific welcome message
  const getRoleWelcome = () => {
    const messages: Record<string, string> = {
      Owner: 'Welcome back, boss!',
      Receptionist: 'Ready to make clients beautiful!',
      Accountant: 'Numbers looking good today!',
      Administrator: 'System running smoothly!'
    }
    return messages[userRole] || 'Welcome to Hair Talkz!'
  }

  // Get role color
  const getRoleColor = () => {
    const colors: Record<string, string> = {
      Owner: 'from-purple-500 to-pink-500',
      Receptionist: 'from-blue-500 to-cyan-500',
      Accountant: 'from-green-500 to-emerald-500',
      Administrator: 'from-orange-500 to-red-500'
    }
    return colors[userRole] || 'from-gray-500 to-gray-600'
  }

  return (
    <>
      <aside className="fixed left-0 top-0 w-20 h-screen bg-background border-r border-border flex flex-col items-center py-4 z-40 overflow-y-auto">
        {/* Logo */}
        <Link href="/salon" className="mb-6 p-3 hover:bg-accent rounded-xl transition-all group flex-shrink-0">
          <Scissors className="w-6 h-6 text-pink-500 group-hover:scale-110 transition-transform" />
        </Link>

        {/* User info tooltip on hover */}
        <div className="group relative mb-4 flex-shrink-0">
          <div
            className={`p-2 rounded-lg bg-gradient-to-br ${getRoleColor()} opacity-20 group-hover:opacity-30 transition-opacity`}
          >
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="absolute left-full ml-2 px-3 py-2 bg-popover rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            <p className="text-xs font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{userRole}</p>
            <p className="text-xs text-pink-400 mt-1">{getRoleWelcome()}</p>
          </div>
        </div>

        {/* Main navigation - scrollable */}
        <nav className="flex-1 flex flex-col items-center gap-1 w-full px-3 overflow-y-auto min-h-0">
          {sidebarItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative w-full p-3 rounded-xl flex items-center justify-center transition-all group flex-shrink-0',
                  active
                    ? 'bg-gradient-to-br from-pink-500 to-violet-600 shadow-lg shadow-pink-500/25'
                    : 'hover:bg-accent'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-all',
                    active
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {item.badge && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] rounded-full text-primary-foreground font-medium',
                      item.badgeColor || 'bg-pink-500'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  <span className="text-xs text-foreground">{item.title}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Bottom fixed section */}
        <div className="flex flex-col items-center gap-1 w-full px-3 flex-shrink-0 pt-2 border-t border-border">
          {/* Apps grid */}
          <button
            onClick={() => setAppsModalOpen(true)}
            className={cn(
              'w-full p-3 rounded-xl flex items-center justify-center transition-all group relative',
              'hover:bg-accent'
            )}
          >
            <Grid3x3 className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-popover rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              <span className="text-xs text-foreground">All Apps</span>
            </div>
          </button>

          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            className="w-full p-3 rounded-xl flex items-center justify-center transition-all group hover:bg-accent relative"
          >
            <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-red-400" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-popover rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              <span className="text-xs text-foreground">Sign Out</span>
            </div>
          </button>
        </div>
      </aside>

      <AppsModal
        isOpen={appsModalOpen}
        onClose={() => setAppsModalOpen(false)}
        isActive={isActive}
        apps={allApps}
      />
    </>
  )
}
