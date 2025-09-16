// ================================================================================
// BRANCH MANAGEMENT PAGE - SETTINGS
// Smart Code: HERA.UI.SETTINGS.BRANCHES.v1
// Production-ready branch management using Sacred Six storage
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Badge } from '@/src/components/ui/badge'
import { 
  Plus, 
  Search, 
  Edit, 
  MapPin,
  Phone,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useOrganization } from '@/src/components/organization/OrganizationProvider'
import { useOrgSettings } from '@/src/lib/api/orgSettings'
import { BranchForm } from '@/src/components/settings/BranchForm'
import { Branch } from '@/src/lib/schemas/settings'
import { useToast } from '@/src/components/ui/use-toast'

export default function BranchManagementPage() {
  const { currentOrganization } = useOrganization()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedBranch, setSelectedBranch] = React.useState<Branch | null>(null)
  const [formMode, setFormMode] = React.useState<'create' | 'edit' | null>(null)

  const {
    branches,
    isBranchesLoading,
    branchesError,
    saveBranch,
    deleteBranch
  } = useOrgSettings(currentOrganization?.id || '')

  // Filter branches based on search
  const filteredBranches = React.useMemo(() => {
    if (!searchTerm.trim()) return branches

    const search = searchTerm.toLowerCase()
    return branches.filter(branch => 
      branch.entity_code.toLowerCase().includes(search) ||
      branch.entity_name.toLowerCase().includes(search) ||
      branch.contact?.phone?.toLowerCase().includes(search)
    )
  }, [branches, searchTerm])

  const handleCreateBranch = () => {
    setSelectedBranch(null)
    setFormMode('create')
  }

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch)
    setFormMode('edit')
  }

  const handleDeleteBranch = async (branch: Branch) => {
    if (!window.confirm(`Are you sure you want to deactivate branch "${branch.entity_name}"?`)) {
      return
    }

    try {
      await deleteBranch.mutateAsync(branch.entity_code)
      toast({
        title: "Branch Deactivated",
        description: `Branch "${branch.entity_name}" has been deactivated successfully.`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Deactivation Failed",
        description: error instanceof Error ? error.message : "Failed to deactivate branch",
        variant: "destructive"
      })
    }
  }

  const handleFormClose = () => {
    setFormMode(null)
    setSelectedBranch(null)
  }

  const handleFormSubmit = async (branch: Branch) => {
    try {
      await saveBranch.mutateAsync(branch)
      toast({
        title: formMode === 'create' ? "Branch Created" : "Branch Updated",
        description: `Branch "${branch.entity_name}" has been ${formMode === 'create' ? 'created' : 'updated'} successfully.`,
        variant: "default"
      })
      handleFormClose()
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save branch",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (branch: Branch) => {
    if (branch.is_active) {
      return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    } else {
      return <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    }
  }

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please select an organization to manage branches.
          </AlertDescription>
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
            <Building className="h-7 w-7 text-violet-600" />
            Branch Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage business locations and branches for {currentOrganization.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-violet-700 border-violet-300">
              {currentOrganization.name}
            </Badge>
            <Badge variant="outline">
              {filteredBranches.length} branch{filteredBranches.length !== 1 ? 'es' : ''}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreateBranch}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search branches by code, name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branches List */}
      {isBranchesLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-violet-600 mr-3" />
              <span className="text-gray-600 dark:text-gray-400">Loading branches...</span>
            </div>
          </CardContent>
        </Card>
      ) : branchesError ? (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Failed to load branches: {branchesError.message}
          </AlertDescription>
        </Alert>
      ) : filteredBranches.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm ? 'No branches found' : 'No branches yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search criteria.'
                  : 'Create your first branch location to get started.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateBranch}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Branch
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBranches.map((branch) => (
            <Card key={branch.entity_code} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">
                      {branch.entity_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {branch.entity_code}
                      </Badge>
                      {getStatusBadge(branch)}
                      {branch.location?.city && (
                        <Badge variant="outline" className="text-blue-600">
                          <MapPin className="h-3 w-3 mr-1" />
                          {branch.location.city}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBranch(branch)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {branch.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBranch(branch)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  
                  {/* Contact Information */}
                  {(branch.contact?.phone || branch.contact?.email || branch.contact?.manager) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {branch.contact?.phone && (
                        <div>
                          <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Phone
                          </div>
                          <div className="font-medium font-mono">
                            {branch.contact.phone}
                          </div>
                        </div>
                      )}
                      {branch.contact?.email && (
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Email</div>
                          <div className="font-medium">
                            {branch.contact.email}
                          </div>
                        </div>
                      )}
                      {branch.contact?.manager && (
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Manager</div>
                          <div className="font-medium">
                            {branch.contact.manager}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Address */}
                  {branch.location?.address && (
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Address
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {branch.location.address}
                        {branch.location.city && `, ${branch.location.city}`}
                        {branch.location.country && `, ${branch.location.country}`}
                        {branch.location.postal_code && ` ${branch.location.postal_code}`}
                      </div>
                    </div>
                  )}

                  {/* Smart Code (Audit Slot) */}
                  <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
                    <span>
                      Created: {branch.created_at 
                        ? new Date(branch.created_at).toLocaleDateString()
                        : 'Unknown'
                      }
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Smart Code:</span>
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">
                        {branch.smart_code}
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Branch Form Dialog */}
      {formMode && (
        <BranchForm
          open={!!formMode}
          onOpenChange={handleFormClose}
          branch={selectedBranch}
          organizationId={currentOrganization.id}
          onSubmit={handleFormSubmit}
          isSubmitting={saveBranch.isPending}
        />
      )}

    </div>
  )
}