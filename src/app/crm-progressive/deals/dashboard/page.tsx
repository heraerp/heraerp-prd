'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, Target, Zap, Trophy, CheckCircle, 
  Clock, AlertCircle, TrendingUp, Star, Award,
  ArrowRight, Save, RotateCcw, Sparkles, Users,
  Building, Rocket, Crown, Shield, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/components/auth/MultiOrgAuthProvider'
import { CRMLayout } from '@/components/layout/crm-layout'

// Types
interface Stage {
  id: string
  name: string
  color: string
  icon: React.JSX.Element
  description: string
}

interface PipelineTemplate {
  name: string
  description: string
  complexity: string
  recommended: string
  stages: Stage[]
}

interface PipelineConfig {
  template: string
  stages: Stage[]
  customStages: Stage[] | null
  organizationId: string
  updatedAt: string
}

// Pipeline Templates - Different complexities for different business needs
const PIPELINE_TEMPLATES = {
  simple: {
    name: 'Simple Pipeline',
    description: 'Steve Jobs style - Essential stages only',
    complexity: 'Beginner',
    recommended: 'Startups, Small Teams',
    stages: [
      { id: 'interested', name: 'Interested', color: 'bg-blue-500', icon: <Target className="w-4 h-4" />, description: 'They want to learn more' },
      { id: 'proposal', name: 'Proposal Sent', color: 'bg-orange-500', icon: <Clock className="w-4 h-4" />, description: 'Waiting for their decision' },
      { id: 'won', name: 'Deal Won', color: 'bg-green-500', icon: <Trophy className="w-4 h-4" />, description: 'Success! New customer' }
    ]
  },
  standard: {
    name: 'Standard Pipeline',
    description: 'Balanced approach with qualification',
    complexity: 'Intermediate',
    recommended: 'Growing Companies, Sales Teams',
    stages: [
      { id: 'lead', name: 'Lead', color: 'bg-gray-500', icon: <Users className="w-4 h-4" />, description: 'Initial contact made' },
      { id: 'qualified', name: 'Qualified', color: 'bg-blue-500', icon: <CheckCircle className="w-4 h-4" />, description: 'Meets our criteria' },
      { id: 'proposal', name: 'Proposal', color: 'bg-orange-500', icon: <Clock className="w-4 h-4" />, description: 'Proposal submitted' },
      { id: 'won', name: 'Won', color: 'bg-green-500', icon: <Trophy className="w-4 h-4" />, description: 'Deal closed successfully' }
    ]
  },
  enterprise: {
    name: 'Enterprise Pipeline',
    description: 'Comprehensive tracking for complex sales',
    complexity: 'Advanced',
    recommended: 'Large Companies, Enterprise Sales',
    stages: [
      { id: 'lead', name: 'Lead', color: 'bg-gray-500', icon: <Users className="w-4 h-4" />, description: 'Initial contact made' },
      { id: 'qualified', name: 'Qualified', color: 'bg-blue-500', icon: <CheckCircle className="w-4 h-4" />, description: 'Meets criteria & budget' },
      { id: 'discovery', name: 'Discovery', color: 'bg-purple-500', icon: <AlertCircle className="w-4 h-4" />, description: 'Understanding needs' },
      { id: 'proposal', name: 'Proposal', color: 'bg-orange-500', icon: <Clock className="w-4 h-4" />, description: 'Formal proposal sent' },
      { id: 'won', name: 'Won', color: 'bg-green-500', icon: <Trophy className="w-4 h-4" />, description: 'Deal closed & signed' }
    ]
  }
}

