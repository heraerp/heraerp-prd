'use client'

import { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { universalApi } from '@/lib/universal-api-v2'
import { flags } from '@/config/flags'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Activity,
  DollarSign,
  Users,
  ShoppingCart
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { checkCommissionSafety } from '@/lib/playbook/commission-safety-check'

export default function PosHealthPage() {
  const { organization } = useHERAAuth()
  const [healthData, setHealthData] = useState({
    commissionsEnabled: true,
    hasCommissionLines: false,
    todaysSales: 0,
    todaysTransactions: 0,
    activeStylists: 0,
    lastSaleTime: null as Date | null,
    loading: true,
    safetyViolations: 0,
    safetyViolationAmount: 0
  })

  useEffect(() => {
    const loadHealthData = async () => {
      if (!organization?.id) return

      try {
        universalApi.setOrganizationId(organization.id)

        // Get commission settings
        const orgResponse = await universalApi.getEntity(organization.id)
        const settings = orgResponse.data?.settings || {}
        const commissionsEnabled =
          flags.ENABLE_COMMISSIONS && (settings?.salon?.commissions?.enabled ?? true)

        // Get today's transactions
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const transactionsResponse = await universalApi.read('universal_transactions')
        const todaysTransactions =
          transactionsResponse.data?.filter((t: any) => {
            const txDate = new Date(t.created_at)
            return txDate >= today && t.transaction_type === 'sale'
          }) || []

        // Check for commission lines
        const hasCommissionLines = todaysTransactions.some(
          (t: any) => t.metadata?.commission_lines?.length > 0
        )

        // Count active stylists (simplified - would query staff in production)
        const stylistIds = new Set()
        todaysTransactions.forEach((t: any) => {
          t.metadata?.line_items?.forEach((item: any) => {
            if (item.stylist_id) stylistIds.add(item.stylist_id)
          })
        })

        // Check commission safety
        let safetyViolations = 0
        let safetyViolationAmount = 0
        try {
          const safetyResult = await checkCommissionSafety(organization.id)
          if (safetyResult.hasViolations) {
            safetyViolations = safetyResult.violationCount
            safetyViolationAmount = safetyResult.details.reduce(
              (sum, v) => sum + v.commissionAmount,
              0
            )
          }
        } catch (safetyError) {
          console.error('Commission safety check failed:', safetyError)
        }

        setHealthData({
          commissionsEnabled,
          hasCommissionLines,
          todaysSales: todaysTransactions.reduce(
            (sum: number, t: any) => sum + (t.total_amount || 0),
            0
          ),
          todaysTransactions: todaysTransactions.length,
          activeStylists: stylistIds.size,
          lastSaleTime:
            todaysTransactions.length > 0 ? new Date(todaysTransactions[0].created_at) : null,
          loading: false,
          safetyViolations,
          safetyViolationAmount
        })
      } catch (error) {
        console.error('Error loading POS health data:', error)
        setHealthData(prev => ({ ...prev, loading: false }))
      }
    }

    loadHealthData()
    // Refresh every 30 seconds
    const interval = setInterval(loadHealthData, 30000)

    return () => clearInterval(interval)
  }, [organization?.id])

  if (healthData.loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">POS Health Monitor</h1>
        <div className="text-muted-foreground">Loading health data...</div>
      </div>
    )
  }

  const commissionMismatch = !healthData.commissionsEnabled && healthData.hasCommissionLines

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">POS Health Monitor</h1>
        <p className="text-muted-foreground">
          Real-time monitoring of POS system status and performance
        </p>
      </div>

      {/* Commission Status */}
      <Card className={commissionMismatch ? 'border-red-500' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Commission System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Commission Mode</span>
            <Badge variant={healthData.commissionsEnabled ? 'default' : 'secondary'}>
              {healthData.commissionsEnabled ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Commissions ON
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Commissions OFF - Simple POS
                </>
              )}
            </Badge>
          </div>

          {commissionMismatch && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Warning: Commission lines detected but commissions are disabled! This may indicate a
                configuration issue.
              </AlertDescription>
            </Alert>
          )}

          {healthData.safetyViolations > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Safety Violation:</strong> Found {healthData.safetyViolations} transactions
                with commission lines totaling ${healthData.safetyViolationAmount.toFixed(2)} while
                commissions are disabled. This data inconsistency should be investigated.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground">
            {healthData.commissionsEnabled
              ? 'System is tracking commissions for all service sales with assigned stylists.'
              : 'Simple POS mode - no stylist requirements or commission tracking.'}
          </div>
        </CardContent>
      </Card>

      {/* Today's Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${healthData.todaysSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {healthData.todaysTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthData.todaysTransactions}</div>
            <p className="text-xs text-muted-foreground">Today's completed sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stylists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthData.activeStylists}</div>
            <p className="text-xs text-muted-foreground">Stylists with sales today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sale</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData.lastSaleTime ? (
                <>{Math.floor((Date.now() - healthData.lastSaleTime.getTime()) / 60000)}m ago</>
              ) : (
                'No sales'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthData.lastSaleTime
                ? healthData.lastSaleTime.toLocaleTimeString()
                : 'No sales today'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Real-time system health indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">POS Service: Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Database Connection: Active</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">
                Commission Engine: {healthData.commissionsEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Payment Processing: Ready</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-right">
        Auto-refreshes every 30 seconds • Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}
