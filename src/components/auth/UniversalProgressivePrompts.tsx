'use client'

import React, { useState } from 'react'
import { useUniversalProgressive } from '@/components/auth/UniversalProgressiveProvider'
import { useUniversalProgressiveData } from '@/hooks/use-universal-progressive-data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Save, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Database,
  Zap,
  TrendingUp,
  Shield
} from 'lucide-react'

// Universal Data Status Indicator
export function UniversalDataStatusIndicator() {
  const { moduleConfig } = useUniversalProgressive()
  const { stats, lastSaved, hasUnsavedChanges, exportModuleData } = useUniversalProgressiveData({
    key: moduleConfig.name,
    initialData: {}
  })

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        {/* Save Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-1">
              {hasUnsavedChanges ? (
                <Clock className="w-4 h-4 text-yellow-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span className="text-xs text-gray-600">
                {lastSaved ? new Date(lastSaved).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div>
              <p className="font-medium">
                {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
              </p>
              {lastSaved && (
                <p className="text-xs text-gray-500">
                  Last saved: {new Date(lastSaved).toLocaleString()}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Data Stats */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs">
              <Database className="w-3 h-3 mr-1" />
              {stats.recordCount} records
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">Data Statistics</p>
              <p className="text-xs">Records: {stats.recordCount}</p>
              <p className="text-xs">Size: {(stats.totalSize / 1024).toFixed(1)}KB</p>
              <p className="text-xs">Backups: {stats.backupCount}</p>
              <p className="text-xs">Interactions: {stats.interactions}</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Export Button */}
        <Button 
          onClick={exportModuleData}
          variant="outline" 
          size="sm"
          className="text-xs"
        >
          <Download className="w-3 h-3 mr-1" />
          Export
        </Button>
      </div>
    </TooltipProvider>
  )
}

// Universal Save Prompt for unsaved changes
export function UniversalSavePrompt() {
  const { moduleConfig, progressiveAuth } = useUniversalProgressive()
  const { hasUnsavedChanges, saveData, data } = useUniversalProgressiveData({
    key: moduleConfig.name,
    initialData: {}
  })

  const [isVisible, setIsVisible] = useState(true)

  if (!hasUnsavedChanges || !isVisible) {
    return null
  }

  const handleSave = () => {
    if (data) {
      saveData(data)
      setIsVisible(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">Unsaved Changes</h4>
          <p className="text-sm text-gray-600 mt-1">
            You have unsaved changes in your {moduleConfig.name} data.
          </p>
          <div className="flex items-center space-x-2 mt-3">
            <Button onClick={handleSave} size="sm">
              <Save className="w-3 h-3 mr-1" />
              Save Now
            </Button>
            <Button 
              onClick={() => setIsVisible(false)} 
              variant="ghost" 
              size="sm"
            >
              Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Universal Upgrade Prompt based on usage
export function UniversalUpgradePrompt() {
  const { moduleConfig, progressiveAuth } = useUniversalProgressive()
  const { stats } = useUniversalProgressiveData({
    key: moduleConfig.name,
    initialData: {}
  })

  const [isDismissed, setIsDismissed] = useState(false)

  // Show upgrade prompt if:
  // - User is anonymous
  // - Has significant data/interactions
  // - Not dismissed
  const shouldShow = progressiveAuth.isAnonymous && 
                    (stats.interactions > 10 || stats.recordCount > 5) && 
                    !isDismissed

  if (!shouldShow) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start space-x-3">
        <TrendingUp className="w-5 h-5 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium">You're Being Productive!</h4>
          <p className="text-sm text-blue-100 mt-1">
            You've created {stats.recordCount} records and made {stats.interactions} interactions. 
            Save your {moduleConfig.name} progress permanently!
          </p>
          <div className="flex items-center space-x-2 mt-3">
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Shield className="w-3 h-3 mr-1" />
              Save with Email
            </Button>
            <Button 
              onClick={() => setIsDismissed(true)} 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/20"
            >
              Not Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Universal Workspace Stats Component
export function UniversalWorkspaceStats() {
  const { moduleConfig, progressiveAuth } = useUniversalProgressive()
  const { stats, workspace } = useUniversalProgressiveData({
    key: moduleConfig.name,
    initialData: {}
  })

  if (!workspace) {
    return null
  }

  const workspaceAge = workspace.created_at ? 
    Math.ceil((new Date().getTime() - new Date(workspace.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-3">Workspace Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{workspaceAge}</div>
          <div className="text-xs text-gray-600">Days Active</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.recordCount}</div>
          <div className="text-xs text-gray-600">Records</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.interactions}</div>
          <div className="text-xs text-gray-600">Interactions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.backupCount}</div>
          <div className="text-xs text-gray-600">Backups</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              progressiveAuth.isRegistered ? 'bg-green-500' :
              progressiveAuth.isIdentified ? 'bg-yellow-500' :
              'bg-blue-500'
            }`} />
            <span className="text-sm text-gray-600">
              {progressiveAuth.isRegistered ? 'Registered' :
               progressiveAuth.isIdentified ? 'Email Verified' :
               'Anonymous'}
            </span>
          </div>
          
          {progressiveAuth.daysRemaining > 0 && (
            <Badge variant="outline" className="text-xs">
              {progressiveAuth.daysRemaining} days remaining
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}