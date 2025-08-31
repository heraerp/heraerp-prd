'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase-client'

export default function DebugIceCreamPage() {
  const [status, setStatus] = useState<any>({})
  const KOCHI_ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

  useEffect(() => {
    async function runDiagnostics() {
      const results: any = {}
      
      try {
        // 1. Check Supabase connection
        results.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        results.hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        // 2. Test organization query
        const { data: org, error: orgError } = await supabaseClient
          .from('core_organizations')
          .select('organization_name, organization_code')
          .eq('id', KOCHI_ORG_ID)
          .single()
          
        if (orgError) {
          results.orgError = orgError.message
        } else {
          results.organization = org
        }
        
        // 3. Count entities
        const { count: productCount, error: productError } = await supabaseClient
          .from('core_entities')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', KOCHI_ORG_ID)
          .eq('entity_type', 'product')
          
        if (productError) {
          results.productError = productError.message
        } else {
          results.productCount = productCount
        }
        
        // 4. Count transactions
        const { count: txnCount, error: txnError } = await supabaseClient
          .from('universal_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', KOCHI_ORG_ID)
          
        if (txnError) {
          results.txnError = txnError.message
        } else {
          results.transactionCount = txnCount
        }
        
        // 5. Test with explicit anon key
        const headers = {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
        }
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_entities?organization_id=eq.${KOCHI_ORG_ID}&entity_type=eq.product&limit=1`,
          { headers }
        )
        
        results.directApiStatus = response.status
        results.directApiOk = response.ok
        
        if (!response.ok) {
          const text = await response.text()
          results.directApiError = text
        }
        
      } catch (error: any) {
        results.unexpectedError = error.message
      }
      
      setStatus(results)
    }
    
    runDiagnostics()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ice Cream Dashboard Debug</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-semibold mb-2">Environment</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              supabaseUrl: status.supabaseUrl,
              hasAnonKey: status.hasAnonKey,
              organizationId: KOCHI_ORG_ID
            }, null, 2)}
          </pre>
        </div>
        
        {status.organization && (
          <div className="bg-green-100 dark:bg-green-900 p-4 rounded">
            <h2 className="font-semibold mb-2">✅ Organization Found</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(status.organization, null, 2)}
            </pre>
          </div>
        )}
        
        {status.orgError && (
          <div className="bg-red-100 dark:bg-red-900 p-4 rounded">
            <h2 className="font-semibold mb-2">❌ Organization Error</h2>
            <p>{status.orgError}</p>
          </div>
        )}
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-semibold mb-2">Data Counts</h2>
          <ul className="space-y-1">
            <li>Products: {status.productCount ?? 'Loading...'} {status.productError && `(Error: ${status.productError})`}</li>
            <li>Transactions: {status.transactionCount ?? 'Loading...'} {status.txnError && `(Error: ${status.txnError})`}</li>
          </ul>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="font-semibold mb-2">Direct API Test</h2>
          <ul className="space-y-1">
            <li>Status: {status.directApiStatus}</li>
            <li>OK: {status.directApiOk ? 'Yes' : 'No'}</li>
            {status.directApiError && (
              <li className="text-red-600">Error: {status.directApiError}</li>
            )}
          </ul>
        </div>
        
        {status.unexpectedError && (
          <div className="bg-red-100 dark:bg-red-900 p-4 rounded">
            <h2 className="font-semibold mb-2">❌ Unexpected Error</h2>
            <p>{status.unexpectedError}</p>
          </div>
        )}
      </div>
      
      <div className="mt-8 p-4 bg-blue-100 dark:bg-blue-900 rounded">
        <h2 className="font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Deploy this debug page to production</li>
          <li>Visit https://heraerp.com/debug-icecream</li>
          <li>Check the results to identify connection issues</li>
          <li>Common issues: Missing env vars, CORS, RLS policies</li>
        </ol>
      </div>
    </div>
  )
}