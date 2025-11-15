/**
 * HERA Universal Tile System - Production Monitoring Admin Page
 * Smart Code: HERA.ADMIN.MONITORING.PRODUCTION.PAGE.v1
 * 
 * Comprehensive production monitoring dashboard for administrators
 */

'use client'

import React, { useState, useEffect } from 'react'
import { ProductionDashboard } from '@/components/monitoring/ProductionDashboard'
import { initializeProductionMonitoring } from '@/lib/monitoring/ProductionMonitor'
import { initializeErrorTracking } from '@/lib/monitoring/ErrorTracker'
import { initializeSecurityMonitoring } from '@/lib/monitoring/SecurityMonitor'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity,
  Shield,
  AlertTriangle,
  Settings,
  Download,
  RefreshCw,
  Eye,
  Server,
  Database,
  Globe
} from 'lucide-react'

export default function MonitoringAdminPage() {
  const { user, organization, hasScope } = useHERAAuth()
  const [deploymentId] = useState(`deploy-${Date.now()}`)
  const [environment] = useState(process.env.NODE_ENV || 'development')
  const [monitoringInitialized, setMonitoringInitialized] = useState(false)
  const [initializationError, setInitializationError] = useState<string | null>(null)
  
  useEffect(() => {
    initializeMonitoringServices()
  }, [])
  
  const initializeMonitoringServices = async () => {
    try {
      console.log('🚀 Initializing production monitoring services...')
      
      // Initialize error tracking first
      const errorTracker = initializeErrorTracking()
      
      // Initialize production monitoring
      const productionMonitor = initializeProductionMonitoring(deploymentId, environment)
      
      // Initialize security monitoring
      const securityMonitor = initializeSecurityMonitoring(errorTracker)
      
      setMonitoringInitialized(true)
      console.log('✅ All monitoring services initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize monitoring services:', error)
      setInitializationError((error as Error).message)
    }
  }
  
  // Security check - only allow admin users
  if (!hasScope || !hasScope('admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. Administrator privileges required to view production monitoring.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  if (initializationError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Alert className="max-w-md border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            Failed to initialize monitoring services: {initializationError}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={initializeMonitoringServices}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  if (!monitoringInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-pulse mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">Initializing Monitoring Services</h2>
          <p className="text-gray-600">Setting up production monitoring infrastructure...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Production Monitoring</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive monitoring and observability for HERA Universal Tile System
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>Environment: {environment}</span>
                <span>Deployment: {deploymentId}</span>
                <span>Organization: {organization?.entity_name || 'Unknown'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Errors
            </TabsTrigger>
            <TabsTrigger value="infrastructure" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Infrastructure
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <ProductionDashboard 
              deploymentId={deploymentId}
              environment={environment}
              refreshInterval={5000}
            />
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Performance Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Detailed performance monitoring dashboard coming soon</p>
                  <p className="text-sm mt-2">
                    This will include tile render metrics, memory usage, cache performance, and more.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Security monitoring dashboard coming soon</p>
                  <p className="text-sm mt-2">
                    This will include threat detection, security alerts, incident response, and more.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Error Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Error tracking dashboard coming soon</p>
                  <p className="text-sm mt-2">
                    This will include error analytics, pattern detection, automated recovery, and more.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="infrastructure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Infrastructure Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Infrastructure monitoring dashboard coming soon</p>
                  <p className="text-sm mt-2">
                    This will include database metrics, API performance, system resources, and more.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              HERA Universal Tile System Production Monitoring v1.0
            </div>
            <div className="flex items-center gap-4">
              <span>Monitoring Active</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}