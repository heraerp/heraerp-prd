import { NextRequest, NextResponse } from 'next/server'

/**
 * Warm Leads API - Extract emails from progressive authentication for CRM
 * These are users who provided email but haven't fully registered yet
 */

// Mock database for demo - in production this would connect to your CRM system
let warmLeadsDB: WarmLead[] = []

interface WarmLead {
  id: string
  email: string
  workspace_id: string
  organization_id: string
  organization_name: string
  created_at: string
  identified_at: string
  modules_used: string[]
  interactions_count: number
  data_size: number
  last_activity: string
  lead_score: number
  lead_status: 'new' | 'contacted' | 'qualified' | 'converted' | 'cold'
  contact_attempts: number
  notes: string[]
  source: 'financial' | 'crm' | 'inventory' | 'jewelry' | 'restaurant' | 'healthcare' | 'other'
  engagement_level: 'low' | 'medium' | 'high'
  conversion_probability: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const minScore = searchParams.get('min_score')

    switch (action) {
      case 'list':
        let filteredLeads = [...warmLeadsDB]
        
        // Apply filters
        if (status) {
          filteredLeads = filteredLeads.filter(lead => lead.lead_status === status)
        }
        if (source) {
          filteredLeads = filteredLeads.filter(lead => lead.source === source)
        }
        if (minScore) {
          filteredLeads = filteredLeads.filter(lead => lead.lead_score >= parseInt(minScore))
        }
        
        // Sort by lead score descending
        filteredLeads.sort((a, b) => b.lead_score - a.lead_score)
        
        return NextResponse.json({
          success: true,
          data: filteredLeads,
          total: filteredLeads.length,
          filters_applied: { status, source, minScore }
        })

      case 'stats':
        const stats = {
          total_warm_leads: warmLeadsDB.length,
          new_leads: warmLeadsDB.filter(l => l.lead_status === 'new').length,
          qualified_leads: warmLeadsDB.filter(l => l.lead_status === 'qualified').length,
          high_engagement: warmLeadsDB.filter(l => l.engagement_level === 'high').length,
          conversion_ready: warmLeadsDB.filter(l => l.conversion_probability > 70).length,
          by_source: {
            financial: warmLeadsDB.filter(l => l.source === 'financial').length,
            crm: warmLeadsDB.filter(l => l.source === 'crm').length,
            inventory: warmLeadsDB.filter(l => l.source === 'inventory').length,
            jewelry: warmLeadsDB.filter(l => l.source === 'jewelry').length,
            restaurant: warmLeadsDB.filter(l => l.source === 'restaurant').length,
            healthcare: warmLeadsDB.filter(l => l.source === 'healthcare').length,
            other: warmLeadsDB.filter(l => l.source === 'other').length
          },
          average_lead_score: warmLeadsDB.reduce((sum, lead) => sum + lead.lead_score, 0) / warmLeadsDB.length || 0,
          last_updated: new Date().toISOString()
        }
        
        return NextResponse.json({
          success: true,
          data: stats
        })

      case 'export':
        // Export leads for email marketing
        const exportData = warmLeadsDB.map(lead => ({
          email: lead.email,
          first_name: lead.email.split('@')[0],
          company: lead.organization_name,
          lead_score: lead.lead_score,
          modules_used: lead.modules_used.join(', '),
          last_activity: lead.last_activity,
          engagement_level: lead.engagement_level,
          source: lead.source
        }))
        
        return NextResponse.json({
          success: true,
          data: exportData,
          format: 'email_marketing',
          total_emails: exportData.length
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: list, stats, or export'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Warm leads API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'add_lead':
        const leadData = body.data as Partial<WarmLead>
        
        // Calculate engagement level and lead score
        const engagementLevel = calculateEngagementLevel(leadData.interactions_count || 0, leadData.modules_used?.length || 0)
        const leadScore = calculateLeadScore(leadData)
        const conversionProbability = calculateConversionProbability(leadData)
        
        const newLead: WarmLead = {
          id: `lead-${Date.now()}`,
          email: leadData.email!,
          workspace_id: leadData.workspace_id!,
          organization_id: leadData.organization_id!,
          organization_name: leadData.organization_name || leadData.organization_id!,
          created_at: new Date().toISOString(),
          identified_at: leadData.identified_at || new Date().toISOString(),
          modules_used: leadData.modules_used || [],
          interactions_count: leadData.interactions_count || 0,
          data_size: leadData.data_size || 0,
          last_activity: leadData.last_activity || new Date().toISOString(),
          lead_score: leadScore,
          lead_status: 'new',
          contact_attempts: 0,
          notes: [],
          source: leadData.source || 'other',
          engagement_level: engagementLevel,
          conversion_probability: conversionProbability
        }
        
        // Check if lead already exists
        const existingLeadIndex = warmLeadsDB.findIndex(lead => lead.email === newLead.email)
        if (existingLeadIndex !== -1) {
          // Update existing lead with new data
          warmLeadsDB[existingLeadIndex] = {
            ...warmLeadsDB[existingLeadIndex],
            ...newLead,
            id: warmLeadsDB[existingLeadIndex].id, // Keep original ID
            created_at: warmLeadsDB[existingLeadIndex].created_at // Keep original creation date
          }
        } else {
          warmLeadsDB.push(newLead)
        }
        
        return NextResponse.json({
          success: true,
          data: newLead,
          message: existingLeadIndex !== -1 ? 'Lead updated' : 'Lead added'
        })

      case 'update_lead':
        const { id, updates } = body
        const leadIndex = warmLeadsDB.findIndex(lead => lead.id === id)
        
        if (leadIndex === -1) {
          return NextResponse.json({
            success: false,
            error: 'Lead not found'
          }, { status: 404 })
        }
        
        warmLeadsDB[leadIndex] = {
          ...warmLeadsDB[leadIndex],
          ...updates,
          last_activity: new Date().toISOString()
        }
        
        return NextResponse.json({
          success: true,
          data: warmLeadsDB[leadIndex]
        })

      case 'add_note':
        const { leadId, note } = body
        const noteLeadIndex = warmLeadsDB.findIndex(lead => lead.id === leadId)
        
        if (noteLeadIndex === -1) {
          return NextResponse.json({
            success: false,
            error: 'Lead not found'
          }, { status: 404 })
        }
        
        warmLeadsDB[noteLeadIndex].notes.push(`${new Date().toISOString()}: ${note}`)
        
        return NextResponse.json({
          success: true,
          message: 'Note added to lead'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Warm leads POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Helper functions for lead scoring
function calculateEngagementLevel(interactions: number, modules: number): 'low' | 'medium' | 'high' {
  const engagementScore = interactions + (modules * 10)
  
  if (engagementScore >= 50) return 'high'
  if (engagementScore >= 20) return 'medium'
  return 'low'
}

function calculateLeadScore(leadData: Partial<WarmLead>): number {
  let score = 0
  
  // Base score for providing email
  score += 20
  
  // Modules used (each module = 15 points)
  score += (leadData.modules_used?.length || 0) * 15
  
  // Interactions (each interaction = 2 points)
  score += (leadData.interactions_count || 0) * 2
  
  // Data size (larger data = more commitment)
  const dataSize = leadData.data_size || 0
  if (dataSize > 10000) score += 20
  else if (dataSize > 5000) score += 10
  else if (dataSize > 1000) score += 5
  
  // Source-based scoring
  const sourceScores: Record<string, number> = {
    financial: 25, // High-value business users
    crm: 20,
    inventory: 15,
    jewelry: 10,
    restaurant: 12,
    healthcare: 18,
    other: 5
  }
  score += sourceScores[leadData.source || 'other'] || 5
  
  // Recent activity bonus
  const lastActivity = new Date(leadData.last_activity || Date.now())
  const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceActivity <= 1) score += 15
  else if (daysSinceActivity <= 7) score += 10
  else if (daysSinceActivity <= 30) score += 5
  
  return Math.min(score, 100) // Cap at 100
}

function calculateConversionProbability(leadData: Partial<WarmLead>): number {
  const leadScore = calculateLeadScore(leadData)
  
  // Convert lead score to probability percentage
  let probability = leadScore * 0.8 // Base conversion
  
  // Boost for high-value modules
  if (leadData.modules_used?.includes('financial')) probability += 15
  if (leadData.modules_used?.includes('crm')) probability += 10
  
  // Boost for high interaction count
  if ((leadData.interactions_count || 0) > 50) probability += 10
  
  return Math.min(probability, 95) // Cap at 95%
}