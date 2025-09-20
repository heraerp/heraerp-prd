'use client'

import React, { useEffect, useState } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function SalonDashboardDebug() {
  const authContext = useHERAAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [storageInfo, setStorageInfo] = useState<any>({})

  useEffect(() => {
    // Get session info
    supabase.auth.getSession().then(({ data }) => {
      setSessionInfo(data.session)
    })

    // Get storage info
    setStorageInfo({
      localStorage: {
        'current-organization-id': localStorage.getItem('current-organization-id'),
        'current-organization-name': localStorage.getItem('current-organization-name'),
        'selected-organization': localStorage.getItem('selected-organization')
      },
      sessionStorage: {
        isDemoLogin: sessionStorage.getItem('isDemoLogin'),
        demoModule: sessionStorage.getItem('demoModule'),
        'demo-org-id': sessionStorage.getItem('demo-org-id')
      }
    })
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Salon Dashboard Debug Information</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Auth Context</h2>
        <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">
          {JSON.stringify(
            {
              user: authContext.user,
              isAuthenticated: authContext.isAuthenticated,
              isLoading: authContext.isLoading,
              contextLoading: authContext.isLoading,
              organization: authContext.organization,
              organizations: authContext.organizations
            },
            null,
            2
          )}
        </pre>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Supabase Session</h2>
        <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">
          {JSON.stringify(
            {
              hasSession: !!sessionInfo,
              user: sessionInfo?.user?.email,
              userId: sessionInfo?.user?.id
            },
            null,
            2
          )}
        </pre>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Storage Values</h2>
        <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">
          {JSON.stringify(storageInfo, null, 2)}
        </pre>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Expected Values</h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Organization ID: 0fd09e31-d257-4329-97eb-7d7f522ed6f0</li>
          <li>Organization Name: Hair Talkz Salon - DNA Testing</li>
          <li>Demo User: demo@herasalon.com</li>
          <li>Demo Module: salon</li>
        </ul>
      </Card>
    </div>
  )
}
