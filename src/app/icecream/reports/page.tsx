'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCardDNA, StatCardGrid } from '@/lib/dna/components/ui/stat-card-dna'
import { 
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  FileBarChart,
  FileLineChart,
  Clock,
  Filter,
  Send
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Kochi Ice Cream Org ID
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

interface Report {
  id: string
  name: string
  description: string
  category: string
  frequency: string
  lastGenerated?: string
  size?: string
  icon: any
  color: string
}

const availableReports: Report[] = [
  {
    id: '1',
    name: 'Production Summary Report',
    description: 'Daily production batches, efficiency metrics, and yield analysis',
    category: 'Production',
    frequency: 'Daily',
    icon: FileBarChart,
    color: 'from-blue-400 to-purple-400'
  },
  {
    id: '2',
    name: 'Sales Performance Report',
    description: 'Revenue breakdown by outlet, product category, and time period',
    category: 'Sales',
    frequency: 'Weekly',
    icon: TrendingUp,
    color: 'from-green-400 to-emerald-400'
  },
  {
    id: '3',
    name: 'Inventory Status Report',
    description: 'Stock levels, expiry tracking, and FEFO compliance',
    category: 'Inventory',
    frequency: 'Daily',
    icon: FileSpreadsheet,
    color: 'from-cyan-400 to-blue-400'
  },
  {
    id: '4',
    name: 'Quality Control Report',
    description: 'FSSAI compliance, test results, and batch approvals',
    category: 'Quality',
    frequency: 'Weekly',
    icon: FileLineChart,
    color: 'from-green-400 to-teal-400'
  },
  {
    id: '5',
    name: 'Financial Summary Report',
    description: 'P&L statement, cost analysis, and margin tracking',
    category: 'Finance',
    frequency: 'Monthly',
    icon: BarChart3,
    color: 'from-purple-400 to-pink-400'
  },
  {
    id: '6',
    name: 'Outlet Performance Report',
    description: 'Comparative analysis of outlet sales and efficiency',
    category: 'Operations',
    frequency: 'Weekly',
    icon: PieChart,
    color: 'from-orange-400 to-red-400'
  }
]

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [reportHistory, setReportHistory] = useState<any[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  useEffect(() => {
    // Simulate fetching report history
    const history = availableReports.map(report => ({
      ...report,
      lastGenerated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      size: `${Math.floor(Math.random() * 900) + 100} KB`
    }))
    setReportHistory(history)
  }, [])

  async function generateReport(report: Report) {
    setLoading(true)
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert(`${report.name} generated successfully!`)
      
      // Update last generated time
      const updatedHistory = reportHistory.map(r => 
        r.id === report.id 
          ? { ...r, lastGenerated: new Date().toISOString() }
          : r
      )
      setReportHistory(updatedHistory)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  function getCategoryBadgeColor(category: string) {
    switch (category) {
      case 'Production': return 'bg-blue-500'
      case 'Sales': return 'bg-green-500'
      case 'Inventory': return 'bg-cyan-500'
      case 'Quality': return 'bg-teal-500'
      case 'Finance': return 'bg-purple-500'
      case 'Operations': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate and download business intelligence reports
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Reports
          </Button>
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
            <Send className="w-4 h-4 mr-2" />
            Email Reports
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <StatCardGrid columns={4}>
        <StatCardDNA
          title="Available Reports"
          value={availableReports.length}
          icon={FileText}
          iconGradient="from-indigo-500 to-purple-500"
        />
        
        <StatCardDNA
          title="Generated Today"
          value={3}
          icon={Clock}
          iconGradient="from-green-500 to-emerald-500"
        />
        
        <StatCardDNA
          title="Scheduled"
          value={5}
          icon={Calendar}
          iconGradient="from-purple-500 to-pink-500"
        />
        
        <StatCardDNA
          title="Total Storage"
          value="2.4 GB"
          icon={Download}
          iconGradient="from-blue-500 to-cyan-500"
        />
      </StatCardGrid>

      {/* Report Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableReports.map((report) => {
          const historyItem = reportHistory.find(r => r.id === report.id)
          const Icon = report.icon
          
          return (
            <Card
              key={report.id}
              className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-indigo-200/50 dark:border-indigo-800/50 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br",
                    report.color
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge className={cn("text-white", getCategoryBadgeColor(report.category))}>
                    {report.category}
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">{report.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {report.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Frequency: {report.frequency}</span>
                  {historyItem?.lastGenerated && (
                    <span>
                      Last: {new Date(historyItem.lastGenerated).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <div className="mt-4 flex items-center space-x-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      generateReport(report)
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      alert(`Downloading ${report.name}...`)
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Report Configuration */}
      {selectedReport && (
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-indigo-200/50 dark:border-indigo-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedReport.name} Configuration</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReport(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  />
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Format</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100">
                  <option>PDF</option>
                  <option>Excel</option>
                  <option>CSV</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Filters</label>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Additional filters available based on report type
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Schedule</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100">
                  <option>One-time</option>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-end space-x-2">
              <Button variant="outline">
                Save Configuration
              </Button>
              <Button 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                onClick={() => generateReport(selectedReport)}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}