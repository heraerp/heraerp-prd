'use client'

import React, { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Rocket, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Users,
  Target,
  Activity,
  BarChart3,
  Zap
} from 'lucide-react'

/**
 * HERA Onboarding Dashboard - Main overview page
 * 
 * Features:
 * - Project overview with health status
 * - Quick actions for common tasks
 * - Progress tracking across all projects
 * - Mobile-first responsive design
 * - Real-time data fetching from API v2
 */

interface OnboardingProject {
  id: string
  entity_code: string
  entity_name: string
  entity_description?: string
  status: string
  created_at: string
  updated_at: string
  dynamic_data?: DynamicField[]
}

interface DynamicField {
  field_name: string
  field_value_text?: string
  field_value_date?: string
  field_value_number?: number
  field_value_json?: any
  field_value_boolean?: boolean
}

interface ProjectMetrics {
  current_status: string
  health_status: string
  project_start_date: string
  target_go_live_date: string
  estimated_days: number
  progress_percentage: number
}

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  averageProgress: number
}

export default function OnboardingDashboard() {
  const [projects, setProjects] = useState<OnboardingProject[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    averageProgress: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user, organization, isAuthenticated } = useHERAAuth()

  useEffect(() => {
    if (isAuthenticated && organization?.id) {
      fetchOnboardingProjects()
    }
  }, [isAuthenticated, organization])

  const fetchOnboardingProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulate auth token retrieval
      const authToken = 'placeholder-token'

      const response = await fetch('/api/v2/onboarding/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Organization-Id': organization.id,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch projects`)
      }

      const data = await response.json()
      
      if (data.success) {
        const projectsData = data.projects || []
        setProjects(projectsData)
        calculateDashboardStats(projectsData)
      } else {
        setError(data.error || 'Failed to load onboarding projects')
      }
    } catch (err) {
      console.error('Error fetching onboarding projects:', err)
      setError('Failed to connect to onboarding service')
    } finally {
      setLoading(false)
    }
  }

  const calculateDashboardStats = (projectsData: OnboardingProject[]) => {
    const total = projectsData.length
    const active = projectsData.filter(p => p.status === 'active').length
    const completed = projectsData.filter(p => {
      const status = getDynamicFieldValue(p, 'current_status')
      return status === 'COMPLETED'
    }).length

    // Calculate average progress
    let totalProgress = 0
    projectsData.forEach(project => {
      const progress = calculateProjectProgress(project)
      totalProgress += progress
    })
    const avgProgress = total > 0 ? totalProgress / total : 0

    setDashboardStats({
      totalProjects: total,
      activeProjects: active,
      completedProjects: completed,
      averageProgress: Math.round(avgProgress)
    })
  }

  const getDynamicFieldValue = (project: OnboardingProject, fieldName: string): any => {
    const field = project.dynamic_data?.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || field?.field_value_date || field?.field_value_json || field?.field_value_boolean
  }

  const calculateProjectProgress = (project: OnboardingProject): number => {
    const startDate = getDynamicFieldValue(project, 'project_start_date')
    const targetDate = getDynamicFieldValue(project, 'target_go_live_date')
    
    if (startDate && targetDate) {
      const start = new Date(startDate)
      const target = new Date(targetDate)
      const now = new Date()
      
      const totalDays = Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const daysElapsed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      
      return Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100)
    }
    return 0
  }

  const getHealthStatusColor = (healthStatus: string) => {
    switch (healthStatus?.toUpperCase()) {
      case 'GREEN': return 'bg-green-500'
      case 'AMBER': return 'bg-yellow-500'
      case 'RED': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const createNewProject = () => {
    // Navigate to getting started flow
    window.location.href = '/onboarding/getting-started'
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gold/20 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-charcoal/50 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-charcoal/50 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-champagne mb-2">
              Onboarding Dashboard
            </h1>
            <p className="text-bronze">
              Manage customer implementation projects and track progress
            </p>
          </div>
          <Button 
            onClick={createNewProject}
            className="min-h-[44px] bg-gold text-black hover:bg-gold/90 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-bronze">Total Projects</p>
                  <p className="text-2xl font-bold text-champagne">{dashboardStats.totalProjects}</p>
                </div>
                <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-bronze">Active Projects</p>
                  <p className="text-2xl font-bold text-champagne">{dashboardStats.activeProjects}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-bronze">Completed</p>
                  <p className="text-2xl font-bold text-champagne">{dashboardStats.completedProjects}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-bronze">Average Progress</p>
                  <p className="text-2xl font-bold text-champagne">{dashboardStats.averageProgress}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List or Welcome State */}
        {projects.length === 0 ? (
          <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold text-champagne mb-3">
                Welcome to HERA Onboarding
              </h3>
              <p className="text-bronze mb-6 max-w-md mx-auto">
                Start your first customer implementation project and experience our guided onboarding process
              </p>
              <div className="flex flex-col md:flex-row gap-3 justify-center">
                <Button 
                  onClick={createNewProject}
                  className="min-h-[44px] bg-gold text-black hover:bg-gold/90 font-medium"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Your First Project
                </Button>
                <Button 
                  variant="outline" 
                  className="min-h-[44px] border-gold/30 text-champagne hover:bg-gold/10"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
            <CardHeader>
              <CardTitle className="text-champagne">Active Projects</CardTitle>
              <CardDescription className="text-bronze">
                Monitor progress and manage your onboarding implementations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => {
                  const healthStatus = getDynamicFieldValue(project, 'health_status')
                  const currentStatus = getDynamicFieldValue(project, 'current_status')
                  const targetDate = getDynamicFieldValue(project, 'target_go_live_date')
                  const progress = calculateProjectProgress(project)

                  return (
                    <div
                      key={project.id}
                      className="p-4 bg-black/20 rounded-xl border border-gold/10 hover:border-gold/30 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/onboarding/project/${project.id}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(healthStatus)}`} />
                            <h3 className="font-semibold text-champagne truncate">
                              {project.entity_name}
                            </h3>
                            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                              {currentStatus || project.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-bronze mb-3">
                            {project.entity_description || 'Customer implementation project'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-bronze">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Target: {targetDate ? new Date(targetDate).toLocaleDateString() : 'Not set'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              <span>{Math.round(progress)}% complete</span>
                            </div>
                          </div>
                        </div>
                        <div className="md:w-48">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-bronze">Progress</span>
                            <span className="text-sm text-champagne font-medium">
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20 hover:border-gold/30 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-champagne mb-2">Quick Setup</h3>
              <p className="text-sm text-bronze">
                Fast-track setup for standard implementations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20 hover:border-gold/30 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-champagne mb-2">Team Setup</h3>
              <p className="text-sm text-bronze">
                Configure user roles and permissions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20 hover:border-gold/30 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-champagne mb-2">Analytics</h3>
              <p className="text-sm text-bronze">
                View implementation performance metrics
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}