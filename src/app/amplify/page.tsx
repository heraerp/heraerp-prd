'use client'

import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Megaphone,
  FileText,
  Calendar,
  Newspaper,
  BarChart3,
  Share2,
  FileBarChart,
  Sparkles,
  ArrowRight,
  Activity,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const modules = [
  {
    title: 'Campaigns',
    description: 'AI-powered marketing campaigns',
    icon: Megaphone,
    href: '/amplify/campaigns',
    color: 'from-purple-600 to-pink-600',
    stats: { active: 3, total: 12 }
  },
  {
    title: 'Content',
    description: 'Ingest, optimize, and repurpose',
    icon: FileText,
    href: '/amplify/content',
    color: 'from-blue-600 to-cyan-600',
    stats: { ready: 24, total: 45 }
  },
  {
    title: 'Schedule',
    description: 'Multi-platform social scheduling',
    icon: Calendar,
    href: '/amplify/schedule',
    color: 'from-green-600 to-emerald-600',
    stats: { scheduled: 18, published: 127 }
  },
  {
    title: 'Publications',
    description: 'Medium, WordPress, Substack',
    icon: Newspaper,
    href: '/amplify/publications',
    color: 'from-orange-600 to-red-600',
    stats: { published: 34 }
  },
  {
    title: 'Analytics',
    description: 'Cross-channel performance',
    icon: BarChart3,
    href: '/amplify/analytics',
    color: 'from-indigo-600 to-purple-600',
    stats: { events: '12.4K' }
  },
  {
    title: 'Channels',
    description: 'Configure integrations',
    icon: Share2,
    href: '/amplify/channels',
    color: 'from-teal-600 to-blue-600',
    stats: { connected: 8 }
  }
]

export default function AmplifyDashboard() {
  const { currentOrganization } = useMultiOrgAuth()
  const router = useRouter()

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Amplify</h1>
        </div>
        <p className="text-muted-foreground">
          AI-powered content amplification engine for {currentOrganization?.name}
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push('/amplify/content?action=new')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Create Content
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push('/amplify/campaigns?action=new')}
            >
              <Megaphone className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push('/amplify/schedule')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Posts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(module => {
          const Icon = module.icon
          return (
            <Link key={module.href} href={module.href}>
              <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${module.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <CardTitle className="mt-4">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {Object.entries(module.stats).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-1">
                        <span className="capitalize">{key}:</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Overview
          </CardTitle>
          <CardDescription>Last 30 days across all channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Reach</p>
              <p className="text-2xl font-bold">127.4K</p>
              <p className="text-sm text-green-600">+23% from last period</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Engagement Rate</p>
              <p className="text-2xl font-bold">5.8%</p>
              <p className="text-sm text-green-600">+0.7% from last period</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Content Published</p>
              <p className="text-2xl font-bold">34</p>
              <p className="text-sm text-muted-foreground">12 blog posts, 22 social</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold">892</p>
              <p className="text-sm text-green-600">+45% from last period</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
