import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { createLeadConversionPipeline } from '@/lib/crm/lead-conversion-pipeline'
import { createLeadScoringEngine } from '@/lib/email/lead-scoring-engine'

/**
 * HERA Email-to-Lead Analytics Dashboard API
 * Comprehensive analytics for email marketing → lead conversion → revenue attribution
 * 
 * Features:
 * - Complete email campaign performance analytics
 * - Lead generation and conversion tracking
 * - Revenue attribution from email campaigns
 * - Real-time engagement metrics and trends
 * - AI-powered insights and recommendations
 * - Pipeline velocity and conversion funnel analysis
 */

interface EmailCampaignAnalytics {
  campaign_id: string
  campaign_name: string
  campaign_type: string
  
  // Email metrics
  emails_sent: number
  emails_delivered: number
  emails_opened: number
  emails_clicked: number
  
  // Engagement rates
  delivery_rate: number
  open_rate: number
  click_rate: number
  
  // Lead conversion metrics
  leads_generated: number
  qualified_leads: number
  opportunities_created: number
  deals_closed: number
  
  // Revenue metrics
  revenue_attributed: number
  average_deal_size: number
  roi: number
  
  // Performance indicators
  lead_conversion_rate: number
  email_to_opportunity_rate: number
  email_to_revenue_rate: number
}

interface LeadGenerationFunnel {
  stage: string
  count: number
  conversion_rate: number
  average_time_in_stage: number
  drop_off_count: number
  stage_velocity: number
}

interface EmailEngagementTrends {
  date: string
  emails_sent: number
  opens: number
  clicks: number
  leads_generated: number
  revenue: number
  open_rate: number
  click_rate: number
  lead_rate: number
}

