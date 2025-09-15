import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withErrorHandler } from '@/lib/api-error-handler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

interface LoyaltyProgram {
  id: string
  name: string
  description: string
  points_per_currency: number
  currency_per_point: number
  signup_bonus: number
  referral_bonus: number
  birthday_bonus: number
  tiers: LoyaltyTier[]
  rewards: LoyaltyReward[]
  active: boolean
  metadata?: any
}

interface LoyaltyTier {
  id: string
  name: string
  min_points: number
  benefits: string[]
  discount_percentage: number
  points_multiplier: number
  color: string
  icon?: string
}

interface LoyaltyReward {
  id: string
  name: string
  description: string
  points_required: number
  reward_type: 'discount' | 'service' | 'product' | 'cash_value'
  reward_value: number
  reward_details?: any
  active: boolean
  stock?: number
  expires_in_days?: number
}

interface LoyaltyTransaction {
  id: string
  customer_id: string
  customer_name: string
  transaction_type: 'earned' | 'redeemed' | 'bonus' | 'expired' | 'adjustment'
  points: number
  balance_after: number
  description: string
  reference_id?: string
  reference_type?: string
  created_at: string
  metadata?: any
}

interface CustomerLoyalty {
  customer_id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  points_balance: number
  lifetime_points: number
  current_tier: string
  tier_progress: number
  join_date: string
  last_activity: string
  total_redemptions: number
  available_rewards: LoyaltyReward[]
  transaction_history: LoyaltyTransaction[]
}

// GET: Fetch loyalty program data
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')
  const customerId = searchParams.get('customer_id')
  const type = searchParams.get('type') // program, customers, transactions, rewards

  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: 'Organization ID is required' },
      { status: 400 }
    )
  }

  try {
    // Fetch or create loyalty program
    let program = await getLoyaltyProgram(organizationId)
    if (!program) {
      program = await createDefaultLoyaltyProgram(organizationId)
    }

    // If requesting specific customer data
    if (customerId) {
      const customerLoyalty = await getCustomerLoyaltyData(organizationId, customerId)
      return NextResponse.json({
        success: true,
        program,
        customerLoyalty
      })
    }

    // Based on type, return different data
    switch (type) {
      case 'customers':
        const customers = await getLoyaltyCustomers(organizationId)
        return NextResponse.json({
          success: true,
          program,
          customers
        })

      case 'transactions':
        const transactions = await getLoyaltyTransactions(organizationId)
        return NextResponse.json({
          success: true,
          program,
          transactions
        })

      case 'rewards':
        const rewards = await getActiveRewards(organizationId)
        return NextResponse.json({
          success: true,
          program,
          rewards
        })

      default:
        // Return program overview with analytics
        const analytics = await getLoyaltyAnalytics(organizationId)
        return NextResponse.json({
          success: true,
          program,
          analytics
        })
    }
  } catch (error) {
    console.error('Error fetching loyalty data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loyalty data' },
      { status: 500 }
    )
  }
})

// POST: Create loyalty transactions or rewards
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { organizationId, action, data } = body

  if (!organizationId || !action || !data) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
  }

  try {
    switch (action) {
      case 'add_points':
        return await addLoyaltyPoints(organizationId, data)

      case 'redeem_reward':
        return await redeemReward(organizationId, data)

      case 'create_reward':
        return await createReward(organizationId, data)

      case 'adjust_points':
        return await adjustPoints(organizationId, data)

      case 'enroll_customer':
        return await enrollCustomer(organizationId, data)

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing loyalty action:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process loyalty action' },
      { status: 500 }
    )
  }
})

// PUT: Update loyalty program settings or rewards
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { organizationId, type, id, data } = body

  if (!organizationId || !type || !data) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
  }

  try {
    switch (type) {
      case 'program':
        return await updateLoyaltyProgram(organizationId, data)

      case 'reward':
        if (!id) throw new Error('Reward ID required')
        return await updateReward(organizationId, id, data)

      case 'tier':
        if (!id) throw new Error('Tier ID required')
        return await updateTier(organizationId, id, data)

      default:
        return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating loyalty data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update loyalty data' },
      { status: 500 }
    )
  }
})

