'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  IceCream,
  BookOpen,
  Receipt,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  Snowflake,
  Thermometer
} from 'lucide-react'
import { GLModule } from '@/lib/dna/modules/financial/gl-module-dna'
import { APModule } from '@/lib/dna/modules/financial/ap-module-dna'
import { ARModule } from '@/lib/dna/modules/financial/ar-module-dna'
import { FAModule } from '@/lib/dna/modules/financial/fa-module-dna'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { cn } from '@/lib/utils'

export default function IceCreamFinancialPage() {
  const { currentOrganization } = useMultiOrgAuth()
  const [isDarkMode, setIsDarkMode] = useState(false) // Default to light mode for better contrast
  const [activeModule, setActiveModule] = useState<'overview' | 'gl' | 'ap' | 'ar' | 'fa'>('overview')
  
  // Ice cream organization ID
  const organizationId = currentOrganization?.id || '1471e87b-b27e-42ef-8192-343cc5e0d656'

  return (
    <div className={cn("min-h-screen", isDarkMode && "dark")} style={{ backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff' }}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
                <IceCream className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                  Ice Cream Financial Management
                </h1>
                <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  Complete financial suite for ice cream manufacturing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Snowflake className="h-3 w-3" />
                Cold Chain Enabled
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Package className="h-3 w-3" />
                Batch Tracking
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </Button>
            </div>
          </div>
        </div>

        {/* Module Navigation */}
        <Tabs value={activeModule} onValueChange={(v) => setActiveModule(v as any)}>
          <TabsList className={cn(
            "grid w-full max-w-4xl grid-cols-5 mb-6",
            isDarkMode ? "bg-gray-800" : "bg-gray-100"
          )}>
            <TabsTrigger value="overview" className="gap-1">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="gl" className="gap-1">
              <BookOpen className="h-4 w-4" />
              General Ledger
            </TabsTrigger>
            <TabsTrigger value="ap" className="gap-1">
              <Receipt className="h-4 w-4" />
              Payables
            </TabsTrigger>
            <TabsTrigger value="ar" className="gap-1">
              <Users className="h-4 w-4" />
              Receivables
            </TabsTrigger>
            <TabsTrigger value="fa" className="gap-1">
              <FileText className="h-4 w-4" />
              Fixed Assets
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Financial KPIs */}
              <Card className={cn(
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>Revenue MTD</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>₹2,45,000</div>
                  <p className="text-xs text-green-600">+15% vs last month</p>
                </CardContent>
              </Card>

              <Card className={cn(
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>Cold Chain Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>₹45,000</div>
                  <p className="text-xs text-red-600">18.4% of revenue</p>
                </CardContent>
              </Card>

              <Card className={cn(
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>AP Outstanding</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>₹1,23,000</div>
                  <p className="text-xs text-gray-600">5 overdue invoices</p>
                </CardContent>
              </Card>

              <Card className={cn(
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>AR Outstanding</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>₹3,45,000</div>
                  <p className="text-xs text-gray-600">DSO: 28 days</p>
                </CardContent>
              </Card>
            </div>

            {/* Ice Cream Specific Metrics */}
            <div className="mt-6">
              <h2 className={cn("text-lg font-semibold mb-4", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                Ice Cream Specific Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={cn(
                  isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
                        <Thermometer className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className={cn("font-semibold", isDarkMode ? "text-gray-100" : "text-gray-900")}>Temperature Variance Cost</h3>
                        <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>₹12,000</p>
                        <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>3 incidents this month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn(
                  isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-400 flex items-center justify-center">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className={cn("font-semibold", isDarkMode ? "text-gray-100" : "text-gray-900")}>Batch Profitability</h3>
                        <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>23.5%</p>
                        <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>Average margin</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn(
                  isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-emerald-400 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className={cn("font-semibold", isDarkMode ? "text-gray-100" : "text-gray-900")}>Seasonal Revenue</h3>
                        <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>+45%</p>
                        <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>Summer peak active</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mt-6">
              <h2 className={cn("text-lg font-semibold mb-4", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                Recent Financial Activities
              </h2>
              <Card className={cn(
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className={cn("font-medium", isDarkMode ? "text-gray-100" : "text-gray-900")}>Cold Chain Wastage Entry</p>
                        <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>Temperature excursion - Batch ICE-2024-089</p>
                      </div>
                      <Badge variant="destructive">₹8,500</Badge>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className={cn("font-medium", isDarkMode ? "text-gray-100" : "text-gray-900")}>Dairy Purchase Invoice</p>
                        <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>Kerala Dairy Suppliers - 5000L milk</p>
                      </div>
                      <Badge variant="outline">₹125,000</Badge>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className={cn("font-medium", isDarkMode ? "text-gray-100" : "text-gray-900")}>Wholesale Revenue</p>
                        <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>Metro Cash & Carry - 500 units</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">₹75,000</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* GL Module Tab */}
          <TabsContent value="gl">
            <GLModule
              organizationId={organizationId}
              isDarkMode={isDarkMode}
              features={{
                multiCurrency: false,
                autoJournal: true,
                periodManagement: true,
                consolidation: false,
                auditTrail: true,
                batchPosting: true
              }}
              industrySpecific={{
                coldChainAccounts: true,
                batchLevelPosting: true,
                temperatureVarianceJournals: true,
                seasonalAnalysis: true
              }}
              onJournalPosted={(journalId) => {
                console.log('Journal posted:', journalId)
              }}
              onPeriodClosed={(period) => {
                console.log('Period closed:', period)
              }}
            />
          </TabsContent>

          {/* AP Module Tab */}
          <TabsContent value="ap">
            <APModule
              organizationId={organizationId}
              isDarkMode={isDarkMode}
              features={{
                approvalWorkflow: true,
                earlyPaymentDiscounts: true,
                recurringInvoices: true,
                multiCurrency: false,
                vendorPortal: false,
                autoMatching: true
              }}
              industrySpecific={{
                dairySupplierTracking: true,
                coldChainVendorManagement: true,
                qualityCertificateTracking: true,
                seasonalPricingAgreements: true,
                freezerPlacementTracking: true
              }}
              onInvoiceProcessed={(invoiceId) => {
                console.log('Invoice processed:', invoiceId)
              }}
              onPaymentMade={(paymentId) => {
                console.log('Payment made:', paymentId)
              }}
            />
          </TabsContent>

          {/* AR Module Tab */}
          <TabsContent value="ar">
            <ARModule
              organizationId={organizationId}
              isDarkMode={isDarkMode}
              features={{
                creditManagement: true,
                collectionsWorkflow: true,
                statementGeneration: true,
                multiCurrency: false,
                customerPortal: false,
                autoReminders: true,
                dunningLetters: true
              }}
              industrySpecific={{
                multiChannelBilling: true,
                freezerDepositTracking: true,
                seasonalCreditTerms: true,
                returnGoodsHandling: true,
                coldChainCompensation: true,
                routeDeliveryReconciliation: true
              }}
              onInvoiceCreated={(invoiceId) => {
                console.log('Invoice created:', invoiceId)
              }}
              onPaymentReceived={(paymentId) => {
                console.log('Payment received:', paymentId)
              }}
              onCreditMemoCreated={(creditMemoId) => {
                console.log('Credit memo created:', creditMemoId)
              }}
            />
          </TabsContent>

          {/* FA Module Tab */}
          <TabsContent value="fa">
            <FAModule
              organizationId={organizationId}
              isDarkMode={isDarkMode}
              features={{
                barcodeScannerIntegration: true,
                maintenanceScheduling: true,
                deprecationCalculation: true,
                assetTransfers: true,
                disposalManagement: true,
                revaluation: false,
                insuranceTracking: true
              }}
              industrySpecific={{
                freezerAssetTracking: true,
                coldChainEquipment: true,
                refrigeratedVehicles: true,
                temperatureMonitoring: true,
                energyEfficiencyTracking: true,
                complianceCertifications: true
              }}
              onAssetCreated={(assetId) => {
                console.log('Asset created:', assetId)
              }}
              onMaintenanceScheduled={(maintenanceId) => {
                console.log('Maintenance scheduled:', maintenanceId)
              }}
              onDepreciationCalculated={(assetId) => {
                console.log('Depreciation calculated:', assetId)
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}