'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { HealthcarePracticeSidebar } from '@/components/healthcare-progressive/HealthcarePracticeSidebar'

export default function HealthcarePracticeHomePage() {
  const { user, workspace } = useAuth()
  const [selectedModule, setSelectedModule] = useState('dashboard')

  return (
    <div className="min-h-screen bg-white flex">
      <HealthcarePracticeSidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-light text-gray-900">Healthcare Practice</h1>
            <p className="text-sm text-gray-500">{user?.organizationName || 'Sample Business'}</p>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-thin text-gray-900 mb-4">
              Welcome to your Healthcare Practice system
            </h2>
            <p className="text-xl text-gray-600 font-light mb-8">
              Built with HERA DNA - Progressive, Universal, Intelligent
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {["appointments","patients","billing","prescriptions","reports"].map((module) => (
                <div 
                  key={module}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                    {module.replace('_', ' ')}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Manage your {module} operations with ease
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}