// Helper functions
async function getLoyaltyProgram(organizationId: string): Promise<LoyaltyProgram | null> {
  const { data: program } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'loyalty_program')
    .single()

  if (!program) return null

  // Get tiers
  const { data: tiers } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'loyalty_tier')
    .order('metadata->min_points')

  // Get rewards
  const { data: rewards } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'loyalty_reward')
    .eq('status', 'active')

  return {
    id: program.id,
    name: program.entity_name,
    description: (program.metadata as any)?.description || '',
    points_per_currency: (program.metadata as any)?.points_per_currency || 1,
    currency_per_point: (program.metadata as any)?.currency_per_point || 0.01,
    signup_bonus: (program.metadata as any)?.signup_bonus || 100,
    referral_bonus: (program.metadata as any)?.referral_bonus || 500,
    birthday_bonus: (program.metadata as any)?.birthday_bonus || 200,
    tiers:
      tiers?.map(t => ({
        id: t.id,
        name: t.entity_name,
        min_points: (t.metadata as any)?.min_points || 0,
        benefits: (t.metadata as any)?.benefits || [],
        discount_percentage: (t.metadata as any)?.discount_percentage || 0,
        points_multiplier: (t.metadata as any)?.points_multiplier || 1,
        color: (t.metadata as any)?.color || '#gray'
      })) || [],
    rewards:
      rewards?.map(r => ({
        id: r.id,
        name: r.entity_name,
        description: (r.metadata as any)?.description || '',
        points_required: (r.metadata as any)?.points_required || 0,
        reward_type: (r.metadata as any)?.reward_type || 'discount',
        reward_value: (r.metadata as any)?.reward_value || 0,
        reward_details: (r.metadata as any)?.reward_details,
        active: r.status === 'active',
        stock: (r.metadata as any)?.stock,
        expires_in_days: (r.metadata as any)?.expires_in_days
      })) || [],
    active: program.status === 'active'
  }
}

async function createDefaultLoyaltyProgram(organizationId: string): Promise<LoyaltyProgram> {
  // Create main program
  const { data: program } = await supabase
    .from('core_entities')
    .insert({
      organization_id: organizationId,
      entity_type: 'loyalty_program',
      entity_name: 'VIP Rewards Program',
      entity_code: `LOYALTY-${organizationId}`,
      status: 'active',
      smart_code: 'HERA.SALON.LOYALTY.PROGRAM.v1',
      metadata: {
        description: 'Earn points on every visit and unlock exclusive rewards',
        points_per_currency: 1,
        currency_per_point: 0.01,
        signup_bonus: 100,
        referral_bonus: 500,
        birthday_bonus: 200
      }
    })
    .select()
    .single()

  // Create default tiers
  const defaultTiers = [
    {
      name: 'Bronze',
      min_points: 0,
      benefits: ['1 point per AED spent', 'Birthday bonus points'],
      discount_percentage: 0,
      points_multiplier: 1,
      color: '#CD7F32'
    },
    {
      name: 'Silver',
      min_points: 500,
      benefits: [
        '1.25 points per AED spent',
        '5% discount on services',
        'Birthday bonus points',
        'Priority booking'
      ],
      discount_percentage: 5,
      points_multiplier: 1.25,
      color: '#C0C0C0'
    },
    {
      name: 'Gold',
      min_points: 2000,
      benefits: [
        '1.5 points per AED spent',
        '10% discount on services',
        'Birthday bonus points',
        'Priority booking',
        'Free birthday service'
      ],
      discount_percentage: 10,
      points_multiplier: 1.5,
      color: '#FFD700'
    },
    {
      name: 'Platinum',
      min_points: 5000,
      benefits: [
        '2 points per AED spent',
        '15% discount on services',
        'Birthday bonus points',
        'VIP booking priority',
        'Free birthday service',
        'Exclusive events access'
      ],
      discount_percentage: 15,
      points_multiplier: 2,
      color: '#E5E4E2'
    }
  ]

  for (const tier of defaultTiers) {
    await supabase.from('core_entities').insert({
      organization_id: organizationId,
      entity_type: 'loyalty_tier',
      entity_name: tier.name,
      entity_code: `TIER-${tier.name.toUpperCase()}`,
      status: 'active',
      smart_code: 'HERA.SALON.LOYALTY.TIER.v1',
      metadata: tier
    })
  }

  // Create default rewards
  const defaultRewards = [
    {
      name: '10% Off Any Service',
      description: 'Get 10% discount on your next service',
      points_required: 500,
      reward_type: 'discount',
      reward_value: 10,
      expires_in_days: 30
    },
    {
      name: 'Free Hair Treatment',
      description: 'Complimentary hair treatment of your choice',
      points_required: 1000,
      reward_type: 'service',
      reward_value: 150,
      reward_details: { service_types: ['hair_treatment'] },
      expires_in_days: 60
    },
    {
      name: 'AED 50 Cash Voucher',
      description: 'AED 50 off your next visit',
      points_required: 1500,
      reward_type: 'cash_value',
      reward_value: 50,
      expires_in_days: 90
    },
    {
      name: 'Premium Product Gift',
      description: 'Select any premium hair care product',
      points_required: 2000,
      reward_type: 'product',
      reward_value: 200,
      stock: 10,
      expires_in_days: 120
    }
  ]

  for (const reward of defaultRewards) {
    await supabase.from('core_entities').insert({
      organization_id: organizationId,
      entity_type: 'loyalty_reward',
      entity_name: reward.name,
      entity_code: `REWARD-${Date.now()}`,
      status: 'active',
      smart_code: 'HERA.SALON.LOYALTY.REWARD.v1',
      metadata: reward
    })
  }

  return (await getLoyaltyProgram(organizationId)) as LoyaltyProgram
}

