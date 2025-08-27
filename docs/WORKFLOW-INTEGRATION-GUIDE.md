# Universal Workflow Integration Guide

This guide shows how to integrate the universal workflow system into any HERA application with step-by-step instructions and code examples.

## Prerequisites

1. Run the setup script to create workflow templates:
```bash
cd mcp-server
node setup-universal-workflow.js
```

2. Ensure you have the required components:
- `/src/lib/universal-workflow.ts` - Workflow engine
- `/src/components/workflow/UniversalWorkflowTracker.tsx` - UI component

## Step-by-Step Integration

### 1. Import Required Components

```tsx
import { UniversalWorkflow } from '@/lib/universal-workflow'
import { UniversalWorkflowTracker } from '@/components/workflow/UniversalWorkflowTracker'
import { useToast } from '@/components/ui/use-toast'
```

### 2. Add Workflow to Transaction Creation

When creating any transaction, automatically assign a workflow:

```typescript
// Example: Enhanced appointment creation
async function createAppointmentWithWorkflow(data: any) {
  // Create the transaction
  const appointment = await universalApi.createTransaction({
    transaction_type: 'appointment',
    transaction_date: data.date,
    from_entity_id: data.customerId,
    smart_code: 'HERA.SALON.APPOINTMENT.v1',
    total_amount: data.amount,
    metadata: {
      service_id: data.serviceId,
      duration_minutes: data.duration,
      stylist: data.stylist
    }
  })
  
  // Find appropriate workflow template
  const workflowTemplate = await universalApi.query({
    table: 'core_entities',
    filters: {
      entity_type: 'workflow_template',
      entity_code: 'APPOINTMENT'
    },
    limit: 1
  })
  
  if (workflowTemplate && workflowTemplate[0]) {
    // Assign workflow
    const workflow = new UniversalWorkflow(organizationId)
    await workflow.assignWorkflow(appointment.id, workflowTemplate[0].id)
  }
  
  return appointment
}
```

### 3. Add Workflow Tracker to UI

#### In List Views

Show compact status badges in tables:

