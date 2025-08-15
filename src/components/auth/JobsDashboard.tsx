'use client'

import React, { useState, useEffect } from 'react'
import { useProgressiveAuth } from './ProgressiveAuthProvider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getHeraApi } from '@/lib/hera-api'
// Production-only dashboard implementation
import { 
  Apple,
  LogOut,
  User,
  Building2,
  TrendingUp,
  Activity,
  DollarSign,
  Users,
  Package,
  BarChart3,
  Settings,
  Bell,
  Search,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface JobsDashboardProps {
  onLogout?: () => void
  className?: string
}

interface BusinessStats {
  entities_count: number
  transactions_count: number
  total_value: number
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  href?: string
  onClick?: () => void
}

interface GettingStartedItem {
  id: string
  title: string
  description: string
  completed: boolean
  action?: () => void
}

export function JobsDashboard({ onLogout, className = '' }: JobsDashboardProps) {
  const { 
    user,
    logout 
  } = useProgressiveAuth()
  
  const [stats, setStats] = useState<BusinessStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Load business statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return

      try {
        setIsLoadingStats(true)
        const heraApi = getHeraApi()
        const businessStats = await heraApi.getOrganizationStats()
        setStats(businessStats)
        setStatsError(null)
      } catch (error) {
        console.error('Failed to load stats:', error)
        setStatsError('Failed to load business statistics')
        // Set default stats for demo
        setStats({
          entities_count: 0,
          transactions_count: 0,
          total_value: 0
        })
      } finally {
        setIsLoadingStats(false)
      }
    }

    loadStats()
  }, [user])

  // Handle logout
  const handleLogout = async () => {
    await logout()
    onLogout?.()
  }

  // Quick actions based on business type
  const getQuickActions = (): QuickAction[] => {
    const businessType = organization?.organization_type || 'general'
    
    const baseActions: QuickAction[] = [
      {
        id: 'add-customer',
        title: 'Add Customer',
        description: 'Create a new customer profile',
        icon: Users,
        color: 'from-blue-500 to-blue-600',
        onClick: () => console.log('Add customer')
      },
      {
        id: 'create-transaction',
        title: 'New Transaction',
        description: 'Record a business transaction',
        icon: DollarSign,
        color: 'from-green-500 to-green-600',
        onClick: () => console.log('Create transaction')
      },
      {
        id: 'manage-inventory',
        title: 'Manage Inventory',
        description: 'Update product catalog',
        icon: Package,
        color: 'from-purple-500 to-purple-600',
        onClick: () => console.log('Manage inventory')
      },
      {
        id: 'view-reports',
        title: 'View Reports',
        description: 'Business analytics and insights',
        icon: BarChart3,
        color: 'from-amber-500 to-amber-600',
        onClick: () => console.log('View reports')
      }
    ]

    return baseActions
  }

  // Getting started checklist
  const getGettingStartedItems = (): GettingStartedItem[] => {
    const entityCount = stats?.entities_count || 0
    const transactionCount = stats?.transactions_count || 0

    return [
      {
        id: 'complete-profile',
        title: 'Complete Your Profile',
        description: 'Add business details and preferences',
        completed: !!heraContext?.user_entity?.entity_name && !!organization?.organization_name
      },
      {
        id: 'add-first-customer',
        title: 'Add Your First Customer',
        description: 'Start building your customer database',
        completed: entityCount > 1 // More than just the user entity
      },
      {
        id: 'create-first-transaction',
        title: 'Record Your First Transaction',
        description: 'Track your business activities',
        completed: transactionCount > 0
      },
      {
        id: 'explore-features',
        title: 'Explore Advanced Features',
        description: 'Discover reporting and analytics tools',
        completed: false
      }
    ]
  }

  const quickActions = getQuickActions()
  const gettingStartedItems = getGettingStartedItems()
  const completedItems = gettingStartedItems.filter(item => item.completed).length
  const totalItems = gettingStartedItems.length
  const progress = Math.round((completedItems / totalItems) * 100)

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 ${className}`}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Apple className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-light text-gray-900">HERA</h1>
                <p className="text-xs text-gray-500">{user?.organizationName}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-2xl hover:bg-gray-100/50 transition-colors"
              >
                <Search className="w-4 h-4 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-2xl hover:bg-gray-100/50 transition-colors"
              >
                <Bell className="w-4 h-4 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-2xl hover:bg-gray-100/50 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-600" />
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-2xl hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-light text-gray-900 mb-2">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'}
              </h2>
              <p className="text-gray-600">
                Welcome back to your {user?.businessType || 'business'} dashboard
              </p>
            </div>
            <Button className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-2xl shadow-lg shadow-blue-600/25 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="w-5 h-5 mr-2" />
              Quick Add
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Entities */}
          <Card className="p-6 backdrop-blur-xl bg-white/80 border border-white/20 shadow-xl shadow-black/5 rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Entities</p>
                <p className="text-3xl font-light text-gray-900">
                  {isLoadingStats ? '...' : stats?.entities_count || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Total Transactions */}
          <Card className="p-6 backdrop-blur-xl bg-white/80 border border-white/20 shadow-xl shadow-black/5 rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Transactions</p>
                <p className="text-3xl font-light text-gray-900">
                  {isLoadingStats ? '...' : stats?.transactions_count || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Total Value */}
          <Card className="p-6 backdrop-blur-xl bg-white/80 border border-white/20 shadow-xl shadow-black/5 rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Value</p>
                <p className="text-3xl font-light text-gray-900">
                  {isLoadingStats ? '...' : `$${(stats?.total_value || 0).toLocaleString()}`}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card className="p-8 backdrop-blur-xl bg-white/80 border border-white/20 shadow-xl shadow-black/5 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-light text-gray-900">Quick Actions</h3>
              <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => {
                const IconComponent = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className="p-4 rounded-2xl border border-gray-100 hover:border-gray-200 bg-white/60 hover:bg-white/80 backdrop-blur-sm transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-left"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center mb-3 shadow-lg`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1 text-sm">
                      {action.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {action.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Getting Started */}
          <Card className="p-8 backdrop-blur-xl bg-white/80 border border-white/20 shadow-xl shadow-black/5 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-light text-gray-900">Getting Started</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{progress}%</span>
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-4">
              {gettingStartedItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center space-x-4 p-3 rounded-2xl transition-all duration-200 ${
                    item.completed
                      ? 'bg-green-50/50 border border-green-100'
                      : 'bg-gray-50/50 border border-gray-100'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    item.completed
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-500'
                  }`}>
                    {item.completed ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm ${
                      item.completed ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {item.title}
                    </h4>
                    <p className={`text-xs ${
                      item.completed ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                  {!item.completed && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 rounded-xl hover:bg-gray-100"
                      onClick={item.action}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* System Status */}
        <Card className="mt-8 p-6 backdrop-blur-xl bg-white/80 border border-white/20 shadow-xl shadow-black/5 rounded-3xl">
          <h3 className="text-lg font-light text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supabase Status */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Supabase Authentication</h4>
                <p className="text-sm text-gray-600">Connected as {supabaseUser?.email}</p>
              </div>
            </div>

            {/* HERA Status */}
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                heraContext 
                  ? 'bg-gradient-to-br from-green-100 to-green-200' 
                  : 'bg-gradient-to-br from-amber-100 to-amber-200'
              }`}>
                {heraContext ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">HERA Business Context</h4>
                <p className="text-sm text-gray-600">
                  {heraContext 
                    ? `Connected to ${organization?.organization_name}` 
                    : 'Synchronizing...'
                  }
                </p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}

export default JobsDashboard