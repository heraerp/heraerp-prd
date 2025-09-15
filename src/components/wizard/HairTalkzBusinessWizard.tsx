'use client'

import React from 'react'
import { BusinessSetupWizard } from './BusinessSetupWizard'
import { HairTalkzOrgProvider, HairTalkzOrgLoading, useHairTalkzOrg } from './HairTalkzOrgContext'

// Hair Talkz branded wrapper for the Business Setup Wizard
function HairTalkzWizardContent() {
  const { organizationId, organizationName, orgLoading } = useHairTalkzOrg()

  if (orgLoading) {
    return <HairTalkzOrgLoading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-dusty-rose-50 to-champagne-50">
      {/* Hair Talkz Branding Header */}
      <div className="bg-gradient-to-r from-sage-500 via-dusty-rose-400 to-champagne-500 text-foreground py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-background/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <span className="text-2xl">💇‍♀️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Hair Talkz Business Setup</h1>
              <p className="text-foreground/90 text-sm">
                Setting up {organizationName} with HERA's AI-powered salon management system
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Setup Wizard with Hair Talkz Context */}
      <div className="p-6">
        <BusinessSetupWizard />
      </div>

      {/* Hair Talkz Footer */}
      <div className="bg-background/50 backdrop-blur-sm border-t border-sage-200 py-4 px-6 text-center">
        <p className="text-sage-600 text-sm">
          Powered by HERA Universal Architecture • AI + ERP + Modern = Complete Salon Solution
        </p>
      </div>
    </div>
  )
}

export const HairTalkzBusinessWizard: React.FC = () => {
  return (
    <HairTalkzOrgProvider>
      <HairTalkzWizardContent />
    </HairTalkzOrgProvider>
  )
}
