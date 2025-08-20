'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, Scissors, Heart, Gem, Factory, Briefcase, Plus, Loader2, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

const businessTypes = [
  { value: 'restaurant', label: 'Restaurant', icon: Store, path: '/restaurant' },
  { value: 'salon', label: 'Salon & Spa', icon: Scissors, path: '/salon' },
  { value: 'healthcare', label: 'Healthcare', icon: Heart, path: '/healthcare' },
  { value: 'jewelry', label: 'Jewelry', icon: Gem, path: '/jewelry-progressive' },
  { value: 'manufacturing', label: 'Manufacturing', icon: Factory, path: '/dashboard' },
  { value: 'professional', label: 'Professional Services', icon: Briefcase, path: '/dashboard' },
]

interface UserOrganization {
  id: string
  name: string
  type: string
  created_at: string
  role?: string
  is_primary?: boolean
}

export default function SelectAppPage() {
  const router = useRouter()
  const { user, organization, refreshContext } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([])
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  useEffect(() => {
    // If user already has an organization and came here directly, redirect them
    if (organization) {
      const businessType = organization.organization_type || 'professional'
      const app = businessTypes.find(b => b.value === businessType)
      if (app) {
        router.push(app.path)
      }
    }
    loadUserOrganizations()
  }, [organization, router])

  const loadUserOrganizations = async () => {
    if (!user?.email) return

    setIsLoading(true)
    try {
      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      if (!authToken) {
        console.warn('No auth token available')
        return
      }

      // Fetch user's organization memberships
      const response = await fetch('/api/v1/organizations/user-memberships', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.memberships) {
          const orgs = data.memberships.map((membership: any) => ({
            id: membership.organization.id,
            name: membership.organization.name,
            type: membership.organization.type || 'professional',
            created_at: membership.organization.created_at,
            role: membership.membership.role,
            is_primary: membership.membership.is_primary
          }))
          setUserOrganizations(orgs)
        }
      } else if (response.status === 404) {
        // User has no organizations yet - this is fine for new users
        setUserOrganizations([])
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectOrganization = async (org: UserOrganization) => {
    // In the future, this would switch context to the selected organization
    // For now, we'll just redirect to the appropriate app
    const app = businessTypes.find(b => b.value === org.type)
    if (app) {
      router.push(app.path)
    }
  }

  const handleCreateNew = () => {
    // Redirect to onboarding to create a new organization
    router.push('/onboarding')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name || user?.email}</h1>
          <p className="text-gray-600">Select an app to continue or create a new business</p>
        </div>

        {/* Existing Organizations */}
        {userOrganizations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Your Businesses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userOrganizations.map((org) => {
                const businessType = businessTypes.find(b => b.value === org.type)
                const Icon = businessType?.icon || Building2
                
                return (
                  <Card 
                    key={org.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleSelectOrganization(org)}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{org.name}</CardTitle>
                          <CardDescription>{businessType?.label || 'Business'}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Created {new Date(org.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center space-x-2">
                          {org.is_primary && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Primary
                            </span>
                          )}
                          {org.role && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full capitalize">
                              {org.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Add New Business */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {userOrganizations.length > 0 ? 'Add Another Business' : 'Create Your First Business'}
          </h2>
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed"
            onClick={handleCreateNew}
          >
            <CardHeader>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Create New Business</CardTitle>
                  <CardDescription>Set up a new business in HERA</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        {userOrganizations.length === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            {businessTypes.map((type) => {
              const Icon = type.icon
              return (
                <Button
                  key={type.value}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                  onClick={() => {
                    router.push(`/onboarding?type=${type.value}`)
                  }}
                >
                  <Icon className="h-8 w-8" />
                  <span className="text-sm">{type.label}</span>
                </Button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}