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
  Activity,
  Globe,
  Megaphone,
  Target,
  Zap,
  Database,
  BookOpen,
  CreditCard,
  FileSearch,
  UserCheck,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string | number
  section?: string
  description?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navigationSections: NavSection[] = [
  {
    title: 'Core',
    items: [
      {
        title: 'Dashboard',
        href: '/civicflow',
        icon: LayoutDashboard,
        description: 'Main overview'
      },
      {
        title: 'Calendar',
        href: '/civicflow/calendar',
        icon: Calendar,
        description: 'Events & schedule'
      },
      {
        title: 'Analytics',
        href: '/civicflow/analytics',
        icon: TrendingUp,
        description: 'Insights & KPIs',
        badge: 'New'
      }
    ]
  },
  {
    title: 'CRM',
    items: [
      {
        title: 'Constituents',
        href: '/civicflow/constituents',
        icon: Users,
        badge: 100,
        description: 'Citizens & contacts'
      },
      {
        title: 'Organizations',
        href: '/civicflow/organizations',
        icon: Building2,
        badge: 20,
        description: 'Partner orgs'
      },
      {
        title: 'Cases',
        href: '/civicflow/cases',
        icon: FileText,
        badge: 12,
        description: 'Service requests'
      },
      {
        title: 'Engagement',
        href: '/civicflow/engagement',
        icon: UserPlus,
        description: 'Journey pipeline'
      }
    ]
  },
  {
    title: 'Programs',
    items: [
      {
        title: 'Programs',
        href: '/civicflow/programs',
        icon: Briefcase,
        description: 'Service programs'
      },
      {
        title: 'Grants',
        href: '/civicflow/grants',
        icon: DollarSign,
        badge: 6,
        description: 'Funding & awards'
      },
      {
        title: 'Playbooks',
        href: '/civicflow/playbooks',
        icon: Workflow,
        description: 'Process templates'
      }
    ]
  },
  {
    title: 'Outreach',
    items: [
      {
        title: 'Communications',
        href: '/civicflow/communications',
        icon: Mail,
        description: 'Campaigns & messages'
      },
      {
        title: 'Events',
        href: '/civicflow/events',
        icon: Calendar,
        badge: 3,
        description: 'Community events'
      },
      {
        title: 'Advocacy',
        href: '/civicflow/advocacy',
        icon: Megaphone,
        description: 'Policy & campaigns'
      }
    ]
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Reports',
        href: '/civicflow/reports',
        icon: BarChart3,
        description: 'Custom reports'
      },
      {
        title: 'Integrations',
        href: '/civicflow/integrations',
        icon: Zap,
        description: 'External systems'
      },
      {
        title: 'Data Studio',
        href: '/civicflow/data',
        icon: Database,
        description: 'Data management'
      }
    ]
  }
]

const bottomNavigation: NavItem[] = [
  { title: 'Settings', href: '/civicflow/settings', icon: Settings },
  { title: 'Security', href: '/civicflow/security', icon: Shield },
  { title: 'Help & Docs', href: '/civicflow/help', icon: HelpCircle }
]

// Additional apps for the app switcher
const otherApps = [
  { title: 'Finance', href: '/finance', icon: CreditCard, color: 'from-green-500 to-emerald-500' },
  { title: 'HR Portal', href: '/hr', icon: UserCheck, color: 'from-purple-500 to-pink-500' },
  { title: 'Documents', href: '/documents', icon: FileSearch, color: 'from-orange-500 to-red-500' },
  {
    title: 'Knowledge Base',
    href: '/knowledge',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500'
  }
]

interface DemoUser {
  email: string
  role: string
  initials: string
}

export function CivicFlowSidebarEnhanced() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null)
  const [showAppSwitcher, setShowAppSwitcher] = useState(false)

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
          collapsed ? 'w-20' : 'w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header with app switcher */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <button
              onClick={() => setShowAppSwitcher(!showAppSwitcher)}
              className={cn(
                'flex items-center gap-3 transition-all duration-300 hover:opacity-80',
                collapsed && 'opacity-0 scale-90 pointer-events-none'
              )}
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent-soft flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-accent-fg" />
              </div>
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-text-100">CivicFlow</span>
                  <Layers className="h-4 w-4 text-text-500" />
                </div>
              )}
            </button>
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

          {/* App Switcher Dropdown */}
          {showAppSwitcher && !collapsed && (
            <div className="absolute top-16 left-0 right-0 bg-panel-alt border-b border-border p-4 shadow-lg">
              <div className="text-xs font-medium text-text-500 mb-3">SWITCH TO</div>
              <div className="grid grid-cols-2 gap-2">
                {otherApps.map(app => (
                  <Link
                    key={app.href}
                    href={app.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-panel transition-colors"
                  >
                    <div
                      className={cn(
                        'h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center',
                        app.color
                      )}
                    >
                      <app.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-200">{app.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-6">
            {navigationSections.map(section => (
              <div key={section.title}>
                {!collapsed && (
                  <div className="text-xs font-medium text-text-500 mb-2 px-3">
                    {section.title.toUpperCase()}
                  </div>
                )}
                <div className="space-y-1">
                  {section.items.map(item => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/civicflow' && pathname.startsWith(item.href))

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer group',
                          'hover:bg-accent-soft hover:text-accent',
                          isActive
                            ? 'bg-accent-soft text-accent shadow-sm'
                            : 'text-text-300 hover:text-text-100',
                          collapsed && 'justify-center'
                        )}
                        title={collapsed ? `${item.title}: ${item.description}` : undefined}
                      >
                        <item.icon
                          className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-accent')}
                        />
                        {!collapsed && (
                          <>
                            <div className="flex-1">
                              <span className="block">{item.title}</span>
                              {item.description && (
                                <span className="text-xs text-text-500 group-hover:text-text-400">
                                  {item.description}
                                </span>
                              )}
                            </div>
                            {item.badge && (
                              <span
                                className={cn(
                                  'px-2 py-0.5 text-xs rounded-full',
                                  isActive ? 'bg-accent text-accent-fg' : 'bg-panel text-text-300',
                                  item.badge === 'New' && 'bg-green-500/20 text-green-400'
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
                </div>
              </div>
            ))}
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
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content spacer */}
      <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-20' : 'lg:pl-72')} />
    </>
  )
}
