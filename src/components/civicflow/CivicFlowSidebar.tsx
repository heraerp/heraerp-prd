'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  DollarSign,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  Menu,
  Workflow,
  Calendar,
  Mail,
  Shield,
  LogOut,
  TrendingUp,
  UserPlus,
  LineChart,
  Brain,
  Grid3X3,
  Search,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { MoreAppsModal } from './MoreAppsModal'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
}

const navigation: NavItem[] = [
  { title: 'Dashboard', href: '/civicflow', icon: LayoutDashboard },
  { title: 'Constituents', href: '/civicflow/constituents', icon: Users, badge: '100' },
  { title: 'Organizations', href: '/civicflow/organizations', icon: Building2, badge: '20' },
  { title: 'Programs', href: '/civicflow/programs', icon: Briefcase },
  { title: 'Grants', href: '/civicflow/grants', icon: DollarSign, badge: '6' },
  { title: 'Cases', href: '/civicflow/cases', icon: FileText, badge: '12' },
  { title: 'Playbooks', href: '/civicflow/playbooks', icon: Workflow },
  { title: 'Calendar', href: '/civicflow/calendar', icon: Calendar },
  { title: 'Events', href: '/civicflow/events', icon: Calendar, badge: '3' },
  { title: 'Communications', href: '/civicflow/communications', icon: Mail },
  { title: 'Emails', href: '/civicflow/emails', icon: MessageSquare, badge: '5' },
  { title: 'Engagement', href: '/civicflow/engagement', icon: UserPlus },
  { title: 'Analytics', href: '/civicflow/analytics', icon: TrendingUp },
  { title: 'Reports', href: '/civicflow/reports', icon: BarChart3 }
]

const bottomNavigation: NavItem[] = [
  { title: 'Documentation', href: '/docs/civicflow', icon: BookOpen },
  { title: 'Search Docs', href: '/docs/civicflow/search', icon: Search },
  { title: 'Settings', href: '/civicflow/settings', icon: Settings },
  { title: 'Security', href: '/civicflow/security', icon: Shield },
  { title: 'Help', href: '/civicflow/help', icon: HelpCircle }
]

interface DemoUser {
  email: string
  role: string
  initials: string
}

export function CivicFlowSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null)
  const [showMoreApps, setShowMoreApps] = useState(false)

  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (user?.user_metadata) {
        const metadata = user.user_metadata
        const initials =
          metadata.full_name
            ?.split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U'

        setCurrentUser({
          email: user.email || '',
          role: metadata.role || 'User',
          initials
        })
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem('organizationId')
      localStorage.removeItem('currentRole')
      // The auth guard will handle the redirect
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-panel border border-border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="h-5 w-5 text-text-300" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full bg-panel-alt border-r border-border transition-all duration-300',
          collapsed ? 'w-20' : 'w-64',
          // Mobile behavior
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop behavior
          'lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <div
              className={cn(
                'flex items-center gap-3 transition-all duration-300',
                collapsed && 'opacity-0 scale-90 pointer-events-none'
              )}
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent-soft flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-accent-fg" />
              </div>
              {!collapsed && <span className="text-lg font-semibold text-text-100">CivicFlow</span>}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-panel transition-colors cursor-pointer"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft
                className={cn(
                  'h-4 w-4 text-text-300 transition-transform',
                  collapsed && 'rotate-180'
                )}
              />
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navigation.map(item => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/civicflow' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer',
                    'hover:bg-accent-soft hover:text-accent',
                    isActive
                      ? 'bg-accent-soft text-accent shadow-sm'
                      : 'text-text-300 hover:text-text-100',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-accent')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs rounded-full',
                            isActive ? 'bg-accent text-accent-fg' : 'bg-panel text-text-300'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}

            {/* More Apps Button */}
            <button
              onClick={() => setShowMoreApps(true)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer w-full',
                'hover:bg-accent-soft hover:text-accent text-text-300 hover:text-text-100',
                'mt-2 border border-dashed border-accent-soft hover:border-accent',
                collapsed && 'justify-center'
              )}
              title={collapsed ? 'More Apps' : undefined}
            >
              <Grid3X3 className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="flex-1">More Apps</span>}
            </button>
          </nav>

          {/* Bottom Navigation */}
          <div className="border-t border-border p-3 space-y-1">
            {bottomNavigation.map(item => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer',
                    'hover:bg-accent-soft hover:text-accent',
                    isActive
                      ? 'bg-accent-soft text-accent shadow-sm'
                      : 'text-text-300 hover:text-text-100',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-accent')} />
                  {!collapsed && <span className="flex-1">{item.title}</span>}
                </Link>
              )
            })}
          </div>

          {/* User Profile */}
          <div className="border-t border-border p-4 space-y-2">
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg p-2',
                collapsed && 'justify-center p-0'
              )}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-accent-soft flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-accent-fg">
                  {currentUser?.initials || 'DU'}
                </span>
              </div>
              {!collapsed && currentUser && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-100">{currentUser.role}</p>
                  <p className="text-xs text-text-500 truncate">{currentUser.email}</p>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer w-full',
                'text-red-400 hover:bg-red-500/10 hover:text-red-300',
                collapsed && 'justify-center'
              )}
              title={collapsed ? 'Logout' : undefined}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content spacer */}
      <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-20' : 'lg:pl-64')} />

      {/* More Apps Modal */}
      <MoreAppsModal open={showMoreApps} onOpenChange={setShowMoreApps} />
    </>
  )
}
