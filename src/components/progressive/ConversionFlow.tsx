'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Rocket, 
  Shield, 
  Star,
  Zap,
  Users,
  Trophy,
  Gift,
  Target
} from 'lucide-react'

interface ConversionFlowProps {
  appName: string
  industry: string
  currentUrl: string
}

export function ConversionFlow({ appName, industry, currentUrl }: ConversionFlowProps) {
  const [showPricing, setShowPricing] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            Ready to Deploy {appName}?
          </CardTitle>
          <CardDescription className="text-lg">
            Move from demo to production in just 14 days
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Journey Flow */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Your Journey</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-medium">Demo Explored</div>
                <div className="text-xs text-gray-600">You're here!</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-medium">Quick Signup</div>
                <div className="text-xs text-gray-600">2 minutes</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-purple-500 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-medium">App Deployment</div>
                <div className="text-xs text-gray-600">14 days</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-amber-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-medium">Go Live</div>
                <div className="text-xs text-gray-600">Your success</div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">What You Get</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Production-ready {appName} system</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Your own secure database</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Custom domain & branding</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">24/7 support & monitoring</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Data migration assistance</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Staff training included</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Why Choose HERA</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm">14-day deployment guarantee</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">70% cost savings vs competitors</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm">Enterprise-grade security</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span className="text-sm">92% customer success rate</span>
                </div>
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-pink-500 flex-shrink-0" />
                  <span className="text-sm">No setup fees</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <span className="text-sm">Unlimited customization</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Preview */}
          {showPricing && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-green-800">Special Launch Pricing</h3>
                <p className="text-sm text-green-600">Limited time offer for {industry} businesses</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-xl border border-green-200">
                  <div className="text-2xl font-bold text-green-600">$299</div>
                  <div className="text-sm text-gray-600">per month</div>
                  <div className="text-xs text-gray-500 mt-1">Starter Plan</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white relative">
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white border-0">
                    Most Popular
                  </Badge>
                  <div className="text-2xl font-bold">$699</div>
                  <div className="text-sm opacity-90">per month</div>
                  <div className="text-xs opacity-75 mt-1">Professional Plan</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-green-200">
                  <div className="text-2xl font-bold text-green-600">$1,299</div>
                  <div className="text-sm text-gray-600">per month</div>
                  <div className="text-xs text-gray-500 mt-1">Enterprise Plan</div>
                </div>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-sm text-green-700">
                  <strong>Save 50%</strong> vs traditional ERP solutions
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              onClick={() => window.location.href = '/auth/register?app=' + encodeURIComponent(appName)}
            >
              <Rocket className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowPricing(!showPricing)}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              {showPricing ? 'Hide' : 'See'} Pricing
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="text-center pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span>10,000+ Users</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => {
                // Close modal - in real implementation this would be handled by parent
                console.log('Close conversion flow')
              }}
            >
              Continue Exploring Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}