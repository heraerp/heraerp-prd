/**
 * HERA Universal Tile System - Tile Actions Menu
 * Permission-aware actions menu with confirmation dialogs and execution states
 * Smart Code: HERA.PLATFORM.UI.COMPONENT.TILE_ACTIONS.v1
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ResolvedTileConfig, ResolvedTileAction } from '@/lib/tiles/resolved-tile-config'
import { useTileActions, createConfirmationDialog } from '@/lib/tiles/use-tile-actions'
import { 
  MoreVertical, Play, Eye, Plus, Settings, Download, Upload,
  ExternalLink, MessageSquare, Edit, Trash2, Copy, Share,
  Clock, CheckCircle, XCircle, AlertTriangle, Loader2
} from 'lucide-react'

// ================================================================================
// TYPES
// ================================================================================

export interface TileActionsMenuProps {
  tile: ResolvedTileConfig
  organizationId: string
  actorUserId: string
  workspacePath?: string
  
  // Display options
  variant?: 'dropdown' | 'buttons' | 'compact'
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  maxActions?: number
  
  // Behavior
  autoClose?: boolean
  showExecutionState?: boolean
  
  // Event handlers
  onActionExecute?: (actionId: string, result: any) => void
  onActionStart?: (actionId: string) => void
  onActionComplete?: (actionId: string, result: any) => void
  onActionError?: (actionId: string, error: any) => void
}

interface ActionIconMap {
  [key: string]: React.ElementType
}

// ================================================================================
// ICON MAPPING
// ================================================================================

const ACTION_ICON_MAP: ActionIconMap = {
  Play, Eye, Plus, Settings, Download, Upload, ExternalLink,
  MessageSquare, Edit, Trash2, Copy, Share, Clock,
  CheckCircle, XCircle, AlertTriangle, Loader2,
  
  // Action-specific mappings
  'view': Eye,
  'create': Plus,
  'edit': Edit,
  'delete': Trash2,
  'settings': Settings,
  'download': Download,
  'upload': Upload,
  'share': Share,
  'copy': Copy,
  'external': ExternalLink,
  'message': MessageSquare,
  'play': Play,
  'default': Play
}

function getActionIcon(iconName: string): React.ElementType {
  return ACTION_ICON_MAP[iconName] || ACTION_ICON_MAP[iconName.toLowerCase()] || ACTION_ICON_MAP.default
}

// ================================================================================
// MAIN COMPONENT
// ================================================================================

export function TileActionsMenu({
  tile,
  organizationId,
  actorUserId,
  workspacePath,
  variant = 'dropdown',
  size = 'md',
  showLabels = true,
  maxActions,
  autoClose = true,
  showExecutionState = true,
  onActionExecute,
  onActionStart,
  onActionComplete,
  onActionError
}: TileActionsMenuProps) {
  
  const [isOpen, setIsOpen] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] = useState<any>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const {
    executeAction,
    isExecuting,
    lastExecution,
    confirmPendingAction,
    cancelPendingAction
  } = useTileActions({
    tileId: tile.tileId,
    organizationId,
    workspacePath,
    onActionComplete: (response) => {
      onActionComplete?.(response.actionId, response.result)
      onActionExecute?.(response.actionId, response.result)
      
      if (autoClose) {
        setIsOpen(false)
      }
    },
    onConfirmationRequired: (confirmation) => {
      setPendingConfirmation(confirmation)
    },
    onError: (error) => {
      onActionError?.(lastExecution?.actionId || 'unknown', error)
    }
  })

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleActionClick = async (action: ResolvedTileAction) => {
    try {
      onActionStart?.(action.actionId)
      await executeAction(action.actionId)
    } catch (error) {
      console.error(`Action ${action.actionId} failed:`, error)
    }
  }

  const handleConfirmation = async (confirmed: boolean) => {
    if (!pendingConfirmation) return
    
    try {
      if (confirmed) {
        await confirmPendingAction(pendingConfirmation.token)
      } else {
        cancelPendingAction()
      }
    } finally {
      setPendingConfirmation(null)
    }
  }

  // Filter and limit actions
  const visibleActions = maxActions 
    ? tile.actions.slice(0, maxActions)
    : tile.actions

  if (visibleActions.length === 0) {
    return null
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button (for dropdown variant) */}
      {variant === 'dropdown' && (
        <ActionsTrigger
          isOpen={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          size={size}
          isExecuting={isExecuting}
        />
      )}

      {/* Actions Display */}
      {variant === 'dropdown' && isOpen && (
        <ActionsDropdown
          actions={visibleActions}
          onActionClick={handleActionClick}
          isExecuting={isExecuting}
          lastExecution={lastExecution}
          showExecutionState={showExecutionState}
          size={size}
        />
      )}

      {variant === 'buttons' && (
        <ActionsButtons
          actions={visibleActions}
          onActionClick={handleActionClick}
          isExecuting={isExecuting}
          lastExecution={lastExecution}
          showLabels={showLabels}
          showExecutionState={showExecutionState}
          size={size}
        />
      )}

      {variant === 'compact' && (
        <ActionsCompact
          actions={visibleActions}
          onActionClick={handleActionClick}
          isExecuting={isExecuting}
          lastExecution={lastExecution}
          showLabels={showLabels}
          size={size}
        />
      )}

      {/* Confirmation Dialog */}
      {pendingConfirmation && (
        <ConfirmationDialog
          confirmation={pendingConfirmation}
          onConfirm={() => handleConfirmation(true)}
          onCancel={() => handleConfirmation(false)}
        />
      )}
    </div>
  )
}

