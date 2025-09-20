'use client'

import { useState } from 'react'

export default function DemoPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSalonDemo = () => {
    setIsLoading(true)
    window.location.href = '/demo/salon'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Experience HERA ERP
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Try our industry-specific ERP solutions with real demo data. 
            No registration required.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-2">Hair Talkz Salon</h3>
            <p className="text-gray-600 mb-4">
              Beauty salon management with appointment booking and client management
            </p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span>Duration: 30 minutes</span>
              <span>Role: Demo Receptionist</span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="text-sm font-medium text-gray-700">Features:</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  Appointment Management
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  Customer Database  
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  Service Catalog
                </span>
              </div>
            </div>

            <button 
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              disabled={isLoading}
              onClick={handleSalonDemo}
            >
              {isLoading ? 'Launching Demo...' : 'Try Salon Demo'}
            </button>
          </div>
        </div>

        <div className="text-center mt-12 p-6 bg-blue-50 rounded-lg max-w-2xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-2">
            🧬 Powered by HERA Authorization DNA
          </h3>
          <p className="text-sm text-blue-700">
            Demo sessions are automatically configured with appropriate permissions and sample data. 
            Sessions expire after 30 minutes for security.
          </p>
        </div>
      </div>
    </div>
  )
}