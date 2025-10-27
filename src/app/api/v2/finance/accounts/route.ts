import { NextRequest, NextResponse } from 'next/server'
import { selectValue, selectRows } from '@/lib/db'
import { validateEntityUpsert } from '@/lib/guardrail'
import { getSupabaseService } from '@/lib/supabase-service'

export const runtime = 'nodejs'

/**
 * Finance Chart of Accounts Management API v2
 * Smart Code: HERA.FIN.GL.ENT.ACC.v1
 * 
 * Handles CRUD operations for chart of accounts with account hierarchies,
 * GL management, financial reporting, and balance tracking.
 */

interface AccountRequest {
  organization_id: string
  account_name: string
  account_code: string
  account_type: string
  account_category?: string
  parent_account_id?: string
  is_active?: boolean
  allow_posting?: boolean
  account_description?: string
  normal_balance?: string
  tax_code?: string
  currency?: string
  department?: string
  cost_center?: string
  profit_center?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  actor_user_id?: string
}

interface AccountQuery {
  organization_id: string
  account_type?: string
  account_category?: string
  parent_account_id?: string
  is_active?: boolean
  allow_posting?: boolean
  normal_balance?: string
  department?: string
  cost_center?: string
  profit_center?: string
  search?: string
  include_balances?: boolean
  limit?: number
  offset?: number
}

const ACCOUNT_TYPES = [
  'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
]

const ACCOUNT_CATEGORIES = {
  ASSET: ['CURRENT_ASSET', 'NON_CURRENT_ASSET', 'FIXED_ASSET', 'INTANGIBLE_ASSET'],
  LIABILITY: ['CURRENT_LIABILITY', 'NON_CURRENT_LIABILITY', 'LONG_TERM_LIABILITY'],
  EQUITY: ['SHARE_CAPITAL', 'RETAINED_EARNINGS', 'OTHER_EQUITY'],
  REVENUE: ['OPERATING_REVENUE', 'NON_OPERATING_REVENUE', 'OTHER_INCOME'],
  EXPENSE: ['OPERATING_EXPENSE', 'NON_OPERATING_EXPENSE', 'COST_OF_GOODS_SOLD']
}

const NORMAL_BALANCES = ['DEBIT', 'CREDIT']

