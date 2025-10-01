// app/examples/entity-config-demo/page.tsx - Demo of config-driven entity system
'use client'
import React, { useState } from 'react'
import { useProducts, useServices, useCustomers, useEmployees } from '@/hooks/useEntity'
import { HeraProvider } from '@/ui'

function EntityConfigDemo() {
  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || 'demo-org-id'
  const [activeTab, setActiveTab] = useState('products')

  // One-liner entity hooks with full preset configuration
  const products = useProducts({ organizationId: orgId })
  const services = useServices({ organizationId: orgId })
  const customers = useCustomers({ organizationId: orgId })
  const employees = useEmployees({ organizationId: orgId })

  const handleCreateProduct = async () => {
    try {
      const result = await products.createEntity({
        entity_name: 'Premium Hair Oil',
        entity_code: 'PROD-001',
        dynamicFields: {
          price_market: 89.99,
          price_cost: 45.0,
          uom: 'bottle',
          sku: 'OIL-PREM-001',
          reorder_level: 15,
          stock_quantity: 50
        }
      })
      console.log('Created product:', result)
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  const handleCreateService = async () => {
    try {
      const result = await services.createEntity({
        entity_name: 'Hair Cut & Style',
        entity_code: 'SVC-001',
        dynamicFields: {
          price_market: 150.0,
          duration_min: 45,
          service_type: 'standard',
          commission_rate: 0.4
        }
      })
      console.log('Created service:', result)
    } catch (error) {
      console.error('Error creating service:', error)
    }
  }

  const handleCreateCustomer = async () => {
    try {
      const result = await customers.createEntity({
        entity_name: 'Sarah Johnson',
        entity_code: 'CUST-001',
        dynamicFields: {
          phone: '+971-50-123-4567',
          email: 'sarah.johnson@email.com',
          tier: 'VIP',
          dob: '1985-03-15'
        }
      })
      console.log('Created customer:', result)
    } catch (error) {
      console.error('Error creating customer:', error)
    }
  }

  const handleCreateEmployee = async () => {
    try {
      const result = await employees.createEntity({
        entity_name: 'Alex Rodriguez',
        entity_code: 'EMP-001',
        dynamicFields: {
          rate_hour: 85.0,
          role: 'senior_stylist',
          phone: '+971-50-987-6543',
          email: 'alex@salon.com',
          commission_rate: 0.45
        }
      })
      console.log('Created employee:', result)
    } catch (error) {
      console.error('Error creating employee:', error)
    }
  }

  const tabs = [
    { key: 'products', label: 'Products', hook: products, createFn: handleCreateProduct },
    { key: 'services', label: 'Services', hook: services, createFn: handleCreateService },
    { key: 'customers', label: 'Customers', hook: customers, createFn: handleCreateCustomer },
    { key: 'employees', label: 'Employees', hook: employees, createFn: handleCreateEmployee }
  ]

  const activeHook = tabs.find(t => t.key === activeTab)?.hook

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Entity Config Demo</h1>
        <p className="text-gray-600">
          Demonstrating config-driven entity management with preset configurations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Config Display */}
        <div className="bg-muted rounded-lg p-4">
          <h3 className="font-semibold mb-2">Preset Configuration: {activeTab.toUpperCase()}</h3>
          <pre className="text-xs bg-background p-3 rounded border overflow-auto">
            {JSON.stringify(activeHook?.config, null, 2)}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={tabs.find(t => t.key === activeTab)?.createFn}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Create Sample {activeTab.slice(0, -1)}
          </button>
          <button
            onClick={() => activeHook?.refetch?.()}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 font-medium"
          >
            Refresh Data
          </button>
        </div>

        {/* Data Display */}
        <div className="bg-card rounded-lg border-border border">
          <div className="px-4 py-3 border-b bg-muted">
            <h3 className="font-semibold">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Data
              {activeHook?.isLoading && (
                <span className="ml-2 text-sm text-gray-500">(Loading...)</span>
              )}
            </h3>
          </div>
          <div className="p-4">
            {activeHook?.data?.length ? (
              <div className="space-y-3">
                {activeHook.data.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="border rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{item.entity_name}</h4>
                        <p className="text-sm text-gray-500">
                          {item.entity_code} • {item.smart_code}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {item.entity_type}
                      </span>
                    </div>
                    {item.dynamicFields && Object.keys(item.dynamicFields).length > 0 && (
                      <div className="text-xs bg-muted p-2 rounded">
                        <strong>Dynamic Fields:</strong>
                        <pre className="mt-1">{JSON.stringify(item.dynamicFields, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : activeHook?.isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No {activeTab} found. Create one to get started!
              </div>
            )}
          </div>
        </div>

        {/* Field Validation Demo */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Field Validation Example</h3>
          <div className="text-sm">
            <p className="mb-2">Required fields for {activeTab}:</p>
            <ul className="list-disc list-inside space-y-1">
              {activeHook?.config.dynamicFields
                ?.filter(field => field.required)
                .map(field => (
                  <li key={field.name}>
                    <code className="bg-muted px-1 rounded">{field.name}</code>({field.type}) -{' '}
                    {field.smartCode}
                  </li>
                )) || <li>No required fields configured</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EntityConfigDemoPage() {
  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || 'demo-org-id'

  return (
    <HeraProvider orgId={orgId}>
      <EntityConfigDemo />
    </HeraProvider>
  )
}