async function getLoyaltyCustomers(organizationId: string) {
  const { data: customers } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'customer')

  // Get loyalty data for each customer
  const loyaltyCustomers = []
  for (const customer of customers || []) {
    const loyaltyData = await getCustomerLoyaltyData(organizationId, customer.id)
    if (loyaltyData) {
      loyaltyCustomers.push(loyaltyData)
    }
  }

  return loyaltyCustomers.sort((a, b) => b.points_balance - a.points_balance)
}

async function getCustomerLoyaltyData(
  organizationId: string,
  customerId: string
): Promise<CustomerLoyalty | null> {
  // Get customer info
  const { data: customer } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', customerId)
    .single()

  if (!customer) return null

  // Get loyalty transactions
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('metadata->customer_id', customerId)
    .eq('transaction_type', 'loyalty_transaction')
    .order('created_at', { ascending: false })

  // Calculate current balance
  let pointsBalance = 0
  let lifetimePoints = 0
  let totalRedemptions = 0

  transactions?.forEach(txn => {
    const points = (txn.metadata as any)?.points || 0
    if (
      (txn.metadata as any)?.transaction_type === 'earned' ||
      (txn.metadata as any)?.transaction_type === 'bonus'
    ) {
      lifetimePoints += points
      pointsBalance += points
    } else if ((txn.metadata as any)?.transaction_type === 'redeemed') {
      pointsBalance -= Math.abs(points)
      totalRedemptions += 1
    }
  })

  // Determine current tier
  const program = await getLoyaltyProgram(organizationId)
  let currentTier = program?.tiers[0]
  let nextTier = null

  if (program) {
    for (let i = program.tiers.length - 1; i >= 0; i--) {
      if (lifetimePoints >= program.tiers[i].min_points) {
        currentTier = program.tiers[i]
        nextTier = program.tiers[i + 1] || null
        break
      }
    }
  }

  // Get available rewards
  const availableRewards = program?.rewards.filter(r => r.points_required <= pointsBalance) || []

  return {
    customer_id: customer.id,
    customer_name: customer.entity_name,
    customer_email: (customer.metadata as any)?.email,
    customer_phone: (customer.metadata as any)?.phone,
    points_balance: pointsBalance,
    lifetime_points: lifetimePoints,
    current_tier: currentTier?.name || 'Bronze',
    tier_progress: nextTier
      ? ((lifetimePoints - currentTier!.min_points) /
          (nextTier.min_points - currentTier!.min_points)) *
        100
      : 100,
    join_date: (customer.metadata as any)?.loyalty_join_date || customer.created_at,
    last_activity: transactions?.[0]?.created_at || customer.created_at,
    total_redemptions: totalRedemptions,
    available_rewards: availableRewards,
    transaction_history:
      transactions?.map(t => ({
        id: t.id,
        customer_id: customerId,
        customer_name: customer.entity_name,
        transaction_type: (t.metadata as any)?.transaction_type || 'earned',
        points: (t.metadata as any)?.points || 0,
        balance_after: (t.metadata as any)?.balance_after || 0,
        description: (t.metadata as any)?.description || '',
        reference_id: (t.metadata as any)?.reference_id,
        reference_type: (t.metadata as any)?.reference_type,
        created_at: t.created_at,
        metadata: t.metadata
      })) || []
  }
}

