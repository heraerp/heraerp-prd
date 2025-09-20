'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  UserPlus,
  UserMinus,
  Crown,
  Briefcase,
  GraduationCap,
  Users,
  Star,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react'

interface AvailableMember {
  id: string
  name: string
  role: 'partner' | 'manager' | 'senior' | 'staff' | 'intern'
  availability: number
  specializations: string[]
  hourly_rate?: number
  years_experience?: number
  certifications?: string[]
  current_assignments?: number
}

interface TeamMember {
  id: string
  team_id: string
  member_id: string
  member_name: string
  role: 'partner' | 'manager' | 'senior' | 'staff' | 'intern'
  specialization: string[]
  availability_percentage: number
  hourly_rate?: number
}

interface TeamMemberAssignmentProps {
  teamId: string
  teamName: string
  currentMembers: TeamMember[]
  onMemberAssigned: () => void
  onMemberRemoved: () => void
}

export function TeamMemberAssignment({
  teamId,
  teamName,
  currentMembers,
  onMemberAssigned,
  onMemberRemoved
}: TeamMemberAssignmentProps) {
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<AvailableMember[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<number>(0)
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<AvailableMember | null>(null)

  const [assignmentData, setAssignmentData] = useState({
    role: 'staff' as 'partner' | 'manager' | 'senior' | 'staff' | 'intern',
    specialization: [] as string[],
    availability_percentage: 100
  })

  const specializations = [
    'Public Companies',
    'Financial Services',
    'SOX Compliance',
    'Internal Controls',
    'EQCR',
    'Quality Control',
    'Risk Assessment',
    'Banking',
    'Insurance',
    'Healthcare',
    'Manufacturing',
    'Technology',
    'Revenue Recognition',
    'Leases',
    'Derivatives',
    'Inventory',
    'Procurement'
  ]

  useEffect(() => {
    loadAvailableMembers()
  }, [])

  useEffect(() => {
    filterMembers()
  }, [availableMembers, searchTerm, roleFilter, availabilityFilter, selectedSpecializations])

  const loadAvailableMembers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/audit/teams?action=available_members')
      const data = await response.json()

      if (data.success) {
        // Filter out members already assigned to this team
        const currentMemberIds = currentMembers.map(m => m.member_id)
        const availableList = data.data.filter(
          (member: AvailableMember) => !currentMemberIds.includes(member.id)
        )
        setAvailableMembers(availableList)
      }
    } catch (error) {
      console.error('Error loading available members:', error)
      toast.error('Failed to load available members')
    } finally {
      setIsLoading(false)
    }
  }

  const filterMembers = () => {
    let filtered = availableMembers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        member =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter)
    }

    // Availability filter
    if (availabilityFilter > 0) {
      filtered = filtered.filter(member => member.availability >= availabilityFilter)
    }

    // Specialization filter
    if (selectedSpecializations.length > 0) {
      filtered = filtered.filter(member =>
        selectedSpecializations.some(spec => member.specializations.includes(spec))
      )
    }

    setFilteredMembers(filtered)
  }

  const handleAssignMember = async () => {
    if (!selectedMember) return

    try {
      const response = await fetch('/api/v1/audit/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_member',
          data: {
            team_id: teamId,
            member_id: selectedMember.id,
            member_name: selectedMember.name,
            role: assignmentData.role,
            specialization: assignmentData.specialization,
            availability_percentage: assignmentData.availability_percentage
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${selectedMember.name} assigned to ${teamName}`)
        setShowAssignDialog(false)
        setSelectedMember(null)
        resetAssignmentForm()
        loadAvailableMembers()
        onMemberAssigned()
      } else {
        toast.error(data.message || 'Failed to assign member')
      }
    } catch (error) {
      console.error('Error assigning member:', error)
      toast.error('Failed to assign member')
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from ${teamName}?`)) return

    try {
      const response = await fetch('/api/v1/audit/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_member',
          data: {
            team_id: teamId,
            member_id: memberId
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${memberName} removed from ${teamName}`)
        loadAvailableMembers()
        onMemberRemoved()
      } else {
        toast.error(data.message || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    }
  }

  const resetAssignmentForm = () => {
    setAssignmentData({
      role: 'staff',
      specialization: [],
      availability_percentage: 100
    })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'partner':
        return <Crown className="w-4 h-4 text-yellow-600" />
      case 'manager':
        return <Briefcase className="w-4 h-4 text-primary" />
      case 'senior':
        return <GraduationCap className="w-4 h-4 text-green-600" />
      case 'staff':
        return <Users className="w-4 h-4 text-muted-foreground" />
      case 'intern':
        return <Star className="w-4 h-4 text-purple-600" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  const getAvailabilityColor = (availability: number) => {
    if (availability >= 80) return 'text-green-600'
    if (availability >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Current Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Current Team Members ({currentMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No team members assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentMembers.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getRoleIcon(member.role)}
                    <div>
                      <p className="font-medium text-gray-100">{member.member_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                      {member.specialization.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {member.specialization.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${getAvailabilityColor(member.availability_percentage)}`}
                    >
                      {member.availability_percentage}%
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveMember(member.member_id, member.member_name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Available Members ({filteredMembers.length})
            </CardTitle>
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              {showAssignDialog && (
                <div
                  className="fixed inset-0 bg-background/60 z-[90]"
                  onClick={() => setShowAssignDialog(false)}
                />
              )}
              <DialogContent
                className="max-w-lg bg-background border border-border shadow-2xl z-[100]
                           fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]
                           rounded-lg p-6"
                style={{
                  backgroundColor: 'white',
                  opacity: 1,
                  visibility: 'visible'
                }}
              >
                <DialogHeader className="pb-4 border-b border-gray-100">
                  <DialogTitle className="text-lg font-semibold text-gray-100">
                    Assign {selectedMember?.name} to {teamName}
                  </DialogTitle>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pt-4">
                  <AssignmentForm
                    member={selectedMember}
                    assignmentData={assignmentData}
                    setAssignmentData={setAssignmentData}
                    specializations={specializations}
                    onAssign={handleAssignMember}
                    onCancel={() => {
                      setShowAssignDialog(false)
                      setSelectedMember(null)
                      resetAssignmentForm()
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role-filter">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="availability-filter">Min Availability</Label>
              <Select
                value={availabilityFilter.toString()}
                onValueChange={value => setAvailabilityFilter(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any</SelectItem>
                  <SelectItem value="25">25%+</SelectItem>
                  <SelectItem value="50">50%+</SelectItem>
                  <SelectItem value="75">75%+</SelectItem>
                  <SelectItem value="90">90%+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Specializations</Label>
              <div className="flex flex-wrap gap-1 mt-1 max-h-20 overflow-y-auto">
                {specializations.slice(0, 6).map(spec => (
                  <Badge
                    key={spec}
                    variant={selectedSpecializations.includes(spec) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      setSelectedSpecializations(prev =>
                        prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
                      )
                    }}
                  >
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Members List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No available members match your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMembers.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getRoleIcon(member.role)}
                    <div>
                      <p className="font-medium text-gray-100">{member.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                      {member.specializations.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {member.specializations.slice(0, 2).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${getAvailabilityColor(member.availability)}`}
                      >
                        {member.availability}% available
                      </p>
                      {member.current_assignments && (
                        <p className="text-xs text-muted-foreground">
                          {member.current_assignments} assignments
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedMember(member)
                        setAssignmentData({
                          role: member.role,
                          specialization: member.specializations.slice(0, 3),
                          availability_percentage: Math.min(member.availability, 100)
                        })
                        setShowAssignDialog(true)
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AssignmentForm({
  member,
  assignmentData,
  setAssignmentData,
  specializations,
  onAssign,
  onCancel
}: {
  member: AvailableMember | null
  assignmentData: any
  setAssignmentData: (data: any) => void
  specializations: string[]
  onAssign: () => void
  onCancel: () => void
}) {
  if (!member) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
        {getRoleIcon(member.role)}
        <div>
          <p className="font-medium text-gray-100">{member.name}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {member.role} • {member.availability}% available
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="assign-role">Role in Team</Label>
          <Select
            value={assignmentData.role}
            onValueChange={value => setAssignmentData({ ...assignmentData, role: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="intern">Intern</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="availability">Availability %</Label>
          <Input
            id="availability"
            type="number"
            min="1"
            max="100"
            value={assignmentData.availability_percentage}
            onChange={e =>
              setAssignmentData({
                ...assignmentData,
                availability_percentage: parseInt(e.target.value) || 100
              })
            }
          />
        </div>
      </div>

      <div>
        <Label>Specializations for this Team</Label>
        <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
          {specializations.map(spec => (
            <div key={spec} className="flex items-center space-x-2">
              <Checkbox
                id={spec}
                checked={assignmentData.specialization.includes(spec)}
                onCheckedChange={checked => {
                  if (checked) {
                    setAssignmentData({
                      ...assignmentData,
                      specialization: [...assignmentData.specialization, spec]
                    })
                  } else {
                    setAssignmentData({
                      ...assignmentData,
                      specialization: assignmentData.specialization.filter(
                        (s: string) => s !== spec
                      )
                    })
                  }
                }}
              />
              <Label htmlFor={spec} className="text-sm">
                {spec}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onAssign}>Assign to Team</Button>
      </div>
    </div>
  )
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'partner':
      return <Crown className="w-4 h-4 text-yellow-600" />
    case 'manager':
      return <Briefcase className="w-4 h-4 text-primary" />
    case 'senior':
      return <GraduationCap className="w-4 h-4 text-green-600" />
    case 'staff':
      return <Users className="w-4 h-4 text-muted-foreground" />
    case 'intern':
      return <Star className="w-4 h-4 text-purple-600" />
    default:
      return <Users className="w-4 h-4" />
  }
}
