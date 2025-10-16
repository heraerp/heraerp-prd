'use client'

import React from 'react'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { Search, Filter, Eye, Sliders, Grid, BarChart, Table, ExternalLink, ChevronDown } from 'lucide-react'

export default function MonitorMaterialsPage() {
  const [selectedMaterials, setSelectedMaterials] = React.useState<string[]>([])
  const [showScaledValues, setShowScaledValues] = React.useState(false)

  // Sample materials data matching the screenshot
  const materialsData = [
    {
      id: 'MZ-MATCON-A01',
      name: 'Bike Wheel',
      ranking: 100,
      purchOrg: 'Purch. Org. 1710 (1710)',
      poItems: 97,
      totalAmount: 150234.47,
      currency: 'USD',
      feedback: 'Dismiss'
    },
    {
      id: 'MZ-TG-A200',
      name: 'A200 Bike Chain & Sprocket set',
      ranking: 99,
      purchOrg: 'Purch. Org. 1710 (1710)',
      poItems: 92,
      totalAmount: 150199.00,
      currency: 'USD',
      feedback: 'Dismiss'
    },
    {
      id: 'MZ-MATCON-A02',
      name: 'Bike Lighting wire set',
      ranking: 98,
      purchOrg: 'Purch. Org. 1710 (1710)',
      poItems: 88,
      totalAmount: 150168.37,
      currency: 'USD',
      feedback: 'Dismiss'
    },
    {
      id: 'MZ-TG-A201',
      name: 'Engine Oil',
      ranking: 98,
      purchOrg: 'Purch. Org. 1710 (1710)',
      poItems: 87,
      totalAmount: 136278.00,
      currency: 'USD',
      feedback: 'Dismiss'
    },
    {
      id: 'MZ-MATCON-A03',
      name: 'Bike Brake Wire',
      ranking: 97,
      purchOrg: 'Purch. Org. 1710 (1710)',
      poItems: 21,
      totalAmount: 133231.76,
      currency: 'USD',
      feedback: 'Dismiss'
    },
    {
      id: 'MZ-MATCON-A04',
      name: 'Bike Li Battery',
      ranking: 94,
      purchOrg: 'Purch. Org. 1710 (1710)',
      poItems: 85,
      totalAmount: 90237.71,
      currency: 'USD',
      feedback: 'Dismiss'
    }
  ]

  // Generate scatter plot data points
  const generateScatterData = () => {
    const data = []
    
    // Proposed points (blue)
    for (let i = 0; i < 15; i++) {
      data.push({
        x: Math.random() * 100,
        y: Math.random() * 120 + 10,
        status: 'proposed',
        amount: Math.random() * 150000
      })
    }
    
    // Not Proposed points (orange)
    for (let i = 0; i < 20; i++) {
      data.push({
        x: Math.random() * 100,
        y: Math.random() * 60,
        status: 'not-proposed',
        amount: Math.random() * 100000
      })
    }
    
    // Contract Exists points (green)
    for (let i = 0; i < 12; i++) {
      data.push({
        x: Math.random() * 100,
        y: Math.random() * 80 + 20,
        status: 'contract-exists',
        amount: Math.random() * 120000
      })
    }
    
    return data
  }

  const scatterData = generateScatterData()

  const handleMaterialSelect = (materialId: string) => {
    setSelectedMaterials(prev => 
      prev.includes(materialId) 
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    )
  }

  return (
    <div className="sap-font min-h-screen bg-gray-50">
      {/* HERA Navbar */}
      <SapNavbar 
        title="HERA" 
        breadcrumb="Monitor Materials Without Contract"
        showBack={true}
        userInitials="EG"
        showSearch={true}
      />
      
      <main className="mt-12 min-h-[calc(100vh-48px)] bg-gray-50">
        {/* Page Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-gray-900">Standard</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </div>
          
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Purchasing Organization:</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded px-3 py-3 text-sm bg-white touch-manipulation"
                  placeholder=""
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Material Group:</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded px-3 py-3 text-sm bg-white touch-manipulation"
                  placeholder=""
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Proposal Status:</label>
              <select className="w-full border border-gray-300 rounded px-3 py-3 text-sm bg-white touch-manipulation">
                <option></option>
                <option>Proposed</option>
                <option>Not Proposed</option>
                <option>Contract Exists</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Feedback:</label>
              <select className="w-full border border-gray-300 rounded px-3 py-3 text-sm bg-white touch-manipulation">
                <option></option>
                <option>Dismiss</option>
                <option>Accept</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
            <button className="text-blue-600 text-sm flex items-center justify-center gap-1 hover:text-blue-800 py-2 px-3 rounded border border-blue-200 hover:bg-blue-50 transition-colors">
              <Filter className="w-4 h-4" />
              Adapt Filters
            </button>
            <button className="bg-blue-600 text-white px-6 py-3 rounded text-sm hover:bg-blue-700 transition-colors font-medium">
              Go
            </button>
          </div>
        </div>

        {/* Materials Chart Section */}
        <div className="px-3 sm:px-6 py-4 sm:py-6">
          <div className="bg-white rounded-lg border border-gray-200 mb-6 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-medium text-gray-900 text-lg">Materials</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button 
                    onClick={() => setShowScaledValues(!showScaledValues)}
                    className={`text-sm px-3 py-2 rounded transition-colors ${
                      showScaledValues 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-blue-600 hover:bg-blue-50 border border-blue-200'
                    }`}
                  >
                    Show Scaled Values
                  </button>
                  <span className="text-sm text-gray-500 hidden sm:block">Details</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Grid className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Search className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-blue-600 text-white rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Table className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <BarChart className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Scatter Plot Chart */}
            <div className="p-3 sm:p-6">
              <div className="relative">
                <div className="hidden sm:block">
                  <svg width="100%" height="300" className="border border-gray-200 bg-gray-50 rounded">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Y-axis labels */}
                    <text x="10" y="25" className="text-xs fill-gray-600">150</text>
                    <text x="10" y="85" className="text-xs fill-gray-600">100</text>
                    <text x="10" y="145" className="text-xs fill-gray-600">50</text>
                    <text x="10" y="205" className="text-xs fill-gray-600">0</text>
                    
                    {/* X-axis label */}
                    <text x="45" y="290" className="text-xs fill-gray-600">Number of</text>
                    
                    {/* Center label */}
                    <text x="50%" y="160" className="text-sm fill-gray-400 text-anchor-middle">Total Gross Amount</text>
                    
                    {/* Scatter points */}
                    {scatterData.map((point, index) => (
                      <circle
                        key={index}
                        cx={60 + point.x * 8}
                        cy={260 - point.y * 2}
                        r={point.amount > 100000 ? 6 : 4}
                        fill={
                          point.status === 'proposed' ? '#3b82f6' :
                          point.status === 'not-proposed' ? '#f97316' :
                          '#10b981'
                        }
                        opacity={0.7}
                        className="hover:opacity-100"
                      />
                    ))}
                  </svg>
                </div>
                
                {/* Mobile Chart Placeholder */}
                <div className="sm:hidden bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Chart View</p>
                  <p className="text-xs text-gray-500">Tap to view interactive chart</p>
                </div>
                
                {/* Legend */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Proposed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Not Proposed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Contract Exists</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Materials Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-medium text-gray-900 text-lg">Materials (56)</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-200 rounded hover:bg-blue-50 transition-colors">
                    Create RFQ
                  </button>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-blue-600 text-white rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Table className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-8 px-4 py-3 text-left">
                      <input 
                        type="checkbox" 
                        className="rounded"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMaterials(materialsData.map(m => m.id))
                          } else {
                            setSelectedMaterials([])
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Ranking
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Purchasing Organization
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Number of PO Items
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Total Gross Amount
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Feedback
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materialsData.map((material) => (
                    <tr key={material.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded"
                          checked={selectedMaterials.includes(material.id)}
                          onChange={() => handleMaterialSelect(material.id)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                            {material.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{material.id}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white">
                          {material.ranking}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {material.purchOrg}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">
                        {material.poItems}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {material.totalAmount.toLocaleString('en-US', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}
                        </div>
                        <div className="text-xs text-gray-500">{material.currency}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50">
                          {material.feedback}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {materialsData.map((material) => (
                <div key={material.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        className="rounded mt-1"
                        checked={selectedMaterials.includes(material.id)}
                        onChange={() => handleMaterialSelect(material.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer text-sm">
                          {material.name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-1">{material.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white">
                        {material.ranking}
                      </span>
                      <button className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50">
                        {material.feedback}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Purch. Org</div>
                      <div className="text-gray-900 mt-1">1710 (1710)</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">PO Items</div>
                      <div className="text-gray-900 mt-1">{material.poItems}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Total Amount</div>
                      <div className="text-gray-900 font-medium mt-1">
                        {material.totalAmount.toLocaleString('en-US', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })} {material.currency}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}