async function getLoyaltyTransactions(organizationId: string) {
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'loyalty_transaction')
    .order('created_at', { ascending: false })
    .limit(100)

  // Get customer names
  const enrichedTransactions = []
  for (const txn of transactions || []) {
    const { data: customer } = await supabase
      .from('core_entities')
      .select('entity_name')
      .eq('id', (txn.metadata as any)?.customer_id)
      .single()

    enrichedTransactions.push({
      id: txn.id,
      customer_id: (txn.metadata as any)?.customer_id,
      customer_name: customer?.entity_name || 'Unknown',
      transaction_type: (txn.metadata as any)?.transaction_type || 'earned',
      points: (txn.metadata as any)?.points || 0,
      balance_after: (txn.metadata as any)?.balance_after || 0,
      description: (txn.metadata as any)?.description || '',
      reference_id: (txn.metadata as any)?.reference_id,
      reference_type: (txn.metadata as any)?.reference_type,
      created_at: txn.created_at
    })
  }

  return enrichedTransactions
}

async function getActiveRewards(organizationId: string) {
  const { data: rewards } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'loyalty_reward')
    .eq('status', 'active')

  return (
    rewards?.map(r => ({
      id: r.id,
      name: r.entity_name,
      description: (r.metadata as any)?.description || '',
      points_required: (r.metadata as any)?.points_required || 0,
      reward_type: (r.metadata as any)?.reward_type || 'discount',
      reward_value: (r.metadata as any)?.reward_value || 0,
      reward_details: (r.metadata as any)?.reward_details,
      active: true,
      stock: (r.metadata as any)?.stock,
      expires_in_days: (r.metadata as any)?.expires_in_days,
      redemption_count: (r.metadata as any)?.redemption_count || 0
    })) || []
  )
}

async function getLoyaltyAnalytics(organizationId: string) {
  // Get all customers with loyalty
  const customers = await getLoyaltyCustomers(organizationId)

  // Get recent transactions
  const { data: recentTransactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'loyalty_transaction')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  // Calculate analytics
  const totalMembers = customers.length
  const activeMembers = customers.filter(c => c.points_balance > 0).length
  const totalPointsIssued = customers.reduce((sum, c) => sum + c.lifetime_points, 0)
  const totalPointsBalance = customers.reduce((sum, c) => sum + c.points_balance, 0)
  const totalRedemptions =
    recentTransactions?.filter(t => (t.metadata as any)?.transaction_type === 'redeemed').length ||
    0

  // Tier distribution
  const tierDistribution: { [key: string]: number } = {}
  customers.forEach(c => {
    tierDistribution[c.current_tier] = (tierDistribution[c.current_tier] || 0) + 1
  })

  // Recent activity
  const recentEarned =
    recentTransactions?.filter(t => (t.metadata as any)?.transaction_type === 'earned').length || 0
  const recentRedeemed =
    recentTransactions?.filter(t => (t.metadata as any)?.transaction_type === 'redeemed').length ||
    0

  return {
    totalMembers,
    activeMembers,
    totalPointsIssued,
    totalPointsBalance,
    totalRedemptions,
    averagePointsPerMember: totalMembers > 0 ? Math.round(totalPointsBalance / totalMembers) : 0,
    redemptionRate:
      totalPointsIssued > 0
        ? (((totalPointsIssued - totalPointsBalance) / totalPointsIssued) * 100).toFixed(1)
        : '0',
    tierDistribution,
    recentActivity: {
      earned: recentEarned,
      redeemed: recentRedeemed
    },
    topMembers: customers.slice(0, 5).map(c => ({
      id: c.customer_id,
      name: c.customer_name,
      points: c.points_balance,
      tier: c.current_tier
    }))
  }
}

