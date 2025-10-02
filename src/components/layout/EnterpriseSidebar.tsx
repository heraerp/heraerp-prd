// ================================================================================
// HERA ENTERPRISE SIDEBAR
// Smart Code: HERA.SIDEBAR.ENTERPRISE.v1
// Modern dark sidebar for multi-app navigation
// ================================================================================

'use client'

import React, { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/session'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import {
  Building2,
  Grid3X3,
  Activity,
  ChevronRight,
  Plus,
  Settings,
  Users,
  Shield,
  Sparkles,
  TrendingUp,
  Calendar,
  Bell,
  Loader2,
  Package,
  DollarSign,
  BarChart3,
  Store,
  Scissors,
  ShoppingBag,
  Factory,
  Stethoscope,
  Database,
  FileText,
  HelpCircle,
  LogOut,
  X,
  Home,
  Briefcase,
  Code2,
  Brain,
  ChevronDown,
  CreditCard
} from 'lucide-react'

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeColor?: string
  requiresApp?: string
  comingSoon?: boolean
}

// Main sidebar items (compact view)
const mainSidebarItems: SidebarItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: Home },
  { title: 'Organizations', href: '/organizations', icon: Building2 },
  { title: 'Apps', href: '/apps', icon: Grid3X3, badge: 'NEW', badgeColor: 'bg-emerald-500' },
  { title: 'Analytics', href: '/analytics', icon: BarChart3 },
  { title: 'Settings', href: '/settings', icon: Settings }
]

// All available apps for the modal
const allApps: SidebarItem[] = [
  // Business Apps
  { title: 'Salon Manager', href: '/salon', icon: Scissors, requiresApp: 'salon' },
  { title: 'Restaurant POS', href: '/restaurant', icon: Store, requiresApp: 'restaurant' },
  { title: 'Retail Suite', href: '/retail', icon: ShoppingBag, requiresApp: 'retail' },
  { title: 'Manufacturing', href: '/furniture', icon: Factory, requiresApp: 'manufacturing' },
  {
    title: 'Healthcare',
    href: '/healthcare',
    icon: Stethoscope,
    requiresApp: 'healthcare',
    comingSoon: true
  },

  // Finance & Accounting
  { title: 'Finance Hub', href: '/finance', icon: DollarSign, requiresApp: 'finance' },
  { title: 'Accounting', href: '/accounting', icon: FileText, requiresApp: 'accounting' },
  { title: 'Payroll', href: '/payroll', icon: CreditCard, requiresApp: 'payroll' },

  // Operations
  { title: 'Inventory', href: '/inventory', icon: Package, requiresApp: 'inventory' },
  { title: 'Products → Categories', href: '/product/categories', icon: Package },
  { title: 'CRM', href: '/crm', icon: Users, requiresApp: 'crm' },
  { title: 'HR Management', href: '/hr', icon: Briefcase, requiresApp: 'hr' },

  // Advanced Features
  { title: 'AI Assistant', href: '/ai', icon: Brain, requiresApp: 'ai' },
  { title: 'Universal API', href: '/api-explorer', icon: Code2, requiresApp: 'api' },
  { title: 'Automation', href: '/automation', icon: Activity, requiresApp: 'automation' }
]

// Navigation Link Component
const NavigationLink: React.FC<{
  href: string
  icon: React.ElementType
  title: string
  badge?: string
  badgeColor?: string
  active: boolean
  onClick?: () => void
}> = ({ href, icon: Icon, title, badge, badgeColor, active, onClick }) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center lg:flex-col lg:items-center justify-center py-3 lg:py-2 px-4 lg:px-0 w-full transition-all duration-300 group relative',
        active ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="ml-3 lg:ml-0 lg:mt-0.5 font-medium text-sm lg:text-[9px] lg:text-center leading-tight">
        {title}
      </span>
      {badge && (
        <span
          className={cn(
            'absolute top-1 right-1 lg:top-0 lg:right-0 text-[9px] font-bold px-1.5 py-0.5 rounded',
            badgeColor || 'bg-blue-500',
            'text-white'
          )}
        >
          {badge}
        </span>
      )}

      {/* Tooltip - desktop only */}
      <div className="hidden lg:block absolute left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
        <p className="font-medium">{title}</p>
      </div>
    </Link>
  )
}

