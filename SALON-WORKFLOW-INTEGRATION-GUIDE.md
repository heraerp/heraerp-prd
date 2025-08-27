# Salon Workflow Integration Guide

## 🚀 Quick Integration Steps for Each Module

This guide shows exactly how to integrate the Universal Workflow system into each salon module with copy-paste code examples.

## 1️⃣ Clients Module Integration

### Step 1: Define Client Workflow

```javascript
// mcp-server/setup-salon-client-workflow.js
const CLIENT_WORKFLOW = {
  name: 'Client Lifecycle Workflow',
  code: 'CLIENT-LIFECYCLE',
  stages: [
    { code: 'LEAD', name: 'Lead', order: 1, isInitial: true, color: '#6B7280', icon: 'user-plus' },
    { code: 'NEW', name: 'New Client', order: 2, color: '#3B82F6', icon: 'user' },
    { code: 'ACTIVE', name: 'Active', order: 3, color: '#10B981', icon: 'user-check' },
    { code: 'VIP', name: 'VIP', order: 4, color: '#F59E0B', icon: 'star' },
    { code: 'INACTIVE', name: 'Inactive', order: 5, color: '#EF4444', icon: 'user-x' },
    { code: 'REACTIVATED', name: 'Reactivated', order: 6, isFinal: true, color: '#8B5CF6', icon: 'refresh' }
  ],
  transitions: [
    { from: 'LEAD', to: 'NEW' },
    { from: 'NEW', to: 'ACTIVE' },
    { from: 'ACTIVE', to: 'VIP', requiresApproval: true },
    { from: 'ACTIVE', to: 'INACTIVE', automatic: true }, // After 6 months no visit
    { from: 'VIP', to: 'INACTIVE', automatic: true },
    { from: 'INACTIVE', to: 'REACTIVATED' }
  ]
}
```

### Step 2: Add to Client List View

```tsx
// src/app/salon/clients/page.tsx
import { UniversalWorkflowTracker } from '@/components/workflow/UniversalWorkflowTracker'

// In the table body
<TableCell>
  <UniversalWorkflowTracker
    transactionId={client.id}
    organizationId={organizationId}
    userId={currentUser.id}
    compact={true}
  />
</TableCell>
```

### Step 3: Add to Client Detail Page

```tsx
// src/app/salon/clients/[id]/page.tsx
<Card className="mt-6">
  <CardHeader>
    <CardTitle>Client Status</CardTitle>
  </CardHeader>
  <CardContent>
    <UniversalWorkflowTracker
      transactionId={clientId}
      organizationId={organizationId}
      userId={currentUser.id}
      onStatusChange={handleStatusChange}
      compact={false}
    />
  </CardContent>
</Card>
```

### Step 4: Auto-assign Workflow on Client Creation

```typescript
// In client creation API or function
const client = await universalApi.createEntity({
  entity_type: 'customer',
  entity_name: clientData.name,
  // ... other fields
})

// Auto-assign workflow
const workflow = new UniversalWorkflow(organizationId)
const template = await workflow.findTemplate('CLIENT-LIFECYCLE')
await workflow.assignWorkflow(client.id, template.id)
```

## 2️⃣ Services Module Integration

### Service Lifecycle Workflow

```javascript
const SERVICE_WORKFLOW = {
  name: 'Service Lifecycle',
  code: 'SERVICE-LIFECYCLE',
  stages: [
    { code: 'DRAFT', name: 'Draft', order: 1, isInitial: true, color: '#6B7280' },
    { code: 'ACTIVE', name: 'Active', order: 2, color: '#10B981' },
    { code: 'POPULAR', name: 'Popular', order: 3, color: '#F59E0B' },
    { code: 'SEASONAL', name: 'Seasonal', order: 4, color: '#8B5CF6' },
    { code: 'DISCONTINUED', name: 'Discontinued', order: 5, isFinal: true, color: '#EF4444' }
  ]
}
```

### Add to Services Table

```tsx
// src/app/salon/services/page.tsx
<TableRow>
  <TableCell>{service.name}</TableCell>
  <TableCell>${service.price}</TableCell>
  <TableCell>{service.duration} min</TableCell>
  <TableCell>
    <UniversalWorkflowTracker
      transactionId={service.id}
      organizationId={organizationId}
      userId={currentUser.id}
      compact={true}
    />
  </TableCell>
</TableRow>
```

## 3️⃣ Staff Module Integration

### Staff Lifecycle Workflow

