# Universal Workflow Integration System for HERA

## Overview

This document outlines a universal workflow system that integrates with all transactions across any HERA application, providing a reusable solution for status tracking, approval workflows, and business process management.

## 🎯 Core Architecture

### 1. **Universal Workflow Engine**

The workflow engine uses HERA's 6-table architecture without any schema changes:

```typescript
// Workflow stored as entities
{
  entity_type: 'workflow_template',
  entity_name: 'Universal Sales Workflow',
  entity_code: 'WF-SALES-001',
  smart_code: 'HERA.WORKFLOW.TEMPLATE.SALES.v1',
  metadata: {
    stages: ['draft', 'submitted', 'approved', 'processing', 'completed'],
    auto_transitions: true,
    notifications_enabled: true
  }
}

// Workflow statuses as entities
{
  entity_type: 'workflow_status',
  entity_name: 'Approved',
  entity_code: 'STATUS-APPROVED',
  smart_code: 'HERA.WORKFLOW.STATUS.APPROVED.v1',
  metadata: {
    color: '#10B981',
    icon: 'check-circle',
    next_statuses: ['processing', 'rejected']
  }
}
```

### 2. **Transaction-Workflow Relationship**

Every transaction can have a workflow status through relationships:

```typescript
// Link transaction to workflow status
{
  from_entity_id: transaction_id,
  to_entity_id: status_id,
  relationship_type: 'has_workflow_status',
  smart_code: 'HERA.WORKFLOW.ASSIGN.STATUS.v1',
  metadata: {
    assigned_at: new Date(),
    assigned_by: user_id,
    previous_status: previous_status_id,
    reason: 'Approved by manager'
  }
}
```

## 🚀 Universal Implementation

### 1. **Workflow Service (Reusable)**

Create a universal workflow service that any app can use:

```typescript
// src/lib/universal-workflow.ts

import { universalApi } from './universal-api'

export class UniversalWorkflow {
  private organizationId: string
  
  constructor(organizationId: string) {
    this.organizationId = organizationId
  }
  
  // Create workflow template
  async createWorkflowTemplate(config: {
    name: string
    code: string
    stages: WorkflowStage[]
    transitions: WorkflowTransition[]
    entityTypes?: string[] // Which entities can use this workflow
  }) {
    // Create workflow entity
    const workflow = await universalApi.createEntity({
      entity_type: 'workflow_template',
      entity_name: config.name,
      entity_code: config.code,
      smart_code: `HERA.WORKFLOW.TEMPLATE.${config.code}.v1`,
      organization_id: this.organizationId
    })
    
    // Create status entities for each stage
    for (const stage of config.stages) {
      const status = await universalApi.createEntity({
        entity_type: 'workflow_status',
        entity_name: stage.name,
        entity_code: `STATUS-${stage.code}`,
        smart_code: `HERA.WORKFLOW.STATUS.${stage.code}.v1`,
        organization_id: this.organizationId
      })
      
      // Link status to workflow
      await universalApi.createRelationship({
        from_entity_id: workflow.id,
        to_entity_id: status.id,
        relationship_type: 'has_stage',
        smart_code: 'HERA.WORKFLOW.STAGE.LINK.v1',
        metadata: {
          order: stage.order,
          is_initial: stage.isInitial,
          is_final: stage.isFinal
        }
      })
    }
    
    return workflow
  }
  
  // Assign workflow to transaction
  async assignWorkflow(transactionId: string, workflowTemplateId: string) {
    // Get initial status
    const initialStatus = await this.getInitialStatus(workflowTemplateId)
    
    // Create relationship
    await universalApi.createRelationship({
      from_entity_id: transactionId,
      to_entity_id: initialStatus.id,
      relationship_type: 'has_workflow_status',
      smart_code: 'HERA.WORKFLOW.ASSIGN.INITIAL.v1',
      metadata: {
        workflow_template_id: workflowTemplateId,
        started_at: new Date()
      }
    })
    
    return initialStatus
  }
  
  // Transition to next status
  async transitionStatus(
    transactionId: string, 
    newStatusId: string, 
    context: {
      reason?: string
      userId: string
      metadata?: any
    }
  ) {
    // Get current status
    const currentStatus = await this.getCurrentStatus(transactionId)
    
    // Validate transition
    const canTransition = await this.validateTransition(
      currentStatus.id, 
      newStatusId
    )
    
    if (!canTransition) {
      throw new Error('Invalid status transition')
    }
    
    // End current status relationship
    await this.endCurrentStatus(transactionId, currentStatus.id)
    
    // Create new status relationship
    await universalApi.createRelationship({
      from_entity_id: transactionId,
      to_entity_id: newStatusId,
      relationship_type: 'has_workflow_status',
      smart_code: 'HERA.WORKFLOW.TRANSITION.v1',
      metadata: {
        previous_status_id: currentStatus.id,
        transitioned_by: context.userId,
        reason: context.reason,
        transitioned_at: new Date(),
        ...context.metadata
      }
    })
    
    // Trigger any automated actions
    await this.triggerWorkflowActions(transactionId, newStatusId)
    
    return newStatusId
  }
  
  // Get workflow history
  async getWorkflowHistory(transactionId: string) {
    const relationships = await universalApi.query({
      table: 'core_relationships',
      filters: {
        from_entity_id: transactionId,
        relationship_type: 'has_workflow_status'
      },
      orderBy: { created_at: 'desc' }
    })
    
    return relationships.map(rel => ({
      statusId: rel.to_entity_id,
      assignedAt: rel.metadata.assigned_at || rel.created_at,
      assignedBy: rel.metadata.assigned_by,
      reason: rel.metadata.reason,
      metadata: rel.metadata
    }))
  }
}
```