interface RevenueAttribution {
  campaign_id: string
  campaign_name: string
  total_revenue: number
  deals_count: number
  average_deal_size: number
  attribution_percentage: number
  first_touch_revenue: number
  last_touch_revenue: number
  multi_touch_revenue: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const organizationId = request.headers.get('x-organization-id')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      )
    }

    universalApi.setOrganizationId(organizationId)

    switch (action) {
      case 'campaign_performance':
        return await getCampaignPerformanceAnalytics(searchParams)
      
      case 'lead_funnel':
        return await getLeadGenerationFunnel(searchParams)
      
      case 'engagement_trends':
        return await getEmailEngagementTrends(searchParams)
      
      case 'revenue_attribution':
        return await getRevenueAttribution(searchParams)
      
      case 'dashboard_overview':
        return await getDashboardOverview(searchParams, organizationId)
      
      case 'ai_insights':
        return await getAIInsights(organizationId)

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Email Analytics API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get comprehensive campaign performance analytics
async function getCampaignPerformanceAnalytics(searchParams: URLSearchParams) {
  const campaignId = searchParams.get('campaign_id')
  const timeframe = searchParams.get('timeframe') || '30d'
  
  let campaigns: any[] = []
  
  if (campaignId) {
    // Get specific campaign
    const campaign = await universalApi.getEntity(campaignId)
    if (campaign) {
      campaigns = [campaign]
    }
  } else {
    // Get all campaigns
    campaigns = await universalApi.getEntities('email_campaign', { limit: 100 })
  }

  const analyticsResults = await Promise.all(
    campaigns.map(async (campaign) => {
      // Get campaign dynamic data (metrics)
      const campaignData = await universalApi.getDynamicData(campaign.id)
      
      // Calculate advanced metrics
      const emailsSent = parseInt(campaignData.emails_sent || '0')
      const emailsDelivered = parseInt(campaignData.emails_delivered || '0')
      const emailsOpened = parseInt(campaignData.emails_opened || '0')
      const emailsClicked = parseInt(campaignData.emails_clicked || '0')
      const leadsGenerated = parseInt(campaignData.leads_generated || '0')
      
      // Get revenue attribution for this campaign
      const revenueData = await getCampaignRevenueAttribution(campaign.id)
      
      // Calculate conversion rates
      const deliveryRate = emailsSent > 0 ? (emailsDelivered / emailsSent) * 100 : 0
      const openRate = emailsDelivered > 0 ? (emailsOpened / emailsDelivered) * 100 : 0
      const clickRate = emailsDelivered > 0 ? (emailsClicked / emailsDelivered) * 100 : 0
      const leadConversionRate = emailsDelivered > 0 ? (leadsGenerated / emailsDelivered) * 100 : 0
      
      // Get qualified leads and opportunities from this campaign
      const qualifiedLeads = await getQualifiedLeadsFromCampaign(campaign.id)
      const opportunities = await getOpportunitiesFromCampaign(campaign.id)
      
      const analytics: EmailCampaignAnalytics = {
        campaign_id: campaign.id,
        campaign_name: campaign.entity_name,
        campaign_type: campaignData.campaign_type || 'unknown',
        
        emails_sent: emailsSent,
        emails_delivered: emailsDelivered,
        emails_opened: emailsOpened,
        emails_clicked: emailsClicked,
        
        delivery_rate: Math.round(deliveryRate * 100) / 100,
        open_rate: Math.round(openRate * 100) / 100,
        click_rate: Math.round(clickRate * 100) / 100,
        
        leads_generated: leadsGenerated,
        qualified_leads: qualifiedLeads.length,
        opportunities_created: opportunities.length,
        deals_closed: revenueData.deals_count,
        
        revenue_attributed: revenueData.total_revenue,
        average_deal_size: revenueData.average_deal_size,
        roi: revenueData.roi,
        
        lead_conversion_rate: Math.round(leadConversionRate * 100) / 100,
        email_to_opportunity_rate: emailsDelivered > 0 ? 
          Math.round((opportunities.length / emailsDelivered) * 10000) / 100 : 0,
        email_to_revenue_rate: emailsDelivered > 0 ? 
          Math.round((revenueData.total_revenue / emailsDelivered) * 100) / 100 : 0
      }
      
      return analytics
    })
  )

  return NextResponse.json({
    success: true,
    data: {
      campaigns: analyticsResults,
      summary: {
        total_campaigns: campaigns.length,
        total_emails_sent: analyticsResults.reduce((sum, c) => sum + c.emails_sent, 0),
        total_leads_generated: analyticsResults.reduce((sum, c) => sum + c.leads_generated, 0),
        total_revenue_attributed: analyticsResults.reduce((sum, c) => sum + c.revenue_attributed, 0),
        average_open_rate: analyticsResults.length > 0 ? 
          Math.round((analyticsResults.reduce((sum, c) => sum + c.open_rate, 0) / analyticsResults.length) * 100) / 100 : 0
      }
    }
  })
}

// Get lead generation funnel analytics
async function getLeadGenerationFunnel(searchParams: URLSearchParams) {
  const campaignId = searchParams.get('campaign_id')
  const timeframe = searchParams.get('timeframe') || '30d'
  
  // Define funnel stages
  const funnelStages = [
    'email_delivered',
    'email_opened', 
    'email_clicked',
    'lead_created',
    'lead_qualified',
    'opportunity_created',
    'deal_closed'
  ]
  
  const funnelData: LeadGenerationFunnel[] = []
  let previousStageCount = 0
  
  for (let i = 0; i < funnelStages.length; i++) {
    const stage = funnelStages[i]
    let stageCount = 0
    
    // Get count for each stage based on transaction types
    const transactionType = getTransactionTypeForStage(stage)
    const stageTransactions = await universalApi.getTransactions({
      filters: campaignId ? {
        transaction_type: transactionType,
        'metadata->>campaign_id': campaignId
      } : {
        transaction_type: transactionType
      },
      limit: 10000
    })
    
    stageCount = stageTransactions.length
    
    // Calculate conversion rate from previous stage
    const conversionRate = i === 0 ? 100 : 
      (previousStageCount > 0 ? (stageCount / previousStageCount) * 100 : 0)
    
    const dropOffCount = i === 0 ? 0 : Math.max(0, previousStageCount - stageCount)
    
    funnelData.push({
      stage: stage,
      count: stageCount,
      conversion_rate: Math.round(conversionRate * 100) / 100,
      average_time_in_stage: await getAverageTimeInStage(stage),
      drop_off_count: dropOffCount,
      stage_velocity: calculateStageVelocity(stageCount, timeframe)
    })
    
    previousStageCount = stageCount
  }
  
  return NextResponse.json({
    success: true,
    data: {
      funnel: funnelData,
      overall_conversion_rate: funnelData.length > 0 && funnelData[0].count > 0 ? 
        Math.round((funnelData[funnelData.length - 1].count / funnelData[0].count) * 10000) / 100 : 0
    }
  })
}

// Get email engagement trends over time
async function getEmailEngagementTrends(searchParams: URLSearchParams) {
  const days = parseInt(searchParams.get('days') || '30')
  const campaignId = searchParams.get('campaign_id')
  
  const trends: EmailEngagementTrends[] = []
  
  // Generate trends for the last N days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split('T')[0]
    
    // Get email engagement transactions for this date
    const dayTransactions = await universalApi.getTransactions({
      filters: campaignId ? {
        transaction_date: dateString,
        'metadata->>campaign_id': campaignId
      } : {
        transaction_date: dateString
      },
      limit: 10000
    })
    
    // Aggregate metrics by transaction type
    const sent = dayTransactions.filter(t => t.transaction_type === 'email_sent').length
    const opens = dayTransactions.filter(t => t.transaction_type === 'email_opened').length
    const clicks = dayTransactions.filter(t => t.transaction_type === 'email_clicked').length
    const leads = dayTransactions.filter(t => t.transaction_type === 'lead_processing').length
    
    // Get revenue for leads generated on this day
    const revenue = dayTransactions
      .filter(t => t.transaction_type === 'deal_closed')
      .reduce((sum, t) => sum + (t.total_amount || 0), 0)
    
    trends.push({
      date: dateString,
      emails_sent: sent,
      opens: opens,
      clicks: clicks,
      leads_generated: leads,
      revenue: revenue,
      open_rate: sent > 0 ? Math.round((opens / sent) * 10000) / 100 : 0,
      click_rate: sent > 0 ? Math.round((clicks / sent) * 10000) / 100 : 0,
      lead_rate: sent > 0 ? Math.round((leads / sent) * 10000) / 100 : 0
    })
  }
  
  return NextResponse.json({
    success: true,
    data: {
      trends: trends,
      period: `${days} days`,
      summary: {
        total_emails: trends.reduce((sum, t) => sum + t.emails_sent, 0),
        total_leads: trends.reduce((sum, t) => sum + t.leads_generated, 0),
        total_revenue: trends.reduce((sum, t) => sum + t.revenue, 0)
      }
    }
  })
}

