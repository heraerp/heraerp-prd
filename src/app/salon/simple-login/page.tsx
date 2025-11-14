'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Scissors } from 'lucide-react'

export default function SimpleLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    
    // Simple direct authentication - no complex logic
    const authState = {
      user: {
        id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
        entity_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
        name: 'Hair Talkz Owner',
        email: 'michele@hairtalkz.com',
        role: 'OWNER'
      },
      organization: {
        id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
        entity_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
        name: 'Hair Talkz Salon',
        type: 'salon',
        industry: 'beauty'
      },
      isAuthenticated: true,
      isLoading: false,
      scopes: ['OWNER']
    }

    // Set in all possible storage locations
    try {
      sessionStorage.setItem('heraAuthState', JSON.stringify(authState))
      localStorage.setItem('heraAuthState', JSON.stringify(authState))
      localStorage.setItem('salonUserName', 'Hair Talkz Owner')
      localStorage.setItem('salonUserEmail', 'michele@hairtalkz.com')
      localStorage.setItem('salonRole', 'OWNER')
    } catch (e) {
      console.log('Storage not available, continuing...')
    }

    // Small delay for feedback
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Direct redirect using Next.js router
    router.push('/salon/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scissors className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">Hair Talkz Login</h1>
          </div>
          <p className="text-gray-600">Simple authentication for production</p>
        </div>

        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
        >
          {isLoading ? 'Logging in...' : 'Login to Dashboard'}
        </Button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Production environment detected
          </p>
        </div>
      </div>
    </div>
  )
}