// ================================================================================
// TRIGGER BUTTON
// ================================================================================

interface ActionsTriggerProps {
  isOpen: boolean
  onClick: () => void
  size: string
  isExecuting: boolean
}

function ActionsTrigger({ isOpen, onClick, size, isExecuting }: ActionsTriggerProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      disabled={isExecuting}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-gray-300",
        "bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2",
        "focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-colors duration-200",
        {
          'p-1.5': size === 'sm',
          'p-2': size === 'md', 
          'p-2.5': size === 'lg',
        },
        {
          'bg-gray-50 border-gray-400': isOpen,
        }
      )}
    >
      {isExecuting ? (
        <Loader2 className={cn("animate-spin", {
          'w-4 h-4': size === 'sm',
          'w-5 h-5': size === 'md',
          'w-6 h-6': size === 'lg',
        })} />
      ) : (
        <MoreVertical className={cn({
          'w-4 h-4': size === 'sm',
          'w-5 h-5': size === 'md',
          'w-6 h-6': size === 'lg',
        })} />
      )}
    </button>
  )
}

// ================================================================================
// DROPDOWN VARIANT
// ================================================================================

interface ActionsDropdownProps {
  actions: ResolvedTileAction[]
  onActionClick: (action: ResolvedTileAction) => void
  isExecuting: boolean
  lastExecution: any
  showExecutionState: boolean
  size: string
}

function ActionsDropdown({
  actions,
  onActionClick,
  isExecuting,
  lastExecution,
  showExecutionState,
  size
}: ActionsDropdownProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-10" />
      
      {/* Dropdown Menu */}
      <div className={cn(
        "absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200",
        "py-1 min-w-[200px] max-w-[300px]",
        {
          'top-6': size === 'sm',
          'top-8': size === 'md',
          'top-10': size === 'lg',
        }
      )}>
        {actions.map((action, index) => (
          <DropdownActionItem
            key={action.actionId}
            action={action}
            onClick={() => onActionClick(action)}
            isExecuting={isExecuting && lastExecution?.actionId === action.actionId}
            showExecutionState={showExecutionState}
            size={size}
            isLast={index === actions.length - 1}
          />
        ))}
      </div>
    </>
  )
}

