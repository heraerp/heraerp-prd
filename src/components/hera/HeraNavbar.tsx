'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Search, Menu, Bell, User, Settings, 
  ChevronDown, Home, ArrowLeft 
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<any>
}

export interface HeraNavbarProps {
  title?: string
  breadcrumbs?: BreadcrumbItem[]
  showSearch?: boolean
  searchPlaceholder?: string
  onSearchChange?: (query: string) => void
  actions?: React.ReactNode
  showBackButton?: boolean
  onBack?: () => void
}

export function HeraNavbar({
  title = 'HERA Enterprise',
  breadcrumbs = [],
  showSearch = true,
  searchPlaceholder = 'Search...',
  onSearchChange,
  actions,
  showBackButton = false,
  onBack
}: HeraNavbarProps) {
  const pathname = usePathname()
  const { organization, user } = useHERAAuth()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearchChange?.(query)
  }

  return (
    <header className="hera-navbar sticky top-0 z-50">
      <div className="max-w-full px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Left Section - Logo, Back Button, Title, Breadcrumbs */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* HERA Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block hera-font-primary">
                HERA
              </span>
            </Link>

            {/* Back Button */}
            {showBackButton && (
              <button
                onClick={onBack || (() => window.history.back())}
                className="hera-btn-ghost !border-white/30 !text-white hover:!bg-white/20 p-2"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {/* Title and Breadcrumbs */}
            <div className="flex items-center gap-2 min-w-0">
              {breadcrumbs.length > 0 ? (
                <nav className="flex items-center gap-2 text-sm hera-font-primary">
                  {breadcrumbs.map((item, index) => {
                    const IconComponent = item.icon
                    const isLast = index === breadcrumbs.length - 1
                    
                    return (
                      <React.Fragment key={index}>
                        {index > 0 && (
                          <ChevronDown className="w-3 h-3 text-white/60 rotate-[-90deg]" />
                        )}
                        {item.href && !isLast ? (
                          <Link 
                            href={item.href}
                            className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
                          >
                            {IconComponent && <IconComponent className="w-3 h-3" />}
                            <span className="truncate max-w-32">{item.label}</span>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-1 text-white font-medium">
                            {IconComponent && <IconComponent className="w-3 h-3" />}
                            <span className="truncate max-w-48">{item.label}</span>
                          </div>
                        )}
                      </React.Fragment>
                    )
                  })}
                </nav>
              ) : (
                <h1 className="text-white font-semibold text-lg hera-font-primary truncate">
                  {title}
                </h1>
              )}
            </div>
          </div>

          {/* Center Section - Search */}
          {showSearch && (
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={searchPlaceholder}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-10 py-2.5 text-white placeholder-white/60 focus:bg-white/15 focus:border-white/40 focus:outline-none transition-all hera-font-primary text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      onSearchChange?.('')
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Section - Actions, Notifications, User Menu */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Custom Actions */}
            {actions}

            {/* Mobile Search */}
            {showSearch && (
              <button className="hera-btn-ghost !border-white/30 !text-white hover:!bg-white/20 p-2 md:hidden">
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Notifications */}
            <button className="hera-btn-ghost !border-white/30 !text-white hover:!bg-white/20 p-2 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full"></span>
            </button>

            {/* Organization Context */}
            {organization && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {organization.name?.charAt(0) || 'O'}
                  </span>
                </div>
                <span className="text-white text-sm hera-font-primary font-medium truncate max-w-24">
                  {organization.name || 'Organization'}
                </span>
              </div>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/15 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-white text-sm hera-font-primary font-medium hidden sm:block">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className={`w-3 h-3 text-white/80 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-xl z-50 hera-animate-scale-in">
                    <div className="p-3 border-b border-gray-100">
                      <div className="font-medium text-gray-900 hera-font-primary">
                        {user?.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-gray-500 hera-font-primary">
                        {user?.email}
                      </div>
                      {organization && (
                        <div className="text-xs text-gray-500 hera-font-primary mt-1">
                          {organization.name}
                        </div>
                      )}
                    </div>
                    <div className="p-1">
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg hera-font-primary"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          // Handle logout
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg hera-font-primary"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <button className="hera-btn-ghost !border-white/30 !text-white hover:!bg-white/20 p-2 lg:hidden">
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}