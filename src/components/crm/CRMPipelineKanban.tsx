'use client'

import React from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { 
  MoreHorizontal, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Plus,
  Filter,
  Target
} from 'lucide-react'
import { MobileButton } from '@/components/mobile'

export interface CRMOpportunity {
  id: string
  entity_name: string
  amount: number
  currency: string
  probability: number
  close_date: string
  account_name?: string
  contact_name?: string
  owner_name?: string
  stage: string
  source?: string
  next_step?: string
  last_activity_date?: string
}

export interface CRMPipelineStage {
  id: string
  name: string
  probability: number
  color: string
  order: number
  opportunities: CRMOpportunity[]
}

export interface CRMPipelineKanbanProps {
  stages: CRMPipelineStage[]
  onOpportunityMove: (opportunityId: string, fromStage: string, toStage: string) => void
  onOpportunityClick: (opportunity: CRMOpportunity) => void
  onAddOpportunity: (stageId: string) => void
  onStageSettingsClick?: (stage: CRMPipelineStage) => void
  loading?: boolean
  className?: string
}

export function CRMPipelineKanban({
  stages,
  onOpportunityMove,
  onOpportunityClick,
  onAddOpportunity,
  onStageSettingsClick,
  loading = false,
  className = ''
}: CRMPipelineKanbanProps) {
  const [isDragging, setIsDragging] = React.useState(false)

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false)
    
    if (!result.destination) return

    const sourceStageId = result.source.droppableId
    const destinationStageId = result.destination.droppableId
    const opportunityId = result.draggableId

    if (sourceStageId !== destinationStageId) {
      onOpportunityMove(opportunityId, sourceStageId, destinationStageId)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStageTotal = (stage: CRMPipelineStage) => {
    return stage.opportunities.reduce((total, opp) => total + opp.amount, 0)
  }

  const getWeightedTotal = (stage: CRMPipelineStage) => {
    return stage.opportunities.reduce((total, opp) => total + (opp.amount * opp.probability / 100), 0)
  }

  const isCloseDateOverdue = (closeDate: string) => {
    return new Date(closeDate) < new Date()
  }

  const isCloseDateSoon = (closeDate: string) => {
    const today = new Date()
    const close = new Date(closeDate)
    const diffDays = Math.ceil((close.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return diffDays <= 7 && diffDays > 0
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-80">
              <div className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-32 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Total Pipeline</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stages.reduce((total, stage) => total + getStageTotal(stage), 0))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Weighted Pipeline</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stages.reduce((total, stage) => total + getWeightedTotal(stage), 0))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Total Opportunities</div>
          <div className="text-2xl font-bold text-blue-600">
            {stages.reduce((total, stage) => total + stage.opportunities.length, 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Avg Deal Size</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(
              stages.reduce((total, stage) => total + getStageTotal(stage), 0) /
              Math.max(stages.reduce((total, stage) => total + stage.opportunities.length, 0), 1)
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
          {stages.map((stage) => (
            <div key={stage.id} className="flex-shrink-0 w-80">
              {/* Stage Header */}
              <div 
                className="mb-4 p-4 rounded-lg border-2 border-gray-200 bg-white"
                style={{ borderTopColor: stage.color }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                    <span className="text-sm text-gray-500">({stage.opportunities.length})</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <MobileButton
                      variant="ghost"
                      size="small"
                      onClick={() => onAddOpportunity(stage.id)}
                      icon={<Plus className="w-4 h-4" />}
                      className="p-1 min-h-[32px]"
                    />
                    {onStageSettingsClick && (
                      <MobileButton
                        variant="ghost"
                        size="small"
                        onClick={() => onStageSettingsClick(stage)}
                        icon={<MoreHorizontal className="w-4 h-4" />}
                        className="p-1 min-h-[32px]"
                      />
                    )}
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{formatCurrency(getStageTotal(stage))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weighted:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(getWeightedTotal(stage))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Opportunities List */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      space-y-3 min-h-[400px] p-2 rounded-lg transition-colors
                      ${snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : ''}
                    `}
                  >
                    {stage.opportunities.map((opportunity, index) => (
                      <Draggable
                        key={opportunity.id}
                        draggableId={opportunity.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              bg-white rounded-lg border border-gray-200 p-4 shadow-sm 
                              hover:shadow-md transition-all duration-200 cursor-pointer
                              ${snapshot.isDragging ? 'shadow-lg rotate-3 bg-blue-50' : ''}
                            `}
                            onClick={() => onOpportunityClick(opportunity)}
                          >
                            {/* Opportunity Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {opportunity.entity_name}
                                </h4>
                                {opportunity.account_name && (
                                  <p className="text-sm text-gray-600 truncate">
                                    {opportunity.account_name}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle opportunity menu
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>

                            {/* Amount and Probability */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-gray-900">
                                  {formatCurrency(opportunity.amount, opportunity.currency)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-600">
                                  {opportunity.probability}%
                                </span>
                              </div>
                            </div>

                            {/* Close Date */}
                            <div className="flex items-center gap-1 mb-3">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span 
                                className={`text-sm ${
                                  isCloseDateOverdue(opportunity.close_date) 
                                    ? 'text-red-600 font-medium' 
                                    : isCloseDateSoon(opportunity.close_date)
                                    ? 'text-orange-600 font-medium'
                                    : 'text-gray-600'
                                }`}
                              >
                                {new Date(opportunity.close_date).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Contact/Owner */}
                            {opportunity.contact_name && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                                <User className="w-4 h-4" />
                                <span className="truncate">{opportunity.contact_name}</span>
                              </div>
                            )}

                            {/* Next Step */}
                            {opportunity.next_step && (
                              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-2">
                                <strong>Next:</strong> {opportunity.next_step}
                              </div>
                            )}

                            {/* Quick Actions */}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle call action
                                }}
                                className="p-1.5 hover:bg-green-100 rounded text-green-600"
                                title="Call"
                              >
                                <Phone className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle email action
                                }}
                                className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                                title="Email"
                              >
                                <Mail className="w-3 h-3" />
                              </button>
                              <div className="flex-1" />
                              {opportunity.owner_name && (
                                <span className="text-xs text-gray-500 truncate">
                                  {opportunity.owner_name}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {/* Add Opportunity Button */}
                    {stage.opportunities.length === 0 && (
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => onAddOpportunity(stage.id)}
                      >
                        <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Add your first opportunity</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

// Mobile-optimized compact version
export function CRMPipelineMobile({
  stages,
  onOpportunityClick,
  onAddOpportunity,
  className = ''
}: Pick<CRMPipelineKanbanProps, 'stages' | 'onOpportunityClick' | 'onAddOpportunity' | 'className'>) {
  const [selectedStage, setSelectedStage] = React.useState(stages[0]?.id || '')

  const currentStage = stages.find(s => s.id === selectedStage)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Stage Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name} ({stage.opportunities.length})
            </option>
          ))}
        </select>
      </div>

      {/* Stage Opportunities */}
      {currentStage && (
        <div className="space-y-3">
          {currentStage.opportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onOpportunityClick(opportunity)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 truncate flex-1">
                  {opportunity.entity_name}
                </h4>
                <span className="text-lg font-semibold text-green-600 ml-2">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: opportunity.currency,
                    minimumFractionDigits: 0
                  }).format(opportunity.amount)}
                </span>
              </div>
              
              {opportunity.account_name && (
                <p className="text-sm text-gray-600 mb-2">{opportunity.account_name}</p>
              )}
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{opportunity.probability}% probability</span>
                <span>{new Date(opportunity.close_date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          
          {currentStage.opportunities.length === 0 && (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
              onClick={() => onAddOpportunity(currentStage.id)}
            >
              <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Add your first opportunity</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}