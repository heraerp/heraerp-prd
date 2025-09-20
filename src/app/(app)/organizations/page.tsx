// ================================================================================
// HERA ORGANIZATIONS PAGE
// Smart Code: HERA.ORGANIZATIONS.PAGE.v1
// Organization management page
// ================================================================================

'use client'

import React from 'react'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { Building2, Plus, Settings, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function OrganizationsPage() {
  const { organizations, currentOrganization, switchOrganization } = useOrganization()

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-lg font-semibold text-white">Organizations</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Create New Organization */}
          <div className="mb-8">
            <button className="w-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-gray-500 hover:bg-gray-700/50 transition-all group">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-white">Create New Organization</h3>
                <p className="text-sm text-gray-400 max-w-md text-center">
                  Start a new organization for a different business or department
                </p>
              </div>
            </button>
          </div>

          {/* Organization Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map(org => (
              <div
                key={org.id}
                className={`bg-gray-800 rounded-lg border ${
                  currentOrganization?.id === org.id
                    ? 'border-blue-500 ring-2 ring-blue-500/50'
                    : 'border-gray-700'
                } hover:border-gray-600 transition-all`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    {org.subscription_status === 'trial' && (
                      <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                        Trial - {org.trial_days_left} days
                      </span>
                    )}
                    {org.subscription_status === 'active' && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-1">{org.name}</h3>
                  <p className="text-sm text-gray-400 capitalize mb-4">Your role: {org.role}</p>

                  {/* Quick Stats */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Apps Installed</span>
                      <span className="text-white font-medium">{org.installed_apps.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Team Members</span>
                      <span className="text-white font-medium">5</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Monthly Usage</span>
                      <span className="text-white font-medium">12,847 API calls</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    {currentOrganization?.id !== org.id && (
                      <button
                        onClick={() => switchOrganization(org.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      >
                        Switch to this Org
                      </button>
                    )}
                    {currentOrganization?.id === org.id && (
                      <div className="flex-1 bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-center text-sm font-medium">
                        Current Organization
                      </div>
                    )}
                    <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                      <Settings className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
