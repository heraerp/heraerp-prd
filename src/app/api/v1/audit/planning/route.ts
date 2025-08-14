import { NextRequest, NextResponse } from 'next/server'

// Professional audit planning data using HERA Universal Schema
const auditPlanningEntities = [
  // Audit Engagement Entity
  {
    id: 'eng_planning_001',
    entity_type: 'audit_planning',
    entity_name: 'Cyprus Trading Ltd - 2025 Audit Planning',
    entity_code: 'PLAN-2025-001',
    organization_id: 'gspu_audit_partners_org',
    smart_code: 'HERA.AUD.PLAN.ENT.MASTER.v1',
    status: 'in_progress',
    created_date: '2025-01-15',
    metadata: {
      client_id: 'eng_001',
      engagement_partner: 'Michael Harrison, CPA',
      audit_manager: 'Sarah Chen, CA',
      year_end: '2025-12-31',
      industry: 'Technology Services',
      risk_rating: 'moderate',
      planned_hours: 580,
      budget: 89000,
      materiality: 125000,
      performance_materiality: 93750,
      trivial_threshold: 6250,
      client_revenue: 12500000,
      materiality_basis: 'revenue',
      materiality_percentage: 1.0,
      completion_percentage: 45
    }
  }
]

// Risk Assessment Entities
const riskAssessmentEntities = [
  {
    id: 'risk_001',
    entity_type: 'audit_risk',
    entity_name: 'Revenue Recognition Risk Assessment',
    entity_code: 'RISK-REV-001',
    organization_id: 'gspu_audit_partners_org',
    smart_code: 'HERA.AUD.RISK.ENT.ASSESS.v1',
    status: 'identified',
    parent_id: 'eng_planning_001',
    metadata: {
      risk_category: 'Revenue Recognition',
      risk_level: 'high',
      inherent_risk: 'high',
      control_risk: 'moderate',
      detection_risk: 'low',
      fraud_risk: true,
      significant_risk: true,
      planned_procedures: 8,
      estimated_hours: 45,
      assigned_to: 'Senior Team',
      isa_reference: 'ISA 240, ISA 315',
      risk_description: 'Risk of material misstatement in revenue recognition due to complex contracts and multiple performance obligations',
      planned_response: 'Detailed testing of revenue transactions, contract review, and analytical procedures'
    }
  },
  {
    id: 'risk_002',
    entity_type: 'audit_risk',
    entity_name: 'Management Override Risk Assessment',
    entity_code: 'RISK-MO-001',
    organization_id: 'gspu_audit_partners_org',
    smart_code: 'HERA.AUD.RISK.ENT.ASSESS.v1',
    status: 'identified',
    parent_id: 'eng_planning_001',
    metadata: {
      risk_category: 'Management Override',
      risk_level: 'high',
      inherent_risk: 'high',
      control_risk: 'high',
      detection_risk: 'low',
      fraud_risk: true,
      significant_risk: true,
      planned_procedures: 12,
      estimated_hours: 32,
      assigned_to: 'Partner Review',
      isa_reference: 'ISA 240',
      risk_description: 'Risk of management override of internal controls to commit fraud',
      planned_response: 'Journal entry testing, management estimates review, and significant transactions examination'
    }
  },
  {
    id: 'risk_003',
    entity_type: 'audit_risk',
    entity_name: 'IT General Controls Risk Assessment',
    entity_code: 'RISK-IT-001',
    organization_id: 'gspu_audit_partners_org',
    smart_code: 'HERA.AUD.RISK.ENT.ASSESS.v1',
    status: 'identified',
    parent_id: 'eng_planning_001',
    metadata: {
      risk_category: 'IT General Controls',
      risk_level: 'moderate',
      inherent_risk: 'moderate',
      control_risk: 'moderate',
      detection_risk: 'moderate',
      fraud_risk: false,
      significant_risk: false,
      planned_procedures: 6,
      estimated_hours: 28,
      assigned_to: 'IT Specialist',
      isa_reference: 'ISA 315',
      risk_description: 'Risk related to IT general controls affecting financial reporting systems',
      planned_response: 'IT controls testing, user access reviews, and change management procedures testing'
    }
  }
]

