import { useState } from 'react'
import { useOrgEngagement, useUpdateOrgStage } from '@/hooks/use-organizations'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Target,
  Lightbulb,
  Calendar,
  MessageSquare,
  Users,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface OrgEngagementProps {
  organizationId: string
}

const stageOptions = [
  { value: '1', label: 'Awareness', description: 'Organization is aware of our services' },
  { value: '2', label: 'Interest', description: 'Organization shows interest in programs' },
  { value: '3', label: 'Active', description: 'Actively engaged in programs/services' },
  { value: '4', label: 'Champion', description: 'Strong advocate and partner' }
]

export default function OrgEngagement({ organizationId }: OrgEngagementProps) {
  const { currentOrgId } = useOrgStore()
  const { data, isLoading, error } = useOrgEngagement(organizationId)
  const updateStageMutation = useUpdateOrgStage(organizationId)
  const [selectedStage, setSelectedStage] = useState<string>('')

  const handleStageUpdate = async () => {
    if (!selectedStage) return

    try {
      await updateStageMutation.mutateAsync(parseInt(selectedStage))
      toast.success('Engagement stage updated successfully')
      setSelectedStage('')
    } catch (error) {
      toast.error('Failed to update engagement stage')
    }
  }

  if (isLoading) {
    return <EngagementSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load engagement data. Please try again.</AlertDescription>
      </Alert>
    )
  }

  const trendIcon =
    data?.current.score_trend === 'up'
      ? TrendingUp
      : data?.current.score_trend === 'down'
        ? TrendingDown
        : Minus

  const trendColor =
    data?.current.score_trend === 'up'
      ? 'text-green-600'
      : data?.current.score_trend === 'down'
        ? 'text-red-600'
        : 'text-gray-400'

  return (
    <div className="space-y-6">
      {/* Current Stage Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Engagement Stage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Current Stage</h4>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map(stage => (
                    <div
                      key={stage}
                      className={cn(
                        'h-2 w-12 rounded-full transition-colors',
                        stage <= (data?.current.stage_ordinal || 1)
                          ? stage === 4
                            ? 'bg-purple-500'
                            : stage === 3
                              ? 'bg-green-500'
                              : stage === 2
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                          : 'bg-gray-200'
                      )}
                    />
                  ))}
                </div>
                <Badge className="capitalize" variant="default">
                  {data?.current.stage}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {
                  stageOptions.find(s => s.value === String(data?.current.stage_ordinal))
                    ?.description
                }
              </p>
              {data?.current.stage_updated_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Updated{' '}
                  {formatDistanceToNow(new Date(data.current.stage_updated_at), {
                    addSuffix: true
                  })}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Update Stage</h4>
              <div className="flex gap-2">
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select new stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stageOptions.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.value === String(data?.current.stage_ordinal)}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleStageUpdate}
                  disabled={!selectedStage || updateStageMutation.isPending}
                >
                  Update
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Engagement Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Summary */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{data?.current.score}</p>
                  <p className="text-sm text-muted-foreground">out of 100</p>
                </div>
                <div className="flex items-center gap-2">
                  {trendIcon === TrendingUp && <TrendingUp className={cn('h-6 w-6', trendColor)} />}
                  {trendIcon === TrendingDown && (
                    <TrendingDown className={cn('h-6 w-6', trendColor)} />
                  )}
                  {trendIcon === Minus && <Minus className={cn('h-6 w-6', trendColor)} />}
                  <span className={cn('text-sm font-medium', trendColor)}>
                    {data?.current.score_trend === 'up'
                      ? '+'
                      : data?.current.score_trend === 'down'
                        ? '-'
                        : ''}
                    {Math.abs(data?.current.score_change || 0)} points
                  </span>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-2">
                <ScoreComponent
                  label="Communication"
                  value={data?.current.component_scores.communication_score || 0}
                  icon={MessageSquare}
                />
                <ScoreComponent
                  label="Program Participation"
                  value={data?.current.component_scores.participation_score || 0}
                  icon={Users}
                />
                <ScoreComponent
                  label="Event Attendance"
                  value={data?.current.component_scores.event_score || 0}
                  icon={Calendar}
                />
              </div>
            </div>

            {/* Score History Chart */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Score Trend (90 days)
              </h4>
              {data?.history && data.history.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={date => format(new Date(date), 'MMM d')}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={date => format(new Date(date), 'MMM d, yyyy')}
                      formatter={(value: number) => [`${value} points`, 'Score']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">No historical data available</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Best Actions */}
      {data?.nba_actions && data.nba_actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.nba_actions.map((action, index) => {
                const priorityColors = {
                  high: 'border-red-500 bg-red-50 dark:bg-red-900/10',
                  medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
                  low: 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                }

                return (
                  <div
                    key={index}
                    className={cn(
                      'p-4 rounded-lg border-2',
                      priorityColors[action.priority as keyof typeof priorityColors]
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{action.action}</h4>
                          <Badge variant="outline" className="text-xs">
                            {action.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{action.reason}</p>
                        {action.impact && (
                          <p className="text-sm font-medium">Potential impact: {action.impact}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface ScoreComponentProps {
  label: string
  value: number
  icon: React.ElementType
}

function ScoreComponent({ label, value, icon: Icon }: ScoreComponentProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-24 bg-muted rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${value}%` }} />
        </div>
        <span className="text-sm font-medium w-10 text-right">{value}%</span>
      </div>
    </div>
  )
}

function EngagementSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
