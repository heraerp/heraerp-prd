'use client';

import { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Mail, Calendar, Target,
  Download, RefreshCw, ChevronRight, Filter, ArrowUp, ArrowDown
} from 'lucide-react';
import { useAnalyticsPanels, useKPIs, useExportAnalytics } from '@/hooks/use-analytics';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Color palette for charts
const COLORS = {
  primary: '#2563eb',
  secondary: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280',
  chart: ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'],
};

function LoadingCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32" />
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('last30days');
  const [program, setProgram] = useState<string>('all');
  const [segment, setSegment] = useState<string>('all');
  const [channel, setChannel] = useState<string>('all');

  const filters = {
    date_from: getDateFromRange(dateRange).toISOString(),
    date_to: new Date().toISOString(),
    ...(program !== 'all' && { program_ids: [program] }),
    ...(segment !== 'all' && { segment }),
    ...(channel !== 'all' && { channels: [channel] }),
  };

  const { data: analytics, isLoading, refetch } = useAnalyticsPanels(filters);
  const { data: kpis } = useKPIs();
  const exportMutation = useExportAnalytics();

  const handleExport = (format: 'csv' | 'pdf' | 'json') => {
    exportMutation.mutate({ format, filters });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track communications performance, engagement, and KPI contributions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">Last 7 days</SelectItem>
                  <SelectItem value="last30days">Last 30 days</SelectItem>
                  <SelectItem value="last90days">Last 90 days</SelectItem>
                  <SelectItem value="lastYear">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Program</label>
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  <SelectItem value="health">Health & Wellness</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="housing">Housing</SelectItem>
                  <SelectItem value="employment">Employment Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Segment</label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  <SelectItem value="underserved">Underserved</SelectItem>
                  <SelectItem value="seniors">Seniors</SelectItem>
                  <SelectItem value="youth">Youth</SelectItem>
                  <SelectItem value="families">Families</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Channel</label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="print">Print</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deliverability">Deliverability</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="kpis">KPI Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Reach"
              value={analytics?.deliverability.sent || 0}
              change={12.5}
              icon={<Users className="h-5 w-5" />}
              color="primary"
            />
            <KPICard
              title="Engagement Rate"
              value={`${analytics?.deliverability.open_rate || 0}%`}
              change={-2.3}
              icon={<Mail className="h-5 w-5" />}
              color="secondary"
            />
            <KPICard
              title="Active Journeys"
              value={analytics?.journey_progression.active_journeys || 0}
              change={8.7}
              icon={<TrendingUp className="h-5 w-5" />}
              color="success"
            />
            <KPICard
              title="KPI Achievement"
              value={`${calculateAvgKPIAchievement(analytics?.kpi_contribution.kpis)}%`}
              change={15.2}
              icon={<Target className="h-5 w-5" />}
              color="warning"
            />
          </div>

          {/* Quick insights */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Insights</CardTitle>
              <CardDescription>Key findings from your recent activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <InsightItem
                  type="success"
                  title="Email engagement up 23% this month"
                  description="Your targeted campaigns are resonating with the community"
                />
                <InsightItem
                  type="warning"
                  title="Event attendance below target"
                  description="Consider more personalized invitations and reminders"
                />
                <InsightItem
                  type="info"
                  title="Journey conversions improving"
                  description="Average time to convert decreased by 2.5 days"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliverability" className="space-y-6">
          <Suspense fallback={<LoadingCard />}>
            <DeliverabilityPanel data={analytics?.deliverability} />
          </Suspense>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Suspense fallback={<LoadingCard />}>
            <EngagementPanel data={analytics?.engagement_funnel} />
          </Suspense>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Suspense fallback={<LoadingCard />}>
            <EventsPanel data={analytics?.event_attendance} />
          </Suspense>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6">
          <Suspense fallback={<LoadingCard />}>
            <KPIPanel data={analytics?.kpi_contribution} kpis={kpis} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper components

function KPICard({ title, value, change, icon, color }: {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning';
}) {
  const isPositive = change > 0;
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    secondary: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20',
    success: 'bg-green-50 text-green-600 dark:bg-green-900/20',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>
            {icon}
          </div>
          <Badge
            variant={isPositive ? 'default' : 'secondary'}
            className={cn(
              'gap-1',
              isPositive ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            )}
          >
            {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(change)}%
          </Badge>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </CardContent>
    </Card>
  );
}

function InsightItem({ type, title, description }: {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
}) {
  const typeClasses = {
    success: 'border-green-500 bg-green-50 dark:bg-green-900/10',
    warning: 'border-amber-500 bg-amber-50 dark:bg-amber-900/10',
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-900/10',
  };

  return (
    <div className={cn('border-l-4 p-4 rounded', typeClasses[type])}>
      <h4 className="font-medium mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// Panel components (simplified versions, would be in separate files in production)

function DeliverabilityPanel({ data }: any) {
  if (!data) return <LoadingCard />;

  const funnelData = [
    { name: 'Sent', value: data.sent },
    { name: 'Delivered', value: data.delivered },
    { name: 'Opened', value: data.opened },
    { name: 'Clicked', value: data.clicked },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Deliverability Funnel</CardTitle>
          <CardDescription>Track your message delivery and engagement rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Delivery Rate" value={`${data.delivery_rate}%`} />
        <MetricCard label="Open Rate" value={`${data.open_rate}%`} />
        <MetricCard label="Click Rate" value={`${data.click_rate}%`} />
      </div>
    </>
  );
}

function EngagementPanel({ data }: any) {
  if (!data) return <LoadingCard />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Funnel</CardTitle>
        <CardDescription>Journey progression through engagement stages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.stages.map((stage: any, index: number) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-32 font-medium">{stage.stage_name}</div>
              <div className="flex-1">
                <Progress value={stage.percentage} className="h-6" />
              </div>
              <div className="w-20 text-right text-sm">
                {stage.count} ({stage.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EventsPanel({ data }: any) {
  if (!data) return <LoadingCard />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Performance</CardTitle>
        <CardDescription>Attendance and engagement metrics for your events</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.events_by_type}
              dataKey="count"
              nameKey="type"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.events_by_type.map((entry: any, index: number) => (
                <Cell key={index} fill={COLORS.chart[index % COLORS.chart.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function KPIPanel({ data, kpis }: any) {
  if (!data) return <LoadingCard />;

  return (
    <div className="space-y-6">
      {data.kpis.map((kpi: any) => (
        <Card key={kpi.kpi_id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{kpi.kpi_name}</CardTitle>
                <CardDescription>
                  Current: {kpi.current_value} / Target: {kpi.target_value}
                </CardDescription>
              </div>
              <Badge variant={kpi.achievement_rate >= 80 ? 'default' : 'secondary'}>
                {kpi.achievement_rate}% achieved
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={kpi.achievement_rate} className="mb-4" />
            <div className="space-y-2">
              {kpi.contributors.map((contrib: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{contrib.source}</span>
                  <span className="font-medium">{contrib.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// Helper functions

function getDateFromRange(range: string): Date {
  const now = new Date();
  switch (range) {
    case 'last7days':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'last30days':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'last90days':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'lastYear':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function calculateAvgKPIAchievement(kpis: any[]): number {
  if (!kpis || kpis.length === 0) return 0;
  const sum = kpis.reduce((acc, kpi) => acc + kpi.achievement_rate, 0);
  return Math.round(sum / kpis.length);
}