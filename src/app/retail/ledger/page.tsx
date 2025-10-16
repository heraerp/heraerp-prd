'use client'

import React from 'react'
import { SapHeader } from '@/components/sap/SapHeader'
import { ChevronDown, ChevronLeft, Calendar, Search, Filter, BarChart3, TrendingUp, FileText, DollarSign, PieChart, ExternalLink, Settings, Bell } from 'lucide-react'

export default function GeneralLedgerOverview() {
  const [selectedCurrency, setSelectedCurrency] = React.useState('EUR')
  const [selectedLedger, setSelectedLedger] = React.useState('0L')
  const [selectedCompany, setSelectedCompany] = React.useState('1010')

  // Account data matching the screenshot
  const accountData = [
    { account: '0041005100', description: '(Billed...', taxAmount: '2.62K', taxCurrency: 'EUR', calculatedAmount: '202.47', calculatedCurrency: 'EUR' },
    { account: '0021120000', description: '(G0/R)', taxAmount: '236.18', taxCurrency: 'EUR', calculatedAmount: '59.33K', calculatedCurrency: 'EUR' },
    { account: '0061008000', description: '(Trav.Expe...', taxAmount: '187.95', taxCurrency: 'EUR', calculatedAmount: '187.95', calculatedCurrency: 'EUR' },
    { account: '0065301000', description: '(Marketing...', taxAmount: '65.40', taxCurrency: 'EUR', calculatedAmount: '65.42', calculatedCurrency: 'EUR' },
    { account: '0061003000', description: '(Trav.Expe...', taxAmount: '19.00', taxCurrency: 'EUR', calculatedAmount: '19.00', calculatedCurrency: 'EUR' },
    { account: '0021730000', description: '(Freight Clr...', taxAmount: '1.90', taxCurrency: 'EUR', calculatedAmount: '1.90', calculatedCurrency: 'EUR' },
    { account: '0021191500', description: '(Tax settl.d...', taxAmount: '0.72', taxCurrency: 'EUR', calculatedAmount: '0.72', calculatedCurrency: 'EUR' },
    { account: '0065008000', description: '(Purchased...', taxAmount: '0.38', taxCurrency: 'EUR', calculatedAmount: '0.38', calculatedCurrency: 'EUR' },
    { account: '', description: '', taxAmount: '0.01', taxCurrency: 'EUR', calculatedAmount: '0.00', calculatedCurrency: 'EUR' }
  ]

  const journalEntries = [
    { entry: '100000289', date: '27.05.2021', amount: '200.0', currency: 'EUR' },
    { entry: '100000291', date: '27.05.2021', amount: '200.0', currency: 'EUR' },
    { entry: '100000504', date: '10.01.2022', amount: '0.0', currency: 'EUR' },
    { entry: '100000505', date: '09.01.2022', amount: '0.0', currency: 'EUR' },
    { entry: '100000506', date: '09.01.2022', amount: '0.0', currency: 'EUR' }
  ]

  const glAccountBalance = [
    { group: 'PnL Result', amount: '-2.29M', currency: 'EUR' },
    { group: 'Liability and Equity', amount: '-501.66K', currency: 'EUR' },
    { group: 'Recognized Revenue', amount: '-228.33K', currency: 'EUR' },
    { group: 'PurSt Tngbt Assets', amount: '118.38K', currency: 'EUR' }
  ]

  const verifiedEntries = [
    { entry: '100000287', date: '27.05.2021', amount: '200.0', currency: 'EUR' },
    { entry: '100000288', date: '27.05.2021', amount: '200.0', currency: 'EUR' },
    { entry: '100000290', date: '27.05.2021', amount: '200.0', currency: 'EUR' },
    { entry: '100000507', date: '09.01.2022', amount: '0.0', currency: 'EUR' }
  ]

  const inboxItems = [
    'Verify Intercompany General Journal Entry 1...',
    'Verify Intercompany General Journal Entry 1...',
    'Verify Intercompany General Journal Entry 1...',
    'Verify Intercompany General Journal Entry 1...',
    'Verify Intercompany General Journal Entry 1...'
  ]

  return (
    <div className="sap-font min-h-screen bg-[#f7f7f7]">
      {/* SAP Header */}
      <SapHeader 
        title="SAP" 
        breadcrumb="General Ledger Overview"
        showSearch={true}
      />
      
      <main className="mt-[56px] min-h-[calc(100vh-56px)] bg-[#f7f7f7]">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">General Ledger Overview</h1>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded">
                <span className="text-sm text-blue-700">New Design</span>
                <div className="w-8 h-4 bg-blue-500 rounded-full relative">
                  <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-600" />
                <Settings className="w-4 h-4 text-gray-600" />
                <Bell className="w-4 h-4 text-gray-600" />
                <div className="w-6 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-medium">
                  EG
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Row */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="text-sm font-medium text-gray-700">Standard*</div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-6 mt-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Display Currency *</label>
              <select 
                value={selectedCurrency} 
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm bg-white min-w-[80px]"
              >
                <option>EUR</option>
                <option>USD</option>
                <option>GBP</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Key Date *</label>
              <div className="relative">
                <input 
                  type="text" 
                  value="28.12.2021"
                  className="border border-gray-300 rounded px-3 py-1 text-sm bg-white min-w-[100px]"
                  readOnly
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Statement Version *</label>
              <select className="border border-gray-300 rounded px-3 py-1 text-sm bg-white min-w-[80px]">
                <option>FPA1</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Ledger *</label>
              <select 
                value={selectedLedger}
                onChange={(e) => setSelectedLedger(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm bg-white min-w-[60px]"
              >
                <option>0L</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Company Code *</label>
              <select 
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm bg-white min-w-[80px]"
              >
                <option>1010</option>
              </select>
            </div>

            <button className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
              Go
            </button>
            
            <button className="text-blue-600 text-sm hover:text-blue-800 flex items-center gap-1">
              <Filter className="w-4 h-4" />
              Adapt Filters (5)
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="p-6 grid grid-cols-12 gap-6">
          {/* Left Column - Account Data */}
          <div className="col-span-3 space-y-6">
            {/* Tax Reconciliation Account Balance */}
            <div className="bg-white rounded border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 text-sm">Tax Reconciliation Account Balance</h3>
                <p className="text-xs text-gray-600 mt-1">9 of 38</p>
                <p className="text-xs text-gray-600">As of Today</p>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-700 border-b border-gray-100 pb-1">
                    <span>G/L Account</span>
                    <span>Tax Amount in Disp Crcy</span>
                    <span>Calculated Tax Amount in Disp Crcy</span>
                  </div>
                  {accountData.map((account, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 text-xs py-1 hover:bg-gray-50">
                      <div className="truncate">
                        <div className="font-mono">{account.account}</div>
                        <div className="text-gray-600">{account.description}</div>
                      </div>
                      <div className="text-right">
                        <div className={account.taxAmount.includes('K') ? 'font-semibold text-red-600' : ''}>
                          {account.taxAmount}
                        </div>
                        <div className="text-gray-500">{account.taxCurrency}</div>
                      </div>
                      <div className="text-right">
                        <div>{account.calculatedAmount}</div>
                        <div className="text-gray-500">{account.calculatedCurrency}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* G/L Item Changes */}
            <div className="bg-white rounded border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 text-sm">G/L Item Changes</h3>
                <p className="text-xs text-gray-600 mt-1">3 of 110284</p>
                <p className="text-xs text-gray-600">Most Recent</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="text-xs">
                  <div className="font-medium">Journal Entry: 100002477</div>
                  <div className="text-gray-600">CB998000021165</div>
                  <div className="text-gray-600">Field: Reversal Ref.</div>
                  <div className="mt-2">
                    <span className="text-gray-600">Old Value:</span>
                    <div className="text-gray-600">New Value: 00000</div>
                    <div className="text-gray-600">MAR 17, 2022</div>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3 text-xs">
                  <div className="font-medium">Journal Entry: 100002477</div>
                  <div className="text-gray-600">CB998000021165</div>
                  <div className="text-gray-600">Field: Reversal Ref.</div>
                  <div className="mt-2">
                    <span className="text-gray-600">Old Value:</span>
                    <div className="text-gray-600">New Value: 00000</div>
                    <div className="text-gray-600">MAR 17, 2022</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Quick Links & Charts */}
          <div className="col-span-6 space-y-6">
            {/* Quick Links */}
            <div className="bg-white rounded border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 text-sm">Quick Links</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded">
                  <FileText className="w-4 h-4" />
                  Display G/L Account Line Items
                </button>
                <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded">
                  <FileText className="w-4 h-4" />
                  Manage Journal Entries
                </button>
                <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded">
                  <FileText className="w-4 h-4" />
                  Post General Journal Entries
                </button>
                <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded">
                  <DollarSign className="w-4 h-4" />
                  Post Cash Journal Entries
                </button>
                <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded">
                  <Settings className="w-4 h-4" />
                  Clear G/L Accounts
                </button>
              </div>
            </div>

            {/* Recognized Revenue Chart */}
            <div className="bg-white rounded border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 text-sm">Recognized Revenue</h3>
                <p className="text-xs text-gray-600">Revenue in Fiscal Year | EUR</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-light">228.9</span>
                  <span className="text-xs text-gray-600">K</span>
                </div>
                <p className="text-xs text-gray-600">Year to Date</p>
                <div className="mt-2">
                  <select className="text-xs border border-gray-300 rounded px-2 py-1">
                    <option>All</option>
                  </select>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Revenue by Month | EUR</h4>
                  <div className="h-32 bg-gray-50 rounded flex items-end justify-center relative">
                    <svg width="300" height="100" className="absolute bottom-4">
                      <polyline 
                        points="20,80 60,75 100,70 140,65 180,40 220,20 260,15" 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="2"
                      />
                      <circle cx="260" cy="15" r="3" fill="#3b82f6"/>
                    </svg>
                    <div className="absolute bottom-2 right-4 text-xs text-blue-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Actual
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost of Sales */}
            <div className="bg-white rounded border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 text-sm">Recognized Cost of Sales</h3>
                <p className="text-xs text-gray-600">Expenses in Fiscal Year | EUR</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-light">-235.8</span>
                  <span className="text-xs text-gray-600">K</span>
                </div>
                <p className="text-xs text-gray-600">Year to Date</p>
                <div className="mt-2">
                  <select className="text-xs border border-gray-300 rounded px-2 py-1">
                    <option>Last 6 Months</option>
                  </select>
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-medium mb-2">Expenses by Month | EUR</h4>
                <div className="h-32 bg-gray-50 rounded flex items-center justify-center">
                  <div className="text-xs text-gray-500">Chart visualization area</div>
                </div>
              </div>
            </div>

            {/* G/L Account Balance & Verified Journal Entries */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900 text-sm">G/L Account Balance</h3>
                  <p className="text-xs text-gray-600">5 of 7</p>
                  <p className="text-xs text-gray-600">As of Key Date</p>
                  <div className="mt-2">
                    <select className="text-xs border border-gray-300 rounded px-2 py-1">
                      <option>Special Periods Excluded</option>
                    </select>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-gray-700 border-b border-gray-100 pb-1">
                      <span>Account Group</span>
                      <span>Amount in Disp Crcy</span>
                    </div>
                    {glAccountBalance.map((item, index) => (
                      <div key={index} className="flex justify-between text-xs py-1">
                        <span className="text-gray-700">{item.group}</span>
                        <div className="text-right">
                          <div className="font-mono">{item.amount}</div>
                          <div className="text-gray-500">{item.currency}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900 text-sm">Verified Journal Entries</h3>
                  <p className="text-xs text-gray-600">7 of 27</p>
                  <p className="text-xs text-gray-600">As of Key Date</p>
                  <div className="mt-2">
                    <select className="text-xs border border-gray-300 rounded px-2 py-1">
                      <option>All</option>
                    </select>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-gray-700 border-b border-gray-100 pb-1">
                      <span>Journal Entry</span>
                      <span>Posting Date</span>
                      <span>Amount in Disp Crcy</span>
                    </div>
                    {verifiedEntries.map((entry, index) => (
                      <div key={index} className="flex justify-between text-xs py-1">
                        <span className="font-mono text-blue-600">{entry.entry}</span>
                        <span>{entry.date}</span>
                        <div className="text-right">
                          <div>{entry.amount}</div>
                          <div className="text-gray-500">{entry.currency}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - KPIs & Inbox */}
          <div className="col-span-3 space-y-6">
            {/* Journal Entries to Be Verified */}
            <div className="bg-white rounded border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 text-sm">Journal Entries to Be Verified</h3>
                <p className="text-xs text-gray-600 mt-1">5 of 162</p>
                <p className="text-xs text-gray-600">As of Key Date</p>
                <div className="mt-2">
                  <select className="text-xs border border-gray-300 rounded px-2 py-1 w-full">
                    <option>All</option>
                  </select>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-700 border-b border-gray-100 pb-1">
                    <span>Journal Entry</span>
                    <span>Posting Date</span>
                    <span>Amount in Disp Crcy</span>
                  </div>
                  {journalEntries.map((entry, index) => (
                    <div key={index} className="flex justify-between text-xs py-1">
                      <span className="font-mono text-blue-600">{entry.entry}</span>
                      <span>{entry.date}</span>
                      <div className="text-right">
                        <div>{entry.amount}</div>
                        <div className="text-gray-500">{entry.currency}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Days Payable Outstanding */}
            <div className="bg-white rounded border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 text-sm">Days Payable Outstanding</h3>
                <p className="text-xs text-gray-600">Indirect</p>
                <p className="text-xs text-gray-600">DPO Average - Last 6 Months</p>
              </div>
              <div className="p-4 text-center">
                <div className="text-3xl font-light text-gray-900 mb-2">33</div>
                <div className="text-xs text-gray-600 mb-4">In Days</div>
                <div className="space-y-2">
                  <div className="text-xs font-medium">DPO by Month</div>
                  <div className="text-2xl font-light">250</div>
                  <div className="h-20 bg-gray-50 rounded flex items-end justify-center">
                    <div className="flex items-end gap-1">
                      <div className="w-4 h-8 bg-blue-500 rounded-t"></div>
                      <div className="w-4 h-12 bg-blue-500 rounded-t"></div>
                      <div className="w-4 h-6 bg-blue-500 rounded-t"></div>
                      <div className="w-4 h-16 bg-blue-500 rounded-t"></div>
                      <div className="w-4 h-10 bg-blue-500 rounded-t"></div>
                      <div className="w-4 h-4 bg-blue-500 rounded-t"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Actual</span>
                    <span>Previous Year</span>
                  </div>
                </div>
              </div>
            </div>

            {/* My Inbox */}
            <div className="bg-white rounded border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 text-sm">My Inbox</h3>
                <p className="text-xs text-gray-600 mt-1">5 of 96</p>
                <p className="text-xs text-gray-600">By Priority</p>
                <div className="mt-2">
                  <select className="text-xs border border-gray-300 rounded px-2 py-1 w-full">
                    <option>All</option>
                  </select>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {inboxItems.map((item, index) => (
                    <div key={index} className="text-xs">
                      <div className="text-blue-600 hover:text-blue-800 cursor-pointer truncate">
                        {item}
                      </div>
                      <div className="text-gray-600 mt-1">SAP Workflow Runtime</div>
                      <div className="text-gray-600">16.03.2022</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Days Sales Outstanding */}
            <div className="bg-white rounded border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 text-sm">Days Sales Outstanding</h3>
                <p className="text-xs text-gray-600">DSO vs Best possible DSO</p>
              </div>
              <div className="p-4 text-center">
                <div className="text-3xl font-light text-gray-900 mb-2">94.0</div>
                <div className="text-xs text-gray-600 mb-4">Average DSO</div>
                <div className="space-y-2">
                  <div className="text-xs font-medium">By Company Code</div>
                  <div className="text-xs font-medium">DSO by Company Code</div>
                  <div className="text-2xl font-light">100</div>
                  <div className="h-16 bg-gray-50 rounded flex items-end justify-center">
                    <div className="w-16 h-12 bg-blue-500 rounded-t"></div>
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