async function addLoyaltyPoints(organizationId: string, data: any) {
  const { customerId, points, description, referenceId, referenceType } = data

  // Get current balance
  const customerLoyalty = await getCustomerLoyaltyData(organizationId, customerId)
  const newBalance = (customerLoyalty?.points_balance || 0) + points

  // Create transaction
  const { data: transaction, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'loyalty_transaction',
      transaction_code: `LOYALTY-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      smart_code: 'HERA.SALON.LOYALTY.POINTS.EARNED.v1',
      metadata: {
        customer_id: customerId,
        transaction_type: 'earned',
        points,
        balance_after: newBalance,
        description,
        reference_id: referenceId,
        reference_type: referenceType
      }
    })
    .select()
    .single()

  if (error) throw error

  return NextResponse.json({
    success: true,
    transaction,
    newBalance
  })
}

async function redeemReward(organizationId: string, data: any) {
  const { customerId, rewardId } = data

  // Get reward details
  const { data: reward } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', rewardId)
    .single()

  if (!reward) {
    return NextResponse.json({ success: false, error: 'Reward not found' }, { status: 404 })
  }

  const pointsRequired = (reward.metadata as any)?.points_required || 0

  // Check customer balance
  const customerLoyalty = await getCustomerLoyaltyData(organizationId, customerId)
  if (!customerLoyalty || customerLoyalty.points_balance < pointsRequired) {
    return NextResponse.json({ success: false, error: 'Insufficient points' }, { status: 400 })
  }

  const newBalance = customerLoyalty.points_balance - pointsRequired

  // Create redemption transaction
  const { data: transaction, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'loyalty_transaction',
      transaction_code: `REDEEM-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      smart_code: 'HERA.SALON.LOYALTY.POINTS.REDEEMED.v1',
      metadata: {
        customer_id: customerId,
        transaction_type: 'redeemed',
        points: -pointsRequired,
        balance_after: newBalance,
        description: `Redeemed: ${reward.entity_name}`,
        reward_id: rewardId,
        reward_name: reward.entity_name,
        reward_type: (reward.metadata as any)?.reward_type,
        reward_value: (reward.metadata as any)?.reward_value
      }
    })
    .select()
    .single()

  if (error) throw error

  // Update reward redemption count and stock
  await supabase
    .from('core_entities')
    .update({
      metadata: {
        ...reward.metadata,
        redemption_count: ((reward.metadata as any)?.redemption_count || 0) + 1,
        stock: (reward.metadata as any)?.stock ? reward.metadata.stock - 1 : undefined
      }
    })
    .eq('id', rewardId)

  return NextResponse.json({
    success: true,
    transaction,
    newBalance,
    reward: {
      id: reward.id,
      name: reward.entity_name,
      type: (reward.metadata as any)?.reward_type,
      value: (reward.metadata as any)?.reward_value
    }
  })
}