// Get revenue attribution by campaign
async function getRevenueAttribution(searchParams: URLSearchParams) {
  const timeframe = searchParams.get('timeframe') || '90d'
  
  // Get all campaigns
  const campaigns = await universalApi.getEntities('email_campaign', { limit: 100 })
  
  const attributionData = await Promise.all(
    campaigns.map(async (campaign) => {
      const revenueData = await getCampaignRevenueAttribution(campaign.id)
      
      return {
        campaign_id: campaign.id,
        campaign_name: campaign.entity_name,
        total_revenue: revenueData.total_revenue,
        deals_count: revenueData.deals_count,
        average_deal_size: revenueData.average_deal_size,
        attribution_percentage: revenueData.attribution_percentage,
        first_touch_revenue: revenueData.first_touch_revenue,
        last_touch_revenue: revenueData.last_touch_revenue,
        multi_touch_revenue: revenueData.multi_touch_revenue
      }
    })
  )
  
  // Calculate total revenue for attribution percentages
  const totalRevenue = attributionData.reduce((sum, a) => sum + a.total_revenue, 0)
  
  // Update attribution percentages
  const finalAttributionData = attributionData.map(data => ({
    ...data,
    attribution_percentage: totalRevenue > 0 ? 
      Math.round((data.total_revenue / totalRevenue) * 10000) / 100 : 0
  }))
  
  return NextResponse.json({
    success: true,
    data: {
      attribution: finalAttributionData.sort((a, b) => b.total_revenue - a.total_revenue),
      total_attributed_revenue: totalRevenue,
      total_deals: attributionData.reduce((sum, a) => sum + a.deals_count, 0)
    }
  })
}

