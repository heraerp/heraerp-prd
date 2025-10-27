'use client'

/**
 * Enterprise Context-Aware Navbar
 * Smart Code: HERA.ENTERPRISE.NAVBAR.v1
 * 
 * Dynamic navbar that adapts based on current page context with dropdown menus
 */

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Search, 
  Settings, 
  Bell, 
  HelpCircle, 
  ChevronLeft, 
  ChevronDown,
  Home,
  ShoppingCart,
  Users,
  Target,
  UserPlus,
  BarChart3,
  Building2,
  Phone,
  Mail,
  Calendar,
  Star,
  Award,
  TrendingUp,
  Menu,
  X
} from 'lucide-react'

export interface NavMenuItem {
  id: string
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
}

export interface NavDropdown {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  items: NavMenuItem[]
}

export interface EnterpriseNavbarProps {
  title?: string
  breadcrumb?: string
  showBack?: boolean
  onBack?: () => void
  userInitials?: string
  userAvatar?: string
  showSearch?: boolean
  onSearchChange?: (query: string) => void
}

// Define navigation menus based on context
const getContextualNavigation = (pathname: string): NavDropdown[] => {
  if (pathname.includes('/enterprise/sales/crm')) {
    return [
      {
        id: 'crm-main',
        label: 'CRM',
        icon: Target,
        items: [
          { id: 'crm-dashboard', label: 'CRM Dashboard', href: '/demo-org/00000000-0000-0000-0000-000000000001/crm-sales/dashboard', icon: BarChart3 },
          { id: 'crm-leads', label: 'Lead Management', href: '/enterprise/sales/crm/leads', icon: UserPlus },
          { id: 'crm-opportunities', label: 'Opportunities', href: '/enterprise/sales/crm/opportunities', icon: Target },
          { id: 'crm-customers', label: 'Customers', href: '/enterprise/sales/crm/customers', icon: Users }
        ]
      },
      {
        id: 'sales-main',
        label: 'Sales',
        icon: ShoppingCart,
        items: [
          { id: 'sales-home', label: 'Sales Home', href: '/enterprise/sales/home', icon: Home },
          { id: 'sales-orders', label: 'Sales Orders', href: '/enterprise/sales/orders/manage', icon: ShoppingCart },
          { id: 'sales-quotes', label: 'Quotations', href: '/enterprise/sales/quotations', icon: Building2 },
          { id: 'sales-analytics', label: 'Sales Analytics', href: '/enterprise/sales/analytics', icon: BarChart3 }
        ]
      },
      {
        id: 'activities',
        label: 'Activities',
        icon: Calendar,
        items: [
          { id: 'activities-calls', label: 'Calls', href: '/enterprise/sales/crm/activities/calls', icon: Phone },
          { id: 'activities-meetings', label: 'Meetings', href: '/enterprise/sales/crm/activities/meetings', icon: Calendar },
          { id: 'activities-emails', label: 'Emails', href: '/enterprise/sales/crm/activities/emails', icon: Mail },
          { id: 'activities-tasks', label: 'Tasks', href: '/enterprise/sales/crm/activities/tasks', icon: Star }
        ]
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: BarChart3,
        items: [
          { id: 'reports-pipeline', label: 'Pipeline Reports', href: '/enterprise/sales/crm/reports/pipeline', icon: TrendingUp },
          { id: 'reports-performance', label: 'Performance', href: '/enterprise/sales/crm/reports/performance', icon: Award },
          { id: 'reports-forecasting', label: 'Forecasting', href: '/enterprise/sales/crm/reports/forecasting', icon: TrendingUp },
          { id: 'reports-analytics', label: 'Advanced Analytics', href: '/enterprise/sales/crm/reports/analytics', icon: BarChart3 }
        ]
      }
    ]
  } else if (pathname.includes('/enterprise/sales')) {
    return [
      {
        id: 'sales-main',
        label: 'Sales',
        icon: ShoppingCart,
        items: [
          { id: 'sales-home', label: 'Sales Home', href: '/enterprise/sales/home', icon: Home },
          { id: 'sales-orders', label: 'Sales Orders', href: '/enterprise/sales/orders/manage', icon: ShoppingCart, badge: '2.04K' },
          { id: 'sales-quotes', label: 'Quotations', href: '/enterprise/sales/quotations', icon: Building2, badge: '1.09K' },
          { id: 'sales-analytics', label: 'Sales Analytics', href: '/enterprise/sales/analytics', icon: BarChart3 }
        ]
      },
      {
        id: 'crm-main',
        label: 'CRM',
        icon: Target,
        items: [
          { id: 'crm-dashboard', label: 'CRM Dashboard', href: '/demo-org/00000000-0000-0000-0000-000000000001/crm-sales/dashboard', icon: BarChart3, badge: 'Hot' },
          { id: 'crm-leads', label: 'Lead Management', href: '/enterprise/sales/crm/leads', icon: UserPlus },
          { id: 'crm-opportunities', label: 'Opportunities', href: '/enterprise/sales/crm/opportunities', icon: Target },
          { id: 'crm-customers', label: 'Customers', href: '/enterprise/sales/crm/customers', icon: Users }
        ]
      }
    ]
  } else if (pathname.includes('/enterprise')) {
    return [
      {
        id: 'modules',
        label: 'Modules',
        icon: Home,
        items: [
          { id: 'enterprise-home', label: 'Enterprise Home', href: '/enterprise/home', icon: Home },
          { id: 'finance', label: 'Finance', href: '/enterprise/finance/home', icon: BarChart3 },
          { id: 'sales', label: 'Sales & CRM', href: '/enterprise/sales/home', icon: ShoppingCart },
          { id: 'salon', label: 'Salon Management', href: '/salon', icon: Star }
        ]
      }
    ]
  }
  
  return []
}

