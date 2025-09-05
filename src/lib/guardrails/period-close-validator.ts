/**
 * Period Close Validator
 * Enforces closed period protection at write time
 */

import { getSupabase } from '@/lib/supabase/client'

interface PeriodStatus {
  is_closed: boolean
  period_code: string
  fiscal_year: number
  fiscal_period: number
  closed_at?: string
  closed_by?: string
}

/**
 * Check if a fiscal period is open for posting
 */
export async function isPeriodOpen(
  organizationId: string,
  fiscalYear: number,
  fiscalPeriod: number
): Promise<boolean> {
  const supabase = getSupabase()
  
  // Look up fiscal period entity with status
  const { data: periodEntity, error } = await supabase
    .from('core_entities')
    .select(`
      id,
      entity_code,
      metadata,
      relationships_from:core_relationships!from_entity_id(
        to_entity:core_entities!to_entity_id(
          entity_code,
          metadata
        )
      )
    `)
    .eq('organization_id', organizationId)
    .eq('entity_type', 'fiscal_period')
    .eq('entity_code', `FY${fiscalYear}-P${String(fiscalPeriod).padStart(2, '0')}`)
    .single()

  if (error || !periodEntity) {
    // Period not found - consider it open (will be created on first post)
    return true
  }

  // Check for closed status relationship
  const statusRelationship = periodEntity.relationships_from?.find(
    rel => rel.to_entity?.entity_type === 'workflow_status' &&
           rel.to_entity?.entity_code === 'STATUS-CLOSED'
  )

  return !statusRelationship // Open if no closed status
}

/**
 * Check if transaction can be posted to period
 */
export async function checkPeriodPostingAllowed(params: {
  organizationId: string
  transactionDate: string
  transactionType: string
  smartCode: string
}): Promise<{
  allowed: boolean
  reason?: string
  periodStatus?: PeriodStatus
}> {
  const { organizationId, transactionDate, transactionType, smartCode } = params
  
  // Extract fiscal period from date
  const date = new Date(transactionDate)
  const fiscalYear = date.getFullYear()
  const fiscalPeriod = date.getMonth() + 1 // 1-12
  
  // Check if period is open
  const isOpen = await isPeriodOpen(organizationId, fiscalYear, fiscalPeriod)
  
  if (!isOpen) {
    return {
      allowed: false,
      reason: `Cannot post to closed period ${fiscalYear}-${fiscalPeriod}`,
      periodStatus: {
        is_closed: true,
        period_code: `FY${fiscalYear}-P${String(fiscalPeriod).padStart(2, '0')}`,
        fiscal_year: fiscalYear,
        fiscal_period: fiscalPeriod
      }
    }
  }
  
  // Special cases for year-end transactions
  if (smartCode.includes('.YEAREND.') || smartCode.includes('.CLOSE.')) {
    // These are allowed even in closed periods by authorized users
    // Additional RBAC check would go here
    return {
      allowed: true,
      periodStatus: {
        is_closed: false,
        period_code: `FY${fiscalYear}-P${String(fiscalPeriod).padStart(2, '0')}`,
        fiscal_year: fiscalYear,
        fiscal_period: fiscalPeriod
      }
    }
  }
  
  return {
    allowed: true,
    periodStatus: {
      is_closed: false,
      period_code: `FY${fiscalYear}-P${String(fiscalPeriod).padStart(2, '0')}`,
      fiscal_year: fiscalYear,
      fiscal_period: fiscalPeriod
    }
  }
}

/**
 * Close a fiscal period
 */
export async function closeFiscalPeriod(params: {
  organizationId: string
  fiscalYear: number
  fiscalPeriod: number
  closedBy: string
}): Promise<{
  success: boolean
  periodId?: string
  error?: string
}> {
  const { organizationId, fiscalYear, fiscalPeriod, closedBy } = params
  const supabase = getSupabase()
  
  const periodCode = `FY${fiscalYear}-P${String(fiscalPeriod).padStart(2, '0')}`
  
  // First ensure period entity exists
  const { data: periodEntity } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'fiscal_period')
    .eq('entity_code', periodCode)
    .single()
    
  let periodId = periodEntity?.id
  
  if (!periodId) {
    // Create period entity
    const { data: newPeriod, error: createError } = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'fiscal_period',
        entity_name: `Fiscal Period ${fiscalYear}-${fiscalPeriod}`,
        entity_code: periodCode,
        smart_code: `HERA.FIN.PERIOD.${fiscalYear}.P${fiscalPeriod}.v1`,
        organization_id: organizationId,
        metadata: {
          fiscal_year: fiscalYear,
          fiscal_period: fiscalPeriod,
          period_start: new Date(fiscalYear, fiscalPeriod - 1, 1),
          period_end: new Date(fiscalYear, fiscalPeriod, 0)
        }
      })
      .select()
      .single()
      
    if (createError) {
      return { success: false, error: createError.message }
    }
    
    periodId = newPeriod.id
  }
  
  // Get closed status entity
  const { data: closedStatus } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'workflow_status')
    .eq('entity_code', 'STATUS-CLOSED')
    .single()
    
  if (!closedStatus) {
    return { success: false, error: 'Closed status not found in system' }
  }
  
  // Create status relationship
  const { error: relError } = await supabase
    .from('core_relationships')
    .insert({
      from_entity_id: periodId,
      to_entity_id: closedStatus.id,
      relationship_type: 'has_status',
      smart_code: 'HERA.FIN.PERIOD.CLOSE.v1',
      organization_id: organizationId,
      metadata: {
        closed_at: new Date().toISOString(),
        closed_by: closedBy,
        action: 'period_close'
      }
    })
    
  if (relError) {
    return { success: false, error: relError.message }
  }
  
  return { success: true, periodId }
}