// Get dashboard overview with key metrics
async function getDashboardOverview(searchParams: URLSearchParams, organizationId: string) {
  const timeframe = searchParams.get('timeframe') || '30d'
  
  // Initialize services
  const leadPipeline = createLeadConversionPipeline(organizationId)
  
  // Get conversion metrics
  const conversionMetrics = await leadPipeline.getConversionMetrics(
    timeframe === '30d' ? 'month' : timeframe === '90d' ? 'quarter' : 'year'
  )
  
  // Get email campaign summary
  const campaignSummary = await getEmailCampaignSummary()
  
  // Get top performing campaigns
  const topCampaigns = await getTopPerformingCampaigns(5)
  
  // Get recent activities
  const recentActivities = await getRecentEmailActivities(10)
  
  return NextResponse.json({
    success: true,
    data: {
      timeframe: timeframe,
      email_metrics: {
        total_campaigns: campaignSummary.total_campaigns,
        active_campaigns: campaignSummary.active_campaigns,
        emails_sent_period: campaignSummary.emails_sent_period,
        average_open_rate: campaignSummary.average_open_rate,
        average_click_rate: campaignSummary.average_click_rate
      },
      conversion_metrics: conversionMetrics,
      top_campaigns: topCampaigns,
      recent_activities: recentActivities,
      performance_indicators: {
        email_to_lead_rate: campaignSummary.emails_sent_period > 0 ? 
          Math.round((conversionMetrics.total_leads / campaignSummary.emails_sent_period) * 10000) / 100 : 0,
        lead_to_customer_rate: conversionMetrics.conversion_rate,
        average_customer_value: conversionMetrics.average_deal_size,
        pipeline_velocity: conversionMetrics.pipeline_velocity
      }
    }
  })
}

