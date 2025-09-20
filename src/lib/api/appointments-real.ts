// ================================================================================
// HERA REAL APPOINTMENTS API
// Uses universal_transactions table for real appointment data
// ================================================================================

import { getSupabase } from '../supabase'
import { useQuery } from '@tanstack/react-query'

interface RealAppointment {
  id: string
  datetime: string
  customer_name: string
  stylist_name: string
  service_name: string
  status: string
}

export function useRealAppointmentsList({ 
  organizationId, 
  dateFrom, 
  dateTo 
}: { 
  organizationId: string
  dateFrom: string
  dateTo: string
}) {
  return useQuery({
    queryKey: ['appointments', 'real', organizationId, dateFrom, dateTo],
    queryFn: async () => {
      console.log('📅 Fetching real appointments:', { organizationId, dateFrom, dateTo })
      
      if (!organizationId) {
        console.log('⚠️ No organization ID provided')
        return { appointments: [] }
      }
      
      const supabase = getSupabase()
      
      // Construct the date range for today
      const startDate = dateFrom + 'T00:00:00.000Z'
      const endDate = dateTo + 'T23:59:59.999Z'
      
      
      // Query appointments from universal_transactions
      const { data: transactions, error } = await supabase
        .from('universal_transactions')
        .select(`
          id,
          transaction_date,
          transaction_status,
          metadata,
          source_entity_id,
          target_entity_id,
          source_entity:core_entities!universal_transactions_source_entity_id_fkey(entity_name),
          target_entity:core_entities!universal_transactions_target_entity_id_fkey(entity_name)
        `)
        .eq('organization_id', organizationId)
        .eq('transaction_type', 'appointment')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: true })
      
      if (error) {
        console.error('❌ Error fetching appointments:', error)
        throw error // Throw error so React Query can handle it
      }
      
      console.log(`✅ Found ${transactions?.length || 0} appointments`)
      
      // Transform to appointment format
      const appointments: RealAppointment[] = (transactions || []).map(txn => ({
        id: txn.id,
        datetime: txn.transaction_date,
        customer_name: txn.source_entity?.entity_name || 'Unknown Customer',
        stylist_name: txn.target_entity?.entity_name || 'Unassigned',
        service_name: txn.metadata?.service_name || 'Service',
        status: txn.transaction_status || 'confirmed'
      }))
      
      
      return { appointments }
    },
    enabled: !!organizationId,
    retry: 1, // Only retry once
    staleTime: 0, // Always consider data stale
    refetchOnMount: 'always' // Always refetch on mount
  })
}

// Get appointment stats for KPI cards
export function useRealAppointmentStats({ organizationId, date }: { organizationId: string; date: string }) {
  return useQuery({
    queryKey: ['appointments', 'real-stats', organizationId, date],
    queryFn: async () => {
      const supabase = getSupabase()
      
      const { data, error } = await supabase
        .from('universal_transactions')
        .select('id, transaction_status')
        .eq('organization_id', organizationId)
        .eq('transaction_type', 'appointment')
        .gte('transaction_date', date + 'T00:00:00Z')
        .lte('transaction_date', date + 'T23:59:59Z')
      
      if (error) {
        console.error('Error fetching appointment stats:', error)
        return { total: 0, confirmed: 0, in_progress: 0 }
      }
      
      const total = data?.length || 0
      const confirmed = data?.filter(a => a.transaction_status === 'confirmed').length || 0
      const in_progress = data?.filter(a => a.transaction_status === 'in_progress').length || 0
      
      return { total, confirmed, in_progress }
    },
    enabled: !!organizationId && !!date
  })
}