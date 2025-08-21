'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/MultiOrgAuthProvider'
import { BPOManagementSidebar } from '@/components/bpo-progressive/BPOManagementSidebar'
import { BPORoleSwitcher } from '@/components/bpo-progressive/BPORoleSwitcher'
import { BPOQuickRoleSwitcher } from '@/components/bpo-progressive/BPOQuickRoleSwitcher'
import { 
  FileText, Upload, Users, BarChart3, Clock, CheckCircle,
  AlertTriangle, TrendingUp, DollarSign, Target,
  Building, Briefcase, Shield, Activity, Database,
  Search, Bell, MoreHorizontal, Sparkles, ChevronRight,
  ArrowUpRight, Zap, Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function BPOManagementHomePage() {
  const { user } = useAuth()
  const workspace = { name: 'BPO Services' } // Default workspace for BPO
  const [hoveredModule, setHoveredModule] = useState<string | null>(null)
  const [currentBPOUser, setCurrentBPOUser] = useState<any>(null)

  // Load current BPO user from localStorage on component mount
  useEffect(() => {
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

  // BPO workflow modules
  const bpoModules = [
    {
      id: 'invoice-upload',
      title: 'Invoice Upload',
      description: 'Secure invoice submission and document management',
      icon: Upload,
      color: 'from-blue-500 to-cyan-600',
      stats: '247 invoices',
      trend: '+18%',
      url: '/bpo-progressive/upload',
      role: 'head-office'
    },
    {
      id: 'work-queue',
      title: 'Work Queue',
      description: 'Invoice processing and verification workflow',
      icon: FileText,
      color: 'from-purple-500 to-pink-600',
      stats: '89 pending',
      trend: '+23%',
      url: '/bpo-progressive/queue',
      role: 'back-office'
    },
    {
      id: 'verification',
      title: 'Verification Center',
      description: 'Quality assurance and compliance validation',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-600',
      stats: '156 verified',
      trend: '+12%',
      url: '/bpo-progressive/verification',
      role: 'back-office'
    },
    {
      id: 'communication',
      title: 'Communication Hub',
      description: 'Real-time collaboration and issue resolution',
      icon: Users,
      color: 'from-orange-500 to-red-600',
      stats: '43 threads',
      trend: '+7%',
      url: '/bpo-progressive/communication',
      role: 'both'
    },
    {
      id: 'analytics',
      title: 'Performance Analytics',
      description: 'KPI tracking and SLA monitoring dashboard',
      icon: BarChart3,
      color: 'from-indigo-500 to-purple-600',
      stats: '94.2% SLA',
      trend: '+2.1%',
      url: '/bpo-progressive/analytics',
      role: 'both'
    },
    {
      id: 'audit',
      title: 'Audit Trail',
      description: 'Complete transaction history and compliance reports',
      icon: Shield,
      color: 'from-gray-600 to-gray-700',
      stats: '100% tracked',
      trend: '0%',
      url: '/bpo-progressive/audit',
      role: 'both'
    }
  ]

  // Key performance metrics
  const keyMetrics = [
    { label: 'Total Invoices', value: '1,247', change: '+156', positive: true },
    { label: 'Processing Time', value: '2.3 hrs', change: '-0.4 hrs', positive: true },
    { label: 'Error Rate', value: '0.8%', change: '-0.2%', positive: true },
    { label: 'SLA Compliance', value: '94.2%', change: '+1.8%', positive: true }
  ]

  // Filter modules based on user role
  const accessibleModules = bpoModules.filter(module => 
    module.role === 'both' || module.role === userRole
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
      <BPOManagementSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Premium Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  BPO Invoice Management Center
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    HERA Powered
                  </Badge>
                </h1>
                <p className="text-gray-600 mt-1">
                  {currentBPOUser?.name || workspace?.organization_name || user?.organizationName || 'BPO Excellence Platform'} • 
                  <span className="capitalize ml-1">{userRole.replace('-', ' ')} Dashboard</span>
                </p>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="relative">
                  <Search className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Key Metrics Bar */}
            <div className="grid grid-cols-4 gap-4">
              {keyMetrics.map((metric, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                    <span className={`text-sm font-medium flex items-center gap-1 ${
                      metric.positive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className={`w-3 h-3 ${!metric.positive ? 'rotate-180' : ''}`} />
                      {metric.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Welcome Section */}
            <div className="text-center max-w-4xl mx-auto mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-6 shadow-2xl">
                <Building className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-5xl font-thin text-gray-900 mb-4">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentBPOUser?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'BPO Professional'}
              </h2>
              <p className="text-xl text-gray-600 font-light">
                {userRole === 'head-office' ? 
                  'Submit and monitor your invoice processing workflow.' :
                  userRole === 'back-office' ?
                  'Process, verify, and manage invoice workflows efficiently.' :
                  'Streamlined invoice processing workflow. Excellence in outsourcing operations.'
                }
              </p>
            </div>

            {/* Role Switcher */}
            <div className="max-w-lg mx-auto mb-12">
              <BPOQuickRoleSwitcher />
            </div>

            {/* Module Grid - Premium Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {accessibleModules.map((module) => (
                <div
                  key={module.id}
                  onClick={() => window.location.href = module.url}
                  onMouseEnter={() => setHoveredModule(module.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                  className="group cursor-pointer"
                >
                  <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-gray-100 overflow-hidden h-full">
                    {/* Premium gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity duration-700`}></div>
                    
                    {/* Floating icon */}
                    <div className="relative z-10 mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                        <module.icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                        {module.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        {module.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold text-gray-900">{module.stats}</span>
                        <Badge className="bg-green-100 text-green-700 border-0">
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          {module.trend}
                        </Badge>
                      </div>
                      
                      {/* Action */}
                      <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                        <span>Access</span>
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Premium shine effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-16 max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Quick Actions</h3>
              <div className="flex justify-center gap-4">
                {userRole === 'head-office' && (
                  <>
                    <Button 
                      onClick={() => window.location.href = '/bpo-progressive/upload'}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transition-all duration-300"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Invoice
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/bpo-progressive/analytics'}
                      variant="outline" 
                      className="hover:shadow-md transition-all duration-300"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Reports
                    </Button>
                  </>
                )}
                {userRole === 'back-office' && (
                  <>
                    <Button 
                      onClick={() => window.location.href = '/bpo-progressive/queue'}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg transition-all duration-300"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Process Queue
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/bpo-progressive/analytics'}
                      variant="outline" 
                      className="hover:shadow-md transition-all duration-300"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Check SLA
                    </Button>
                  </>
                )}
                <Button 
                  onClick={() => window.location.href = '/bpo-progressive/communication'}
                  variant="outline" 
                  className="hover:shadow-md transition-all duration-300"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Team Chat
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-24 text-center text-sm text-gray-500">
              <p>Powered by HERA Universal Architecture • Real-time Workflow • Enterprise Security</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}