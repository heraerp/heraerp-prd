'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Calculator, 
  Users, 
  DollarSign, 
  FileText, 
  Calendar, 
  AlertCircle,
  Clock,
  CheckCircle,
  Building2,
  TrendingUp,
  Shield,
  Briefcase,
  PieChart
} from 'lucide-react'

function AccountingFirmPageContent() {
  const [mounted, setMounted] = useState(false)
  const { user, isAuthenticated, isLoading } = useAuth()
  // Map authentication fields for compatibility
  const workspace = user ? { organization_id: 'sterling-associates' } : null
  const isRegistered = isAuthenticated

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">Loading Sterling & Associates CPA...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600">Please log in to access the accounting firm system.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.organizationName || 'Sterling & Associates CPA'}
              </h1>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Partner
              </Badge>
              <div className="text-right">
                <p className="text-sm text-gray-500">Tax Season</p>
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
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Clients</p>
                  <p className="text-2xl font-bold text-gray-900">127</p>
                  <p className="text-sm text-green-600 mt-1">+8 this quarter</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Engagements</p>
                  <p className="text-2xl font-bold text-gray-900">23</p>
                  <p className="text-sm text-gray-600 mt-1">5 due this week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">$142K</p>
                  <p className="text-sm text-green-600 mt-1">+12% vs last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Billable Hours</p>
                  <p className="text-2xl font-bold text-gray-900">1,284</p>
                  <p className="text-sm text-blue-600 mt-1">This month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Engagements */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                  Active Engagements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      client: 'InnovateTech Solutions LLC',
                      service: '2024 Tax Return',
                      progress: 75,
                      dueDate: 'Mar 15, 2025',
                      status: 'in_progress',
                      fee: '$8,500'
                    },
                    { 
                      client: 'Riverside Restaurant Group',
                      service: '2024 Financial Audit',
                      progress: 60,
                      dueDate: 'Apr 30, 2025',
                      status: 'in_progress',
                      fee: '$35,000'
                    },
                    { 
                      client: 'Downtown Medical Associates',
                      service: 'Q4 2024 Bookkeeping',
                      progress: 100,
                      dueDate: 'Jan 31, 2025',
                      status: 'completed',
                      fee: '$2,800'
                    },
                    { 
                      client: 'Urban Boutique Stores',
                      service: 'Sales Tax Filing',
                      progress: 0,
                      dueDate: 'Jan 31, 2025',
                      status: 'pending',
                      fee: '$950'
                    }
                  ].map((engagement, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{engagement.client}</h4>
                          <p className="text-sm text-gray-600">{engagement.service}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={engagement.status === 'completed' ? 'default' : 
                                   engagement.status === 'in_progress' ? 'secondary' : 'outline'}
                            className={
                              engagement.status === 'completed' ? 'bg-green-100 text-green-800' :
                              engagement.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-600'
                            }
                          >
                            {engagement.status === 'completed' ? 'Completed' : 
                             engagement.status === 'in_progress' ? 'In Progress' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{engagement.progress}%</span>
                          </div>
                          <Progress value={engagement.progress} className="h-2" />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{engagement.fee}</p>
                          <p className="text-xs text-gray-500">Due: {engagement.dueDate}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { task: 'Sales Tax Filing - Urban Boutique', date: 'Jan 31', urgent: true },
                    { task: 'Quarterly Review - Medical Associates', date: 'Feb 15', urgent: false },
                    { task: 'Payroll Processing - Premier Construction', date: 'Feb 28', urgent: false },
                    { task: 'Tax Return - InnovateTech Solutions', date: 'Mar 15', urgent: false }
                  ].map((deadline, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${deadline.urgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className={`h-4 w-4 mr-2 ${deadline.urgent ? 'text-red-500' : 'text-gray-500'}`} />
                          <div>
                            <p className={`text-sm font-medium ${deadline.urgent ? 'text-red-900' : 'text-gray-900'}`}>
                              {deadline.task}
                            </p>
                            <p className={`text-xs ${deadline.urgent ? 'text-red-600' : 'text-gray-500'}`}>
                              Due: {deadline.date}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium">New Tax Return</span>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-indigo-600 mr-2" />
                      <span className="text-sm font-medium">Add New Client</span>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium">Generate Invoice</span>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <PieChart className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm font-medium">Practice Analytics</span>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-amber-600" />
                  Compliance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">CPE Credits Due</p>
                        <p className="text-xs text-amber-600">15 credits needed by Dec 31</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-blue-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">License Renewal</p>
                        <p className="text-xs text-blue-600">NY CPA license expires Mar 31</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Quality Review</p>
                        <p className="text-xs text-green-600">All systems compliant</p>
                      </div>
                    </div>
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

export default function AccountingPage() {
  return <AccountingFirmPageContent />
}