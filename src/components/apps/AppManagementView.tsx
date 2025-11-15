'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  ExternalLink,
  Package,
  CheckCircle,
  Store,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  BarChart3
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { AppManageModal } from '@/components/apps/AppManageModal'

// Map app codes to icons
const APP_ICONS: Record<string, any> = {
  SALON: Store,
  RETAIL: ShoppingBag,
  WMS: Package,
  CENTRAL: TrendingUp,
  CRM: Users,
  FINANCE: DollarSign,
  ANALYTICS: BarChart3
}

// Map app codes to descriptions
const APP_DESCRIPTIONS: Record<string, string> = {
  SALON: 'Complete salon management with appointments, staff, and inventory',
  RETAIL: 'Omnichannel retail management with POS and e-commerce',
  WMS: 'Warehouse management with logistics and fulfillment',
  CENTRAL: 'Platform administration and multi-org management',
  CRM: 'Customer relationship management and sales pipeline',
  FINANCE: 'Financial management with accounting and reporting',
  ANALYTICS: 'Business intelligence and data analytics'
}

export function AppManagementView() {
  const router = useRouter()
  const { organization, availableApps } = useHERAAuth()
  const [selectedApp, setSelectedApp] = useState<typeof availableApps[0] | null>(null)
  const [showManageModal, setShowManageModal] = useState(false)

  const handleManage = (app: typeof availableApps[0]) => {
    setSelectedApp(app)
    setShowManageModal(true)
  }

  const handleOpenApp = (appCode: string) => {
    const route = `/${appCode.toLowerCase()}`
    router.push(route)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Package className="w-8 h-8 text-emerald-400" />
                My Apps
              </h1>
              <p className="text-slate-400 mt-1">
                Manage apps installed in {organization?.name || 'your organization'}
              </p>
            </div>
            <Button
              onClick={() => router.push('/apps?mode=store')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Store className="w-4 h-4 mr-2" />
              Browse App Store
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Apps</p>
                    <p className="text-3xl font-bold text-white">{availableApps.length}</p>
                  </div>
                  <Package className="w-10 h-10 text-emerald-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Active Status</p>
                    <p className="text-3xl font-bold text-green-400">{availableApps.length}</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Organization</p>
                    <p className="text-lg font-bold text-white truncate max-w-[150px]">
                      {organization?.name || 'N/A'}
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-cyan-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Installed Apps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {availableApps.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No apps installed</h3>
            <p className="text-slate-400 mb-6">Get started by installing apps from the store</p>
            <Button
              onClick={() => router.push('/apps?mode=store')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Store className="w-4 h-4 mr-2" />
              Browse App Store
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              Installed Applications ({availableApps.length})
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {availableApps.map((app) => {
                const Icon = APP_ICONS[app.code.toUpperCase()] || Package
                const description = APP_DESCRIPTIONS[app.code.toUpperCase()] || 'Enterprise application'

                return (
                  <Card
                    key={app.code}
                    className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/30 transition-all duration-300"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-8 h-8 text-emerald-400" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-white">
                                {app.name}
                              </h3>
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mb-2">{description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>Code: {app.code}</span>
                              {app.url && <span>Route: {app.url}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            onClick={() => handleOpenApp(app.code)}
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open
                          </Button>
                          <Button
                            onClick={() => handleManage(app)}
                            variant="outline"
                            size="sm"
                            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Manage Modal */}
      {selectedApp && (
        <AppManageModal
          app={selectedApp as any}
          isOpen={showManageModal}
          onClose={() => {
            setShowManageModal(false)
            setSelectedApp(null)
          }}
        />
      )}
    </div>
  )
}
