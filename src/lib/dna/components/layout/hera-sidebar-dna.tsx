'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/src/lib/utils'
import { Button } from '@/src/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { Menu, X, Plus, Search, Activity, LucideIcon } from 'lucide-react'

export interface HeraSidebarNavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string | number
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export interface HeraSidebarApp {
  name: string
  icon: LucideIcon
  href: string
  description: string
  color: string
}

export interface HeraSidebarConfig {
  title: string
  subtitle?: string
  logo: LucideIcon
  navigation: HeraSidebarNavItem[]
  additionalApps?: HeraSidebarApp[]
  theme?: {
    primary?: string // gradient classes e.g. "from-pink-500 to-purple-600"
    sidebar?: string // gradient classes for sidebar bg
    accent?: string // accent color for active states
  }
  bottomWidget?: {
    title: string
    value: string | number
    subtitle?: string
    icon?: LucideIcon
    gradient?: string
  }
}

export interface HeraSidebarProps extends HeraSidebarConfig {
  children: React.ReactNode
  headerContent?: React.ReactNode
}

export function HeraSidebar({
  children,
  title,
  subtitle = 'Enterprise',
  logo: Logo,
  navigation,
  additionalApps = [],
  theme = {
    primary: 'from-blue-500 to-purple-600',
    sidebar: 'from-gray-900 to-gray-950',
    accent: 'from-blue-500 to-purple-600'
  },
  bottomWidget,
  headerContent
}: HeraSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAppsModal, setShowAppsModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredApps = additionalApps.filter(
    app =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isActive = (href: string) => {
    if (href === navigation[0]?.href) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-muted dark:bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b border-r border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          theme.sidebar,
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div
                className={cn(
                  'w-10 h-10 bg-gradient-to-br rounded-full flex items-center justify-center shadow-lg',
                  theme.primary
                )}
              >
                <Logo className="w-6 h-6 text-foreground" />
              </div>
              {bottomWidget && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-100">{title}</h2>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted text-gray-300 hover:text-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4 flex-1 overflow-y-auto" data-testid="hera-sidebar-nav">
          <div className="space-y-1">
            {navigation.map(item => {
              const active = isActive(item.href)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                    active
                      ? cn('bg-gradient-to-r text-foreground shadow-lg', theme.accent)
                      : 'text-gray-300 hover:text-gray-100 hover:bg-muted'
                  )}
                >
                  <div
                    className={cn(
                      'mr-3 p-1.5 rounded-md transition-all duration-200',
                      active ? 'bg-background/20' : 'bg-muted group-hover:bg-muted-foreground/10'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 transition-all duration-200',
                        active ? 'text-foreground' : 'text-muted-foreground group-hover:text-gray-200'
                      )}
                    />
                  </div>
                  {item.name}
                  {item.badge && (
                    <Badge variant={item.badgeVariant || 'default'} className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}

            {/* Plus button for more apps */}
            {additionalApps.length > 0 && (
              <button
                onClick={() => setShowAppsModal(true)}
                className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-300 hover:text-gray-100 hover:bg-muted w-full"
              >
                <div className="mr-3 p-1.5 rounded-md transition-all duration-200 bg-muted group-hover:bg-muted-foreground/10">
                  <Plus className="h-4 w-4 transition-all duration-200 text-muted-foreground group-hover:text-gray-200" />
                </div>
                More Apps
              </button>
            )}
          </div>
        </nav>

        {/* Bottom Widget */}
        {bottomWidget && (
          <div className="absolute bottom-6 left-4 right-4">
            <div
              className={cn(
                'bg-gradient-to-r rounded-lg p-4 text-foreground shadow-lg',
                bottomWidget.gradient || theme.primary
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{bottomWidget.title}</span>
                {bottomWidget.icon && (
                  <div className="p-1 bg-background/20 rounded">
                    <bottomWidget.icon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold">{bottomWidget.value}</div>
              {bottomWidget.subtitle && (
                <div className="text-xs opacity-90 mt-1">{bottomWidget.subtitle}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background dark:bg-background border-b border-border dark:border-gray-800">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted dark:hover:bg-muted"
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>

            {headerContent || (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block">
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">{title}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Apps Modal */}
      {additionalApps.length > 0 && (
        <Dialog open={showAppsModal} onOpenChange={setShowAppsModal}>
          <DialogContent className="max-w-3xl bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-100">
                {title} Applications
              </DialogTitle>
            </DialogHeader>

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search apps..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted border-border text-gray-100 placeholder-gray-500"
              />
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {filteredApps.map(app => (
                <button
                  key={app.name}
                  onClick={() => {
                    router.push(app.href)
                    setShowAppsModal(false)
                    setSidebarOpen(false)
                  }}
                  className="group p-4 bg-muted hover:bg-muted-foreground/10 rounded-lg transition-all duration-200 text-left border border-border hover:border-border"
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3',
                      app.color
                    )}
                  >
                    <app.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-gray-100 group-hover:text-foreground">{app.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{app.description}</p>
                </button>
              ))}
            </div>

            {filteredApps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No apps found matching "{searchQuery}"
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Export as HERA DNA Component
export const HERA_SIDEBAR_DNA = {
  id: 'HERA.UI.LAYOUT.SIDEBAR.v1',
  name: 'HERA Universal Sidebar',
  description: 'Reusable sidebar layout with navigation, apps modal, and customizable theming',
  component: HeraSidebar,
  category: 'layout',
  subcategory: 'navigation',
  tags: ['sidebar', 'navigation', 'layout', 'apps', 'universal'],
  version: '1.0.0',
  author: 'HERA Team',
  features: [
    'Responsive sidebar navigation',
    'Mobile-friendly with backdrop',
    'Apps modal with search',
    'Customizable theming',
    'Bottom widget support',
    'Badge support for nav items',
    'Active state detection',
    'Header content customization'
  ],
  usage: `
import { HeraSidebar } from '@/src/lib/dna/components/layout/hera-sidebar-dna'
import { LayoutDashboard, Package, DollarSign } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Inventory', href: '/app/inventory', icon: Package, badge: '3' },
  { name: 'Financial', href: '/app/financial', icon: DollarSign, badge: 'New', badgeVariant: 'secondary' },
]

const additionalApps = [
  {
    name: 'Analytics',
    icon: BarChart3,
    href: '/app/analytics',
    description: 'Business insights',
    color: 'from-blue-500 to-cyan-600'
  }
]

<HeraSidebar
  title="My Business"
  subtitle="ERP System"
  logo={Building}
  navigation={navigation}
  additionalApps={additionalApps}
  theme={{
    primary: 'from-blue-500 to-purple-600',
    sidebar: 'from-gray-900 to-gray-950',
    accent: 'from-blue-500 to-purple-600'
  }}
  bottomWidget={{
    title: "Today's Revenue",
    value: "$12,345",
    subtitle: "+15% from yesterday",
    icon: TrendingUp,
    gradient: 'from-green-500 to-emerald-600'
  }}
>
  {children}
</HeraSidebar>
  `
}
