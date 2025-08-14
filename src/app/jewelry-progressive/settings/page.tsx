'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { JewelryTeamsSidebar } from '@/components/jewelry-progressive/JewelryTeamsSidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Crown, Save, Database, Copy } from 'lucide-react'

// Progressive Jewelry Settings - HERA Universal Architecture
// Smart Code: HERA.JWLY.SETTINGS.PROGRESSIVE.v1

export default function JewelryProgressiveSettingsPage() {
  const { workspace, isAnonymous } = useAuth()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  
  // Show loading state
  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading jewelry settings...</p>
          <p className="text-sm text-gray-500 mt-2">Progressive workspace initializing</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Teams-Style Sidebar */}
      <JewelryTeamsSidebar />
      
      
      <div className="ml-16">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/jewelry-progressive')}
                  className="p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-sm text-gray-500">
                      {isAnonymous ? 'Progressive workspace - customize your experience' : 'Business configuration'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">{workspace.organization_name}</p>
                  <p className="text-xs text-gray-400">
                    {workspace.type === 'anonymous' ? 'Anonymous Session' : 'Registered User'}
                  </p>
                </div>
                
                <Button
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="space-y-6">
            {/* Organization ID Configuration */}
            <Card className="bg-white/90 backdrop-blur border-0 shadow-md border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-emerald-600" />
                  Organization Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Organization ID Display */}
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      HERA Universal Architecture - Organization ID
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-800">Organization Name</p>
                          <p className="text-lg font-mono text-emerald-900">{workspace.organization_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-emerald-800">Workspace Type</p>
                          <p className="text-sm text-emerald-700">
                            {workspace.type === 'anonymous' ? 'Progressive Workspace' : 'Registered Business'}
                          </p>
                        </div>
                      </div>
                      {workspace.organization_id && (
                        <div>
                          <p className="text-sm font-medium text-emerald-800 mb-1">Organization ID (Backend Tables)</p>
                          <div className="flex items-center gap-3 p-3 bg-white rounded border border-emerald-300">
                            <code className="flex-1 text-sm font-mono text-emerald-900 select-all">
                              {workspace.organization_id}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              onClick={() => navigator.clipboard.writeText(workspace.organization_id)}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Data Isolation Explanation */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Perfect Data Isolation</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• This Organization ID isolates all your jewelry data in HERA's universal 6-table architecture</li>
                      <li>• Inventory, customers, sales, and repairs are filtered by this organization_id</li>
                      <li>• Zero data leakage between different jewelry businesses</li>
                      <li>• Used across core_entities, core_dynamic_data, and universal_transactions tables</li>
                    </ul>
                  </div>

                  {/* Backend Table Information */}
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Backend Database Tables
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Core Tables:</p>
                        <ul className="text-gray-600 space-y-0.5">
                          <li>• core_entities (products, customers)</li>
                          <li>• core_dynamic_data (custom fields)</li>
                          <li>• universal_transactions (sales)</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Data Types:</p>
                        <ul className="text-gray-600 space-y-0.5">
                          <li>• Jewelry inventory items</li>
                          <li>• VIP customer records</li>
                          <li>• Repair & custom orders</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Profile */}
            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Business Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Settings Configuration
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your jewelry business settings will be available here. 
                    Configure pricing, VIP tiers, notifications, and more.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Coming Soon */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Advanced Settings Coming Soon
                </h3>
                <p className="text-gray-600 mb-6">
                  We're building comprehensive business settings including:
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Business profile & contact info</li>
                    <li>• VIP discount tiers & pricing</li>
                    <li>• Notification preferences</li>
                    <li>• Security & access controls</li>
                  </ul>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Jewelry service features</li>
                    <li>• Layaway & payment options</li>
                    <li>• Data backup & export</li>
                    <li>• Tax rates & currencies</li>
                  </ul>
                </div>
                
                {isAnonymous && (
                  <div className="mt-6">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={() => {
                        const banner = document.querySelector('[data-save-button]')
                        if (banner) {
                          (banner as HTMLButtonElement).click()
                        }
                      }}
                    >
                      Save Workspace to Keep Settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}