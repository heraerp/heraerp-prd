'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, Target, DollarSign, Clock, TrendingUp, ArrowRight,
  Activity, Calendar, BarChart3, Briefcase, AlertCircle,
  CheckCircle, Building, Phone, Mail, Home, CheckSquare
} from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CRMLayout } from '@/components/layout/crm-layout'

export default function MainDashboard() {
  // Executive Summary Data
  const metrics = {
    totalContacts: 156,
    activeDeals: 23,
    revenue: { current: 267500, target: 350000 },
    tasksDue: { today: 5, overdue: 2 }
  }

  const recentActivity = [
    { type: 'deal', icon: Target, text: 'New opportunity: Tech Solutions - $25K', time: '10 min ago', color: 'text-green-600' },
    { type: 'contact', icon: Users, text: 'New contact added: Sarah Johnson', time: '1 hour ago', color: 'text-blue-600' },
    { type: 'task', icon: CheckCircle, text: 'Contract negotiation completed', time: '2 hours ago', color: 'text-purple-600' },
    { type: 'meeting', icon: Calendar, text: 'Demo scheduled with StartupCo', time: '3 hours ago', color: 'text-orange-600' }
  ]

  const topOpportunities = [
    { name: 'Global Enterprises', value: 50000, stage: 'Negotiation', probability: 90 },
    { name: 'Tech Solutions Inc', value: 25000, stage: 'Proposal', probability: 75 },
    { name: 'StartupCo', value: 5000, stage: 'Discovery', probability: 25 }
  ]

  const upcomingTasks = [
    { title: 'Follow up with Sarah Johnson', due: 'Today 2:00 PM', priority: 'high' },
    { title: 'Send proposal to Mike Chen', due: 'Tomorrow 10:00 AM', priority: 'medium' },
    { title: 'Demo preparation', due: 'Jan 25, 3:00 PM', priority: 'medium' }
  ]

  return (
    <CRMLayout>
      <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Link href="/crm-progressive" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <Home className="h-4 w-4" />
            CRM Hub
          </Link>
          <ArrowRight className="h-3 w-3 text-gray-400" />
          <span className="text-gray-600">Executive Dashboard</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your business at a glance.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/crm-progressive/dashboards/sales">
                <Target className="h-4 w-4 mr-2" />
                Sales Pipeline
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/crm-progressive/dashboards/tasks">
                <CheckSquare className="h-4 w-4 mr-2" />
                Tasks & Activities
              </Link>
            </Button>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold">{metrics.totalContacts}</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% this month
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Active Deals</p>
                  <p className="text-2xl font-bold">{metrics.activeDeals}</p>
                  <p className="text-xs text-gray-600">
                    Worth ${(metrics.revenue.current / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Revenue Progress</p>
                  <p className="text-2xl font-bold">{Math.round((metrics.revenue.current / metrics.revenue.target) * 100)}%</p>
                  <Progress 
                    value={(metrics.revenue.current / metrics.revenue.target) * 100} 
                    className="h-2 w-full mt-2"
                  />
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Tasks Due</p>
                  <p className="text-2xl font-bold">{metrics.tasksDue.today}</p>
                  {metrics.tasksDue.overdue > 0 && (
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {metrics.tasksDue.overdue} overdue
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - 2 columns wide */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/crm-progressive/activity">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}>
                      <activity.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.text}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Opportunities */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Hot Opportunities
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/crm-progressive/dashboards/sales">
                    View Pipeline
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {topOpportunities.map((opp, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{opp.name}</h4>
                      <Badge variant={opp.probability > 50 ? 'default' : 'secondary'}>
                        {opp.stage}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Value: ${opp.value.toLocaleString()}</span>
                      <span className="text-gray-600">Probability: {opp.probability}%</span>
                    </div>
                    <Progress value={opp.probability} className="h-2 mt-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Tasks */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Tasks
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/crm-progressive/dashboards/tasks">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingTasks.map((task, index) => (
                  <div key={index} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
                    <p className="font-medium text-sm">{task.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">{task.due}</p>
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/crm?tab=contacts&action=new">
                    <Users className="h-4 w-4 mr-2" />
                    Add New Contact
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/crm?tab=opportunities&action=new">
                    <Target className="h-4 w-4 mr-2" />
                    Create Opportunity
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/crm?tab=tasks&action=new">
                    <Clock className="h-4 w-4 mr-2" />
                    Add Task
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/crm?tab=reports">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Reports
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </CRMLayout>
  )
}