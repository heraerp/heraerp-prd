// ================================================================================
// HERA ENTERPRISE DASHBOARD
// Smart Code: HERA.DASHBOARD.ENTERPRISE.v1
// Multi-tenant, multi-app dashboard with organization management
// ================================================================================

'use client'

import React, { useEffect, useState } from 'react'
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
  AlertCircle,
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
} from 'lucide-react'
import { useAuth } from '@/src/lib/auth/session'
import { useOrganization } from '@/src/components/organization/OrganizationProvider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Organization type is imported from OrganizationProvider

interface App {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  route: string
  category: 'finance' | 'sales' | 'operations' | 'hr' | 'analytics'
  status: 'active' | 'coming_soon' | 'beta'
}


// Available apps in HERA
const availableApps: App[] = [
  {
    id: 'salon',
    name: 'Salon Manager',
    icon: <Scissors className="w-5 h-5" />,
    description: 'Complete salon business management',
    route: '/salon',
    category: 'operations',
    status: 'active'
  },
  {
    id: 'restaurant',
    name: 'Restaurant POS',
    icon: <Store className="w-5 h-5" />,
    description: 'Restaurant operations and billing',
    route: '/restaurant',
    category: 'operations',
    status: 'active'
  },
  {
    id: 'retail',
    name: 'Retail Suite',
    icon: <ShoppingBag className="w-5 h-5" />,
    description: 'Retail inventory and sales',
    route: '/retail',
    category: 'sales',
    status: 'active'
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: <Factory className="w-5 h-5" />,
    description: 'Production and inventory control',
    route: '/furniture',
    category: 'operations',
    status: 'active'
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: <Stethoscope className="w-5 h-5" />,
    description: 'Patient management system',
    route: '/healthcare',
    category: 'operations',
    status: 'beta'
  },
  {
    id: 'finance',
    name: 'Finance Hub',
    icon: <DollarSign className="w-5 h-5" />,
    description: 'Complete financial management',
    route: '/finance',
    category: 'finance',
    status: 'active'
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Business intelligence and reporting',
    route: '/analytics',
    category: 'analytics',
    status: 'active'
  },
  {
    id: 'universal',
    name: 'Universal API',
    icon: <Database className="w-5 h-5" />,
    description: 'Direct database access',
    route: '/api-explorer',
    category: 'analytics',
    status: 'beta'
  }
]

export default function EnterpriseDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { organizations, currentOrganization, loading, switchOrganization, isAppInstalled } = useOrganization()
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleOrgSwitch = (orgId: string) => {
    switchOrganization(orgId)
    setShowOrgSwitcher(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const getOrgApps = () => {
    if (!currentOrganization) return []
    return availableApps.filter(app => currentOrganization.installed_apps.includes(app.id))
  }

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.org-switcher') && showOrgSwitcher) {
        setShowOrgSwitcher(false)
      }
      if (!target.closest('.user-menu') && showUserMenu) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showOrgSwitcher, showUserMenu])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your organizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main Content */}
      <div className="">
        {/* Top Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">

              {/* Page Title */}
              <div className="flex items-center space-x-4">
                <h1 className="text-lg font-semibold text-white">Dashboard</h1>
              </div>

              {/* Right side actions */}
              <div className="flex items-center space-x-4">
                {/* Organization Switcher - Desktop only */}
                <div className="hidden lg:block org-switcher">
                  <button
                    onClick={() => setShowOrgSwitcher(!showOrgSwitcher)}
                    className="flex items-center space-x-3 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{currentOrganization?.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{currentOrganization?.role}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showOrgSwitcher ? 'rotate-90' : ''}`} />
                  </button>
                </div>

                {/* Notifications */}
                <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                  <Bell className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Organization Dropdown - Desktop only */}
          {showOrgSwitcher && (
            <div className="absolute right-0 top-16 mr-4 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Your Organizations</h3>
                <div className="space-y-2">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleOrgSwitch(org.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        currentOrganization?.id === org.id 
                          ? 'bg-blue-600 bg-opacity-20 border border-blue-500' 
                          : 'hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-white">{org.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{org.role}</p>
                        </div>
                        {org.subscription_status === 'trial' && (
                          <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                            {org.trial_days_left} days left
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <button className="w-full mt-3 p-3 border border-dashed border-gray-600 rounded-lg hover:border-gray-500 transition-colors flex items-center justify-center space-x-2">
                  <Plus className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Create New Organization</span>
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user?.name || 'User'}!
          </h2>
          <p className="text-gray-400">
            Manage your organizations and access your business applications.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Organizations</p>
                <p className="text-2xl font-bold text-white mt-1">{organizations.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Apps</p>
                <p className="text-2xl font-bold text-white mt-1">{getOrgApps().length}</p>
              </div>
              <Grid3X3 className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-white mt-1">24</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">API Calls Today</p>
                <p className="text-2xl font-bold text-white mt-1">1,247</p>
              </div>
              <Activity className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Your Applications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {getOrgApps().map((app) => (
              <Link
                key={app.id}
                href={app.route}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${
                    app.status === 'beta' ? 'bg-yellow-900/50' : 'bg-gray-700'
                  }`}>
                    {app.icon}
                  </div>
                  {app.status === 'beta' && (
                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">BETA</span>
                  )}
                  {app.status === 'coming_soon' && (
                    <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">SOON</span>
                  )}
                </div>
                <h4 className="font-semibold text-white mb-2">{app.name}</h4>
                <p className="text-sm text-gray-400">{app.description}</p>
                <div className="mt-4 flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                  <span className="text-sm">Open</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}

            {/* Add New App */}
            <button className="bg-gray-800 rounded-lg p-6 border border-dashed border-gray-600 hover:border-gray-500 transition-all flex flex-col items-center justify-center space-y-3 text-gray-400 hover:text-gray-300">
              <Plus className="w-8 h-8" />
              <span className="text-sm">Browse App Store</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Feed */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <p className="text-sm text-gray-400 mt-1">Across all your organizations</p>
            </div>
            <div className="p-6 space-y-4">
              {[
                { icon: <FileText className="w-4 h-4" />, text: 'Invoice #1234 created', time: '2 hours ago', org: 'Hair Talkz' },
                { icon: <Users className="w-4 h-4" />, text: 'New customer added', time: '3 hours ago', org: "Mario's" },
                { icon: <Package className="w-4 h-4" />, text: 'Inventory updated', time: '5 hours ago', org: 'TechCorp' },
                { icon: <TrendingUp className="w-4 h-4" />, text: 'Monthly report generated', time: '1 day ago', org: 'Hair Talkz' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{activity.text}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-400">{activity.time}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">{activity.org}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              <p className="text-sm text-gray-400 mt-1">Common tasks and shortcuts</p>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Invite Team Members</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>

              <button className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Security Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>

              <button className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-white">View Documentation</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>

              <button className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-white">Get Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* HERA Info */}
        <div className="mt-8 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-6 border border-blue-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                HERA Universal Architecture
              </h3>
              <p className="text-sm text-gray-300">
                All your business operations powered by our revolutionary 6-table universal schema. 
                Infinite complexity, zero schema changes.
              </p>
            </div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium">
              Learn More
            </button>
          </div>
        </div>
      </main>
      </div>
    </div>
  )
}