# Salon UCR Templates Guide

## Step 1: Browse Available Templates

The UCR Template Browser provides industry-proven business rule templates specifically designed for salons. Here's how to get started:

### 1. Navigate to Templates

From your salon dashboard:
1. Click on **"Templates"** in the navigation bar (with "New" badge)
2. Or click the **"Browse Templates"** button in the purple quick access card

### 2. Available Template Categories

#### 🟣 **Booking Rules**
- **Appointment Cancellation Policy**: Standard 15-minute grace period, no-show fees, VIP exceptions
- **Booking Window Rules**: How far in advance customers can book appointments
- **Double Booking Policies**: Rules for managing overlapping appointments

#### 💚 **Pricing Rules** 
- **POS Discount Cap**: Maximum discount limits with manager/VIP exceptions
- **Seasonal Pricing**: Peak hour surcharges and special event pricing
- **Membership Discounts**: Automated discounts for loyalty members

#### 🔵 **Notification Rules**
- **Appointment Reminders**: SMS/WhatsApp reminders 24h and 2h before appointments
- **Cancellation Notifications**: Automated alerts for cancellations
- **Birthday/Special Offers**: Marketing notifications for special occasions

### 3. Template Features

Each template includes:
- **Base Definitions**: Standard rules that apply to all customers
- **VIP Exceptions**: Special handling for your best customers
- **Calendar Effects**: How rules affect booking availability
- **Notification Settings**: Communication preferences and templates

### 4. Using Templates

1. **Preview**: Click the "Preview" button to see full rule details
2. **Clone**: Click "Use Template" to create your own customized version
3. **Customize**: Templates are automatically customized with your salon name
4. **Activate**: Deploy rules to start using them immediately

## Example: Salon Cancellation Policy

The cancellation policy template includes:

```javascript
{
  grace_minutes: 15,              // 15-minute grace period
  no_show_fee_pct: 100,          // 100% charge for no-shows
  late_cancel_threshold: 120,     // 2 hours for late cancellation
  late_cancel_fee_pct: 50,       // 50% fee for late cancellations
  
  // VIP Exception
  VIP_customers: {
    late_cancel_fee_pct: 0,      // No fee for VIPs
    no_show_fee_pct: 25          // Only 25% for VIP no-shows
  }
}
```

## Benefits

- ✅ **Industry-Proven**: Based on successful salon operations
- ✅ **Zero Code Required**: Configure via UI, no programming needed
- ✅ **Instant Activation**: Rules apply immediately after deployment
- ✅ **Multi-Tenant Safe**: Each salon gets isolated configuration
- ✅ **Version Control**: Full history and rollback capabilities

## Step 2: Customize Templates

After selecting a template, you'll enter the customization wizard with four tabs:

### 1. **Basics Tab**
- Edit the rule title and description
- View the auto-generated smart code
- See which template you're customizing

### 2. **Rules Tab**
Customize the core business logic:

**For Cancellation Policies:**
- Grace period (0-60 minutes)
- No-show fees (0-100%)
- Late cancellation threshold (30 min - 8 hours)
- Late cancellation fees (0-100%)
- Calendar blocking for no-shows

**For Pricing Rules:**
- Maximum discount percentage
- Maximum discount amount
- Manager approval thresholds

### 3. **Exceptions Tab**
Create special rules for different customer types:
- VIP customers: Reduced or waived fees
- Premium members: Higher discount limits
- New customers: Special onboarding rules
- Add unlimited custom exceptions

### 4. **Validation Tab**
- Validate your customized rule before saving
- View any errors or warnings
- Preview the complete rule configuration
- Ensure everything is correct before deployment

## Step 3: Save and Deploy

Once customized:
1. Click "Save Customization"
2. The rule is created in draft status
3. Navigate to UCR Rules management
4. Deploy when ready for production

## Customization Examples

### Example 1: Lenient VIP Policy
```javascript
// Template Default
{
  grace_minutes: 15,
  no_show_fee_pct: 100,
  VIP: { no_show_fee_pct: 25 }
}

// Your Customization
{
  grace_minutes: 30,        // More time for all
  no_show_fee_pct: 50,     // Reduced penalty
  VIP: { no_show_fee_pct: 0 }  // Free for VIPs
}
```

### Example 2: Strict Business Policy
```javascript
// Template Default
{
  late_cancel_threshold: 120,  // 2 hours
  late_cancel_fee_pct: 50
}

// Your Customization
{
  late_cancel_threshold: 240,  // 4 hours required
  late_cancel_fee_pct: 75     // Higher penalty
}
```

## Step 3: Test Rules with Simulation Scenarios

After customizing your rules, test them with real-world scenarios before deployment.

### Testing Interface

The rule tester provides three main features:

#### 1. **Pre-built Test Scenarios**
Ready-to-use scenarios for common business situations:

