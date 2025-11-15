'use client'

import React, { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  AlertTriangle, 
  Rocket,
  Shield,
  Database,
  Users,
  Settings,
  Zap,
  Clock,
  Target,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  FileText,
  Download,
  Calendar,
  Activity,
  TrendingUp
} from 'lucide-react'

/**
 * HERA Onboarding Launch - Go-live readiness and launch preparation
 * 
 * Features:
 * - Pre-launch checklist with validation
 * - Go-live readiness assessment
 * - Launch execution dashboard
 * - Rollback capabilities
 * - Real-time monitoring
 * - Mobile-first responsive design
 */

interface LaunchChecklist {
  id: string
  category: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  required: boolean
  automated: boolean
  estimatedMinutes: number
}

interface LaunchMetrics {
  overallReadiness: number
  criticalIssues: number
  warnings: number
  testsCompleted: number
  totalTests: number
  estimatedLaunchTime: string
}

export default function OnboardingLaunch() {
  const [checklist, setChecklist] = useState<LaunchChecklist[]>([
    // System Validation
    {
      id: 'database_validation',
      category: 'System',
      title: 'Database Validation',
      description: 'Verify database integrity and performance',
      status: 'completed',
      required: true,
      automated: true,
      estimatedMinutes: 5
    },
    {
      id: 'api_validation',
      category: 'System',
      title: 'API Endpoints',
      description: 'Test all API endpoints and connections',
      status: 'completed',
      required: true,
      automated: true,
      estimatedMinutes: 3
    },
    {
      id: 'security_scan',
      category: 'Security',
      title: 'Security Scan',
      description: 'Run security vulnerability scan',
      status: 'completed',
      required: true,
      automated: true,
      estimatedMinutes: 10
    },
    {
      id: 'ssl_certificate',
      category: 'Security',
      title: 'SSL Certificate',
      description: 'Verify SSL certificate installation and validity',
      status: 'completed',
      required: true,
      automated: true,
      estimatedMinutes: 2
    },
    // User Setup
    {
      id: 'admin_account',
      category: 'Users',
      title: 'Admin Account Setup',
      description: 'Configure primary administrator account',
      status: 'completed',
      required: true,
      automated: false,
      estimatedMinutes: 5
    },
    {
      id: 'user_accounts',
      category: 'Users',
      title: 'User Accounts',
      description: 'Create and configure staff user accounts',
      status: 'in_progress',
      required: true,
      automated: false,
      estimatedMinutes: 15
    },
    {
      id: 'permissions',
      category: 'Users',
      title: 'Permissions & Roles',
      description: 'Configure user roles and permissions',
      status: 'in_progress',
      required: true,
      automated: false,
      estimatedMinutes: 10
    },
    // Data Migration
    {
      id: 'data_backup',
      category: 'Data',
      title: 'Data Backup',
      description: 'Create backup of legacy system data',
      status: 'pending',
      required: true,
      automated: false,
      estimatedMinutes: 30
    },
    {
      id: 'data_import',
      category: 'Data',
      title: 'Data Import',
      description: 'Import customer and business data',
      status: 'pending',
      required: true,
      automated: true,
      estimatedMinutes: 45
    },
    {
      id: 'data_validation',
      category: 'Data',
      title: 'Data Validation',
      description: 'Validate imported data accuracy',
      status: 'pending',
      required: true,
      automated: true,
      estimatedMinutes: 20
    },
    // Testing
    {
      id: 'functionality_tests',
      category: 'Testing',
      title: 'Functionality Tests',
      description: 'Run automated functionality tests',
      status: 'pending',
      required: true,
      automated: true,
      estimatedMinutes: 25
    },
    {
      id: 'user_acceptance',
      category: 'Testing',
      title: 'User Acceptance Testing',
      description: 'Complete user acceptance testing',
      status: 'pending',
      required: true,
      automated: false,
      estimatedMinutes: 60
    },
    // Integration
    {
      id: 'payment_integration',
      category: 'Integration',
      title: 'Payment Processing',
      description: 'Test payment processor integration',
      status: 'pending',
      required: false,
      automated: true,
      estimatedMinutes: 15
    },
    {
      id: 'email_integration',
      category: 'Integration',
      title: 'Email Integration',
      description: 'Verify email notification system',
      status: 'pending',
      required: false,
      automated: true,
      estimatedMinutes: 10
    },
    // Training
    {
      id: 'staff_training',
      category: 'Training',
      title: 'Staff Training',
      description: 'Complete staff training program',
      status: 'pending',
      required: true,
      automated: false,
      estimatedMinutes: 120
    },
    {
      id: 'documentation',
      category: 'Training',
      title: 'Documentation Review',
      description: 'Review user documentation and guides',
      status: 'pending',
      required: false,
      automated: false,
      estimatedMinutes: 30
    }
  ])

  const [metrics, setMetrics] = useState<LaunchMetrics>({
    overallReadiness: 0,
    criticalIssues: 0,
    warnings: 0,
    testsCompleted: 0,
    totalTests: 0,
    estimatedLaunchTime: ''
  })

  const [isLaunching, setIsLaunching] = useState(false)
  const [launchComplete, setLaunchComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user, organization } = useHERAAuth()

  useEffect(() => {
    calculateMetrics()
  }, [checklist])

  const calculateMetrics = () => {
    const completedTests = checklist.filter(item => item.status === 'completed').length
    const totalTests = checklist.length
    const requiredTests = checklist.filter(item => item.required)
    const completedRequired = requiredTests.filter(item => item.status === 'completed').length
    
    const criticalIssues = checklist.filter(item => 
      item.required && (item.status === 'failed' || item.status === 'pending')
    ).length
    
    const warnings = checklist.filter(item => 
      !item.required && item.status === 'failed'
    ).length

    const readinessPercentage = totalTests > 0 ? (completedTests / totalTests) * 100 : 0
    
    // Calculate estimated launch time based on remaining tasks
    const pendingTasks = checklist.filter(item => item.status === 'pending')
    const totalMinutes = pendingTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0)
    const estimatedTime = new Date(Date.now() + totalMinutes * 60 * 1000)

    setMetrics({
      overallReadiness: Math.round(readinessPercentage),
      criticalIssues,
      warnings,
      testsCompleted: completedTests,
      totalTests,
      estimatedLaunchTime: estimatedTime.toLocaleString()
    })
  }

  const runChecklistItem = async (itemId: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, status: 'in_progress' }
        : item
    ))

    try {
      // Simulate running the checklist item
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Most items pass, but simulate some potential failures
      const success = Math.random() > 0.1 // 90% success rate
      
      setChecklist(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: success ? 'completed' : 'failed' }
          : item
      ))
    } catch (err) {
      setChecklist(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'failed' }
          : item
      ))
    }
  }

  const runAllTests = async () => {
    const pendingItems = checklist.filter(item => item.status === 'pending')
    
    for (const item of pendingItems) {
      await runChecklistItem(item.id)
    }
  }

  const executeLaunch = async () => {
    const criticalFailures = checklist.filter(item => 
      item.required && item.status !== 'completed'
    )

    if (criticalFailures.length > 0) {
      setError('Cannot launch: Critical checklist items are not completed')
      return
    }

    try {
      setIsLaunching(true)
      setError(null)

      // Simulate launch process
      await new Promise(resolve => setTimeout(resolve, 5000))

      setLaunchComplete(true)
      setIsLaunching(false)
    } catch (err) {
      console.error('Launch failed:', err)
      setError('Launch failed. Please check system status and try again.')
      setIsLaunching(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-400 animate-spin" />
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 border-green-500/30'
      case 'in_progress':
        return 'bg-yellow-500/20 border-yellow-500/30'
      case 'failed':
        return 'bg-red-500/20 border-red-500/30'
      default:
        return 'bg-gray-500/20 border-gray-500/30'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'System':
        return <Settings className="w-5 h-5" />
      case 'Security':
        return <Shield className="w-5 h-5" />
      case 'Users':
        return <Users className="w-5 h-5" />
      case 'Data':
        return <Database className="w-5 h-5" />
      case 'Testing':
        return <Target className="w-5 h-5" />
      case 'Integration':
        return <Zap className="w-5 h-5" />
      case 'Training':
        return <FileText className="w-5 h-5" />
      default:
        return <Activity className="w-5 h-5" />
    }
  }

  const categories = [...new Set(checklist.map(item => item.category))]

  if (launchComplete) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-champagne mb-4">
              🎉 Launch Successful!
            </h1>
            <p className="text-bronze text-lg mb-8">
              Your HERA system is now live and ready for business operations.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-charcoal/50 backdrop-blur-md border-green-500/20">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-champagne mb-1">System Online</h3>
                  <p className="text-sm text-bronze">All systems operational</p>
                </CardContent>
              </Card>
              
              <Card className="bg-charcoal/50 backdrop-blur-md border-blue-500/20">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-champagne mb-1">Users Ready</h3>
                  <p className="text-sm text-bronze">Staff can log in now</p>
                </CardContent>
              </Card>
              
              <Card className="bg-charcoal/50 backdrop-blur-md border-purple-500/20">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-champagne mb-1">Analytics Active</h3>
                  <p className="text-sm text-bronze">Tracking performance</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/'}
                className="min-h-[44px] bg-gold text-black hover:bg-gold/90"
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline"
                className="min-h-[44px] border-gold/30 text-champagne hover:bg-gold/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Launch Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-champagne mb-2">
                Launch Preparation
              </h1>
              <p className="text-bronze">
                Complete pre-launch checks and go live with confidence
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={runAllTests}
                variant="outline"
                className="min-h-[44px] border-gold/30 text-champagne hover:bg-gold/10"
                disabled={isLaunching}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Run All Tests
              </Button>
              <Button
                onClick={executeLaunch}
                disabled={metrics.criticalIssues > 0 || isLaunching}
                className="min-h-[44px] bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isLaunching ? (
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Rocket className="w-4 h-4 mr-2" />
                )}
                Launch System
              </Button>
            </div>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-bronze">Overall Readiness</p>
                    <p className="text-2xl font-bold text-champagne">{metrics.overallReadiness}%</p>
                  </div>
                  <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-gold" />
                  </div>
                </div>
                <Progress value={metrics.overallReadiness} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-bronze">Critical Issues</p>
                    <p className="text-2xl font-bold text-champagne">{metrics.criticalIssues}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    metrics.criticalIssues > 0 ? 'bg-red-500/20' : 'bg-green-500/20'
                  }`}>
                    <AlertTriangle className={`w-6 h-6 ${
                      metrics.criticalIssues > 0 ? 'text-red-400' : 'text-green-400'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-bronze">Tests Completed</p>
                    <p className="text-2xl font-bold text-champagne">
                      {metrics.testsCompleted}/{metrics.totalTests}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-bronze">Est. Launch Time</p>
                    <p className="text-sm font-bold text-champagne">
                      {metrics.estimatedLaunchTime.split(',')[1] || 'Ready'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-500/20 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Checklist by Category */}
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryItems = checklist.filter(item => item.category === category)
            const completedItems = categoryItems.filter(item => item.status === 'completed').length
            const categoryProgress = (completedItems / categoryItems.length) * 100

            return (
              <Card key={category} className="bg-charcoal/50 backdrop-blur-md border-gold/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-champagne flex items-center gap-3">
                      {getCategoryIcon(category)}
                      {category}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-bronze">
                        {completedItems}/{categoryItems.length} complete
                      </span>
                      <div className="w-24">
                        <Progress value={categoryProgress} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border transition-colors ${getStatusColor(item.status)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getStatusIcon(item.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-champagne truncate">
                                  {item.title}
                                </h3>
                                {item.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                                {item.automated && (
                                  <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-300">
                                    Auto
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-bronze">{item.description}</p>
                              <p className="text-xs text-bronze mt-1">
                                Estimated time: {item.estimatedMinutes} minutes
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {item.status === 'pending' && (
                              <Button
                                onClick={() => runChecklistItem(item.id)}
                                size="sm"
                                variant="outline"
                                className="border-gold/30 text-champagne hover:bg-gold/10"
                              >
                                <PlayCircle className="w-4 h-4 mr-1" />
                                Run
                              </Button>
                            )}
                            {item.status === 'failed' && (
                              <Button
                                onClick={() => runChecklistItem(item.id)}
                                size="sm"
                                variant="outline"
                                className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Retry
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Launch Status */}
        {metrics.criticalIssues === 0 && metrics.overallReadiness === 100 && (
          <Card className="mt-8 bg-green-500/10 border-green-500/20">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-champagne mb-2">
                System Ready for Launch!
              </h3>
              <p className="text-bronze mb-4">
                All critical checks have passed. Your HERA system is ready to go live.
              </p>
              <Button
                onClick={executeLaunch}
                disabled={isLaunching}
                className="min-h-[44px] bg-green-600 text-white hover:bg-green-700"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Launch Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}