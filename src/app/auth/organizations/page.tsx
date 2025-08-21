'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, ArrowRight, Plus, Crown, Users, Shield, 
  Calendar, Globe, LogOut, Sparkles, Loader2
} from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

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
  const { user, organizations, switchOrganization, signOut, isAuthenticated, isLoadingOrgs } = useMultiOrgAuth()
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading your organizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">HERA ERP</h1>
                <p className="text-xs text-slate-600">Select Organization</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                {user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </h2>
          <p className="text-lg text-slate-600">
            Select an organization to continue or create a new one.
          </p>
        </div>

        {/* Organizations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {organizations.map((org) => {
            const RoleIcon = roleIcons[org.role as keyof typeof roleIcons] || Users
            
            return (
              <Card 
                key={org.id}
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-500 relative overflow-hidden"
                onClick={() => handleSelectOrganization(org.id, org.subdomain)}
              >
                {/* Premium badge for paid plans */}
                {org.subscription_plan !== 'trial' && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-400 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                      PRO
                    </div>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {org.name.substring(0, 2).toUpperCase()}
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <RoleIcon className="w-3 h-3" />
                      {org.role}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{org.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Globe className="h-3 w-3" />
                    {org.subdomain}.heraerp.com
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Type</span>
                      <span className="font-medium">
                        {typeDescriptions[org.type as keyof typeof typeDescriptions] || 'General Business'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created
                      </span>
                      <span className="font-medium">
                        {new Date(org.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    variant={switching === org.id ? "secondary" : "default"}
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
            className="hover:shadow-lg transition-all cursor-pointer border-2 border-dashed hover:border-purple-500 flex flex-col justify-center"
            onClick={() => router.push('/auth/organizations/new')}
          >
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Create New Organization</h3>
              <p className="text-sm text-slate-600 mb-4">
                Start a new business or project
              </p>
              <Button variant="outline" className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                New Organization
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Reminder */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-1">Complete Isolation</h3>
            <p className="text-sm text-slate-600">
              Each organization has its own secure data space
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Globe className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-1">Custom Subdomain</h3>
            <p className="text-sm text-slate-600">
              Access each organization via its unique URL
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">Team Collaboration</h3>
            <p className="text-sm text-slate-600">
              Invite team members to specific organizations
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}