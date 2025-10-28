'use client'

/**
 * Greenworms ERP - Enterprise Navigation Bar
 * SAP S/4HANA inspired design with Greenworms branding
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Leaf,
  Menu,
  X,
  Bell,
  User,
  Settings,
  Search,
  ChevronDown,
  Globe,
  LogOut,
  Users,
  Truck,
  MapPin,
  Route,
  UserCheck,
  Building2,
  Calculator,
  BarChart3,
  Package2
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<any>
  badge?: string
  children?: NavItem[]
}

export default function GreenwormNavbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const navigationItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/greenworms',
      icon: BarChart3
    },
    {
      title: 'Operations',
      href: '#',
      icon: Truck,
      children: [
        { title: 'Customers', href: '/greenworms/customers', icon: Users },
        { title: 'Contracts', href: '/greenworms/waste-management/contracts', icon: Package2 },
        { title: 'Routes', href: '/greenworms/waste-management/routes', icon: Route },
        { title: 'Locations', href: '/greenworms/waste-management/locations', icon: MapPin }
      ]
    },
    {
      title: 'Fleet',
      href: '#',
      icon: Truck,
      children: [
        { title: 'Vehicles', href: '/greenworms/fleet-management/vehicles', icon: Truck },
        { title: 'Maintenance', href: '/greenworms/fleet-management/maintenance', icon: Settings }
      ]
    },
    {
      title: 'Workforce',
      href: '#',
      icon: UserCheck,
      children: [
        { title: 'Staff', href: '/greenworms/waste-management/staff', icon: UserCheck },
        { title: 'Schedules', href: '/greenworms/workforce/schedules', icon: BarChart3 }
      ]
    },
    {
      title: 'Finance',
      href: '#',
      icon: Calculator,
      children: [
        { title: 'Vendors', href: '/enterprise/procurement/purchasing-rebates/vendors', icon: Building2 },
        { title: 'Accounts', href: '/crm/accounts', icon: Calculator }
      ]
    }
  ]

  const isActive = (href: string) => {
    if (href === '/greenworms') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left Section - Logo & Navigation */}
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              {/* Logo */}
              <Link href="/greenworms" className="flex items-center px-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mr-3">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-xl font-bold text-gray-900">Greenworms</div>
                  <div className="text-xs text-gray-500 -mt-1">ERP Platform</div>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex lg:space-x-1 lg:ml-8">
                {navigationItems.map((item) => (
                  <div key={item.title} className="relative">
                    {item.children ? (
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === item.title ? null : item.title)}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            item.children.some(child => isActive(child.href))
                              ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                              : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                          }`}
                        >
                          <item.icon className="w-4 h-4 mr-2" />
                          {item.title}
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdown === item.title && (
                          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setActiveDropdown(null)}
                                className={`flex items-center px-4 py-2 text-sm transition-colors ${
                                  isActive(child.href)
                                    ? 'bg-green-50 text-green-700 border-r-4 border-green-500'
                                    : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                                }`}
                              >
                                <child.icon className="w-4 h-4 mr-3" />
                                {child.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive(item.href)
                            ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                            : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                        }`}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.title}
                        {item.badge && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Section - Search & User Menu */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-green-700" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">team@hanaset.com</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* User Dropdown */}
                {activeDropdown === 'user' && (
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">team@hanaset.com</div>
                      <div className="text-xs text-gray-500">Administrator</div>
                    </div>
                    <Link href="/greenworms/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">
                      <User className="w-4 h-4 mr-3" />
                      Profile
                    </Link>
                    <Link href="/greenworms/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-100 mt-1">
                      <Link href="/greenworms/login" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700">
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-2 space-y-1">
              {navigationItems.map((item) => (
                <div key={item.title}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === `mobile-${item.title}` ? null : `mobile-${item.title}`)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md"
                      >
                        <div className="flex items-center">
                          <item.icon className="w-4 h-4 mr-3" />
                          {item.title}
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {activeDropdown === `mobile-${item.title}` && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                isActive(child.href)
                                  ? 'bg-green-50 text-green-700'
                                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
                              }`}
                            >
                              <child.icon className="w-4 h-4 mr-3" />
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive(item.href)
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                      }`}
                    >
                      <item.icon className="w-4 h-4 mr-3" />
                      {item.title}
                      {item.badge && (
                        <span className="ml-auto px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Click outside to close dropdowns */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </>
  )
}