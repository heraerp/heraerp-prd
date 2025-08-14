'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DollarSign, Plus, ArrowRight, Target, Zap, 
  TrendingUp, Calendar, User, Building, CheckCircle,
  Clock, Star, Trophy, ChevronRight, Settings, Users
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useProgressiveAuth } from "@/components/auth/ProgressiveAuthProvider"
import { CRMLayout } from '@/components/layout/crm-layout'

// Simplified 3-stage pipeline (Steve Jobs style: Essential only)
const DEAL_STAGES = [
  { 
    id: 'interested', 
    name: 'Interested', 
    color: 'bg-blue-500',
    description: 'They want to learn more',
    icon: <Target className="w-5 h-5" />
  },
  { 
    id: 'proposal', 
    name: 'Proposal Sent', 
    color: 'bg-orange-500',
    description: 'Waiting for their decision',
    icon: <Clock className="w-5 h-5" />
  },
  { 
    id: 'won', 
    name: 'Deal Won', 
    color: 'bg-green-500',
    description: 'Success! New customer',
    icon: <Trophy className="w-5 h-5" />
  }
]

// Demo deals
const demoDeals = [
  {
    id: 1,
    company: 'Tech Solutions Inc',
    contact: 'Sarah Johnson',
    value: 25000,
    stage: 'proposal',
    daysInStage: 3,
    nextAction: 'Follow up on proposal'
  },
  {
    id: 2,
    company: 'StartupCo',
    contact: 'Mike Chen',
    value: 5000,
    stage: 'interested',
    daysInStage: 1,
    nextAction: 'Send pricing proposal'
  },
  {
    id: 3,
    company: 'Global Enterprises',
    contact: 'Emily Rodriguez',
    value: 50000,
    stage: 'won',
    daysInStage: 0,
    nextAction: 'Schedule onboarding call'
  }
]