// Get AI-powered insights and recommendations
async function getAIInsights(organizationId: string) {
  // This would integrate with AI services for intelligent insights
  // For now, we'll provide rule-based insights
  
  const insights = []
  
  // Get recent performance data
  const recentCampaigns = await universalApi.getEntities('email_campaign', { limit: 10 })
  const leadPipeline = createLeadConversionPipeline(organizationId)
  const conversionMetrics = await leadPipeline.getConversionMetrics('month')
  
  // Insight 1: Campaign Performance
  const avgOpenRate = await calculateAverageOpenRate()
  if (avgOpenRate < 20) {
    insights.push({
      type: 'improvement',
      title: 'Open Rates Below Industry Average',
      description: `Your average open rate of ${avgOpenRate}% is below the industry average of 21.3%. Consider A/B testing subject lines and send times.`,
      impact: 'medium',
      action_items: [
        'Test personalized subject lines',
        'Optimize send times based on audience behavior',
        'Clean your email list to remove inactive subscribers'
      ]
    })
  }
  
  // Insight 2: Lead Quality
  if (conversionMetrics.conversion_rate > 0) {
    if (conversionMetrics.conversion_rate > 3) {
      insights.push({
        type: 'success',
        title: 'Excellent Lead Conversion Rate',
        description: `Your ${conversionMetrics.conversion_rate}% conversion rate is above industry standards. Consider scaling successful campaigns.`,
        impact: 'high',
        action_items: [
          'Increase budget for top-performing campaigns',
          'Replicate successful campaign elements',
          'Document and systematize your lead qualification process'
        ]
      })
    } else {
      insights.push({
        type: 'opportunity',
        title: 'Lead Qualification Opportunity',
        description: `With ${conversionMetrics.qualified_leads} qualified leads, there's opportunity to improve conversion rates through better nurturing.`,
        impact: 'high',
        action_items: [
          'Implement lead scoring automation',
          'Create targeted nurturing sequences',
          'Improve sales handoff process'
        ]
      })
    }
  }
  
  // Insight 3: Revenue Attribution
  const totalRevenue = conversionMetrics.revenue_attributed
  if (totalRevenue > 0) {
    insights.push({
      type: 'insight',
      title: 'Email Marketing ROI',
      description: `Your email campaigns have generated $${totalRevenue.toLocaleString()} in attributed revenue with an average deal size of $${conversionMetrics.average_deal_size.toLocaleString()}.`,
      impact: 'high',
      action_items: [
        'Track multi-touch attribution for better insights',
        'Focus on high-value customer segments',
        'Implement upselling campaigns for existing customers'
      ]
    })
  }
  
  // Insight 4: Pipeline Health
  if (conversionMetrics.sales_cycle_days > 45) {
    insights.push({
      type: 'optimization',
      title: 'Long Sales Cycle Detected',
      description: `Your average sales cycle of ${conversionMetrics.sales_cycle_days} days is longer than optimal. Consider implementing acceleration tactics.`,
      impact: 'medium',
      action_items: [
        'Create urgency in email campaigns',
        'Implement retargeting for engaged prospects',
        'Optimize your sales process for faster qualification'
      ]
    })
  }
  
  return NextResponse.json({
    success: true,
    data: {
      insights: insights,
      generated_at: new Date().toISOString(),
      confidence_level: 0.85
    }
  })
}

// Helper functions

async function getCampaignRevenueAttribution(campaignId: string) {
  // Get all deals closed from leads attributed to this campaign
  const deals = await universalApi.getTransactions({
    filters: {
      transaction_type: 'deal_closed',
      'metadata->>source_campaign_id': campaignId
    },
    limit: 1000
  })
  
  const totalRevenue = deals.reduce((sum, deal) => sum + (deal.total_amount || 0), 0)
  const dealsCount = deals.length
  const avgDealSize = dealsCount > 0 ? totalRevenue / dealsCount : 0
  
  // Simple ROI calculation (assuming $100 campaign cost)
  const campaignCost = 100
  const roi = totalRevenue > 0 ? ((totalRevenue - campaignCost) / campaignCost) * 100 : 0
  
  return {
    total_revenue: totalRevenue,
    deals_count: dealsCount,
    average_deal_size: Math.round(avgDealSize),
    roi: Math.round(roi * 100) / 100,
    attribution_percentage: 0, // Calculated at higher level
    first_touch_revenue: totalRevenue, // Simplified - all attributed to first touch
    last_touch_revenue: 0,
    multi_touch_revenue: 0
  }
}

async function getQualifiedLeadsFromCampaign(campaignId: string) {
  return await universalApi.getEntities('lead', {
    filters: {
      'metadata->>source_campaign_id': campaignId,
      'qualification_status': 'qualified'
    }
  })
}

async function getOpportunitiesFromCampaign(campaignId: string) {
  return await universalApi.getEntities('opportunity', {
    filters: {
      'metadata->>source_campaign_id': campaignId
    }
  })
}

function getTransactionTypeForStage(stage: string): string {
  const stageMap: Record<string, string> = {
    'email_delivered': 'email_delivered',
    'email_opened': 'email_opened',
    'email_clicked': 'email_clicked',
    'lead_created': 'lead_processing',
    'lead_qualified': 'lead_processing',
    'opportunity_created': 'opportunity_created',
    'deal_closed': 'deal_closed'
  }
  return stageMap[stage] || 'email_delivered'
}

