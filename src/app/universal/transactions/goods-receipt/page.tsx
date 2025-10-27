'use client'

import React from 'react'
import UniversalTransaction from '@/components/universal/transactions/UniversalTransaction'
import { Package, Truck, CheckCircle, Shield } from 'lucide-react'

export default function GoodsReceiptPage() {
  const handleSave = async (header: any, lines: any) => {
    console.log('💾 Saving goods receipt:', { header, lines })
    // In production, call HERA API v2
  }

  const handlePost = async (header: any, lines: any) => {
    console.log('📨 Posting goods receipt:', { header, lines })
    // In production, call HERA transactions post RPC
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50">
      {/* Mobile Status Bar Spacer */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-purple-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Goods Receipt</h1>
              <p className="text-xs text-gray-600">Inventory Receiving</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="bg-white border-b border-purple-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Goods Receipt</h1>
                  <p className="text-sm text-gray-600">Inventory Receiving & Stock Management</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section - Desktop */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-r from-purple-100 to-violet-100 rounded-2xl p-8 border border-purple-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Inventory Receiving Operations
                </h2>
                <p className="text-gray-700 mb-6 max-w-2xl">
                  Record goods received from suppliers, update inventory levels, manage quality control, 
                  and track warehouse operations with complete traceability.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-200 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Receiving Process</div>
                      <div className="text-sm text-gray-600">Streamlined workflows</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-200 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Quality Control</div>
                      <div className="text-sm text-gray-600">Inspection & validation</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Compliance</div>
                      <div className="text-sm text-gray-600">Regulatory standards</div>
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
            mode="goods_receipt"
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