function DropdownActionItem({
  action,
  onClick,
  isExecuting,
  showExecutionState,
  size,
  isLast
}: {
  action: ResolvedTileAction
  onClick: () => void
  isExecuting: boolean
  showExecutionState: boolean
  size: string
  isLast: boolean
}) {
  const ActionIcon = getActionIcon(action.icon)
  
  return (
    <button
      onClick={onClick}
      disabled={isExecuting}
      className={cn(
        "w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100",
        "disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3",
        "transition-colors duration-150",
        {
          'py-1.5': size === 'sm',
          'py-2': size === 'md',
          'py-2.5': size === 'lg',
        },
        {
          'border-b border-gray-100': !isLast && action.isPrimary,
        }
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className={cn(
          "flex items-center justify-center",
          {
            'w-4 h-4': size === 'sm',
            'w-5 h-5': size === 'md',
            'w-6 h-6': size === 'lg',
          }
        )}>
          {isExecuting && showExecutionState ? (
            <Loader2 className="animate-spin w-full h-full" />
          ) : (
            <ActionIcon className="w-full h-full" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{action.label}</div>
          {action.requiresConfirmation && (
            <div className="text-xs text-orange-600">Requires confirmation</div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {action.isPrimary && (
          <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
            Primary
          </span>
        )}
        
        {action.actionType === 'NAVIGATE' && (
          <ExternalLink className="w-3 h-3 text-gray-400" />
        )}
        
        {action.requiresPermission && (
          <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Permission required" />
        )}
      </div>
    </button>
  )
}

// ================================================================================
// BUTTONS VARIANT
// ================================================================================

interface ActionsButtonsProps {
  actions: ResolvedTileAction[]
  onActionClick: (action: ResolvedTileAction) => void
  isExecuting: boolean
  lastExecution: any
  showLabels: boolean
  showExecutionState: boolean
  size: string
}

function ActionsButtons({
  actions,
  onActionClick,
  isExecuting,
  lastExecution,
  showLabels,
  showExecutionState,
  size
}: ActionsButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(action => (
        <ActionButton
          key={action.actionId}
          action={action}
          onClick={() => onActionClick(action)}
          isExecuting={isExecuting && lastExecution?.actionId === action.actionId}
          showLabel={showLabels}
          showExecutionState={showExecutionState}
          size={size}
        />
      ))}
    </div>
  )
}

function ActionButton({
  action,
  onClick,
  isExecuting,
  showLabel,
  showExecutionState,
  size
}: {
  action: ResolvedTileAction
  onClick: () => void
  isExecuting: boolean
  showLabel: boolean
  showExecutionState: boolean
  size: string
}) {
  const ActionIcon = getActionIcon(action.icon)
  
  return (
    <button
      onClick={onClick}
      disabled={isExecuting}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border font-medium",
        "transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        {
          'px-2 py-1.5 text-xs': size === 'sm',
          'px-3 py-2 text-sm': size === 'md',
          'px-4 py-2.5 text-base': size === 'lg',
        },
        {
          'bg-blue-600 text-white border-blue-600 hover:bg-blue-700': action.isPrimary,
          'bg-white text-gray-700 border-gray-300 hover:bg-gray-50': !action.isPrimary,
        }
      )}
    >
      <div className={cn({
        'w-3 h-3': size === 'sm',
        'w-4 h-4': size === 'md',
        'w-5 h-5': size === 'lg',
      })}>
        {isExecuting && showExecutionState ? (
          <Loader2 className="animate-spin w-full h-full" />
        ) : (
          <ActionIcon className="w-full h-full" />
        )}
      </div>
      
      {showLabel && (
        <span className="truncate">{action.label}</span>
      )}
    </button>
  )
}

// ================================================================================
// COMPACT VARIANT
// ================================================================================

interface ActionsCompactProps {
  actions: ResolvedTileAction[]
  onActionClick: (action: ResolvedTileAction) => void
  isExecuting: boolean
  lastExecution: any
  showLabels: boolean
  size: string
}

function ActionsCompact({
  actions,
  onActionClick,
  isExecuting,
  lastExecution,
  showLabels,
  size
}: ActionsCompactProps) {
  const primaryActions = actions.filter(a => a.isPrimary).slice(0, 2)
  const remainingActions = actions.filter(a => !a.isPrimary || !primaryActions.includes(a))
  
  return (
    <div className="flex items-center gap-1">
      {/* Primary Actions */}
      {primaryActions.map(action => {
        const ActionIcon = getActionIcon(action.icon)
        const actionIsExecuting = isExecuting && lastExecution?.actionId === action.actionId
        
        return (
          <button
            key={action.actionId}
            onClick={() => onActionClick(action)}
            disabled={isExecuting}
            className={cn(
              "inline-flex items-center gap-1 rounded font-medium",
              "transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
              {
                'px-2 py-1 text-xs': size === 'sm',
                'px-2.5 py-1.5 text-sm': size === 'md',
                'px-3 py-2 text-sm': size === 'lg',
              },
              'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            <div className={cn({
              'w-3 h-3': size === 'sm',
              'w-4 h-4': size === 'md',
              'w-4 h-4': size === 'lg',
            })}>
              {actionIsExecuting ? (
                <Loader2 className="animate-spin w-full h-full" />
              ) : (
                <ActionIcon className="w-full h-full" />
              )}
            </div>
            
            {showLabels && (
              <span className="hidden sm:inline truncate">{action.label}</span>
            )}
          </button>
        )
      })}
      
      {/* More Actions Dropdown */}
      {remainingActions.length > 0 && (
        <TileActionsMenu
          tile={{ 
            ...({} as ResolvedTileConfig), 
            actions: remainingActions 
          }}
          organizationId=""
          actorUserId=""
          variant="dropdown"
          size={size}
        />
      )}
    </div>
  )
}

// ================================================================================
// CONFIRMATION DIALOG
// ================================================================================

interface ConfirmationDialogProps {
  confirmation: any
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmationDialog({ confirmation, onConfirm, onCancel }: ConfirmationDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel} />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="space-y-4">
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          
          {/* Content */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {confirmation.title}
            </h3>
            <p className="text-sm text-gray-600">
              {confirmation.message}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {confirmation.cancelText || 'Cancel'}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
            >
              {confirmation.confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export the component
export default TileActionsMenu