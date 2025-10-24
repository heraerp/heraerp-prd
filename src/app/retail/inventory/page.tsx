'use client'

import React from 'react'
import { 
  MobilePageLayout, 
  MobileFilters, 
  MobileDataTable, 
  MobileChart,
  MobileButton,
  MobileCard
} from '@/components/mobile'
import type { FilterField, TableColumn, ChartDataPoint } from '@/components/mobile'
import { Package, TrendingUp, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react'

export default function InventoryManagementPage() {
  const [selectedItems, setSelectedItems] = React.useState<(string | number)[]>([])

  // Filter configuration
  const filterFields: FilterField[] = [
    {
      key: 'warehouse',
      label: 'Warehouse',
      type: 'select',
      options: [
        { value: 'WH001', label: 'Main Warehouse' },
        { value: 'WH002', label: 'Distribution Center' },
        { value: 'WH003', label: 'Retail Store' }
      ]
    },
    {
      key: 'category',
      label: 'Product Category',
      type: 'search',
      placeholder: 'Search categories...'
    },
    {
      key: 'status',
      label: 'Stock Status',
      type: 'select',
      options: [
        { value: 'in_stock', label: 'In Stock' },
        { value: 'low_stock', label: 'Low Stock' },
        { value: 'out_of_stock', label: 'Out of Stock' },
        { value: 'on_order', label: 'On Order' }
      ]
    },
    {
      key: 'last_updated',
      label: 'Last Updated',
      type: 'date'
    }
  ]

  // Table configuration
  const columns: TableColumn[] = [
    {
      key: 'product_name',
      label: 'Product',
      render: (value, record) => (
        <div>
          <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
            {value}
          </div>
          <div className="text-xs text-gray-500">{record.sku}</div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      mobileHidden: true
    },
    {
      key: 'current_stock',
      label: 'Current Stock',
      align: 'center',
      render: (value, record) => (
        <div className="text-center">
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">{record.unit}</div>
        </div>
      )
    },
    {
      key: 'reorder_level',
      label: 'Reorder Level',
      align: 'center',
      mobileHidden: true
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (value) => {
        const statusConfig = {
          in_stock: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'In Stock' },
          low_stock: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Low Stock' },
          out_of_stock: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Out of Stock' },
          on_order: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'On Order' }
        }
        const config = statusConfig[value as keyof typeof statusConfig]
        const Icon = config.icon
        
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        )
      }
    },
    {
      key: 'last_updated',
      label: 'Last Updated',
      mobileHidden: true,
      render: (value) => (
        <div className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </div>
      )
    }
  ]

  // Sample inventory data
  const inventoryData = [
    {
      id: 'INV001',
      product_name: 'Professional Hair Dryer',
      sku: 'HD-PRO-001',
      category: 'Hair Tools',
      current_stock: 45,
      reorder_level: 10,
      unit: 'units',
      status: 'in_stock',
      last_updated: '2024-01-15',
      warehouse: 'WH001'
    },
    {
      id: 'INV002',
      product_name: 'Organic Shampoo 500ml',
      sku: 'SH-ORG-500',
      category: 'Hair Care',
      current_stock: 8,
      reorder_level: 15,
      unit: 'bottles',
      status: 'low_stock',
      last_updated: '2024-01-14',
      warehouse: 'WH001'
    },
    {
      id: 'INV003',
      product_name: 'Hair Styling Gel',
      sku: 'GEL-STY-001',
      category: 'Styling Products',
      current_stock: 0,
      reorder_level: 20,
      unit: 'tubes',
      status: 'out_of_stock',
      last_updated: '2024-01-13',
      warehouse: 'WH002'
    },
    {
      id: 'INV004',
      product_name: 'Premium Hair Scissors',
      sku: 'SC-PREM-001',
      category: 'Tools',
      current_stock: 25,
      reorder_level: 5,
      unit: 'pairs',
      status: 'on_order',
      last_updated: '2024-01-12',
      warehouse: 'WH001'
    },
    {
      id: 'INV005',
      product_name: 'Hair Color Developer',
      sku: 'COL-DEV-001',
      category: 'Color Products',
      current_stock: 62,
      reorder_level: 25,
      unit: 'bottles',
      status: 'in_stock',
      last_updated: '2024-01-11',
      warehouse: 'WH003'
    }
  ]

  // Chart data for stock levels
  const stockLevelData: ChartDataPoint[] = [
    { label: 'In Stock', value: 3, color: '#10b981' },
    { label: 'Low Stock', value: 1, color: '#f59e0b' },
    { label: 'Out of Stock', value: 1, color: '#ef4444' },
    { label: 'On Order', value: 1, color: '#3b82f6' }
  ]

  // Chart data for stock trends
  const stockTrendData: ChartDataPoint[] = [
    { label: 'Jan', value: 85 },
    { label: 'Feb', value: 92 },
    { label: 'Mar', value: 78 },
    { label: 'Apr', value: 95 },
    { label: 'May', value: 88 },
    { label: 'Jun', value: 96 }
  ]

  // KPI data
  const kpiData = [
    {
      title: 'Total Items',
      value: '1,247',
      change: '+5.2%',
      trend: 'up',
      icon: Package,
      color: 'blue'
    },
    {
      title: 'Low Stock Items',
      value: '23',
      change: '-12%',
      trend: 'down',
      icon: AlertTriangle,
      color: 'yellow'
    },
    {
      title: 'Stock Turnover',
      value: '4.2x',
      change: '+8.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Total Value',
      value: '$124,580',
      change: '+3.7%',
      trend: 'up',
      icon: CheckCircle,
      color: 'purple'
    }
  ]

  // Custom mobile card renderer for inventory items
  const renderMobileInventoryCard = (record: any, index: number) => (
    <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            className="rounded mt-1"
            checked={selectedItems.includes(record.id)}
            onChange={() => {
              const newSelection = selectedItems.includes(record.id)
                ? selectedItems.filter(id => id !== record.id)
                : [...selectedItems, record.id]
              setSelectedItems(newSelection)
            }}
          />
          <div className="flex-1">
            <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer text-sm">
              {record.product_name}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">{record.sku}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {columns[4].render && columns[4].render(record.status, record, index)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Current Stock</div>
          <div className="text-gray-900 font-medium mt-1">{record.current_stock} {record.unit}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Category</div>
          <div className="text-gray-900 mt-1">{record.category}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Reorder Level</div>
          <div className="text-gray-900 mt-1">{record.reorder_level} {record.unit}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</div>
          <div className="text-gray-900 mt-1">{new Date(record.last_updated).toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  )

  return (
    <MobilePageLayout 
      title="HERA"
      breadcrumb="Inventory Management"
      showBack={true}
    >
      {/* Filters */}
      <MobileFilters
        title="Inventory Filters"
        fields={filterFields}
        onApply={() => console.log('Apply filters')}
        onAdaptFilters={() => console.log('Adapt filters')}
      />

      {/* Content */}
      <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600',
              yellow: 'bg-yellow-100 text-yellow-600',
              green: 'bg-green-100 text-green-600',
              purple: 'bg-purple-100 text-purple-600'
            }
            
            return (
              <MobileCard key={index} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                    <p className={`text-sm mt-1 ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change} vs last month
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${colorClasses[kpi.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </MobileCard>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MobileChart
            title="Stock Status Distribution"
            subtitle="Current inventory status breakdown"
            data={stockLevelData}
            type="pie"
            height={200}
          />
          
          <MobileChart
            title="Stock Level Trends"
            subtitle="Monthly stock performance"
            data={stockTrendData}
            type="line"
            height={200}
          />
        </div>

        {/* Inventory Table */}
        <MobileDataTable
          title="Inventory Items (247)"
          subtitle="Manage your product inventory"
          columns={columns}
          data={inventoryData}
          selectable={true}
          selectedRows={selectedItems}
          onRowSelect={setSelectedItems}
          onRowClick={(record) => console.log('Row clicked:', record)}
          mobileCardRender={renderMobileInventoryCard}
          actions={
            <MobileButton
              variant="outline"
              size="medium"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => console.log('Add new item')}
            >
              Add Item
            </MobileButton>
          }
        />
      </div>

      {/* Floating Action Button for Quick Actions */}
      <div className="fixed bottom-6 right-6">
        <MobileButton
          variant="primary"
          size="large"
          className="rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl"
          icon={<Plus className="w-6 h-6" />}
          onClick={() => console.log('Quick add')}
        />
      </div>
    </MobilePageLayout>
  )
}