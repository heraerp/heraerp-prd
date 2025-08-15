'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { DatePickerWithRange } from '@/components/ui/date-range-picker' // Not available
import { useAuth } from '@/contexts/auth-context'
import { 
  FileText, 
  Download, 
  Printer, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  PieChart, 
  Calendar,
  Users,
  Scissors,
  Palette,
  Receipt,
  Calculator,
  Building,
  Globe,
  Sparkles,
  Crown,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertCircle,
  Clock,
  Banknote,
  CreditCard,
  Wallet,
  Package,
  UserCheck,
  Star,
  MapPin,
  Calendar as CalendarIcon,
  LineChart,
  Archive,
  MoreHorizontal,
  Settings
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

// UAE/Dubai Salon Business - Chart of Accounts
const DUBAI_SALON_COA = {
  // Assets
  ASSETS: {
    '1000': { name: 'Current Assets', type: 'header', parent: null },
    '1100': { name: 'Cash and Bank Accounts', type: 'header', parent: '1000' },
    '1110': { name: 'Petty Cash', type: 'account', parent: '1100', balance: 2500 },
    '1120': { name: 'ADCB Current Account (AED)', type: 'account', parent: '1100', balance: 145000 },
    '1125': { name: 'Emirates NBD USD Account', type: 'account', parent: '1100', balance: 25000 },
    '1130': { name: 'FAB EUR Account', type: 'account', parent: '1100', balance: 15000 },
    
    '1200': { name: 'Accounts Receivable', type: 'header', parent: '1000' },
    '1210': { name: 'Customer Receivables', type: 'account', parent: '1200', balance: 18500 },
    '1220': { name: 'Staff Advances', type: 'account', parent: '1200', balance: 3200 },
    
    '1300': { name: 'Inventory', type: 'header', parent: '1000' },
    '1310': { name: 'Hair Products Inventory', type: 'account', parent: '1300', balance: 25000 },
    '1320': { name: 'Nail Products Inventory', type: 'account', parent: '1300', balance: 8500 },
    '1330': { name: 'Skincare Products Inventory', type: 'account', parent: '1300', balance: 12000 },
    '1340': { name: 'Makeup Products Inventory', type: 'account', parent: '1300', balance: 15000 },
    '1350': { name: 'Salon Supplies Inventory', type: 'account', parent: '1300', balance: 5000 },
    
    '1500': { name: 'Fixed Assets', type: 'header', parent: null },
    '1510': { name: 'Salon Equipment', type: 'account', parent: '1500', balance: 85000 },
    '1520': { name: 'Furniture & Fixtures', type: 'account', parent: '1500', balance: 45000 },
    '1530': { name: 'Computer Equipment', type: 'account', parent: '1500', balance: 15000 },
    '1540': { name: 'Leasehold Improvements', type: 'account', parent: '1500', balance: 120000 },
    '1550': { name: 'Accumulated Depreciation', type: 'account', parent: '1500', balance: -25000 }
  },
  
  // Liabilities  
  LIABILITIES: {
    '2000': { name: 'Current Liabilities', type: 'header', parent: null },
    '2100': { name: 'Accounts Payable', type: 'header', parent: '2000' },
    '2110': { name: 'Suppliers Payable', type: 'account', parent: '2100', balance: 12000 },
    '2120': { name: 'Beauty Product Suppliers', type: 'account', parent: '2100', balance: 8500 },
    
    '2200': { name: 'Accrued Expenses', type: 'header', parent: '2000' },
    '2210': { name: 'Staff Salaries Payable', type: 'account', parent: '2200', balance: 25000 },
    '2220': { name: 'Commission Payable', type: 'account', parent: '2200', balance: 8000 },
    '2230': { name: 'Tips Payable', type: 'account', parent: '2200', balance: 3500 },
    
    '2300': { name: 'Government Liabilities', type: 'header', parent: '2000' },
    '2310': { name: 'VAT Payable (5%)', type: 'account', parent: '2300', balance: 5200 },
    '2320': { name: 'Dubai Municipality Fees Payable', type: 'account', parent: '2300', balance: 1200 },
    '2330': { name: 'Trade License Fees Payable', type: 'account', parent: '2300', balance: 2500 },
    '2340': { name: 'MOHRE Labor Fees Payable', type: 'account', parent: '2300', balance: 1800 },
    
    '2400': { name: 'Long-term Liabilities', type: 'header', parent: null },
    '2410': { name: 'Equipment Financing', type: 'account', parent: '2400', balance: 35000 },
    '2420': { name: 'Security Deposits', type: 'account', parent: '2400', balance: 15000 }
  },
  
  // Equity
  EQUITY: {
    '3000': { name: 'Owner\'s Equity', type: 'header', parent: null },
    '3100': { name: 'Owner Capital', type: 'account', parent: '3000', balance: 200000 },
    '3200': { name: 'Retained Earnings', type: 'account', parent: '3000', balance: 85000 },
    '3300': { name: 'Current Year Earnings', type: 'account', parent: '3000', balance: 45000 }
  },
  
  // Revenue
  REVENUE: {
    '4000': { name: 'Service Revenue', type: 'header', parent: null },
    '4100': { name: 'Hair Services', type: 'header', parent: '4000' },
    '4110': { name: 'Hair Cut & Styling', type: 'account', parent: '4100', balance: 125000 },
    '4120': { name: 'Hair Coloring', type: 'account', parent: '4100', balance: 85000 },
    '4130': { name: 'Hair Treatments', type: 'account', parent: '4100', balance: 45000 },
    '4140': { name: 'Bridal Hair', type: 'account', parent: '4100', balance: 35000 },
    
    '4200': { name: 'Beauty Services', type: 'header', parent: '4000' },
    '4210': { name: 'Facial Treatments', type: 'account', parent: '4200', balance: 65000 },
    '4220': { name: 'Nail Services', type: 'account', parent: '4200', balance: 40000 },
    '4230': { name: 'Makeup Services', type: 'account', parent: '4200', balance: 30000 },
    '4240': { name: 'Eyebrow & Lash Services', type: 'account', parent: '4200', balance: 25000 },
    
    '4300': { name: 'Spa Services', type: 'header', parent: '4000' },
    '4310': { name: 'Body Massage', type: 'account', parent: '4300', balance: 55000 },
    '4320': { name: 'Body Treatments', type: 'account', parent: '4300', balance: 35000 },
    
    '4400': { name: 'Product Sales', type: 'header', parent: '4000' },
    '4410': { name: 'Hair Product Sales', type: 'account', parent: '4400', balance: 25000 },
    '4420': { name: 'Skincare Product Sales', type: 'account', parent: '4400', balance: 15000 },
    '4430': { name: 'Makeup Product Sales', type: 'account', parent: '4400', balance: 12000 },
    
    '4500': { name: 'Package & Membership Sales', type: 'header', parent: '4000' },
    '4510': { name: 'VIP Package Sales', type: 'account', parent: '4500', balance: 45000 },
    '4520': { name: 'Monthly Membership Fees', type: 'account', parent: '4500', balance: 28000 }
  },
  
  // Expenses
  EXPENSES: {
    '5000': { name: 'Cost of Sales', type: 'header', parent: null },
    '5100': { name: 'Product Costs', type: 'account', parent: '5000', balance: 35000 },
    '5200': { name: 'Direct Service Costs', type: 'account', parent: '5000', balance: 15000 },
    
    '6000': { name: 'Operating Expenses', type: 'header', parent: null },
    '6100': { name: 'Staff Expenses', type: 'header', parent: '6000' },
    '6110': { name: 'Stylist Salaries', type: 'account', parent: '6100', balance: 180000 },
    '6120': { name: 'Therapist Salaries', type: 'account', parent: '6100', balance: 120000 },
    '6130': { name: 'Reception Staff Salaries', type: 'account', parent: '6100', balance: 60000 },
    '6140': { name: 'Staff Commission', type: 'account', parent: '6100', balance: 45000 },
    '6150': { name: 'Staff Tips Distribution', type: 'account', parent: '6100', balance: 25000 },
    '6160': { name: 'Staff Training', type: 'account', parent: '6100', balance: 8000 },
    '6170': { name: 'Staff End of Service Benefits', type: 'account', parent: '6100', balance: 15000 },
    
    '6200': { name: 'Facility Expenses', type: 'header', parent: '6000' },
    '6210': { name: 'Rent Expense', type: 'account', parent: '6200', balance: 120000 },
    '6220': { name: 'Utilities (DEWA)', type: 'account', parent: '6200', balance: 25000 },
    '6230': { name: 'Cleaning & Maintenance', type: 'account', parent: '6200', balance: 12000 },
    '6240': { name: 'Security Services', type: 'account', parent: '6200', balance: 18000 },
    
    '6300': { name: 'Marketing & Advertising', type: 'header', parent: '6000' },
    '6310': { name: 'Social Media Marketing', type: 'account', parent: '6300', balance: 15000 },
    '6320': { name: 'Online Advertising', type: 'account', parent: '6300', balance: 12000 },
    '6330': { name: 'Print Advertising', type: 'account', parent: '6300', balance: 5000 },
    '6340': { name: 'Promotional Events', type: 'account', parent: '6300', balance: 8000 },
    
    '6400': { name: 'Administrative Expenses', type: 'header', parent: '6000' },
    '6410': { name: 'Management Salaries', type: 'account', parent: '6400', balance: 60000 },
    '6420': { name: 'Professional Services', type: 'account', parent: '6400', balance: 15000 },
    '6430': { name: 'Software Subscriptions', type: 'account', parent: '6400', balance: 8000 },
    '6440': { name: 'Telecommunications', type: 'account', parent: '6400', balance: 6000 },
    
    '6500': { name: 'Government Fees', type: 'header', parent: '6000' },
    '6510': { name: 'Dubai Municipality Fees', type: 'account', parent: '6500', balance: 12000 },
    '6520': { name: 'Trade License Fees', type: 'account', parent: '6500', balance: 8000 },
    '6530': { name: 'MOHRE Fees', type: 'account', parent: '6500', balance: 15000 },
    '6540': { name: 'DHA Health Permits', type: 'account', parent: '6500', balance: 3000 },
    
    '6600': { name: 'Financial Expenses', type: 'header', parent: '6000' },
    '6610': { name: 'Bank Charges', type: 'account', parent: '6600', balance: 3000 },
    '6620': { name: 'Interest Expense', type: 'account', parent: '6600', balance: 5000 },
    '6630': { name: 'Currency Exchange Loss', type: 'account', parent: '6600', balance: 2000 },
    
    '6700': { name: 'Depreciation & Amortization', type: 'header', parent: '6000' },
    '6710': { name: 'Equipment Depreciation', type: 'account', parent: '6700', balance: 15000 },
    '6720': { name: 'Leasehold Amortization', type: 'account', parent: '6700', balance: 12000 }
  }
}

// Sample data for reports
const SAMPLE_DATA = {
  monthlyRevenue: [
    { month: 'Jul 2024', revenue: 85000, expenses: 65000, profit: 20000, services: 70000, products: 15000 },
    { month: 'Aug 2024', revenue: 92000, expenses: 68000, profit: 24000, services: 78000, products: 14000 },
    { month: 'Sep 2024', revenue: 88000, expenses: 66000, profit: 22000, services: 74000, products: 14000 },
    { month: 'Oct 2024', revenue: 95000, expenses: 70000, profit: 25000, services: 80000, products: 15000 },
    { month: 'Nov 2024', revenue: 98000, expenses: 72000, profit: 26000, services: 83000, products: 15000 },
    { month: 'Dec 2024', revenue: 105000, expenses: 75000, profit: 30000, services: 88000, products: 17000 },
    { month: 'Jan 2025', revenue: 115000, expenses: 78000, profit: 37000, services: 95000, products: 20000 }
  ],
  
  serviceBreakdown: [
    { name: 'Hair Services', value: 290000, color: '#8B5CF6', percentage: 42 },
    { name: 'Beauty Services', value: 160000, color: '#EC4899', percentage: 23 },
    { name: 'Spa Services', value: 90000, color: '#06B6D4', percentage: 13 },
    { name: 'Product Sales', value: 52000, color: '#10B981', percentage: 8 },
    { name: 'Packages', value: 73000, color: '#F59E0B', percentage: 11 },
    { name: 'Other', value: 25000, color: '#6B7280', percentage: 3 }
  ],
  
  dailyCash: [
    { date: '2025-01-13', opening: 5000, sales: 8500, expenses: 2000, closing: 11500 },
    { date: '2025-01-14', opening: 11500, sales: 9200, expenses: 2200, closing: 18500 },
    { date: '2025-01-15', opening: 18500, sales: 7800, expenses: 1800, closing: 24500 }
  ],
  
  staffPerformance: [
    { name: 'Sarah Al-Zahra', role: 'Senior Stylist', revenue: 45000, clients: 128, commission: 6750, tips: 2500 },
    { name: 'Fatima Hassan', role: 'Beauty Therapist', revenue: 38000, clients: 95, commission: 5700, tips: 1800 },
    { name: 'Aisha Mohammed', role: 'Nail Specialist', revenue: 32000, clients: 142, commission: 4800, tips: 2100 },
    { name: 'Mariam Ahmad', role: 'Massage Therapist', revenue: 28000, clients: 76, commission: 4200, tips: 1200 },
    { name: 'Noura Ali', role: 'Junior Stylist', revenue: 22000, clients: 89, commission: 3300, tips: 900 }
  ],
  
  clientAnalysis: [
    { segment: 'VIP Members', count: 45, revenue: 125000, avgSpend: 2778, retention: 95 },
    { segment: 'Regular Clients', count: 320, revenue: 380000, avgSpend: 1188, retention: 78 },
    { segment: 'New Clients', count: 156, revenue: 95000, avgSpend: 609, retention: 45 },
    { segment: 'Walk-ins', count: 89, revenue: 25000, avgSpend: 281, retention: 12 }
  ],
  
  vatReport: {
    outputVAT: 32500,
    inputVAT: 8750,
    netVAT: 23750,
    transactions: [
      { date: '2025-01-15', type: 'Service Sale', amount: 1000, vat: 50, customer: 'Luxury Hair Package' },
      { date: '2025-01-15', type: 'Product Sale', amount: 500, vat: 25, customer: 'Premium Skincare Set' },
      { date: '2025-01-14', type: 'Supply Purchase', amount: -800, vat: -40, supplier: 'Beauty Products LLC' }
    ]
  }
}

export default function FinancialReportsPage() {
  const { user, isAuthenticated } = useAuth()
  const [selectedReport, setSelectedReport] = useState('profit-loss')
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [selectedCurrency, setSelectedCurrency] = useState('AED')
  const [arabicNumbers, setArabicNumbers] = useState(false)
  const [islamicCalendar, setIslamicCalendar] = useState(false)
  const [loading, setLoading] = useState(false)

  const formatCurrency = (amount: number, currency = selectedCurrency) => {
    const formatted = new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
    
    if (arabicNumbers) {
      return formatted.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)])
    }
    return formatted
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Calculate key metrics
  const totalRevenue = Object.values(DUBAI_SALON_COA.REVENUE).reduce((sum, account) => 
    account.type === 'account' ? sum + (account.balance || 0) : sum, 0
  )
  
  const totalExpenses = Object.values(DUBAI_SALON_COA.EXPENSES).reduce((sum, account) => 
    account.type === 'account' ? sum + (account.balance || 0) : sum, 0
  )
  
  const netProfit = totalRevenue - totalExpenses
  const profitMargin = (netProfit / totalRevenue) * 100

  const totalAssets = Object.values({...DUBAI_SALON_COA.ASSETS}).reduce((sum, account) => 
    account.type === 'account' ? sum + Math.abs(account.balance || 0) : sum, 0
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md bg-white/40 backdrop-blur-xl border border-white/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <Scissors className="w-12 h-12 text-pink-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600">Please log in to access Dubai salon financial reports.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Glassmorphism Header */}
      <div className="sticky top-0 z-50 bg-white/30 backdrop-blur-2xl border-b border-white/30 shadow-xl shadow-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 shadow-xl shadow-pink-500/25">
                <Scissors className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Dubai Salon Financial Reports
                </h1>
                <p className="text-slate-700 font-medium">
                  ✨ Glamour Beauty Salon • Dubai Marina • UAE VAT Compliant
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 border-green-500/30">
                <MapPin className="w-3 h-3 mr-1" />
                Dubai, UAE
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 border-blue-500/30">
                HERA.FIN.SALON.AE.v1
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12.4%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-3">
                <Badge variant="outline" className="text-xs">HERA.FIN.REPT.REV.v1</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Net Profit</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(netProfit)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-sm text-blue-600">{formatPercentage(profitMargin)} margin</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-3">
                <Badge variant="outline" className="text-xs">HERA.FIN.REPT.NPM.v1</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Monthly Clients</p>
                  <p className="text-2xl font-bold text-slate-900">610</p>
                  <div className="flex items-center mt-2">
                    <Users className="w-4 h-4 text-purple-500 mr-1" />
                    <span className="text-sm text-purple-600">+8.3%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-3">
                <Badge variant="outline" className="text-xs">HERA.SALON.CLIENTS.v1</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">VAT Payable</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(SAMPLE_DATA.vatReport.netVAT)}</p>
                  <div className="flex items-center mt-2">
                    <Calculator className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">5% UAE VAT</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-3">
                <Badge variant="outline" className="text-xs">HERA.UAE.VAT.v1</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Controls */}
        <Card className="mb-8 bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Currency</label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger className="bg-white/40 backdrop-blur-xl border-white/30 hera-select-content">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="AED">AED (Dirham)</SelectItem>
                    <SelectItem value="USD">USD (Dollar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="bg-white/40 backdrop-blur-xl border-white/30 hera-select-content">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <input 
                  type="checkbox" 
                  id="arabic-numbers" 
                  checked={arabicNumbers}
                  onChange={(e) => setArabicNumbers(e.target.checked)}
                  className="rounded border-white/30"
                />
                <label htmlFor="arabic-numbers" className="text-sm text-slate-700">Arabic Numbers</label>
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <input 
                  type="checkbox" 
                  id="islamic-calendar" 
                  checked={islamicCalendar}
                  onChange={(e) => setIslamicCalendar(e.target.checked)}
                  className="rounded border-white/30"
                />
                <label htmlFor="islamic-calendar" className="text-sm text-slate-700">Islamic Calendar</label>
              </div>
              
              <div className="pt-6">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
              
              <div className="pt-6">
                <Button variant="outline" className="w-full bg-white/40 backdrop-blur-xl border-white/30">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Tabs */}
        <Tabs value={selectedReport} onValueChange={setSelectedReport} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-white/40 backdrop-blur-xl border border-white/20 p-1 rounded-2xl">
            <TabsTrigger value="profit-loss" className="rounded-xl">P&L</TabsTrigger>
            <TabsTrigger value="balance-sheet" className="rounded-xl">Balance Sheet</TabsTrigger>
            <TabsTrigger value="cash-flow" className="rounded-xl">Cash Flow</TabsTrigger>
            <TabsTrigger value="vat-report" className="rounded-xl">VAT Report</TabsTrigger>
            <TabsTrigger value="staff-performance" className="rounded-xl">Staff</TabsTrigger>
            <TabsTrigger value="client-analysis" className="rounded-xl">Clients</TabsTrigger>
          </TabsList>

          {/* Profit & Loss Statement */}
          <TabsContent value="profit-loss">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Profit & Loss Statement - Glamour Beauty Salon
                    </CardTitle>
                    <p className="text-sm text-slate-600">For the period ending January 15, 2025</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Revenue Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                          <Sparkles className="w-5 h-5 mr-2 text-pink-500" />
                          REVENUE
                        </h3>
                        <div className="space-y-2 pl-4 border-l-2 border-pink-200">
                          {Object.entries(DUBAI_SALON_COA.REVENUE).map(([code, account]) => {
                            if (account.type === 'account' && account.balance) {
                              return (
                                <div key={code} className="flex justify-between items-center py-2 border-b border-slate-100">
                                  <span className="text-slate-700">{code} - {account.name}</span>
                                  <span className="font-medium text-slate-900">{formatCurrency(account.balance)}</span>
                                </div>
                              )
                            }
                            return null
                          })}
                          <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg border-2 border-green-200">
                            <span className="font-semibold text-green-800">TOTAL REVENUE</span>
                            <span className="font-bold text-green-900 text-lg">{formatCurrency(totalRevenue)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expenses Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                          <Receipt className="w-5 h-5 mr-2 text-red-500" />
                          EXPENSES
                        </h3>
                        <div className="space-y-2 pl-4 border-l-2 border-red-200">
                          {/* Group expenses by category */}
                          {Object.entries(DUBAI_SALON_COA.EXPENSES).map(([code, account]) => {
                            if (account.type === 'header' && account.parent) {
                              const categoryExpenses = Object.entries(DUBAI_SALON_COA.EXPENSES)
                                .filter(([c, a]) => a.parent === code && a.type === 'account')
                                .reduce((sum, [, a]) => sum + (a.balance || 0), 0)
                              
                              if (categoryExpenses > 0) {
                                return (
                                  <div key={code} className="py-2">
                                    <div className="flex justify-between items-center font-medium text-slate-800 mb-2">
                                      <span>{account.name}</span>
                                      <span>{formatCurrency(categoryExpenses)}</span>
                                    </div>
                                    <div className="pl-4 space-y-1">
                                      {Object.entries(DUBAI_SALON_COA.EXPENSES)
                                        .filter(([c, a]) => a.parent === code && a.type === 'account' && a.balance)
                                        .map(([subCode, subAccount]) => (
                                          <div key={subCode} className="flex justify-between text-sm text-slate-600">
                                            <span>{subCode} - {subAccount.name}</span>
                                            <span>{formatCurrency(subAccount.balance || 0)}</span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )
                              }
                            }
                            return null
                          })}
                          <div className="flex justify-between items-center py-3 bg-red-50 px-4 rounded-lg border-2 border-red-200">
                            <span className="font-semibold text-red-800">TOTAL EXPENSES</span>
                            <span className="font-bold text-red-900 text-lg">{formatCurrency(totalExpenses)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Net Profit */}
                      <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-purple-50 px-6 rounded-xl border-2 border-blue-200">
                        <span className="font-bold text-blue-800 text-lg">NET PROFIT</span>
                        <span className="font-bold text-blue-900 text-xl">{formatCurrency(netProfit)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Trends Chart */}
              <div>
                <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="w-5 h-5" />
                      Revenue Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={SAMPLE_DATA.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} />
                        <Tooltip 
                          formatter={(value) => formatCurrency(Number(value))}
                          labelStyle={{color: '#1e293b'}}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} />
                        <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Service Breakdown */}
                <Card className="mt-6 bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Service Revenue Mix
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie 
                          data={SAMPLE_DATA.serviceBreakdown} 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={80} 
                          dataKey="value"
                        >
                          {SAMPLE_DATA.serviceBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {SAMPLE_DATA.serviceBreakdown.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: item.color}}></div>
                            <span className="text-sm text-slate-700">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Balance Sheet */}
          <TabsContent value="balance-sheet">
            <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Balance Sheet - Glamour Beauty Salon
                </CardTitle>
                <p className="text-sm text-slate-600">As of January 15, 2025</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Assets */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      ASSETS
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(DUBAI_SALON_COA.ASSETS).map(([code, account]) => {
                        if (account.type === 'header' && !account.parent) {
                          const categoryTotal = Object.entries(DUBAI_SALON_COA.ASSETS)
                            .filter(([c, a]) => a.parent === code && a.type === 'account')
                            .reduce((sum, [, a]) => sum + Math.abs(a.balance || 0), 0)
                          
                          return (
                            <div key={code} className="bg-blue-50 p-4 rounded-lg">
                              <div className="flex justify-between items-center font-semibold text-blue-800 mb-2">
                                <span>{account.name}</span>
                                <span>{formatCurrency(categoryTotal)}</span>
                              </div>
                              <div className="pl-4 space-y-1">
                                {Object.entries(DUBAI_SALON_COA.ASSETS)
                                  .filter(([c, a]) => a.parent === code && a.type === 'account')
                                  .map(([subCode, subAccount]) => (
                                    <div key={subCode} className="flex justify-between text-sm text-slate-600">
                                      <span>{subCode} - {subAccount.name}</span>
                                      <span>{formatCurrency(Math.abs(subAccount.balance || 0))}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="space-y-6">
                    {/* Liabilities */}
                    <div>
                      <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        LIABILITIES
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(DUBAI_SALON_COA.LIABILITIES).map(([code, account]) => {
                          if (account.type === 'header' && !account.parent) {
                            const categoryTotal = Object.entries(DUBAI_SALON_COA.LIABILITIES)
                              .filter(([c, a]) => a.parent === code && a.type === 'account')
                              .reduce((sum, [, a]) => sum + (a.balance || 0), 0)
                            
                            return (
                              <div key={code} className="bg-red-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center font-semibold text-red-800 mb-2">
                                  <span>{account.name}</span>
                                  <span>{formatCurrency(categoryTotal)}</span>
                                </div>
                                <div className="pl-4 space-y-1">
                                  {Object.entries(DUBAI_SALON_COA.LIABILITIES)
                                    .filter(([c, a]) => a.parent === code && a.type === 'account')
                                    .map(([subCode, subAccount]) => (
                                      <div key={subCode} className="flex justify-between text-sm text-slate-600">
                                        <span>{subCode} - {subAccount.name}</span>
                                        <span>{formatCurrency(subAccount.balance || 0)}</span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    </div>

                    {/* Equity */}
                    <div>
                      <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                        <Crown className="w-5 h-5 mr-2" />
                        OWNER'S EQUITY
                      </h3>
                      <div className="bg-green-50 p-4 rounded-lg space-y-2">
                        {Object.entries(DUBAI_SALON_COA.EQUITY).map(([code, account]) => {
                          if (account.type === 'account') {
                            return (
                              <div key={code} className="flex justify-between text-sm">
                                <span>{code} - {account.name}</span>
                                <span className="font-medium">{formatCurrency(account.balance || 0)}</span>
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cash Flow Statement */}
          <TabsContent value="cash-flow">
            <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Cash Flow Statement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Daily Cash Report</h3>
                    <div className="space-y-4">
                      {SAMPLE_DATA.dailyCash.map((day, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-slate-800">{new Date(day.date).toLocaleDateString()}</span>
                            <Badge className="bg-blue-100 text-blue-700">
                              <CalendarIcon className="w-3 h-3 mr-1" />
                              {islamicCalendar ? 'Islamic: 15 Rajab 1446' : 'Gregorian'}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Opening Cash:</span>
                              <span className="font-medium">{formatCurrency(day.opening)}</span>
                            </div>
                            <div className="flex justify-between text-green-700">
                              <span>Sales Received:</span>
                              <span className="font-medium">+{formatCurrency(day.sales)}</span>
                            </div>
                            <div className="flex justify-between text-red-700">
                              <span>Expenses Paid:</span>
                              <span className="font-medium">-{formatCurrency(day.expenses)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 font-semibold">
                              <span>Closing Cash:</span>
                              <span>{formatCurrency(day.closing)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Cash Flow Chart</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={SAMPLE_DATA.monthlyRevenue}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#8B5CF6" 
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VAT Report */}
          <TabsContent value="vat-report">
            <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  UAE VAT Report (5%)
                </CardTitle>
                <p className="text-sm text-slate-600">VAT compliance for Federal Tax Authority (FTA)</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">VAT Summary</h3>
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-green-800 font-medium">Output VAT (Sales)</span>
                          <span className="text-green-900 font-bold">{formatCurrency(SAMPLE_DATA.vatReport.outputVAT)}</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">VAT collected on services & products</p>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-800 font-medium">Input VAT (Purchases)</span>
                          <span className="text-blue-900 font-bold">{formatCurrency(SAMPLE_DATA.vatReport.inputVAT)}</span>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">VAT paid on business purchases</p>
                      </div>
                      
                      <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                        <div className="flex justify-between items-center">
                          <span className="text-orange-800 font-semibold">Net VAT Payable</span>
                          <span className="text-orange-900 font-bold text-lg">{formatCurrency(SAMPLE_DATA.vatReport.netVAT)}</span>
                        </div>
                        <p className="text-sm text-orange-600 mt-1">Amount due to FTA</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-medium text-slate-800 mb-3">Government Compliance</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-sm">VAT Registration</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-blue-500 mr-2" />
                            <span className="text-sm">Next Filing Due</span>
                          </div>
                          <span className="text-sm font-medium">Feb 28, 2025</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />
                            <span className="text-sm">Zakat Calculation</span>
                          </div>
                          <Button size="sm" variant="outline">Calculate</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent VAT Transactions</h3>
                    <div className="space-y-3">
                      {SAMPLE_DATA.vatReport.transactions.map((transaction, index) => (
                        <div key={index} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium text-slate-800">{transaction.type}</span>
                              <p className="text-sm text-slate-600">{transaction.customer || transaction.supplier}</p>
                            </div>
                            <Badge variant={transaction.vat > 0 ? 'default' : 'secondary'}>
                              {transaction.vat > 0 ? 'Output' : 'Input'} VAT
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">{transaction.date}</span>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(Math.abs(transaction.amount))}</div>
                              <div className="text-sm text-slate-600">VAT: {formatCurrency(Math.abs(transaction.vat))}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Generate FTA VAT Return
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Performance */}
          <TabsContent value="staff-performance">
            <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Staff Performance Report
                </CardTitle>
                <p className="text-sm text-slate-600">Revenue per stylist and commission tracking</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SAMPLE_DATA.staffPerformance.map((staff, index) => (
                    <div key={index} className="bg-gradient-to-r from-white to-purple-50 p-6 rounded-xl border border-purple-100 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                            <span className="text-white font-bold">
                              {staff.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{staff.name}</h4>
                            <p className="text-sm text-slate-600">{staff.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">Top Performer</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-700">{formatCurrency(staff.revenue)}</div>
                          <div className="text-xs text-slate-600">Revenue Generated</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-700">{staff.clients}</div>
                          <div className="text-xs text-slate-600">Clients Served</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-700">{formatCurrency(staff.commission)}</div>
                          <div className="text-xs text-slate-600">Commission Earned</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-700">{formatCurrency(staff.tips)}</div>
                          <div className="text-xs text-slate-600">Tips Received</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <Badge className="bg-purple-100 text-purple-700">
                          Avg: {formatCurrency(staff.revenue / staff.clients)} per client
                        </Badge>
                        <Badge variant="outline">HERA.STAFF.PERF.v1</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Analysis */}
          <TabsContent value="client-analysis">
            <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Client Revenue Analysis
                </CardTitle>
                <p className="text-sm text-slate-600">Customer segmentation and lifetime value</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Client Segments</h3>
                    <div className="space-y-4">
                      {SAMPLE_DATA.clientAnalysis.map((segment, index) => (
                        <div key={index} className="bg-gradient-to-r from-white to-blue-50 p-5 rounded-xl border border-blue-100">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-slate-800">{segment.segment}</h4>
                            <Badge className={
                              segment.segment === 'VIP Members' ? 'bg-gold-100 text-gold-700' :
                              segment.segment === 'Regular Clients' ? 'bg-blue-100 text-blue-700' :
                              segment.segment === 'New Clients' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {segment.retention}% retention
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="font-medium text-slate-900">{segment.count}</div>
                              <div className="text-slate-600">Clients</div>
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{formatCurrency(segment.revenue)}</div>
                              <div className="text-slate-600">Revenue</div>
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{formatCurrency(segment.avgSpend)}</div>
                              <div className="text-slate-600">Avg Spend</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Revenue by Segment</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={SAMPLE_DATA.clientAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="segment" tick={{fontSize: 10}} />
                        <YAxis tick={{fontSize: 12}} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>

                    <div className="mt-6 space-y-3">
                      <h4 className="font-medium text-slate-800">Key Insights</h4>
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-start">
                          <Sparkles className="w-4 h-4 text-yellow-500 mt-0.5 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800">VIP Program Success</p>
                            <p className="text-xs text-yellow-700 mt-1">
                              VIP members have 95% retention and spend 2.3x more than regular clients
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start">
                          <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Growth Opportunity</p>
                            <p className="text-xs text-blue-700 mt-1">
                              156 new clients this month - focus on retention programs
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}