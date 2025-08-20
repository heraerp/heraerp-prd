'use client'

import React, { useEffect } from 'react'

export default function LoginPage() {
  useEffect(() => {
    // Redirect to unified auth login
    window.location.href = '/auth/login'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse shadow-lg">
          <span className="text-2xl font-bold text-white">H</span>
        </div>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  )
}