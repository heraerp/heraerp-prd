import { useState } from 'react'
import { useOrgCases } from '@/hooks/use-organizations'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  User
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface OrgCasesProps {
  organizationId: string
}

export default function OrgCases({ organizationId }: OrgCasesProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const { currentOrgId } = useOrgStore()
  const { data, isLoading, error } = useOrgCases(organizationId, {
    status: filterStatus !== 'all' ? filterStatus : undefined,
    priority: filterPriority !== 'all' ? filterPriority : undefined
  })

  if (isLoading) {
    return <CasesSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load cases. Please try again.</AlertDescription>
      </Alert>
    )
  }

  const statusIcons = {
    open: Clock,
    in_progress: Clock,
    resolved: CheckCircle,
    closed: XCircle
  }

  const statusColors = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  const priorityColors = {
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200',
    medium:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200'
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cases</p>
                <p className="text-2xl font-bold">{data?.summary.total_cases}</p>
              </div>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Cases</p>
                <p className="text-2xl font-bold">{data?.summary.open_cases}</p>
              </div>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{data?.summary.resolved_cases}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Resolution</p>
                <p className="text-2xl font-bold">{data?.summary.avg_resolution_days}d</p>
              </div>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Related Cases ({data?.total || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data?.data && data.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Case #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map(caseItem => {
                  const StatusIcon =
                    statusIcons[caseItem.status as keyof typeof statusIcons] || Clock

                  return (
                    <TableRow key={caseItem.id}>
                      <TableCell className="font-mono text-xs">{caseItem.case_number}</TableCell>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <p className="font-medium line-clamp-1">{caseItem.title}</p>
                          {caseItem.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {caseItem.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {caseItem.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'capitalize border',
                            priorityColors[caseItem.priority as keyof typeof priorityColors]
                          )}
                        >
                          {caseItem.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <StatusIcon className="h-4 w-4" />
                          <Badge
                            className={cn(
                              'capitalize',
                              statusColors[caseItem.status as keyof typeof statusColors]
                            )}
                          >
                            {caseItem.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {caseItem.assigned_to ? (
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3" />
                            {caseItem.assigned_to}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(caseItem.created_at), 'MMM d')}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(caseItem.created_at), {
                              addSuffix: true
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {caseItem.case_entity_id && (
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={`/civicflow/cases/${caseItem.case_entity_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No cases found</p>
              <p className="text-sm text-muted-foreground">
                Support cases and service requests will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CasesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
