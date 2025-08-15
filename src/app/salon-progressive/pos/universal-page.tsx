'use client'

// ================================================================================
// SALON POS - UNIVERSAL DNA COMPONENT IMPLEMENTATION
// Example of how to use the Universal POS DNA Component for salon industry
// Smart Code: HERA.SALON.POS.DNA.IMPL.v1
// ================================================================================

import React from 'react'
import { SalonTeamsSidebar } from '@/components/salon-progressive/SalonTeamsSidebar'
import { UniversalPOS } from '@/components/universal/UniversalPOS'
import { salonPOSConfig } from '@/lib/universal/pos-configurations'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, TestTube } from 'lucide-react'
import Link from 'next/link'

// Sample salon items - in production, these would come from your database/API
const salonItems = [
  // Services
  {
    id: 1,
    name: 'Haircut & Style',
    category: 'Hair Services',
    price: 85,
    type: 'service' as const,
    provider: 'Emma',
    duration: 60,
    description: 'Professional haircut with styling'
  },
  {
    id: 2,
    name: 'Hair Color',
    category: 'Color Services', 
    price: 150,
    type: 'service' as const,
    provider: 'Emma',
    duration: 120,
    description: 'Full hair coloring service'
  },
  {
    id: 3,
    name: 'Highlights',
    category: 'Color Services',
    price: 130,
    type: 'service' as const,
    provider: 'Sarah',
    duration: 90,
    description: 'Foil highlights with toner'
  },
  {
    id: 4,
    name: 'Beard Trim',
    category: 'Men\'s Services',
    price: 35,
    type: 'service' as const,
    provider: 'David',
    duration: 30,
    description: 'Professional beard trimming'
  },
  {
    id: 5,
    name: 'Deep Conditioning',
    category: 'Hair Treatments',
    price: 65,
    type: 'service' as const,
    provider: 'Alex',
    duration: 45,
    description: 'Intensive hair treatment'
  },
  {
    id: 6,
    name: 'Manicure',
    category: 'Nail Services',
    price: 45,
    type: 'service' as const,
    provider: 'Maria',
    duration: 45,
    description: 'Professional manicure service'
  },
  {
    id: 7,
    name: 'Facial Treatment',
    category: 'Spa Services',
    price: 95,
    type: 'service' as const,
    provider: 'Sarah',
    duration: 75,
    description: 'Relaxing facial with skincare'
  },
  // Products
  {
    id: 101,
    name: 'Professional Shampoo',
    category: 'Hair Care',
    price: 28,
    type: 'product' as const,
    brand: 'L\'Oreal Professional',
    stock: 45,
    description: 'Premium salon shampoo'
  },
  {
    id: 102,
    name: 'Hair Styling Mousse',
    category: 'Styling Products',
    price: 22.50,
    type: 'product' as const,
    brand: 'Redken',
    stock: 25,
    description: 'Professional styling mousse'
  },
  {
    id: 103,
    name: 'Premium Conditioner',
    category: 'Hair Care',
    price: 45,
    type: 'product' as const,
    brand: 'Olaplex',
    stock: 32,
    description: 'Luxury hair conditioner'
  },
  {
    id: 104,
    name: 'Hair Serum',
    category: 'Hair Treatments',
    price: 35,
    type: 'product' as const,
    brand: 'Schwarzkopf',
    stock: 18,
    description: 'Repair and shine serum'
  },
  {
    id: 105,
    name: 'Nail Polish Set',
    category: 'Nail Services',
    price: 24,
    type: 'product' as const,
    brand: 'OPI',
    stock: 12,
    description: 'Premium nail polish collection'
  }
]

export default function UniversalSalonPOS() {
  const handleTransaction = (transaction: any) => {
    console.log('Salon transaction processed:', transaction)
    // In production, this would integrate with your auto-journal system
    // processTransactionForAutoJournal(transaction)
  }

  const handleSave = (data: any) => {
    console.log('Salon POS data saved:', data)
    // In production, save to your database/localStorage
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Teams-Style Sidebar */}
      <SalonTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Enterprise Glassmorphism Header */}
        <div className="bg-white/20 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-black/5">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild className="bg-white/80 text-slate-800 border-slate-300 hover:bg-white shadow-md font-semibold">
                  <Link href="/salon-progressive">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Universal Salon POS
                  </h1>
                  <p className="text-sm text-slate-700 font-medium">Powered by HERA DNA Component</p>
                </div>
              </div>
              
              <Badge className="px-3 py-1 font-medium border bg-purple-500/20 text-purple-800 border-purple-500/30">
                <div className="w-2 h-2 rounded-full mr-2 bg-purple-500"></div>
                <TestTube className="h-3 w-3 mr-1" />
                Universal POS DNA
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {/* Universal POS Component */}
          <UniversalPOS
            config={salonPOSConfig}
            items={salonItems}
            onTransaction={handleTransaction}
            onSave={handleSave}
            demoMode={true}
            className="mb-8"
          />

          {/* DNA Component Info */}
          <div className="mt-8 p-6 bg-white/30 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <TestTube className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg">Universal POS DNA Component</p>
                <p className="text-sm text-slate-700 font-medium">
                  Smart Code: HERA.UI.POS.UNIVERSAL.ENGINE.v1
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div>
                <h4 className="font-semibold mb-2">🧬 DNA Features Active:</h4>
                <ul className="space-y-1">
                  <li>✅ Split Payment System</li>
                  <li>✅ Auto-Complete Payments</li>
                  <li>✅ Professional Receipt Printing</li>
                  <li>✅ Industry-Specific Theming</li>
                  <li>✅ Service Provider Assignment</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🎯 Configuration Applied:</h4>
                <ul className="space-y-1">
                  <li>• Business: {salonPOSConfig.businessName}</li>
                  <li>• Tax Rate: {(salonPOSConfig.taxRate * 100).toFixed(1)}%</li>
                  <li>• Categories: {salonPOSConfig.itemCategories.length}</li>
                  <li>• Payment Methods: {Object.values(salonPOSConfig.paymentMethods).filter(Boolean).length}</li>
                  <li>• Service Providers: {salonPOSConfig.serviceProviders?.length || 0}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Enterprise HERA Technology Footer */}
          <div className="mt-8 mb-8">
            <div className="bg-white/25 backdrop-blur-xl border border-white/15 rounded-xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gradient-to-br from-indigo-500/80 to-purple-600/80 rounded-lg flex items-center justify-center shadow-md">
                      <TestTube className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-bold text-slate-800">
                        Powered by <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-black">HERA DNA</span>
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        Universal POS Engine - Reusable Across All Industries
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <TestTube className="h-3 w-3 text-slate-400" />
                    <span className="font-medium">DNA Component System</span>
                  </div>
                  <div className="hidden sm:block w-1 h-1 bg-slate-400 rounded-full"></div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">200x Development Acceleration</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}