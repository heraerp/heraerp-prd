'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  ArrowRight,
  Plus,
  Crown,
  Users,
  Shield,
  Calendar,
  Globe,
  LogOut,
  Sparkles,
  Loader2
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

const roleIcons = {
  owner: Crown,
  admin: Shield,
  user: Users
}

const typeDescriptions = {
  restaurant: 'Restaurant & Food Service',
  salon: 'Salon & Beauty',
  retail: 'Retail & E-commerce',
  healthcare: 'Healthcare & Medical',
  professional: 'Professional Services',
  manufacturing: 'Manufacturing',
  general: 'General Business'
}

export default function OrganizationSelectorPage() {
  const router = useRouter()
  const { user, organizations, switchOrganization, signOut, isAuthenticated, isLoadingOrgs  } = useHERAAuth()
  const [switching, setSwitching] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated && !isLoadingOrgs) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoadingOrgs, router])

  const handleSelectOrganization = async (orgId: string, subdomain: string) => {
    setSwitching(orgId)
    try {
      await switchOrganization(orgId)

      // Redirect to the organization's subdomain
      if (process.env.NODE_ENV === 'production') {
        window.location.href = `https://${subdomain}.heraerp.com`
      } else {
        router.push(`/~${subdomain}`)
      }
    } catch (error) {
      console.error('Failed to switch organization:', error)
      setSwitching(null)
    }
  }

  if (isLoadingOrgs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/20 animate-pulse">
            <Building2 className="w-10 h-10 text-primary dark:text-blue-400" />
          </div>
          <p className="text-muted-foreground dark:text-muted-foreground mt-4">
            Loading your organizations...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Glassmorphic orbs for depth */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl animate-pulse animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-background/70 dark:bg-background/70 backdrop-blur-xl border-b border-border/20 dark:border-border/50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-xl shadow-lg border border-border/20">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text">
                  HERA Enterprise
                </h1>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Select Organization
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="hover:bg-background/20 dark:hover:bg-muted/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-100 dark:text-foreground mb-4">
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </h2>
          <p className="text-lg text-muted-foreground dark:text-muted-foreground">
            Select an organization to continue or create a new one.
          </p>
        </div>

        {/* Organizations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {organizations.map(org => {
            const RoleIcon = roleIcons[org.role as keyof typeof roleIcons] || Users

            return (
              <Card
                key={org.id}
                className="bg-background/80 dark:bg-background/80 backdrop-blur-xl hover:shadow-2xl transition-all cursor-pointer border border-border/20 dark:border-border/50 hover:border-primary/50 dark:hover:border-primary/50 relative overflow-hidden transform hover:-translate-y-1 hover:scale-105 duration-200"
                onClick={() => handleSelectOrganization(org.id, org.subdomain)}
              >
                {/* Premium badge for paid plans */}
                {org.subscription_plan !== 'trial' && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-400 text-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                      PRO
                    </div>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center text-foreground font-bold text-lg shadow-lg">
                      {org.name.substring(0, 2).toUpperCase()}
                    </div>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 bg-background/50 dark:bg-muted/50 backdrop-blur-sm"
                    >
                      <RoleIcon className="w-3 h-3" />
                      {org.role}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 text-gray-100 dark:text-foreground">
                    {org.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    {org.subdomain}.heraerp.com
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground dark:text-muted-foreground">Type</span>
                      <span className="font-medium text-gray-100 dark:text-foreground">
                        {typeDescriptions[org.type as keyof typeof typeDescriptions] ||
                          'General Business'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground dark:text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created
                      </span>
                      <span className="font-medium text-gray-100 dark:text-foreground">
                        {new Date(org.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-foreground shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    variant={switching === org.id ? 'secondary' : 'default'}
                    disabled={switching !== null}
                  >
                    {switching === org.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Switching...
                      </>
                    ) : (
                      <>
                        Enter Organization
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}

          {/* Create New Organization Card */}
          <Card
            className="bg-background/80 dark:bg-background/80 backdrop-blur-xl hover:shadow-2xl transition-all cursor-pointer border-2 border-dashed border-border/50 dark:border-border/50 hover:border-primary/50 dark:hover:border-primary/50 flex flex-col justify-center transform hover:-translate-y-1 hover:scale-105 duration-200"
            onClick={() => router.push('/auth/organizations/new')}
          >
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/30 dark:to-cyan-900/30 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-primary dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-100 dark:text-foreground">
                Create New Organization
              </h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4">
                Start a new business or project
              </p>
              <Button
                variant="outline"
                className="w-full border-blue-500/50 hover:border-blue-600 dark:border-blue-400/50 dark:hover:border-blue-500 text-primary hover:text-primary dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                New Organization
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Reminder */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/30 dark:to-cyan-900/30 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Shield className="h-6 w-6 text-primary dark:text-blue-400" />
            </div>
            <h3 className="font-semibold mb-1 text-gray-100 dark:text-foreground">
              Complete Isolation
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Each organization has its own secure data space
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/30 dark:to-cyan-900/30 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Globe className="h-6 w-6 text-primary dark:text-blue-400" />
            </div>
            <h3 className="font-semibold mb-1 text-gray-100 dark:text-foreground">
              Custom Subdomain
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Access each organization via its unique URL
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/30 dark:to-cyan-900/30 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Users className="h-6 w-6 text-primary dark:text-blue-400" />
            </div>
            <h3 className="font-semibold mb-1 text-gray-100 dark:text-foreground">
              Team Collaboration
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Invite team members to specific organizations
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
