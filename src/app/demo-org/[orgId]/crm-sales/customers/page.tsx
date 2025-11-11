

/**
 * CRM Customers Management
 * Smart Code: HERA.DEMO.CRM.CUSTOMERS.v1
 * 
 * Demo customers page for CRM Sales/Lead Management module
 */

"use client";

import React from 'react'
import { useParams } from 'next/navigation'
import { Users, Building2, Mail, Phone, Plus } from 'lucide-react'

export default function CustomersPage() {
  const params = useParams()
  const orgId = params?.orgId as string

  const customers = [
    {
      id: 'CUST-001',
      name: 'Acme Corporation',
      type: 'Enterprise',
      contact: 'John Doe',
      email: 'john.doe@acme.com',
      phone: '+1-555-1001',
      revenue: '$5M',
      employees: 150,
      industry: 'Technology'
    },
    {
      id: 'CUST-002',
      name: 'Global Manufacturing Inc',
      type: 'Enterprise',
      contact: 'Sarah Wilson',
      email: 'sarah.wilson@global-mfg.com',
      phone: '+1-555-1002',
      revenue: '$50M',
      employees: 1200,
      industry: 'Manufacturing'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage customer relationships and accounts</p>
        </div>
        <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Customer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div key={customer.id} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 hover:shadow-lg transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-600">{customer.type}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-3 w-3" />
                <span>{customer.contact}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-3 w-3" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-3 w-3" />
                <span>{customer.phone}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50/50 rounded-lg">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">{customer.revenue}</div>
                <div className="text-xs text-gray-500">Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">{customer.employees}</div>
                <div className="text-xs text-gray-500">Employees</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">{customer.industry}</div>
                <div className="text-xs text-gray-500">Industry</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200/50">
        <h3 className="font-semibold text-gray-900 mb-2">Customer Management Features</h3>
        <p className="text-sm text-gray-600">
          This demo showcases customer relationship management capabilities including account management, 
          contact tracking, and customer lifecycle workflows.
        </p>
      </div>
    </div>
  )
}