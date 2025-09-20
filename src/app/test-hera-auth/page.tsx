'use client'

import React from 'react'
import { HERAAuthProvider, useHERAAuth } from '@/components/auth/HERAAuthProvider'

function AuthTestContent() {
  const {
    user,
    organization,
    isAuthenticated,
    isLoading,
    scopes,
    hasScope,
    sessionType,
    timeRemaining,
    isExpired,
    initializeDemo,
    logout
  } = useHERAAuth()

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 1000 / 60)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const testScopes = [
    'read:HERA.SALON.SERVICE.APPOINTMENT',
    'write:HERA.SALON.SERVICE.APPOINTMENT',
    'read:HERA.SALON.CRM.CUSTOMER',
    'write:HERA.SALON.CRM.CUSTOMER',
    'read:HERA.SALON.SERVICE.CATALOG',
    'read:HERA.SALON.INVENTORY.PRODUCT',
    'read:HERA.SALON.FIN.GL.ACCOUNT' // Should be restricted
  ]

  const handleInitializeDemo = async () => {
    const success = await initializeDemo('salon-receptionist')
    console.log('Demo initialization result:', success)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading HERA Auth...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🧬 HERA Auth Provider Test</h1>

          {/* Authentication Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Authentication Status</h2>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Authenticated:</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isAuthenticated ? '✅ Yes' : '❌ No'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Session Type:</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      sessionType === 'demo'
                        ? 'bg-blue-100 text-blue-800'
                        : sessionType === 'real'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {sessionType || 'None'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Expired:</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {isExpired ? '⚠️ Yes' : '✅ No'}
                  </span>
                </div>

                {timeRemaining > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Time Remaining:</span>
                    <span className="text-blue-600 font-mono">{formatTime(timeRemaining)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* User Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">User Information</h2>

              {user ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> {user.id}
                  </div>
                  <div>
                    <span className="font-medium">Entity ID:</span> {user.entity_id}
                  </div>
                  <div>
                    <span className="font-medium">Name:</span> {user.name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {user.email}
                  </div>
                  <div>
                    <span className="font-medium">Role:</span> {user.role}
                  </div>
                  <div>
                    <span className="font-medium">Session:</span> {user.session_type}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No user data</p>
              )}
            </div>
          </div>

          {/* Organization Information */}
          {organization && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Organization Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID:</span> {organization.id}
                </div>
                <div>
                  <span className="font-medium">Name:</span> {organization.name}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {organization.type}
                </div>
                <div>
                  <span className="font-medium">Industry:</span> {organization.industry}
                </div>
              </div>
            </div>
          )}

          {/* Authorization Scopes */}
          {scopes.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Authorization Scopes ({scopes.length})
              </h2>
              <div className="space-y-2">
                {testScopes.map(scope => (
                  <div key={scope} className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        hasScope(scope) ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span
                      className={`text-sm font-mono ${
                        hasScope(scope) ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {scope}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        hasScope(scope) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {hasScope(scope) ? 'Authorized' : 'Denied'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            {!isAuthenticated ? (
              <button
                onClick={handleInitializeDemo}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Initialize Salon Demo
              </button>
            ) : (
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            )}

            <a
              href="/salon/dashboard"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Go to Salon Dashboard
            </a>
          </div>
        </div>

        {/* Raw State Debug */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
          <h3 className="text-white font-bold mb-2">Raw State (Debug)</h3>
          <pre>
            {JSON.stringify(
              {
                isAuthenticated,
                isLoading,
                sessionType,
                user: user
                  ? {
                      id: user.id,
                      entity_id: user.entity_id,
                      role: user.role,
                      session_type: user.session_type
                    }
                  : null,
                organization: organization
                  ? {
                      id: organization.id,
                      name: organization.name,
                      type: organization.type
                    }
                  : null,
                scopesCount: scopes.length,
                timeRemaining: Math.round(timeRemaining / 1000),
                isExpired
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default function HERAAuthTestPage() {
  return (
    <HERAAuthProvider>
      <AuthTestContent />
    </HERAAuthProvider>
  )
}