// POST - Create or Update Account
export async function POST(req: NextRequest) {
  try {
    const body: AccountRequest = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    // Validate required fields
    if (!body.organization_id || !body.account_name || !body.account_code || !body.account_type) {
      return NextResponse.json({
        error: 'missing_required_fields',
        required: ['organization_id', 'account_name', 'account_code', 'account_type']
      }, { status: 400 })
    }

    // Validate account type
    if (!ACCOUNT_TYPES.includes(body.account_type)) {
      return NextResponse.json({
        error: 'invalid_account_type',
        valid_types: ACCOUNT_TYPES
      }, { status: 400 })
    }

    // Validate account category
    if (body.account_category) {
      const validCategories = ACCOUNT_CATEGORIES[body.account_type as keyof typeof ACCOUNT_CATEGORIES]
      if (!validCategories.includes(body.account_category)) {
        return NextResponse.json({
          error: 'invalid_account_category',
          valid_categories: validCategories
        }, { status: 400 })
      }
    }

    // Validate normal balance
    if (body.normal_balance && !NORMAL_BALANCES.includes(body.normal_balance)) {
      return NextResponse.json({
        error: 'invalid_normal_balance',
        valid_balances: NORMAL_BALANCES
      }, { status: 400 })
    }

    // Check for duplicate account code
    const existingAccountSql = `
      SELECT entity_id 
      FROM core_entities e
      JOIN core_dynamic_data dd ON e.entity_id = dd.entity_id
      WHERE e.organization_id = $1::uuid 
        AND e.entity_type = 'ACC'
        AND e.status = 'active'
        AND dd.field_name = 'account_code'
        AND dd.field_value = $2
        AND dd.status = 'active'
    `
    const existingAccount = await selectValue(existingAccountSql, [body.organization_id, body.account_code])
    
    if (existingAccount) {
      return NextResponse.json({
        error: 'duplicate_account_code',
        message: `Account code ${body.account_code} already exists`
      }, { status: 400 })
    }

    // Auto-determine normal balance if not provided
    const normalBalance = body.normal_balance || getDefaultNormalBalance(body.account_type)

    // Generate smart code
    const smart_code = 'HERA.FIN.GL.ENT.ACC.v1'

    const supabase = getSupabaseService()

    // Prepare dynamic data for account-specific fields
    const accountDynamicData = {
      account_code: body.account_code,
      account_type: body.account_type,
      account_category: body.account_category,
      parent_account_id: body.parent_account_id,
      is_active: body.is_active !== false ? 'true' : 'false',
      allow_posting: body.allow_posting !== false ? 'true' : 'false',
      normal_balance: normalBalance,
      tax_code: body.tax_code,
      currency: body.currency || 'USD',
      department: body.department,
      cost_center: body.cost_center,
      profit_center: body.profit_center,
      current_balance: '0',
      ytd_balance: '0',
      ...body.custom_fields
    }

    // Enhanced metadata with account-specific information
    const accountMetadata = {
      enterprise_module: 'FINANCE',
      sub_module: 'GL',
      workflow_state: body.is_active !== false ? 'ACTIVE' : 'INACTIVE',
      account_type: body.account_type,
      account_category: body.account_category,
      normal_balance: normalBalance,
      is_active: body.is_active !== false,
      allow_posting: body.allow_posting !== false,
      created_via: 'finance_api_v2',
      last_transaction_date: null,
      transaction_count: 0
    }

    // Create entity using hera_entities_crud_v1 RPC
    const { data: entityResult, error: entityError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: body.actor_user_id,
      p_organization_id: body.organization_id,
      p_entity: {
        entity_type: 'ACC',
        entity_name: body.account_name,
        entity_code: body.account_code,
        entity_description: body.account_description || `${body.account_type} account: ${body.account_name}`,
        smart_code: smart_code,
        parent_entity_id: body.parent_account_id,
        status: 'active',
        metadata: accountMetadata
      },
      p_dynamic: Object.entries(accountDynamicData).reduce((acc, [key, value]) => {
        acc[key] = {
          field_type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'text',
          field_value_text: typeof value === 'string' ? value : null,
          field_value_number: typeof value === 'number' ? value : null,
          field_value_boolean: typeof value === 'boolean' ? value : null,
          smart_code: `HERA.FIN.GL.FIELD.${key.toUpperCase()}.v1`
        }
        return acc
      }, {} as any),
      p_relationships: [],
      p_options: {}
    })

    if (entityError || !entityResult) {
      console.error('Entity creation failed:', entityError)
      throw new Error(`Failed to create account entity: ${entityError?.message}`)
    }

    const entity_id = entityResult?.entity_id || entityResult?.id || entityResult

    // Create account hierarchy relationships
    if (body.parent_account_id) {
      await createAccountHierarchyRelationship(entity_id, body.organization_id, body.parent_account_id)
    }

    // Create account opening balance entry
    await createAccountOpeningBalance(entity_id, body.organization_id, body.actor_user_id)

    return NextResponse.json({
      api_version: 'v2',
      account_id: entity_id,
      account_code: body.account_code,
      account_type: body.account_type,
      account_category: body.account_category,
      normal_balance: normalBalance,
      is_active: body.is_active !== false,
      allow_posting: body.allow_posting !== false,
      created_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Account creation error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to create account'
    }, { status: 500 })
  }
}

