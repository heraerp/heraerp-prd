'use client'

import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export default function TestAuthPage() {
  const { user, organization, isAuthenticated, isLoading } = useHERAAuth()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">HERA Authentication Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">Current State:</h2>
        <div className="space-y-1 text-sm">
          <div>Loading: {isLoading ? '🔄 Yes' : '✅ No'}</div>
          <div>Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
          <div>User ID: {user?.id || 'None'}</div>
          <div>User Email: {user?.email || 'None'}</div>
          <div>Organization: {organization?.name || 'None'}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Fast Track Test URLs:</h3>
          <div className="space-y-2 text-sm">
            <div>
              <a 
                href="/test-auth?forcehair=true" 
                className="text-blue-600 hover:underline"
              >
                Force Michele's Account
              </a>
            </div>
            <div>
              <a 
                href="/test-auth?userid=2300a665-6650-4f4c-8e85-c1a7e8f2973d" 
                className="text-blue-600 hover:underline"
              >
                Force Live Account  
              </a>
            </div>
            <div>
              <a 
                href="/test-auth?userid=3ced4979-4c09-4e1e-8667-6707cfe6ec77" 
                className="text-blue-600 hover:underline"
              >
                Force Michele AE Account
              </a>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Navigation Speed Test:</h3>
          <div className="space-y-2 text-sm">
            <div>
              <a 
                href="/salon/dashboard" 
                className="text-green-600 hover:underline"
              >
                Salon Dashboard
              </a>
            </div>
            <div>
              <a 
                href="/salon/appointments" 
                className="text-blue-600 hover:underline"
              >
                Salon Appointments
              </a>
            </div>
            <div>
              <a 
                href="/salon/customers" 
                className="text-purple-600 hover:underline"
              >
                Salon Customers
              </a>
            </div>
            <div>
              <a 
                href="/test-auth" 
                className="text-orange-600 hover:underline"
              >
                Back to Test Auth
              </a>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click between these links rapidly to test navigation speed. 
            Should be instant with no loading delays.
          </p>
        </div>
      </div>

      {isAuthenticated && (
        <div className="mt-6 p-4 bg-green-100 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">✅ Authentication Successful!</h3>
          <div className="text-sm text-green-700">
            <div>Welcome, {user?.name || user?.email}</div>
            <div>Organization: {organization?.name}</div>
            <div>Role: {user?.role}</div>
          </div>
        </div>
      )}
    </div>
  )
}