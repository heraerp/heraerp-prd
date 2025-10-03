'use client'

import React from 'react'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { BRANCH_PRESET } from '@/hooks/entityPresets'
import { EntityPage, EntityForm } from '@/components/entity-forms'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, MapPin, Building2, Clock, Phone } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { Badge } from '@/components/ui/badge'
import { BranchSelector } from '@/components/salon/BranchSelector'

export default function BranchesPage() {
  const { organization, selectedBranchId } = useSecuredSalonContext()
  const [showForm, setShowForm] = React.useState(false)
  const [selectedBranch, setSelectedBranch] = React.useState<any>(null)

  const branches = useUniversalEntity({
    entity_type: 'BRANCH',
    filters: {
      include_dynamic: true,
      limit: 200,
      organization_id: organization.id
    }
  })

  const handleCreate = async (data: any) => {
    await branches.create({
      ...data,
      organization_id: organization.id
    })
    setShowForm(false)
  }

  const handleUpdate = async (id: string, data: any) => {
    await branches.update({
      entity_id: id,
      ...data
    })
    setSelectedBranch(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this branch?')) {
      await branches.delete({ entity_id: id })
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: LUXE_COLORS.gold }}
          >
            Branch Management
          </h1>
          <p style={{ color: LUXE_COLORS.bronze }}>
            Manage your salon locations and branches
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <BranchSelector variant="default" />
          <Button
            onClick={() => setShowForm(true)}
            style={{
              backgroundColor: LUXE_COLORS.gold,
              color: LUXE_COLORS.charcoal
            }}
            className="hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        </div>
      </div>

      {/* Forms */}
      {showForm && (
        <Card
          className="mb-6 p-6"
          style={{
            backgroundColor: LUXE_COLORS.charcoalLight,
            border: `1px solid ${LUXE_COLORS.bronze}30`
          }}
        >
          <h2 
            className="text-xl font-semibold mb-4"
            style={{ color: LUXE_COLORS.gold }}
          >
            Create New Branch
          </h2>
          <EntityForm
            preset={BRANCH_PRESET}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      {selectedBranch && (
        <Card
          className="mb-6 p-6"
          style={{
            backgroundColor: LUXE_COLORS.charcoalLight,
            border: `1px solid ${LUXE_COLORS.bronze}30`
          }}
        >
          <h2 
            className="text-xl font-semibold mb-4"
            style={{ color: LUXE_COLORS.gold }}
          >
            Edit Branch
          </h2>
          <EntityForm
            preset={BRANCH_PRESET}
            entity={selectedBranch}
            onSubmit={(data) => handleUpdate(selectedBranch.id, data)}
            onCancel={() => setSelectedBranch(null)}
          />
        </Card>
      )}

      {/* Branch Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.data?.map(branch => {
          const isActive = branch.dynamic_fields?.status?.value === 'active'
          const isCurrentBranch = branch.id === selectedBranchId

          return (
            <Card
              key={branch.id}
              className="p-6 relative transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: isCurrentBranch 
                  ? `${LUXE_COLORS.gold}15` 
                  : LUXE_COLORS.charcoalLight,
                border: `1px solid ${isCurrentBranch ? LUXE_COLORS.gold : LUXE_COLORS.bronze}30`
              }}
            >
              {/* Branch Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 
                    className="text-xl font-semibold flex items-center gap-2"
                    style={{ color: LUXE_COLORS.champagne }}
                  >
                    <Building2 className="h-5 w-5" style={{ color: LUXE_COLORS.gold }} />
                    {branch.entity_name}
                  </h3>
                  {branch.entity_code && (
                    <p 
                      className="text-sm mt-1"
                      style={{ color: LUXE_COLORS.bronze }}
                    >
                      {branch.entity_code}
                    </p>
                  )}
                </div>

                <Badge
                  style={{
                    backgroundColor: isActive ? `${LUXE_COLORS.emerald}20` : `${LUXE_COLORS.ruby}20`,
                    color: isActive ? LUXE_COLORS.emerald : LUXE_COLORS.ruby,
                    border: `1px solid ${isActive ? LUXE_COLORS.emerald : LUXE_COLORS.ruby}40`
                  }}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Branch Details */}
              <div className="space-y-2 mb-4">
                {branch.dynamic_fields?.address?.value && (
                  <div className="flex items-start gap-2">
                    <MapPin 
                      className="h-4 w-4 mt-0.5 flex-shrink-0" 
                      style={{ color: LUXE_COLORS.bronze }} 
                    />
                    <p 
                      className="text-sm"
                      style={{ color: LUXE_COLORS.silver }}
                    >
                      {branch.dynamic_fields.address.value}
                    </p>
                  </div>
                )}

                {branch.dynamic_fields?.phone?.value && (
                  <div className="flex items-center gap-2">
                    <Phone 
                      className="h-4 w-4" 
                      style={{ color: LUXE_COLORS.bronze }} 
                    />
                    <p 
                      className="text-sm"
                      style={{ color: LUXE_COLORS.silver }}
                    >
                      {branch.dynamic_fields.phone.value}
                    </p>
                  </div>
                )}

                {branch.dynamic_fields?.timezone?.value && (
                  <div className="flex items-center gap-2">
                    <Clock 
                      className="h-4 w-4" 
                      style={{ color: LUXE_COLORS.bronze }} 
                    />
                    <p 
                      className="text-sm"
                      style={{ color: LUXE_COLORS.silver }}
                    >
                      {branch.dynamic_fields.timezone.value}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBranch(branch)}
                  style={{
                    borderColor: `${LUXE_COLORS.gold}50`,
                    color: LUXE_COLORS.gold
                  }}
                  className="flex-1 hover:bg-opacity-10"
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(branch.id)}
                  style={{
                    borderColor: `${LUXE_COLORS.ruby}50`,
                    color: LUXE_COLORS.ruby
                  }}
                  className="hover:bg-opacity-10"
                >
                  Delete
                </Button>
              </div>

              {/* Current Branch Indicator */}
              {isCurrentBranch && (
                <div 
                  className="absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded"
                  style={{
                    backgroundColor: `${LUXE_COLORS.gold}30`,
                    color: LUXE_COLORS.gold
                  }}
                >
                  Current
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {(!branches.data || branches.data.length === 0) && !branches.loading && (
        <Card
          className="p-12 text-center"
          style={{
            backgroundColor: LUXE_COLORS.charcoalLight,
            border: `1px solid ${LUXE_COLORS.bronze}30`
          }}
        >
          <Building2 
            className="h-12 w-12 mx-auto mb-4"
            style={{ color: LUXE_COLORS.bronze }}
          />
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ color: LUXE_COLORS.champagne }}
          >
            No Branches Yet
          </h3>
          <p 
            className="mb-6"
            style={{ color: LUXE_COLORS.bronze }}
          >
            Add your first branch to start managing multiple locations
          </p>
          <Button
            onClick={() => setShowForm(true)}
            style={{
              backgroundColor: LUXE_COLORS.gold,
              color: LUXE_COLORS.charcoal
            }}
            className="hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Branch
          </Button>
        </Card>
      )}
    </div>
  )
}