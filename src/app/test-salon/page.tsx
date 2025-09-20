'use client'

import React from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { DemoOrgDebug } from '@/components/debug/DemoOrgDebug'

export default function TestSalonPage() {
  const { user, currentOrganization, organizations, isAuthenticated, isLoading, isLoadingOrgs } =
    useMultiOrgAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">
          🧪 Salon Demo Test Page
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authentication Status */}
          <div className="bg-white/80 backdrop-blur-xl border border-purple-200/50 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-purple-800">Authentication Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Loading:</span>
                <span className={isLoading || isLoadingOrgs ? 'text-amber-600' : 'text-green-600'}>
                  {isLoading || isLoadingOrgs ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Authenticated:</span>
                <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {isAuthenticated ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-white/80 backdrop-blur-xl border border-purple-200/50 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-purple-800">User Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Name:</span>
                <span>{user?.name || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span>{user?.email || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Role:</span>
                <span className="capitalize">{user?.role || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Organization Information */}
          <div className="bg-white/80 backdrop-blur-xl border border-purple-200/50 rounded-lg p-6 shadow-xl md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-purple-800">Organization Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium mb-2">Current Organization</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span>{currentOrganization?.name || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ID:</span>
                    <span className="font-mono text-xs">{currentOrganization?.id || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="capitalize">{currentOrganization?.type || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="capitalize">
                      {currentOrganization?.subscription_plan || 'None'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Available Organizations</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{organizations.length}</span>
                  </div>
                  {organizations.map((org, index) => (
                    <div key={org.id} className="text-xs text-gray-600">
                      {index + 1}. {org.name} ({org.type})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-xl border border-purple-200/50 rounded-lg p-6 shadow-xl md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-purple-800">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <a
                href="/dashboard"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Go to Dashboard
              </a>
              <a
                href="/appointments"
                className="px-4 py-2 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-lg hover:from-rose-500 hover:to-amber-500 transition-all"
              >
                View Appointments
              </a>
              <a
                href="/salon"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                Salon Demo
              </a>
            </div>
          </div>
        </div>

        {/* Debug component */}
        <DemoOrgDebug />
      </div>
    </div>
  )
}