function DropdownMenu({ dropdown, isActive }: { dropdown: NavDropdown; isActive: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const IconComponent = dropdown.icon

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded border-none text-white cursor-pointer transition-colors ${
          isActive ? 'bg-white/30' : 'bg-white/20 hover:bg-white/30'
        }`}
      >
        {IconComponent && <IconComponent className="w-4 h-4" />}
        <span className="text-sm font-medium">{dropdown.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {dropdown.items.map((item) => {
            const ItemIcon = item.icon
            const isItemActive = pathname === item.href
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isItemActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {ItemIcon && <ItemIcon className="w-4 h-4" />}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    item.badge === 'Hot' ? 'bg-red-100 text-red-700' :
                    typeof item.badge === 'number' && item.badge > 1000 ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function EnterpriseNavbar({
  title = "HERA",
  breadcrumb = "",
  showBack = true,
  onBack,
  userInitials = "EG",
  userAvatar,
  showSearch = true,
  onSearchChange
}: EnterpriseNavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  
  const navigationMenus = getContextualNavigation(pathname)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearchChange?.(query)
  }

  // Determine if any menu is active
  const getActiveMenu = () => {
    return navigationMenus.find(menu => 
      menu.items.some(item => pathname === item.href)
    )?.id
  }

  const activeMenuId = getActiveMenu()

  return (
    <>
      <header className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] h-12 border-b border-white/20 fixed top-0 left-0 right-0 z-50 flex items-center px-4 shadow-md">
        <div className="w-full flex items-center justify-between">
          {/* Left side - Back button, Logo and Breadcrumb */}
          <div className="flex items-center">
            {showBack && (
              <button 
                onClick={onBack}
                className="w-8 h-8 rounded border-none bg-white/20 text-white flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors mr-3"
                title="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            
            <Link href="/enterprise/home" className="flex items-center text-white no-underline">
              <div className="h-7 bg-white rounded px-2 flex items-center justify-center font-bold text-xs text-[#4A90E2] min-w-[40px]">
                {title}
              </div>
            </Link>
            
            {breadcrumb && (
              <div className="text-white text-sm font-normal ml-4 flex items-center">
                <span className="hidden sm:inline">{breadcrumb}</span>
              </div>
            )}
          </div>

          {/* Center - Navigation Menus (Desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            {navigationMenus.map((menu) => (
              <DropdownMenu 
                key={menu.id} 
                dropdown={menu} 
                isActive={activeMenuId === menu.id}
              />
            ))}
          </div>

          {/* Right side - Search and Actions */}
          <div className="flex items-center gap-2">
            {showSearch && (
              <div className="relative hidden xl:block mr-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search CRM..."
                  className="w-48 px-3 py-1.5 bg-white/30 border border-white/40 rounded text-white placeholder-white/70 text-sm transition-all focus:outline-none focus:bg-white/40 focus:border-white/50"
                />
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
              </div>
            )}
            
            <button className="w-8 h-8 rounded border-none bg-white/20 text-white flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors" title="Search">
              <Search className="w-4 h-4" />
            </button>
            
            <button className="hidden md:flex w-8 h-8 rounded border-none bg-white/20 text-white items-center justify-center cursor-pointer hover:bg-white/30 transition-colors" title="Help">
              <HelpCircle className="w-4 h-4" />
            </button>
            
            <button className="hidden md:flex w-8 h-8 rounded border-none bg-white/20 text-white items-center justify-center cursor-pointer hover:bg-white/30 transition-colors" title="Notifications">
              <Bell className="w-4 h-4" />
            </button>
            
            <button className="hidden md:flex w-8 h-8 rounded border-none bg-white/20 text-white items-center justify-center cursor-pointer hover:bg-white/30 transition-colors" title="Settings">
              <Settings className="w-4 h-4" />
            </button>

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden w-8 h-8 rounded border-none bg-white/20 text-white flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            
            {/* User Avatar */}
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white border-2 border-white/30 cursor-pointer hover:scale-105 hover:border-white/50 transition-all ml-1">
              {userAvatar ? (
                <img src={userAvatar} alt="User" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xs font-medium">{userInitials}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-12 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40">
          <div className="max-h-96 overflow-y-auto">
            {navigationMenus.map((menu) => {
              const MenuIcon = menu.icon
              return (
                <div key={menu.id} className="border-b border-gray-100 last:border-b-0">
                  <div className="px-4 py-3 bg-gray-50 flex items-center gap-2">
                    {MenuIcon && <MenuIcon className="w-4 h-4 text-gray-600" />}
                    <span className="font-medium text-gray-900">{menu.label}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {menu.items.map((item) => {
                      const ItemIcon = item.icon
                      const isItemActive = pathname === item.href
                      
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                            isItemActive 
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {ItemIcon && <ItemIcon className="w-4 h-4" />}
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              item.badge === 'Hot' ? 'bg-red-100 text-red-700' :
                              typeof item.badge === 'number' && item.badge > 1000 ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}