

/**
 * CRM Sales Team Management
 * Smart Code: HERA.DEMO.CRM.SALES_REPS.v1
 */

import React from 'react'
import { Users, Plus, Target, TrendingUp } from 'lucide-react'

export default function SalesRepsPage() {
  const salesReps = [
    {
      id: 'REP-001',
      name: 'Alice Johnson',
      role: 'Sales Representative',
      quota: '$500,000',
      achieved: '$387,500',
      percentage: 77.5,
      deals: 12,
      territory: 'North America'
    },
    {
      id: 'REP-002',
      name: 'Bob Smith',
      role: 'Sales Manager',
      quota: '$2,000,000',
      achieved: '$1,650,000',
      percentage: 82.5,
      deals: 24,
      territory: 'North America'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Team</h1>
          <p className="text-gray-600">Manage sales representatives and territories</p>
        </div>
        <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Sales Rep</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {salesReps.map((rep) => (
          <div key={rep.id} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{rep.name[0]}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{rep.name}</h3>
                <p className="text-sm text-gray-600">{rep.role}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Quota:</span>
                <span className="text-sm font-semibold">{rep.quota}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Achieved:</span>
                <span className="text-sm font-semibold text-green-600">{rep.achieved}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Performance:</span>
                <span className={`text-sm font-semibold ${rep.percentage >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                  {rep.percentage}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Deals:</span>
                <span className="text-sm font-semibold">{rep.deals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Territory:</span>
                <span className="text-sm">{rep.territory}</span>
              </div>
            </div>

            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                style={{ width: `${Math.min(rep.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200/50">
        <h3 className="font-semibold text-gray-900 mb-2">Sales Team Management</h3>
        <p className="text-sm text-gray-600">
          Track sales performance, manage territories, and optimize team productivity.
        </p>
      </div>
    </div>
  )
}