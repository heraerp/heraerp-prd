

/**
 * CRM Quotes Management
 * Smart Code: HERA.DEMO.CRM.QUOTES.v1
 */

import React from 'react'
import { FileText, Plus, DollarSign } from 'lucide-react'

export default function QuotesPage() {
  const quotes = [
    {
      id: 'QUO-001',
      name: 'Acme ERP Quote',
      customer: 'Acme Corporation',
      amount: '$250,000',
      status: 'Sent',
      date: '2024-01-15',
      expiry: '2024-02-15'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quote Management</h1>
          <p className="text-gray-600">Generate and manage sales quotes</p>
        </div>
        <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Quote</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotes.map((quote) => (
          <div key={quote.id} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{quote.name}</h3>
                <p className="text-sm text-gray-600">{quote.customer}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="text-sm font-semibold">{quote.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="text-sm font-semibold text-green-600">{quote.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm">{quote.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Expires:</span>
                <span className="text-sm">{quote.expiry}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200/50">
        <h3 className="font-semibold text-gray-900 mb-2">Quote Generation Features</h3>
        <p className="text-sm text-gray-600">
          AI-powered quote generation with automated pricing, terms, and proposal creation.
        </p>
      </div>
    </div>
  )
}