**For Cancellation Policies:**
- On-time arrival (within grace period)
- Late arrival/No-show scenarios
- Early vs late cancellations
- VIP customer exceptions

**For Pricing Rules:**
- Standard discount requests
- High discount attempts
- Manager overrides
- VIP special pricing

#### 2. **Custom Test Builder**
Create your own test scenarios:
- Select customer tier
- Set appointment/pricing details
- Define custom context
- Run unlimited tests

#### 3. **Test Results Analysis**
- Pass/fail status for each test
- Expected vs actual comparisons
- Detailed diff views
- Overall pass rate metrics

### Example Test Scenarios

#### Cancellation Policy Test
```javascript
// Test: VIP Late Arrival
{
  customer_tier: 'VIP',
  appointment_time: '14:00',
  arrival_time: '14:30',  // 30 min late
  service_price: 150
}
// Expected: 25% fee (VIP exception)
// Actual: 0% fee (your custom rule)
```

#### Pricing Rule Test
```javascript
// Test: Manager Override
{
  customer_tier: 'REGULAR',
  staff_role: 'MANAGER',
  original_price: 200,
  requested_discount_pct: 45
}
// Expected: Allowed
// Actual: Allowed with manager privileges
```

### Testing Workflow

1. **Navigate to Test**: Click "Test Rule" from the rules list
2. **Review Scenarios**: See all pre-built test cases
3. **Run Tests**: Execute individual or all scenarios
4. **Analyze Results**: Review pass/fail metrics
5. **Custom Tests**: Create edge cases specific to your business
6. **Iterate**: Refine rules based on test results

### Benefits of Testing

- **Confidence**: Ensure rules work as expected
- **Edge Cases**: Discover scenarios you hadn't considered
- **Documentation**: Tests serve as rule documentation
- **Regression Prevention**: Re-test after any changes
- **Customer Experience**: Avoid surprises in production

## Step 4: Deploy to Production

After testing your rules, deploy them to production with confidence using the deployment manager.

### Deployment Manager Features

#### 1. **Overview Tab**
- Rule summary and smart code details
- Deployment readiness checklist
- Validation status and test results
- Previous deployment history

#### 2. **Settings Tab**
- **Application Scope**: Choose which apps will use the rule (salon, booking_app, pos_system)
- **Location Scope**: Select specific locations or all locations
- **Schedule**: Deploy immediately or schedule for later
- **Deployment Notes**: Document what's changing and why

#### 3. **Approvals Tab**
- **Approval Requirements**: Enable/disable manager approval requirement
- **Add Approvals**: Record approvals with timestamps and notes
- **Pre-deployment Checklist**: Ensure all items are checked before deployment
  - Rule thoroughly tested
  - Changes reviewed
  - Required approvals obtained
  - Deployment notes added
  - Rollback plan ready

#### 4. **History Tab**
- View all previous deployments
- See deployment status and timestamps
- Access rollback options (30-day window)
- Review deployment notes and approvals

### Deployment Workflow

1. **Navigate to Deploy**: Click "Deploy Rule" from the rules list dropdown menu
2. **Review Overview**: Check deployment readiness and validation status
3. **Configure Settings**: 
   - Select apps and locations
   - Set deployment schedule
   - Add deployment notes
4. **Get Approvals**: 
   - Enable approval requirement
   - Add manager approvals with notes
   - Complete pre-deployment checklist
5. **Deploy**: Click "Deploy Now" to activate the rule
6. **Monitor Progress**: Watch real-time deployment progress
7. **Verify Success**: Check deployment history and confirm activation

### Deployment Best Practices

- **Always Test First**: Ensure 80%+ test pass rate before deployment
- **Document Changes**: Add clear deployment notes for future reference
- **Get Approvals**: For critical rules, require manager sign-off
- **Schedule Wisely**: Deploy during low-traffic periods if possible
- **Monitor Post-Deploy**: Check audit logs after deployment

### Rollback Capability

If issues arise after deployment:
- Access deployment history in the History tab
- Click "Rollback to Previous Version"
- Available for 30 days after deployment
- Maintains complete audit trail

### Example Deployment

```javascript
// Deployment Configuration
{
  scope: {
    apps: ['salon', 'booking_app'],
    locations: ['all']
  },
  schedule: {
    effective_from: '2024-01-15T09:00:00Z',
    effective_to: null  // Permanent deployment
  },
  approvals: [{
    user_id: 'mgr_001',
    user_name: 'John Manager',
    role: 'manager',
    approved_at: '2024-01-14T15:30:00Z',
    notes: 'Approved for production use'
  }],
  notes: 'Updating cancellation policy to reduce no-show fees for VIP customers'
}
```

## Next Steps

1. ✅ Browse templates to understand available options
2. ✅ Clone and customize templates for your needs
3. ✅ Test rules with simulation scenarios
4. ✅ Deploy to production with confidence
5. Monitor performance via audit logs and dashboards