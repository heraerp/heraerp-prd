/*
 * HERA Vendors Test Page - Bypass Enterprise Layout
 * Testing vendors functionality without enterprise routing issues
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Briefcase } from 'lucide-react'

export default function VendorsTestPage() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Simple Header */}
      <nav className="h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="h-full px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">HERA Vendors Test</h1>
          <div className="text-sm text-slate-600">Testing vendors without enterprise layout</div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Vendor Management Test</h2>
            
            <div className="space-y-4">
              <p className="text-slate-600">
                This is a test page to verify that vendor functionality works without the enterprise layout.
              </p>
              
              <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800">✅ Route Working</h3>
                <p className="text-green-700 text-sm">
                  If you can see this page, the routing system is working correctly.
                </p>
              </div>

              <div className="p-4 bg-blue-100 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800">🔗 Test Links</h3>
                <div className="space-y-2 mt-2">
                  <div>
                    <a href="/enterprise/procurement/vendors" className="text-blue-600 underline">
                      Try Enterprise Vendors Page
                    </a>
                    <span className="text-sm text-gray-500 ml-2">(might be broken)</span>
                  </div>
                  <div>
                    <a href="/control-center" className="text-blue-600 underline">
                      HERA Control Center
                    </a>
                    <span className="text-sm text-gray-500 ml-2">(should work)</span>
                  </div>
                  <div>
                    <a href="/" className="text-blue-600 underline">
                      Home Page
                    </a>
                    <span className="text-sm text-gray-500 ml-2">(should work)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-100 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800">🔍 Diagnosis</h3>
                <p className="text-yellow-700 text-sm">
                  The enterprise layout appears to have import or dependency issues that are causing 404 errors 
                  for all /enterprise/* routes. This test page bypasses that layout to verify the vendors 
                  functionality itself is working.
                </p>
              </div>

              {/* Sample Vendor Card */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Sample Vendor Design</h3>
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-slate-800">ABC Trading Company</h4>
                      <p className="text-sm text-slate-600">VEN001</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Briefcase size={12} className="text-purple-600" />
                        <span className="text-xs text-slate-500">SUPPLIER</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-slate-600 mb-4">
                    <div>📧 contact@abctrading.com</div>
                    <div>📞 +971 50 123 4567</div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-500">ID: abc12345...</div>
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors">
                        <Edit className="w-3 h-3 text-purple-600" />
                      </button>
                      <button className="p-1.5 hover:bg-red-100 rounded-lg transition-colors">
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}