```javascript
const STAFF_WORKFLOW = {
  name: 'Employee Lifecycle',
  code: 'EMPLOYEE-LIFECYCLE',
  stages: [
    { code: 'APPLIED', name: 'Applied', order: 1, isInitial: true, color: '#6B7280' },
    { code: 'INTERVIEWED', name: 'Interviewed', order: 2, color: '#3B82F6' },
    { code: 'HIRED', name: 'Hired', order: 3, color: '#10B981' },
    { code: 'TRAINING', name: 'In Training', order: 4, color: '#F59E0B' },
    { code: 'ACTIVE', name: 'Active', order: 5, color: '#10B981' },
    { code: 'ON_LEAVE', name: 'On Leave', order: 6, color: '#8B5CF6' },
    { code: 'TERMINATED', name: 'Terminated', order: 7, isFinal: true, color: '#EF4444' }
  ],
  transitions: [
    { from: 'APPLIED', to: 'INTERVIEWED' },
    { from: 'INTERVIEWED', to: 'HIRED', requiresApproval: true },
    { from: 'HIRED', to: 'TRAINING' },
    { from: 'TRAINING', to: 'ACTIVE' },
    { from: 'ACTIVE', to: 'ON_LEAVE' },
    { from: 'ON_LEAVE', to: 'ACTIVE' },
    { from: 'ACTIVE', to: 'TERMINATED', requiresApproval: true }
  ]
}
```

### Staff Page Enhancement

```tsx
// src/app/salon/staff/page.tsx
import { Badge } from '@/components/ui/badge'

// Add status column with actions
<TableCell>
  <div className="flex items-center gap-2">
    <UniversalWorkflowTracker
      transactionId={staff.id}
      organizationId={organizationId}
      userId={currentUser.id}
      compact={true}
    />
    {/* Quick actions based on status */}
    {currentStatus === 'TRAINING' && (
      <Button size="sm" variant="outline" onClick={() => completeTraining(staff.id)}>
        Complete Training
      </Button>
    )}
  </div>
</TableCell>
```

## 4️⃣ Inventory Module Integration

### Inventory Workflow

```javascript
const INVENTORY_WORKFLOW = {
  name: 'Inventory Management',
  code: 'INVENTORY',
  stages: [
    { code: 'ORDERED', name: 'Ordered', order: 1, isInitial: true, color: '#6B7280' },
    { code: 'IN_TRANSIT', name: 'In Transit', order: 2, color: '#3B82F6' },
    { code: 'RECEIVED', name: 'Received', order: 3, color: '#8B5CF6' },
    { code: 'IN_STOCK', name: 'In Stock', order: 4, color: '#10B981' },
    { code: 'LOW_STOCK', name: 'Low Stock', order: 5, color: '#F59E0B' },
    { code: 'OUT_OF_STOCK', name: 'Out of Stock', order: 6, color: '#EF4444' },
    { code: 'REORDERED', name: 'Reordered', order: 7, color: '#06B6D4' }
  ],
  transitions: [
    { from: 'ORDERED', to: 'IN_TRANSIT' },
    { from: 'IN_TRANSIT', to: 'RECEIVED' },
    { from: 'RECEIVED', to: 'IN_STOCK' },
    { from: 'IN_STOCK', to: 'LOW_STOCK', automatic: true },
    { from: 'LOW_STOCK', to: 'OUT_OF_STOCK', automatic: true },
    { from: 'OUT_OF_STOCK', to: 'REORDERED' },
    { from: 'REORDERED', to: 'ORDERED' }
  ]
}
```

### Inventory Dashboard Integration

```tsx
// src/app/salon/inventory/page.tsx
// Add status overview cards
<div className="grid grid-cols-4 gap-4 mb-6">
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm">In Stock</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-green-600">
        {inventory.filter(i => i.status === 'IN_STOCK').length}
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm">Low Stock</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-amber-600">
        {inventory.filter(i => i.status === 'LOW_STOCK').length}
      </div>
    </CardContent>
  </Card>
</div>
```

## 5️⃣ POS Transaction Integration

### POS Transaction Workflow

```javascript
const POS_WORKFLOW = {
  name: 'POS Transaction',
  code: 'POS-TRANSACTION',
  stages: [
    { code: 'STARTED', name: 'Started', order: 1, isInitial: true, color: '#6B7280' },
    { code: 'ITEMS_ADDED', name: 'Items Added', order: 2, color: '#3B82F6' },
    { code: 'PAYMENT_PENDING', name: 'Payment Pending', order: 3, color: '#F59E0B' },
    { code: 'PAID', name: 'Paid', order: 4, color: '#10B981' },
    { code: 'COMPLETED', name: 'Completed', order: 5, isFinal: true, color: '#10B981' },
    { code: 'REFUNDED', name: 'Refunded', order: 6, isFinal: true, color: '#EF4444' }
  ]
}
```

### Real-time POS Status

```tsx
// src/app/salon/pos/page.tsx
const [currentTransaction, setCurrentTransaction] = useState(null)
const [workflowStatus, setWorkflowStatus] = useState('STARTED')

// Update status as items are added
const addItem = async (item) => {
  // Add item logic...
  
  if (workflowStatus === 'STARTED') {
    await workflow.transitionStatus(
      currentTransaction.id,
      'ITEMS_ADDED',
      { userId, reason: 'First item added' }
    )
    setWorkflowStatus('ITEMS_ADDED')
  }
}

// Show status in UI
<div className="flex items-center justify-between mb-4">
  <h2>Current Sale</h2>
  <Badge className={getStatusColor(workflowStatus)}>
    {workflowStatus}
  </Badge>
</div>
```

