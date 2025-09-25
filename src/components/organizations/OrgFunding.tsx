import { useState } from 'react'
import { useOrgFunding } from '@/hooks/use-organizations'
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
  DollarSign,
  TrendingUp,
  Calendar,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface OrgFundingProps {
  organizationId: string
}

export default function OrgFunding({ organizationId }: OrgFundingProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const { currentOrgId } = useOrgStore()
  const { data, isLoading, error } = useOrgFunding(organizationId)

  const toggleRowExpansion = (grantId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(grantId)) {
      newExpanded.delete(grantId)
    } else {
      newExpanded.add(grantId)
    }
    setExpandedRows(newExpanded)
  }

  if (isLoading) {
    return <FundingSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load funding data. Please try again.</AlertDescription>
      </Alert>
    )
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  const fundingTypeColors = {
    grant: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    donation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    sponsorship: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
    contract: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold">
                  ${data?.summary.total_awarded.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Grants</p>
                <p className="text-2xl font-bold">{data?.summary.active_count}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{data?.summary.success_rate}%</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funding Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Grants & Funding ({data?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.data && data.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead>Grant Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Requested</TableHead>
                  <TableHead className="text-right">Awarded</TableHead>
                  <TableHead>Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map(grant => (
                  <>
                    <TableRow
                      key={grant.id}
                      className="cursor-pointer"
                      onClick={() => toggleRowExpansion(grant.id)}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={e => {
                            e.stopPropagation()
                            toggleRowExpansion(grant.id)
                          }}
                        >
                          {expandedRows.has(grant.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{grant.grant_name}</p>
                          <p className="text-xs text-muted-foreground">{grant.grant_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'capitalize',
                            fundingTypeColors[grant.funding_type as keyof typeof fundingTypeColors]
                          )}
                        >
                          {grant.funding_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'capitalize',
                            statusColors[grant.status as keyof typeof statusColors]
                          )}
                        >
                          {grant.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${grant.amount_requested.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${grant.amount_awarded.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(grant.start_date), 'MMM d, yyyy')}</p>
                          <p className="text-muted-foreground">
                            to {format(new Date(grant.end_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(grant.id) && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/20">
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-muted-foreground">Funder</p>
                                <p className="flex items-center gap-1">
                                  {grant.funder_name}
                                  {grant.funder_entity_id && (
                                    <a
                                      href={`/civicflow/organizations/${grant.funder_entity_id}`}
                                      className="text-primary hover:underline"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </p>
                              </div>
                              {grant.program && (
                                <div>
                                  <p className="font-medium text-muted-foreground">Program</p>
                                  <p>{grant.program}</p>
                                </div>
                              )}
                              {grant.project_lead && (
                                <div>
                                  <p className="font-medium text-muted-foreground">Project Lead</p>
                                  <p>{grant.project_lead}</p>
                                </div>
                              )}
                            </div>
                            {grant.description && (
                              <div>
                                <p className="font-medium text-muted-foreground text-sm mb-1">
                                  Description
                                </p>
                                <p className="text-sm">{grant.description}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                Applied: {format(new Date(grant.application_date), 'MMM d, yyyy')}
                              </span>
                              {grant.decision_date && (
                                <span>
                                  Decision: {format(new Date(grant.decision_date), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No funding records found</p>
              <p className="text-sm text-muted-foreground">
                Grant and funding information will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FundingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
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
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
