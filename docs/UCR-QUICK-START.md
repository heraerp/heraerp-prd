# UCR Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Access UCR Configuration
Navigate to the UCR Rules page in your HERA instance:
- **URL**: `/salon-data/config` or `/[your-app]/config`
- **Menu**: Look for "UCR Rules" with the ⚖️ icon

### Step 2: Create Your First Rule
Click "Create New Rule" and fill in:

```yaml
Name: "VIP Customer Discount"
Category: "Pricing"
Type: "Business Logic"
Priority: 200

Conditions:
  - Field: "customer_tier"
    Operator: "equals"
    Value: "VIP"

Actions:
  - Type: "Apply Discount"
    Target: "transaction_total"
    Value: "10%"
```

### Step 3: Test the Rule
1. Click "Test Rule" in the preview panel
2. Use the sample data provided or modify it
3. Click "Run Test" to see results
4. Check execution logs for details

### Step 4: Activate the Rule
- Toggle the status to "Active"
- The rule takes effect immediately
- Monitor via the dashboard

## 📋 Common Use Cases

### 1. Booking Restrictions
**Prevent same-day bookings for certain services:**
```yaml
Family: HERA.UNIV.CONFIG.BOOKING.AVAILABILITY
Conditions:
  - service_category = "premium"
  - lead_time_hours < 24
Actions:
  - block_booking: "Minimum 24-hour notice required"
```

### 2. Dynamic Pricing
**Peak hour pricing for restaurants:**
```yaml
Family: HERA.UNIV.CONFIG.PRICING.SURCHARGE
Conditions:
  - hour_of_day >= 18 AND hour_of_day <= 21
  - day_of_week IN (5,6) # Friday, Saturday
Actions:
  - apply_surcharge: 15%
  - add_reason: "Peak dining hours"
```

### 3. Customer Notifications
**Appointment reminders:**
```yaml
Family: HERA.UNIV.CONFIG.NOTIFICATION.SMS
Conditions:
  - appointment_time - current_time = 24 hours
  - customer_preferences.sms_enabled = true
Actions:
  - send_sms: "appointment_reminder_template"
  - log_notification: "24h reminder sent"
```

## 🔧 Rule Syntax Reference

### Operators
- **Comparison**: `eq`, `ne`, `gt`, `lt`, `gte`, `lte`
- **Membership**: `in`, `not_in`, `contains`
- **Pattern**: `starts_with`, `ends_with`, `matches`
- **Null checks**: `is_null`, `is_not_null`

### Context Variables
```javascript
// Always available
organization_id
current_time
current_date

// Transaction context
transaction_type
transaction_amount
customer_id
source_entity
target_entity

// Temporal context
hour_of_day      // 0-23
day_of_week      // 1-7 (Mon-Sun)
day_of_month     // 1-31
month_of_year    // 1-12
is_weekend       // true/false
is_holiday       // true/false

// Business context
business_type
branch_id
user_role
customer_segments
```

### Action Types
- **Pricing**: `apply_discount`, `apply_surcharge`, `override_price`
- **Validation**: `block_action`, `require_approval`, `add_warning`
- **Workflow**: `trigger_workflow`, `assign_to`, `escalate`
- **Data**: `set_field`, `calculate_value`, `transform_data`
- **Notification**: `send_email`, `send_sms`, `push_notification`

## 🎯 Best Practices

### DO ✅
- Start with simple rules and test thoroughly
- Use descriptive names and add documentation
- Group related rules using families
- Set appropriate priorities (lower number = higher priority)
- Monitor rule performance and usage

### DON'T ❌
- Create overly complex conditions in a single rule
- Use conflicting priorities for similar rules
- Forget to test edge cases
- Leave draft rules active
- Ignore execution logs and analytics

## 🔍 Debugging Tips

### Enable Debug Mode
```typescript
// In your API calls
const result = await universalConfigService.resolve({
  family: 'YOUR_RULE_FAMILY',
  context: yourContext,
  debug: true  // Enables detailed logging
})
```

### Check Execution Logs
- View in UCR dashboard under "Execution History"
- Filter by rule, date range, or status
- Export logs for detailed analysis

### Common Issues
1. **Rule not triggering**: Check all conditions match exactly
2. **Wrong priority**: Lower numbers execute first
3. **Conflicting rules**: Use the conflict checker tool
4. **Performance issues**: Limit active rules per family

## 📚 Next Steps

1. **Explore Templates**: Use industry templates as starting points
2. **Advanced Features**: Try A/B testing and ML suggestions
3. **Integration**: Connect UCR with your workflows
4. **Analytics**: Monitor rule impact on business metrics

For detailed documentation, see:
- [Full UCR Documentation](./UCR-DOCUMENTATION.md)
- [API Reference](./UCR-API.md)
- [Industry Examples](./UCR-INDUSTRY-EXAMPLES.md)