async function createReward(organizationId: string, data: any) {
  const { data: reward, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: organizationId,
      entity_type: 'loyalty_reward',
      entity_name: data.name,
      entity_code: `REWARD-${Date.now()}`,
      status: 'active',
      smart_code: 'HERA.SALON.LOYALTY.REWARD.v1',
      metadata: {
        description: data.description,
        points_required: data.pointsRequired,
        reward_type: data.rewardType,
        reward_value: data.rewardValue,
        reward_details: data.rewardDetails,
        stock: data.stock,
        expires_in_days: data.expiresInDays,
        redemption_count: 0
      }
    })
    .select()
    .single()

  if (error) throw error

  return NextResponse.json({
    success: true,
    reward
  })
}

async function adjustPoints(organizationId: string, data: any) {
  const { customerId, points, reason, type = 'adjustment' } = data

  // Get current balance
  const customerLoyalty = await getCustomerLoyaltyData(organizationId, customerId)
  const currentBalance = customerLoyalty?.points_balance || 0
  const newBalance = currentBalance + points

  // Don't allow negative balance
  if (newBalance < 0) {
    return NextResponse.json(
      { success: false, error: 'Cannot adjust to negative balance' },
      { status: 400 }
    )
  }

  // Create adjustment transaction
  const { data: transaction, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'loyalty_transaction',
      transaction_code: `ADJUST-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      smart_code: 'HERA.SALON.LOYALTY.POINTS.ADJUSTMENT.v1',
      metadata: {
        customer_id: customerId,
        transaction_type: type,
        points,
        balance_after: newBalance,
        description: reason || 'Manual adjustment',
        adjusted_by: 'admin'
      }
    })
    .select()
    .single()

  if (error) throw error

  return NextResponse.json({
    success: true,
    transaction,
    previousBalance: currentBalance,
    newBalance
  })
}

async function enrollCustomer(organizationId: string, data: any) {
  const { customerId } = data

  // Check if already enrolled
  const existingLoyalty = await getCustomerLoyaltyData(organizationId, customerId)
  if (existingLoyalty && existingLoyalty.lifetime_points > 0) {
    return NextResponse.json(
      { success: false, error: 'Customer already enrolled' },
      { status: 400 }
    )
  }

  // Get program signup bonus
  const program = await getLoyaltyProgram(organizationId)
  const signupBonus = program?.signup_bonus || 100

  // Create signup bonus transaction
  const { data: transaction, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'loyalty_transaction',
      transaction_code: `SIGNUP-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      smart_code: 'HERA.SALON.LOYALTY.SIGNUP.BONUS.v1',
      metadata: {
        customer_id: customerId,
        transaction_type: 'bonus',
        points: signupBonus,
        balance_after: signupBonus,
        description: 'Welcome bonus for joining loyalty program'
      }
    })
    .select()
    .single()

  if (error) throw error

  // Update customer with loyalty join date
  await supabase
    .from('core_entities')
    .update({
      metadata: {
        ...data.customerMetadata,
        loyalty_join_date: new Date().toISOString()
      }
    })
    .eq('id', customerId)

  return NextResponse.json({
    success: true,
    transaction,
    signupBonus
  })
}

async function updateLoyaltyProgram(organizationId: string, data: any) {
  const { data: program, error } = await supabase
    .from('core_entities')
    .update({
      metadata: {
        ...data,
        updated_at: new Date().toISOString()
      }
    })
    .eq('organization_id', organizationId)
    .eq('entity_type', 'loyalty_program')
    .select()
    .single()

  if (error) throw error

  return NextResponse.json({
    success: true,
    program
  })
}

async function updateReward(organizationId: string, rewardId: string, data: any) {
  const { data: reward, error } = await supabase
    .from('core_entities')
    .update({
      entity_name: data.name,
      status: data.active ? 'active' : 'inactive',
      metadata: {
        ...data,
        updated_at: new Date().toISOString()
      }
    })
    .eq('id', rewardId)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) throw error

  return NextResponse.json({
    success: true,
    reward
  })
}

async function updateTier(organizationId: string, tierId: string, data: any) {
  const { data: tier, error } = await supabase
    .from('core_entities')
    .update({
      metadata: {
        ...data,
        updated_at: new Date().toISOString()
      }
    })
    .eq('id', tierId)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) throw error

  return NextResponse.json({
    success: true,
    tier
  })
}