// Planning Areas/Work Programs
const planningAreas = [
  {
    id: 'area_001',
    entity_type: 'audit_work_program',
    entity_name: 'Risk Assessment Work Program',
    entity_code: 'WP-RISK-001',
    organization_id: 'gspu_audit_partners_org',
    smart_code: 'HERA.AUD.WP.ENT.PROGRAM.v1',
    status: 'completed',
    parent_id: 'eng_planning_001',
    metadata: {
      program_area: 'Risk Assessment',
      planned_hours: 24,
      actual_hours: 24,
      completion_percentage: 100,
      assigned_to: 'Senior Team',
      isa_reference: 'ISA 315, ISA 330',
      procedures_count: 15,
      completed_procedures: 15,
      review_status: 'partner_reviewed',
      reviewer: 'Michael Harrison'
    }
  },
  {
    id: 'area_002',
    entity_type: 'audit_work_program',
    entity_name: 'Analytical Review Work Program',
    entity_code: 'WP-ANAL-001',
    organization_id: 'gspu_audit_partners_org',
    smart_code: 'HERA.AUD.WP.ENT.PROGRAM.v1',
    status: 'in_progress',
    parent_id: 'eng_planning_001',
    metadata: {
      program_area: 'Analytical Review',
      planned_hours: 16,
      actual_hours: 12,
      completion_percentage: 75,
      assigned_to: 'Manager',
      isa_reference: 'ISA 520',
      procedures_count: 8,
      completed_procedures: 6,
      review_status: 'manager_review',
      reviewer: 'Sarah Chen'
    }
  }
]