### 2. **Workflow UI Components (Reusable)**

Create universal workflow components:

```tsx
// src/components/workflow/UniversalWorkflowTracker.tsx

import { useState, useEffect } from 'react'
import { UniversalWorkflow } from '@/lib/universal-workflow'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

interface WorkflowTrackerProps {
  transactionId: string
  organizationId: string
  onStatusChange?: (newStatus: any) => void
}

export function UniversalWorkflowTracker({ 
  transactionId, 
  organizationId,
  onStatusChange 
}: WorkflowTrackerProps) {
  const [currentStatus, setCurrentStatus] = useState(null)
  const [availableTransitions, setAvailableTransitions] = useState([])
  const [history, setHistory] = useState([])
  
  const workflow = new UniversalWorkflow(organizationId)
  
  useEffect(() => {
    loadWorkflowData()
  }, [transactionId])
  
  const loadWorkflowData = async () => {
    const status = await workflow.getCurrentStatus(transactionId)
    const transitions = await workflow.getAvailableTransitions(transactionId)
    const workflowHistory = await workflow.getWorkflowHistory(transactionId)
    
    setCurrentStatus(status)
    setAvailableTransitions(transitions)
    setHistory(workflowHistory)
  }
  
  const handleTransition = async (newStatusId: string) => {
    try {
      await workflow.transitionStatus(transactionId, newStatusId, {
        userId: currentUser.id,
        reason: 'Manual transition'
      })
      
      await loadWorkflowData()
      onStatusChange?.(newStatusId)
    } catch (error) {
      console.error('Transition failed:', error)
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Current Status</p>
          <Badge 
            className={`${currentStatus?.metadata?.color || 'bg-gray-500'} text-white`}
          >
            {currentStatus?.name}
          </Badge>
        </div>
        
        {/* Status Actions */}
        {availableTransitions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">Change Status</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {availableTransitions.map(transition => (
                <DropdownMenuItem
                  key={transition.id}
                  onClick={() => handleTransition(transition.id)}
                >
                  {transition.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {/* Workflow Timeline */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Workflow History</p>
        <div className="space-y-1">
          {history.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">
                {new Date(item.assignedAt).toLocaleDateString()}
              </span>
              <Badge variant="outline" size="sm">
                {item.statusName}
              </Badge>
              {item.reason && (
                <span className="text-gray-600">- {item.reason}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 3. **Integration with Transactions**

Add workflow to any transaction automatically:

```typescript
// Enhanced transaction creation with workflow
async function createTransactionWithWorkflow(data: any) {
  // Create transaction
  const transaction = await universalApi.createTransaction({
    ...data,
    smart_code: 'HERA.SALON.APPOINTMENT.v1'
  })
  
  // Determine workflow based on transaction type
  const workflowTemplate = await getWorkflowForTransactionType(
    data.transaction_type
  )
  
  // Assign workflow
  if (workflowTemplate) {
    await workflow.assignWorkflow(transaction.id, workflowTemplate.id)
  }
  
  return transaction
}
```

## 🔧 Configuration Examples

### 1. **Sales Order Workflow**
```typescript
const salesWorkflow = {
  name: 'Sales Order Workflow',
  code: 'SALES-ORDER',
  stages: [
    { code: 'DRAFT', name: 'Draft', order: 1, isInitial: true },
    { code: 'SUBMITTED', name: 'Submitted', order: 2 },
    { code: 'APPROVED', name: 'Approved', order: 3 },
    { code: 'PROCESSING', name: 'Processing', order: 4 },
    { code: 'SHIPPED', name: 'Shipped', order: 5 },
    { code: 'DELIVERED', name: 'Delivered', order: 6, isFinal: true }
  ],
  transitions: [
    { from: 'DRAFT', to: 'SUBMITTED', requiresApproval: false },
    { from: 'SUBMITTED', to: 'APPROVED', requiresApproval: true },
    { from: 'APPROVED', to: 'PROCESSING', automatic: true },
    { from: 'PROCESSING', to: 'SHIPPED', requiresAction: 'ship_order' },
    { from: 'SHIPPED', to: 'DELIVERED', requiresConfirmation: true }
  ]
}
```

### 2. **Appointment Workflow**
```typescript
const appointmentWorkflow = {
  name: 'Appointment Workflow',
  code: 'APPOINTMENT',
  stages: [
    { code: 'SCHEDULED', name: 'Scheduled', order: 1, isInitial: true },
    { code: 'CONFIRMED', name: 'Confirmed', order: 2 },
    { code: 'CHECKED_IN', name: 'Checked In', order: 3 },
    { code: 'IN_SERVICE', name: 'In Service', order: 4 },
    { code: 'COMPLETED', name: 'Completed', order: 5 },
    { code: 'PAID', name: 'Paid', order: 6, isFinal: true }
  ]
}
```

### 3. **Invoice Workflow**
```typescript
const invoiceWorkflow = {
  name: 'Invoice Workflow',
  code: 'INVOICE',
  stages: [
    { code: 'DRAFT', name: 'Draft', order: 1, isInitial: true },
    { code: 'SENT', name: 'Sent', order: 2 },
    { code: 'VIEWED', name: 'Viewed', order: 3 },
    { code: 'PARTIALLY_PAID', name: 'Partially Paid', order: 4 },
    { code: 'PAID', name: 'Paid', order: 5, isFinal: true },
    { code: 'OVERDUE', name: 'Overdue', order: 6 }
  ]
}
```

## 🎯 Universal Features

### 1. **Automatic Status Assignment**
```typescript
// Automatically assign initial status when creating transactions
universalApi.on('transaction:created', async (transaction) => {
  const workflowConfig = await getWorkflowConfig(transaction.transaction_type)
  if (workflowConfig.autoAssign) {
    await workflow.assignWorkflow(transaction.id, workflowConfig.templateId)
  }
})
```

### 2. **Bulk Status Updates**
```typescript
async function bulkUpdateStatus(transactionIds: string[], newStatusId: string) {
  const results = await Promise.allSettled(
    transactionIds.map(id => 
      workflow.transitionStatus(id, newStatusId, {
        userId: currentUser.id,
        reason: 'Bulk update'
      })
    )
  )
  
  return results
}
```

### 3. **Workflow Analytics**
```typescript
async function getWorkflowAnalytics(workflowTemplateId: string) {
  const statuses = await getWorkflowStatuses(workflowTemplateId)
  
  const analytics = {}
  for (const status of statuses) {
    const count = await universalApi.count({
      table: 'core_relationships',
      filters: {
        to_entity_id: status.id,
        relationship_type: 'has_workflow_status'
      }
    })
    
    analytics[status.code] = {
      count,
      percentage: (count / totalTransactions) * 100,
      averageTimeInStatus: await calculateAverageTime(status.id)
    }
  }
  
  return analytics
}
```

## 🚀 Implementation Steps

### 1. **Setup Workflow Infrastructure**
```bash
# Create workflow setup script
cd mcp-server
node setup-universal-workflow.js
```

### 2. **Add to Existing Apps**
```typescript
// In any app component
import { UniversalWorkflowTracker } from '@/components/workflow/UniversalWorkflowTracker'

