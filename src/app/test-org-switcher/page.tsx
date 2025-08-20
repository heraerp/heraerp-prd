'use client'

import { useAuth } from '@/components/auth/DualAuthProvider'
import { useUserContext } from '@/hooks/useUserContext'
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Building2, User, Mail, Shield } from 'lucide-react'
import Link from 'next/link'

export default function TestOrgSwitcherPage() {
  const { isAuthenticated, supabaseUser } = useAuth()
  const { organizationId, userContext, loading: contextLoading, error } = useUserContext()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to test the organization switcher.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading organization context...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Switcher Test</h1>
          <p className="text-gray-600">Test the multi-organization switching functionality</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Switcher Component
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Switch between your organizations:</p>
                  <OrganizationSwitcher />
                </div>
                <div className="text-sm text-gray-500">
                  <p>• Select an organization from the dropdown</p>
                  <p>• Current organization is marked with a check</p>
                  <p>• Click "Create New Organization" to add more</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-sm">{supabaseUser?.email || 'Not available'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">User ID</p>
                  <p className="text-sm font-mono text-xs">{supabaseUser?.id || 'Not available'}</p>
                </div>
                {userContext && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Name</p>
                      <p className="text-sm">{userContext.user.name || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Role</p>
                      <p className="text-sm">{userContext.user.role || 'user'}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Current Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              {organizationId && userContext?.organization ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Name</p>
                    <p className="text-sm">{userContext.organization.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Organization ID</p>
                    <p className="text-sm font-mono text-xs">{organizationId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Your Role</p>
                    <p className="text-sm">{userContext.user.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Permissions</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {userContext.permissions?.map((perm: string) => (
                        <span 
                          key={perm} 
                          className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No organization selected</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex gap-4">
          <Button asChild>
            <Link href="/salon">Go to Salon Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/onboarding">Create New Organization</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}