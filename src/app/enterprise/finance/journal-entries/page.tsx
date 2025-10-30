'use client'

import React from 'react'
import JournalEntryTransaction from '@/components/enterprise/finance/JournalEntryTransaction'
import { BookOpen, Plus, History, FileText, TrendingUp, Calculator } from 'lucide-react'

export default function JournalEntriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Status Bar Spacer */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Journal Entries</h1>
              <p className="text-xs text-slate-600">Manual GL Posting</p>
            </div>
          </div>
          <button className="min-w-[44px] min-h-[44px] rounded-full bg-blue-50 flex items-center justify-center active:scale-95 transition-transform">
            <Plus className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Journal Entries</h1>
                  <p className="text-sm text-slate-600">Manual General Ledger Posting & Adjustments</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                  <History className="w-4 h-4" />
                  Recent Entries
                </button>
                <button className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                  <FileText className="w-4 h-4" />
                  Templates
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  New Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Welcome Card */}
      <div className="md:hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 m-4 rounded-2xl">
        <h2 className="text-xl font-bold mb-2">Create Journal Entry</h2>
        <p className="text-blue-100 text-sm mb-4">
          Record manual transactions, adjustments, and accruals with automatic balance validation
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-lg p-3">
            <Calculator className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Auto Tax Calc</span>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <TrendingUp className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Balance Check</span>
          </div>
        </div>
      </div>

      {/* Quick Actions - Mobile */}
      <div className="md:hidden px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-transform">
            <FileText className="w-6 h-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-slate-900 block">Templates</span>
            <span className="text-xs text-slate-500">Quick start</span>
          </button>
          <button className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-transform">
            <History className="w-6 h-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-slate-900 block">Recent</span>
            <span className="text-xs text-slate-500">View history</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Desktop Welcome Section */}
        <div className="hidden md:block mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  Create Manual Journal Entry
                </h2>
                <p className="text-slate-600 mb-6 max-w-2xl">
                  Record manual transactions, period-end adjustments, accruals, and corrections. 
                  Our system automatically validates DR = CR balance and calculates taxes according to HERA universal standards.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Automatic Tax Calculation</div>
                      <div className="text-sm text-slate-600">Universal VAT & multi-currency</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Balance Validation</div>
                      <div className="text-sm text-slate-600">Real-time DR = CR checking</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Complete Audit Trail</div>
                      <div className="text-sm text-slate-600">WHO, WHEN, WHY tracking</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="ml-8">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">Enterprise Ready</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Full integration with HERA Sacred Six architecture
                    </p>
                    <div className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                      ✓ Production Tested
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Journal Entry Component */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <JournalEntryTransaction />
        </div>
        
        {/* Help Section - Desktop */}
        <div className="hidden md:block mt-8">
          <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Journal Entry Guide
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Common Entry Types</h4>
                <ul className="text-sm text-gray-900 space-y-1 hera-financial-text">
                  <li>• Asset purchases with VAT</li>
                  <li>• Depreciation adjustments</li>
                  <li>• Accrued expenses</li>
                  <li>• Prepaid amortization</li>
                  <li>• Currency revaluations</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Balance Requirements</h4>
                <ul className="text-sm text-gray-900 space-y-1 hera-financial-text">
                  <li>• Total debits must equal total credits</li>
                  <li>• Each line requires valid account code</li>
                  <li>• Cost center allocation mandatory</li>
                  <li>• Tax codes required for VAT items</li>
                  <li>• Reference numbers for audit trail</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Best Practices</h4>
                <ul className="text-sm text-gray-900 space-y-1 hera-financial-text">
                  <li>• Use descriptive line descriptions</li>
                  <li>• Include supporting document refs</li>
                  <li>• Review tax calculations carefully</li>
                  <li>• Verify cost center allocations</li>
                  <li>• Save drafts before posting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Spacing */}
      <div className="h-24 md:h-0" />
    </div>
  )
}