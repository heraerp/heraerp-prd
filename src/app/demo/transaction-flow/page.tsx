'use client'

import React, { useState } from 'react'
import { UniversalTransactionFlow } from '@/lib/dna/components/transaction/UniversalTransactionFlow'
import {
  salonBookingSteps,
  restaurantOrderSteps,
  healthcareAppointmentSteps,
  retailPurchaseSteps,
  industryTranslations,
  mergeTranslations
} from '@/lib/dna/components/transaction/transaction-flows.config'
import { ServiceSelectionStep } from '@/lib/dna/components/transaction/steps/ServiceSelectionStep'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Scissors,
  UtensilsCrossed,
  Heart,
  ShoppingCart,
  Globe,
  Code,
  CheckCircle,
  FileJson
} from 'lucide-react'
import { motion } from 'framer-motion'

// Mock step component for demo
const MockStepComponent: React.FC<any> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        This is a placeholder step. In production, this would be a real component.
      </p>
      <Button onClick={() => onChange({ demoField: 'Demo Value' })}>Set Demo Value</Button>
      {data.demoField && <Badge variant="secondary">Value set: {data.demoField}</Badge>}
    </div>
  )
}

// Update steps to use real components
const demoSalonSteps = salonBookingSteps.map(step => ({
  ...step,
  component: step.id === 'service-selection' ? ServiceSelectionStep : MockStepComponent
}))

const demoRestaurantSteps = restaurantOrderSteps.map(step => ({
  ...step,
  component: MockStepComponent
}))

const demoHealthcareSteps = healthcareAppointmentSteps.map(step => ({
  ...step,
  component: MockStepComponent
}))

const demoRetailSteps = retailPurchaseSteps.map(step => ({
  ...step,
  component: MockStepComponent
}))

