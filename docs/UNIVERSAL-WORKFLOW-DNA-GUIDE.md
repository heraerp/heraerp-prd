# Universal Workflow DNA Guide

## 🧬 Overview

The Universal Workflow DNA is now part of the HERA DNA Component System, making enterprise-grade workflow management available to any HERA application with zero schema changes. This revolutionary approach uses only the existing 6-table architecture to provide complete workflow tracking, approval processes, and status management.

## 🚀 Quick Start

### 1. Setup Workflow Templates (One-Time)

```bash
cd mcp-server
node setup-universal-workflow.js
```

This creates 4 standard workflow templates:
- **Sales Order Workflow** - Order lifecycle management
- **Appointment Workflow** - Service appointment tracking
- **Invoice Workflow** - Invoice status management
- **Purchase Order Workflow** - Procurement process

### 2. Add Workflow to Any Transaction

```typescript
import { UniversalWorkflow } from '@/lib/universal-workflow'

// Create transaction
const appointment = await universalApi.createTransaction({
  transaction_type: 'appointment',
  // ... other fields
})

// Assign workflow automatically
const workflow = new UniversalWorkflow(organizationId)
await workflow.assignWorkflow(appointment.id, 'APPOINTMENT')
```

### 3. Add UI Tracker Component

```tsx
import { UniversalWorkflowTracker } from '@/components/workflow/UniversalWorkflowTracker'

// In your component
<UniversalWorkflowTracker
  transactionId={appointment.id}
  organizationId={organizationId}
  userId={currentUser.id}
  onStatusChange={handleStatusChange}
  compact={false} // Use true for table views
/>
```

## 🎯 DNA Components Available

### 1. **Universal Workflow Engine** (`DNA-WORKFLOW-ENGINE`)
- **Location**: `/src/lib/universal-workflow.ts`
- **Features**:
  - Status tracking via relationships only
  - Workflow template management
  - Automatic transitions
  - Approval workflows
  - Complete audit trail
  - Multi-tenant support

### 2. **Universal Workflow Tracker UI** (`DNA-WORKFLOW-TRACKER`)
- **Location**: `/src/components/workflow/UniversalWorkflowTracker.tsx`
- **Features**:
  - Status display with color coding
  - Transition dropdown menu
  - History timeline view
  - Compact and full views
  - Transition dialog with reason
  - Loading and error states

### 3. **Workflow Template Library** (`DNA-WORKFLOW-TEMPLATES`)
- **Pre-built Templates**:
  - Sales Order (7 stages)
  - Appointment (9 stages)
  - Invoice (7 stages)
  - Purchase Order (7 stages)
- **Customizable**: Add your own templates

## 📋 Common Usage Patterns

### Pattern 1: Auto-Assign on Creation

```typescript
// Hook into transaction creation
universalApi.on('transaction:created', async (transaction) => {
  const workflowMap = {
    'appointment': 'APPOINTMENT',
    'sale': 'SALES-ORDER',
    'invoice': 'INVOICE'
  }
  
  const templateCode = workflowMap[transaction.transaction_type]
  if (templateCode) {
    const workflow = new UniversalWorkflow(transaction.organization_id)
    await workflow.assignWorkflow(transaction.id, templateCode)
  }
})
```

### Pattern 2: Programmatic Transitions

```typescript
// Transition to next status
const workflow = new UniversalWorkflow(organizationId)

// Get available transitions
const transitions = await workflow.getAvailableTransitions(transactionId)

// Transition with reason
await workflow.transitionStatus(
  transactionId,
  nextStatusId,
  {
    userId: currentUser.id,
    reason: 'Payment received',
    metadata: {
      payment_method: 'credit_card',
      amount: 150.00
    }
  }
)
```

### Pattern 3: Workflow Analytics

```typescript
// Get workflow history
const history = await workflow.getWorkflowHistory(transactionId)

// Calculate time in status
const timeInStatus = history.map(item => ({
  status: item.statusName,
  duration: calculateDuration(item.assignedAt, item.endedAt)
}))

// Find bottlenecks
const avgTimeByStatus = await analyzeWorkflowBottlenecks(workflowTemplateId)
```

## 🎨 UI Integration Examples

### In List Views (Compact Mode)

```tsx
<Table>
  <TableBody>
    {transactions.map(transaction => (
      <TableRow key={transaction.id}>
        <TableCell>{transaction.transaction_code}</TableCell>
        <TableCell>
          <UniversalWorkflowTracker
            transactionId={transaction.id}
            organizationId={organizationId}
            userId={currentUser.id}
            compact={true} // Shows badge with dropdown
          />
        </TableCell>
        <TableCell>${transaction.total_amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### In Detail Views (Full Mode)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Order Status</CardTitle>
  </CardHeader>
  <CardContent>
    <UniversalWorkflowTracker
      transactionId={order.id}
      organizationId={organizationId}
      userId={currentUser.id}
      onStatusChange={(newStatus) => {
        toast({
          title: "Status Updated",
          description: `Order is now ${newStatus.name}`
        })
        refetchOrder()
      }}
      compact={false} // Shows full timeline and history
    />
  </CardContent>
</Card>
```

## 🔧 Creating Custom Workflows

### Step 1: Define Your Workflow