// GET - Query Accounts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query: AccountQuery = {
      organization_id: searchParams.get('organization_id') || '',
      account_type: searchParams.get('account_type') || undefined,
      account_category: searchParams.get('account_category') || undefined,
      parent_account_id: searchParams.get('parent_account_id') || undefined,
      is_active: searchParams.get('is_active') === 'true' ? true : 
                  searchParams.get('is_active') === 'false' ? false : undefined,
      allow_posting: searchParams.get('allow_posting') === 'true' ? true : 
                     searchParams.get('allow_posting') === 'false' ? false : undefined,
      normal_balance: searchParams.get('normal_balance') || undefined,
      department: searchParams.get('department') || undefined,
      cost_center: searchParams.get('cost_center') || undefined,
      profit_center: searchParams.get('profit_center') || undefined,
      search: searchParams.get('search') || undefined,
      include_balances: searchParams.get('include_balances') === 'true',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    if (!query.organization_id) {
      return NextResponse.json({ error: 'missing_organization_id' }, { status: 400 })
    }

    // Build dynamic WHERE clause
    const whereConditions = ['e.organization_id = $1', 'e.entity_type = $2', 'e.status = $3']
    const params: any[] = [query.organization_id, 'ACC', 'active']
    let paramIndex = 4

    if (query.account_type) {
      whereConditions.push(`e.metadata->>'account_type' = $${paramIndex}`)
      params.push(query.account_type)
      paramIndex++
    }

    if (query.account_category) {
      whereConditions.push(`e.metadata->>'account_category' = $${paramIndex}`)
      params.push(query.account_category)
      paramIndex++
    }

    if (query.parent_account_id) {
      whereConditions.push(`e.parent_entity_id = $${paramIndex}::uuid`)
      params.push(query.parent_account_id)
      paramIndex++
    }

    if (query.is_active !== undefined) {
      whereConditions.push(`dd_active.field_value = $${paramIndex}`)
      params.push(query.is_active ? 'true' : 'false')
      paramIndex++
    }

    if (query.allow_posting !== undefined) {
      whereConditions.push(`dd_posting.field_value = $${paramIndex}`)
      params.push(query.allow_posting ? 'true' : 'false')
      paramIndex++
    }

    if (query.normal_balance) {
      whereConditions.push(`e.metadata->>'normal_balance' = $${paramIndex}`)
      params.push(query.normal_balance)
      paramIndex++
    }

    if (query.department) {
      whereConditions.push(`dd_department.field_value = $${paramIndex}`)
      params.push(query.department)
      paramIndex++
    }

    if (query.cost_center) {
      whereConditions.push(`dd_cost_center.field_value = $${paramIndex}`)
      params.push(query.cost_center)
      paramIndex++
    }

    if (query.profit_center) {
      whereConditions.push(`dd_profit_center.field_value = $${paramIndex}`)
      params.push(query.profit_center)
      paramIndex++
    }

    if (query.search) {
      whereConditions.push(`(
        e.entity_name ILIKE $${paramIndex} OR 
        e.entity_description ILIKE $${paramIndex} OR
        dd_account_code.field_value ILIKE $${paramIndex}
      )`)
      params.push(`%${query.search}%`)
      paramIndex++
    }

    // Add limit and offset
    params.push(query.limit, query.offset)

    const sql = `
      SELECT 
        e.entity_id as account_id,
        e.entity_name as account_name,
        e.entity_code as account_code,
        e.entity_description,
        e.parent_entity_id as parent_account_id,
        e.metadata->>'account_type' as account_type,
        e.metadata->>'account_category' as account_category,
        e.metadata->>'normal_balance' as normal_balance,
        e.metadata->>'is_active' as is_active,
        e.metadata->>'allow_posting' as allow_posting,
        e.metadata->>'transaction_count' as transaction_count,
        e.metadata->>'last_transaction_date' as last_transaction_date,
        e.tags,
        e.created_at,
        e.updated_at,
        -- Account-specific dynamic data
        dd_account_code.field_value as account_code_dynamic,
        dd_active.field_value as is_active_flag,
        dd_posting.field_value as allow_posting_flag,
        dd_tax_code.field_value as tax_code,
        dd_currency.field_value as currency,
        dd_department.field_value as department,
        dd_cost_center.field_value as cost_center,
        dd_profit_center.field_value as profit_center,
        dd_current_balance.field_value as current_balance,
        dd_ytd_balance.field_value as ytd_balance,
        -- Parent account information
        p_entity.entity_name as parent_account_name,
        p_entity.entity_code as parent_account_code,
        -- Account hierarchy level (depth)
        (
          WITH RECURSIVE account_hierarchy AS (
            SELECT entity_id, parent_entity_id, 0 as level
            FROM core_entities 
            WHERE entity_id = e.entity_id
            UNION ALL
            SELECT ce.entity_id, ce.parent_entity_id, ah.level + 1
            FROM core_entities ce
            JOIN account_hierarchy ah ON ce.entity_id = ah.parent_entity_id
            WHERE ce.organization_id = e.organization_id AND ce.entity_type = 'ACC'
          )
          SELECT MAX(level) FROM account_hierarchy
        ) as account_level,
        -- Children count
        (
          SELECT COUNT(*) 
          FROM core_entities child 
          WHERE child.parent_entity_id = e.entity_id 
            AND child.entity_type = 'ACC' 
            AND child.status = 'active'
        ) as children_count${query.include_balances ? `,
        -- Current period balance
        COALESCE((
          SELECT SUM(
            CASE 
              WHEN e.metadata->>'normal_balance' = 'DEBIT' 
              THEN (utl.debit_amount - utl.credit_amount)
              ELSE (utl.credit_amount - utl.debit_amount)
            END
          )
          FROM universal_transaction_lines utl
          JOIN universal_transactions ut ON utl.transaction_id = ut.transaction_id
          WHERE utl.account_id = e.entity_id 
            AND ut.organization_id = e.organization_id
            AND ut.status = 'posted'
            AND ut.transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
        ), 0) as current_period_balance,
        -- Year to date balance
        COALESCE((
          SELECT SUM(
            CASE 
              WHEN e.metadata->>'normal_balance' = 'DEBIT' 
              THEN (utl.debit_amount - utl.credit_amount)
              ELSE (utl.credit_amount - utl.debit_amount)
            END
          )
          FROM universal_transaction_lines utl
          JOIN universal_transactions ut ON utl.transaction_id = ut.transaction_id
          WHERE utl.account_id = e.entity_id 
            AND ut.organization_id = e.organization_id
            AND ut.status = 'posted'
            AND ut.transaction_date >= DATE_TRUNC('year', CURRENT_DATE)
        ), 0) as ytd_balance` : ''}
      FROM core_entities e
      -- Dynamic data joins for account fields
      LEFT JOIN core_dynamic_data dd_account_code ON e.entity_id = dd_account_code.entity_id 
        AND dd_account_code.field_name = 'account_code' AND dd_account_code.status = 'active'
      LEFT JOIN core_dynamic_data dd_active ON e.entity_id = dd_active.entity_id 
        AND dd_active.field_name = 'is_active' AND dd_active.status = 'active'
      LEFT JOIN core_dynamic_data dd_posting ON e.entity_id = dd_posting.entity_id 
        AND dd_posting.field_name = 'allow_posting' AND dd_posting.status = 'active'
      LEFT JOIN core_dynamic_data dd_tax_code ON e.entity_id = dd_tax_code.entity_id 
        AND dd_tax_code.field_name = 'tax_code' AND dd_tax_code.status = 'active'
      LEFT JOIN core_dynamic_data dd_currency ON e.entity_id = dd_currency.entity_id 
        AND dd_currency.field_name = 'currency' AND dd_currency.status = 'active'
      LEFT JOIN core_dynamic_data dd_department ON e.entity_id = dd_department.entity_id 
        AND dd_department.field_name = 'department' AND dd_department.status = 'active'
      LEFT JOIN core_dynamic_data dd_cost_center ON e.entity_id = dd_cost_center.entity_id 
        AND dd_cost_center.field_name = 'cost_center' AND dd_cost_center.status = 'active'
      LEFT JOIN core_dynamic_data dd_profit_center ON e.entity_id = dd_profit_center.entity_id 
        AND dd_profit_center.field_name = 'profit_center' AND dd_profit_center.status = 'active'
      LEFT JOIN core_dynamic_data dd_current_balance ON e.entity_id = dd_current_balance.entity_id 
        AND dd_current_balance.field_name = 'current_balance' AND dd_current_balance.status = 'active'
      LEFT JOIN core_dynamic_data dd_ytd_balance ON e.entity_id = dd_ytd_balance.entity_id 
        AND dd_ytd_balance.field_name = 'ytd_balance' AND dd_ytd_balance.status = 'active'
      -- Parent account lookup
      LEFT JOIN core_entities p_entity ON e.parent_entity_id = p_entity.entity_id
        AND p_entity.entity_type = 'ACC' AND p_entity.status = 'active'
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY 
        e.metadata->>'account_type',
        dd_account_code.field_value ASC,
        e.entity_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const accounts = await selectRows(sql, params)

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM core_entities e
      LEFT JOIN core_dynamic_data dd_active ON e.entity_id = dd_active.entity_id 
        AND dd_active.field_name = 'is_active' AND dd_active.status = 'active'
      LEFT JOIN core_dynamic_data dd_posting ON e.entity_id = dd_posting.entity_id 
        AND dd_posting.field_name = 'allow_posting' AND dd_posting.status = 'active'
      LEFT JOIN core_dynamic_data dd_department ON e.entity_id = dd_department.entity_id 
        AND dd_department.field_name = 'department' AND dd_department.status = 'active'
      LEFT JOIN core_dynamic_data dd_cost_center ON e.entity_id = dd_cost_center.entity_id 
        AND dd_cost_center.field_name = 'cost_center' AND dd_cost_center.status = 'active'
      LEFT JOIN core_dynamic_data dd_profit_center ON e.entity_id = dd_profit_center.entity_id 
        AND dd_profit_center.field_name = 'profit_center' AND dd_profit_center.status = 'active'
      LEFT JOIN core_dynamic_data dd_account_code ON e.entity_id = dd_account_code.entity_id 
        AND dd_account_code.field_name = 'account_code' AND dd_account_code.status = 'active'
      WHERE ${whereConditions.join(' AND ')}
    `
    
    const countParams = params.slice(0, -2) // Remove limit and offset
    const totalResult = await selectValue<number>(countSql, countParams)

    // Calculate account statistics
    const stats = await calculateAccountStatistics(query.organization_id)

    return NextResponse.json({
      api_version: 'v2',
      accounts,
      pagination: {
        total: totalResult || 0,
        limit: query.limit,
        offset: query.offset,
        has_more: (query.offset || 0) + (query.limit || 50) < (totalResult || 0)
      },
      statistics: stats,
      filters: {
        account_type: query.account_type,
        account_category: query.account_category,
        parent_account_id: query.parent_account_id,
        is_active: query.is_active,
        allow_posting: query.allow_posting,
        normal_balance: query.normal_balance,
        include_balances: query.include_balances
      }
    })

  } catch (error) {
    console.error('Account query error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to query accounts'
    }, { status: 500 })
  }
}

