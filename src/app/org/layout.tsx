'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Building2,
  ChevronDown,
  LogOut,
  Settings,
  Users,
  Package,
  Home,
  Menu,
  X
} from 'lucide-react'
import Link from 'next/link'

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { currentOrganization, organizations, user, logout, switchOrganization, isLoading } =
    useHERAAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Get subdomain from header
  const [subdomain, setSubdomain] = useState<string | null>(null)

  useEffect(() => {
    // Extract subdomain from URL in client component
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const pathname = window.location.pathname

      // Development: check for /~subdomain pattern on localhost
      if (hostname === 'localhost' && pathname.startsWith('/~')) {
        const match = pathname.match(/^\/~([^\/]+)/)
        setSubdomain(match ? match[1] : null)
      }
      // Development: check for *.lvh.me domains
      else if (hostname.endsWith('.lvh.me')) {
        setSubdomain(hostname.split('.')[0])
      }
      // Development: check for *.localhost domains
      else if (hostname.endsWith('.localhost')) {
        setSubdomain(hostname.split('.')[0])
      }
      // Production: check for *.heraerp.com domains
      else if (hostname.endsWith('.heraerp.com') && hostname !== 'app.heraerp.com') {
        setSubdomain(hostname.split('.')[0])
      }
      // Fallback: extract from current organization if available
      else if (currentOrganization?.subdomain) {
        setSubdomain(currentOrganization.subdomain)
      }
    }
  }, [pathname, currentOrganization])

  // Redirect to appropriate app based on organization type
  useEffect(() => {
    if (!isLoading && currentOrganization && !isRedirecting) {
      // Check if we're at the root org path
      const isOrgRoot =
        pathname === '/org' ||
        pathname === `/~${currentOrganization.subdomain}` ||
        pathname === `/~${currentOrganization.subdomain}/`

      if (isOrgRoot) {
        setIsRedirecting(true)

        // For salons, go directly to salon app
        if (currentOrganization.type === 'salon') {
          if (subdomain) {
            router.push(`/~${subdomain}/salon`)
          } else {
            router.push('/org/salon')
          }
        } else if (currentOrganization.type === 'restaurant') {
          if (subdomain) {
            router.push(`/~${subdomain}/restaurant`)
          } else {
            router.push('/org/restaurant')
          }
        } else {
          // For other types, show the generic org dashboard
          setIsRedirecting(false)
        }
      }
    }
  }, [currentOrganization, isLoading, pathname, router, isRedirecting, subdomain])

  if (!currentOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading organization...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/apps', label: 'Apps', icon: Package },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-background shadow-sm border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Org Name */}
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-muted-foreground hover:text-muted-foreground hover:bg-muted"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              <div className="flex items-center ml-4 md:ml-0">
                <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center mr-3">
                  <span className="text-sm font-bold text-foreground">H</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-100">
                    {currentOrganization.name}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {currentOrganization.subdomain}.heraerp.com
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map(item => {
                const Icon = item.icon
                const href = subdomain ? `/~${subdomain}${item.href}` : `/org${item.href}`
                const isActive = pathname === href

                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                      isActive ? 'text-primary' : 'text-gray-700 hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Organization Switcher */}
              {organizations.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Switch Org</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {organizations.map(org => (
                      <DropdownMenuItem
                        key={org.id}
                        onClick={() => switchOrganization(org.id)}
                        className={org.id === currentOrganization.id ? 'bg-muted' : ''}
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        <div className="flex-1">
                          <div className="font-medium">{org.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {org.subdomain}.heraerp.com
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <div className="font-medium">{user?.name || 'User'}</div>
                      <div className="text-xs text-muted-foreground">{user?.email}</div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(`/~${subdomain}/settings/profile`)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon
                const href = subdomain ? `/~${subdomain}${item.href}` : `/org${item.href}`
                const isActive = pathname === href

                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'text-primary bg-blue-50'
                        : 'text-gray-700 hover:text-foreground hover:bg-muted'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
