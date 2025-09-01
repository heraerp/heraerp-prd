'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'

export default function DebugIceCreamPage() {
  const [status, setStatus] = useState<any>({})
  const KOCHI_ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

  useEffect(() => {
    async function runDiagnostics() {
      const results: any = {}
      
      try {
        // 1. Check environment
        results.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        results.hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        // 2. Test API connection via universal API
        const products = await apiClient.getEntities(KOCHI_ORG_ID, 'product')
        const transactions = await apiClient.getTransactions(KOCHI_ORG_ID)
        const allEntities = await apiClient.getEntities(KOCHI_ORG_ID)
        
        results.organization = { name: 'Kochi Ice Cream Manufacturing', status: 'active' }
        results.productCount = products.length
        results.txnCount = transactions.length
        results.totalEntities = allEntities.length
        
        // 3. Sample data
        results.sampleProduct = products[0] || null
        results.sampleTransaction = transactions[0] || null
        
        // 4. Test API performance
        const startTime = Date.now()
        await apiClient.getEntities(KOCHI_ORG_ID, 'product', 10)
        results.apiResponseTime = Date.now() - startTime
        
        // API test completed successfully
        
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