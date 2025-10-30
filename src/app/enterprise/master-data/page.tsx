'use client'

/**
 * Master Data Landing Page
 * Smart Code: HERA.ENTERPRISE.MASTER_DATA.LANDING.v1
 * 
 * Central hub for all master data templates and entities
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Building2, 
  Package, 
  Calculator,
  FileText,
  Settings,
  Eye,
  Edit3,
  ChevronRight,
  Grid3X3
} from 'lucide-react'

export default function MasterDataPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Available master data templates
  const masterDataTemplates = [
    {
      id: 'customer',
      name: 'Customer',
      description: 'Customer master data with contact information, business details, and relationships',
      icon: Users,
      category: 'CRM',
      color: 'bg-blue-600',
      fields: 15,
      relationships: 3,
      status: 'active',
      lastModified: '2025-01-15',
      recordCount: 1247
    },
    {
      id: 'vendor',
      name: 'Vendor',
      description: 'Vendor and supplier master data with procurement terms and contact details',
      icon: Building2,
      category: 'Procurement',
      color: 'bg-orange-600',
      fields: 12,
      relationships: 2,
      status: 'active',
      lastModified: '2025-01-14',
      recordCount: 234
    },
    {
      id: 'product',
      name: 'Product',
      description: 'Product master data with specifications, pricing, and inventory details',
      icon: Package,
      category: 'Inventory',
      color: 'bg-green-600',
      fields: 18,
      relationships: 4,
      status: 'active',
      lastModified: '2025-01-13',
      recordCount: 3521
    },
    {
      id: 'account',
      name: 'Chart of Accounts',
      description: 'Financial account master data with hierarchies and GL configurations',
      icon: Calculator,
      category: 'Finance',
      color: 'bg-purple-600',
      fields: 10,
      relationships: 1,
      status: 'active',
      lastModified: '2025-01-12',
      recordCount: 156
    },
    {
      id: 'employee',
      name: 'Employee',
      description: 'Employee master data with HR information and organizational relationships',
      icon: Users,
      category: 'HR',
      color: 'bg-pink-600',
      fields: 20,
      relationships: 5,
      status: 'draft',
      lastModified: '2025-01-10',
      recordCount: 0
    },
    {
      id: 'contract',
      name: 'Contract',
      description: 'Contract master data with terms, conditions, and party relationships',
      icon: FileText,
      category: 'Legal',
      color: 'bg-indigo-600',
      fields: 14,
      relationships: 3,
      status: 'draft',
      lastModified: '2025-01-09',
      recordCount: 0
    }
  ]

  const categories = [
    { id: 'all', name: 'All Categories', count: masterDataTemplates.length },
    { id: 'CRM', name: 'CRM', count: masterDataTemplates.filter(t => t.category === 'CRM').length },
    { id: 'Finance', name: 'Finance', count: masterDataTemplates.filter(t => t.category === 'Finance').length },
    { id: 'Procurement', name: 'Procurement', count: masterDataTemplates.filter(t => t.category === 'Procurement').length },
    { id: 'Inventory', name: 'Inventory', count: masterDataTemplates.filter(t => t.category === 'Inventory').length },
    { id: 'HR', name: 'HR', count: masterDataTemplates.filter(t => t.category === 'HR').length },
    { id: 'Legal', name: 'Legal', count: masterDataTemplates.filter(t => t.category === 'Legal').length }
  ]

  // Filter templates based on search and category
  const filteredTemplates = masterDataTemplates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const activeTemplates = filteredTemplates.filter(t => t.status === 'active')
  const draftTemplates = filteredTemplates.filter(t => t.status === 'draft')

  return (
    <div className="sap-font min-h-screen bg-gray-100">
      <SapNavbar 
        title="HERA" 
        breadcrumb="Enterprise › Master Data"
        showBack={true}
        onBack={() => window.history.back()}
        userInitials="EG"
        showSearch={false}
      />
      
      <main className="mt-12 min-h-[calc(100vh-48px)]">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                  <Grid3X3 className="w-8 h-8 text-blue-600" />
                  Master Data Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Create and manage master data using configurable templates and workflows
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href="/enterprise/master-data/templates/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Link>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block border border-gray-300 rounded-md py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Active Templates</p>
                  <p className="text-2xl font-semibold text-gray-900">{activeTemplates.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Settings className="w-8 h-8 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Draft Templates</p>
                  <p className="text-2xl font-semibold text-gray-900">{draftTemplates.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Grid3X3 className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Records</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {masterDataTemplates.reduce((sum, t) => sum + t.recordCount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Categories</p>
                  <p className="text-2xl font-semibold text-gray-900">{categories.length - 1}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Templates */}
          {activeTemplates.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Active Templates</h2>
                <p className="text-sm text-gray-600">Ready-to-use master data templates</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeTemplates.map((template) => {
                    const Icon = template.icon
                    return (
                      <div
                        key={template.id}
                        className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group"
                      >
                        <div className="flex items-center mb-4">
                          <div className={`p-3 rounded-lg ${template.color} mr-4 group-hover:scale-105 transition-transform`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            <p className="text-sm text-gray-600">{template.category}</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-4">{template.description}</p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>{template.fields} fields</span>
                          <span>{template.relationships} relationships</span>
                          <span>{template.recordCount.toLocaleString()} records</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Updated {template.lastModified}
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/enterprise/master-data/${template.id}`}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Link>
                            
                            <Link
                              href={`/enterprise/master-data/${template.id}/new`}
                              className="inline-flex items-center px-3 py-1 border border-transparent rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Create
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Draft Templates */}
          {draftTemplates.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Draft Templates</h2>
                <p className="text-sm text-gray-600">Templates in development</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {draftTemplates.map((template) => {
                    const Icon = template.icon
                    return (
                      <div
                        key={template.id}
                        className="bg-gray-50 rounded-lg border border-gray-200 p-6 opacity-75"
                      >
                        <div className="flex items-center mb-4">
                          <div className={`p-3 rounded-lg bg-gray-400 mr-4`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            <p className="text-sm text-gray-600">{template.category}</p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Draft
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-4">{template.description}</p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>{template.fields} fields</span>
                          <span>{template.relationships} relationships</span>
                          <span>No records</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Updated {template.lastModified}
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              disabled
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Grid3X3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? `No templates match "${searchQuery}"`
                  : 'No templates available in this category'
                }
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}