'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, ArrowRight, Plus, Crown, Users, Shield } from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

const roleIcons = {
  owner: Crown,
  admin: Shield,
  user: Users
}

export default function OrganizationSelectorPage() {
  const router = useRouter()
  const { organizations, switchOrganization, isAuthenticated, isLoadingOrgs } = useMultiOrgAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  const handleSelectOrganization = async (orgId: string) => {
    await switchOrganization(orgId)
  }

  if (isLoadingOrgs) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your organizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Select Organization
          </h1>
          <p className="text-gray-600">
            Choose which organization you'd like to access
          </p>
        </div>

        <div className="grid gap-4 mb-8">
          {organizations.map((org) => {
            const RoleIcon = roleIcons[org.role as keyof typeof roleIcons] || Users
            
            return (
              <Card 
                key={org.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                onClick={() => handleSelectOrganization(org.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{org.name}</CardTitle>
                        <CardDescription>
                          {org.subdomain}.heraerp.com
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <RoleIcon className="w-3 h-3" />
                        {org.role}
                      </Badge>
                      <Badge 
                        variant={org.subscription_plan === 'trial' ? 'secondary' : 'default'}
                      >
                        {org.subscription_plan}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {org.type === 'restaurant' && 'Restaurant & Food Service'}
                      {org.type === 'salon' && 'Salon & Beauty'}
                      {org.type === 'retail' && 'Retail & E-commerce'}
                      {org.type === 'healthcare' && 'Healthcare & Medical'}
                      {org.type === 'professional' && 'Professional Services'}
                      {org.type === 'manufacturing' && 'Manufacturing'}
                      {org.type === 'general' && 'General Business'}
                    </div>
                    <Button variant="ghost" size="sm">
                      Enter
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => router.push('/auth/organizations/new')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Organization
          </Button>
        </div>
      </div>
    </div>
  )
}