import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Verify the JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authorization required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: userEntity, error: entityError } = await supabaseAdmin
      .from('core_entities')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .eq('entity_type', 'user_profile')
      .single()

    if (entityError || !userEntity) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      )
    }

    const organizationId = userEntity.organization_id

    // Get entity count for the organization
    const { data: entitiesData, error: entitiesError } = await supabaseAdmin
      .from('core_entities')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .neq('entity_type', 'user_profile') // Exclude user profiles from count

    if (entitiesError) {
      console.error('Error fetching entities count:', entitiesError)
    }

    const entitiesCount = entitiesData || 0

    // Get transactions count for the organization
    const { data: transactionsData, error: transactionsError } = await supabaseAdmin
      .from('universal_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (transactionsError) {
      console.error('Error fetching transactions count:', transactionsError)
    }

    const transactionsCount = transactionsData || 0

    // Get total transaction value for the organization
    const { data: valueData, error: valueError } = await supabaseAdmin
      .from('universal_transactions')
      .select('total_amount')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')

    let totalValue = 0
    if (!valueError && valueData) {
      totalValue = valueData.reduce((sum, transaction) => {
        return sum + (parseFloat(transaction.total_amount) || 0)
      }, 0)
    }

    // Return dashboard statistics
    return NextResponse.json({
      success: true,
      entities_count: entitiesCount,
      transactions_count: transactionsCount,
      total_value: totalValue
    })

  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}