'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { Plus, Edit, Trash2, Archive, ArchiveRestore, Briefcase, Search, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { useHeraRoles, type RoleFormValues } from '@/hooks/useHeraRoles'
import { useSalonToast } from '@/components/salon/ui/StatusToastProvider'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  emerald: '#0F6F5C',
  rose: '#E8B4B8'
}

interface RolesTabProps {
  organizationId: string
}

export function RolesTab({ organizationId }: RolesTabProps) {
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [formData, setFormData] = useState<RoleFormValues>({
    title: '',
    description: '',
    rank: 0,
    active: true,
    status: 'active'
  })

  const {
    roles,
    isLoading,
    createRole,
    updateRole,
    deleteRole,
    archiveRole,
    restoreRole,
    isCreating,
    isUpdating
  } = useHeraRoles({
    organizationId,
    includeInactive
  })

  const filteredRoles = useMemo(
    () =>
      roles?.filter(r => {
        const matchesSearch =
          r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch
      }) || [],
    [roles, searchTerm]
  )

  const handleOpenModal = useCallback((role?: any) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        title: role.title || '',
        description: role.description || '',
        rank: role.rank || 0,
        active: role.active !== false,
        status: role.status === 'archived' ? 'inactive' : 'active'
      })
    } else {
      setEditingRole(null)
      setFormData({
        title: '',
        description: '',
        rank: 0,
        active: true,
        status: 'active'
      })
    }
    setModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setEditingRole(null)
    setFormData({
      title: '',
      description: '',
      rank: 0,
      active: true,
      status: 'active'
    })
  }, [])

  const handleSave = useCallback(
    async () => {
      const loadingId = showLoading(
        editingRole ? 'Updating role...' : 'Creating role...',
        'Please wait'
      )

      try {
        if (editingRole) {
          await updateRole(editingRole.id, formData)
          removeToast(loadingId)
          showSuccess('Role updated successfully', `${formData.title} has been updated`)
        } else {
          await createRole(formData)
          removeToast(loadingId)
          showSuccess('Role created successfully', `${formData.title} has been created`)
        }
        handleCloseModal()
      } catch (error: any) {
        removeToast(loadingId)
        showError(
          editingRole ? 'Failed to update role' : 'Failed to create role',
          error.message || 'Please try again'
        )
      }
    },
    [editingRole, formData, createRole, updateRole, showLoading, removeToast, showSuccess, showError, handleCloseModal]
  )

  const handleDelete = useCallback(
    async (roleId: string) => {
      const role = roles?.find(r => r.id === roleId)
      const roleName = role?.title || 'Role'

      const loadingId = showLoading('Deleting role...', 'This action cannot be undone')

      try {
        await deleteRole(roleId, true)
        removeToast(loadingId)
        showSuccess('Role deleted', `${roleName} has been permanently removed`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to delete role', error.message || 'Please try again')
      }
    },
    [roles, deleteRole, showLoading, removeToast, showSuccess, showError]
  )

  const handleArchive = useCallback(
    async (roleId: string) => {
      const role = roles?.find(r => r.id === roleId)
      const roleName = role?.title || 'Role'

      const loadingId = showLoading('Archiving role...', 'Please wait')

      try {
        await archiveRole(roleId)
        removeToast(loadingId)
        showSuccess('Role archived', `${roleName} has been archived`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to archive role', error.message || 'Please try again')
      }
    },
    [roles, archiveRole, showLoading, removeToast, showSuccess, showError]
  )

  const handleRestore = useCallback(
    async (roleId: string) => {
      const role = roles?.find(r => r.id === roleId)
      const roleName = role?.title || 'Role'

      const loadingId = showLoading('Restoring role...', 'Please wait')

      try {
        await restoreRole(roleId)
        removeToast(loadingId)
        showSuccess('Role restored', `${roleName} has been restored`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to restore role', error.message || 'Please try again')
      }
    },
    [roles, restoreRole, showLoading, removeToast, showSuccess, showError]
  )

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div
        className="flex items-center justify-between gap-4 p-4 rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${COLORS.charcoalLight}90 0%, ${COLORS.charcoal}90 100%)`,
          border: `1px solid ${COLORS.gold}20`
        }}
      >
        <Tabs
          value={includeInactive ? 'all' : 'active'}
          onValueChange={v => setIncludeInactive(v === 'all')}
        >
          <TabsList
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.black} 100%)`,
              border: `1px solid ${COLORS.gold}30`
            }}
          >
            <TabsTrigger value="active" style={{ color: COLORS.champagne }}>
              Active
            </TabsTrigger>
            <TabsTrigger value="all" style={{ color: COLORS.champagne }}>
              All Roles
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
            style={{ color: COLORS.gold }}
          />
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.black} 100%)`,
              border: `1px solid ${COLORS.gold}30`,
              color: COLORS.champagne,
              borderRadius: '0.75rem'
            }}
          />
        </div>

        <SalonLuxeButton
          variant="primary"
          size="md"
          onClick={() => handleOpenModal()}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Role
        </SalonLuxeButton>
      </div>

      {/* Roles Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: COLORS.gold }}
          />
          <span className="ml-3" style={{ color: COLORS.bronze }}>
            Loading roles...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => {
            const isArchived = role.status === 'archived'
            return (
              <Card
                key={role.id}
                className="transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoal} 100%)`,
                  border: `1px solid ${isArchived ? COLORS.bronze + '30' : COLORS.gold + '30'}`,
                  boxShadow: `0 8px 24px ${COLORS.black}60`
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${COLORS.gold}20`,
                        border: `2px solid ${COLORS.gold}60`
                      }}
                    >
                      <Shield className="h-6 w-6" style={{ color: COLORS.gold }} />
                    </div>
                    {isArchived && (
                      <Badge
                        style={{
                          backgroundColor: `${COLORS.bronze}30`,
                          color: COLORS.bronze,
                          border: `1px solid ${COLORS.bronze}60`
                        }}
                      >
                        Archived
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-bold text-lg mb-2" style={{ color: COLORS.champagne }}>
                    {role.title || role.entity_name}
                  </h3>

                  {role.description && (
                    <p className="text-sm mb-4 line-clamp-2" style={{ color: COLORS.bronze }}>
                      {role.description}
                    </p>
                  )}

                  {role.rank !== undefined && (
                    <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: COLORS.gold }}>
                      <Briefcase className="h-3 w-3" />
                      <span>Rank: {role.rank}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          style={{
                            borderColor: COLORS.gold + '40',
                            color: COLORS.champagne
                          }}
                        >
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        style={{
                          background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.charcoalDark} 100%)`,
                          border: `1px solid ${COLORS.gold}40`
                        }}
                      >
                        <DropdownMenuItem
                          onClick={() => handleOpenModal(role)}
                          style={{ color: COLORS.lightText }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuSeparator style={{ backgroundColor: COLORS.gold + '20' }} />

                        {role.status === 'archived' ? (
                          <DropdownMenuItem
                            onClick={() => handleRestore(role.id)}
                            style={{ color: COLORS.lightText }}
                          >
                            <ArchiveRestore className="mr-2 h-4 w-4" />
                            Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleArchive(role.id)}
                            style={{ color: COLORS.lightText }}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator style={{ backgroundColor: COLORS.gold + '20' }} />

                        <DropdownMenuItem
                          onClick={() => handleDelete(role.id)}
                          style={{ color: '#FF6B6B' }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Role Modal */}
      <SalonLuxeModal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingRole ? 'Edit Role' : 'Add New Role'}
        description={editingRole ? 'Update role information' : 'Create a new employee role'}
        icon={<Shield className="w-6 h-6" />}
        size="md"
        footer={
          <>
            <SalonLuxeButton variant="outline" onClick={handleCloseModal}>
              Cancel
            </SalonLuxeButton>
            <SalonLuxeButton
              variant="primary"
              onClick={handleSave}
              loading={isCreating || isUpdating}
            >
              {editingRole ? 'Update' : 'Create'} Role
            </SalonLuxeButton>
          </>
        }
      >
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="title" style={{ color: COLORS.champagne }}>
              Role Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Senior Stylist, Manager"
              required
              style={{
                backgroundColor: COLORS.charcoalDark,
                border: `1px solid ${COLORS.gold}30`,
                color: COLORS.champagne
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" style={{ color: COLORS.champagne }}>
              Description
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Role description"
              style={{
                backgroundColor: COLORS.charcoalDark,
                border: `1px solid ${COLORS.gold}30`,
                color: COLORS.champagne
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rank" style={{ color: COLORS.champagne }}>
              Rank (0-100)
            </Label>
            <Input
              id="rank"
              type="number"
              min="0"
              max="100"
              value={formData.rank}
              onChange={e => setFormData({ ...formData, rank: parseInt(e.target.value) || 0 })}
              placeholder="0"
              style={{
                backgroundColor: COLORS.charcoalDark,
                border: `1px solid ${COLORS.gold}30`,
                color: COLORS.champagne
              }}
            />
          </div>
        </div>
      </SalonLuxeModal>
    </div>
  )
}