export default function DealDashboardPage() {
  const { workspace, isAnonymous } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof PIPELINE_TEMPLATES>('simple')
  const [customStages, setCustomStages] = useState<Stage[]>([])
  const [showCustom, setShowCustom] = useState(false)
  const [currentConfig, setCurrentConfig] = useState<PipelineConfig | null>(null)

  useEffect(() => {
    setMounted(true)
    loadCurrentConfig()
  }, [])

  const loadCurrentConfig = async () => {
    // In real implementation, load from HERA API based on organization_id
    // For demo, use localStorage
    const saved = localStorage.getItem(`deal-config-${organization?.id || 'demo'}`)
    if (saved) {
      const config = JSON.parse(saved)
      setCurrentConfig(config)
      setSelectedTemplate(config.template)
      if (config.customStages) {
        setCustomStages(config.customStages)
        setShowCustom(true)
      }
    }
  }

  const saveConfiguration = async () => {
    const config = {
      template: selectedTemplate,
      stages: showCustom ? customStages : PIPELINE_TEMPLATES[selectedTemplate].stages,
      customStages: showCustom ? customStages : null,
      organizationId: organization?.id || 'demo',
      updatedAt: new Date().toISOString()
    }

    // In real implementation, save to HERA core_dynamic_data
    localStorage.setItem(`deal-config-${organization?.id || 'demo'}`, JSON.stringify(config))
    setCurrentConfig(config)
    
    // Show success message
    alert('Pipeline configuration saved successfully!')
  }

  const addCustomStage = () => {
    const newStage = {
      id: `custom_${Date.now()}`,
      name: 'New Stage',
      color: 'bg-gray-500',
      icon: <Target className="w-4 h-4" />,
      description: 'Custom stage description'
    }
    setCustomStages([...customStages, newStage])
  }

  const updateCustomStage = (index: number, field: keyof Stage, value: string) => {
    const updated = [...customStages]
    updated[index] = { ...updated[index], [field]: value }
    setCustomStages(updated)
  }

  const removeCustomStage = (index: number) => {
    setCustomStages(customStages.filter((_, i) => i !== index))
  }

  if (!mounted || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const currentTemplate: PipelineTemplate | null = showCustom ? null : PIPELINE_TEMPLATES[selectedTemplate]
  const stagesToShow = showCustom ? customStages : currentTemplate?.stages || []

  return (
    <CRMLayout>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-light text-gray-900 mb-2">
                  Deal Dashboard Configuration
                </h1>
                <p className="text-gray-600 text-lg">
                  Choose your perfect pipeline. From simple to enterprise-grade.
                </p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" asChild>
                  <Link href="/crm-progressive/deals">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Back to Deals
                  </Link>
                </Button>
                <Button onClick={saveConfiguration} className="bg-black text-white hover:bg-gray-800">
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Template Selection */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-6">Choose Your Pipeline Template</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {Object.entries(PIPELINE_TEMPLATES).map(([key, template]) => (
                    <motion.div
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedTemplate === key && !showCustom
                            ? 'ring-2 ring-black shadow-lg' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => {
                          setSelectedTemplate(key as keyof typeof PIPELINE_TEMPLATES)
                          setShowCustom(false)
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
                              {key === 'simple' && <Sparkles className="w-6 h-6" />}
                              {key === 'standard' && <Building className="w-6 h-6" />}
                              {key === 'enterprise' && <Crown className="w-6 h-6" />}
                            </div>
                            {selectedTemplate === key && !showCustom && (
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                          <p className="text-gray-600 mb-4 text-sm">{template.description}</p>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Complexity:</span>
                              <Badge variant={key === 'simple' ? 'default' : key === 'standard' ? 'secondary' : 'destructive'}>
                                {template.complexity}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              <strong>Best for:</strong> {template.recommended}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-700 mb-2">
                              {template.stages.length} Stages:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {template.stages.map((stage, index) => (
                                <div key={stage.id} className="flex items-center gap-1">
                                  <div className={`w-3 h-3 ${stage.color} rounded-full`}></div>
                                  <span className="text-xs text-gray-600">{stage.name}</span>
                                  {index < template.stages.length - 1 && (
                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Custom Pipeline Option */}
                <Card 
                  className={`cursor-pointer transition-all duration-200 ${
                    showCustom ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:shadow-md'
                  }`}
                  onClick={() => {
                    setShowCustom(true)
                    if (customStages.length === 0) {
                      setCustomStages([...PIPELINE_TEMPLATES.simple.stages])
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                          <Settings className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1">Custom Pipeline</h3>
                          <p className="text-gray-600 text-sm">Build your own pipeline from scratch</p>
                        </div>
                      </div>
                      {showCustom && <CheckCircle className="w-6 h-6 text-purple-500" />}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Custom Stage Builder */}
              <AnimatePresence>
                {showCustom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">Custom Stages</h3>
                      <Button onClick={addCustomStage} variant="outline">
                        <Target className="w-4 h-4 mr-2" />
                        Add Stage
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {customStages.map((stage, index) => (
                        <Card key={stage.id} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <Input
                              value={stage.name}
                              onChange={(e) => updateCustomStage(index, 'name', e.target.value)}
                              placeholder="Stage name"
                            />
                            <select
                              value={stage.color}
                              onChange={(e) => updateCustomStage(index, 'color', e.target.value)}
                              className="h-10 px-3 border border-gray-300 rounded-md"
                            >
                              <option value="bg-gray-500">Gray</option>
                              <option value="bg-blue-500">Blue</option>
                              <option value="bg-green-500">Green</option>
                              <option value="bg-orange-500">Orange</option>
                              <option value="bg-purple-500">Purple</option>
                              <option value="bg-red-500">Red</option>
                            </select>
                            <Input
                              value={stage.description}
                              onChange={(e) => updateCustomStage(index, 'description', e.target.value)}
                              placeholder="Description"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeCustomStage(index)}
                              disabled={customStages.length <= 2}
                            >
                              Remove
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Preview Panel */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Pipeline Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stagesToShow.map((stage, index) => (
                      <div key={stage.id} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 ${stage.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{stage.name}</div>
                            <div className="text-xs text-gray-500">{stage.description}</div>
                          </div>
                        </div>
                        {index < stagesToShow.length - 1 && (
                          <div className="ml-4 w-0.5 h-4 bg-gray-200"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex justify-between">
                        <span>Total Stages:</span>
                        <span className="font-medium">{stagesToShow.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Organization:</span>
                        <span className="font-medium">{organization?.name || 'Demo Org'}</span>
                      </div>
                      {currentConfig && (
                        <div className="flex justify-between">
                          <span>Last Updated:</span>
                          <span className="font-medium text-xs">
                            {new Date(currentConfig.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Status */}
              {currentConfig && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      Active Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">
                        <strong>Current Template:</strong> {
                          currentConfig.customStages 
                            ? 'Custom Pipeline' 
                            : PIPELINE_TEMPLATES[currentConfig.template]?.name
                        }
                      </p>
                      <p>
                        <strong>Stages:</strong> {currentConfig.stages.length} stages configured
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </CRMLayout>
  )
}