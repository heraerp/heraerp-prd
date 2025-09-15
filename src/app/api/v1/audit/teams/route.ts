import { NextRequest, NextResponse } from 'next/server'

interface CreateTeamRequest {
  action: 'create_team'
  data: {
    team_name: string
    team_code: string
    team_type: 'engagement' | 'specialized' | 'quality_review' | 'training'
    team_lead_id: string
    team_lead_name: string
    description?: string
    specializations: string[]
    office_location?: string
    max_capacity: number
    current_workload?: number
    team_members: {
      member_id: string
      member_name: string
      role: 'partner' | 'manager' | 'senior' | 'staff' | 'intern'
      specialization: string[]
      availability_percentage: number
      hourly_rate?: number
    }[]
  }
}

interface UpdateTeamRequest {
  action: 'update_team'
  data: {
    team_id: string
    updates: Partial<CreateTeamRequest['data']>
  }
}

interface AssignMemberRequest {
  action: 'assign_member' | 'remove_member'
  data: {
    team_id: string
    member_id: string
    member_name: string
    role?: 'partner' | 'manager' | 'senior' | 'staff' | 'intern'
    specialization?: string[]
    availability_percentage?: number
  }
}

// Mock team data for demonstration - in production, this would be stored in HERA universal tables
const mockTeams = [
  {
    id: 'team_001',
    organization_id: 'gspu_audit_partners_org', // GSPU is the audit firm
    entity_type: 'audit_team',
    entity_code: 'GSPU-ENG-001',
    entity_name: 'Senior Engagement Team Alpha',
    smart_code: 'HERA.AUD.TEAM.ENT.MASTER.v1',
    status: 'active',
    team_type: 'engagement',
    team_lead_id: 'partner_001',
    team_lead_name: 'John Smith',
    description: 'Specialized team for high-risk public company audits',
    specializations: ['Public Companies', 'Financial Services', 'SOX Compliance'],
    office_location: 'Manama HQ',
    max_capacity: 12,
    current_workload: 85,
    created_date: '2025-01-15',
    updated_date: '2025-02-01',
    metadata: {
      team_performance_rating: 4.8,
      completed_engagements: 15,
      avg_engagement_duration: 45,
      client_satisfaction_rating: 4.9,
      gspu_team_id: 'GSPU-ENG-001',
      audit_firm: 'GSPU_AUDIT_PARTNERS'
    }
  },
  {
    id: 'team_002',
    organization_id: 'gspu_audit_partners_org',
    entity_type: 'audit_team',
    entity_code: 'GSPU-QR-001',
    entity_name: 'Quality Review Team',
    smart_code: 'HERA.AUD.TEAM.ENT.MASTER.v1',
    status: 'active',
    team_type: 'quality_review',
    team_lead_id: 'partner_002',
    team_lead_name: 'Sarah Johnson',
    description: 'Independent quality review and EQCR specialists',
    specializations: ['EQCR', 'Quality Control', 'Risk Assessment'],
    office_location: 'Manama HQ',
    max_capacity: 6,
    current_workload: 60,
    created_date: '2025-01-10',
    updated_date: '2025-01-28',
    metadata: {
      team_performance_rating: 4.9,
      completed_reviews: 25,
      avg_review_duration: 12,
      eqcr_certifications: 4,
      gspu_team_id: 'GSPU-QR-001',
      audit_firm: 'GSPU_AUDIT_PARTNERS'
    }
  }
]

