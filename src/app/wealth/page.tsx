'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Calendar,
  FileText,
  Shield
} from 'lucide-react'

function WealthManagementPageContent() {
  const [mounted, setMounted] = useState(false)
  const { user, isAuthenticated, isLoading } = useAuth()
  // Map authentication fields for compatibility
  const workspace = user ? { organization_id: 'wealth-management' } : null

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading Wellington Private Wealth...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600">Please log in to access the wealth management system.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {organization?.organization_name || 'Wellington Private Wealth'}
              </h1>
              <p className="text-gray-600">Welcome back, {user?.name || user?.organizationName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                {user?.role || 'Wealth Advisor'}
              </Badge>
              <div className="text-right">
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Assets Under Management</p>
                  <p className="text-2xl font-bold text-gray-900">$14.75M</p>
                  <div className="flex items-center mt-1">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+8.2% YTD</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-teal-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Clients</p>
                  <p className="text-2xl font-bold text-gray-900">142</p>
                  <div className="flex items-center mt-1">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+5 this month</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Portfolio Performance</p>
                  <p className="text-2xl font-bold text-gray-900">+12.4%</p>
                  <div className="flex items-center mt-1">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">vs. 9.8% benchmark</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">$89.2K</p>
                  <div className="flex items-center mt-1">
                    <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600">-2.1% vs last month</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Client Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-emerald-600" />
                  Recent Client Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Robert Sterling', action: 'Portfolio Rebalance', amount: '$50,000', time: '2 hours ago', type: 'buy' },
                    { name: 'Elizabeth Morgan', action: 'Quarterly Review Scheduled', amount: '', time: '4 hours ago', type: 'meeting' },
                    { name: 'William Blackstone', action: 'Dividend Reinvestment', amount: '$8,750', time: '1 day ago', type: 'dividend' },
                    { name: 'Charlotte Fairfax', action: 'Risk Assessment Update', amount: '', time: '2 days ago', type: 'review' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-emerald-700 font-semibold text-sm">
                            {activity.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{activity.name}</p>
                          <p className="text-sm text-gray-500">{activity.action}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {activity.amount && (
                          <p className="font-semibold text-gray-900">{activity.amount}</p>
                        )}
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-teal-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-emerald-600 mr-2" />
                      <span className="text-sm font-medium">Schedule Client Meeting</span>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-teal-600 mr-2" />
                      <span className="text-sm font-medium">Generate Report</span>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <PieChart className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium">Portfolio Analysis</span>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-amber-600" />
                  Alerts & Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-medium text-amber-800">Compliance Review Due</p>
                    <p className="text-xs text-amber-600 mt-1">3 client portfolios need quarterly review</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Market Update</p>
                    <p className="text-xs text-blue-600 mt-1">S&P 500 up 1.2% - consider rebalancing</p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">New Client Referral</p>
                    <p className="text-xs text-green-600 mt-1">Dr. James Wilson referred by Charlotte Fairfax</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WealthManagementPage() {
  return <WealthManagementPageContent />
}