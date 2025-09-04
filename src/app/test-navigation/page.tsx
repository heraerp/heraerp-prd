'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { 
  TestTube, 
  Globe, 
  Database, 
  Users, 
  Building2, 
  Scissors,
  Snowflake,
  Utensils,
  Heart,
  Gem,
  Home
} from 'lucide-react'

export default function TestNavigationPage() {
  const router = useRouter()

  const testPages = [
    {
      title: 'Organization Context Test',
      description: 'Test organization detection and RLS context',
      path: '/test-organization-context',
      icon: <Database className="w-5 h-5" />
    },
    {
      title: 'Subdomain Simulation',
      description: 'Simulate different subdomain scenarios',
      path: '/test-subdomain-simulation',
      icon: <Globe className="w-5 h-5" />
    }
  ]

  const demoApps = [
    {
      title: 'Salon Demo',
      description: 'Beauty salon management',
      path: '/salon',
      icon: <Scissors className="w-5 h-5" />,
      color: 'from-pink-500 to-purple-600'
    },
    {
      title: 'Ice Cream Demo',
      description: 'Ice cream manufacturing',
      path: '/icecream',
      icon: <Snowflake className="w-5 h-5" />,
      color: 'from-cyan-500 to-blue-600'
    },
    {
      title: 'Restaurant Demo',
      description: 'Restaurant management',
      path: '/restaurant',
      icon: <Utensils className="w-5 h-5" />,
      color: 'from-orange-500 to-red-600'
    },
    {
      title: 'Healthcare Demo',
      description: 'Medical practice management',
      path: '/healthcare',
      icon: <Heart className="w-5 h-5" />,
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Jewelry Demo',
      description: 'Jewelry retail management',
      path: '/jewelry',
      icon: <Gem className="w-5 h-5" />,
      color: 'from-purple-500 to-indigo-600'
    }
  ]

  const authPages = [
    {
      title: 'Login',
      path: '/auth/login',
      description: 'Sign in to your account'
    },
    {
      title: 'Organizations',
      path: '/auth/organizations',
      description: 'Manage organizations'
    },
    {
      title: 'Apps',
      path: '/apps',
      description: 'Application selector'
    },
    {
      title: 'Clear Session',
      path: '/auth/clear-session',
      description: 'Clear authentication session'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TestTube className="w-6 h-6" />
              HERA Test Navigation
            </CardTitle>
            <CardDescription>
              Quick access to test pages and demo applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Homepage
            </Button>
          </CardContent>
        </Card>

        {/* Test Pages */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Test Pages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testPages.map((page) => (
              <Card 
                key={page.path}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(page.path)}
              >
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {page.icon}
                    {page.title}
                  </CardTitle>
                  <CardDescription>{page.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Demo Applications */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Demo Applications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoApps.map((app) => (
              <Card 
                key={app.path}
                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                onClick={() => router.push(app.path)}
              >
                <div className={`h-2 bg-gradient-to-r ${app.color}`} />
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {app.icon}
                    {app.title}
                  </CardTitle>
                  <CardDescription>{app.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Auth Pages */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Authentication Pages
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {authPages.map((page) => (
              <Button
                key={page.path}
                variant="outline"
                onClick={() => router.push(page.path)}
                className="h-auto flex-col items-start p-3 text-left"
              >
                <div className="font-medium">{page.title}</div>
                <div className="text-xs text-gray-500 mt-1">{page.description}</div>
              </Button>
            ))}
          </div>
        </div>

        {/* Current Context Info */}
        <Card className="bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-base">Current Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Current URL:</span>{' '}
              <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">
                {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
              </code>
            </div>
            <div>
              <span className="text-gray-600">Hostname:</span>{' '}
              <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">
                {typeof window !== 'undefined' ? window.location.hostname : 'Loading...'}
              </code>
            </div>
            <div>
              <span className="text-gray-600">Pathname:</span>{' '}
              <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">
                {typeof window !== 'undefined' ? window.location.pathname : 'Loading...'}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}