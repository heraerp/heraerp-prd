'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus, 
  UserMinus,
  Crown,
  Briefcase,
  GraduationCap,
  Building,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Activity,
  BarChart3,
  Calendar,
  Target,
  Award
} from 'lucide-react'
import { TeamMemberAssignment } from './TeamMemberAssignment'

interface TeamMember {
  id: string
  team_id: string
  member_id: string
  member_name: string
  role: 'partner' | 'manager' | 'senior' | 'staff' | 'intern'
  specialization: string[]
  availability_percentage: number
  hourly_rate?: number
  years_experience?: number
  certifications?: string[]
}

interface AuditTeam {
  id: string
  organization_id: string
  entity_code: string
  entity_name: string
  team_type: 'engagement' | 'specialized' | 'quality_review' | 'training'
  team_lead_id: string
  team_lead_name: string
  description: string
  specializations: string[]
  office_location: string
  max_capacity: number
  current_workload: number
  status: string
  created_date: string
  member_count?: number
  avg_member_availability?: number
  metadata: {
    team_performance_rating: number
    completed_engagements: number
    avg_engagement_duration: number
    client_satisfaction_rating?: number
    gspu_team_id: string
    audit_firm: string
  }
}

interface TeamFormData {
  team_name: string
  team_code: string
  team_type: 'engagement' | 'specialized' | 'quality_review' | 'training'
  team_lead_id: string
  team_lead_name: string
  description: string
  specializations: string[]
  office_location: string
  max_capacity: number
  team_members: {
    member_id: string
    member_name: string
    role: 'partner' | 'manager' | 'senior' | 'staff' | 'intern'
    specialization: string[]
    availability_percentage: number
  }[]
}

