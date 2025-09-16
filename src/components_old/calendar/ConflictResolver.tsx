'use client'

// HERA Universal Calendar Conflict Resolver
// Handles scheduling conflicts with smart resolution suggestions

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  Clock,
  Users,
  CheckCircle,
  X,
  RefreshCw,
  ArrowRight,
  Calendar,
  MapPin
} from 'lucide-react'

import { SchedulingConflict, ConflictResolution, TimeSlot } from '@/types/calendar.types'

interface ConflictResolverProps {
  conflicts: SchedulingConflict[]
  onResolve: (resolutions: Array<{ conflict_id: string; resolution: ConflictResolution }>) => void
  onDismiss?: () => void
}

export function ConflictResolver({ conflicts, onResolve, onDismiss }: ConflictResolverProps) {
  const [selectedResolutions, setSelectedResolutions] = useState<
    Record<string, ConflictResolution>
  >({})
  const [activeTab, setActiveTab] = useState('overview')

  // ==================== CONFLICT ANALYSIS ====================
  const conflictStats = {
    critical: conflicts.filter(c => c.severity === 'critical').length,
    error: conflicts.filter(c => c.severity === 'error').length,
    warning: conflicts.filter(c => c.severity === 'warning').length,
    autoResolvable: conflicts.filter(c => c.auto_resolvable).length
  }

  // ==================== HANDLERS ====================
  const handleResolutionSelect = (conflictId: string, resolution: ConflictResolution) => {
    setSelectedResolutions(prev => ({
      ...prev,
      [conflictId]: resolution
    }))
  }

  const handleResolveAll = () => {
    const resolutions = conflicts.map(conflict => ({
      conflict_id: conflict.conflict_id,
      resolution: selectedResolutions[conflict.conflict_id] || conflict.suggestions[0]
    }))

    onResolve(resolutions)
  }

  const handleAutoResolve = () => {
    const autoResolvableConflicts = conflicts.filter(c => c.auto_resolvable)
    const resolutions = autoResolvableConflicts.map(conflict => ({
      conflict_id: conflict.conflict_id,
      resolution: conflict.suggestions[0] // Use first suggestion for auto-resolve
    }))

    onResolve(resolutions)
  }

  // ==================== RENDER HELPERS ====================
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'error':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-muted text-gray-200 border-border'
    }
  }

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'resource_double_booking':
        return <Users className="h-4 w-4" />
      case 'maintenance_overlap':
        return <RefreshCw className="h-4 w-4" />
      case 'skills_unavailable':
        return <AlertTriangle className="h-4 w-4" />
      case 'capacity_exceeded':
        return <MapPin className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getResolutionIcon = (type: string) => {
    switch (type) {
      case 'reschedule':
        return <Clock className="h-4 w-4" />
      case 'reassign_resource':
        return <Users className="h-4 w-4" />
      case 'split_appointment':
        return <Calendar className="h-4 w-4" />
      case 'waitlist':
        return <RefreshCw className="h-4 w-4" />
      default:
        return <ArrowRight className="h-4 w-4" />
    }
  }

  const formatTimeSlot = (slot: TimeSlot) => {
    return `${slot.start_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${slot.end_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  const renderConflictCard = (conflict: SchedulingConflict) => {
    const selectedResolution = selectedResolutions[conflict.conflict_id]

    return (
      <Card key={conflict.conflict_id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getConflictIcon(conflict.type)}
              <CardTitle className="text-base">
                {conflict.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getSeverityColor(conflict.severity)} variant="secondary">
                {conflict.severity}
              </Badge>
              {conflict.auto_resolvable && (
                <Badge variant="outline" className="text-green-600">
                  Auto-resolvable
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Affected Items */}
          <div>
            <h4 className="font-medium text-sm mb-2">Affected:</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              {conflict.affected_appointments.length > 0 && (
                <div>
                  <span className="font-medium">Appointments:</span>{' '}
                  {conflict.affected_appointments.join(', ')}
                </div>
              )}
              {conflict.affected_resources.length > 0 && (
                <div>
                  <span className="font-medium">Resources:</span>{' '}
                  {conflict.affected_resources.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Resolution Options */}
          <div>
            <h4 className="font-medium text-sm mb-3">Resolution Options:</h4>
            <div className="space-y-2">
              {conflict.suggestions.map((suggestion, index) => {
                const isSelected =
                  selectedResolution?.resolution_type === suggestion.resolution_type

                return (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-all p-3 ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-muted'
                    }`}
                    onClick={() => handleResolutionSelect(conflict.conflict_id, suggestion)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">{getResolutionIcon(suggestion.resolution_type)}</div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-sm">
                            {suggestion.resolution_type
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, l => l.toUpperCase())}
                          </h5>
                          {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>

                        {/* Alternative options */}
                        {suggestion.alternative_slots &&
                          suggestion.alternative_slots.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Alternative times:</span>
                              <div className="mt-1 space-y-1">
                                {suggestion.alternative_slots.slice(0, 3).map((slot, slotIndex) => (
                                  <div key={slotIndex} className="flex items-center space-x-2">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatTimeSlot(slot)}</span>
                                  </div>
                                ))}
                                {suggestion.alternative_slots.length > 3 && (
                                  <span className="text-muted-foreground">
                                    +{suggestion.alternative_slots.length - 3} more options
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                        {suggestion.alternative_resources &&
                          suggestion.alternative_resources.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Alternative resources:</span>
                              <span className="ml-1">
                                {suggestion.alternative_resources.join(', ')}
                              </span>
                            </div>
                          )}

                        {suggestion.cost_impact && suggestion.cost_impact !== 0 && (
                          <div className="text-xs">
                            <span className="font-medium">Cost impact:</span>
                            <span
                              className={`ml-1 ${suggestion.cost_impact > 0 ? 'text-red-600' : 'text-green-600'}`}
                            >
                              {suggestion.cost_impact > 0 ? '+' : ''}${suggestion.cost_impact}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ==================== RENDER ====================
  if (conflicts.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conflicts">Conflicts ({conflicts.length})</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            {conflictStats.autoResolvable > 0 && (
              <Button variant="outline" size="sm" onClick={handleAutoResolve}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Auto-resolve ({conflictStats.autoResolvable})
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleResolveAll}
              disabled={Object.keys(selectedResolutions).length === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve All
            </Button>

            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Scheduling Conflicts Detected</AlertTitle>
            <AlertDescription>
              {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} found. Review and select
              resolution options below.
            </AlertDescription>
          </Alert>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{conflictStats.critical}</div>
                <div className="text-sm text-muted-foreground">Critical</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{conflictStats.error}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{conflictStats.warning}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {conflictStats.autoResolvable}
                </div>
                <div className="text-sm text-muted-foreground">Auto-resolvable</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <h4 className="font-medium">Auto-resolve all possible conflicts</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically apply the best suggested resolution for{' '}
                    {conflictStats.autoResolvable} conflicts
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleAutoResolve}
                  disabled={conflictStats.autoResolvable === 0}
                >
                  Auto-resolve
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <h4 className="font-medium">Review each conflict manually</h4>
                  <p className="text-sm text-muted-foreground">
                    Examine each conflict and choose the best resolution option
                  </p>
                </div>
                <Button variant="outline" onClick={() => setActiveTab('conflicts')}>
                  Review Conflicts
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <div className="space-y-4">
            {conflicts
              .sort((a, b) => {
                const severityOrder = { critical: 3, error: 2, warning: 1 }
                return (
                  (severityOrder[b.severity as keyof typeof severityOrder] || 0) -
                  (severityOrder[a.severity as keyof typeof severityOrder] || 0)
                )
              })
              .map(renderConflictCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