const mockTeamMembers = [
  // Team Alpha members
  {
    id: 'member_001',
    team_id: 'team_001',
    member_id: 'partner_001',
    member_name: 'John Smith',
    role: 'partner',
    specialization: ['Public Companies', 'Financial Services'],
    availability_percentage: 90,
    hourly_rate: 350,
    years_experience: 15,
    certifications: ['CPA', 'CISA']
  },
  {
    id: 'member_002',
    team_id: 'team_001',
    member_id: 'manager_001',
    member_name: 'Emily Davis',
    role: 'manager',
    specialization: ['SOX Compliance', 'Internal Controls'],
    availability_percentage: 95,
    hourly_rate: 180,
    years_experience: 8,
    certifications: ['CPA', 'CIA']
  },
  {
    id: 'member_003',
    team_id: 'team_001',
    member_id: 'senior_001',
    member_name: 'Michael Brown',
    role: 'senior',
    specialization: ['Financial Statements', 'Analytical Reviews'],
    availability_percentage: 100,
    hourly_rate: 120,
    years_experience: 5,
    certifications: ['CPA']
  },
  // Quality Review Team members
  {
    id: 'member_004',
    team_id: 'team_002',
    member_id: 'partner_002',
    member_name: 'Sarah Johnson',
    role: 'partner',
    specialization: ['EQCR', 'Quality Control'],
    availability_percentage: 80,
    hourly_rate: 400,
    years_experience: 18,
    certifications: ['CPA', 'EQCR']
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const teamId = searchParams.get('teamId')
    const teamType = searchParams.get('teamType')
    const includeMembers = searchParams.get('includeMembers') === 'true'

    if (action === 'get_team' && teamId) {
      // Get specific team details
      const team = mockTeams.find(t => t.id === teamId)

      if (!team) {
        return NextResponse.json(
          {
            success: false,
            message: 'Team not found'
          },
          { status: 404 }
        )
      }

      const response: any = { team }

      if (includeMembers) {
        const members = mockTeamMembers.filter(m => m.team_id === teamId)
        response.members = members
        response.team_statistics = {
          total_members: members.length,
          avg_availability:
            members.reduce((sum, m) => sum + m.availability_percentage, 0) / members.length,
          total_hourly_cost: members.reduce((sum, m) => sum + (m.hourly_rate || 0), 0),
          role_distribution: {
            partners: members.filter(m => m.role === 'partner').length,
            managers: members.filter(m => m.role === 'manager').length,
            seniors: members.filter(m => m.role === 'senior').length,
            staff: members.filter(m => m.role === 'staff').length,
            interns: members.filter(m => m.role === 'intern').length
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: response
      })
    }

    if (action === 'list_teams') {
      // List all teams with optional filtering
      let filteredTeams = mockTeams

      if (teamType) {
        filteredTeams = filteredTeams.filter(t => t.team_type === teamType)
      }

      // Add member counts to each team
      const teamsWithCounts = filteredTeams.map(team => {
        const members = mockTeamMembers.filter(m => m.team_id === team.id)
        return {
          ...team,
          member_count: members.length,
          avg_member_availability:
            members.length > 0
              ? members.reduce((sum, m) => sum + m.availability_percentage, 0) / members.length
              : 0
        }
      })

      return NextResponse.json({
        success: true,
        data: teamsWithCounts,
        total: teamsWithCounts.length,
        summary: {
          total_teams: mockTeams.length,
          active_teams: mockTeams.filter(t => t.status === 'active').length,
          team_types: {
            engagement: mockTeams.filter(t => t.team_type === 'engagement').length,
            quality_review: mockTeams.filter(t => t.team_type === 'quality_review').length,
            specialized: mockTeams.filter(t => t.team_type === 'specialized').length,
            training: mockTeams.filter(t => t.team_type === 'training').length
          }
        }
      })
    }

    if (action === 'team_members' && teamId) {
      // Get team members
      const members = mockTeamMembers.filter(m => m.team_id === teamId)

      return NextResponse.json({
        success: true,
        data: members,
        total: members.length
      })
    }

    if (action === 'available_members') {
      // Get available team members for assignment
      const availableMembers = [
        {
          id: 'staff_001',
          name: 'David Wilson',
          role: 'staff',
          availability: 85,
          specializations: ['Inventory', 'Procurement']
        },
        {
          id: 'senior_002',
          name: 'Lisa Chen',
          role: 'senior',
          availability: 70,
          specializations: ['Revenue Recognition', 'Leases']
        },
        {
          id: 'manager_002',
          name: 'Robert Taylor',
          role: 'manager',
          availability: 60,
          specializations: ['Banking', 'Derivatives']
        },
        {
          id: 'intern_001',
          name: 'Jessica Adams',
          role: 'intern',
          availability: 100,
          specializations: ['Data Analysis', 'Documentation']
        }
      ]

      return NextResponse.json({
        success: true,
        data: availableMembers
      })
    }

    // Default: return summary statistics
    return NextResponse.json({
      success: true,
      data: {
        total_teams: mockTeams.length,
        total_members: mockTeamMembers.length,
        avg_team_size: mockTeamMembers.length / mockTeams.length,
        avg_utilization:
          mockTeams.reduce((sum, t) => sum + (t.current_workload || 0), 0) / mockTeams.length
      }
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch teams'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'create_team') {
      // Create new audit team
      const teamId = `team_${Date.now()}`
      const teamCode =
        data.team_code ||
        `GSPU-${data.team_type.toUpperCase().substring(0, 3)}-${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, '0')}`

      const newTeam = {
        id: teamId,
        organization_id: 'gspu_audit_partners_org', // GSPU is the audit firm using HERA
        entity_type: 'audit_team',
        entity_code: teamCode,
        entity_name: data.team_name,
        smart_code: 'HERA.AUD.TEAM.ENT.MASTER.v1',
        status: 'active',
        team_type: data.team_type,
        team_lead_id: data.team_lead_id,
        team_lead_name: data.team_lead_name,
        description: data.description || '',
        specializations: data.specializations || [],
        office_location: data.office_location || 'Manama HQ',
        max_capacity: data.max_capacity || 10,
        current_workload: data.current_workload || 0,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        metadata: {
          team_performance_rating: 0,
          completed_engagements: 0,
          avg_engagement_duration: 0,
          client_satisfaction_rating: 0,
          gspu_team_id: teamCode,
          audit_firm: 'GSPU_AUDIT_PARTNERS'
        }
      }

      // Add team members
      const teamMembers = data.team_members.map((member: any) => ({
        id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        team_id: teamId,
        member_id: member.member_id,
        member_name: member.member_name,
        role: member.role,
        specialization: member.specialization || [],
        availability_percentage: member.availability_percentage || 100,
        hourly_rate: member.hourly_rate || 0,
        assigned_date: new Date().toISOString()
      }))

      // Add to mock data (in production, this would be saved to HERA universal tables)
      mockTeams.push(newTeam)
      mockTeamMembers.push(...teamMembers)

      // Create universal transaction for team creation
      const transaction = {
        transaction_type: 'team_creation',
        smart_code: 'HERA.AUD.TEAM.TXN.CREATE.v1',
        reference_number: teamCode,
        total_amount: teamMembers.reduce((sum: number, m: any) => sum + (m.hourly_rate || 0), 0),
        metadata: {
          team_name: data.team_name,
          team_type: data.team_type,
          team_lead: data.team_lead_name,
          member_count: teamMembers.length,
          specializations: data.specializations
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Team created successfully',
        data: {
          team: newTeam,
          members: teamMembers,
          transaction
        }
      })
    }

    if (action === 'assign_member') {
      // Assign member to team
      const { team_id, member_id, member_name, role, specialization, availability_percentage } =
        data

      const newMember = {
        id: `member_${Date.now()}`,
        team_id,
        member_id,
        member_name,
        role: role || 'staff',
        specialization: specialization || [],
        availability_percentage: availability_percentage || 100,
        hourly_rate: 150, // Default hourly rate
        years_experience: 3, // Default experience
        certifications: [], // Default empty certifications
        assigned_date: new Date().toISOString()
      }

      mockTeamMembers.push(newMember)

      // Create transaction for member assignment
      const transaction = {
        transaction_type: 'team_member_assignment',
        smart_code: 'HERA.AUD.TEAM.TXN.ASSIGN.v1',
        reference_number: `${team_id}-${member_id}`,
        total_amount: 0,
        metadata: {
          team_id,
          member_name,
          role,
          assignment_date: new Date().toISOString()
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Member assigned to team successfully',
        data: {
          member: newMember,
          transaction
        }
      })
    }

    if (action === 'remove_member') {
      // Remove member from team
      const { team_id, member_id } = data

      const memberIndex = mockTeamMembers.findIndex(
        m => m.team_id === team_id && m.member_id === member_id
      )

      if (memberIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            message: 'Team member not found'
          },
          { status: 404 }
        )
      }

      const removedMember = mockTeamMembers.splice(memberIndex, 1)[0]

      // Create transaction for member removal
      const transaction = {
        transaction_type: 'team_member_removal',
        smart_code: 'HERA.AUD.TEAM.TXN.REMOVE.v1',
        reference_number: `${team_id}-${member_id}`,
        total_amount: 0,
        metadata: {
          team_id,
          member_name: removedMember.member_name,
          removal_date: new Date().toISOString()
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Member removed from team successfully',
        data: {
          removed_member: removedMember,
          transaction
        }
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid action specified'
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing team request:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process team request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'update_team') {
      const { team_id, updates } = data

      const teamIndex = mockTeams.findIndex(t => t.id === team_id)
      if (teamIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            message: 'Team not found'
          },
          { status: 404 }
        )
      }

      // Update team
      const updatedTeam = {
        ...mockTeams[teamIndex],
        ...updates,
        updated_date: new Date().toISOString()
      }

      mockTeams[teamIndex] = updatedTeam

      // Create transaction for team update
      const transaction = {
        transaction_type: 'team_update',
        smart_code: 'HERA.AUD.TEAM.TXN.UPDATE.v1',
        reference_number: updatedTeam.entity_code,
        total_amount: 0,
        metadata: {
          team_id,
          updated_fields: Object.keys(updates),
          update_date: new Date().toISOString()
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Team updated successfully',
        data: {
          team: updatedTeam,
          transaction
        }
      })
    }

    if (action === 'update_member') {
      const { team_id, member_id, updates } = data

      const memberIndex = mockTeamMembers.findIndex(
        m => m.team_id === team_id && m.member_id === member_id
      )
      if (memberIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            message: 'Team member not found'
          },
          { status: 404 }
        )
      }

      // Update member
      mockTeamMembers[memberIndex] = {
        ...mockTeamMembers[memberIndex],
        ...updates,
        updated_date: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        message: 'Team member updated successfully',
        data: mockTeamMembers[memberIndex]
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid action specified'
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update team'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Team ID is required'
        },
        { status: 400 }
      )
    }

    const teamIndex = mockTeams.findIndex(t => t.id === teamId)
    if (teamIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Team not found'
        },
        { status: 404 }
      )
    }

    // Remove team and all its members
    const deletedTeam = mockTeams.splice(teamIndex, 1)[0]
    const removedMembers = mockTeamMembers.filter(m => m.team_id === teamId)

    // Remove members
    for (let i = mockTeamMembers.length - 1; i >= 0; i--) {
      if (mockTeamMembers[i].team_id === teamId) {
        mockTeamMembers.splice(i, 1)
      }
    }

    // Create transaction for team deletion
    const transaction = {
      transaction_type: 'team_deletion',
      smart_code: 'HERA.AUD.TEAM.TXN.DELETE.v1',
      reference_number: deletedTeam.entity_code,
      total_amount: 0,
      metadata: {
        team_name: deletedTeam.entity_name,
        members_removed: removedMembers.length,
        deletion_date: new Date().toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully',
      data: {
        deleted_team: deletedTeam,
        removed_members: removedMembers,
        transaction
      }
    })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete team'
      },
      { status: 500 }
    )
  }
}
