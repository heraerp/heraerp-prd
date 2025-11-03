/**
 * Apply MatrixIT World Industry Theme Component
 * Direct application of MatrixIT World theme from industry library
 */

'use client'

import React, { useState, useEffect } from 'react'
import { brandingEngine } from '@/lib/platform/branding-engine'
import { findThemeByName, getIndustryThemes } from '@/lib/platform/industry-themes'
import { INDUSTRY_TYPES } from '@/lib/platform/constants'
import { MATRIXITWORLD_CONFIG } from '@/lib/constants/matrixitworld'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Palette, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  Monitor,
  Settings,
  Sparkles
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ApplyMatrixITWorldTheme() {
  const { toast } = useToast()
  const [isApplying, setIsApplying] = useState(false)
  const [applicationResult, setApplicationResult] = useState<{
    success: boolean
    message: string
    duration?: number
    details?: any
  } | null>(null)

  const applyMatrixITWorldTheme = async () => {
    setIsApplying(true)
    setApplicationResult(null)
    
    try {
      const startTime = Date.now()
      
      // Simply initialize branding for MatrixIT World - no hardcoded theme
      // The branding will be loaded from database or user configuration
      const organizationId = MATRIXITWORLD_CONFIG.ORGANIZATION_ID
      const branding = await brandingEngine.initializeBranding(organizationId)
      const duration = Date.now() - startTime
      
      if (branding) {
        setApplicationResult({
          success: true,
          message: `MatrixIT World branding loaded successfully in ${duration}ms`,
          duration,
          details: {
            themeName: 'MatrixIT World - Custom Branding',
            industry: 'PC & Mobile Retail Distribution',
            primaryColor: branding.theme.primary_color,
            secondaryColor: branding.theme.secondary_color,
            accentColor: branding.theme.accent_color,
            organizationId
          }
        })
        
        toast({
          title: "✅ MatrixIT World Theme Applied",
          description: `Custom branding applied in ${duration}ms`,
          duration: 3000
        })
      } else {
        setApplicationResult({
          success: false,
          message: 'Failed to load MatrixIT World branding'
        })
        
        toast({
          title: "❌ Application Failed", 
          description: "Failed to load MatrixIT World branding",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      setApplicationResult({
        success: false,
        message: `Error: ${error.message}`
      })
      
      toast({
        title: "❌ Error",
        description: `Error applying theme: ${error.message}`,
        variant: "destructive"
      })
    } finally {
      setIsApplying(false)
    }
  }

  // Get current branding for display
  const [currentTheme, setCurrentTheme] = useState<any>(null)
  
  // Load current theme
  useEffect(() => {
    const loadTheme = async () => {
      const branding = await brandingEngine.initializeBranding(MATRIXITWORLD_CONFIG.ORGANIZATION_ID)
      if (branding) {
        setCurrentTheme({
          name: 'MatrixIT World - Custom Branding',
          description: 'Customizable branding for MatrixIT World PC & Mobile retail platform',
          industry: 'PC & Mobile Retail Distribution',
          theme: branding.theme,
          tags: ['matrixitworld', 'customizable', 'tech', 'distribution', 'kerala', 'professional']
        })
      }
    }
    loadTheme()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Theme Configuration
        </h3>
        <p className="text-slate-600 mt-1">
          Apply the professional MatrixIT World theme from the industry library
        </p>
      </div>

      {/* Theme Information */}
      {currentTheme && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-slate-700" />
            <h4 className="font-semibold text-slate-900">Theme Details</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-slate-900 mb-3">Basic Information</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Name:</span>
                  <span className="text-slate-900 font-medium">{currentTheme.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Industry:</span>
                  <span className="text-slate-900 font-medium">{currentTheme.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Description:</span>
                  <span className="text-slate-900 font-medium text-right max-w-xs">{currentTheme.description}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-slate-900 mb-3">Color Palette</h5>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded border-2 border-white shadow-sm" 
                    style={{ backgroundColor: currentTheme.theme.primary_color }}
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Primary Color</div>
                    <div className="text-xs text-slate-600">{currentTheme.theme.primary_color}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded border-2 border-white shadow-sm" 
                    style={{ backgroundColor: currentTheme.theme.secondary_color }}
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Secondary Color</div>
                    <div className="text-xs text-slate-600">{currentTheme.theme.secondary_color}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded border-2 border-white shadow-sm" 
                    style={{ backgroundColor: currentTheme.theme.accent_color }}
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Accent Color</div>
                    <div className="text-xs text-slate-600">{currentTheme.theme.accent_color}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-slate-900 mb-3">Typography</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Heading Font:</span>
                    <span className="text-slate-900 font-medium">{currentTheme.theme.font_family_heading}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Body Font:</span>
                    <span className="text-slate-900 font-medium">{currentTheme.theme.font_family_body}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-slate-900 mb-3">Theme Tags</h5>
                <div className="flex flex-wrap gap-2">
                  {currentTheme.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-slate-200 text-slate-800">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-slate-700" />
          <h4 className="font-semibold text-slate-900">Theme Application</h4>
        </div>
        
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-sm text-slate-600 mb-2">Organization ID</div>
            <code className="bg-slate-100 px-3 py-2 rounded-md text-sm font-mono text-slate-800 block">
              {MATRIXITWORLD_CONFIG.ORGANIZATION_ID}
            </code>
          </div>
          
          <Button
            onClick={applyMatrixITWorldTheme}
            disabled={isApplying || !currentTheme}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
          >
            {isApplying ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Applying Theme...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Apply MatrixIT World Theme
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Application Result */}
      {applicationResult && (
        <div className={`rounded-lg p-6 border ${applicationResult.success ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
          <div className="flex items-start gap-3">
            {applicationResult.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${applicationResult.success ? "text-emerald-900" : "text-red-900"}`}>
                {applicationResult.message}
              </p>
              
              {applicationResult.success && applicationResult.details && (
                <div className="mt-3 space-y-2 text-sm text-emerald-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Theme:</span> {applicationResult.details.themeName}
                    </div>
                    <div>
                      <span className="font-medium">Industry:</span> {applicationResult.details.industry}
                    </div>
                    <div>
                      <span className="font-medium">Primary:</span> {applicationResult.details.primaryColor}
                    </div>
                    <div>
                      <span className="font-medium">Secondary:</span> {applicationResult.details.secondaryColor}
                    </div>
                    <div>
                      <span className="font-medium">Accent:</span> {applicationResult.details.accentColor}
                    </div>
                    {applicationResult.duration && (
                      <div>
                        <span className="font-medium">Duration:</span> {applicationResult.duration}ms
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {applicationResult?.success && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <div>
              <h4 className="font-semibold text-blue-900">Theme Applied Successfully!</h4>
              <p className="text-sm text-blue-800 mt-1">
                Visit MatrixIT World pages to see the new theme in action
              </p>
              <div className="mt-3 space-y-2">
                <a 
                  href="/retail1/matrixitworld" 
                  className="inline-flex items-center text-sm text-blue-700 hover:text-blue-900 underline"
                >
                  → MatrixIT World Overview
                </a>
                <br />
                <a 
                  href="/retail1/matrixitworld/dashboard" 
                  className="inline-flex items-center text-sm text-blue-700 hover:text-blue-900 underline"
                >
                  → MatrixIT World Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}