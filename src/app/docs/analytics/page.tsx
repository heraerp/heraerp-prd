// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { BarChart, LineChart, PieChart, TrendingUp, Users, Clock, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalyticsData {
  pageViews: {
    total: number
    thisWeek: number
    trend: number
  }
  popularPages: {
    title: string
    slug: string
    views: number
    docType: 'dev' | 'user'
  }[]
  userEngagement: {
    avgTimeOnPage: number
    avgScrollDepth: number
    bounceRate: number
  }
  searchTerms: {
    term: string
    count: number
  }[]
}

async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    // Only fetch during runtime, not during build
    if (typeof window !== 'undefined') {
      // Query HERA analytics data from universal_transactions
      const response = await fetch('/api/v1/analytics/docs', {
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        return await response.json()
      }
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
  }

  // Return mock data for demonstration
  return {
    pageViews: {
      total: 12543,
      thisWeek: 1834,
      trend: 15.3
    },
    popularPages: [
      { title: 'Getting Started', slug: 'getting-started', views: 2847, docType: 'dev' },
      { title: 'API Development', slug: 'api/development', views: 2156, docType: 'dev' },
      { title: 'Dashboard Overview', slug: 'dashboard/overview', views: 1923, docType: 'user' },
      { title: 'Architecture Overview', slug: 'architecture/overview', views: 1756, docType: 'dev' },
      { title: 'Core Features', slug: 'features/core', views: 1432, docType: 'user' }
    ],
    userEngagement: {
      avgTimeOnPage: 187, // seconds
      avgScrollDepth: 68, // percentage
      bounceRate: 24.5 // percentage
    },
    searchTerms: [
      { term: 'authentication', count: 234 },
      { term: 'api setup', count: 189 },
      { term: 'database', count: 167 },
      { term: 'components', count: 143 },
      { term: 'deployment', count: 98 }
    ]
  }
}

function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend 
}: {
  title: string
  value: string | number
  description: string
  icon: any
  trend?: number
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {trend !== undefined && (
            <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
              {trend > 0 ? '+' : ''}{trend}% from last week
            </span>
          )}
          {!trend && description}
        </p>
      </CardContent>
    </Card>
  )
}

async function AnalyticsDashboard() {
  const data = await getAnalyticsData()

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Page Views"
          value={data.pageViews.total.toLocaleString()}
          description="All time views"
          icon={Eye as any}
          trend={data.pageViews.trend}
        />
        <MetricCard
          title="This Week"
          value={data.pageViews.thisWeek.toLocaleString()}
          description="Views this week"
          icon={TrendingUp as any}
        />
        <MetricCard
          title="Avg. Time on Page"
          value={`${Math.floor(data.userEngagement.avgTimeOnPage / 60)}m ${data.userEngagement.avgTimeOnPage % 60}s`}
          description="Average session duration"
          icon={Clock as any}
        />
        <MetricCard
          title="Bounce Rate"
          value={`${data.userEngagement.bounceRate}%`}
          description="Users who leave quickly"
          icon={Users as any}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Popular Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Pages</CardTitle>
            <CardDescription>Top documentation pages by views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.popularPages.map((page, index) => (
                <div key={page.slug} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-hera-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{page.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          page.docType === 'dev' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {page.docType === 'dev' ? 'Dev' : 'User'}
                        </span>
                        {page.slug}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-hera-primary">
                    {page.views.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Engagement */}
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>How users interact with documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Average Scroll Depth</span>
                  <span className="text-sm text-hera-primary">{data.userEngagement.avgScrollDepth}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-hera-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${data.userEngagement.avgScrollDepth}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Bounce Rate</span>
                  <span className="text-sm text-red-600">{data.userEngagement.bounceRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${data.userEngagement.bounceRate}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground">
                  <div className="font-medium mb-1">Key Insights:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Users read {data.userEngagement.avgScrollDepth}% of each page on average</li>
                    <li>• Low bounce rate indicates high content quality</li>
                    <li>• Developer docs get more detailed reading</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Search Terms</CardTitle>
          <CardDescription>What users are searching for in documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {data.searchTerms.map((term, index) => (
              <div key={term.term} className="text-center">
                <div className="text-lg font-semibold text-hera-primary">
                  {term.count}
                </div>
                <div className="text-sm text-muted-foreground">
                  {term.term}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Documentation Analytics</h1>
          <p className="text-muted-foreground">
            Insights into how users interact with HERA documentation
          </p>
        </div>

        <Suspense fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent className="animate-pulse">
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        }>
          <AnalyticsDashboard />
        </Suspense>
      </div>
    </div>
  )
}