```typescript
const customWorkflow = {
  name: 'Customer Onboarding Workflow',
  code: 'CUSTOMER-ONBOARDING',
  stages: [
    { code: 'LEAD', name: 'Lead', order: 1, isInitial: true, color: '#6B7280' },
    { code: 'CONTACTED', name: 'Contacted', order: 2, color: '#3B82F6' },
    { code: 'QUALIFIED', name: 'Qualified', order: 3, color: '#8B5CF6' },
    { code: 'PROPOSAL', name: 'Proposal Sent', order: 4, color: '#F59E0B' },
    { code: 'NEGOTIATION', name: 'Negotiation', order: 5, color: '#EC4899' },
    { code: 'WON', name: 'Won', order: 6, isFinal: true, color: '#10B981' },
    { code: 'LOST', name: 'Lost', order: 7, isFinal: true, color: '#EF4444' }
  ],
  transitions: [
    { from: 'LEAD', to: 'CONTACTED' },
    { from: 'CONTACTED', to: 'QUALIFIED' },
    { from: 'QUALIFIED', to: 'PROPOSAL' },
    { from: 'PROPOSAL', to: 'NEGOTIATION' },
    { from: 'NEGOTIATION', to: 'WON' },
    { from: 'NEGOTIATION', to: 'LOST' },
    { from: 'LEAD', to: 'LOST' }, // Can lose at any stage
    { from: 'CONTACTED', to: 'LOST' },
    { from: 'QUALIFIED', to: 'LOST' }
  ]
}
```

### Step 2: Create the Workflow

```typescript
const workflow = new UniversalWorkflow(organizationId)
const template = await workflow.createWorkflowTemplate(customWorkflow)
```

### Step 3: Use It

```typescript
// Assign to customer entity
await workflow.assignWorkflow(customerId, template.id)

// Track progress
<UniversalWorkflowTracker
  transactionId={customerId}
  organizationId={organizationId}
  userId={userId}
/>
```

## 🏗️ Architecture Details

### How It Works

1. **Workflow Templates** stored as entities:
   ```typescript
   {
     entity_type: 'workflow_template',
     entity_code: 'SALES-ORDER',
     metadata: { stages, transitions, rules }
   }
   ```

2. **Statuses** stored as entities:
   ```typescript
   {
     entity_type: 'workflow_status',
     entity_code: 'STATUS-APPROVED',
     metadata: { color, icon, order }
   }
   ```

3. **Current Status** tracked via relationships:
   ```typescript
   {
     from_entity_id: transaction_id,
     to_entity_id: status_id,
     relationship_type: 'has_workflow_status',
     relationship_data: { is_active: true }
   }
   ```

4. **History** preserved by marking old relationships inactive

### Database Impact

- **Zero new tables** - Uses existing 6 tables
- **No schema changes** - Works with current structure
- **Minimal storage** - Only relationships and entities
- **High performance** - Indexed lookups

## 🚨 Best Practices

### 1. Always Include Context

```typescript
await workflow.transitionStatus(transactionId, newStatusId, {
  userId: currentUser.id,
  reason: 'Customer request', // Always provide reason
  metadata: {
    source: 'customer_portal',
    ip_address: request.ip,
    timestamp: new Date().toISOString()
  }
})
```

### 2. Handle Errors Gracefully

```typescript
try {
  await workflow.transitionStatus(transactionId, newStatusId, context)
} catch (error) {
  if (error.message === 'Invalid status transition') {
    // Show specific error to user
  } else {
    // Generic error handling
  }
}
```

### 3. Use Automatic Transitions

```typescript
// Set up time-based transitions
setInterval(async () => {
  // Auto-confirm appointments 24h before
  await autoConfirmAppointments()
  
  // Mark overdue invoices
  await markOverdueInvoices()
}, 3600000) // Every hour
```

## 📊 Workflow Analytics

### Track Key Metrics

```typescript
const metrics = {
  completionRate: await calculateCompletionRate(workflowId),
  avgCompletionTime: await calculateAvgTime(workflowId),
  bottlenecks: await identifyBottlenecks(workflowId),
  abandonmentByStage: await getAbandonmentRates(workflowId)
}
```

### Generate Reports

```typescript
const report = await generateWorkflowReport({
  workflowId,
  dateRange: { from: startDate, to: endDate },
  groupBy: 'week',
  metrics: ['completion_time', 'success_rate', 'bottlenecks']
})
```

## 🔌 Integration with Other Systems

### Webhooks on Status Change

```typescript
workflow.on('status:changed', async (event) => {
  // Send to external system
  await fetch('https://api.external.com/webhook', {
    method: 'POST',
    body: JSON.stringify({
      entity_id: event.transactionId,
      old_status: event.oldStatus,
      new_status: event.newStatus,
      timestamp: event.timestamp
    })
  })
})
```

### Email Notifications

```typescript
workflow.on('status:changed', async (event) => {
  if (event.newStatus.code === 'APPROVED') {
    await sendEmail({
      to: event.transaction.owner_email,
      subject: 'Your order has been approved!',
      template: 'order-approved',
      data: event
    })
  }
})
```

## 🎯 Summary

The Universal Workflow DNA provides:

1. **Zero Schema Changes** - Uses existing tables
2. **Instant Integration** - Drop-in components
3. **Complete Tracking** - Full audit trail
4. **Flexible Configuration** - Custom workflows
5. **Production Ready** - Used in live systems
6. **Universal Application** - Any transaction type
7. **DNA Reusability** - Once built, use everywhere

This is now a core part of HERA's DNA system and can be reused across all applications! 🚀