// Helper functions
function getDefaultNormalBalance(accountType: string): string {
  const normalBalanceMap: Record<string, string> = {
    'ASSET': 'DEBIT',
    'EXPENSE': 'DEBIT',
    'LIABILITY': 'CREDIT',
    'EQUITY': 'CREDIT',
    'REVENUE': 'CREDIT'
  }
  return normalBalanceMap[accountType] || 'DEBIT'
}

async function createAccountHierarchyRelationship(
  accountId: string, 
  organizationId: string, 
  parentAccountId: string
) {
  const sql = `
    INSERT INTO core_relationships (
      organization_id, from_entity_id, to_entity_id, relationship_type,
      relationship_metadata, status, created_at
    ) VALUES (
      $1::uuid, $2::uuid, $3::uuid, 'ACCOUNT_HIERARCHY',
      '{"description": "Child account under parent account"}'::jsonb, 'active', NOW()
    )
  `
  await selectValue(sql, [organizationId, parentAccountId, accountId])
}

async function createAccountOpeningBalance(
  accountId: string,
  organizationId: string,
  userId?: string
) {
  // Create an opening balance entry in the transaction system
  const sql = `
    INSERT INTO account_opening_balances (
      organization_id, account_id, opening_balance, 
      fiscal_year, created_by, created_at
    ) VALUES (
      $1::uuid, $2::uuid, 0, 
      EXTRACT(YEAR FROM CURRENT_DATE), $3::uuid, NOW()
    )
  `
  await selectValue(sql, [organizationId, accountId, userId])
}

