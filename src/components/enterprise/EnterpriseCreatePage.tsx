'use client'

/**
 * Enterprise Create Page Template
 * Smart Code: HERA.ENTERPRISE.CREATE.TEMPLATE.v1
 * 
 * Reusable 3-section create page: Navigation, Form, AI Assistance
 */

import React, { useState } from 'react'
import { EnterpriseNavbar } from '@/components/sap/EnterpriseNavbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  X, 
  ChevronRight, 
  Lightbulb, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Bot,
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  Users
} from 'lucide-react'

export interface CreatePageSection {
  id: string
  title: string
  icon?: React.ComponentType<{ className?: string }>
  isComplete?: boolean
  isRequired?: boolean
  badge?: string
}

export interface AIInsight {
  id: string
  type: 'suggestion' | 'warning' | 'tip' | 'automation'
  title: string
  content: string
  action?: {
    label: string
    onClick: () => void
  }
}

export interface EnterpriseCreatePageProps {
  title: string
  subtitle?: string
  breadcrumb: string
  
  // Left Navigation
  sections: CreatePageSection[]
  currentSection: string
  onSectionChange: (sectionId: string) => void
  
  // Main Form Content
  children: React.ReactNode
  
  // Form Actions
  onSave: () => void
  onCancel: () => void
  onSaveAndContinue?: () => void
  isSaving?: boolean
  saveLabel?: string
  
  // Right AI Panel
  aiInsights?: AIInsight[]
  aiSuggestions?: string[]
  showAIPanel?: boolean
  
  // Progress
  completionPercentage?: number
  estimatedTime?: string
  
  // Validation
  hasErrors?: boolean
  errorCount?: number
}

function NavigationSection({ 
  sections, 
  currentSection, 
  onSectionChange,
  completionPercentage = 0,
  estimatedTime
}: {
  sections: CreatePageSection[]
  currentSection: string
  onSectionChange: (sectionId: string) => void
  completionPercentage?: number
  estimatedTime?: string
}) {
  const completedSections = sections.filter(s => s.isComplete).length
  
  return (
    <div className="h-full flex flex-col">
      {/* Progress Overview */}
      <div className="p-6 border-b border-gray-200">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {completedSections} of {sections.length} completed
          </span>
          {estimatedTime && (
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="w-3 h-3" />
              {estimatedTime}
            </div>
          )}
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = section.id === currentSection
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {/* Section Icon */}
                {Icon && (
                  <div className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                )}
                
                {/* Section Title */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{section.title}</span>
                    {section.isRequired && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                  </div>
                  {section.badge && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {section.badge}
                    </Badge>
                  )}
                </div>
                
                {/* Completion Status */}
                <div className="flex-shrink-0">
                  {section.isComplete ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <ChevronRight className={`w-4 h-4 transition-transform ${
                      isActive ? 'rotate-90 text-blue-600' : 'text-gray-400'
                    }`} />
                  )}
                </div>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

function AIAssistancePanel({ 
  insights = [], 
  suggestions = [] 
}: { 
  insights?: AIInsight[]
  suggestions?: string[]
}) {
  const [activeTab, setActiveTab] = useState<'insights' | 'suggestions'>('insights')
  
  return (
    <div className="h-full flex flex-col">
      {/* AI Panel Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bot className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-600">Smart suggestions and insights</p>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'insights', label: 'Insights', count: insights.length },
            { id: 'suggestions', label: 'Tips', count: suggestions.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* AI Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'insights' && (
          <>
            {insights.length > 0 ? (
              insights.map((insight) => (
                <Card key={insight.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded ${
                        insight.type === 'suggestion' ? 'bg-blue-100 text-blue-600' :
                        insight.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                        insight.type === 'tip' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {insight.type === 'suggestion' && <Lightbulb className="w-4 h-4" />}
                        {insight.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                        {insight.type === 'tip' && <CheckCircle className="w-4 h-4" />}
                        {insight.type === 'automation' && <Zap className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {insight.content}
                        </p>
                        {insight.action && (
                          <Button 
                            onClick={insight.action.onClick}
                            size="sm" 
                            variant="outline"
                            className="text-xs"
                          >
                            {insight.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No insights available yet</p>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'suggestions' && (
          <>
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">{suggestion}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No suggestions available</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function EnterpriseCreatePage({
  title,
  subtitle,
  breadcrumb,
  sections,
  currentSection,
  onSectionChange,
  children,
  onSave,
  onCancel,
  onSaveAndContinue,
  isSaving = false,
  saveLabel = 'Save',
  aiInsights = [],
  aiSuggestions = [],
  showAIPanel = true,
  completionPercentage = 0,
  estimatedTime,
  hasErrors = false,
  errorCount = 0
}: EnterpriseCreatePageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnterpriseNavbar 
        title="HERA" 
        breadcrumb={breadcrumb}
        showBack={true}
        onBack={onCancel}
      />
      
      {/* Main Content */}
      <div className="pt-12 h-screen flex">
        {/* Left Navigation Panel */}
        <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
          <NavigationSection
            sections={sections}
            currentSection={currentSection}
            onSectionChange={onSectionChange}
            completionPercentage={completionPercentage}
            estimatedTime={estimatedTime}
          />
        </div>

        {/* Main Form Area */}
        <div className={`flex-1 flex flex-col ${showAIPanel ? 'max-w-none' : ''}`}>
          {/* Form Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-gray-600 mt-1">{subtitle}</p>
                )}
                {hasErrors && (
                  <div className="flex items-center gap-2 mt-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">
                      {errorCount} {errorCount === 1 ? 'error' : 'errors'} need attention
                    </span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="px-6"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                
                {onSaveAndContinue && (
                  <Button 
                    onClick={onSaveAndContinue}
                    disabled={isSaving}
                    className="px-6"
                    variant="outline"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save & Continue
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  onClick={onSave}
                  disabled={isSaving}
                  className="px-6"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {saveLabel}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {children}
          </div>
        </div>

        {/* Right AI Panel */}
        {showAIPanel && (
          <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0">
            <AIAssistancePanel 
              insights={aiInsights}
              suggestions={aiSuggestions}
            />
          </div>
        )}
      </div>
    </div>
  )
}