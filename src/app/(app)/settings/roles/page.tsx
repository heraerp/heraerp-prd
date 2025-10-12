// ================================================================================
// ROLES MANAGEMENT PAGE - SETTINGS
// Smart Code: HERA.UI.SETTINGS.ROLES.V1
// Production-ready role management using Sacred Six storage
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Info,
  Mail
} from 'lucide-react'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { useOrgSettings } from '@/lib/api/orgSettings'
import { RoleTable } from '@/components/settings/RoleTable'
import { RoleGrantForm } from '@/components/settings/RoleGrantForm'
import { RoleGrant } from '@/lib/schemas/settings'
import { useToast } from '@/components/ui/use-toast'

export default function RolesManagementPage() {
  const { currentOrganization } = useOrganization()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedGrant, setSelectedGrant] = React.useState<RoleGrant | null>(null)
  const [showForm, setShowForm] = React.useState(false)

  const { roleGrants, isRoleGrantsLoading, roleGrantsError, saveRoleGrant, revokeRoleGrant } =
    useOrgSettings(currentOrganization?.id || '')

  // Filter role grants based on search
  const filteredGrants = React.useMemo(() => {
    if (!searchTerm.trim()) return roleGrants

    const search = searchTerm.toLowerCase()
    return roleGrants.filter(
      grant =>
        grant.user_email.toLowerCase().includes(search) ||
        grant.user_name?.toLowerCase().includes(search) ||
        grant.roles.some(role => role.toLowerCase().includes(search))
    )
  }, [roleGrants, searchTerm])

  const activeGrants = filteredGrants.filter(g => g.is_active)
  const inactiveGrants = filteredGrants.filter(g => !g.is_active)

  const handleCreateGrant = () => {
    setSelectedGrant(null)
    setShowForm(true)
  }

  const handleEditGrant = (grant: RoleGrant) => {
    setSelectedGrant(grant)
    setShowForm(true)
  }

  const handleRevokeGrant = async (grant: RoleGrant) => {
    if (!window.confirm(`Are you sure you want to revoke access for "${grant.user_email}"?`)) {
      return
    }

    try {
      await revokeRoleGrant.mutateAsync(grant.user_email)
      toast({
        title: 'Access Revoked',
        description: `Role grant for "${grant.user_email}" has been revoked successfully.`,
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: 'Revoke Failed',
        description: error instanceof Error ? error.message : 'Failed to revoke role grant',
        variant: 'destructive'
      })
    }
  }

  const handleFormSubmit = async (grant: RoleGrant) => {
    try {
      await saveRoleGrant.mutateAsync(grant)
      toast({
        title: selectedGrant ? 'Grant Updated' : 'Grant Created',
        description: `Role grant for "${grant.user_email}" has been ${selectedGrant ? 'updated' : 'created'} successfully.`,
        variant: 'default'
      })
      setShowForm(false)
      setSelectedGrant(null)
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save role grant',
        variant: 'destructive'
      })
    }
  }

  const getRoleStatsCards = () => {
    const ownerCount = activeGrants.filter(g => g.roles.includes('owner')).length
    const managerCount = activeGrants.filter(g => g.roles.includes('manager')).length
    const stylistCount = activeGrants.filter(g => g.roles.includes('stylist')).length
    const receptionistCount = activeGrants.filter(g => g.roles.includes('receptionist')).length

    return [
      {
        title: 'Owner',
        count: ownerCount,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        icon: Shield
      },
      {
        title: 'Manager',
        count: managerCount,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-950/30',
        icon: Users
      },
      {
        title: 'Stylist',
        count: stylistCount,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        icon: Users
      },
      {
        title: 'Receptionist',
        count: receptionistCount,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/30',
        icon: Users
      }
    ]
  }

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Please select an organization to manage user roles.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="h-7 w-7 text-purple-600" />
            Role Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user roles and permissions for {currentOrganization.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-purple-700 border-purple-300">
              {currentOrganization.name}
            </Badge>
            <Badge variant="outline">
              {activeGrants.length} active grant{activeGrants.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleCreateGrant}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Role Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {getRoleStatsCards().map((stat, index) => (
          <Card key={index} className={stat.bgColor}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </div>
                  <div className="text-2xl font-bold">{stat.count}</div>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by email, name, or role..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isRoleGrantsLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-purple-600 mr-3" />
              <span className="text-gray-600 dark:text-gray-400">Loading role grants...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {roleGrantsError && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Failed to load role grants: {roleGrantsError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Role Grants Table */}
      {!isRoleGrantsLoading && !roleGrantsError && (
        <>
          {/* Active Grants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Active Users ({activeGrants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeGrants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {searchTerm ? 'No active users found' : 'No users yet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm
                      ? 'Try adjusting your search criteria.'
                      : 'Grant roles to users to get started.'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleCreateGrant}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First User
                    </Button>
                  )}
                </div>
              ) : (
                <RoleTable
                  grants={activeGrants}
                  onEdit={handleEditGrant}
                  onRevoke={handleRevokeGrant}
                  isRevoking={revokeRoleGrant.isPending}
                />
              )}
            </CardContent>
          </Card>

          {/* Inactive Grants */}
          {inactiveGrants.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-gray-500" />
                  Revoked Users ({inactiveGrants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RoleTable
                  grants={inactiveGrants}
                  onEdit={handleEditGrant}
                  onRevoke={handleRevokeGrant}
                  isRevoking={revokeRoleGrant.isPending}
                  showInactive
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Policy as Data Notice */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <div className="font-medium text-blue-800 dark:text-blue-200">Policy as Data</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              • Role grants are stored as configuration data in Sacred Six tables • Actual
              authentication remains with your identity provider (IdP) • Changes are logged for
              audit purposes with Smart Code: HERA.ORG.SETTINGS.ROLE_GRANTS.V1 • Use this to define
              who can access what within your organization
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Role Grant Form Dialog */}
      {showForm && (
        <RoleGrantForm
          open={showForm}
          onOpenChange={setShowForm}
          grant={selectedGrant}
          organizationId={currentOrganization.id}
          onSubmit={handleFormSubmit}
          isSubmitting={saveRoleGrant.isPending}
        />
      )}
    </div>
  )
}
