'use client'

import React from 'react'
import UniversalTransaction from '@/components/universal/transactions/UniversalTransaction'
import { ShoppingCart, TrendingUp, Users, DollarSign } from 'lucide-react'

export default function SalesTransactionPage() {
  const handleSave = async (header: any, lines: any) => {
    console.log('💾 Saving sales transaction:', { header, lines })
    // In production, call HERA API v2
    // await apiV2.post('transactions/save', { header, lines })
  }

  const handlePost = async (header: any, lines: any) => {
    console.log('📨 Posting sales transaction:', { header, lines })
    // In production, call HERA transactions post RPC
    // await callRPC('hera_transactions_post_v2', { 
    //   p_organization_id: header.organization_id,
    //   p_actor_user_id: 'current-user',
    //   p_header: header,
    //   p_lines: lines
    // })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Mobile Status Bar Spacer */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-green-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Sales Transaction</h1>
              <p className="text-xs text-gray-600">POS & Invoice Processing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="bg-white border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Sales Transaction</h1>
                  <p className="text-sm text-gray-600">Point of Sale & Invoice Processing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section - Desktop */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-8 border border-green-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Sales & Revenue Processing
                </h2>
                <p className="text-gray-700 mb-6 max-w-2xl">
                  Process customer sales, generate invoices, handle returns, and manage payments. 
                  Automatic tax calculation, GL posting, and audit trail included.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-200 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Revenue Recognition</div>
                      <div className="text-sm text-gray-600">Automatic GL posting</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Customer Management</div>
                      <div className="text-sm text-gray-600">Integrated CRM</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-200 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Real-time Analytics</div>
                      <div className="text-sm text-gray-600">Business intelligence</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Transaction Component */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <UniversalTransaction
            mode="sale"
            organization_id="current-org-id"
            onSave={handleSave}
            onPost={handlePost}
          />
        </div>
      </div>

      {/* Mobile Bottom Spacing */}
      <div className="h-24 md:h-0" />
    </div>
  )
}