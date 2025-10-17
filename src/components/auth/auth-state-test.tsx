'use client'

import React from 'react'
import { useHERAAuth } from './HERAAuthProvider'

export function AuthStateTest() {
  const auth = useHERAAuth()
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs max-w-xs z-50">
      <div className="font-semibold mb-1">Auth State Test</div>
      <div>Authenticated: {auth.isAuthenticated ? '✅' : '❌'}</div>
      <div>Loading: {auth.isLoading ? '⏳' : '✅'}</div>
      <div>User: {auth.user?.email || 'None'}</div>
      <div>Org: {auth.organization?.name || 'None'}</div>
      <div>From Cache: {sessionStorage.getItem('heraAuthState') ? '💾' : '🔄'}</div>
    </div>
  )
}