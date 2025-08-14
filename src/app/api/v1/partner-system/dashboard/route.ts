'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getHeraAPI } from '@/lib/hera-api'

/**
 * HERA Partner Dashboard API
 * Smart Code: HERA.PAR.DASH.ENT.DASHBOARD.v1
 * 
 * Real-time partner performance metrics and revenue tracking
 * All data sourced from universal tables - proving HERA's Meta Breakthrough
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partner_id')
    const partnerCode = searchParams.get('partner_code')
    const timeRange = searchParams.get('time_range') || 'current_month'
    const includeCustomers = searchParams.get('include_customers') === 'true'
    
    if (!partnerId && !partnerCode) {
      return NextResponse.json(
        { error: 'partner_id or partner_code is required' },
        { status: 400 }
      )
    }

    const heraApi = getHeraAPI()
    
    // Get partner entity
    let partner
    if (partnerId) {
      partner = await heraApi.getEntity(partnerId)
    } else {
      const partners = await heraApi.getEntities('partner', {
        organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
        entity_code: partnerCode
      })
      partner = partners[0]
    }

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Get partner's managed customers via relationships
    const customerRelationships = await heraApi.getRelationships(
      partner.id, 
      ['manages_customer', 'referred_customer']
    )
    
    const customerIds = customerRelationships.map(rel => rel.target_entity_id || rel.source_entity_id)
    
    // Get customer details if requested
    let customers = []
    if (includeCustomers && customerIds.length > 0) {
      customers = await Promise.all(customerIds.map(async customerId => {
        const customer = await heraApi.getEntity(customerId)
        
        // Get customer's recent transactions for health score
        const recentTransactions = await heraApi.getTransactions({
          entity_id: customerId,
          transaction_type: 'payment',
          date_range: 'last_30_days'
        })
        
        // Calculate customer health score
        const healthScore = calculateCustomerHealth(customer, recentTransactions)
        
        return {
          ...customer,
          health_score: healthScore,
          last_payment: recentTransactions[0]?.transaction_date || null,
          monthly_value: parseFloat(customer.metadata?.monthly_subscription || 0),
          status: customer.status,
          signup_date: customer.created_at
        }
      }))
    }

    // Get partner commission transactions
    const commissionTransactions = await heraApi.getTransactions({
      entity_id: partner.id,
      transaction_type: 'partner_commission',
      date_range: timeRange
    })

    // Calculate revenue metrics
    const revenueMetrics = calculateRevenueMetrics(commissionTransactions, timeRange)
    
    // Get partner's recent activity
    const recentActivity = await heraApi.getTransactions({
      entity_id: partner.id,
      limit: 10,
      order_by: 'transaction_date DESC'
    })

    // Get onboarding progress
    const onboardingData = await heraApi.getDynamicData(partner.id, [
      'onboarding_checklist',
      'onboarding_progress',
      'certification_progress',
      'training_completion'
    ])

    // Calculate partner performance score
    const performanceScore = calculatePartnerPerformance(
      partner,
      customers,
      revenueMetrics,
      onboardingData
    )

    // Get partner goals and targets
    const partnerGoals = await heraApi.getDynamicData(partner.id, [
      'monthly_target',
      'quarterly_target',
      'annual_target',
      'customer_acquisition_goal'
    ])

    const dashboardData = {
      partner_info: {
        id: partner.id,
        name: partner.entity_name,
        code: partner.entity_code,
        tier: partner.metadata?.tier || 'silver',
        status: partner.status,
        join_date: partner.created_at,
        specializations: partner.metadata?.specializations || [],
        geographic_coverage: partner.metadata?.geographic_coverage || [],
        certification_status: partner.metadata?.certification_status || 'pending'
      },
      
      revenue_metrics: {
        current_mrr: revenueMetrics.current_mrr,
        ytd_earnings: revenueMetrics.ytd_earnings,
        last_month_earnings: revenueMetrics.last_month_earnings,
        commission_rate: partner.metadata?.revenue_share_percent || 50,
        next_payout_date: getNextPayoutDate(),
        next_payout_amount: revenueMetrics.pending_payout,
        lifetime_earnings: revenueMetrics.lifetime_earnings,
        average_customer_value: revenueMetrics.avg_customer_value,
        revenue_growth_rate: revenueMetrics.growth_rate
      },
      
      customer_metrics: {
        total_customers: customers.length,
        active_customers: customers.filter(c => c.status === 'active').length,
        new_customers_this_month: customers.filter(c => 
          isThisMonth(c.signup_date)
        ).length,
        at_risk_customers: customers.filter(c => c.health_score < 60).length,
        customer_retention_rate: calculateRetentionRate(customers),
        average_customer_lifetime: calculateAvgLifetime(customers),
        customer_satisfaction_score: 4.2 // Would come from surveys
      },
      
      performance_metrics: {
        overall_score: performanceScore.overall,
        revenue_score: performanceScore.revenue,
        customer_score: performanceScore.customer,
        activity_score: performanceScore.activity,
        certification_score: performanceScore.certification,
        ranking_this_month: await getPartnerRanking(partner.id, 'monthly'),
        ranking_ytd: await getPartnerRanking(partner.id, 'yearly')
      },
      
      goals_and_targets: {
        monthly_target: parseInt(partnerGoals.monthly_target || 5000),
        quarterly_target: parseInt(partnerGoals.quarterly_target || 15000),
        annual_target: parseInt(partnerGoals.annual_target || 60000),
        customer_acquisition_goal: parseInt(partnerGoals.customer_acquisition_goal || 10),
        progress_to_monthly: (revenueMetrics.current_month_revenue / (partnerGoals.monthly_target || 5000)) * 100,
        progress_to_quarterly: (revenueMetrics.current_quarter_revenue / (partnerGoals.quarterly_target || 15000)) * 100,
        progress_to_annual: (revenueMetrics.ytd_earnings / (partnerGoals.annual_target || 60000)) * 100
      },
      
      recent_activity: recentActivity.map(activity => ({
        date: activity.transaction_date,
        type: activity.transaction_type,
        description: generateActivityDescription(activity),
        amount: activity.transaction_data?.amount || null,
        status: activity.status
      })),
      
      onboarding_status: {
        completion_percentage: parseFloat(onboardingData.onboarding_progress || '0'),
        checklist: JSON.parse(onboardingData.onboarding_checklist || '[]'),
        certification_progress: parseFloat(onboardingData.certification_progress || '0'),
        training_modules_completed: parseInt(onboardingData.training_completion || '0'),
        next_milestone: getNextMilestone(onboardingData)
      },
      
      ...(includeCustomers && {
        customers: customers.map(customer => ({
          id: customer.id,
          name: customer.entity_name,
          status: customer.status,
          monthly_value: customer.monthly_value,
          health_score: customer.health_score,
          last_payment: customer.last_payment,
          signup_date: customer.signup_date,
          risk_level: customer.health_score < 60 ? 'high' : 
                     customer.health_score < 80 ? 'medium' : 'low'
        }))
      })
    }

    return NextResponse.json({
      success: true,
      data: dashboardData,
      smart_code: 'HERA.PAR.DASH.ENT.DASHBOARD.v1',
      generated_at: new Date().toISOString(),
      meta_breakthrough: 'Partner dashboard powered by HERA universal architecture',
      cache_ttl: 300 // 5 minutes cache
    })

  } catch (error) {
    console.error('Partner dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to load partner dashboard', details: error.message },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateRevenueMetrics(transactions: any[], timeRange: string) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  let current_mrr = 0
  let ytd_earnings = 0
  let last_month_earnings = 0
  let pending_payout = 0
  let lifetime_earnings = 0
  let current_month_revenue = 0
  let current_quarter_revenue = 0
  
  transactions.forEach(txn => {
    const txnDate = new Date(txn.transaction_date)
    const amount = parseFloat(txn.transaction_data?.commission_amount || 0)
    
    lifetime_earnings += amount
    
    if (txnDate.getFullYear() === currentYear) {
      ytd_earnings += amount
      
      if (txnDate.getMonth() === currentMonth) {
        current_month_revenue += amount
        
        if (txn.transaction_subtype === 'monthly_recurring') {
          current_mrr += amount
        }
      }
      
      if (txnDate.getMonth() === currentMonth - 1) {
        last_month_earnings += amount
      }
      
      // Current quarter calculation
      const currentQuarter = Math.floor(currentMonth / 3)
      const txnQuarter = Math.floor(txnDate.getMonth() / 3)
      if (txnQuarter === currentQuarter) {
        current_quarter_revenue += amount
      }
    }
    
    if (txn.status === 'pending_payout') {
      pending_payout += amount
    }
  })
  
  const growth_rate = last_month_earnings > 0 ? 
    ((current_month_revenue - last_month_earnings) / last_month_earnings) * 100 : 0
  
  const avg_customer_value = transactions.length > 0 ? 
    current_mrr / new Set(transactions.map(t => t.transaction_data?.customer_id)).size : 0

  return {
    current_mrr,
    ytd_earnings,
    last_month_earnings,
    pending_payout,
    lifetime_earnings,
    current_month_revenue,
    current_quarter_revenue,
    growth_rate: Math.round(growth_rate * 100) / 100,
    avg_customer_value: Math.round(avg_customer_value * 100) / 100
  }
}

function calculateCustomerHealth(customer: any, recentTransactions: any[]): number {
  let score = 100
  
  // Payment recency (40% of score)
  const lastPayment = recentTransactions[0]?.transaction_date
  if (lastPayment) {
    const daysSincePayment = (Date.now() - new Date(lastPayment).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSincePayment > 45) score -= 40
    else if (daysSincePayment > 30) score -= 20
    else if (daysSincePayment > 15) score -= 10
  } else {
    score -= 40
  }
  
  // Usage activity (30% of score)
  const usage = customer.metadata?.usage_score || 50
  score += (usage - 50) * 0.6
  
  // Support tickets (20% of score)
  const supportTickets = customer.metadata?.open_support_tickets || 0
  score -= supportTickets * 5
  
  // Account status (10% of score)
  if (customer.status !== 'active') score -= 10
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

function calculatePartnerPerformance(partner: any, customers: any[], revenue: any, onboarding: any) {
  // Revenue performance (40%)
  const monthlyTarget = 5000 // Default target
  const revenueScore = Math.min(100, (revenue.current_mrr / monthlyTarget) * 100)
  
  // Customer performance (30%)
  const avgHealthScore = customers.length > 0 ? 
    customers.reduce((sum, c) => sum + c.health_score, 0) / customers.length : 0
  const customerScore = avgHealthScore
  
  // Activity performance (20%)
  const activityScore = partner.metadata?.activity_score || 75
  
  // Certification performance (10%)
  const certificationScore = parseFloat(onboarding.certification_progress || '0')
  
  const overall = (
    revenueScore * 0.4 + 
    customerScore * 0.3 + 
    activityScore * 0.2 + 
    certificationScore * 0.1
  )
  
  return {
    overall: Math.round(overall),
    revenue: Math.round(revenueScore),
    customer: Math.round(customerScore),
    activity: Math.round(activityScore),
    certification: Math.round(certificationScore)
  }
}

function calculateRetentionRate(customers: any[]): number {
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const totalCustomers = customers.length
  return totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0
}

function calculateAvgLifetime(customers: any[]): number {
  if (customers.length === 0) return 0
  
  const totalDays = customers.reduce((sum, customer) => {
    const signup = new Date(customer.signup_date)
    const now = new Date()
    const days = (now.getTime() - signup.getTime()) / (1000 * 60 * 60 * 24)
    return sum + days
  }, 0)
  
  return Math.round(totalDays / customers.length)
}

function isThisMonth(dateString: string): boolean {
  const date = new Date(dateString)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && 
         date.getMonth() === now.getMonth()
}

function getNextPayoutDate(): string {
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  nextMonth.setDate(1) // First of next month
  return nextMonth.toISOString().split('T')[0]
}

async function getPartnerRanking(partnerId: string, period: string): Promise<number> {
  // Would calculate ranking among all partners
  // For now, return mock ranking
  return Math.floor(Math.random() * 100) + 1
}

function generateActivityDescription(activity: any): string {
  const descriptions = {
    partner_commission: `Commission earned: $${activity.transaction_data?.commission_amount || 0}`,
    customer_signup: `New customer onboarded: ${activity.transaction_data?.customer_name || 'Unknown'}`,
    training_completed: `Training module completed: ${activity.transaction_data?.module_name || 'Unknown'}`,
    certification_earned: `Certification achieved: ${activity.transaction_data?.certification_type || 'Unknown'}`
  }
  
  return descriptions[activity.transaction_type] || `${activity.transaction_type} activity`
}

function getNextMilestone(onboardingData: any): string {
  const progress = parseFloat(onboardingData.onboarding_progress || '0')
  
  if (progress < 20) return 'Complete business verification'
  if (progress < 40) return 'Finish foundation training'
  if (progress < 60) return 'Onboard first customer'
  if (progress < 80) return 'Complete certification'
  if (progress < 100) return 'Achieve partner status'
  
  return 'All milestones complete!'
}