'use client'

import React, { useMemo, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { Search, Edit, Trash2, Archive, ArchiveRestore, User, UserCircle, Plus, Grid3X3, List, MoreVertical, Building2, X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { cn } from '@/lib/utils'
import { getRelationship, extractRelationshipIds } from '@/lib/normalize-entity'

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

const AVATAR_COLORS = [
  { bg: '#D4AF3720', border: '#D4AF37', icon: '#D4AF37' },
  { bg: '#0F6F5C20', border: '#0F6F5C', icon: '#0F6F5C' },
  { bg: '#E8B4B820', border: '#E8B4B8', icon: '#E8B4B8' },
  { bg: '#8C785320', border: '#8C7853', icon: '#8C7853' },
  { bg: '#B8860B20', border: '#B8860B', icon: '#B8860B' },
  { bg: '#F5E6C820', border: '#D4AF37', icon: '#D4AF37' }
]

const getAvatarColor = (id: string, index: number) => {
  const colorIndex = id
    ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length
    : index % AVATAR_COLORS.length
  return AVATAR_COLORS[colorIndex]
}

interface StaffListTabProps {
  staff: any[]
  isLoading: boolean
  onEdit: (staff: any) => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onAdd: () => void
  branches?: any[]
  includeArchived: boolean
  setIncludeArchived: (value: boolean) => void
}

export function StaffListTab({
  staff,
  isLoading,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onAdd,
  branches = [],
  includeArchived,
  setIncludeArchived
}: StaffListTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name_asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [branchFilter, setBranchFilter] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const filteredAndSortedStaff = useMemo(
    () => {
      const filtered = staff?.filter(s => {
        const matchesStatus = includeArchived || s.status === 'active'
        const matchesSearch =
          s.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.role_title?.toLowerCase().includes(searchTerm.toLowerCase())

        // ✅ UPPERCASE STANDARD: Branch filtering using STAFF_MEMBER_OF relationships
        // All relationships normalized to UPPERCASE by useHeraStaff hook
        const matchesBranch = !branchFilter || (() => {
          const memberOfRels = getRelationship(s, 'STAFF_MEMBER_OF')
          if (!memberOfRels) return false

          const branchIds = extractRelationshipIds(memberOfRels, 'to_entity_id')
          return branchIds.includes(branchFilter)
        })()

        return matchesStatus && matchesSearch && matchesBranch
      }) || []

      // Apply sorting
      const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'name_asc':
            return (a.entity_name || '').localeCompare(b.entity_name || '')
          case 'name_desc':
            return (b.entity_name || '').localeCompare(a.entity_name || '')
          case 'role_asc':
            return (a.role_title || '').localeCompare(b.role_title || '')
          case 'role_desc':
            return (b.role_title || '').localeCompare(a.role_title || '')
          case 'hire_date_asc':
            return new Date(a.hire_date || 0).getTime() - new Date(b.hire_date || 0).getTime()
          case 'hire_date_desc':
            return new Date(b.hire_date || 0).getTime() - new Date(a.hire_date || 0).getTime()
          default:
            return 0
        }
      })

      return sorted
    },
    [staff, searchTerm, includeArchived, sortBy, branchFilter]
  )

  return (
    <div className="space-y-6">
      {/* Search and Filters - SINGLE ROW LAYOUT */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${COLORS.charcoalLight}90 0%, ${COLORS.charcoal}90 100())`,
          border: `1px solid ${COLORS.gold}20`
        }}
      >
        {/* Main Control Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Left Side: Tabs, Filters Button, Branch Badge, Search */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <Tabs
              value={includeArchived ? 'all' : 'active'}
              onValueChange={v => setIncludeArchived(v === 'all')}
            >
              <TabsList
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.black} 100())`,
                  border: `1px solid ${COLORS.gold}30`
                }}
              >
                <TabsTrigger value="active" style={{ color: COLORS.champagne }}>
                  Active
                </TabsTrigger>
                <TabsTrigger value="all" style={{ color: COLORS.champagne }}>
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {branches.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="min-h-[44px] transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  color: showFilters ? COLORS.gold : COLORS.lightText,
                  backgroundColor: showFilters ? `${COLORS.gold}20` : 'transparent'
                }}
              >
                <Filter className="h-4 w-4 mr-1" />
                <span className="hidden md:inline font-medium">Filters</span>
              </Button>
            )}

            {branchFilter && (
              <div
                className="inline-flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg border text-xs md:text-sm font-medium"
                style={{
                  backgroundColor: COLORS.gold + '20',
                  borderColor: COLORS.gold + '40',
                  color: COLORS.champagne
                }}
              >
                <Building2 className="h-3 w-3" style={{ color: COLORS.gold }} />
                <span className="hidden md:inline">
                  {branches.find(b => b.id === branchFilter)?.entity_name || 'Branch'}
                </span>
                <button
                  onClick={() => setBranchFilter(null)}
                  className="hover:scale-110 active:scale-95 transition-all duration-200"
                  aria-label="Clear branch filter"
                >
                  <X className="h-3 w-3" style={{ color: COLORS.gold }} />
                </button>
              </div>
            )}

            <div className="relative flex-1 max-w-xs">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: COLORS.gold }}
              />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 h-9 md:h-10 text-sm"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.black} 100())`,
                  border: `1px solid ${COLORS.gold}30`,
                  color: COLORS.champagne,
                  borderRadius: '0.5rem'
                }}
              />
            </div>
          </div>

          {/* Right Side: Sort & View Controls */}
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger
                className="w-32 md:w-44 h-9 md:h-10 text-xs md:text-sm"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.black} 100())`,
                  border: `1px solid ${COLORS.gold}30`,
                  color: COLORS.champagne
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.charcoalDark} 100())`,
                  border: `1px solid ${COLORS.gold}40`
                }}
              >
                <SelectItem value="name_asc" style={{ color: COLORS.champagne }}>
                  Name (A-Z)
                </SelectItem>
                <SelectItem value="name_desc" style={{ color: COLORS.champagne }}>
                  Name (Z-A)
                </SelectItem>
                <SelectItem value="role_asc" style={{ color: COLORS.champagne }}>
                  Role (A-Z)
                </SelectItem>
                <SelectItem value="role_desc" style={{ color: COLORS.champagne }}>
                  Role (Z-A)
                </SelectItem>
                <SelectItem value="hire_date_asc" style={{ color: COLORS.champagne }}>
                  Hire Date (Oldest)
                </SelectItem>
                <SelectItem value="hire_date_desc" style={{ color: COLORS.champagne }}>
                  Hire Date (Newest)
                </SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={() => setViewMode('grid')}
              className="min-w-[44px] min-h-[44px] rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
              style={{
                backgroundColor: viewMode === 'grid' ? `${COLORS.gold}20` : 'transparent',
                border: `1px solid ${viewMode === 'grid' ? COLORS.gold + '50' : COLORS.bronze + '30'}`,
                color: viewMode === 'grid' ? COLORS.gold : COLORS.bronze
              }}
              aria-label="Grid view"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="min-w-[44px] min-h-[44px] rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
              style={{
                backgroundColor: viewMode === 'list' ? `${COLORS.gold}20` : 'transparent',
                border: `1px solid ${viewMode === 'list' ? COLORS.gold + '50' : COLORS.bronze + '30'}`,
                color: viewMode === 'list' ? COLORS.gold : COLORS.bronze
              }}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expandable Filters (Branch Filter) */}
        {showFilters && branches.length > 0 && (
          <div
            className="mt-4 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300"
            style={{ borderColor: COLORS.bronze + '30' }}
          >
            <div className="flex items-center gap-4">
              <span
                className="text-xs font-medium uppercase tracking-wider opacity-70 shrink-0"
                style={{ color: COLORS.bronze }}
              >
                Branch
              </span>
              <Select
                value={branchFilter || '__ALL__'}
                onValueChange={value => setBranchFilter(value === '__ALL__' ? null : value)}
              >
                <SelectTrigger
                  className="w-[180px] h-9 text-sm"
                  style={{
                    backgroundColor: COLORS.charcoalLight + '80',
                    borderColor: COLORS.bronze + '40',
                    color: COLORS.champagne
                  }}
                >
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.charcoalDark} 100())`,
                    border: `1px solid ${COLORS.gold}40`
                  }}
                >
                  <SelectItem value="__ALL__" style={{ color: COLORS.champagne }}>
                    All branches
                  </SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id} style={{ color: COLORS.champagne }}>
                      {branch.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Staff List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: COLORS.gold }}
          />
          <span className="ml-3" style={{ color: COLORS.bronze }}>
            Loading staff data...
          </span>
        </div>
      ) : viewMode === 'grid' ? (
        /* 📱 MOBILE-FIRST: Responsive grid with mobile-optimized spacing */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredAndSortedStaff.map((member, index) => {
            const isArchived = member.status === 'archived'
            const avatarColor = getAvatarColor(member.id, index)
            return (
              <Card
                key={member.id}
                className="group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-95 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-2 cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoal} 100%)`,
                  border: `1px solid ${isArchived ? COLORS.bronze + '30' : COLORS.gold + '30'}`,
                  boxShadow: `0 8px 24px ${COLORS.black}60`,
                  animationDelay: `${index * 50}ms`
                }}
              >
                {/* Animated shimmer effect on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}15 50%, transparent 70%)`
                  }}
                />

                {isArchived && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge
                      style={{
                        backgroundColor: `${COLORS.bronze}30`,
                        color: COLORS.bronze,
                        border: `1px solid ${COLORS.bronze}60`
                      }}
                    >
                      Archived
                    </Badge>
                  </div>
                )}

                {/* 📱 MOBILE-FIRST: Responsive padding */}
                <CardContent className="p-4 md:p-5 lg:p-6 relative z-10">
                  <div className="flex items-start space-x-4">
                    <div
                      className="h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                      style={{
                        backgroundColor: avatarColor.bg,
                        border: `2px solid ${avatarColor.border}`,
                        boxShadow: `0 4px 12px ${avatarColor.border}30`
                      }}
                    >
                      <User className="h-8 w-8" style={{ color: avatarColor.icon }} />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-bold text-lg transition-transform duration-300 group-hover:translate-x-1"
                        style={{ color: COLORS.champagne }}
                      >
                        {member.entity_name}
                      </h3>
                      <Badge
                        className="mt-2 transition-all duration-300 group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${COLORS.emerald}20 0%, ${COLORS.gold}10 100%)`,
                          color: COLORS.emerald,
                          border: `1px solid ${COLORS.emerald}40`
                        }}
                      >
                        {member.role_title || 'Staff Member'}
                      </Badge>

                      <div className="mt-4 space-y-2 text-sm" style={{ color: COLORS.bronze }}>
                        {member.phone && (
                          <div className="flex items-center gap-2">
                            <span>📱</span>
                            <span>{member.phone}</span>
                          </div>
                        )}
                        {member.email && (
                          <div className="flex items-center gap-2 truncate">
                            <span>✉️</span>
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                      </div>

                      {member.hire_date && (
                        <div
                          className="mt-4 pt-3 text-xs border-t"
                          style={{
                            color: COLORS.bronze,
                            opacity: 0.6,
                            borderColor: `${COLORS.bronze}20`
                          }}
                        >
                          Joined {format(new Date(member.hire_date), 'MMM d, yyyy')}
                        </div>
                      )}

                      <div className="mt-4 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SalonLuxeButton
                              variant="outline"
                              size="sm"
                            >
                              Actions
                            </SalonLuxeButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            style={{
                              background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.charcoalDark} 100%)`,
                              border: `1px solid ${COLORS.gold}40`
                            }}
                          >
                            <DropdownMenuItem
                              onClick={() => onEdit(member)}
                              style={{ color: COLORS.lightText }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator style={{ backgroundColor: COLORS.gold + '20' }} />

                            {member.status === 'archived' ? (
                              <DropdownMenuItem
                                onClick={() => onRestore(member.id)}
                                style={{ color: COLORS.lightText }}
                              >
                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                Restore
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => onArchive(member.id)}
                                style={{ color: COLORS.lightText }}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator style={{ backgroundColor: COLORS.gold + '20' }} />

                            <DropdownMenuItem
                              onClick={() => onDelete(member.id)}
                              style={{ color: '#FF6B6B' }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* List View - Table */
        <div
          className="rounded-lg overflow-hidden"
          style={{
            backgroundColor: COLORS.charcoalLight + '95',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <Table>
            <TableHeader>
              <TableRow
                className="border-b hover:bg-transparent"
                style={{ borderColor: COLORS.bronze + '33' }}
              >
                <TableHead className="!text-[#F5E6C8]">Staff Member</TableHead>
                <TableHead className="!text-[#F5E6C8]">Role</TableHead>
                <TableHead className="!text-[#F5E6C8]">Contact</TableHead>
                <TableHead className="!text-[#F5E6C8]">Hire Date</TableHead>
                <TableHead className="!text-[#F5E6C8]">Status</TableHead>
                <TableHead className="!text-[#F5E6C8] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedStaff.map((member, index) => {
                const isArchived = member.status === 'archived'
                const avatarColor = getAvatarColor(member.id, index)

                return (
                  <TableRow
                    key={member.id}
                    className={cn(
                      'border-b transition-colors group',
                      index % 2 === 0 ? 'bg-gray-50/5' : 'bg-transparent',
                      'hover:bg-cyan-100/10',
                      isArchived && 'opacity-60'
                    )}
                    style={{ borderColor: COLORS.bronze + '20' }}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: avatarColor.bg,
                            border: `2px solid ${avatarColor.border}`
                          }}
                        >
                          <User className="w-5 h-5" style={{ color: avatarColor.icon }} />
                        </div>
                        <p style={{ color: COLORS.champagne }}>{member.entity_name}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="secondary"
                        style={{
                          background: `linear-gradient(135deg, ${COLORS.emerald}20 0%, ${COLORS.gold}10 100())`,
                          color: COLORS.emerald,
                          border: `1px solid ${COLORS.emerald}40`
                        }}
                      >
                        {member.role_title || 'Staff Member'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {member.email && (
                          <p className="text-sm" style={{ color: COLORS.lightText }}>
                            {member.email}
                          </p>
                        )}
                        {member.phone && (
                          <p className="text-xs" style={{ color: COLORS.bronze }}>
                            {member.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {member.hire_date ? (
                        <span className="text-sm" style={{ color: COLORS.lightText }}>
                          {format(new Date(member.hire_date), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="text-sm" style={{ color: COLORS.lightText, opacity: 0.5 }}>
                          -
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {isArchived ? (
                        <Badge
                          variant="secondary"
                          className="bg-gray-500/20 text-muted border-gray-500/30"
                        >
                          Archived
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-green-500/20 text-green-400 border-green-500/30"
                        >
                          Active
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" style={{ color: COLORS.lightText }} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          style={{
                            backgroundColor: COLORS.charcoal,
                            border: `1px solid ${COLORS.bronze}33`
                          }}
                        >
                          <DropdownMenuItem
                            onClick={() => onEdit(member)}
                            style={{ color: COLORS.lightText }}
                            className="hover:!bg-cyan-900/20 hover:!text-cyan-300"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuSeparator style={{ backgroundColor: COLORS.bronze + '33' }} />

                          {isArchived ? (
                            <DropdownMenuItem
                              onClick={() => onRestore(member.id)}
                              style={{ color: COLORS.lightText }}
                              className="hover:!bg-green-900/20 hover:!text-green-300"
                            >
                              <ArchiveRestore className="mr-2 h-4 w-4" />
                              Restore
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => onArchive(member.id)}
                              style={{ color: COLORS.lightText }}
                              className="hover:!bg-yellow-900/20 hover:!text-yellow-300"
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator style={{ backgroundColor: COLORS.bronze + '33' }} />

                          <DropdownMenuItem
                            onClick={() => onDelete(member.id)}
                            className="hover:!bg-red-900/20 hover:!text-red-300"
                            style={{ color: '#FF6B6B' }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}

              {filteredAndSortedStaff.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center"
                    style={{ color: COLORS.lightText, opacity: 0.5 }}
                  >
                    No staff members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAndSortedStaff.length === 0 && viewMode === 'grid' && (
        <div
          className="text-center py-20 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${COLORS.charcoalLight}60 0%, ${COLORS.charcoal}60 100%)`,
            border: `1px solid ${COLORS.gold}20`
          }}
        >
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.bronze}20 100%)`,
              border: `2px solid ${COLORS.gold}40`
            }}
          >
            <UserCircle className="h-10 w-10" style={{ color: COLORS.gold }} />
          </div>
          <h3 className="text-2xl font-bold mb-3" style={{ color: COLORS.champagne }}>
            No staff members found
          </h3>
          <p className="text-base mb-6" style={{ color: COLORS.bronze, opacity: 0.8 }}>
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Click below to add your first team member'}
          </p>
          {!searchTerm && (
            <SalonLuxeButton
              variant="primary"
              size="lg"
              onClick={onAdd}
              icon={<Plus className="w-5 h-5" />}
            >
              Add Your First Staff Member
            </SalonLuxeButton>
          )}
        </div>
      )}
    </div>
  )
}
