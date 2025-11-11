'use client'

/**
 * Universal Sidebar Navigation
 * Smart Code: HERA.UNIVERSAL.NAVIGATION.SIDEBAR.v1
 * 
 * Dynamic sidebar that adapts to industry context and current navigation state
 * Integrates with useNavigationConfig and HERAAuthProvider
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { useNavigationConfig } from '@/hooks/useNavigationConfig'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { 
  ChevronDown, ChevronRight, Building2, User, Settings, LogOut,
  LucideIcon, Gem, Truck, Factory, ShoppingCart, BarChart3,
  Users, FileText, Shield, Calculator, Receipt, Wallet
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Icon mapping for dynamic icon resolution
const ICON_MAP: Record<string, LucideIcon> = {
  'banknote': Wallet,
  'shopping-cart': ShoppingCart,
  'trending-up': BarChart3,
  'book-open': FileText,
  'credit-card': Receipt,
  'wallet': Wallet,
  'file-text': FileText,
  'users': Users,
  'shield': Shield,
  'calculator': Calculator,
  'receipt': Receipt,
  'coins': Wallet,
  'gem': Gem,
  'map': BarChart3,
  'truck': Truck,
  'shield-check': Shield,
  'factory': Factory,
  'boxes': Factory, // fallback
  'badge-dollar': BarChart3, // fallback
  'check-circle': Shield, // fallback
  'wrench': Settings, // fallback
  'kanban': FileText, // fallback
  'headset': Users, // fallback
  'package-open': Factory // fallback
}

interface UniversalSidebarProps {
  className?: string
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function UniversalSidebar({ 
  className = '', 
  collapsed = false,
  onToggleCollapse 
}: UniversalSidebarProps) {
  const navigation = useNavigationConfig()
  const { user, organization, isAuthenticated } = useHERAAuth()
  const [expandedModules, setExpandedModules] = useState<string[]>([navigation.moduleCode || ''])

  const toggleModule = (moduleCode: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleCode) 
        ? prev.filter(code => code !== moduleCode)
        : [...prev, moduleCode]
    )
  }

  // Get industry-specific branding
  const industryTheme = navigation.currentTheme
  const industryName = navigation.currentIndustry?.name

  // Apply theme colors if available
  const themeStyle = industryTheme ? {
    '--industry-primary': industryTheme.primary_color,
    '--industry-secondary': industryTheme.secondary_color
  } as React.CSSProperties : {}

  if (!isAuthenticated) {
    return null
  }

  return (
    <div 
      className={`bg-white border-r border-gray-200 shadow-sm flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      } transition-all duration-200 ${className}`}
      style={themeStyle}
    >
      {/* Industry Header */}
      {industryName && !collapsed && (
        <div 
          className="p-4 border-b border-gray-200"
          style={{ 
            backgroundColor: industryTheme?.primary_color ? `${industryTheme.primary_color}10` : undefined 
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-8 rounded-full"
              style={{ backgroundColor: industryTheme?.primary_color }}
            />
            <div>
              <h2 className="font-semibold text-gray-900">HERA</h2>
              <p className="text-xs text-gray-600">{industryName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {Object.entries(navigation.availableModules).map(([moduleCode, moduleConfig]) => {
            const isExpanded = expandedModules.includes(moduleCode)
            const isActive = navigation.moduleCode === moduleCode.toLowerCase()
            const IconComponent = ICON_MAP[moduleConfig.icon] || Building2

            return (
              <div key={moduleCode}>
                {/* Module Item */}
                <div className="flex items-center">
                  <Link
                    href={
                      navigation.currentIndustry 
                        ? `${navigation.currentIndustry.route_prefix}/${moduleCode.toLowerCase()}`
                        : `/enterprise/${moduleCode.toLowerCase()}`
                    }
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors flex-1 ${
                      isActive 
                        ? 'bg-violet-100 text-violet-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{moduleConfig.name}</span>
                        {moduleConfig.areas.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              toggleModule(moduleCode)
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </Link>
                </div>

                {/* Areas Submenu */}
                {!collapsed && isExpanded && moduleConfig.areas.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    {moduleConfig.areas.map((area) => {
                      const isAreaActive = navigation.areaCode === area.code.toLowerCase()
                      
                      return (
                        <Link
                          key={area.code}
                          href={
                            navigation.currentIndustry
                              ? `${navigation.currentIndustry.route_prefix}/${moduleCode.toLowerCase()}/${area.route.split('/').pop()}`
                              : `/enterprise/${moduleCode.toLowerCase()}/${area.route.split('/').pop()}`
                          }
                          className={`block px-3 py-1.5 text-sm rounded transition-colors ${
                            isAreaActive
                              ? 'bg-violet-50 text-violet-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {area.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* User Section */}
      {!collapsed && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-violet-100 text-violet-600 text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email || 'User'}
              </p>
              {organization?.name && (
                <p className="text-xs text-gray-500 truncate">
                  {organization.name}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-600 hover:text-gray-900"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-600 hover:text-gray-900"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Collapsed User Icon */}
      {collapsed && (
        <div className="border-t border-gray-200 p-4">
          <Avatar className="w-8 h-8 mx-auto">
            <AvatarFallback className="bg-violet-100 text-violet-600 text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  )
}

export default UniversalSidebar