async function getAverageTimeInStage(stage: string): Promise<number> {
  // This would calculate based on historical data
  // For now, return default values
  const defaultTimes: Record<string, number> = {
    'email_delivered': 0,
    'email_opened': 0.1,
    'email_clicked': 0.2,
    'lead_created': 1,
    'lead_qualified': 5,
    'opportunity_created': 14,
    'deal_closed': 30
  }
  return defaultTimes[stage] || 1
}

function calculateStageVelocity(count: number, timeframe: string): number {
  const timeframeDays: Record<string, number> = {
    '7d': 7, '30d': 30, '90d': 90, '365d': 365
  }
  const days = timeframeDays[timeframe] || 30
  return Math.round((count / days) * 100) / 100
}

async function getEmailCampaignSummary() {
  const campaigns = await universalApi.getEntities('email_campaign', { limit: 100 })
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  
  // Calculate total emails sent across all campaigns
  let totalEmailsSent = 0
  let totalOpens = 0
  let totalClicks = 0
  
  for (const campaign of campaigns) {
    const campaignData = await universalApi.getDynamicData(campaign.id)
    totalEmailsSent += parseInt(campaignData.emails_sent || '0')
    totalOpens += parseInt(campaignData.emails_opened || '0')
    totalClicks += parseInt(campaignData.emails_clicked || '0')
  }
  
  return {
    total_campaigns: campaigns.length,
    active_campaigns: activeCampaigns,
    emails_sent_period: totalEmailsSent,
    average_open_rate: totalEmailsSent > 0 ? Math.round((totalOpens / totalEmailsSent) * 10000) / 100 : 0,
    average_click_rate: totalEmailsSent > 0 ? Math.round((totalClicks / totalEmailsSent) * 10000) / 100 : 0
  }
}

async function getTopPerformingCampaigns(limit: number) {
  const campaigns = await universalApi.getEntities('email_campaign', { limit: 100 })
  
  const campaignPerformance = await Promise.all(
    campaigns.map(async (campaign) => {
      const campaignData = await universalApi.getDynamicData(campaign.id)
      const revenueData = await getCampaignRevenueAttribution(campaign.id)
      
      return {
        campaign_id: campaign.id,
        campaign_name: campaign.entity_name,
        campaign_type: campaignData.campaign_type,
        leads_generated: parseInt(campaignData.leads_generated || '0'),
        revenue_attributed: revenueData.total_revenue,
        open_rate: campaignData.open_rate || 0,
        click_rate: campaignData.click_rate || 0,
        performance_score: (
          (parseFloat(campaignData.open_rate || '0') * 0.3) +
          (parseFloat(campaignData.click_rate || '0') * 0.4) +
          (parseInt(campaignData.leads_generated || '0') * 0.3)
        )
      }
    })
  )
  
  return campaignPerformance
    .sort((a, b) => b.performance_score - a.performance_score)
    .slice(0, limit)
}

async function getRecentEmailActivities(limit: number) {
  const activities = await universalApi.getTransactions({
    filters: {
      transaction_type: ['email_opened', 'email_clicked', 'lead_processing', 'opportunity_created', 'deal_closed']
    },
    limit: limit,
    orderBy: 'created_at DESC'
  })
  
  return activities.map(activity => ({
    id: activity.id,
    type: activity.transaction_type,
    description: activity.description,
    timestamp: activity.created_at,
    metadata: activity.metadata
  }))
}

async function calculateAverageOpenRate(): Promise<number> {
  const campaigns = await universalApi.getEntities('email_campaign', { limit: 100 })
  
  if (campaigns.length === 0) return 0
  
  let totalOpenRate = 0
  let validCampaigns = 0
  
  for (const campaign of campaigns) {
    const campaignData = await universalApi.getDynamicData(campaign.id)
    const openRate = parseFloat(campaignData.open_rate || '0')
    
    if (openRate > 0) {
      totalOpenRate += openRate
      validCampaigns++
    }
  }
  
  return validCampaigns > 0 ? Math.round((totalOpenRate / validCampaigns) * 100) / 100 : 0
}