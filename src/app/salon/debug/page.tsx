'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function DebugPage() {
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    async function getInfo() {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      setInfo({
        hasSession: !!session,
        userEmail: session?.user?.email || 'Not logged in',
        userId: session?.user?.id || 'N/A',
        userMetadata: session?.user?.user_metadata || {},
        localStorage: {
          organizationId: localStorage.getItem('organizationId'),
          salonRole: localStorage.getItem('salonRole'),
          salonUserName: localStorage.getItem('salonUserName')
        },
        currentPath: window.location.pathname,
        timestamp: new Date().toISOString()
      })
    }

    getInfo()
  }, [])

  const clearAll = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    window.location.href = '/salon/auth'
  }

  return (
    <div
      style={{
        padding: '40px',
        backgroundColor: '#0B0B0B',
        color: '#F5E6C8',
        minHeight: '100vh',
        fontFamily: 'monospace'
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Debug Information</h1>

      <pre
        style={{
          backgroundColor: '#1A1A1A',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #8C7853',
          overflow: 'auto'
        }}
      >
        {JSON.stringify(info, null, 2)}
      </pre>

      <button
        onClick={clearAll}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#DC2626',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Clear Everything & Sign Out
      </button>

      <div style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Quick Links:</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/salon/auth" style={{ color: '#D4AF37' }}>
            Auth Page
          </a>
          <a href="/salon/dashboard" style={{ color: '#D4AF37' }}>
            Dashboard
          </a>
          <a href="/salon/owner" style={{ color: '#D4AF37' }}>
            Owner
          </a>
          <a href="/salon/test-login" style={{ color: '#D4AF37' }}>
            Test Login
          </a>
        </div>
      </div>
    </div>
  )
}