export default function TransactionFlowDemoPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<
    'salon' | 'restaurant' | 'healthcare' | 'retail'
  >('salon')
  const [selectedLocale, setSelectedLocale] = useState('en')
  const [selectedTheme, setSelectedTheme] = useState<'default' | 'minimal' | 'enterprise'>(
    'default'
  )
  const [completedTransaction, setCompletedTransaction] = useState<any>(null)
  const [showCode, setShowCode] = useState(false)

  const { toast } = useToast()

  const industryConfig = {
    salon: {
      steps: demoSalonSteps,
      icon: Scissors,
      color: 'from-pink-500 to-rose-500',
      smartCode: 'HERA.SALON.TXN.FLOW.BOOKING.V1'
    },
    restaurant: {
      steps: demoRestaurantSteps,
      icon: UtensilsCrossed,
      color: 'from-orange-500 to-red-500',
      smartCode: 'HERA.REST.TXN.FLOW.ORDER.V1'
    },
    healthcare: {
      steps: demoHealthcareSteps,
      icon: Heart,
      color: 'from-blue-500 to-cyan-500',
      smartCode: 'HERA.HLTH.TXN.FLOW.APPOINTMENT.V1'
    },
    retail: {
      steps: demoRetailSteps,
      icon: ShoppingCart,
      color: 'from-green-500 to-emerald-500',
      smartCode: 'HERA.RETAIL.TXN.FLOW.PURCHASE.V1'
    }
  }

  const currentConfig = industryConfig[selectedIndustry]
  const Icon = currentConfig.icon

  const handleComplete = async (data: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    setCompletedTransaction(data)

    toast({
      title: 'Transaction Completed!',
      description: `${selectedIndustry} transaction processed successfully`,
      variant: 'default'
    })
  }

  const handleSaveDraft = async (data: any) => {
    console.log('Saving draft:', data)
    // In real app, this would save to API
    return Promise.resolve()
  }

  // Merge base translations with industry translations
  const mergedTranslations = mergeTranslations(
    UniversalTransactionFlow.defaultProps?.translations || {},
    industryTranslations
  )

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Universal Transaction Flow Demo
          </h1>
        </motion.div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Enterprise-grade multi-step transaction wizard with full localization support. Works
          across all industries with smart code integration.
        </p>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Industry Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Industry</label>
              <Select
                value={selectedIndustry}
                onValueChange={(value: any) => setSelectedIndustry(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salon">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4" />
                      Salon
                    </div>
                  </SelectItem>
                  <SelectItem value="restaurant">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4" />
                      Restaurant
                    </div>
                  </SelectItem>
                  <SelectItem value="healthcare">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Healthcare
                    </div>
                  </SelectItem>
                  <SelectItem value="retail">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Retail
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Locale Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select value={selectedLocale} onValueChange={setSelectedLocale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      English
                    </div>
                  </SelectItem>
                  <SelectItem value="es">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Español
                    </div>
                  </SelectItem>
                  <SelectItem value="ar">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      العربية
                    </div>
                  </SelectItem>
                  <SelectItem value="zh">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      中文
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Theme Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Theme</label>
              <Select value={selectedTheme} onValueChange={(value: any) => setSelectedTheme(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Code Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Developer Tools</label>
              <Button
                variant={showCode ? 'default' : 'outline'}
                onClick={() => setShowCode(!showCode)}
                className="w-full gap-2"
              >
                <Code className="w-4 h-4" />
                {showCode ? 'Hide Code' : 'Show Code'}
              </Button>
            </div>
          </div>

          {/* Smart Code Display */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {currentConfig.smartCode}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Smart code for intelligent routing
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transaction Flow */}
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={cn('p-2 rounded-lg bg-gradient-to-br', currentConfig.color)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {selectedIndustry.charAt(0).toUpperCase() + selectedIndustry.slice(1)} Transaction
              </CardTitle>
            </CardHeader>
          </Card>

          <UniversalTransactionFlow
            transactionType={`${selectedIndustry}-demo`}
            smartCode={currentConfig.smartCode}
            steps={currentConfig.steps}
            locale={selectedLocale}
            translations={mergedTranslations}
            industry={selectedIndustry}
            businessType={selectedIndustry}
            currency="USD"
            theme={selectedTheme}
            onComplete={handleComplete}
            onSaveDraft={handleSaveDraft}
            onCancel={() => {
              toast({
                title: 'Transaction Cancelled',
                description: 'The transaction flow was cancelled'
              })
            }}
          />
        </div>

        {/* Code/Result Panel */}
        <div>
          <Tabs defaultValue="result" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="result">Result</TabsTrigger>
              <TabsTrigger value="code">Implementation</TabsTrigger>
            </TabsList>

            <TabsContent value="result" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileJson className="w-5 h-5" />
                    Transaction Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {completedTransaction ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Transaction Completed Successfully</span>
                      </div>
                      <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs">
                        {JSON.stringify(completedTransaction, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Complete the transaction flow to see the resulting data structure.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Implementation Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs">
                    {`import { UniversalTransactionFlow } from '@/lib/dna/components/transaction'
import { salonBookingSteps } from './transaction-flows.config'

<UniversalTransactionFlow
  transactionType="${selectedIndustry}-booking"
  smartCode="${currentConfig.smartCode}"
  steps={${selectedIndustry}BookingSteps}
  locale="${selectedLocale}"
  industry="${selectedIndustry}"
  theme="${selectedTheme}"
  onComplete={async (data) => {
    // Process transaction
    await universalApi.createTransaction({
      transaction_type: '${selectedIndustry}_booking',
      smart_code: '${currentConfig.smartCode}',
      metadata: data
    })
  }}
/>`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Multi-Language Support
              </h4>
              <p className="text-sm text-muted-foreground">
                Built-in localization for global deployment with RTL support
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Smart Code Integration
              </h4>
              <p className="text-sm text-muted-foreground">
                Every step and transaction tagged with intelligent business context
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Enterprise Validation
              </h4>
              <p className="text-sm text-muted-foreground">
                Async validation with field-level errors and warnings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Add missing import
import { Settings, Shield, Zap } from 'lucide-react'
