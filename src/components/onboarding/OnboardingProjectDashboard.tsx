'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users,
  Calendar,
  Target,
  TrendingUp
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * HERA Onboarding DNA v3.0 - Project Management Dashboard
 * 
 * Comprehensive dashboard for tracking onboarding project progress,
 * managing phases, creating checkpoints, and monitoring health metrics.
 */

interface OnboardingProject {
  id: string
  entity_code: string
  entity_name: string
  entity_description?: string
  status: string
  created_at: string
  updated_at: string
  dynamic_data?: Array<{
    field_name: string
    field_value_text?: string
    field_value_date?: string
    field_value_number?: number
    field_value_json?: any
  }>
}

interface ProjectMetrics {
  current_status: string
  health_status: string
  project_start_date: string
  target_go_live_date: string
  estimated_days: number
  current_phase: string
  progress_percentage: number
}

export function OnboardingProjectDashboard() {
  const [projects, setProjects] = useState<OnboardingProject[]>([])
  const [selectedProject, setSelectedProject] = useState<OnboardingProject | null>(null)
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics | null>(null)
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

      const response = await fetch('/api/v2/onboarding/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'X-Organization-Id': organization.id,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch onboarding projects')
      }

      const data = await response.json()
      
      if (data.success) {
        setProjects(data.projects || [])
        if (data.projects?.length > 0) {
          setSelectedProject(data.projects[0])
          parseProjectMetrics(data.projects[0])
        }
      } else {
        setError(data.message || 'Failed to load projects')
      }
    } catch (err) {
      console.error('Error fetching onboarding projects:', err)
      setError('Failed to connect to onboarding service')
    } finally {
      setLoading(false)
    }
  }

  const getAuthToken = async (): Promise<string> => {
    // In a real implementation, this would get the current Supabase session token
    // For now, we'll use a placeholder
    return 'placeholder-token'
  }

  const parseProjectMetrics = (project: OnboardingProject) => {
    if (!project.dynamic_data) return

    const metrics: Partial<ProjectMetrics> = {}
    
    project.dynamic_data.forEach(field => {
      switch (field.field_name) {
        case 'current_status':
          metrics.current_status = field.field_value_text || 'UNKNOWN'
          break
        case 'health_status':
          metrics.health_status = field.field_value_text || 'UNKNOWN'
          break
        case 'project_start_date':
          metrics.project_start_date = field.field_value_date || ''
          break
        case 'target_go_live_date':
          metrics.target_go_live_date = field.field_value_date || ''
          break
        case 'estimated_days':
          metrics.estimated_days = field.field_value_number || 0
          break
        default:
          break
      }
    })

    // Calculate progress percentage based on dates
    if (metrics.project_start_date && metrics.target_go_live_date) {
      const start = new Date(metrics.project_start_date)
      const target = new Date(metrics.target_go_live_date)
      const now = new Date()
      
      const totalDays = Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const daysElapsed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      
      metrics.progress_percentage = Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100)
    } else {
      metrics.progress_percentage = 0
    }

    metrics.current_phase = 'Phase 1: Shadow Mode' // Default phase

    setProjectMetrics(metrics as ProjectMetrics)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'GREEN': return 'bg-green-500'
      case 'AMBER': return 'bg-yellow-500'
      case 'RED': return 'bg-red-500'
      case 'PLANNING': return 'bg-blue-500'
      case 'EXECUTING': return 'bg-purple-500'
      case 'COMPLETED': return 'bg-green-600'
      default: return 'bg-gray-500'
    }
  }

  const createCheckpoint = async () => {
    if (!selectedProject) return

    try {
      const response = await fetch('/api/v2/onboarding/checkpoints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'X-Organization-Id': organization.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'create',
          checkpoint: {
            project_id: selectedProject.id,
            checkpoint_step: 'MANUAL_CHECKPOINT',
            checkpoint_name: 'Manual Checkpoint',
            checkpoint_description: 'Manually created checkpoint for current project state',
            checkpoint_type: 'FULL_ORG'
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Checkpoint created successfully!')
      } else {
        alert(`Failed to create checkpoint: ${data.message}`)
      }
    } catch (err) {
      console.error('Error creating checkpoint:', err)
      alert('Failed to create checkpoint')
    }
  }

  if (!isAuthenticated || !organization) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please log in and select an organization to access onboarding projects.
        </AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Onboarding Projects</h1>
          <p className="text-muted-foreground">
            Manage customer implementation projects with full lifecycle tracking
          </p>
        </div>
        <Button>
          <Play className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Project List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Onboarding Projects</h3>
            <p className="text-muted-foreground mb-4">
              Create your first onboarding project to start tracking customer implementations
            </p>
            <Button>
              <Play className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>
                Select a project to view detailed metrics and controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {projects.map(project => (
                  <div
                    key={project.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedProject?.id === project.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      setSelectedProject(project)
                      parseProjectMetrics(project)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{project.entity_name}</h3>
                        <p className="text-sm text-muted-foreground">{project.entity_description}</p>
                      </div>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          {selectedProject && projectMetrics && (
            <>
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(projectMetrics.health_status)}`} />
                      <div>
                        <p className="text-sm font-medium">Health Status</p>
                        <p className="text-2xl font-bold">{projectMetrics.health_status || 'Unknown'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Progress</p>
                        <p className="text-2xl font-bold">{Math.round(projectMetrics.progress_percentage || 0)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Target Go-Live</p>
                        <p className="text-sm font-bold">
                          {projectMetrics.target_go_live_date 
                            ? new Date(projectMetrics.target_go_live_date).toLocaleDateString()
                            : 'Not set'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">Estimated Days</p>
                        <p className="text-2xl font-bold">{projectMetrics.estimated_days || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress and Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Progress</CardTitle>
                  <CardDescription>
                    Current phase: {projectMetrics.current_phase} • Status: {projectMetrics.current_status}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={projectMetrics.progress_percentage} className="w-full" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm">Shadow Mode</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm">Dual Entry</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-sm">Pilot Users</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-sm">Regional Cutover</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-sm">Full Cutover</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Controls</CardTitle>
                  <CardDescription>
                    Manage project lifecycle, create checkpoints, and handle rollbacks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={createCheckpoint}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Checkpoint
                    </Button>
                    <Button variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Advance Phase
                    </Button>
                    <Button variant="outline">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Project
                    </Button>
                    <Button variant="destructive" size="sm">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Request Rollback
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}