// Planning Milestones
const planningMilestones = [
  {
    id: 'milestone_001',
    entity_type: 'audit_milestone',
    entity_name: 'Client Acceptance Milestone',
    entity_code: 'MS-ACC-001',
    organization_id: 'gspu_audit_partners_org',
    smart_code: 'HERA.AUD.MS.ENT.TRACK.v1',
    status: 'completed',
    parent_id: 'eng_planning_001',
    metadata: {
      milestone_phase: 'Client Acceptance',
      planned_date: '2025-01-15',
      actual_date: '2025-01-15',
      responsible_person: 'Partner',
      responsible_name: 'Michael Harrison',
      deliverables: ['Engagement Letter', 'Independence Confirmation', 'Client Acceptance Form'],
      completion_percentage: 100,
      quality_review: true,
      reviewer: 'Quality Control Partner'
    }
  },
  {
    id: 'milestone_002',
    entity_type: 'audit_milestone',
    entity_name: 'Planning Memorandum Milestone',
    entity_code: 'MS-PLAN-001',
    organization_id: 'gspu_audit_partners_org',
    smart_code: 'HERA.AUD.MS.ENT.TRACK.v1',
    status: 'in_progress',
    parent_id: 'eng_planning_001',
    metadata: {
      milestone_phase: 'Planning Memorandum',
      planned_date: '2025-02-01',
      actual_date: null,
      responsible_person: 'Manager',
      responsible_name: 'Sarah Chen',
      deliverables: ['Planning Memorandum', 'Materiality Calculation', 'Risk Assessment Summary'],
      completion_percentage: 60,
      quality_review: false,
      reviewer: null
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const engagementId = searchParams.get('engagementId') || 'eng_planning_001'
    const organizationId = searchParams.get('organizationId') || 'gspu_audit_partners_org'

    if (action === 'get_planning_overview') {
      // Get complete planning overview for an engagement
      const planningEntity = auditPlanningEntities.find(e => 
        e.id === engagementId && e.organization_id === organizationId
      )
      
      if (!planningEntity) {
        return NextResponse.json({
          success: false,
          message: 'Planning engagement not found'
        }, { status: 404 })
      }

      // Get related risk assessments
      const risks = riskAssessmentEntities.filter(r => r.parent_id === engagementId)
      
      // Get planning areas/work programs
      const workPrograms = planningAreas.filter(wp => wp.parent_id === engagementId)
      
      // Get milestones
      const milestones = planningMilestones.filter(ms => ms.parent_id === engagementId)

      return NextResponse.json({
        success: true,
        data: {
          engagement: planningEntity,
          risk_assessments: risks,
          work_programs: workPrograms,
          milestones: milestones,
          summary: {
            total_risks: risks.length,
            high_risks: risks.filter(r => r.metadata.risk_level === 'high').length,
            significant_risks: risks.filter(r => r.metadata.significant_risk).length,
            total_planned_hours: workPrograms.reduce((sum, wp) => sum + wp.metadata.planned_hours, 0),
            avg_completion: Math.round(workPrograms.reduce((sum, wp) => sum + wp.metadata.completion_percentage, 0) / workPrograms.length),
            completed_milestones: milestones.filter(ms => ms.status === 'completed').length,
            total_milestones: milestones.length
          }
        }
      })
    }

    if (action === 'get_risk_matrix') {
      // Professional risk assessment matrix
      const risks = riskAssessmentEntities.filter(r => r.parent_id === engagementId)
      
      const riskMatrix = {
        high_high: risks.filter(r => r.metadata.inherent_risk === 'high' && r.metadata.control_risk === 'high').length,
        high_moderate: risks.filter(r => r.metadata.inherent_risk === 'high' && r.metadata.control_risk === 'moderate').length,
        high_low: risks.filter(r => r.metadata.inherent_risk === 'high' && r.metadata.control_risk === 'low').length,
        moderate_high: risks.filter(r => r.metadata.inherent_risk === 'moderate' && r.metadata.control_risk === 'high').length,
        moderate_moderate: risks.filter(r => r.metadata.inherent_risk === 'moderate' && r.metadata.control_risk === 'moderate').length,
        moderate_low: risks.filter(r => r.metadata.inherent_risk === 'moderate' && r.metadata.control_risk === 'low').length,
        low_high: risks.filter(r => r.metadata.inherent_risk === 'low' && r.metadata.control_risk === 'high').length,
        low_moderate: risks.filter(r => r.metadata.inherent_risk === 'low' && r.metadata.control_risk === 'moderate').length,
        low_low: risks.filter(r => r.metadata.inherent_risk === 'low' && r.metadata.control_risk === 'low').length
      }

      return NextResponse.json({
        success: true,
        data: {
          risk_matrix: riskMatrix,
          risks: risks,
          total_risks: risks.length,
          fraud_risks: risks.filter(r => r.metadata.fraud_risk).length,
          significant_risks: risks.filter(r => r.metadata.significant_risk).length
        }
      })
    }

    if (action === 'get_materiality_calculation') {
      const planningEntity = auditPlanningEntities.find(e => e.id === engagementId)
      
      if (!planningEntity) {
        return NextResponse.json({
          success: false,
          message: 'Planning engagement not found'
        }, { status: 404 })
      }

      const materialityCalc = {
        basis: planningEntity.metadata.materiality_basis,
        base_amount: planningEntity.metadata.client_revenue,
        percentage: planningEntity.metadata.materiality_percentage,
        overall_materiality: planningEntity.metadata.materiality,
        performance_materiality: planningEntity.metadata.performance_materiality,
        performance_percentage: 75, // Standard 75%
        trivial_threshold: planningEntity.metadata.trivial_threshold,
        trivial_percentage: 5, // Standard 5%
        calculation_method: 'ISA 320 compliant',
        benchmark_justification: 'Revenue selected as primary benchmark due to stable recurring business model'
      }

      return NextResponse.json({
        success: true,
        data: materialityCalc
      })
    }

    // Default: return planning summary
    const planning = auditPlanningEntities.find(e => e.organization_id === organizationId)
    
    return NextResponse.json({
      success: true,
      data: {
        engagements: auditPlanningEntities.filter(e => e.organization_id === organizationId),
        active_planning: planning,
        summary: {
          total_engagements: auditPlanningEntities.length,
          in_planning: auditPlanningEntities.filter(e => e.status === 'in_progress').length,
          completed_planning: auditPlanningEntities.filter(e => e.status === 'completed').length,
          total_budget: auditPlanningEntities.reduce((sum, e) => sum + e.metadata.budget, 0),
          total_hours: auditPlanningEntities.reduce((sum, e) => sum + e.metadata.planned_hours, 0)
        }
      }
    })

  } catch (error) {
    console.error('Error in audit planning API:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch planning data'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'create_planning_engagement') {
      // Create new audit planning engagement using universal schema
      const newPlanning = {
        id: `eng_planning_${Date.now()}`,
        entity_type: 'audit_planning',
        entity_name: `${data.client_name} - ${data.audit_year} Audit Planning`,
        entity_code: data.engagement_code || `PLAN-${data.audit_year}-${Math.floor(Math.random() * 1000)}`,
        organization_id: data.organization_id || 'gspu_audit_partners_org',
        smart_code: 'HERA.AUD.PLAN.ENT.MASTER.v1',
        status: 'draft',
        created_date: new Date().toISOString(),
        metadata: {
          client_id: data.client_id,
          client_name: data.client_name,
          engagement_partner: data.engagement_partner,
          audit_manager: data.audit_manager,
          year_end: data.year_end,
          audit_year: data.audit_year,
          industry: data.industry,
          risk_rating: data.risk_rating || 'moderate',
          planned_hours: data.planned_hours || 0,
          budget: data.budget || 0,
          materiality: data.materiality || 0,
          performance_materiality: Math.round(data.materiality * 0.75) || 0,
          trivial_threshold: Math.round(data.materiality * 0.05) || 0,
          client_revenue: data.client_revenue || 0,
          materiality_basis: data.materiality_basis || 'revenue',
          materiality_percentage: data.materiality_percentage || 1.0,
          completion_percentage: 0
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Planning engagement created successfully',
        data: newPlanning
      })
    }

    if (action === 'update_planning_progress') {
      // Update planning progress
      const { engagement_id, completion_percentage, updated_areas } = data
      
      // In a real implementation, this would update the universal database
      const updatedEngagement = {
        id: engagement_id,
        completion_percentage: completion_percentage,
        updated_areas: updated_areas,
        last_updated: new Date().toISOString(),
        updated_by: data.updated_by || 'Current User'
      }

      return NextResponse.json({
        success: true,
        message: 'Planning progress updated successfully',
        data: updatedEngagement
      })
    }

    if (action === 'add_risk_assessment') {
      // Add new risk assessment
      const newRisk = {
        id: `risk_${Date.now()}`,
        entity_type: 'audit_risk',
        entity_name: `${data.risk_category} Risk Assessment`,
        entity_code: `RISK-${data.risk_category.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
        organization_id: data.organization_id || 'gspu_audit_partners_org',
        smart_code: 'HERA.AUD.RISK.ENT.ASSESS.v1',
        status: 'identified',
        parent_id: data.engagement_id,
        created_date: new Date().toISOString(),
        metadata: {
          risk_category: data.risk_category,
          risk_level: data.risk_level,
          inherent_risk: data.inherent_risk,
          control_risk: data.control_risk,
          detection_risk: data.detection_risk,
          fraud_risk: data.fraud_risk || false,
          significant_risk: data.significant_risk || false,
          planned_procedures: data.planned_procedures || 0,
          estimated_hours: data.estimated_hours || 0,
          assigned_to: data.assigned_to,
          risk_description: data.risk_description,
          planned_response: data.planned_response,
          isa_reference: data.isa_reference || ''
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Risk assessment added successfully',
        data: newRisk
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action specified'
    }, { status: 400 })

  } catch (error) {
    console.error('Error in planning POST:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to process planning request'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { engagement_id, updates } = body

    // Update planning engagement using universal schema
    const updatedPlanning = {
      id: engagement_id,
      last_updated: new Date().toISOString(),
      updated_by: updates.updated_by || 'Current User',
      ...updates
    }

    return NextResponse.json({
      success: true,
      message: 'Planning engagement updated successfully',
      data: updatedPlanning
    })

  } catch (error) {
    console.error('Error updating planning:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update planning engagement'
    }, { status: 500 })
  }
}