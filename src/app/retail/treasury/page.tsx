'use client'

import React from 'react'
import { SapHeader } from '@/components/sap/SapHeader'
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Maximize2, Filter, Settings, Search, Bell, User } from 'lucide-react'

export default function TreasuryExecutiveDashboard() {
  const [selectedTab, setSelectedTab] = React.useState('Liquidity')

  const tabs = [
    'Liquidity',
    'Cash Management', 
    'Indebtedness',
    'Counterparty Risk',
    'Bank Guarantee',
    'Market Overview'
  ]

  const regionData = [
    { name: 'Asia Pacific incl. Japan', expanded: true },
    { name: 'Americas', expanded: true },
    { name: 'Europe, Middle East and Africa', expanded: true }
  ]

  const liquidityByRegion = [
    { region: 'Asia Pacific incl. Japan', investments: 305.20, deposits: 302.41, cash: 0 },
    { region: 'Americas', investments: 179.99, deposits: 357.86, cash: 0 },
    { region: 'Europe, Middle East and Africa', investments: 1098.75, deposits: 0, cash: 1563.73 }
  ]

  const liquidityByCompany = [
    { code: '1010', investments: 568.97, cash: 1217.87, deposits: 0 },
    { code: '1710', investments: 128.87, cash: 316.68, deposits: 0 },
    { code: '1510', investments: 305.20, cash: 302.41, deposits: 0 },
    { code: '1020', investments: 148.88, cash: 0, deposits: 0 },
    { code: '1110', investments: 119.96, cash: 119.38, deposits: 0 }
  ]

  const financialPositionData = [
    { category: 'Cash', amount: 804.00, color: '#4A90E2' },
    { category: 'Deposits', amount: 654.00, color: '#50C878' },
    { category: 'Investments', amount: 38.87, color: '#FF6B6B' },
    { category: 'Commercial papers', amount: 1161.56, color: '#FF8C42' },
    { category: 'Cash Equivalents', amount: 1681.14, color: '#FFD93D' }
  ]

  const currencyData = [
    { currency: 'Euro', amount: 828.56 },
    { currency: 'Swiss Franc', amount: 691.39 },
    { currency: 'US Dollar', amount: 466.27 },
    { currency: 'British Pound', amount: 218.53 },
    { currency: 'Canadian Dollar', amount: 16.82 },
    { currency: 'Japanese Yen', amount: 2.41 }
  ]

  return (
    <div className="sap-font min-h-screen bg-[#f7f7f7]">
      {/* SAP Header */}
      <SapHeader 
        title="SAP" 
        breadcrumb="Treasury Executive Dashboard"
        showSearch={true}
      />
      
      <main className="mt-[56px] min-h-[calc(100vh-56px)] bg-[#f7f7f7]">
        {/* Page Title Section */}
        <div className="bg-white px-6 py-8 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-gray-800 mb-2">Treasury Executive Dashboard</h1>
              <p className="text-sm text-gray-600">for Treasury Risk Manager</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
              Find out more
            </button>
          </div>
        </div>

        {/* Navigation Header */}
        <div className="bg-slate-700 text-white">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="text-white hover:text-gray-200">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">SAP</span>
                <span className="text-gray-300">Treasury Executive Dashboard</span>
                <ChevronDown className="w-4 h-4 text-gray-300" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-gray-300" />
              <Settings className="w-4 h-4 text-gray-300" />
              <Bell className="w-4 h-4 text-gray-300" />
              <div className="w-6 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center">
                S
              </div>
            </div>
          </div>
          
          <div className="px-6 py-2 border-t border-slate-600">
            <div className="flex items-center gap-2 text-sm">
              <span>Demo_Conference</span>
              <ChevronDown className="w-3 h-3" />
              <span className="text-gray-400 ml-4">🔗</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="px-6">
            <div className="flex items-center justify-between">
              <div className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                      selectedTab === tab
                        ? 'text-blue-600 border-blue-600 bg-white'
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Settings className="w-4 h-4 text-gray-500" />
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Regions */}
            <div className="col-span-2">
              <div className="bg-white rounded border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900 text-sm mb-2">Liquidity Overview</h3>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <h4 className="text-xs text-gray-600 mb-2">Regions</h4>
                    <label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      All
                    </label>
                    <div className="ml-4 space-y-1">
                      {regionData.map((region, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <button className="text-gray-400 hover:text-gray-600">
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-gray-700">{region.name}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Content - Main Dashboard */}
            <div className="col-span-10">
              <div className="grid grid-cols-2 gap-6">
                {/* Total Liquidity KPI */}
                <div className="bg-white rounded border border-gray-200 p-6 col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm text-gray-600 mb-1">Liquidity</h3>
                      <p className="text-xs text-gray-500">Million EUR [ € ] | Filter [ € ]</p>
                      <div className="text-3xl font-light text-gray-900 mt-2">2,223.80</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Maximize2 className="w-4 h-4 text-gray-400" />
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Liquidity by Region Chart */}
                <div className="bg-white rounded border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">Liquidity by Region</h3>
                        <p className="text-xs text-gray-500">Million EUR [ € ] | Filter [ € ]</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Maximize2 className="w-4 h-4 text-gray-400" />
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                        <span>Investments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                        <span>Deposits</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
                        <span>Cash</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {liquidityByRegion.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-32 text-xs text-gray-600 truncate">
                            {item.region}
                          </div>
                          <div className="flex-1 flex">
                            {item.investments > 0 && (
                              <div 
                                className="bg-green-500 h-6 flex items-center justify-center text-white text-xs"
                                style={{ width: `${(item.investments / 1600) * 100}%` }}
                              >
                                {item.investments}
                              </div>
                            )}
                            {item.deposits > 0 && (
                              <div 
                                className="bg-blue-500 h-6 flex items-center justify-center text-white text-xs"
                                style={{ width: `${(item.deposits / 1600) * 100}%` }}
                              >
                                {item.deposits}
                              </div>
                            )}
                            {item.cash > 0 && (
                              <div 
                                className="bg-gray-600 h-6 flex items-center justify-center text-white text-xs"
                                style={{ width: `${(item.cash / 1600) * 100}%` }}
                              >
                                {item.cash}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Liquidity by Company Code Chart */}
                <div className="bg-white rounded border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">Liquidity by Company Code</h3>
                        <p className="text-xs text-gray-500">Million EUR [ € ] | Filter [ € ] | Top 5 [ € ]</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Maximize2 className="w-4 h-4 text-gray-400" />
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                        <span>Investments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
                        <span>Cash</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                        <span>Deposits</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {liquidityByCompany.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-24 text-xs text-gray-600">
                            Company Code {item.code}
                          </div>
                          <div className="flex-1 flex">
                            {item.investments > 0 && (
                              <div 
                                className="bg-green-500 h-6 flex items-center justify-center text-white text-xs"
                                style={{ width: `${(item.investments / 1400) * 100}%` }}
                              >
                                {item.investments}
                              </div>
                            )}
                            {item.cash > 0 && (
                              <div 
                                className="bg-blue-600 h-6 flex items-center justify-center text-white text-xs"
                                style={{ width: `${(item.cash / 1400) * 100}%` }}
                              >
                                {item.cash}
                              </div>
                            )}
                            <div className="text-xs text-gray-600 ml-2 flex items-center">
                              {(item.investments + item.cash + item.deposits).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Liquidity by Financial Position Group */}
                <div className="bg-white rounded border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">Liquidity by Financial Position Group</h3>
                        <p className="text-xs text-gray-500">Million EUR [ € ] | Filter [ € ]</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Maximize2 className="w-4 h-4 text-gray-400" />
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                        <span>Fixed-interest bonds</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                        <span>Fix-term deposits</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                        <span>Commercial papers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                        <span>Cash Equivalents</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {financialPositionData.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-20 text-xs text-gray-600">
                            {item.category}
                          </div>
                          <div className="flex-1 flex items-center">
                            <div 
                              className="h-6 flex items-center justify-center text-white text-xs"
                              style={{ 
                                width: `${(item.amount / 2000) * 100}%`,
                                backgroundColor: item.color
                              }}
                            >
                              {item.amount}
                            </div>
                            {item.category === 'Investments' && (
                              <div className="w-2 h-6 bg-red-500 text-white text-xs flex items-center justify-center">
                                {item.amount}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Liquidity by Currency */}
                <div className="bg-white rounded border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">Liquidity by Currency</h3>
                        <p className="text-xs text-gray-500">Million EUR [ € ] | Filter [ € ] | Top 5 [ € ]</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Maximize2 className="w-4 h-4 text-gray-400" />
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {currencyData.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-24 text-xs text-gray-600">
                            {item.currency}
                          </div>
                          <div className="flex-1 flex items-center">
                            <div 
                              className="bg-blue-500 h-6 flex items-center justify-end pr-2 text-white text-xs"
                              style={{ width: `${(item.amount / 900) * 100}%` }}
                            >
                              {item.amount}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}