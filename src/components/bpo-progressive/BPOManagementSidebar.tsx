'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building,
  Upload,
  FileText,
  CheckCircle,
  Users,
  BarChart3,
  Shield,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  Target,
  Database,
  Zap,
  Activity,
  Bell
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

export function BPOManagementSidebar({ className = '' }: SidebarProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState('dashboard')
  const [currentBPOUser, setCurrentBPOUser] = useState<any>(null)

  // Load current BPO user from localStorage
  React.useEffect(() => {
    const storedUser = localStorage.getItem('bpo-current-user')
    if (storedUser) {
      try {
        setCurrentBPOUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Error parsing stored BPO user:', e)
      }
    }
  }, [])

  // User role detection (from localStorage or default to head-office)
  const userRole = currentBPOUser?.role || 'head-office'

  // Navigation items based on role
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/bpo-progressive',
      badge: null,
      roles: ['head-office', 'back-office']
    },
    {
      id: 'upload',
      label: 'Invoice Upload',
      icon: Upload,
      href: '/bpo-progressive/upload',
      badge: 'New',
      roles: ['head-office']
    },
    {
      id: 'queue',
      label: 'Work Queue',
      icon: FileText,
      href: '/bpo-progressive/queue',
      badge: '89',
      roles: ['back-office']
    },
    {
      id: 'verification',
      label: 'Verification',
      icon: CheckCircle,
      href: '/bpo-progressive/verification',
      badge: '12',
      roles: ['back-office']
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: Users,
      href: '/bpo-progressive/communication',
      badge: '3',
      roles: ['head-office', 'back-office']
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      href: '/bpo-progressive/analytics',
      badge: null,
      roles: ['head-office', 'back-office']
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: Shield,
      href: '/bpo-progressive/audit',
      badge: null,
      roles: ['head-office', 'back-office']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/bpo-progressive/settings',
      badge: null,
      roles: ['head-office', 'back-office']
    }
  ]

  // Filter items based on user role
  const accessibleItems = navigationItems.filter(item =>
    item.roles.includes(userRole)
  )

  const handleNavClick = (item: typeof navigationItems[0]) => {
    setActiveItem(item.id)
    router.push(item.href)
  }

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  BPO Center
                </h1>
                <p className="text-sm text-gray-600 mt-1 capitalize">
                  {userRole.replace('-', ' ')} Portal
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="p-2"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {accessibleItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left group ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                }`} />
                {!collapsed && (
                  <>
                    <span className="font-medium flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge 
                        className={`text-xs px-2 py-0.5 ${
                          isActive 
                            ? 'bg-blue-600 text-white' 
                            : item.badge === 'New' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* Quick Stats */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Today's Progress</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Processed</span>
                <span className="text-xs font-medium text-green-600">47 invoices</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Pending</span>
                <span className="text-xs font-medium text-orange-600">12 invoices</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">SLA Status</span>
                <span className="text-xs font-medium text-blue-600">94.2%</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
            <p className="text-xs text-gray-500 text-center">78% daily target achieved</p>
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentBPOUser?.name || user?.name || 'BPO User'}
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {userRole.replace('-', ' ')}
                </p>
              </div>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className={`w-full ${collapsed ? 'px-2' : ''}`}
          >
            {collapsed ? <Home className="w-4 h-4" /> : 'Main Dashboard'}
          </Button>
        </div>
      </div>
    </div>
  )
}