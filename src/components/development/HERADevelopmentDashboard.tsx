'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  GitBranch,
  GitPullRequest,
  Clock,
  Code2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Zap,
  TrendingUp,
  Users,
  Package,
  Target,
  Sparkles,
  Database,
  Cpu,
  FileCode,
  Bug,
  Rocket,
  Timer,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react'

interface BuildStatus {
  category: string
  icon: React.ComponentType<any>
  color: string
  percentage: number
  description: string
  tasks: {
    name: string
    status: 'completed' | 'in_progress' | 'pending'
    assignee?: string
  }[]
}

interface DevelopmentTask {
  id: string
  entity_code: string
  entity_name: string
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee: string
  created_at: string
  updated_at: string
  estimated_hours: number
  actual_hours: number
  sprint: string
  tags: string[]
  completion_percentage: number
}

interface GitActivity {
  id: string
  type: 'commit' | 'pr' | 'issue' | 'merge'
  message: string
  author: string
  timestamp: string
  branch: string
  stats?: {
    additions: number
    deletions: number
    files: number
  }
}

interface Sprint {
  id: string
  name: string
  start_date: string
  end_date: string
  status: 'planning' | 'active' | 'completed'
  velocity: number
  story_points_planned: number
  story_points_completed: number
}

export function HERADevelopmentDashboard() {
  const [buildProgress, setBuildProgress] = useState<BuildStatus[]>([
    {
      category: 'Universal Tables',
      icon: Database,
      color: 'emerald',
      percentage: 100,
      description: 'Core 6-table architecture with 50+ indexes',
      tasks: [
        { name: 'Schema Design', status: 'completed' },
        { name: 'Indexes & Performance', status: 'completed' },
        { name: 'RLS Policies', status: 'completed' }
      ]
    },
    {
      category: 'Universal API',
      icon: Cpu,
      color: 'blue',
      percentage: 100,
      description: 'Enterprise-grade REST API with JWT auth',
      tasks: [
        { name: 'CRUD Operations', status: 'completed' },
        { name: 'Authentication', status: 'completed' },
        { name: 'Mock Mode', status: 'completed' }
      ]
    },
    {
      category: 'Universal UI',
      icon: Sparkles,
      color: 'purple',
      percentage: 100,
      description: 'PWM-quality component library',
      tasks: [
        { name: 'Base Components', status: 'completed' },
        { name: 'Dark Theme', status: 'completed' },
        { name: 'Animations', status: 'completed' }
      ]
    },
    {
      category: 'Smart Coding',
      icon: Code2,
      color: 'orange',
      percentage: 100,
      description: 'Intelligent code pattern system',
      tasks: [
        { name: 'Pattern Engine', status: 'completed' },
        { name: 'Domain Codes', status: 'completed' },
        { name: 'Validation Rules', status: 'completed' }
      ]
    },
    {
      category: 'Business Modules',
      icon: Package,
      color: 'indigo',
      percentage: 60,
      description: 'Industry-specific implementations',
      tasks: [
        { name: 'Financial Core', status: 'completed' },
        { name: 'Inventory Management', status: 'completed' },
        { name: 'CRM System', status: 'in_progress' },
        { name: 'HR Module', status: 'pending' },
        { name: 'Manufacturing', status: 'pending' }
      ]
    },
    {
      category: 'Industry Apps',
      icon: Rocket,
      color: 'pink',
      percentage: 25,
      description: 'Vertical market solutions',
      tasks: [
        { name: 'Restaurant POS', status: 'completed' },
        { name: 'Healthcare EMR', status: 'in_progress' },
        { name: 'Professional Services', status: 'pending' },
        { name: 'Retail Commerce', status: 'pending' }
      ]
    }
  ])

  const [recentTasks, setRecentTasks] = useState<DevelopmentTask[]>([
    {
      id: '1',
      entity_code: 'TASK-2024-001',
      entity_name: 'Implement Development Dashboard',
      status: 'in_progress',
      priority: 'high',
      assignee: 'Claude AI',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      estimated_hours: 4,
      actual_hours: 2.5,
      sprint: 'Sprint 2024.1',
      tags: ['meta-system', 'ui', 'dashboard'],
      completion_percentage: 75
    },
    {
      id: '2',
      entity_code: 'TASK-2024-002',
      entity_name: 'Complete Smart Code System',
      status: 'completed',
      priority: 'critical',
      assignee: 'HERA Team',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      estimated_hours: 8,
      actual_hours: 6,
      sprint: 'Sprint 2024.1',
      tags: ['smart-codes', 'core'],
      completion_percentage: 100
    }
  ])

  const [gitActivity, setGitActivity] = useState<GitActivity[]>([
    {
      id: '1',
      type: 'commit',
      message: '🚀 Implement HERA Development Dashboard with meta-tracking',
      author: 'Claude AI',
      timestamp: new Date().toISOString(),
      branch: 'main',
      stats: { additions: 450, deletions: 20, files: 5 }
    },
    {
      id: '2',
      type: 'pr',
      message: 'feat: Add universal GL posting system',
      author: 'Development Team',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      branch: 'feature/universal-gl'
    }
  ])

  const [currentSprint, setCurrentSprint] = useState<Sprint>({
    id: 'sprint-2024-1',
    name: 'Sprint 2024.1 - Universal Architecture',
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    velocity: 45,
    story_points_planned: 50,
    story_points_completed: 32
  })

  const [isRefreshing, setIsRefreshing] = useState(false)

  // Calculate overall progress
  const overallProgress = Math.round(
    buildProgress.reduce((sum, item) => sum + item.percentage, 0) / buildProgress.length
  )

  // Refresh data
  const refreshData = async () => {
    setIsRefreshing(true)
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'in_progress':
        return 'text-primary bg-blue-50 border-blue-200'
      case 'blocked':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-muted text-gray-200'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'commit':
        return <GitPullRequest className="w-4 h-4" />
      case 'pr':
        return <GitBranch className="w-4 h-4" />
      case 'issue':
        return <Bug className="w-4 h-4" />
      case 'merge':
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return <Circle className="w-4 h-4" />
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <Zap className="w-7 h-7 text-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-100">HERA Development Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Meta-system tracking HERA's own development
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="w-3 h-3 mr-1" />
            Live Tracking
          </Badge>
          <Button
            onClick={refreshData}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Overall Build Progress
            </span>
            <span className="text-2xl font-bold text-purple-700">{overallProgress}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {buildProgress.map(item => {
              const Icon = item.icon
              return (
                <div key={item.category} className="text-center">
                  <div
                    className={`w-12 h-12 mx-auto mb-2 bg-${item.color}-100 rounded-xl flex items-center justify-center`}
                  >
                    <Icon className={`w-6 h-6 text-${item.color}-600`} />
                  </div>
                  <div className="text-sm font-medium text-gray-100">{item.category}</div>
                  <div className="text-2xl font-bold text-gray-100">{item.percentage}%</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Development Tasks</TabsTrigger>
          <TabsTrigger value="sprint">Sprint Progress</TabsTrigger>
          <TabsTrigger value="git">Git Activity</TabsTrigger>
          <TabsTrigger value="metrics">Build Metrics</TabsTrigger>
        </TabsList>

        {/* Development Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  Active Development Tasks
                </span>
                <Button size="sm">Create Task</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTasks.map(task => (
                  <div
                    key={task.id}
                    className="border rounded-lg p-4 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline">{task.entity_code}</Badge>
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-gray-100 mb-1">{task.entity_name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {task.assignee}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.actual_hours}h / {task.estimated_hours}h
                          </span>
                          <span>{task.sprint}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {task.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-100">
                          {task.completion_percentage}%
                        </div>
                        <Progress value={task.completion_percentage} className="w-24 h-2 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sprint Progress Tab */}
        <TabsContent value="sprint" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                {currentSprint.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {currentSprint.story_points_completed}
                  </div>
                  <div className="text-sm text-muted-foreground">Points Completed</div>
                  <Progress
                    value={
                      (currentSprint.story_points_completed / currentSprint.story_points_planned) *
                      100
                    }
                    className="mt-2"
                  />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{currentSprint.velocity}</div>
                  <div className="text-sm text-muted-foreground">Velocity</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">7</div>
                  <div className="text-sm text-muted-foreground">Days Remaining</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-4">Sprint Goals</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="line-through text-muted-foreground">
                      Complete Smart Code System
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Circle className="w-5 h-5 text-blue-500" />
                    <span>Build Development Dashboard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Circle className="w-5 h-5 text-muted-foreground" />
                    <span>Implement Audit Workflow System</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Git Activity Tab */}
        <TabsContent value="git" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Recent Git Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gitActivity.map(activity => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'commit'
                          ? 'bg-green-100 text-green-600'
                          : activity.type === 'pr'
                            ? 'bg-blue-100 text-primary'
                            : activity.type === 'issue'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-purple-100 text-purple-600'
                      }`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-100">{activity.message}</div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{activity.author}</span>
                        <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        <span className="text-primary">{activity.branch}</span>
                      </div>
                      {activity.stats && (
                        <div className="flex items-center gap-4 text-sm mt-2">
                          <span className="text-green-600">+{activity.stats.additions}</span>
                          <span className="text-red-600">-{activity.stats.deletions}</span>
                          <span className="text-muted-foreground">
                            {activity.stats.files} files
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Build Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {buildProgress.map(category => {
              const Icon = category.icon
              return (
                <Card key={category.category}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        {category.category}
                      </span>
                      <span className="text-xl font-bold">{category.percentage}%</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                    <div className="space-y-2">
                      {category.tasks.map(task => (
                        <div key={task.name} className="flex items-center justify-between">
                          <span className="text-sm ink">{task.name}</span>
                          <Badge
                            className={
                              task.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : task.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-muted text-gray-200'
                            }
                          >
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Meta Architecture Info */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-900">HERA Meta-Architecture</h3>
          </div>
          <p className="text-sm text-purple-800 mb-4">
            This dashboard demonstrates HERA building HERA - all development tasks, sprints, and
            metrics are stored in the same universal 6-table architecture:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-background/50 p-3 rounded-lg">
              <strong className="text-purple-900">core_entities</strong>
              <p className="text-purple-700 mt-1">Tasks stored as entity_type='development_task'</p>
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <strong className="text-purple-900">universal_transactions</strong>
              <p className="text-purple-700 mt-1">
                Work logs as transaction_type='development_work'
              </p>
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <strong className="text-purple-900">core_dynamic_data</strong>
              <p className="text-purple-700 mt-1">Sprint velocity, story points, git stats</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
