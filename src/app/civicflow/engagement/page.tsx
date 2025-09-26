'use client'

import { useState, Suspense } from 'react'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  ChevronRight,
  TrendingUp,
  Users,
  Activity,
  Settings,
  Plus,
  ArrowUp,
  ArrowDown,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'
import {
  useEngagementStages,
  useEngagementJourneys,
  useEngagementFunnel,
  useCreateDefaultStages
} from '@/hooks/use-engagement'
import { isDemoMode } from '@/lib/demo-guard'
import { DemoBanner } from '@/components/communications/DemoBanner'
import { Loading } from '@/components/states/Loading'
import { ErrorState } from '@/components/states/ErrorState'
import { useToast } from '@/components/ui/use-toast'
import type { EngagementFilters } from '@/types/engagement'

function EngagementContent() {
  const { currentOrgId } = useOrgStore()
  const { toast } = useToast()
  const isDemo = isDemoMode(currentOrgId)

  const [activeTab, setActiveTab] = useState('funnel')
  const [filters, setFilters] = useState<EngagementFilters>({
    is_active: true,
    page: 1,
    page_size: 20
  })

  // Queries
  const { data: stages, isLoading: stagesLoading, error: stagesError } = useEngagementStages()
  const { data: journeysData, isLoading: journeysLoading } = useEngagementJourneys(filters)
  const { data: funnel, isLoading: funnelLoading } = useEngagementFunnel()

  // Mutations
  const createDefaultStages = useCreateDefaultStages()

  const handleCreateDefaultStages = async () => {
    try {
      await createDefaultStages.mutateAsync()
      toast({ title: 'Default engagement stages created successfully' })
    } catch (error) {
      toast({
        title: 'Failed to create stages',
        variant: 'destructive'
      })
    }
  }

  const getStageIcon = (stageOrder: number) => {
    const icons = ['🔍', '💙', '⚡', '⭐']
    return icons[stageOrder - 1] || '📍'
  }

  const getStageColor = (stageOrder: number) => {
    const colors = ['bg-gray-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500']
    return colors[stageOrder - 1] || 'bg-gray-400'
  }

  if (!currentOrgId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-medium mb-2">No Organization Selected</h2>
          <p className="text-muted-foreground">
            Please select an organization to view engagement data.
          </p>
        </div>
      </div>
    )
  }

  if (stagesError) {
    return (
      <div className="container mx-auto py-6">
        <ErrorState
          message="Failed to load engagement data"
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {isDemo && <DemoBanner />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Engagement Pipeline</h1>
        <div className="flex items-center gap-2">
          {(!stages || stages.length === 0) && (
            <Button onClick={handleCreateDefaultStages} disabled={createDefaultStages.isPending} className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Default Stages
            </Button>
          )}
          <Button variant="outline" className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10">
            <Settings className="h-4 w-4 mr-2" />
            Configure Stages
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Journeys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{funnel?.total_journeys || 0}</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {funnel?.conversion_rate ? `${Math.round(funnel.conversion_rate)}%` : '0%'}
              </span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Time to Convert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{funnel?.avg_time_to_convert || 0}d</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Journeys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {journeysData?.items.filter(j => j.is_active).length || 0}
              </span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="funnel">Funnel View</TabsTrigger>
          <TabsTrigger value="journeys">Journey Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          {/* Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              {funnelLoading ? (
                <Loading />
              ) : (
                <div className="space-y-4">
                  {funnel?.stages.map((stage, index) => (
                    <div key={stage.stage_id} className="relative">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full ${getStageColor(index + 1)} flex items-center justify-center text-white text-xl`}
                        >
                          {getStageIcon(index + 1)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{stage.stage_name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{stage.count} contacts</span>
                              <span>{stage.percentage}%</span>
                              <span>Avg: {stage.avg_time_in_stage}d</span>
                            </div>
                          </div>
                          <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`absolute left-0 top-0 h-full ${getStageColor(index + 1)}`}
                              style={{ width: `${stage.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {index < funnel.stages.length - 1 && (
                        <div className="ml-6 h-8 border-l-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center">
                          <ChevronRight className="h-4 w-4 text-gray-400 -ml-2" />
                          <span className="text-sm text-muted-foreground ml-2">
                            {stage.conversion_rate}% conversion
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journeys" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Journey Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select
                  value={filters.stage_ids?.[0] || 'all'}
                  onValueChange={value =>
                    setFilters({
                      ...filters,
                      stage_ids: value === 'all' ? undefined : [value]
                    })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {stages?.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.entity_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.subject_type || 'all'}
                  onValueChange={value =>
                    setFilters({
                      ...filters,
                      subject_type:
                        value === 'all' ? undefined : (value as 'constituent' | 'organization')
                    })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="constituent">Constituents</SelectItem>
                    <SelectItem value="organization">Organizations</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Journey Table */}
          <Card>
            <CardHeader>
              <CardTitle>Active Journeys</CardTitle>
            </CardHeader>
            <CardContent>
              {journeysLoading ? (
                <Loading />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Current Stage</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time in Stage</TableHead>
                      <TableHead>Next Best Action</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journeysData?.items.map(journey => (
                      <TableRow key={journey.id}>
                        <TableCell className="font-medium">
                          {journey.subject_name || journey.entity_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{journey.subject_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {getStageIcon(
                                stages?.findIndex(s => s.id === journey.current_stage_id) || 0 + 1
                              )}
                            </span>
                            {journey.current_stage_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {journey.score}
                            {journey.score_history?.length && (
                              <>
                                {journey.score_history[0].points > 0 ? (
                                  <ArrowUp className="h-3 w-3 text-green-500" />
                                ) : (
                                  <ArrowDown className="h-3 w-3 text-red-500" />
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {Math.floor(
                            (Date.now() - new Date(journey.entered_at).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}
                          d
                        </TableCell>
                        <TableCell>
                          {journey.next_best_action && (
                            <Badge
                              variant={
                                journey.next_best_action.priority === 'high'
                                  ? 'destructive'
                                  : journey.next_best_action.priority === 'medium'
                                    ? 'default'
                                    : 'secondary'
                              }
                            >
                              {journey.next_best_action.description}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
                            onClick={() => {
                              // Navigate to constituent/org profile
                              window.location.href = `/civicflow/constituents/${journey.subject_id}`
                            }}
                          >
                            View Profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced analytics and reporting features will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function EngagementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto">Loading...</div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <EngagementContent />
    </Suspense>
  )
}
