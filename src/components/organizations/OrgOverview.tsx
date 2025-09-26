import { useQuery } from '@tanstack/react-query'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Building2,
  Globe,
  Hash,
  Calendar,
  MessageSquare,
  FileText,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

interface OrgOverviewProps {
  organizationId: string
}

export default function OrgOverview({ organizationId }: OrgOverviewProps) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  const { data, isLoading, error } = useQuery({
    queryKey: ['org-overview', organizationId, orgId],
    queryFn: async () => {
      const response = await fetch(`/api/civicflow/organizations/${organizationId}/overview`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch overview data')
      return response.json()
    }
  })

  if (isLoading) {
    return <OverviewSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load overview data. Please try again.</AlertDescription>
      </Alert>
    )
  }

  if (!data || !data.kpis) {
    return <OverviewSkeleton />
  }

  // Ensure all numeric values are valid
  const kpis = {
    ...data.kpis,
    programs_enrolled: data.kpis.programs_enrolled ?? 0,
    total_events_attended: data.kpis.total_events_attended ?? 0,
    messages_last_30d: data.kpis.messages_last_30d ?? 0,
    open_cases_count: data.kpis.open_cases_count ?? 0,
    active_grants_count: data.kpis.active_grants_count ?? 0,
    total_funding_received: data.kpis.total_funding_received ?? 0
  }

  return (
    <div className="space-y-6">
      {/* Identity Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <p className="capitalize">{data.identity.type || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant={data.identity.status === 'active' ? 'default' : 'secondary'}>
                {data.identity.status}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Sector</label>
              <p>{data.identity.sector || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Sub-sector</label>
              <p>{data.identity.sub_sector || 'Not specified'}</p>
            </div>
            {data.identity.registry_no && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Registry Number</label>
                <p className="font-mono">{data.identity.registry_no}</p>
              </div>
            )}
            {data.identity.website && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Website</label>
                <a
                  href={data.identity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {data.identity.website}
                  <Globe className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
          {data.identity.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm mt-1">{data.identity.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EDI Flags */}
      {data.edi_flags && Object.keys(data.edi_flags).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>EDI Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.edi_flags.minority_owned && (
                <Badge variant="secondary">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Minority Owned
                </Badge>
              )}
              {data.edi_flags.women_owned && (
                <Badge variant="secondary">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Women Owned
                </Badge>
              )}
              {data.edi_flags.disability_owned && (
                <Badge variant="secondary">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Disability Owned
                </Badge>
              )}
              {data.edi_flags.veteran_owned && (
                <Badge variant="secondary">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Veteran Owned
                </Badge>
              )}
              {data.edi_flags.lgbtq_owned && (
                <Badge variant="secondary">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  LGBTQ+ Owned
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Last Contact"
          value={
            kpis.last_contact_at
              ? formatDistanceToNow(new Date(kpis.last_contact_at), { addSuffix: true })
              : 'Never'
          }
          icon={Calendar}
          color="blue"
        />
        <KPICard
          title="Programs Enrolled"
          value={kpis.programs_enrolled}
          icon={Users}
          color="green"
        />
        <KPICard
          title="Events Attended"
          value={kpis.total_events_attended}
          icon={Calendar}
          color="purple"
        />
        <KPICard
          title="Messages (30d)"
          value={kpis.messages_last_30d}
          icon={MessageSquare}
          color="cyan"
        />
        <KPICard title="Open Cases" value={kpis.open_cases_count} icon={FileText} color="amber" />
        <KPICard
          title="Active Grants"
          value={kpis.active_grants_count}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Total Funding"
          value={`$${kpis.total_funding_received.toLocaleString()}`}
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Programs */}
      {data.programs && data.programs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.programs.map((program: any) => (
                <div
                  key={program.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{program.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {program.code} {'\u2022'} Enrolled{' '}
                      {format(new Date(program.enrolled_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                    {program.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: 'blue' | 'green' | 'purple' | 'cyan' | 'amber' | 'emerald'
}

function KPICard({ title, value, icon: Icon, color }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}
