'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/src/lib/utils'
import { X, Grid3x3, Menu } from 'lucide-react'

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeColor?: string
}

interface UniversalSidebarProps {
  organizationName: string
  organizationId?: string
  moduleColor: {
    from: string
    to: string
  }
  moduleIcon: React.ElementType
  moduleName: string
  sidebarItems: SidebarItem[]
  allApps: SidebarItem[]
  bottomItems?: SidebarItem[]
  statusIndicators?: {
    icon: React.ElementType
    label: string
    value: string | number
    color: string
  }[]
  onNavigate?: () => void
}

// Mobile Bottom Navigation Component
const MobileBottomNav = React.memo(function MobileBottomNav({
  sidebarItems,
  isActive,
  moduleColor,
  onNavigate
}: {
  sidebarItems: SidebarItem[]
  isActive: (href: string) => boolean
  moduleColor: { from: string; to: string }
  onNavigate?: () => void
}) {
  const mainItems = sidebarItems.slice(0, 4) // Show only 4 items on mobile

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-2xl border-t border-border/20 z-40 shadow-2xl">
      <div className="grid grid-cols-4 gap-0">
        {mainItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex flex-col items-center justify-center py-3 relative',
                active
                  ? `bg-gradient-to-t ${moduleColor.from}/10 ${moduleColor.to}/10 text-gray-100`
                  : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', active ? 'text-violet-600' : 'text-muted-foreground')} />
                {item.badge && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-1 text-[8px] px-1 rounded-full text-foreground min-w-[14px] text-center',
                      item.badgeColor || 'bg-gray-600'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-1 font-medium',
                  active ? 'text-gray-100' : 'text-muted-foreground'
                )}
              >
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
})