export function TeamManagement() {
  const [teams, setTeams] = useState<AuditTeam[]>([])
  const [selectedTeam, setSelectedTeam] = useState<AuditTeam | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<AuditTeam | null>(null)

  const [formData, setFormData] = useState<TeamFormData>({
    team_name: '',
    team_code: '',
    team_type: 'engagement',
    team_lead_id: '',
    team_lead_name: '',
    description: '',
    specializations: [],
    office_location: 'Manama HQ',
    max_capacity: 10,
    team_members: []
  })

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/v1/audit/teams?action=list_teams')
      const data = await response.json()
      
      if (data.success) {
        setTeams(data.data)
      }
    } catch (error) {
      console.error('Error loading teams:', error)
      toast.error('Failed to load teams')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTeamMembers = async (teamId: string) => {
    try {
      const response = await fetch(`/api/v1/audit/teams?action=team_members&teamId=${teamId}`)
      const data = await response.json()
      
      if (data.success) {
        setTeamMembers(data.data)
      }
    } catch (error) {
      console.error('Error loading team members:', error)
      toast.error('Failed to load team members')
    }
  }

  const handleCreateTeam = async () => {
    try {
      const response = await fetch('/api/v1/audit/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_team',
          data: formData
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Team created successfully')
        setShowCreateForm(false)
        resetForm()
        loadTeams()
      } else {
        toast.error(data.message || 'Failed to create team')
      }
    } catch (error) {
      console.error('Error creating team:', error)
      toast.error('Failed to create team')
    }
  }

  const handleUpdateTeam = async (teamId: string, updates: Partial<AuditTeam>) => {
    try {
      const response = await fetch('/api/v1/audit/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_team',
          data: { team_id: teamId, updates }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Team updated successfully')
        loadTeams()
        if (selectedTeam?.id === teamId) {
          setSelectedTeam(data.data.team)
        }
      } else {
        toast.error(data.message || 'Failed to update team')
      }
    } catch (error) {
      console.error('Error updating team:', error)
      toast.error('Failed to update team')
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This will remove all team members.')) {
      return
    }

    try {
      const response = await fetch(`/api/v1/audit/teams?teamId=${teamId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Team deleted successfully')
        loadTeams()
        if (selectedTeam?.id === teamId) {
          setSelectedTeam(null)
          setTeamMembers([])
        }
      } else {
        toast.error(data.message || 'Failed to delete team')
      }
    } catch (error) {
      console.error('Error deleting team:', error)
      toast.error('Failed to delete team')
    }
  }

  const resetForm = () => {
    setFormData({
      team_name: '',
      team_code: '',
      team_type: 'engagement',
      team_lead_id: '',
      team_lead_name: '',
      description: '',
      specializations: [],
      office_location: 'Manama HQ',
      max_capacity: 10,
      team_members: []
    })
    setEditingTeam(null)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'partner': return <Crown className="w-4 h-4 text-yellow-600" />
      case 'manager': return <Briefcase className="w-4 h-4 text-blue-600" />
      case 'senior': return <GraduationCap className="w-4 h-4 text-green-600" />
      case 'staff': return <Users className="w-4 h-4 text-gray-600" />
      case 'intern': return <Star className="w-4 h-4 text-purple-600" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getTeamTypeColor = (type: string) => {
    switch (type) {
      case 'engagement': return 'bg-blue-100 text-blue-800'
      case 'quality_review': return 'bg-green-100 text-green-800'
      case 'specialized': return 'bg-purple-100 text-purple-800'
      case 'training': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return 'text-red-600'
    if (workload >= 75) return 'text-orange-600'
    if (workload >= 50) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GSPU Team Management</h1>
          <p className="text-gray-600 mt-1">Manage audit teams, assignments, and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            {showCreateForm && (
              <div 
                className="fixed inset-0 bg-black/60 z-[90]"
                onClick={() => setShowCreateForm(false)}
              />
            )}
            <DialogContent 
              className="max-w-2xl bg-white border border-gray-200 shadow-2xl z-[100] 
                         fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]
                         rounded-lg p-6"
              style={{
                backgroundColor: 'white',
                opacity: 1,
                visibility: 'visible'
              }}
            >
              <DialogHeader className="pb-4 border-b border-gray-100">
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Create New Audit Team
                </DialogTitle>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto pt-4">
                <CreateTeamForm 
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleCreateTeam}
                  onCancel={() => {
                    setShowCreateForm(false)
                    resetForm()
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Teams</p>
                <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Teams</p>
                <p className="text-2xl font-bold text-green-600">
                  {teams.filter(t => t.status === 'active').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Utilization</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Math.round(teams.reduce((sum, t) => sum + t.current_workload, 0) / teams.length)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-purple-600">
                  {teams.reduce((sum, t) => sum + (t.member_count || 0), 0)}
                </p>
              </div>
              <Building className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Audit Teams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTeam?.id === team.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedTeam(team)
                    loadTeamMembers(team.id)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{team.entity_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{team.entity_code}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getTeamTypeColor(team.team_type)}>
                          {team.team_type.replace('_', ' ')}
                        </Badge>
                        <span className={`text-sm font-medium ${getWorkloadColor(team.current_workload)}`}>
                          {team.current_workload}% utilized
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{team.member_count || 0} members</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-gray-600">
                          {team.metadata.team_performance_rating}/5.0
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Team Details */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <TeamDetails 
              team={selectedTeam}
              members={teamMembers}
              onUpdateTeam={handleUpdateTeam}
              onDeleteTeam={handleDeleteTeam}
              onMembersChanged={() => loadTeamMembers(selectedTeam.id)}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600">Select a team to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateTeamForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel 
}: {
  formData: TeamFormData
  setFormData: (data: TeamFormData) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  const specializations = [
    'Public Companies', 'Financial Services', 'SOX Compliance', 
    'Internal Controls', 'EQCR', 'Quality Control', 'Risk Assessment',
    'Banking', 'Insurance', 'Healthcare', 'Manufacturing', 'Technology'
  ]

  return (
    <div className="space-y-6 bg-white p-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="team_name" className="text-gray-700 font-medium">Team Name</Label>
          <Input
            id="team_name"
            className="mt-1 bg-white border border-gray-300 text-gray-900"
            value={formData.team_name}
            onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
            placeholder="Senior Engagement Team Alpha"
          />
        </div>
        <div>
          <Label htmlFor="team_code" className="text-gray-700 font-medium">Team Code</Label>
          <Input
            id="team_code"
            className="mt-1 bg-white border border-gray-300 text-gray-900"
            value={formData.team_code}
            onChange={(e) => setFormData({ ...formData, team_code: e.target.value })}
            placeholder="GSPU-ENG-001"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="team_type">Team Type</Label>
          <Select value={formData.team_type} onValueChange={(value: any) => setFormData({ ...formData, team_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="engagement">Engagement Team</SelectItem>
              <SelectItem value="quality_review">Quality Review</SelectItem>
              <SelectItem value="specialized">Specialized Team</SelectItem>
              <SelectItem value="training">Training Team</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="max_capacity">Max Capacity</Label>
          <Input
            id="max_capacity"
            type="number"
            value={formData.max_capacity}
            onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 10 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="team_lead_name">Team Lead Name</Label>
          <Input
            id="team_lead_name"
            value={formData.team_lead_name}
            onChange={(e) => setFormData({ ...formData, team_lead_name: e.target.value })}
            placeholder="John Smith"
          />
        </div>
        <div>
          <Label htmlFor="office_location">Office Location</Label>
          <Select value={formData.office_location} onValueChange={(value) => setFormData({ ...formData, office_location: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Manama HQ">Manama HQ</SelectItem>
              <SelectItem value="Dubai Office">Dubai Office</SelectItem>
              <SelectItem value="Riyadh Office">Riyadh Office</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Specialized team for high-risk public company audits"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          Cancel
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={!formData.team_name || !formData.team_lead_name}
          className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Team
        </Button>
      </div>
    </div>
  )
}

function TeamDetails({ 
  team, 
  members, 
  onUpdateTeam, 
  onDeleteTeam,
  onMembersChanged 
}: {
  team: AuditTeam
  members: TeamMember[]
  onUpdateTeam: (teamId: string, updates: Partial<AuditTeam>) => void
  onDeleteTeam: (teamId: string) => void
  onMembersChanged: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              {team.entity_name}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{team.entity_code} • {team.office_location}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onDeleteTeam(team.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Team Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <Badge className={team.team_type === 'engagement' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                      {team.team_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lead:</span>
                    <span className="text-sm font-medium">{team.team_lead_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Capacity:</span>
                    <span className="text-sm font-medium">{members.length}/{team.max_capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Utilization:</span>
                    <span className={`text-sm font-medium ${team.current_workload >= 90 ? 'text-red-600' : 'text-green-600'}`}>
                      {team.current_workload}%
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-1">
                  {team.specializations.map((spec, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {team.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{team.description}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">Team Members</h4>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-1" />
                Add Member
              </Button>
            </div>
            
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getRoleIcon(member.role)}
                    <div>
                      <p className="font-medium text-gray-900">{member.member_name}</p>
                      <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{member.availability_percentage}% available</p>
                    {member.specialization.length > 0 && (
                      <p className="text-xs text-gray-600">{member.specialization.join(', ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <TeamMemberAssignment
              teamId={team.id}
              teamName={team.entity_name}
              currentMembers={members}
              onMemberAssigned={onMembersChanged}
              onMemberRemoved={onMembersChanged}
            />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Team Metrics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Performance Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{team.metadata.team_performance_rating}/5.0</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed Engagements</span>
                    <span className="font-medium">{team.metadata.completed_engagements}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Duration</span>
                    <span className="font-medium">{team.metadata.avg_engagement_duration} days</span>
                  </div>
                  {team.metadata.client_satisfaction_rating && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Client Satisfaction</span>
                      <span className="font-medium">{team.metadata.client_satisfaction_rating}/5.0</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'partner': return <Crown className="w-4 h-4 text-yellow-600" />
    case 'manager': return <Briefcase className="w-4 h-4 text-blue-600" />
    case 'senior': return <GraduationCap className="w-4 h-4 text-green-600" />
    case 'staff': return <Users className="w-4 h-4 text-gray-600" />
    case 'intern': return <Star className="w-4 h-4 text-purple-600" />
    default: return <Users className="w-4 h-4" />
  }
}