'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { universalApi } from '@/lib/universal-api'

interface DataDebuggerProps {
  organizationId: string | undefined
}

export function DataDebugger({ organizationId }: DataDebuggerProps) {
  // Test Supabase connection first
  const {
    data: connection,
    isLoading: connectionLoading,
    error: connectionError
  } = useQuery({
    queryKey: ['debug', 'connection'],
    queryFn: async () => {
      console.log('🔍 Testing Supabase connection...')
      try {
        const orgResult = await universalApi.getOrganization('0fd09e31-d257-4329-97eb-7d7f522ed6f0')
        console.log('🏢 Organization result:', orgResult)
        return orgResult
      } catch (error) {
        console.error('❌ Connection test failed:', error)
        throw error
      }
    }
  })

  // Test fetching entities
  const {
    data: entities,
    isLoading: entitiesLoading,
    error: entitiesError
  } = useQuery({
    queryKey: ['debug', 'entities', organizationId],
    queryFn: async () => {
      if (!organizationId) return null
      console.log('🔍 Fetching entities for org:', organizationId)

      // Set organization ID in Universal API first
      universalApi.setOrganizationId(organizationId)

      const result = await universalApi.getEntities({
        organizationId: organizationId,
        pageSize: 10 // Limit for debug
      })
      console.log('📊 Entities result:', result)
      return result
    },
    enabled: !!organizationId
  })

  // Test fetching transactions
  const {
    data: transactions,
    isLoading: transactionsLoading,
    error: transactionsError
  } = useQuery({
    queryKey: ['debug', 'transactions', organizationId],
    queryFn: async () => {
      if (!organizationId) return null
      console.log('🔍 Fetching transactions for org:', organizationId)

      // Set organization ID in Universal API first
      universalApi.setOrganizationId(organizationId)

      const result = await universalApi.getTransactions({
        organizationId: organizationId,
        pageSize: 10 // Limit for debug
      })
      console.log('💰 Transactions result:', result)
      return result
    },
    enabled: !!organizationId
  })

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-sm">
      <h3 className="font-bold mb-2">📊 Data Debug</h3>
      <div className="space-y-2">
        <div>
          <strong>Org ID:</strong> {organizationId || 'None'}
        </div>

        <div>
          <strong>Connection:</strong>
          {connectionLoading ? ' Testing...' : connectionError ? ' Failed' : ' OK'}
          {connectionError && (
            <div className="text-red-400 text-xs">Error: {String(connectionError)}</div>
          )}
          {connection?.success && <div className="text-green-400 text-xs">Connected ✓</div>}
        </div>

        <div>
          <strong>Entities:</strong>
          {entitiesLoading
            ? ' Loading...'
            : entitiesError
              ? ' Error'
              : ` ${entities?.data?.length || 0} items`}
          {entitiesError && (
            <div className="text-red-400 text-xs">Error: {String(entitiesError)}</div>
          )}
        </div>

        <div>
          <strong>Transactions:</strong>
          {transactionsLoading
            ? ' Loading...'
            : transactionsError
              ? ' Error'
              : ` ${transactions?.data?.length || 0} items`}
          {transactionsError && (
            <div className="text-red-400 text-xs">Error: {String(transactionsError)}</div>
          )}
        </div>

        {connection?.data && (
          <div>
            <strong>Org Name:</strong>
            <div className="text-xs text-green-400">{connection.data.organization_name}</div>
          </div>
        )}

        {entities?.data && entities.data.length > 0 && (
          <div>
            <strong>Sample Entity:</strong>
            <div className="text-xs mt-1 p-1 bg-gray-700 rounded max-h-20 overflow-y-auto">
              {JSON.stringify(entities.data[0], null, 2).substring(0, 200)}...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
