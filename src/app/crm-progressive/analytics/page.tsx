'use client'

import React from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, DollarSign, Target, Activity, Calendar, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function CRMAnalyticsPage() {
  return (
    <CRMLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CRM Analytics</h1>
                <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="this-month">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Export Report</Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span>23%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">$124,500</p>
                <p className="text-xs text-gray-500 mt-1">vs. $101,200 last month</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span>15%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Deals Closed</p>
                <p className="text-2xl font-bold">28</p>
                <p className="text-xs text-gray-500 mt-1">vs. 24 last month</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span>8%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">New Customers</p>
                <p className="text-2xl font-bold">47</p>
                <p className="text-xs text-gray-500 mt-1">vs. 43 last month</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex items-center text-sm text-red-600">
                  <ArrowDown className="h-4 w-4 mr-1" />
                  <span>5%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">24.5%</p>
                <p className="text-xs text-gray-500 mt-1">vs. 25.8% last month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Revenue chart visualization</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Pipeline funnel visualization</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Rep Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sales Rep</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Deals Closed</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Revenue</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Conversion Rate</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Avg Deal Size</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">John Anderson</td>
                    <td className="py-3 px-4">12</td>
                    <td className="py-3 px-4">$45,200</td>
                    <td className="py-3 px-4">32%</td>
                    <td className="py-3 px-4">$3,767</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">Sarah Williams</td>
                    <td className="py-3 px-4">9</td>
                    <td className="py-3 px-4">$38,900</td>
                    <td className="py-3 px-4">28%</td>
                    <td className="py-3 px-4">$4,322</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">Mike Johnson</td>
                    <td className="py-3 px-4">7</td>
                    <td className="py-3 px-4">$40,400</td>
                    <td className="py-3 px-4">26%</td>
                    <td className="py-3 px-4">$5,771</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  )
}