// Add to transaction view
<UniversalWorkflowTracker
  transactionId={transaction.id}
  organizationId={organizationId}
  onStatusChange={handleStatusChange}
/>
```

### 3. **Configure Workflows**
```typescript
// In app initialization
await workflow.createWorkflowTemplate(salesWorkflow)
await workflow.createWorkflowTemplate(appointmentWorkflow)
await workflow.createWorkflowTemplate(invoiceWorkflow)
```

## 🎨 UI Integration

### 1. **Transaction List View**
```tsx
// Show workflow status in tables
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Transaction</TableHead>
      <TableHead>Amount</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {transactions.map(transaction => (
      <TableRow key={transaction.id}>
        <TableCell>{transaction.code}</TableCell>
        <TableCell>{transaction.amount}</TableCell>
        <TableCell>
          <WorkflowStatusBadge transactionId={transaction.id} />
        </TableCell>
        <TableCell>
          <WorkflowActions transactionId={transaction.id} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 2. **Transaction Detail View**
```tsx
// Full workflow tracker in detail pages
<Card>
  <CardHeader>
    <CardTitle>Workflow Status</CardTitle>
  </CardHeader>
  <CardContent>
    <UniversalWorkflowTracker
      transactionId={transaction.id}
      organizationId={organizationId}
    />
  </CardContent>
</Card>
```

## 🔑 Benefits

1. **No Schema Changes** - Works with existing 6-table architecture
2. **Universal Application** - Same system works for any transaction type
3. **Reusable Components** - Drop-in UI components for any app
4. **Complete Audit Trail** - Full history of all status changes
5. **Flexible Configuration** - Different workflows for different needs
6. **Automatic Integration** - Works with existing transactions
7. **Multi-App Support** - One implementation, use everywhere

This universal workflow system can be integrated into any HERA application with minimal setup, providing consistent status tracking across all business processes.