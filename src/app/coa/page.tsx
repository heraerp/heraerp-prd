'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Settings, 
  Users, 
  FileText,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowRight,
  Building,
  Globe,
  Zap
} from 'lucide-react'
import { DualAuthProvider } from '@/components/auth/DualAuthProvider'
import { HeraThemeProvider } from '@/components/universal/ui/HeraThemeProvider'
import { HeraCard, HeraMetric } from '@/components/universal/ui'
import FinancialLayout from '@/components/financial/FinancialLayout'

interface COAStats {
  totalAccounts: number
  activeTemplates: number
  assignedOrganizations: number
  pendingSetups: number
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  href: string
  color: string
}

export default function COADashboard() {
  const [stats, setStats] = useState<COAStats>({
    totalAccounts: 0,
    activeTemplates: 0,
    assignedOrganizations: 0,
    pendingSetups: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Mock data for now - replace with actual API calls
      setTimeout(() => {
        setStats({
          totalAccounts: 156,
          activeTemplates: 8,
          assignedOrganizations: 12,
          pendingSetups: 3
        })
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to load COA dashboard data:', error)
      setIsLoading(false)
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: 'setup',
      title: 'COA Setup',
      description: 'Configure Chart of Accounts for new organizations',
      icon: Settings,
      href: '/coa/setup',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'accounts',
      title: 'GL Accounts',
      description: 'Manage General Ledger accounts and structures',
      icon: BookOpen,
      href: '/coa/accounts',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'templates',
      title: 'Templates',
      description: 'Manage COA templates for different industries',
      icon: FileText,
      href: '/coa/templates',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      id: 'reports',
      title: 'Financial Reports',
      description: 'Generate and view financial reports',
      icon: TrendingUp,
      href: '/api/v1/financial/reports',
      color: 'from-amber-500 to-orange-500'
    }
  ]

  return (
    <DualAuthProvider>
      <HeraThemeProvider>
        <FinancialLayout 
          title="Chart of Accounts"
          subtitle="Universal COA management for all business types"
          actions={
            <Button 
              onClick={() => router.push('/coa/setup')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Setup
            </Button>
          }
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <HeraCard className="hera-card bg-gradient-to-br from-hera-500/10 to-hera-cyan-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">
                      Total Accounts
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {isLoading ? '...' : stats.totalAccounts}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </HeraCard>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 mb-1">
                      Active Templates
                    </p>
                    <p className="text-3xl font-bold text-emerald-900">
                      {isLoading ? '...' : stats.activeTemplates}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">
                      Organizations
                    </p>
                    <p className="text-3xl font-bold text-purple-900">
                      {isLoading ? '...' : stats.assignedOrganizations}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 mb-1">
                      Pending Setups
                    </p>
                    <p className="text-3xl font-bold text-amber-900">
                      {isLoading ? '...' : stats.pendingSetups}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Card 
                  key={action.id}
                  className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 overflow-hidden"
                  onClick={() => router.push(action.href)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-all duration-300`} />
                  <CardContent className="relative p-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-800">
                      {action.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      {action.description}
                    </p>
                    <div className="flex items-center text-sm font-medium text-slate-500 group-hover:text-slate-700">
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Recent Activity & Quick Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Settings className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">COA Setup Completed</p>
                        <p className="text-xs text-slate-500">Mario's Restaurant</p>
                      </div>
                    </div>
                    <Badge variant="secondary">2 min ago</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">New GL Account Added</p>
                        <p className="text-xs text-slate-500">Account: 4050 - Food Sales</p>
                      </div>
                    </div>
                    <Badge variant="secondary">1 hour ago</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Template Updated</p>
                        <p className="text-xs text-slate-500">Restaurant COA Template v2.1</p>
                      </div>
                    </div>
                    <Badge variant="secondary">3 hours ago</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-emerald-500" />
                  Universal Architecture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">6-Table Foundation</h4>
                    <p className="text-sm text-blue-700">
                      All COA structures built on HERA's universal 6-table architecture for maximum flexibility
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold text-emerald-900 mb-2">Industry Templates</h4>
                    <p className="text-sm text-emerald-700">
                      Pre-built templates for Restaurant, Healthcare, Manufacturing, and more
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">Dynamic Customization</h4>
                    <p className="text-sm text-purple-700">
                      Custom fields and business-specific account structures without schema changes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </FinancialLayout>
      </HeraThemeProvider>
    </DualAuthProvider>
  )
}