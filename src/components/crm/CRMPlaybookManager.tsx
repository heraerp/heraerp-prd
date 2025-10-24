'use client'

import React, { useState } from 'react'
import { 
  Zap, 
  Plus, 
  Filter, 
  Search, 
  MoreHorizontal,
  Play,
  Pause,
  Edit3,
  Trash2,
  Copy,
  Eye,
  Activity,
  Target,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react'
import { MobileButton, MobileInput, MobileSelect, MobileModal, MobileSwitch } from '@/components/mobile'
import { useCRMClient } from '@/hooks/useCRM'
import { useCRMPlaybooks, type CRMPlaybook } from '@/lib/crm/playbooks'

export interface CRMPlaybookManagerProps {
  className?: string
}

type PlaybookFilter = 'all' | 'enabled' | 'disabled' | 'high-usage' | 'recent'

export function CRMPlaybookManager({ className = '' }: CRMPlaybookManagerProps) {
  const [filter, setFilter] = useState<PlaybookFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlaybooks, setSelectedPlaybooks] = useState<string[]>([])
  const [showNewPlaybookForm, setShowNewPlaybookForm] = useState(false)
  const [showPlaybookDetails, setShowPlaybookDetails] = useState<CRMPlaybook | null>(null)

  // Hooks
  const crmClient = useCRMClient()
  const { playbooks, stats, enablePlaybook, disablePlaybook } = useCRMPlaybooks(crmClient)

  // Filter playbooks
  const filteredPlaybooks = playbooks.filter(playbook => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        playbook.name.toLowerCase().includes(query) ||
        playbook.description.toLowerCase().includes(query) ||
        playbook.entity_type.toLowerCase().includes(query)
      
      if (!matchesSearch) return false
    }

    // Status filter
    switch (filter) {
      case 'enabled':
        return playbook.enabled
      case 'disabled':
        return !playbook.enabled
      case 'high-usage':
        return playbook.execution_count > 10
      case 'recent':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return playbook.last_executed && new Date(playbook.last_executed) > weekAgo
      default:
        return true
    }
  }).sort((a, b) => b.execution_count - a.execution_count)

  const handleTogglePlaybook = async (playbook: CRMPlaybook) => {
    try {
      if (playbook.enabled) {
        await disablePlaybook(playbook.id)
      } else {
        await enablePlaybook(playbook.id)
      }
    } catch (error) {
      console.error('Failed to toggle playbook:', error)
    }
  }

  const handleSelectPlaybook = (playbookId: string) => {
    setSelectedPlaybooks(prev => 
      prev.includes(playbookId) 
        ? prev.filter(id => id !== playbookId)
        : [...prev, playbookId]
    )
  }

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'entity_created':
        return <Plus className="w-4 h-4 text-green-600" />
      case 'entity_updated':
      case 'field_changed':
        return <Edit3 className="w-4 h-4 text-blue-600" />
      case 'stage_changed':
        return <ArrowRight className="w-4 h-4 text-purple-600" />
      case 'time_based':
        return <Clock className="w-4 h-4 text-orange-600" />
      case 'score_threshold':
        return <Target className="w-4 h-4 text-red-600" />
      default:
        return <Zap className="w-4 h-4 text-gray-600" />
    }
  }

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      'entity_created': 'Entity Created',
      'entity_updated': 'Entity Updated',
      'field_changed': 'Field Changed',
      'stage_changed': 'Stage Changed',
      'time_based': 'Time Based',
      'score_threshold': 'Score Threshold',
      'relationship_created': 'Relationship Created'
    }
    return labels[trigger] || trigger
  }

  const getEntityTypeColor = (entityType: string) => {
    const colors: Record<string, string> = {
      'LEAD': 'bg-orange-100 text-orange-800',
      'ACCOUNT': 'bg-blue-100 text-blue-800',
      'CONTACT': 'bg-green-100 text-green-800',
      'OPPORTUNITY': 'bg-purple-100 text-purple-800',
      'ACTIVITY': 'bg-cyan-100 text-cyan-800',
      'TASK': 'bg-red-100 text-red-800'
    }
    return colors[entityType] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Playbooks</h1>
              <p className="text-gray-600">Automate your CRM workflows</p>
            </div>
          </div>

          <MobileButton
            onClick={() => setShowNewPlaybookForm(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Playbook
          </MobileButton>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Total Playbooks</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Active</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.enabled}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Total Executions</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalExecutions}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Most Active</span>
            </div>
            <div className="text-sm font-medium text-purple-600 truncate">
              {stats.mostActivePlaybook?.name || 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <MobileInput
              placeholder="Search playbooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <MobileSelect
              value={filter}
              onChange={(e) => setFilter(e.target.value as PlaybookFilter)}
              className="w-full sm:w-32"
            >
              <option value="all">All</option>
              <option value="enabled">Active</option>
              <option value="disabled">Inactive</option>
              <option value="high-usage">High Usage</option>
              <option value="recent">Recent</option>
            </MobileSelect>

            <div className="flex gap-2">
              <MobileButton
                variant="outline"
                size="small"
                icon={<Filter className="w-4 h-4" />}
              >
                Filter
              </MobileButton>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPlaybooks.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {selectedPlaybooks.length} playbook{selectedPlaybooks.length > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <MobileButton
                size="small"
                variant="outline"
                icon={<Play className="w-4 h-4" />}
              >
                Enable
              </MobileButton>
              <MobileButton
                size="small"
                variant="outline"
                icon={<Pause className="w-4 h-4" />}
              >
                Disable
              </MobileButton>
              <MobileButton
                size="small"
                variant="outline"
                icon={<Trash2 className="w-4 h-4" />}
                className="text-red-600 hover:bg-red-50"
              >
                Delete
              </MobileButton>
            </div>
          </div>
        )}
      </div>

      {/* Playbooks List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredPlaybooks.length === 0 ? (
          <div className="p-8 text-center">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No playbooks found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filter !== 'all' 
                ? 'No playbooks match your current filters'
                : 'Start by creating your first automation playbook'
              }
            </p>
            {(!searchQuery && filter === 'all') && (
              <MobileButton
                onClick={() => setShowNewPlaybookForm(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Create First Playbook
              </MobileButton>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPlaybooks.map((playbook) => (
              <div key={playbook.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedPlaybooks.includes(playbook.id)}
                    onChange={() => handleSelectPlaybook(playbook.id)}
                    className="mt-1 rounded"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {playbook.name}
                          </h3>
                          <MobileSwitch
                            checked={playbook.enabled}
                            onChange={() => handleTogglePlaybook(playbook)}
                            size="small"
                          />
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{playbook.description}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <MobileButton
                          size="small"
                          variant="ghost"
                          onClick={() => setShowPlaybookDetails(playbook)}
                          icon={<Eye className="w-4 h-4" />}
                        />
                        <MobileButton
                          size="small"
                          variant="ghost"
                          icon={<MoreHorizontal className="w-4 h-4" />}
                        />
                      </div>
                    </div>

                    {/* Playbook Details */}
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      {/* Trigger */}
                      <div className="flex items-center gap-2">
                        {getTriggerIcon(playbook.trigger)}
                        <span className="text-sm text-gray-600">
                          {getTriggerLabel(playbook.trigger)}
                        </span>
                      </div>

                      {/* Entity Type */}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEntityTypeColor(playbook.entity_type)}`}>
                        {playbook.entity_type}
                      </span>

                      {/* Priority */}
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          Priority {playbook.priority}
                        </span>
                      </div>

                      {/* Actions Count */}
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {playbook.actions.length} action{playbook.actions.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Execution Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>Executed {playbook.execution_count} times</span>
                      </div>
                      
                      {playbook.last_executed && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Last: {new Date(playbook.last_executed).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>by {playbook.created_by}</span>
                      </div>
                    </div>

                    {/* Conditions Preview */}
                    {playbook.conditions.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs font-medium text-gray-700 mb-2">
                          Conditions ({playbook.conditions.length}):
                        </div>
                        <div className="space-y-1">
                          {playbook.conditions.slice(0, 3).map((condition, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              {condition.field} {condition.operator} {JSON.stringify(condition.value)}
                            </div>
                          ))}
                          {playbook.conditions.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{playbook.conditions.length - 3} more...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Playbook Details Modal */}
      <MobileModal
        isOpen={!!showPlaybookDetails}
        onClose={() => setShowPlaybookDetails(null)}
        title="Playbook Details"
        size="large"
      >
        {showPlaybookDetails && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {getTriggerIcon(showPlaybookDetails.trigger)}
                  <h2 className="text-xl font-semibold text-gray-900">
                    {showPlaybookDetails.name}
                  </h2>
                </div>
                <MobileSwitch
                  checked={showPlaybookDetails.enabled}
                  onChange={() => handleTogglePlaybook(showPlaybookDetails)}
                />
              </div>
              <p className="text-gray-600">{showPlaybookDetails.description}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {showPlaybookDetails.execution_count}
                </div>
                <div className="text-sm text-gray-600">Executions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {showPlaybookDetails.priority}
                </div>
                <div className="text-sm text-gray-600">Priority</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {showPlaybookDetails.actions.length}
                </div>
                <div className="text-sm text-gray-600">Actions</div>
              </div>
            </div>

            {/* Trigger & Entity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Trigger</div>
                <div className="flex items-center gap-2">
                  {getTriggerIcon(showPlaybookDetails.trigger)}
                  <span className="text-sm text-gray-900">
                    {getTriggerLabel(showPlaybookDetails.trigger)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Entity Type</div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEntityTypeColor(showPlaybookDetails.entity_type)}`}>
                  {showPlaybookDetails.entity_type}
                </span>
              </div>
            </div>

            {/* Conditions */}
            {showPlaybookDetails.conditions.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Conditions ({showPlaybookDetails.conditions.length})
                </div>
                <div className="space-y-2">
                  {showPlaybookDetails.conditions.map((condition, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium">{condition.field}</span>
                        <span className="mx-2 text-gray-500">{condition.operator}</span>
                        <span className="font-medium">{JSON.stringify(condition.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">
                Actions ({showPlaybookDetails.actions.length})
              </div>
              <div className="space-y-3">
                {showPlaybookDetails.actions.map((action, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 rounded">
                        <Zap className="w-3 h-3 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-blue-900 capitalize">
                          {action.type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-blue-700 mt-1">
                          {Object.entries(action.config).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                            </div>
                          ))}
                        </div>
                        {action.delay_minutes && (
                          <div className="text-xs text-blue-600 mt-2">
                            Delayed by {action.delay_minutes} minutes
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Created by {showPlaybookDetails.created_by} on{' '}
                {new Date(showPlaybookDetails.created_at).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <MobileButton size="small" variant="outline" icon={<Copy className="w-4 h-4" />}>
                  Duplicate
                </MobileButton>
                <MobileButton size="small" variant="outline" icon={<Edit3 className="w-4 h-4" />}>
                  Edit
                </MobileButton>
              </div>
            </div>
          </div>
        )}
      </MobileModal>

      {/* New Playbook Form Modal */}
      <MobileModal
        isOpen={showNewPlaybookForm}
        onClose={() => setShowNewPlaybookForm(false)}
        title="Create New Playbook"
        size="large"
      >
        <div className="p-6 text-center">
          <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Playbook Builder</h3>
          <p className="text-gray-600">
            Advanced playbook builder will be implemented here
          </p>
        </div>
      </MobileModal>
    </div>
  )
}