// Apps Modal Component
const AppsModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  isAppInstalled: (appId: string) => boolean
}> = ({ isOpen, onClose, isAppInstalled }) => {
  if (!isOpen) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
          {/* Modal Header */}
          <div className="bg-gray-800 flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-white">All Applications</h2>
              <p className="text-sm ink-muted mt-1">Access all your business applications</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors ink-muted hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Apps Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allApps.map(app => {
                const Icon = app.icon
                const installed = !app.requiresApp || isAppInstalled(app.requiresApp)

                return (
                  <Link
                    key={app.href}
                    href={installed && !app.comingSoon ? app.href : '#'}
                    onClick={() => {
                      if (installed && !app.comingSoon) {
                        onClose()
                      }
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 group',
                      installed && !app.comingSoon
                        ? 'bg-gray-700/50 hover:bg-gray-700 hover:scale-105 cursor-pointer'
                        : 'bg-gray-800/50 opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-200',
                        installed && !app.comingSoon
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500'
                          : 'bg-gray-700'
                      )}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-center text-gray-300">
                      {app.title}
                    </span>
                    {app.comingSoon && (
                      <span className="text-[9px] bg-yellow-600/20 text-yellow-500 px-2 py-0.5 rounded mt-1">
                        SOON
                      </span>
                    )}
                    {!installed && !app.comingSoon && (
                      <span className="text-[9px] bg-gray-600 ink-muted px-2 py-0.5 rounded mt-1">
                        NOT INSTALLED
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

interface EnterpriseSidebarProps {
  onNavigate?: () => void
}

export function EnterpriseSidebar({ onNavigate }: EnterpriseSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { currentOrganization, organizations, switchOrganization, isAppInstalled } =
    useOrganization()
  const [showAppsModal, setShowAppsModal] = useState(false)
  const [showOrgDropdown, setShowOrgDropdown] = useState(false)

  const isActive = useCallback(
    (href: string) => {
      if (href === '/dashboard' && pathname === '/dashboard') return true
      if (href !== '/dashboard' && pathname.startsWith(href)) return true
      return false
    },
    [pathname]
  )

  const handleNavClick = useCallback(() => {
    if (onNavigate) {
      onNavigate()
    }
  }, [onNavigate])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="h-full w-72 lg:w-20 flex flex-col overflow-hidden border-r border-gray-800 bg-gray-900">
      {/* Logo Section */}
      <div className="h-16 lg:h-20 flex items-center justify-center px-4 lg:px-0 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3 lg:flex-col lg:gap-1 lg:items-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="lg:hidden">
            <h3 className="text-white font-semibold">HERA Enterprise</h3>
            <p className="text-xs ink-muted">Universal ERP</p>
          </div>
          <span className="hidden lg:block text-[10px] ink-muted font-medium text-center">
            HERA
          </span>
        </div>
      </div>

      {/* Organization Selector - Mobile/Tablet only */}
      <div className="lg:hidden border-b border-gray-800 p-4">
        <button
          onClick={() => setShowOrgDropdown(!showOrgDropdown)}
          className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 ink-muted" />
            <div className="text-left">
              <p className="text-sm font-medium text-white">{currentOrganization?.name}</p>
              <p className="text-xs ink-muted capitalize">{currentOrganization?.role}</p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform',
              showOrgDropdown && 'rotate-180'
            )}
          />
        </button>

        {showOrgDropdown && (
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {organizations.map(org => (
              <button
                key={org.id}
                onClick={() => {
                  switchOrganization(org.id)
                  setShowOrgDropdown(false)
                }}
                className={cn(
                  'w-full text-left p-2 rounded transition-colors',
                  currentOrganization?.id === org.id
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'hover:bg-gray-800 text-gray-300'
                )}
              >
                <p className="text-sm font-medium">{org.name}</p>
                <p className="text-xs capitalize">{org.role}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        <div className="space-y-0">
          {mainSidebarItems.map(item => {
            const active = isActive(item.href)
            return (
              <NavigationLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                title={item.title}
                badge={item.badge}
                badgeColor={item.badgeColor}
                active={active}
                onClick={handleNavClick}
              />
            )
          })}

          {/* More Apps Button */}
          <button
            onClick={() => setShowAppsModal(true)}
            className={cn(
              'flex items-center lg:flex-col lg:items-center justify-center py-3 lg:py-2 px-4 lg:px-0 w-full transition-all duration-300 group relative',
              'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Grid3X3 className="h-5 w-5" />
            <span className="ml-3 lg:ml-0 lg:mt-0.5 font-medium text-sm lg:text-[9px] lg:text-center leading-tight">
              All Apps
            </span>
            {/* Tooltip - desktop only */}
            <div className="hidden lg:block absolute left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
              <p className="font-medium">Browse All Apps</p>
            </div>
          </button>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-gray-800 flex-shrink-0">
        {/* User Info - Mobile/Tablet only */}
        <div className="lg:hidden p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs ink-muted">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            'flex items-center justify-center gap-3 lg:gap-1 lg:flex-col',
            'w-full px-4 py-4 lg:py-3',
            'bg-red-900/20 hover:bg-red-700/30',
            'text-red-400 hover:text-red-300',
            'border-t border-red-800/30',
            'transition-all duration-200',
            'group relative'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium text-sm lg:text-[10px] lg:text-center">Logout</span>
          {/* Tooltip - desktop only */}
          <div className="hidden lg:block absolute left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
            <p className="font-medium">Sign Out</p>
          </div>
        </button>
      </div>

      {/* Apps Modal Portal */}
      <AppsModal
        isOpen={showAppsModal}
        onClose={() => setShowAppsModal(false)}
        isAppInstalled={isAppInstalled}
      />
    </div>
  )
}
