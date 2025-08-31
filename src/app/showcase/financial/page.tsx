'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Calculator, 
  Zap, 
  Globe,
  Building2,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  FileText,
  Brain,
  Clock,
  Shield,
  BarChart3,
  Sparkles,
  ArrowRight,
  Play
} from 'lucide-react'

export default function FinancialShowcase() {
  const [coaProgress, setCoaProgress] = useState(0)
  const [journalStats, setJournalStats] = useState<any>(null)
  const [selectedCountry, setSelectedCountry] = useState('AE')
  const [selectedIndustry, setSelectedIndustry] = useState('restaurant')
  
  const countries = [
    { code: 'AE', name: 'UAE', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'US', name: 'USA', flag: '🇺🇸' },
    { code: 'UK', name: 'UK', flag: '🇬🇧' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
  ]
  
  const industries = [
    { code: 'restaurant', name: 'Restaurant', icon: '🍽️' },
    { code: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { code: 'retail', name: 'Retail', icon: '🛍️' },
    { code: 'manufacturing', name: 'Manufacturing', icon: '🏭' },
    { code: 'professional', name: 'Professional Services', icon: '💼' },
  ]
  
  const simulateCoaSetup = () => {
    setCoaProgress(0)
    const steps = [
      { progress: 20, message: 'Loading country template...' },
      { progress: 40, message: 'Applying industry rules...' },
      { progress: 60, message: 'Generating IFRS mappings...' },
      { progress: 80, message: 'Creating GL accounts...' },
      { progress: 100, message: 'Setup complete!' },
    ]
    
    steps.forEach((step, index) => {
      setTimeout(() => {
        setCoaProgress(step.progress)
      }, index * 600)
    })
  }
  
  const simulateJournalProcessing = () => {
    setJournalStats({
      transactionsAnalyzed: 1247,
      journalsCreated: 89,
      automationRate: 85,
      timeSaved: '3.6 hours',
      costSaved: '$144',
      processingModes: {
        immediate: 234,
        batch: 1013,
        manual: 76
      }
    })
  }
  
  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold mb-4">
          HERA Financial Modules
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience enterprise-grade financial accounting with revolutionary speed. 
          Chart of Accounts in 30 seconds. Automatic journal posting with 85% automation.
        </p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <Card className="text-center">
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl font-bold text-primary">132</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">COA Templates</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl font-bold text-green-600">100%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">IFRS Compliant</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl font-bold text-orange-600">85%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Auto-Journal Rate</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl font-bold text-purple-600">$34K</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Annual Savings</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="coa" className="mb-12">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="coa" className="text-lg">
            <Calculator className="w-4 h-4 mr-2" />
            Chart of Accounts
          </TabsTrigger>
          <TabsTrigger value="journal" className="text-lg">
            <Zap className="w-4 h-4 mr-2" />
            Auto-Journal Engine
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="coa" className="mt-8">
          <div className="grid gap-8">
            {/* COA Setup Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  30-Second COA Setup
                </CardTitle>
                <CardDescription>
                  Watch how quickly HERA creates a complete, IFRS-compliant Chart of Accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Country & Industry Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Country</label>
                      <div className="grid grid-cols-3 gap-2">
                        {countries.map(country => (
                          <Button
                            key={country.code}
                            variant={selectedCountry === country.code ? "default" : "outline"}
                            onClick={() => setSelectedCountry(country.code)}
                            className="justify-start"
                          >
                            <span className="mr-2">{country.flag}</span>
                            {country.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Industry</label>
                      <div className="grid grid-cols-2 gap-2">
                        {industries.map(industry => (
                          <Button
                            key={industry.code}
                            variant={selectedIndustry === industry.code ? "default" : "outline"}
                            onClick={() => setSelectedIndustry(industry.code)}
                            className="justify-start"
                          >
                            <span className="mr-2">{industry.icon}</span>
                            {industry.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Setup Button & Progress */}
                  <div className="space-y-4">
                    <Button 
                      onClick={simulateCoaSetup} 
                      className="w-full md:w-auto"
                      size="lg"
                      disabled={coaProgress > 0 && coaProgress < 100}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Generate Chart of Accounts
                    </Button>
                    
                    {coaProgress > 0 && (
                      <>
                        <Progress value={coaProgress} className="w-full" />
                        {coaProgress === 100 && (
                          <Alert>
                            <CheckCircle2 className="w-4 h-4" />
                            <AlertDescription>
                              <strong>Success!</strong> Generated 87 GL accounts with complete IFRS mappings 
                              for {industries.find(i => i.code === selectedIndustry)?.name} in {' '}
                              {countries.find(c => c.code === selectedCountry)?.name}. 
                              Total time: <strong>28 seconds</strong>.
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Sample Accounts */}
                  {coaProgress === 100 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold">Sample Accounts Generated:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-mono text-sm">1000</p>
                              <p className="font-medium">Cash - Operating Account</p>
                            </div>
                            <Badge variant="outline">Asset</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>IFRS: Current Assets → Cash and cash equivalents</p>
                            <p>Statement: SFP (Balance Sheet)</p>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-mono text-sm">4100</p>
                              <p className="font-medium">Revenue - Product Sales</p>
                            </div>
                            <Badge variant="outline">Revenue</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>IFRS: Revenue → Revenue from contracts</p>
                            <p>Statement: SPL (Income Statement)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* IFRS Compliance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Universal Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Countries</span>
                      <span className="font-mono">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Industries</span>
                      <span className="font-mono">11</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Templates</span>
                      <span className="font-mono">132</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Languages</span>
                      <span className="font-mono">8</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    IFRS Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Complete classification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Statement mapping</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm">5-level hierarchy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Consolidation ready</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="journal" className="mt-8">
          <div className="grid gap-8">
            {/* Auto-Journal Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Live Journal Automation
                </CardTitle>
                <CardDescription>
                  See how HERA automatically creates journal entries from business transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Button 
                    onClick={simulateJournalProcessing}
                    size="lg"
                    className="w-full md:w-auto"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Process Today's Transactions
                  </Button>
                  
                  {journalStats && (
                    <>
                      {/* Processing Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold">{journalStats.transactionsAnalyzed}</p>
                          <p className="text-sm text-muted-foreground">Analyzed</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{journalStats.journalsCreated}</p>
                          <p className="text-sm text-muted-foreground">Created</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{journalStats.automationRate}%</p>
                          <p className="text-sm text-muted-foreground">Automated</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{journalStats.timeSaved}</p>
                          <p className="text-sm text-muted-foreground">Saved</p>
                        </div>
                      </div>
                      
                      {/* Processing Modes */}
                      <div>
                        <h4 className="font-semibold mb-3">Processing Breakdown</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Immediate Processing
                              </span>
                              <span>{journalStats.processingModes.immediate} transactions</span>
                            </div>
                            <Progress value={(journalStats.processingModes.immediate / journalStats.transactionsAnalyzed) * 100} />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Batch Processing
                              </span>
                              <span>{journalStats.processingModes.batch} transactions</span>
                            </div>
                            <Progress value={(journalStats.processingModes.batch / journalStats.transactionsAnalyzed) * 100} />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Manual Review
                              </span>
                              <span>{journalStats.processingModes.manual} transactions</span>
                            </div>
                            <Progress value={(journalStats.processingModes.manual / journalStats.transactionsAnalyzed) * 100} />
                          </div>
                        </div>
                      </div>
                      
                      {/* Sample Journal Entry */}
                      <div className="border rounded-lg p-4 bg-muted/30">
                        <h4 className="font-semibold mb-3">Sample Auto-Generated Entry</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Transaction:</span>
                            <span>Restaurant Sale #1247</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Smart Code:</span>
                            <span className="font-mono">HERA.REST.SALE.ORDER.v1</span>
                          </div>
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between font-mono">
                              <span>DR: 1100 Cash</span>
                              <span>$105.00</span>
                            </div>
                            <div className="flex justify-between font-mono">
                              <span>CR: 4100 Food Sales</span>
                              <span>$100.00</span>
                            </div>
                            <div className="flex justify-between font-mono">
                              <span>CR: 2250 VAT Payable</span>
                              <span>$5.00</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cost Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">$34,560</div>
                  <p className="text-sm text-muted-foreground">Annual savings per organization</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Time Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">92%</div>
                  <p className="text-sm text-muted-foreground">Reduction in manual work</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Error Reduction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-2">86.7%</div>
                  <p className="text-sm text-muted-foreground">Fewer posting errors</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Call to Action */}
      <div className="text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Transform Your Accounting?</CardTitle>
            <CardDescription className="text-lg">
              Join businesses saving millions with HERA's financial automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="/docs/features/chart-of-accounts">
                  Explore Documentation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/fi-demo">
                  Try Live Demo
                  <Play className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}