// Apps Modal Component
const AppsModal = React.memo(function AppsModal({
  isOpen,
  onClose,
  isActive,
  allApps,
  moduleColor,
  moduleName,
  onNavigate
}: {
  isOpen: boolean
  onClose: () => void
  isActive: (href: string) => boolean
  allApps: SidebarItem[]
  moduleColor: { from: string; to: string }
  moduleName: string
  onNavigate?: () => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
    } else {
      const timeout = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-background/80 backdrop-blur-2xl border border-border/20 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/20">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                All {moduleName} Apps
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Access all your {moduleName.toLowerCase()} tools
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-background/20 transition-colors text-muted-foreground hover:text-violet-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Apps Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allApps.map(app => {
                const Icon = app.icon
                const active = isActive(app.href)

                return (
                  <Link
                    key={app.href}
                    href={app.href}
                    onClick={() => {
                      onClose()
                      if (onNavigate) onNavigate()
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 group',
                      'bg-background/50 hover:bg-background/70 backdrop-blur-sm',
                      'border border-border/20 hover:border-violet-400/30',
                      'hover:shadow-lg hover:scale-[1.02]',
                      active && 'bg-background/70 border-violet-400/50 shadow-lg'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-md',
                        'bg-gradient-to-br',
                        active
                          ? `${moduleColor.from} ${moduleColor.to}`
                          : 'from-violet-500 to-purple-600 group-hover:from-violet-600 group-hover:to-purple-700'
                      )}
                    >
                      <Icon className="h-6 w-6 text-foreground" />
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium text-center',
                        active ? 'text-violet-600' : 'text-gray-700 group-hover:text-violet-600'
                      )}
                    >
                      {app.title}
                    </span>
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
})

function UniversalSidebar({
  organizationName,
  organizationId,
  moduleColor,
  moduleIcon: ModuleIcon,
  moduleName,
  sidebarItems,
  allApps,
  bottomItems = [],
  statusIndicators = [],
  onNavigate
}: UniversalSidebarProps) {
  const pathname = usePathname()
  const [showAppsModal, setShowAppsModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = useCallback(
    (href: string) => {
      const basePath = href.split('/').slice(0, 2).join('/')
      if (pathname === href) return true
      if (pathname.startsWith(href) && href !== basePath) return true
      return false
    },
    [pathname]
  )

  const handleNavClick = useCallback(() => {
    setIsMobileMenuOpen(false)
    if (onNavigate) {
      onNavigate()
    }
  }, [onNavigate])

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-2xl border-b border-border/20 z-40 flex items-center justify-between px-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-background/20 transition-colors text-muted-foreground hover:text-violet-600"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-lg bg-gradient-to-r flex items-center justify-center',
                moduleColor.from,
                moduleColor.to
              )}
            >
              <ModuleIcon className="h-5 w-5 text-foreground" />
            </div>
            <span className="text-sm font-medium text-gray-100">{moduleName}</span>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop always visible, Mobile slide-in */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full bg-background/80 backdrop-blur-2xl border-r border-border/20 w-64 lg:w-20 z-40 shadow-2xl transition-transform duration-300',
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo Section */}
        <div className="h-20 flex flex-col items-center justify-center border-b border-border/20 bg-background/30">
          <div
            className={cn(
              'w-10 h-10 rounded-xl bg-gradient-to-r flex items-center justify-center shadow-lg',
              moduleColor.from,
              moduleColor.to
            )}
          >
            <ModuleIcon className="h-6 w-6 text-foreground" />
          </div>
          <span className="text-[10px] text-gray-700 mt-1 font-semibold">{moduleName}</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-1 pb-20 lg:pb-0">
          <div className="space-y-0">
            {sidebarItems.map(item => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center lg:flex-col lg:items-center justify-start lg:justify-center py-3 lg:py-2 px-4 lg:px-0 transition-all duration-200 group relative',
                    active
                      ? `bg-gradient-to-r ${moduleColor.from}/20 ${moduleColor.to}/20 text-gray-100 backdrop-blur-sm`
                      : 'text-gray-700 hover:text-foreground hover:bg-background/30 hover:backdrop-blur-sm'
                  )}
                >
                  <div className="relative">
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        active ? 'text-violet-600' : 'text-muted-foreground group-hover:text-violet-600'
                      )}
                    />

                    {/* Badge indicator */}
                    {item.badge && (
                      <span
                        className={cn(
                          'absolute -top-2 -right-2 text-[9px] px-1 py-0.5 rounded-full text-foreground min-w-[16px] text-center',
                          item.badgeColor || 'bg-gray-600'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Text label */}
                  <span
                    className={cn(
                      'ml-3 lg:ml-0 lg:mt-0.5 font-medium text-sm lg:text-[9px] lg:text-center leading-tight',
                      active
                        ? 'text-gray-100'
                        : 'text-muted-foreground lg:text-muted-foreground group-hover:text-foreground lg:group-hover:text-foreground'
                    )}
                  >
                    {item.title}
                  </span>

                  {/* Tooltip for desktop */}
                  <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-background text-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                    <p className="font-medium">{item.title}</p>
                    {item.badge && (
                      <p className="text-xs text-gray-300 mt-1">{item.badge} pending</p>
                    )}
                  </div>
                </Link>
              )
            })}

            {/* More Apps Button */}
            <button
              onClick={() => setShowAppsModal(true)}
              className={cn(
                'flex items-center lg:flex-col lg:items-center justify-start lg:justify-center py-3 lg:py-2 px-4 lg:px-0 w-full transition-all duration-200 group relative',
                'text-gray-700 hover:text-foreground hover:bg-background/30 hover:backdrop-blur-sm'
              )}
            >
              <Grid3x3 className="h-5 w-5 text-muted-foreground group-hover:text-violet-600" />
              <span className="ml-3 lg:ml-0 lg:mt-0.5 font-medium text-sm lg:text-[9px] lg:text-center leading-tight text-muted-foreground lg:text-muted-foreground group-hover:text-foreground lg:group-hover:text-foreground">
                More Apps
              </span>
            </button>
          </div>

          {/* Separator */}
          {bottomItems.length > 0 && <div className="my-2 mx-4 border-t border-border/20" />}

          {/* Bottom Items */}
          {bottomItems.length > 0 && (
            <div className="space-y-0">
              {bottomItems.map(item => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center lg:flex-col lg:items-center justify-start lg:justify-center py-3 lg:py-2 px-4 lg:px-0 transition-all duration-200 group relative',
                      active
                        ? `bg-gradient-to-r ${moduleColor.from}/20 ${moduleColor.to}/20 text-gray-100 backdrop-blur-sm`
                        : 'text-gray-700 hover:text-foreground hover:bg-background/30 hover:backdrop-blur-sm'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        active ? 'text-violet-600' : 'text-muted-foreground group-hover:text-violet-600'
                      )}
                    />

                    <span
                      className={cn(
                        'ml-3 lg:ml-0 lg:mt-0.5 font-medium text-sm lg:text-[9px] lg:text-center leading-tight',
                        active
                          ? 'text-gray-100'
                          : 'text-muted-foreground lg:text-muted-foreground group-hover:text-foreground lg:group-hover:text-foreground'
                      )}
                    >
                      {item.title}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </nav>

        {/* Status Indicators */}
        {statusIndicators.length > 0 && (
          <div className="p-2 lg:p-2 px-4 border-t border-border/20 bg-background/20 backdrop-blur-sm">
            <div className="space-y-2 lg:space-y-1">
              {statusIndicators.map((indicator, index) => {
                const Icon = indicator.icon
                return (
                  <div key={index} className="flex items-center justify-between px-2 lg:px-2 py-1">
                    <div className="flex items-center gap-2 lg:gap-0">
                      <Icon className={cn('h-4 lg:h-3 w-4 lg:w-3', indicator.color)} />
                      <span className="lg:hidden text-sm text-gray-700 font-medium">
                        {indicator.label}
                      </span>
                    </div>
                    <span className="text-sm lg:text-[9px] text-gray-200 lg:text-gray-700 font-semibold">
                      {indicator.value}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Organization Info - Mobile only */}
        {organizationName && (
          <div className="lg:hidden p-4 border-t border-border/20 bg-background/30">
            <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-border/20">
              <p className="text-xs text-muted-foreground mb-1">Organization</p>
              <p className="text-sm text-gray-100 font-medium truncate">{organizationName}</p>
              {organizationId && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  ID: {organizationId.slice(0, 8)}...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        sidebarItems={sidebarItems}
        isActive={isActive}
        moduleColor={moduleColor}
        onNavigate={handleNavClick}
      />

      {/* Apps Modal */}
      <AppsModal
        isOpen={showAppsModal}
        onClose={() => setShowAppsModal(false)}
        isActive={isActive}
        allApps={allApps}
        moduleColor={moduleColor}
        moduleName={moduleName}
        onNavigate={onNavigate}
      />
    </>
  )
}

export default React.memo(UniversalSidebar)