## 6️⃣ Universal Integration Patterns

### Pattern 1: Auto-Assignment Hook

```typescript
// src/lib/workflow-hooks.ts
export const workflowAutoAssignment = {
  'customer': 'CLIENT-LIFECYCLE',
  'service': 'SERVICE-LIFECYCLE',
  'employee': 'EMPLOYEE-LIFECYCLE',
  'inventory': 'INVENTORY',
  'appointment': 'APPOINTMENT',
  'sale': 'POS-TRANSACTION'
}

// In your API or creation logic
universalApi.on('entity:created', async (entity) => {
  const workflowCode = workflowAutoAssignment[entity.entity_type]
  if (workflowCode) {
    const workflow = new UniversalWorkflow(entity.organization_id)
    const template = await workflow.findTemplate(workflowCode)
    if (template) {
      await workflow.assignWorkflow(entity.id, template.id)
    }
  }
})
```

### Pattern 2: Bulk Status Update

```tsx
// Component for bulk status updates
export function BulkWorkflowUpdate({ selectedItems, workflowType }) {
  const [newStatus, setNewStatus] = useState('')
  
  const handleBulkUpdate = async () => {
    const workflow = new UniversalWorkflow(organizationId)
    
    const results = await Promise.allSettled(
      selectedItems.map(item => 
        workflow.transitionStatus(item.id, newStatus, {
          userId: currentUser.id,
          reason: 'Bulk update'
        })
      )
    )
    
    // Show results
    const successful = results.filter(r => r.status === 'fulfilled').length
    toast({
      title: `Updated ${successful} of ${selectedItems.length} items`
    })
  }
  
  return (
    <div className="flex gap-2">
      <Select value={newStatus} onValueChange={setNewStatus}>
        <SelectTrigger>
          <SelectValue placeholder="Select new status" />
        </SelectTrigger>
        <SelectContent>
          {availableStatuses.map(status => (
            <SelectItem key={status.id} value={status.id}>
              {status.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleBulkUpdate}>
        Update {selectedItems.length} items
      </Button>
    </div>
  )
}
```

### Pattern 3: Workflow Analytics Dashboard

```tsx
// src/components/salon/WorkflowAnalytics.tsx
export function WorkflowAnalytics({ workflowType }) {
  const [metrics, setMetrics] = useState({
    statusDistribution: {},
    avgTimeInStatus: {},
    bottlenecks: []
  })
  
  useEffect(() => {
    loadWorkflowMetrics()
  }, [workflowType])
  
  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Status Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(metrics.statusDistribution).map(([status, count]) => (
            <div key={status} className="flex justify-between mb-2">
              <span>{status}</span>
              <Badge>{count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Average Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Average Time in Status</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add time visualization */}
        </CardContent>
      </Card>
      
      {/* Bottlenecks */}
      <Card>
        <CardHeader>
          <CardTitle>Process Bottlenecks</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.bottlenecks.map(bottleneck => (
            <Alert key={bottleneck.status}>
              <AlertDescription>
                {bottleneck.count} items stuck in {bottleneck.status}
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
```

## 7️⃣ Testing the Integration

### Create Test Script

```javascript
// mcp-server/test-salon-workflows.js
async function testSalonWorkflows() {
  console.log('🧪 Testing Salon Workflow Integration...')
  
  // Test 1: Client Workflow
  const client = await createTestClient()
  await workflow.assignWorkflow(client.id, 'CLIENT-LIFECYCLE')
  await workflow.transitionStatus(client.id, 'NEW')
  
  // Test 2: Appointment Workflow
  const appointment = await createTestAppointment()
  await workflow.assignWorkflow(appointment.id, 'APPOINTMENT')
  await workflow.transitionStatus(appointment.id, 'CONFIRMED')
  
  // Test 3: Check relationships
  const clientStatus = await workflow.getCurrentStatus(client.id)
  const appointmentStatus = await workflow.getCurrentStatus(appointment.id)
  
  console.log('Client Status:', clientStatus.entity_name)
  console.log('Appointment Status:', appointmentStatus.entity_name)
}
```

## 🎯 Integration Checklist

For each module, ensure:

- [ ] Workflow template defined
- [ ] Status added to list views
- [ ] Full tracker in detail pages
- [ ] Auto-assignment on creation
- [ ] Bulk operations support
- [ ] Status-based actions
- [ ] Analytics integration
- [ ] Mobile-friendly UI
- [ ] Error handling
- [ ] Loading states
- [ ] Success notifications
- [ ] Audit logging

## 🚀 Next Steps

1. **Run setup scripts** for each workflow
2. **Update UI components** with workflow trackers
3. **Add hooks** for auto-assignment
4. **Test each workflow** end-to-end
5. **Create analytics dashboards**
6. **Document business rules**
7. **Train staff** on new workflows

This integration will transform the salon app into a fully workflow-enabled system where every business process is tracked, measured, and optimized!