/**
 * HERA CRM Activity History & Audit Trail Component
 * Comprehensive activity tracking and audit trail UI
 *
 * Project Manager Task: Activity History and Audit Trail (Task #8)
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Activity,
  User,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  Mail,
  Phone,
  FileText,
  Upload,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  TrendingUp,
  Users,
  Target,
  CheckSquare,
  Database,
  Zap,
  BarChart3
} from 'lucide-react'
import {
  createActivityTracker,
  type ActivityEvent,
  type ActivityFilter,
  type ActivitySummary
} from '@/lib/crm/activity-tracker'

interface ActivityHistoryProps {
  organizationId: string
  userId: string
  userName: string
  userEmail: string
  isOpen: boolean
  onClose: () => void
  // Optional filters to show activity for specific entity
  entityFilter?: {
    type: 'contact' | 'opportunity' | 'task'
    id: string
    name: string
  }
}

export function ActivityHistory({
  organizationId,
  userId,
  userName,
  userEmail,
  isOpen,
  onClose,
  entityFilter
}: ActivityHistoryProps) {
  // State
  const [activityTracker] = useState(() =>
    createActivityTracker(organizationId, userId, userName, userEmail)
  )
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [summary, setSummary] = useState<ActivitySummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<ActivityFilter>({
    ...(entityFilter
      ? {
          entity_type: entityFilter.type,
          entity_id: entityFilter.id
        }
      : {})
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const itemsPerPage = 25

  // Load activities
  const loadActivities = async (page = 1, resetList = true) => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const offset = (page - 1) * itemsPerPage
      const result = await activityTracker.getActivityHistory(filters, itemsPerPage, offset)

      if (resetList) {
        setActivities(result.activities)
      } else {
        setActivities(prev => [...prev, ...result.activities])
      }

      setTotalCount(result.total_count)
      setHasMore(result.has_more)
      setCurrentPage(page)
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load activity summary
  const loadSummary = async () => {
    try {
      const summaryData = await activityTracker.getActivitySummary(30)
      setSummary(summaryData)
    } catch (error) {
      console.error('Failed to load summary:', error)
    }
  }

  // Load data on mount and filter changes
  useEffect(() => {
    if (isOpen) {
      loadActivities(1)
      if (!entityFilter) {
        loadSummary()
      }
    }
  }, [isOpen, filters])

  // Handle filter changes
  const updateFilters = (newFilters: Partial<ActivityFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  // Clear filters
  const clearFilters = () => {
    setFilters(
      entityFilter
        ? {
            entity_type: entityFilter.type,
            entity_id: entityFilter.id
          }
        : {}
    )
  }

  // Export activities
  const handleExport = async () => {
    try {
      const result = await activityTracker.exportActivityHistory(filters, 'csv')
      if (result.success && result.data && result.filename) {
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        a.click()
        URL.revokeObjectURL(url)
      } else {
        alert(result.error || 'Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed')
    }
  }

  // Activity icon mapping
  const getActivityIcon = (activity: ActivityEvent) => {
    switch (activity.action_type) {
      case 'create':
        return <Plus className="h-4 w-4" />
      case 'update':
        return <Pencil className="h-4 w-4" />
      case 'delete':
        return <Trash2 className="h-4 w-4" />
      case 'view':
        return <Eye className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'call':
        return <Phone className="h-4 w-4" />
      case 'meeting':
        return <Users className="h-4 w-4" />
      case 'note':
        return <FileText className="h-4 w-4" />
      case 'import':
        return <Upload className="h-4 w-4" />
      case 'export':
        return <Download className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  // Activity color mapping
  const getActivityColor = (activity: ActivityEvent) => {
    switch (activity.severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-primary bg-blue-50 border-blue-200'
      case 'low':
        return 'text-muted-foreground bg-muted border-border'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60)
      return `${minutes}m ago`
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `${hours}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  // Render activity change details
  const renderChanges = (changes: Array<{ field: string; old_value: any; new_value: any }>) => {
    return (
      <div className="mt-2 text-xs text-muted-foreground">
        <details className="cursor-pointer">
          <summary className="hover:text-gray-200">View changes ({changes.length})</summary>
          <div className="mt-2 space-y-1 pl-4 border-l-2 border-border">
            {changes.map((change, index) => (
              <div key={index} className="flex justify-between">
                <span className="font-medium">{change.field}:</span>
                <span>
                  <span className="text-red-600">{String(change.old_value)}</span>
                  {' → '}
                  <span className="text-green-600">{String(change.new_value)}</span>
                </span>
              </div>
            ))}
          </div>
        </details>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Activity History & Audit Trail
              {entityFilter && (
                <Badge variant="outline" className="ml-2">
                  {entityFilter.type}: {entityFilter.name}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 flex-1 overflow-y-auto">
          <Tabs defaultValue="activities" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activities">Activity Log</TabsTrigger>
              <TabsTrigger value="summary" disabled={!!entityFilter}>
                Summary & Analytics
              </TabsTrigger>
            </TabsList>

            {/* Activity Log Tab */}
            <TabsContent value="activities" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters & Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div>
                      <Label>Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search activities..."
                          value={filters.search_query || ''}
                          onChange={e => updateFilters({ search_query: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Action Type */}
                    <div>
                      <Label>Action</Label>
                      <Select
                        value={filters.action_type || 'all'}
                        onValueChange={value =>
                          updateFilters({
                            action_type: value === 'all' ? undefined : value
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Actions</SelectItem>
                          <SelectItem value="create">Create</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="delete">Delete</SelectItem>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Entity Type */}
                    <div>
                      <Label>Entity Type</Label>
                      <Select
                        value={filters.entity_type || 'all'}
                        onValueChange={value =>
                          updateFilters({
                            entity_type: value === 'all' ? undefined : value
                          })
                        }
                        disabled={!!entityFilter}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="contact">Contacts</SelectItem>
                          <SelectItem value="opportunity">Opportunities</SelectItem>
                          <SelectItem value="task">Tasks</SelectItem>
                          <SelectItem value="document">Documents</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category */}
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={filters.category || 'all'}
                        onValueChange={value =>
                          updateFilters({
                            category: value === 'all' ? undefined : value
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="data_change">Data Changes</SelectItem>
                          <SelectItem value="communication">Communication</SelectItem>
                          <SelectItem value="document">Documents</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {totalCount > 0 ? `${totalCount} activities found` : 'No activities found'}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadActivities(1)}
                        disabled={isLoading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity List */}
              <div className="space-y-2">
                {isLoading && activities.length === 0 ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading activities...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-gray-100 mb-2">No activities found</h3>
                    <p className="text-muted-foreground">
                      No activities match your current filters
                    </p>
                  </Card>
                ) : (
                  <>
                    {activities.map((activity, index) => (
                      <Card
                        key={activity.id}
                        className={`border-l-4 ${getActivityColor(activity)}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              <div className={`p-2 rounded-full ${getActivityColor(activity)}`}>
                                {getActivityIcon(activity)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium text-gray-100 truncate">
                                    {activity.description}
                                  </p>
                                  <Badge
                                    variant={
                                      activity.severity === 'high' ||
                                      activity.severity === 'critical'
                                        ? 'destructive'
                                        : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {activity.severity}
                                  </Badge>
                                </div>

                                <div className="mt-1 flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span className="flex items-center">
                                    <User className="h-3 w-3 mr-1" />
                                    {activity.user_name}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatTimestamp(activity.timestamp)}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.entity_type}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.category}
                                  </Badge>
                                </div>

                                {/* Show changes if available */}
                                {activity.changes &&
                                  activity.changes.length > 0 &&
                                  renderChanges(activity.changes)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Load More */}
                    {hasMore && (
                      <div className="text-center pt-4">
                        <Button
                          variant="outline"
                          onClick={() => loadActivities(currentPage + 1, false)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>Load More ({totalCount - activities.length} remaining)</>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-6">
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Activities */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Total Activities
                          </p>
                          <p className="text-2xl font-bold">{summary.total_activities}</p>
                        </div>
                        <Activity className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activities by Type */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">By Action Type</h3>
                      <div className="space-y-2">
                        {Object.entries(summary.activities_by_type)
                          .slice(0, 5)
                          .map(([type, count]) => (
                            <div key={type} className="flex justify-between text-sm">
                              <span className="capitalize">{type}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activities by Category */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">By Category</h3>
                      <div className="space-y-2">
                        {Object.entries(summary.activities_by_category).map(([category, count]) => (
                          <div key={category} className="flex justify-between text-sm">
                            <span className="capitalize">{category.replace('_', ' ')}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Most Active Users */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Most Active Users</h3>
                      <div className="space-y-2">
                        {Object.entries(summary.activities_by_user)
                          .slice(0, 5)
                          .map(([user, count]) => (
                            <div key={user} className="flex justify-between text-sm">
                              <span>{user}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activities */}
                  <Card className="md:col-span-2">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
                      <div className="space-y-3">
                        {summary.recent_activities.slice(0, 8).map(activity => (
                          <div key={activity.id} className="flex items-center space-x-3 text-sm">
                            <div className={`p-1 rounded-full ${getActivityColor(activity)}`}>
                              {getActivityIcon(activity)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{activity.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {activity.user_name} • {formatTimestamp(activity.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Most Active Entities */}
                  <Card className="md:col-span-2">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Most Active Entities</h3>
                      <div className="space-y-2">
                        {summary.most_active_entities.slice(0, 10).map((entity, index) => (
                          <div
                            key={`${entity.entity_type}-${entity.entity_id}`}
                            className="flex justify-between items-center text-sm"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-muted-foreground">#{index + 1}</span>
                              <Badge variant="outline" className="text-xs">
                                {entity.entity_type}
                              </Badge>
                              <span className="truncate">{entity.entity_name}</span>
                            </div>
                            <span className="font-medium text-primary">
                              {entity.activity_count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default ActivityHistory