```tsx
<Table>
  <TableBody>
    {appointments.map(appointment => (
      <TableRow key={appointment.id}>
        <TableCell>{appointment.transaction_code}</TableCell>
        <TableCell>
          <UniversalWorkflowTracker
            transactionId={appointment.id}
            organizationId={organizationId}
            userId={currentUser.id}
            compact={true}
          />
        </TableCell>
        <TableCell>{appointment.total_amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### In Detail Views

Show full workflow tracker with history:

```tsx
export function AppointmentDetail({ appointmentId }: { appointmentId: string }) {
  const { organizationId, user } = useMultiOrgAuth()
  const { toast } = useToast()
  
  const handleStatusChange = (newStatus: any) => {
    toast({
      title: "Status Updated",
      description: `Appointment is now ${newStatus.name}`,
    })
    // Refresh appointment data
    refetchAppointment()
  }
  
  return (
    <div className="space-y-6">
      {/* Other appointment details */}
      
      {/* Workflow Section */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <UniversalWorkflowTracker
            transactionId={appointmentId}
            organizationId={organizationId}
            userId={user.id}
            onStatusChange={handleStatusChange}
            compact={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
```

### 4. Handle Status Transitions

#### Manual Transitions

The workflow tracker handles manual transitions with a dialog:

```tsx
// User clicks "Change Status" → Select new status → Confirm with reason
// This is handled automatically by UniversalWorkflowTracker
```

#### Programmatic Transitions

Transition status based on business events:

```typescript
// Example: Auto-transition to "In Service" when appointment starts
async function startAppointment(appointmentId: string) {
  const workflow = new UniversalWorkflow(organizationId)
  
  // Find "IN_SERVICE" status
  const inServiceStatus = await universalApi.query({
    table: 'core_entities',
    filters: {
      entity_type: 'workflow_status',
      entity_code: 'STATUS-APPOINTMENT-IN_SERVICE'
    },
    limit: 1
  })
  
  if (inServiceStatus && inServiceStatus[0]) {
    await workflow.transitionStatus(
      appointmentId,
      inServiceStatus[0].id,
      {
        userId: currentUser.id,
        reason: 'Appointment started',
        metadata: {
          started_at: new Date().toISOString(),
          automatic: true
        }
      }
    )
  }
}
```

### 5. Configure Workflow Rules

#### Auto-Assignment Rules

Configure which transactions get which workflows:

```typescript
// In your app initialization or configuration
const WORKFLOW_MAPPING = {
  'appointment': 'APPOINTMENT',
  'sale': 'SALES-ORDER',
  'invoice': 'INVOICE',
  'purchase_order': 'PURCHASE-ORDER'
}

// Hook into transaction creation
universalApi.on('transaction:created', async (transaction) => {
  const workflowCode = WORKFLOW_MAPPING[transaction.transaction_type]
  if (workflowCode) {
    // Auto-assign workflow
    const template = await findWorkflowTemplate(workflowCode)
    if (template) {
      const workflow = new UniversalWorkflow(transaction.organization_id)
      await workflow.assignWorkflow(transaction.id, template.id)
    }
  }
})
```

#### Automatic Transitions

Configure transitions that happen automatically:

```typescript
// Example: Auto-confirm appointments 24 hours before
async function autoConfirmAppointments() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // Find scheduled appointments for tomorrow
  const appointments = await universalApi.query({
    table: 'universal_transactions',
    filters: {
      transaction_type: 'appointment',
      transaction_date: tomorrow.toISOString().split('T')[0]
    }
  })
  
  for (const appointment of appointments) {
    const currentStatus = await workflow.getCurrentStatus(appointment.id)
    
    if (currentStatus?.entity_code === 'STATUS-APPOINTMENT-SCHEDULED') {
      // Find CONFIRMED status
      const confirmedStatus = await findStatusByCode('STATUS-APPOINTMENT-CONFIRMED')
      
      if (confirmedStatus) {
        await workflow.transitionStatus(
          appointment.id,
          confirmedStatus.id,
          {
            userId: 'system',
            reason: 'Auto-confirmed 24 hours before appointment',
            metadata: { automatic: true }
          }
        )
      }
    }
  }
}
```

## Workflow Analytics

### Status Distribution

Show how many transactions are in each status:

```tsx
export function WorkflowAnalytics({ workflowTemplateId }: { workflowTemplateId: string }) {
  const [analytics, setAnalytics] = useState<any>(null)
  
  useEffect(() => {
    loadAnalytics()
  }, [workflowTemplateId])
  
  const loadAnalytics = async () => {
    // Get all statuses for this workflow
    const statuses = await universalApi.query({
      table: 'core_relationships',
      filters: {
        from_entity_id: workflowTemplateId,
        relationship_type: 'has_stage'
      }
    })
    
    const statusCounts = {}
    
    for (const rel of statuses) {
      const count = await universalApi.count({
        table: 'core_relationships',
        filters: {
          to_entity_id: rel.to_entity_id,
          relationship_type: 'has_workflow_status',
          'metadata->is_active': true
        }
      })
      
      statusCounts[rel.to_entity_id] = count
    }
    
    setAnalytics(statusCounts)
  }
  
  return (
    <div className="grid grid-cols-4 gap-4">
      {Object.entries(analytics || {}).map(([statusId, count]) => (
        <Card key={statusId}>
          <CardHeader>
            <CardTitle>{getStatusName(statusId)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{count}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### Average Time in Status

Track how long transactions stay in each status:

```typescript
async function calculateAverageTimeInStatus(statusId: string) {
  const relationships = await universalApi.query({
    table: 'core_relationships',
    filters: {
      to_entity_id: statusId,
      relationship_type: 'has_workflow_status'
    }
  })
  
  const durations = relationships
    .filter(rel => rel.metadata?.ended_at)
    .map(rel => {
      const start = new Date(rel.created_at)
      const end = new Date(rel.metadata.ended_at)
      return end - start
    })
  
  if (durations.length === 0) return 0
  
  const average = durations.reduce((a, b) => a + b, 0) / durations.length
  return average / (1000 * 60 * 60) // Convert to hours
}
```

## Best Practices

### 1. Always Include Metadata

When transitioning statuses, include relevant metadata:

```typescript
await workflow.transitionStatus(transactionId, newStatusId, {
  userId: currentUser.id,
  reason: 'Customer request',
  metadata: {
    customer_feedback: 'Preferred morning appointment',
    previous_status_duration: calculateDuration(),
    transition_source: 'customer_portal'
  }
})
```

### 2. Handle Errors Gracefully

Always handle transition errors:

```typescript
try {
  await workflow.transitionStatus(transactionId, newStatusId, context)
} catch (error) {
  if (error.message === 'Invalid status transition') {
    toast({
      title: "Invalid Transition",
      description: "Cannot move to this status from current status",
      variant: "destructive"
    })
  } else {
    toast({
      title: "Error",
      description: "Failed to update status",
      variant: "destructive"
    })
  }
}
```

### 3. Use Workflow Templates

Define reusable workflow templates:

```typescript
export const WORKFLOW_TEMPLATES = {
  SIMPLE_APPROVAL: {
    name: 'Simple Approval Workflow',
    code: 'SIMPLE-APPROVAL',
    stages: [
      { code: 'DRAFT', name: 'Draft', order: 1, isInitial: true },
      { code: 'SUBMITTED', name: 'Submitted', order: 2 },
      { code: 'APPROVED', name: 'Approved', order: 3, isFinal: true },
      { code: 'REJECTED', name: 'Rejected', order: 4, isFinal: true }
    ],
    transitions: [
      { from: 'DRAFT', to: 'SUBMITTED' },
      { from: 'SUBMITTED', to: 'APPROVED', requiresApproval: true },
      { from: 'SUBMITTED', to: 'REJECTED', requiresApproval: true }
    ]
  }
}
```

### 4. Monitor Workflow Performance

Track key metrics:

```typescript
const workflowMetrics = {
  averageCompletionTime: await calculateAverageCompletionTime(),
  bottleneckStatuses: await identifyBottlenecks(),
  abandonmentRate: await calculateAbandonmentRate(),
  successRate: await calculateSuccessRate()
}
```

## Common Patterns

### 1. Parallel Workflows

Some transactions might have multiple workflows:

```typescript
// Example: Order with separate payment and fulfillment workflows
await assignWorkflow(orderId, 'PAYMENT-WORKFLOW')
await assignWorkflow(orderId, 'FULFILLMENT-WORKFLOW')
```

### 2. Conditional Transitions

Transitions based on business rules:

```typescript
if (transaction.total_amount > 1000) {
  // Require manager approval
  await workflow.transitionStatus(transactionId, 'PENDING-APPROVAL', {
    userId: currentUser.id,
    reason: 'High value transaction requires approval'
  })
} else {
  // Auto-approve
  await workflow.transitionStatus(transactionId, 'APPROVED', {
    userId: 'system',
    reason: 'Auto-approved: within limits'
  })
}
```

### 3. Workflow Notifications

Send notifications on status changes:

```typescript
workflow.on('status:changed', async (event) => {
  await sendNotification({
    to: event.transaction.owner,
    subject: `Status updated to ${event.newStatus.name}`,
    body: `Your ${event.transaction.type} is now ${event.newStatus.name}`
  })
})
```

## Summary

The universal workflow system provides:

1. **Zero Schema Changes** - Works with existing HERA architecture
2. **Reusable Components** - Drop-in UI components for any app
3. **Complete Tracking** - Full audit trail of all changes
4. **Flexible Configuration** - Different workflows for different needs
5. **Automatic Integration** - Works with any transaction type

This system can be integrated into any HERA application in minutes, providing enterprise-grade workflow management without complexity.