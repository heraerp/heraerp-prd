/**
 * Universal Domain Overview Page
 * Smart Code: HERA.UNIVERSAL.DOMAIN.OVERVIEW.v1
 * 
 * Dynamic domain page that works for ANY domain (retail, wholesale, finance, etc.)
 * Route: /[domain]
 * Examples: /retail, /wholesale, /finance, /manufacturing, /crm
 */

'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowRight, 
  Loader2, 
  AlertTriangle,
  ShoppingBag,
  Package,
  DollarSign,
  Factory,
  Users,
  CreditCard,
  Tags,
  ShoppingCart,
  Book,
  Calculator,
  BarChart3,
  LayoutDashboard,
  Smartphone,
  Cog
} from 'lucide-react'
import { resolveUniversalConfig, generateUniversalSmartCode, UNIVERSAL_CONFIG } from '@/lib/universal/config'

// Icon mapping for dynamic icon rendering
const iconMap = {
  'ShoppingBag': ShoppingBag,
  'Package': Package,
  'DollarSign': DollarSign,
  'Factory': Factory,
  'Users': Users,
  'CreditCard': CreditCard,
  'Tags': Tags,
  'ShoppingCart': ShoppingCart,
  'Book': Book,
  'Calculator': Calculator,
  'BarChart3': BarChart3,
  'LayoutDashboard': LayoutDashboard,
  'Smartphone': Smartphone,
  'Cog': Cog
}

export default function UniversalDomainPage() {
  const router = useRouter()
  const params = useParams()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  
  const domain = params.domain as string

  // Three-layer auth check
  if (!isAuthenticated) return <Alert><AlertDescription>Please log in</AlertDescription></Alert>
  if (contextLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!organization?.id) return <Alert><AlertDescription>No organization context</AlertDescription></Alert>

  // Resolve universal configuration
  const config = resolveUniversalConfig(domain)
  
  if (!config.domain) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Domain "{domain}" not found. Available domains: {UNIVERSAL_CONFIG.domains.map(d => d.name).join(', ')}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/')} className="mt-4">
          ← Back to Home
        </Button>
      </div>
    )
  }

  // Get sections for this domain
  const availableSections = UNIVERSAL_CONFIG.sections.filter(s => 
    s.domains.includes(domain)
  )

  // Get domain icon
  const DomainIcon = iconMap[config.domain.icon.name as keyof typeof iconMap] || Package

  const handleSectionClick = (sectionId: string) => {
    router.push(`/${domain}/${sectionId}`)
  }

  return (
    <div className="container mx-auto p-6">
      {/* Domain Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-xl bg-${config.domain.color}-100`}>
            <DomainIcon className={`w-8 h-8 text-${config.domain.color}-600`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {config.domain.name}
            </h1>
            <p className="text-gray-600">
              {config.domain.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {availableSections.length} sections available
          </Badge>
          <Badge variant="outline">
            Domain: {domain}
          </Badge>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="mb-8">
        <Card className={`border-l-4 border-l-${config.domain.color}-500 bg-gradient-to-r from-${config.domain.color}-50 to-${config.domain.color}-100`}>
          <CardContent className="pt-6">
            <h2 className={`text-xl font-semibold text-${config.domain.color}-900 mb-2`}>
              Welcome to {config.domain.name}
            </h2>
            <p className={`text-${config.domain.color}-700`}>
              Choose a section below to access {config.domain.name.toLowerCase()} operations and management tools.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableSections.map((section) => {
          const SectionIcon = iconMap[section.icon.name as keyof typeof iconMap] || Package
          
          return (
            <Card 
              key={section.id}
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => handleSectionClick(section.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${section.color}-50`}>
                      <SectionIcon className={`w-6 h-6 text-${section.color}-600`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {section.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {section.workspaces.length} workspaces
                      </Badge>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  {section.description}
                </p>
                
                {/* Available Workspaces Preview */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-700 mb-2">Available Workspaces:</div>
                  <div className="flex flex-wrap gap-1">
                    {section.workspaces.slice(0, 3).map((workspaceId) => {
                      const workspace = UNIVERSAL_CONFIG.workspaces.find(w => w.id === workspaceId)
                      return workspace ? (
                        <Badge key={workspaceId} variant="secondary" className="text-xs">
                          {workspace.name}
                        </Badge>
                      ) : null
                    })}
                    {section.workspaces.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{section.workspaces.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full mt-4 group-hover:bg-gray-50"
                >
                  Access {section.name}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Domain Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-2xl font-bold text-${config.domain.color}-600`}>
                  {availableSections.length}
                </div>
                <div className="text-sm text-gray-600">Available Sections</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {availableSections.reduce((acc, s) => acc + s.workspaces.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Workspaces</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {organization?.name}
                </div>
                <div className="text-sm text-gray-600">Organization</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {generateUniversalSmartCode(domain, 'OVERVIEW').split('.').length}
                </div>
                <div className="text-sm text-gray-600">Smart Code Levels</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Domain:</strong> {domain}</div>
            <div><strong>Smart Code:</strong> {generateUniversalSmartCode(domain, 'OVERVIEW')}</div>
            <div><strong>Available Sections:</strong> {availableSections.map(s => s.id).join(', ')}</div>
            <div><strong>Organization ID:</strong> {organization.id}</div>
            <div><strong>User ID:</strong> {user?.id}</div>
          </div>
        </div>
      )}
    </div>
  )
}