export default function DealsPage() {
  const { user, workspace, isLoading } = useProgressiveAuth()
  const [mounted, setMounted] = useState(false)
  const [deals, setDeals] = useState(demoDeals)
  const [showNewDeal, setShowNewDeal] = useState(false)
  const [dealStages, setDealStages] = useState(DEAL_STAGES)
  const [pipelineConfig, setPipelineConfig] = useState(null)
  const [newDeal, setNewDeal] = useState({
    company: '',
    contact: '',
    value: '',
    stage: 'interested'
  })

  useEffect(() => {
    setMounted(true)
    loadPipelineConfig()
  }, [workspace])

  const loadPipelineConfig = async () => {
    if (!organization?.organization_id) return
    
    // Load organization-specific pipeline configuration
    const saved = localStorage.getItem(`deal-config-${organization?.organization_id}`)
    if (saved) {
      const config = JSON.parse(saved)
      setPipelineConfig(config)
      setDealStages(config.stages)
      
      // Update default stage for new deals
      if (config.stages.length > 0) {
        setNewDeal(prev => ({ ...prev, stage: config.stages[0].id }))
      }
    }
  }

  if (!mounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const handleCreateDeal = () => {
    if (newDeal.company && newDeal.contact && newDeal.value) {
      const deal = {
        id: Date.now(),
        ...newDeal,
        value: parseFloat(newDeal.value),
        daysInStage: 0,
        nextAction: 'Send welcome email'
      }
      setDeals([...deals, deal])
      setNewDeal({ company: '', contact: '', value: '', stage: 'interested' })
      setShowNewDeal(false)
    }
  }

  const moveDeal = (dealId: number, newStage: string) => {
    setDeals(deals.map(deal => 
      deal.id === dealId 
        ? { ...deal, stage: newStage, daysInStage: 0 }
        : deal
    ))
  }

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0)
  const lastStageId = dealStages[dealStages.length - 1]?.id || 'won'
  const activeDeals = deals.filter(deal => deal.stage !== lastStageId).length
  const wonValue = deals.filter(deal => deal.stage === lastStageId).reduce((sum, deal) => sum + deal.value, 0)

  return (
    <CRMLayout>
      <div className="min-h-screen bg-white">
      {/* Header - Steve Jobs style: Clean, focused */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-light text-gray-900 mb-2">
                Your Deals
              </h1>
              <p className="text-gray-500 text-lg">
                {pipelineConfig ? `${dealStages.length}-stage pipeline` : 'Simple deal management. No complexity.'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild className="px-6 py-6 text-lg rounded-xl">
                <Link href="/crm-progressive/deals/dashboard">
                  <Settings className="w-5 h-5 mr-2" />
                  Configure Pipeline
                </Link>
              </Button>
              <Button 
                onClick={() => setShowNewDeal(true)}
                className="bg-black text-white hover:bg-gray-800 px-8 py-6 text-lg rounded-xl shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Deal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats - Essential metrics only */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="text-3xl font-light text-gray-900 mb-1">
              ${totalValue.toLocaleString()}
            </div>
            <div className="text-gray-500">Total Pipeline</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-light text-gray-900 mb-1">
              {activeDeals}
            </div>
            <div className="text-gray-500">Active Deals</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-light text-green-600 mb-1">
              ${wonValue.toLocaleString()}
            </div>
            <div className="text-gray-500">Won This Month</div>
          </div>
        </div>

        {/* Pipeline - Visual, intuitive */}
        <div className={`grid gap-8`} style={{ gridTemplateColumns: `repeat(${dealStages.length}, minmax(0, 1fr))` }}>
          {dealStages.map((stage) => {
            const stageDeals = deals.filter(deal => deal.stage === stage.id)
            
            return (
              <div key={stage.id} className="space-y-6">
                {/* Stage Header */}
                <div className="text-center">
                  <div className={`w-16 h-16 ${stage.color} rounded-full mx-auto mb-4 flex items-center justify-center text-white`}>
                    {stage.icon}
                  </div>
                  <h2 className="text-xl font-medium text-gray-900 mb-1">
                    {stage.name}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {stage.description}
                  </p>
                  <div className="mt-2 text-sm text-gray-400">
                    {stageDeals.length} deals • ${stageDeals.reduce((sum, deal) => sum + deal.value, 0).toLocaleString()}
                  </div>
                </div>

                {/* Deal Cards */}
                <div className="space-y-4">
                  <AnimatePresence>
                    {stageDeals.map((deal) => (
                      <motion.div
                        key={deal.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900 text-lg">
                                {deal.company}
                              </h3>
                              <p className="text-gray-500 text-sm">
                                {deal.contact}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-light text-gray-900">
                                ${deal.value.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-400">
                                {deal.daysInStage} days in stage
                              </div>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                            <strong>Next:</strong> {deal.nextAction}
                          </div>

                          {/* Stage Actions */}
                          <div className="flex gap-2">
                            {stage.id === 'interested' && (
                              <Button
                                size="sm"
                                onClick={() => moveDeal(deal.id, 'proposal')}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                Send Proposal
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            )}
                            {stage.id === 'proposal' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => moveDeal(deal.id, 'interested')}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  Back to Interested
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => moveDeal(deal.id, 'won')}
                                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Won!
                                </Button>
                              </>
                            )}
                            {stage.id === 'won' && (
                              <div className="flex-1 text-center text-green-600 font-medium">
                                🎉 Deal Complete!
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* New Deal Modal - Simplified form */}
      <AnimatePresence>
        {showNewDeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50"
            onClick={() => setShowNewDeal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-6 text-center">
                New Deal
              </h2>
              
              <div className="space-y-6">
                <div>
                  <Input
                    placeholder="Company name"
                    value={newDeal.company}
                    onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
                    className="h-14 text-lg border-gray-200 rounded-xl"
                  />
                </div>
                
                <div>
                  <Input
                    placeholder="Contact person"
                    value={newDeal.contact}
                    onChange={(e) => setNewDeal({ ...newDeal, contact: e.target.value })}
                    className="h-14 text-lg border-gray-200 rounded-xl"
                  />
                </div>
                
                <div>
                  <Input
                    placeholder="Deal value ($)"
                    type="number"
                    value={newDeal.value}
                    onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                    className="h-14 text-lg border-gray-200 rounded-xl"
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewDeal(false)}
                    className="flex-1 h-14 text-lg rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateDeal}
                    className="flex-1 h-14 text-lg bg-black hover:bg-gray-800 text-white rounded-xl"
                  >
                    Create Deal
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </CRMLayout>
  )
}