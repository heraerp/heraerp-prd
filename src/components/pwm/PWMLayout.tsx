'use client'

import React, { useState } from 'react'
import { PWMNavigation } from './PWMNavigation'
import { WealthDashboard } from './WealthDashboard'
import { PortfolioComposition } from './PortfolioComposition'
import { AIIntelligenceCenter } from './AIIntelligenceCenter'
import { TransactionHistory } from './TransactionHistory'
import { PWMSettings } from './PWMSettings'
import EncryptionControls from './EncryptionControls'

interface PWMLayoutProps {
  organizationId: string
}

export function PWMLayout({ organizationId }: PWMLayoutProps) {
  const [activeTab, setActiveTab] = useState('wealth')

  // Add encryption tab
  const tabs = ['wealth', 'portfolio', 'ai', 'actions', 'settings', 'security']

  const renderContent = () => {
    switch (activeTab) {
      case 'wealth':
        return <WealthDashboard organizationId={organizationId} />
      case 'portfolio':
        return (
          <div className="min-h-screen bg-slate-950 text-white pt-20 md:pt-24 pb-20 md:pb-6">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <PortfolioComposition organizationId={organizationId} />
            </div>
          </div>
        )
      case 'ai':
        return (
          <div className="min-h-screen bg-slate-950 text-white pt-20 md:pt-24 pb-20 md:pb-6">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <AIIntelligenceCenter organizationId={organizationId} />
            </div>
          </div>
        )
      case 'actions':
        return (
          <div className="min-h-screen bg-slate-950 text-white pt-20 md:pt-24 pb-20 md:pb-6">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <TransactionHistory organizationId={organizationId} />
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="min-h-screen bg-slate-950 text-white pt-20 md:pt-24 pb-20 md:pb-6">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <PWMSettings organizationId={organizationId} />
            </div>
          </div>
        )
      case 'security':
        return (
          <div className="min-h-screen bg-slate-50 pt-20 md:pt-24 pb-20 md:pb-6">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Data Security & Encryption
                </h1>
                <p className="text-slate-600">
                  Manage encryption settings and data protection for your wealth management data.
                </p>
              </div>
              <EncryptionControls
                organizationId={organizationId}
                onEncryptionChange={enabled => console.log('Encryption enabled:', enabled)}
              />
            </div>
          </div>
        )
      default:
        return <WealthDashboard organizationId={organizationId} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <PWMNavigation activeTab={activeTab} onTabChange={setActiveTab} notifications={3} />

      {renderContent()}
    </div>
  )
}
