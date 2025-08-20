'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Clock,
  ChefHat,
  AlertCircle,
  CheckCircle,
  Timer,
  Flame,
  Salad,
  Cookie,
  Coffee,
  Utensils,
  Bell,
  Users,
  Home,
  Package,
  Truck,
  AlertTriangle,
  Play,
  Check,
  WifiOff,
  Database,
  Smartphone,
  Calendar,
  Lock,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Progressive IndexedDB Storage Layer
class ProgressiveKitchenStorage {
  private dbName = 'hera_restaurant_progressive'
  private db: IDBDatabase | null = null
  private expiryDays = 30

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.checkExpiry()
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create stores matching HERA universal schema
        if (!db.objectStoreNames.contains('kitchen_orders')) {
          const orderStore = db.createObjectStore('kitchen_orders', { keyPath: 'id' })
          orderStore.createIndex('status', 'status', { unique: false })
          orderStore.createIndex('createdAt', 'createdAt', { unique: false })
          orderStore.createIndex('orderType', 'orderType', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('order_items')) {
          const itemStore = db.createObjectStore('order_items', { keyPath: 'id' })
          itemStore.createIndex('orderId', 'orderId', { unique: false })
          itemStore.createIndex('station', 'station', { unique: false })
          itemStore.createIndex('status', 'status', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('progressive_meta')) {
          const metaStore = db.createObjectStore('progressive_meta', { keyPath: 'key' })
          // Store trial start date and other metadata
          metaStore.add({
            key: 'trial_start',
            value: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.expiryDays * 24 * 60 * 60 * 1000).toISOString()
          })
        }
      }
    })
  }

  async checkExpiry() {
    if (!this.db) return
    
    const transaction = this.db.transaction(['progressive_meta'], 'readonly')
    const store = transaction.objectStore('progressive_meta')
    const request = store.get('trial_start')
    
    request.onsuccess = () => {
      if (request.result) {
        const expiresAt = new Date(request.result.expiresAt)
        const now = new Date()
        const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysRemaining <= 0) {
          this.clearAllData()
          console.log('Trial expired - data cleared')
        } else {
          console.log(`Trial: ${daysRemaining} days remaining`)
        }
      }
    }
  }

  async saveOrder(order: any) {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction(['kitchen_orders'], 'readwrite')
    const store = transaction.objectStore('kitchen_orders')
    return store.put(order)
  }

  async getOrders() {
    if (!this.db) await this.init()
    
    return new Promise<any[]>((resolve) => {
      const transaction = this.db!.transaction(['kitchen_orders'], 'readonly')
      const store = transaction.objectStore('kitchen_orders')
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  async clearAllData() {
    if (!this.db) return
    
    const transaction = this.db.transaction(['kitchen_orders', 'order_items'], 'readwrite')
    transaction.objectStore('kitchen_orders').clear()
    transaction.objectStore('order_items').clear()
  }

  async getTrialInfo() {
    if (!this.db) await this.init()
    
    return new Promise<any>((resolve) => {
      const transaction = this.db!.transaction(['progressive_meta'], 'readonly')
      const store = transaction.objectStore('progressive_meta')
      const request = store.get('trial_start')
      
      request.onsuccess = () => {
        if (request.result) {
          const expiresAt = new Date(request.result.expiresAt)
          const now = new Date()
          const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          
          resolve({
            startDate: request.result.value,
            expiresAt: request.result.expiresAt,
            daysRemaining: Math.max(0, daysRemaining),
            isExpired: daysRemaining <= 0
          })
        } else {
          resolve(null)
        }
      }
    })
  }
}

// Progressive Kitchen Display Component
export function ProgressiveKitchenDisplay() {
  const [orders, setOrders] = useState<any[]>([])
  const [selectedStation, setSelectedStation] = useState<string>('all')
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [storage] = useState(new ProgressiveKitchenStorage())
  const [trialInfo, setTrialInfo] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  const stations = [
    { id: 'all', name: 'All Orders', icon: <Utensils />, color: 'orange' },
    { id: 'grill', name: 'Grill', icon: <Flame />, color: 'red' },
    { id: 'salad', name: 'Salad/Cold', icon: <Salad />, color: 'green' },
    { id: 'dessert', name: 'Dessert', icon: <Cookie />, color: 'pink' },
    { id: 'beverage', name: 'Beverage', icon: <Coffee />, color: 'blue' }
  ]

  useEffect(() => {
    // Initialize storage and load data
    initializeProgressive()
    
    // Monitor online/offline status
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Update clock
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(timer)
    }
  }, [])

  const initializeProgressive = async () => {
    await storage.init()
    const info = await storage.getTrialInfo()
    setTrialInfo(info)
    
    // Load existing orders or create demo data
    let existingOrders = await storage.getOrders()
    
    if (existingOrders.length === 0) {
      // Create demo orders for progressive mode
      const demoOrders = createDemoOrders()
      for (const order of demoOrders) {
        await storage.saveOrder(order)
      }
      existingOrders = demoOrders
    }
    
    setOrders(existingOrders)
  }

  const createDemoOrders = () => {
    return [
      {
        id: 'demo_1',
        orderNumber: '#P001',
        orderType: 'dine-in',
        tableNumber: '5',
        items: [
          {
            id: 'item_1',
            name: 'Grilled Chicken',
            quantity: 2,
            station: 'grill',
            status: 'preparing',
            prepTime: 15
          },
          {
            id: 'item_2',
            name: 'Garden Salad',
            quantity: 2,
            station: 'salad',
            status: 'ready',
            prepTime: 5
          }
        ],
        status: 'preparing',
        priority: 'normal',
        createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
        targetTime: new Date(Date.now() + 5 * 60000).toISOString(),
        totalItems: 4,
        itemsReady: 2
      },
      {
        id: 'demo_2',
        orderNumber: '#P002',
        orderType: 'takeout',
        customerName: 'Demo Customer',
        items: [
          {
            id: 'item_3',
            name: 'Pasta Carbonara',
            quantity: 1,
            station: 'grill',
            status: 'pending',
            prepTime: 12
          }
        ],
        status: 'new',
        priority: 'rush',
        createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
        targetTime: new Date(Date.now() + 10 * 60000).toISOString(),
        totalItems: 1,
        itemsReady: 0
      }
    ]
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return { ...order, status: newStatus, [`${newStatus}At`]: new Date().toISOString() }
      }
      return order
    })
    
    setOrders(updatedOrders)
    
    // Save to IndexedDB
    const order = updatedOrders.find(o => o.id === orderId)
    if (order) {
      await storage.saveOrder(order)
    }
  }

  const updateItemStatus = async (orderId: string, itemId: string, status: string) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map((item: any) => {
          if (item.id === itemId) {
            return { ...item, status }
          }
          return item
        })
        
        const itemsReady = updatedItems.filter((i: any) => i.status === 'ready').length
        const allReady = itemsReady === updatedItems.length
        
        return {
          ...order,
          items: updatedItems,
          itemsReady,
          status: allReady ? 'ready' : order.status === 'new' ? 'acknowledged' : order.status
        }
      }
      return order
    })
    
    setOrders(updatedOrders)
    
    // Save to IndexedDB
    const order = updatedOrders.find(o => o.id === orderId)
    if (order) {
      await storage.saveOrder(order)
    }
  }

  const getTimeDisplay = (order: any) => {
    const now = currentTime.getTime()
    const target = new Date(order.targetTime).getTime()
    const created = new Date(order.createdAt).getTime()
    const elapsed = Math.floor((now - created) / 60000)
    const remaining = Math.floor((target - now) / 60000)
    
    return { elapsed, remaining }
  }

  const filteredOrders = orders.filter(order => {
    if (selectedStation === 'all') return true
    return order.items.some((item: any) => item.station === selectedStation)
  })

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Progressive Mode Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <ChefHat className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Progressive Kitchen Display</h1>
              <p className="text-orange-100 text-sm">30-Day Free Trial Mode</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Offline Indicator */}
            {isOffline && (
              <Badge className="bg-yellow-500 text-black">
                <WifiOff className="w-4 h-4 mr-1" />
                Offline Mode
              </Badge>
            )}
            
            {/* Trial Info */}
            {trialInfo && (
              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" />
                    <div>
                      <p className="text-xs opacity-80">Trial Period</p>
                      <p className="font-bold">
                        {trialInfo.daysRemaining} days remaining
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Upgrade Button */}
            <Button className="bg-white text-orange-600 hover:bg-orange-50">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Production
            </Button>
          </div>
        </div>
      </div>

      {/* Progressive Features Banner */}
      <Alert className="m-4 border-blue-500 bg-blue-900/50">
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>Progressive Mode Features:</strong> All data stored locally in IndexedDB • 
          Works offline • Automatic sync when online • No authentication required • 
          Perfect for testing and demos
        </AlertDescription>
      </Alert>

      {/* Station Filters */}
      <div className="p-4 flex gap-2 overflow-x-auto">
        {stations.map(station => (
          <Button
            key={station.id}
            variant={selectedStation === station.id ? 'default' : 'outline'}
            onClick={() => setSelectedStation(station.id)}
            className={cn(
              "min-w-[120px]",
              selectedStation === station.id && "bg-orange-500"
            )}
          >
            {station.icon}
            <span className="ml-2">{station.name}</span>
          </Button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-400">
            <ChefHat className="w-16 h-16 mb-4" />
            <p className="text-xl">No orders in queue</p>
            <p className="text-sm mt-2">Progressive mode - Add demo orders to test</p>
            <Button
              className="mt-4 bg-orange-500"
              onClick={() => {
                const newOrders = createDemoOrders()
                setOrders([...orders, ...newOrders])
              }}
            >
              Add Demo Orders
            </Button>
          </div>
        ) : (
          filteredOrders.map(order => {
            const { elapsed, remaining } = getTimeDisplay(order)
            
            return (
              <Card key={order.id} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{order.orderNumber}</h3>
                      {order.orderType === 'dine-in' && (
                        <Badge variant="outline">
                          <Home className="w-3 h-3 mr-1" />
                          Table {order.tableNumber}
                        </Badge>
                      )}
                      {order.orderType === 'takeout' && (
                        <Badge variant="outline">
                          <Package className="w-3 h-3 mr-1" />
                          Takeout
                        </Badge>
                      )}
                    </div>
                    <Badge className={remaining < 5 ? 'bg-red-500' : 'bg-green-500'}>
                      {remaining}m
                    </Badge>
                  </div>
                  
                  {order.priority === 'rush' && (
                    <Badge className="bg-orange-500 mt-2">RUSH</Badge>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Items */}
                  <div className="space-y-2">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{item.quantity}x {item.name}</span>
                            {item.status === 'ready' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {item.status === 'preparing' && <Clock className="w-4 h-4 text-orange-500 animate-pulse" />}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {item.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemStatus(order.id, item.id, 'preparing')}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                          {item.status === 'preparing' && (
                            <Button
                              size="sm"
                              className="bg-green-600"
                              onClick={() => updateItemStatus(order.id, item.id, 'ready')}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{order.itemsReady}/{order.totalItems} ready</span>
                      <span>{elapsed}m elapsed</span>
                    </div>
                    <Progress value={(order.itemsReady / order.totalItems) * 100} className="h-2" />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    {order.status === 'new' && (
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600"
                        onClick={() => updateOrderStatus(order.id, 'acknowledged')}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {order.status === 'acknowledged' && (
                      <Button
                        size="sm"
                        className="flex-1 bg-orange-600"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                      >
                        Start
                      </Button>
                    )}
                    {order.status === 'preparing' && order.itemsReady === order.totalItems && (
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600"
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                      >
                        Ready
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button
                        size="sm"
                        className="flex-1 bg-purple-600"
                        onClick={() => updateOrderStatus(order.id, 'served')}
                      >
                        Served
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Progressive Features Info */}
      <div className="p-4 mt-auto border-t border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="font-semibold">Local Storage</p>
                  <p className="text-xs text-gray-400">All data in IndexedDB</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Smartphone className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-semibold">PWA Ready</p>
                  <p className="text-xs text-gray-400">Install as app</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Lock className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="font-semibold">No Login Required</p>
                  <p className="text-xs text-gray-400">Start using instantly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}