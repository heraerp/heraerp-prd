'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Store,
  MapPin,
  Users,
  TrendingUp,
  Clock,
  Phone,
  Mail,
  DollarSign,
  Package,
  Thermometer,
  Activity,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Kochi Ice Cream Org ID
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

interface Outlet {
  id: string
  entity_name: string
  entity_code: string
  metadata: any
  sales?: number
  stockValue?: number
  lastDelivery?: string
}

interface OutletPerformance {
  totalSales: number
  transactionCount: number
  avgTicketSize: number
  topProducts: any[]
}

export default function OutletsPage() {
  const [loading, setLoading] = useState(true)
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null)
  const [outletPerformance, setOutletPerformance] = useState<OutletPerformance | null>(null)

  useEffect(() => {
    fetchOutletData()
  }, [])

  useEffect(() => {
    if (selectedOutlet) {
      fetchOutletPerformance(selectedOutlet.id)
    }
  }, [selectedOutlet])

  async function fetchOutletData() {
    try {
      // Fetch outlets
      const { data: outletData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'location')
        .like('entity_code', 'OUTLET%')

      // Fetch sales data for each outlet
      const outletsWithData = await Promise.all(
        (outletData || []).map(async (outlet) => {
          // Get sales for this outlet
          const { data: sales } = await supabase
            .from('universal_transactions')
            .select('total_amount')
            .eq('organization_id', ORG_ID)
            .eq('transaction_type', 'pos_sale')
            .eq('metadata->outlet_id', outlet.id)

          const totalSales = sales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0

          // Get latest delivery
          const { data: deliveries } = await supabase
            .from('universal_transactions')
            .select('transaction_date')
            .eq('organization_id', ORG_ID)
            .eq('transaction_type', 'inventory_transfer')
            .eq('metadata->to_location_id', outlet.id)
            .order('transaction_date', { ascending: false })
            .limit(1)

          return {
            ...outlet,
            sales: totalSales,
            stockValue: Math.random() * 50000 + 20000, // Mock stock value
            lastDelivery: deliveries?.[0]?.transaction_date
          }
        })
      )

      setOutlets(outletsWithData)
      if (outletsWithData.length > 0) {
        setSelectedOutlet(outletsWithData[0])
      }
    } catch (error) {
      console.error('Error fetching outlet data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchOutletPerformance(outletId: string) {
    try {
      // Fetch sales transactions for outlet
      const { data: sales } = await supabase
        .from('universal_transactions')
        .select(`
          *,
          universal_transaction_lines (*)
        `)
        .eq('organization_id', ORG_ID)
        .eq('transaction_type', 'pos_sale')
        .eq('metadata->outlet_id', outletId)

      const totalSales = sales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0
      const transactionCount = sales?.length || 0
      const avgTicketSize = transactionCount > 0 ? totalSales / transactionCount : 0

      // Calculate top products
      const productSales = new Map<string, { name: string, quantity: number, revenue: number }>()
      
      sales?.forEach(sale => {
        sale.universal_transaction_lines?.forEach((line: any) => {
          const productName = line.metadata?.product_name || 'Unknown'
          const existing = productSales.get(productName) || { name: productName, quantity: 0, revenue: 0 }
          existing.quantity += Math.abs(line.quantity)
          existing.revenue += line.line_amount || 0
          productSales.set(productName, existing)
        })
      })

      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      setOutletPerformance({
        totalSales,
        transactionCount,
        avgTicketSize,
        topProducts
      })
    } catch (error) {
      console.error('Error fetching outlet performance:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Outlet Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor and manage retail outlet performance
          </p>
        </div>
        <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
          <Store className="w-4 h-4 mr-2" />
          Add Outlet
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Outlets</p>
                <p className="text-2xl font-bold mt-1">{outlets.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">
                  ₹{outlets.reduce((sum, o) => sum + (o.sales || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Staff</p>
                <p className="text-2xl font-bold mt-1">12</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Daily Sales</p>
                <p className="text-2xl font-bold mt-1">₹42,000</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outlet List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold">Outlet Locations</h2>
          {loading ? (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
              <CardContent className="p-12 text-center">
                <div className="animate-pulse">Loading outlets...</div>
              </CardContent>
            </Card>
          ) : (
            outlets.map((outlet) => (
              <Card
                key={outlet.id}
                className={cn(
                  "backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50 hover:shadow-lg transition-all cursor-pointer",
                  selectedOutlet?.id === outlet.id && "ring-2 ring-green-500"
                )}
                onClick={() => setSelectedOutlet(outlet)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                        <Store className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{outlet.entity_name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {outlet.entity_code}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500 text-white">Active</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Revenue</p>
                      <p className="font-medium">₹{(outlet.sales || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Stock Value</p>
                      <p className="font-medium">₹{(outlet.stockValue || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Outlet Details */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Outlet Details</h2>
          {selectedOutlet ? (
            <div className="space-y-6">
              {/* Outlet Info */}
              <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
                <CardHeader>
                  <CardTitle>{selectedOutlet.entity_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{selectedOutlet.metadata?.address || 'MG Road, Kochi'}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{selectedOutlet.metadata?.phone || '+91 484 2345678'}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{selectedOutlet.metadata?.email || 'mgroad@kochiicecream.com'}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">10:00 AM - 10:00 PM</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Thermometer className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">-20°C (Freezer Temp)</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          Last Delivery: {selectedOutlet.lastDelivery 
                            ? new Date(selectedOutlet.lastDelivery).toLocaleDateString()
                            : 'Today'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              {outletPerformance && (
                <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Performance Metrics</CardTitle>
                      <Activity className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          ₹{outletPerformance.totalSales.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {outletPerformance.transactionCount}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          ₹{Math.round(outletPerformance.avgTicketSize)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg Ticket</p>
                      </div>
                    </div>

                    {/* Top Products */}
                    <div>
                      <h4 className="font-medium mb-3">Top Selling Products</h4>
                      <div className="space-y-3">
                        {outletPerformance.topProducts.map((product, idx) => (
                          <div key={idx}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{product.name}</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                ₹{product.revenue.toLocaleString()}
                              </span>
                            </div>
                            <Progress 
                              value={(product.revenue / outletPerformance.totalSales) * 100} 
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
              <CardContent className="p-12 text-center">
                <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select an outlet to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}