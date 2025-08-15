'use client'

// ================================================================================
// UNIVERSAL POS DEMO - ALL INDUSTRIES
// Demonstrates the Universal POS DNA Component across multiple industries
// Smart Code: HERA.UI.POS.DEMO.UNIVERSAL.v1
// ================================================================================

import React, { useState } from 'react'
import { UniversalPOS } from '@/components/universal/UniversalPOS'
import { getAllPOSConfigurations, POSConfigurationType } from '@/lib/universal/pos-configurations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Scissors, Utensils, ShoppingBag, Stethoscope, Car, 
  Dumbbell, Camera, Briefcase, TestTube, Sparkles,
  ArrowLeft, Copy, Code
} from 'lucide-react'
import Link from 'next/link'

// Sample items for different industries
const industryItems = {
  salon: [
    { id: 1, name: 'Haircut & Style', category: 'Hair Services', price: 85, type: 'service' as const, provider: 'Emma', duration: 60, description: 'Professional haircut with styling' },
    { id: 2, name: 'Hair Color', category: 'Color Services', price: 150, type: 'service' as const, provider: 'Sarah', duration: 120, description: 'Full hair coloring service' },
    { id: 101, name: 'Premium Shampoo', category: 'Hair Care', price: 28, type: 'product' as const, brand: 'L\'Oreal', stock: 45, description: 'Professional salon shampoo' },
    { id: 102, name: 'Hair Serum', category: 'Hair Treatments', price: 35, type: 'product' as const, brand: 'Schwarzkopf', stock: 18, description: 'Repair and shine serum' }
  ],
  restaurant: [
    { id: 1, name: 'Caesar Salad', category: 'Salads', price: 14, type: 'product' as const, description: 'Fresh romaine, parmesan, croutons' },
    { id: 2, name: 'Margherita Pizza', category: 'Pizza', price: 18, type: 'product' as const, description: 'Tomato, mozzarella, fresh basil' },
    { id: 3, name: 'Grilled Salmon', category: 'Main Courses', price: 26, type: 'product' as const, description: 'Atlantic salmon with lemon herb butter' },
    { id: 4, name: 'Tiramisu', category: 'Desserts', price: 9, type: 'product' as const, description: 'Classic Italian dessert' }
  ],
  retail: [
    { id: 1, name: 'Designer Dress', category: 'Women\'s Clothing', price: 89, type: 'product' as const, brand: 'StyleHub', stock: 12, description: 'Elegant cocktail dress' },
    { id: 2, name: 'Leather Jacket', category: 'Men\'s Clothing', price: 199, type: 'product' as const, brand: 'UrbanStyle', stock: 8, description: 'Premium leather jacket' },
    { id: 3, name: 'Gold Necklace', category: 'Jewelry', price: 159, type: 'product' as const, brand: 'LuxAccessory', stock: 5, description: '18k gold plated necklace' },
    { id: 4, name: 'Designer Handbag', category: 'Bags', price: 79, type: 'product' as const, brand: 'StyleHub', stock: 15, description: 'Versatile crossbody bag' }
  ],
  healthcare: [
    { id: 1, name: 'General Consultation', category: 'Consultations', price: 150, type: 'service' as const, provider: 'Dr. Smith', duration: 30, description: 'Standard medical consultation' },
    { id: 2, name: 'Blood Test Panel', category: 'Lab Tests', price: 85, type: 'service' as const, provider: 'Lab Tech', duration: 15, description: 'Comprehensive blood work' },
    { id: 3, name: 'X-Ray Imaging', category: 'Imaging', price: 120, type: 'service' as const, provider: 'Radiology', duration: 20, description: 'Digital X-ray examination' },
    { id: 4, name: 'Physical Therapy', category: 'Procedures', price: 95, type: 'service' as const, provider: 'PT Johnson', duration: 45, description: 'Rehabilitation session' }
  ],
  automotive: [
    { id: 1, name: 'Oil Change', category: 'Oil Changes', price: 45, type: 'service' as const, provider: 'Mike', duration: 30, description: 'Full synthetic oil change' },
    { id: 2, name: 'Brake Inspection', category: 'Brake Service', price: 89, type: 'service' as const, provider: 'Tony', duration: 45, description: 'Complete brake system check' },
    { id: 3, name: 'Air Filter', category: 'Parts', price: 25, type: 'product' as const, brand: 'Mann Filter', stock: 20, description: 'Engine air filter replacement' },
    { id: 4, name: 'Premium Tires', category: 'Tires', price: 180, type: 'product' as const, brand: 'Michelin', stock: 8, description: 'All-season radial tire' }
  ],
  gym: [
    { id: 1, name: 'Personal Training', category: 'Personal Training', price: 75, type: 'service' as const, provider: 'Jake', duration: 60, description: 'One-on-one fitness training' },
    { id: 2, name: 'Yoga Class', category: 'Group Classes', price: 25, type: 'service' as const, provider: 'Lisa', duration: 75, description: 'Vinyasa flow yoga session' },
    { id: 3, name: 'Protein Powder', category: 'Supplements', price: 49, type: 'product' as const, brand: 'FitPro', stock: 25, description: 'Whey protein supplement' },
    { id: 4, name: 'Gym T-Shirt', category: 'Apparel', price: 29, type: 'product' as const, brand: 'FitLife', stock: 40, description: 'Moisture-wicking workout shirt' }
  ],
  photography: [
    { id: 1, name: 'Portrait Session', category: 'Portrait Sessions', price: 200, type: 'service' as const, provider: 'Sarah', duration: 120, description: 'Professional headshot session' },
    { id: 2, name: 'Wedding Package', category: 'Wedding Packages', price: 1500, type: 'service' as const, provider: 'Michael', duration: 480, description: 'Full day wedding coverage' },
    { id: 3, name: 'Photo Prints 8x10', category: 'Photo Prints', price: 15, type: 'product' as const, description: 'Professional quality prints' },
    { id: 4, name: 'Wedding Album', category: 'Albums & Frames', price: 299, type: 'product' as const, brand: 'Premium Albums', description: 'Leather-bound wedding album' }
  ],
  legal: [
    { id: 1, name: 'Initial Consultation', category: 'Consultations', price: 250, type: 'service' as const, provider: 'Mr. Johnson', duration: 60, description: 'Legal consultation and case review' },
    { id: 2, name: 'Contract Review', category: 'Contract Review', price: 400, type: 'service' as const, provider: 'Ms. Smith', duration: 120, description: 'Comprehensive contract analysis' },
    { id: 3, name: 'Court Representation', category: 'Court Representation', price: 500, type: 'service' as const, provider: 'Mr. Davis', duration: 240, description: 'Legal representation in court' },
    { id: 4, name: 'Document Preparation', category: 'Document Preparation', price: 150, type: 'service' as const, provider: 'Ms. Smith', duration: 90, description: 'Legal document drafting' }
  ]
}

