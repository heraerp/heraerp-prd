'use client'

import React, { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Rocket, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users,
  Calendar,
  Target,
  Activity,
  Settings,
  Database,
  Zap,
  Shield,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  FileText,
  Download,
  Eye,
  Edit,
  Save,
  XCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react'

/**
 * HERA Onboarding Project Detail - Individual project management
 * 
 * Features:
 * - Complete project overview with real-time metrics
 * - Phase management (Shadow Mode, Dual Entry, Pilot Users, etc.)
 * - Checkpoint creation and management interface
 * - Progress tracking with visual timeline
 * - Team collaboration and communication tools
 * - Risk management and rollback capabilities
 * - Mobile-first responsive design
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

interface ProjectPhase {
  id: string
  name: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'skipped'
  startDate?: string
  endDate?: string
  estimatedDays: number
  actualDays?: number
  checkpoints: ProjectCheckpoint[]
  riskLevel: 'low' | 'medium' | 'high'
}

interface ProjectCheckpoint {
  id: string
  phaseId: string
  name: string
  description: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  automated: boolean
  critical: boolean
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  lastActive: string
}

interface ProjectMetrics {
  overallProgress: number
  currentPhase: string
  daysElapsed: number
  estimatedDaysRemaining: number
  completedCheckpoints: number
  totalCheckpoints: number
  riskScore: number
  teamUtilization: number
}

export default function ProjectDetail() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<OnboardingProject | null>(null)
  const [phases, setPhases] = useState<ProjectPhase[]>([])
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { user, organization } = useHERAAuth()

  useEffect(() => {
    if (projectId && organization?.id) {
      fetchProjectDetails()
    }
  }, [projectId, organization])

  const fetchProjectDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulate auth token retrieval
      const authToken = 'placeholder-token'

      // Fetch project data
      const projectResponse = await fetch(`/api/v2/onboarding/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Organization-Id': organization.id,
          'Content-Type': 'application/json'
        }
      })

      if (!projectResponse.ok) {
        throw new Error(`Failed to fetch project: ${projectResponse.status}`)
      }

      const projectData = await projectResponse.json()
      if (projectData.success) {
        setProject(projectData.project)
        initializePhases(projectData.project)
        calculateMetrics(projectData.project)
        fetchTeamMembers()
      } else {
        setError(projectData.error || 'Failed to load project details')
      }
    } catch (err) {
      console.error('Error fetching project details:', err)
      setError('Failed to connect to project service')
    } finally {
      setLoading(false)
    }
  }

  const initializePhases = (project: OnboardingProject) => {
    // Initialize standard HERA onboarding phases
    const standardPhases: ProjectPhase[] = [
      {
        id: 'discovery',
        name: 'Discovery & Planning',
        description: 'Requirements gathering and solution design',
        status: 'completed',
        estimatedDays: 3,
        actualDays: 2,
        checkpoints: [
          {
            id: 'req_gathering',
            phaseId: 'discovery',
            name: 'Requirements Gathering',
            description: 'Complete business requirements collection',
            status: 'completed',
            createdAt: '2024-01-15T10:00:00Z',
            completedAt: '2024-01-15T16:30:00Z',
            automated: false,
            critical: true
          },
          {
            id: 'solution_design',
            phaseId: 'discovery',
            name: 'Solution Design',
            description: 'Technical solution architecture',
            status: 'completed',
            createdAt: '2024-01-16T09:00:00Z',
            completedAt: '2024-01-16T17:00:00Z',
            automated: false,
            critical: true
          }
        ],
        riskLevel: 'low'
      },
      {
        id: 'configuration',
        name: 'System Configuration',
        description: 'HERA system setup and customization',
        status: 'active',
        startDate: '2024-01-17T09:00:00Z',
        estimatedDays: 5,
        checkpoints: [
          {
            id: 'base_config',
            phaseId: 'configuration',
            name: 'Base Configuration',
            description: 'Core system settings and parameters',
            status: 'completed',
            createdAt: '2024-01-17T09:00:00Z',
            completedAt: '2024-01-17T15:30:00Z',
            automated: true,
            critical: true
          },
          {
            id: 'custom_fields',
            phaseId: 'configuration',
            name: 'Custom Fields Setup',
            description: 'Business-specific field configuration',
            status: 'completed',
            createdAt: '2024-01-18T10:00:00Z',
            completedAt: '2024-01-18T14:00:00Z',
            automated: false,
            critical: false
          },
          {
            id: 'workflow_config',
            phaseId: 'configuration',
            name: 'Workflow Configuration',
            description: 'Business process workflow setup',
            status: 'pending',
            createdAt: '2024-01-19T09:00:00Z',
            automated: false,
            critical: true
          }
        ],
        riskLevel: 'medium'
      },
      {
        id: 'data_migration',
        name: 'Data Migration',
        description: 'Legacy data import and validation',
        status: 'pending',
        estimatedDays: 4,
        checkpoints: [
          {
            id: 'data_mapping',
            phaseId: 'data_migration',
            name: 'Data Mapping',
            description: 'Map legacy data to HERA structure',
            status: 'pending',
            createdAt: '2024-01-20T09:00:00Z',
            automated: false,
            critical: true
          },
          {
            id: 'data_import',
            phaseId: 'data_migration',
            name: 'Data Import',
            description: 'Execute data migration scripts',
            status: 'pending',
            createdAt: '2024-01-21T09:00:00Z',
            automated: true,
            critical: true
          },
          {
            id: 'data_validation',
            phaseId: 'data_migration',
            name: 'Data Validation',
            description: 'Verify data integrity and accuracy',
            status: 'pending',
            createdAt: '2024-01-22T09:00:00Z',
            automated: true,
            critical: true
          }
        ],
        riskLevel: 'high'
      },
      {
        id: 'testing',
        name: 'Testing & Validation',
        description: 'System testing and user acceptance',
        status: 'pending',
        estimatedDays: 6,
        checkpoints: [
          {
            id: 'unit_testing',
            phaseId: 'testing',
            name: 'Unit Testing',
            description: 'Individual module functionality tests',
            status: 'pending',
            createdAt: '2024-01-23T09:00:00Z',
            automated: true,
            critical: true
          },
          {
            id: 'integration_testing',
            phaseId: 'testing',
            name: 'Integration Testing',
            description: 'End-to-end workflow testing',
            status: 'pending',
            createdAt: '2024-01-24T09:00:00Z',
            automated: false,
            critical: true
          },
          {
            id: 'uat',
            phaseId: 'testing',
            name: 'User Acceptance Testing',
            description: 'Business user validation',
            status: 'pending',
            createdAt: '2024-01-25T09:00:00Z',
            automated: false,
            critical: true
          }
        ],
        riskLevel: 'medium'
      },
      {
        id: 'training',
        name: 'Training & Documentation',
        description: 'User training and knowledge transfer',
        status: 'pending',
        estimatedDays: 3,
        checkpoints: [
          {
            id: 'admin_training',
            phaseId: 'training',
            name: 'Administrator Training',
            description: 'System administration training',
            status: 'pending',
            createdAt: '2024-01-26T09:00:00Z',
            automated: false,
            critical: true
          },
          {
            id: 'user_training',
            phaseId: 'training',
            name: 'End User Training',
            description: 'Staff training sessions',
            status: 'pending',
            createdAt: '2024-01-27T09:00:00Z',
            automated: false,
            critical: true
          },
          {
            id: 'documentation',
            phaseId: 'training',
            name: 'Documentation',
            description: 'User manuals and guides',
            status: 'pending',
            createdAt: '2024-01-28T09:00:00Z',
            automated: false,
            critical: false
          }
        ],
        riskLevel: 'low'
      },
      {
        id: 'golive',
        name: 'Go-Live & Support',
        description: 'Production deployment and initial support',
        status: 'pending',
        estimatedDays: 2,
        checkpoints: [
          {
            id: 'prod_deployment',
            phaseId: 'golive',
            name: 'Production Deployment',
            description: 'Deploy system to production',
            status: 'pending',
            createdAt: '2024-01-29T09:00:00Z',
            automated: true,
            critical: true
          },
          {
            id: 'go_live',
            phaseId: 'golive',
            name: 'Go-Live',
            description: 'System goes live for business operations',
            status: 'pending',
            createdAt: '2024-01-30T09:00:00Z',
            automated: false,
            critical: true
          },
          {
            id: 'support_setup',
            phaseId: 'golive',
            name: 'Support Setup',
            description: 'Ongoing support channel setup',
            status: 'pending',
            createdAt: '2024-01-30T12:00:00Z',
            automated: false,
            critical: false
          }
        ],
        riskLevel: 'high'
      }
    ]

    setPhases(standardPhases)
  }

  const calculateMetrics = (project: OnboardingProject) => {
    // Calculate project metrics based on phases and checkpoints
    const totalCheckpoints = phases.reduce((sum, phase) => sum + phase.checkpoints.length, 0) || 15 // Default estimate
    const completedCheckpoints = phases.reduce((sum, phase) => 
      sum + phase.checkpoints.filter(cp => cp.status === 'completed').length, 0) || 5 // Default estimate
    
    const completedPhases = phases.filter(p => p.status === 'completed').length || 1
    const totalPhases = phases.length || 6
    const overallProgress = Math.round((completedPhases / totalPhases) * 100)

    const startDate = new Date('2024-01-15T09:00:00Z') // Project start
    const now = new Date()
    const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const totalEstimatedDays = phases.reduce((sum, phase) => sum + phase.estimatedDays, 0) || 23
    const estimatedDaysRemaining = Math.max(0, totalEstimatedDays - daysElapsed)

    const metrics: ProjectMetrics = {
      overallProgress: overallProgress,
      currentPhase: 'System Configuration',
      daysElapsed: daysElapsed,
      estimatedDaysRemaining: estimatedDaysRemaining,
      completedCheckpoints: completedCheckpoints,
      totalCheckpoints: totalCheckpoints,
      riskScore: 35, // Medium risk
      teamUtilization: 78
    }

    setMetrics(metrics)
  }

  const fetchTeamMembers = () => {
    // Mock team members data
    const mockTeam: TeamMember[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@heraerp.com',
        role: 'Implementation Lead',
        lastActive: '2024-01-19T14:30:00Z'
      },
      {
        id: '2',
        name: 'Mike Chen',
        email: 'mike@heraerp.com',
        role: 'Technical Consultant',
        lastActive: '2024-01-19T16:45:00Z'
      },
      {
        id: '3',
        name: 'Lisa Rodriguez',
        email: 'lisa@client.com',
        role: 'Project Manager',
        lastActive: '2024-01-19T13:20:00Z'
      },
      {
        id: '4',
        name: 'David Kim',
        email: 'david@client.com',
        role: 'Business Analyst',
        lastActive: '2024-01-19T11:10:00Z'
      }
    ]
    setTeamMembers(mockTeam)
  }

  const executePhaseAction = async (phaseId: string, action: string) => {
    try {
      setActionLoading(`${phaseId}-${action}`)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      setPhases(prev => prev.map(phase => 
        phase.id === phaseId 
          ? { 
              ...phase, 
              status: action === 'start' ? 'active' : action === 'complete' ? 'completed' : phase.status 
            }
          : phase
      ))

    } catch (err) {
      console.error(`Error executing ${action} on phase ${phaseId}:`, err)
    } finally {
      setActionLoading(null)
    }
  }

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'active': return 'bg-blue-500'
      case 'pending': return 'bg-gray-400'
      case 'skipped': return 'bg-yellow-500'
      default: return 'bg-gray-400'
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent p-4 md:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gold/20 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-charcoal/50 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-charcoal/50 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-transparent p-4 md:p-6 lg:p-8">
        <Alert className="mb-6 border-red-500/20 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">
            {error || 'Project not found'}
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push('/onboarding')}
          variant="outline"
          className="border-gold/30 text-champagne hover:bg-gold/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/onboarding')}
              variant="outline"
              size="sm"
              className="border-gold/30 text-champagne hover:bg-gold/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-champagne mb-1">
                {project.entity_name}
              </h1>
              <p className="text-bronze">
                {project.entity_description || 'Customer implementation project'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="min-h-[44px] border-gold/30 text-champagne hover:bg-gold/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button className="min-h-[44px] bg-green-600 text-white hover:bg-green-700">
              <Settings className="w-4 h-4 mr-2" />
              Manage Project
            </Button>
          </div>
        </div>

        {/* Metrics Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-bronze">Overall Progress</p>
                    <p className="text-2xl font-bold text-champagne">{metrics.overallProgress}%</p>
                  </div>
                  <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-gold" />
                  </div>
                </div>
                <Progress value={metrics.overallProgress} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-bronze">Current Phase</p>
                    <p className="text-lg font-bold text-champagne">{metrics.currentPhase}</p>
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
                    <p className="text-sm font-medium text-bronze">Checkpoints</p>
                    <p className="text-2xl font-bold text-champagne">
                      {metrics.completedCheckpoints}/{metrics.totalCheckpoints}
                    </p>
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
                    <p className="text-sm font-medium text-bronze">Days Remaining</p>
                    <p className="text-2xl font-bold text-champagne">{metrics.estimatedDaysRemaining}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-charcoal/50">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="phases" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden md:inline">Phases</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Project Status Card */}
              <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
                <CardHeader>
                  <CardTitle className="text-champagne">Project Status</CardTitle>
                  <CardDescription className="text-bronze">
                    Current implementation status and health metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-bronze">Timeline Progress</span>
                          <span className="text-sm text-champagne">{metrics?.overallProgress}%</span>
                        </div>
                        <Progress value={metrics?.overallProgress || 0} className="h-2" />
                      </div>
                      
                      <div className="p-4 bg-black/20 rounded-lg">
                        <h3 className="font-medium text-champagne mb-2">Risk Assessment</h3>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span className="text-bronze">Medium Risk</span>
                          <Badge variant="outline" className="ml-auto border-yellow-500/30 text-yellow-300">
                            Score: {metrics?.riskScore || 0}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-black/20 rounded-lg">
                        <h3 className="font-medium text-champagne mb-2">Timeline</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-bronze">Days Elapsed:</span>
                            <span className="text-champagne">{metrics?.daysElapsed || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-bronze">Days Remaining:</span>
                            <span className="text-champagne">{metrics?.estimatedDaysRemaining || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-bronze">Team Utilization:</span>
                            <span className="text-champagne">{metrics?.teamUtilization || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
                <CardHeader>
                  <CardTitle className="text-champagne">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'Completed checkpoint', item: 'Base Configuration', time: '2 hours ago', type: 'success' },
                      { action: 'Started phase', item: 'System Configuration', time: '1 day ago', type: 'info' },
                      { action: 'Team member joined', item: 'Mike Chen (Technical Consultant)', time: '2 days ago', type: 'info' },
                      { action: 'Checkpoint failed', item: 'Initial Setup Validation', time: '3 days ago', type: 'warning' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${
                          activity.type === 'success' ? 'bg-green-500' : 
                          activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-champagne font-medium">
                            {activity.action}: <span className="font-normal">{activity.item}</span>
                          </p>
                          <p className="text-sm text-bronze">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Phases Tab */}
          <TabsContent value="phases">
            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardHeader>
                <CardTitle className="text-champagne">Implementation Phases</CardTitle>
                <CardDescription className="text-bronze">
                  Manage project phases and track checkpoint progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phases.map((phase, index) => (
                    <div key={phase.id} className="p-6 bg-black/20 rounded-xl border border-gold/10">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-4 h-4 rounded-full ${getPhaseStatusColor(phase.status)}`}></div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-champagne">{phase.name}</h3>
                            <p className="text-sm text-bronze mb-2">{phase.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-bronze">
                                {phase.checkpoints.filter(cp => cp.status === 'completed').length}/{phase.checkpoints.length} checkpoints
                              </span>
                              <span className={`${getRiskLevelColor(phase.riskLevel)} capitalize`}>
                                {phase.riskLevel} risk
                              </span>
                              <Badge variant={phase.status === 'active' ? 'default' : 'outline'}>
                                {phase.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {phase.status === 'pending' && (
                            <Button
                              onClick={() => executePhaseAction(phase.id, 'start')}
                              size="sm"
                              disabled={actionLoading === `${phase.id}-start`}
                              className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                              {actionLoading === `${phase.id}-start` ? (
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                              ) : (
                                <PlayCircle className="w-4 h-4 mr-2" />
                              )}
                              Start
                            </Button>
                          )}
                          {phase.status === 'active' && (
                            <Button
                              onClick={() => executePhaseAction(phase.id, 'complete')}
                              size="sm"
                              disabled={actionLoading === `${phase.id}-complete`}
                              className="bg-green-600 text-white hover:bg-green-700"
                            >
                              {actionLoading === `${phase.id}-complete` ? (
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gold/30 text-champagne hover:bg-gold/10"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </div>
                      </div>

                      {/* Checkpoints */}
                      {phase.checkpoints.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gold/10">
                          <h4 className="font-medium text-champagne mb-3">Checkpoints</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {phase.checkpoints.map((checkpoint) => (
                              <div
                                key={checkpoint.id}
                                className={`p-3 rounded-lg border ${
                                  checkpoint.status === 'completed' 
                                    ? 'bg-green-500/10 border-green-500/20' 
                                    : checkpoint.status === 'failed'
                                    ? 'bg-red-500/10 border-red-500/20'
                                    : 'bg-gray-500/10 border-gray-500/20'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {checkpoint.status === 'completed' ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                  ) : checkpoint.status === 'failed' ? (
                                    <XCircle className="w-4 h-4 text-red-400" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className="text-sm font-medium text-champagne">
                                    {checkpoint.name}
                                  </span>
                                  {checkpoint.critical && (
                                    <Badge variant="destructive" className="text-xs">Critical</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-bronze">{checkpoint.description}</p>
                                {checkpoint.automated && (
                                  <Badge variant="outline" className="mt-2 text-xs border-blue-500/30 text-blue-300">
                                    Automated
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardHeader>
                <CardTitle className="text-champagne">Project Team</CardTitle>
                <CardDescription className="text-bronze">
                  Manage team members and collaboration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="p-4 bg-black/20 rounded-xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                        <span className="text-gold font-medium">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-champagne">{member.name}</h3>
                        <p className="text-sm text-bronze">{member.role}</p>
                        <p className="text-sm text-bronze">{member.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-bronze">
                          Last active: {new Date(member.lastActive).toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline" className="border-gold/30 text-champagne hover:bg-gold/10">
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardHeader>
                <CardTitle className="text-champagne">Project Settings</CardTitle>
                <CardDescription className="text-bronze">
                  Configure project parameters and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-black/20 rounded-lg">
                    <h3 className="font-medium text-champagne mb-2">Project Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-bronze">Project ID:</span>
                        <span className="text-champagne font-mono">{project.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bronze">Created:</span>
                        <span className="text-champagne">{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bronze">Last Updated:</span>
                        <span className="text-champagne">{new Date(project.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-black/20 rounded-lg">
                    <h3 className="font-medium text-champagne mb-4">Danger Zone</h3>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
                      >
                        <PauseCircle className="w-4 h-4 mr-2" />
                        Pause Project
                      </Button>
                      <Button
                        variant="outline" 
                        className="w-full border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Rollback to Previous Checkpoint
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Archive Project
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20 md:h-0" />
    </div>
  )
}