async function calculateAccountStatistics(organizationId: string) {
  const sql = `
    SELECT 
      COUNT(*) as total_accounts,
      COUNT(*) FILTER (WHERE e.metadata->>'account_type' = 'ASSET') as asset_accounts,
      COUNT(*) FILTER (WHERE e.metadata->>'account_type' = 'LIABILITY') as liability_accounts,
      COUNT(*) FILTER (WHERE e.metadata->>'account_type' = 'EQUITY') as equity_accounts,
      COUNT(*) FILTER (WHERE e.metadata->>'account_type' = 'REVENUE') as revenue_accounts,
      COUNT(*) FILTER (WHERE e.metadata->>'account_type' = 'EXPENSE') as expense_accounts,
      COUNT(*) FILTER (WHERE e.metadata->>'is_active' = 'true') as active_accounts,
      COUNT(*) FILTER (WHERE e.metadata->>'allow_posting' = 'true') as posting_accounts,
      COUNT(*) FILTER (WHERE e.parent_entity_id IS NULL) as root_accounts,
      COUNT(*) FILTER (WHERE e.created_at >= NOW() - INTERVAL '30 days') as accounts_this_month
    FROM core_entities e
    WHERE e.organization_id = $1::uuid 
      AND e.entity_type = 'ACC' 
      AND e.status = 'active'
  `
  
  return await selectValue(sql, [organizationId])
}