const industryIcons = {
  salon: Scissors,
  restaurant: Utensils,
  retail: ShoppingBag,
  healthcare: Stethoscope,
  automotive: Car,
  gym: Dumbbell,
  photography: Camera,
  legal: Briefcase
}

export default function UniversalPOSDemo() {
  const [selectedIndustry, setSelectedIndustry] = useState<POSConfigurationType>('salon')
  const [showCode, setShowCode] = useState(false)
  const configurations = getAllPOSConfigurations()

  const handleTransaction = (transaction: any) => {
    console.log(`${selectedIndustry} transaction:`, transaction)
  }

  const handleSave = (data: any) => {
    console.log(`${selectedIndustry} save:`, data)
  }

  const currentConfig = configurations[selectedIndustry]
  const currentItems = industryItems[selectedIndustry] || []
  const Icon = industryIcons[selectedIndustry]

  const codeExample = `// Using Universal POS DNA Component for ${selectedIndustry}
import { UniversalPOS } from '@/components/universal/UniversalPOS'
import { ${selectedIndustry}POSConfig } from '@/lib/universal/pos-configurations'

export default function ${selectedIndustry.charAt(0).toUpperCase() + selectedIndustry.slice(1)}POS() {
  return (
    <UniversalPOS
      config={${selectedIndustry}POSConfig}
      items={${selectedIndustry}Items}
      onTransaction={handleTransaction}
      onSave={handleSave}
      demoMode={true}
    />
  )
}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild className="bg-white/80 text-slate-800 border-slate-300 hover:bg-white shadow-md font-semibold">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Universal POS Demo
                </h1>
                <p className="text-slate-700 font-medium">One component, infinite industries</p>
              </div>
            </div>
            
            <Badge className="px-4 py-2 font-medium border bg-purple-500/20 text-purple-800 border-purple-500/30 text-sm">
              <TestTube className="h-4 w-4 mr-2" />
              HERA DNA Component
            </Badge>
          </div>

          {/* Industry Selector */}
          <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                      <Icon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Select Industry:</p>
                      <p className="text-sm text-slate-600">Same component, different configuration</p>
                    </div>
                  </div>
                  <Select value={selectedIndustry} onValueChange={(value) => setSelectedIndustry(value as POSConfigurationType)}>
                    <SelectTrigger className="w-48 bg-white/60 backdrop-blur-sm border-white/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="hera-select-content">
                      {Object.keys(configurations).map((industry) => (
                        <SelectItem key={industry} value={industry} className="hera-select-item">
                          <div className="flex items-center gap-2">
                            {React.createElement(industryIcons[industry as POSConfigurationType], { className: 'h-4 w-4' })}
                            <span className="capitalize">{industry}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCode(!showCode)}
                    className="bg-white/60 backdrop-blur-sm"
                  >
                    <Code className="h-4 w-4 mr-2" />
                    {showCode ? 'Hide Code' : 'View Code'}
                  </Button>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(codeExample)}
                    className="bg-white/60 backdrop-blur-sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={showCode ? "code" : "demo"} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-white/40 backdrop-blur-xl">
            <TabsTrigger value="demo" onClick={() => setShowCode(false)}>
              Live Demo
            </TabsTrigger>
            <TabsTrigger value="code" onClick={() => setShowCode(true)}>
              Implementation Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="space-y-6">
            {/* Current Industry Info */}
            <Card className="bg-white/30 backdrop-blur-xl border border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Icon className="h-6 w-6" />
                  <span>{currentConfig.businessName}</span>
                  <Badge variant="outline" className="ml-auto">
                    {selectedIndustry.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Tax Rate</p>
                    <p className="font-semibold">{(currentConfig.taxRate * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Categories</p>
                    <p className="font-semibold">{currentConfig.itemCategories.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Payment Methods</p>
                    <p className="font-semibold">{Object.values(currentConfig.paymentMethods).filter(Boolean).length}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Features</p>
                    <p className="font-semibold">{Object.values(currentConfig.features).filter(Boolean).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Universal POS Component */}
            <UniversalPOS
              config={currentConfig}
              items={currentItems}
              onTransaction={handleTransaction}
              onSave={handleSave}
              demoMode={true}
              className="bg-white/20 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-xl"
            />
          </TabsContent>

          <TabsContent value="code" className="space-y-6">
            <Card className="bg-slate-900 border border-slate-700 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <Code className="h-5 w-5" />
                  Implementation for {selectedIndustry.charAt(0).toUpperCase() + selectedIndustry.slice(1)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-slate-300 overflow-x-auto">
                  <code>{codeExample}</code>
                </pre>
              </CardContent>
            </Card>

            <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5" />
                  Configuration Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-x-auto">
                  <code>{JSON.stringify(currentConfig, null, 2)}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* DNA Info Footer */}
        <div className="mt-12">
          <Card className="bg-white/25 backdrop-blur-xl border border-white/15 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-indigo-500/80 to-purple-600/80 rounded-xl flex items-center justify-center shadow-lg">
                    <TestTube className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-800">
                      HERA Universal POS DNA Component
                    </p>
                    <p className="text-slate-600 font-medium">
                      Smart Code: HERA.UI.POS.UNIVERSAL.ENGINE.v1
                    </p>
                  </div>
                </div>
                
                <div className="text-center lg:text-right">
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-medium">8 Industries Supported</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      <span className="font-medium">200x Development Acceleration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TestTube className="h-4 w-4" />
                      <span className="font-medium">One Component, Infinite Possibilities</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}